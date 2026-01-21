import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  TextInput,
  Linking,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as ExpoLinking from 'expo-linking';
import { authService } from '../api/services/auth';
import { useAuth } from '../context/AuthContext';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
  FadeIn,
  FadeInUp,
  FadeInDown,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Colors matching the app style
const COLORS = {
  coral: '#ff6b4a',
  coralLight: '#ff8a70',
  violet: '#8b5cf6',
  violetLight: '#a78bfa',
  green: '#22c55e',
  greenDark: '#16a34a',
  textPrimary: '#1a1a1a',
  textSecondary: 'rgba(0, 0, 0, 0.5)',
  textTertiary: 'rgba(0, 0, 0, 0.35)',
  glassBg: 'rgba(255, 255, 255, 0.85)',
  glassBorder: 'rgba(255, 255, 255, 0.9)',
  inputBg: 'rgba(255, 255, 255, 0.95)',
};

type AuthStep = 'choice' | 'login' | 'email' | 'checkEmail' | 'verified' | 'welcome';

interface AuthScreenProps {
  onComplete: () => void;
}

// Floating Orb Component
const FloatingOrb = ({
  size,
  color,
  top,
  left,
  right,
  delay = 0,
}: {
  size: number;
  color: string;
  top?: number;
  left?: number;
  right?: number;
  delay?: number;
}) => {
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-20, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
          withTiming(20, { duration: 3000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1.05, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.95, { duration: 3000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          opacity: 0.5,
          top,
          left,
          right,
        },
        animatedStyle,
      ]}
    />
  );
};

// Step Indicator Component
const StepIndicator = ({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) => {
  return (
    <View style={styles.stepIndicator}>
      {Array.from({ length: totalSteps }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.stepDot,
            index < currentStep && styles.stepDotCompleted,
            index === currentStep && styles.stepDotActive,
          ]}
        />
      ))}
    </View>
  );
};

// Confetti Piece Component
const ConfettiPiece = ({
  color,
  delay,
  x,
  isCircle,
}: {
  color: string;
  delay: number;
  x: number;
  isCircle: boolean;
}) => {
  const translateY = useSharedValue(-50);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(delay, withTiming(SCREEN_HEIGHT, { duration: 3000 }));
    rotate.value = withDelay(delay, withTiming(720, { duration: 3000 }));
    opacity.value = withDelay(
      delay,
      withSequence(
        withTiming(1, { duration: 100 }),
        withTiming(1, { duration: 2400 }),
        withTiming(0, { duration: 500 })
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { rotate: `${rotate.value}deg` }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: 10,
          height: 10,
          backgroundColor: color,
          left: x,
          top: 0,
          borderRadius: isCircle ? 5 : 0,
        },
        animatedStyle,
      ]}
    />
  );
};

// Pulsing Ring Component for Welcome screen
const PulsingRing = ({
  size,
  color,
  delay,
}: {
  size: number;
  color: string;
  delay: number;
}) => {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(1);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withRepeat(
        withTiming(1.3, { duration: 2000, easing: Easing.out(Easing.ease) }),
        -1,
        false
      )
    );
    opacity.value = withDelay(
      delay,
      withRepeat(
        withTiming(0, { duration: 2000, easing: Easing.out(Easing.ease) }),
        -1,
        false
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 2,
          borderColor: color,
        },
        animatedStyle,
      ]}
    />
  );
};

export const AuthScreen: React.FC<AuthScreenProps> = ({ onComplete }) => {
  const { setAuthUser } = useAuth();
  const [step, setStep] = useState<AuthStep>('choice');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resendTimer, setResendTimer] = useState(47);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Animations
  const mailIconScale = useSharedValue(1);
  const successIconScale = useSharedValue(0);
  const mascotRotation = useSharedValue(0);

  // Mail icon bounce animation
  useEffect(() => {
    if (step === 'checkEmail') {
      mailIconScale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.95, { duration: 1000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    }
  }, [step]);

  // Success icon pop animation
  useEffect(() => {
    if (step === 'verified') {
      successIconScale.value = withSequence(
        withTiming(1.2, { duration: 300, easing: Easing.out(Easing.ease) }),
        withSpring(1, { damping: 10 })
      );
    }
  }, [step]);

  // Welcome mascot bounce animation
  useEffect(() => {
    if (step === 'welcome') {
      mascotRotation.value = withRepeat(
        withSequence(
          withTiming(-3, { duration: 500, easing: Easing.inOut(Easing.ease) }),
          withTiming(3, { duration: 500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    }
  }, [step]);

  // Resend timer countdown
  useEffect(() => {
    if (step === 'checkEmail' && resendTimer > 0) {
      timerRef.current = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [step]);

  // Deep link handler for magic link verification
  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      const { url } = event;
      console.log('[AuthScreen] Deep link received:', url);

      const parsed = ExpoLinking.parse(url);
      if (parsed.queryParams?.token) {
        const token = parsed.queryParams.token as string;
        await verifyMagicLinkToken(token);
      }
    };

    // Check if app was opened from a deep link
    const checkInitialUrl = async () => {
      const initialUrl = await ExpoLinking.getInitialURL();
      if (initialUrl) {
        console.log('[AuthScreen] Initial URL:', initialUrl);
        handleDeepLink({ url: initialUrl });
      }
    };

    checkInitialUrl();

    // Listen for deep links while app is open
    const subscription = ExpoLinking.addEventListener('url', handleDeepLink);

    return () => {
      subscription.remove();
    };
  }, []);

  // Verify magic link token
  const verifyMagicLinkToken = async (token: string) => {
    setIsVerifying(true);
    try {
      console.log('[AuthScreen] Starting magic link verification...');
      const response = await authService.verifyMagicLink(token);
      console.log('[AuthScreen] Verification successful, tokens stored for:', response.user.email);

      // Update AuthContext with the user from verification response
      // This avoids making another API call which could fail
      console.log('[AuthScreen] Setting user directly from verification response...');
      setAuthUser(response.user as any);
      console.log('[AuthScreen] User set, isAuthenticated should now be true');

      // Extract email prefix for display
      const emailPrefix = response.user.email.split('@')[0];
      setEmail(emailPrefix);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setStep('verified');
    } catch (error: any) {
      console.error('[AuthScreen] Verification failed:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Verification Failed',
        error?.response?.data?.message || error?.message || 'The magic link is invalid or expired. Please try again.',
        [{ text: 'OK', onPress: () => setStep('email') }]
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const mailIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: mailIconScale.value }],
  }));

  const successIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: successIconScale.value }],
  }));

  const mascotStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${mascotRotation.value}deg` }],
  }));

  const handleSendMagicLink = async () => {
    if (!email.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setIsLoading(true);
    try {
      // For testing: use email as-is if it contains @, otherwise append @tufts.edu
      const fullEmail = email.includes('@')
        ? email.trim().toLowerCase()
        : `${email.trim().toLowerCase()}@tufts.edu`;
      await authService.sendMagicLink(fullEmail);
      console.log('[AuthScreen] Magic link sent to:', fullEmail);
      setResendTimer(47);
      setStep('checkEmail');
    } catch (error: any) {
      console.error('[AuthScreen] Failed to send magic link:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Failed to Send',
        error?.response?.data?.message || error?.message || 'Could not send magic link. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenEmailApp = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL('message://');
  };

  const handleContinueFromVerified = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onComplete();
  };

  const handleLetsGo = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onComplete();
  };

  const handleGoBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep('choice');
    setResendTimer(47);
  };

  const handleResendMagicLink = async () => {
    if (resendTimer > 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setIsLoading(true);
    try {
      // For testing: use email as-is if it contains @, otherwise append @tufts.edu
      const fullEmail = email.includes('@')
        ? email.trim().toLowerCase()
        : `${email.trim().toLowerCase()}@tufts.edu`;
      await authService.sendMagicLink(fullEmail);
      console.log('[AuthScreen] Magic link resent to:', fullEmail);
      setResendTimer(47);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      console.error('[AuthScreen] Failed to resend magic link:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Failed to Resend',
        error?.response?.data?.message || error?.message || 'Could not resend magic link. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  // For demo purposes - simulate verification (remove in production)
  const handleSimulateVerify = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Create a mock user for the demo flow
    const fullEmail = email.includes('@') ? email : `${email}@tufts.edu`;
    const mockUser = {
      id: 'demo-user-' + Date.now(),
      email: fullEmail,
      name: email.split('@')[0] || 'Demo User',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Set the mock user in AuthContext so isAuthenticated becomes true
    setAuthUser(mockUser as any);
    setStep('verified');
  };

  const getStepIndex = () => {
    switch (step) {
      case 'choice':
        return 0;
      case 'login':
        return 1;
      case 'email':
        return 2;
      case 'checkEmail':
        return 3;
      case 'verified':
        return 4;
      case 'welcome':
        return 5;
      default:
        return 0;
    }
  };

  // For testing: display full email if it contains @, otherwise append @tufts.edu
  const fullEmail = email.includes('@') ? email : `${email}@tufts.edu`;

  // Handlers for choice step
  const handleCreateAccount = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStep('email');
  };

  const handleLogin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStep('login');
  };

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setIsLoading(true);
    try {
      // Format email: add @tufts.edu if not already included
      const fullEmail = email.includes('@')
        ? email.trim().toLowerCase()
        : `${email.trim().toLowerCase()}@tufts.edu`;

      const response = await authService.login({ email: fullEmail, password });
      console.log('[AuthScreen] Login successful for:', response.user.email);

      // Set user in AuthContext
      setAuthUser(response.user as any);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Go straight to the main app
      onComplete();
    } catch (error: any) {
      console.error('[AuthScreen] Login failed:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        'Login Failed',
        error?.response?.data?.message || error?.message || 'Invalid email or password. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // For now, redirect to the magic link flow (email step)
    setStep('email');
  };

  const renderChoiceStep = () => (
    <View style={styles.content}>
      {/* Mascot Section */}
      <View style={styles.choiceMascotSection}>
        <View style={styles.choiceMascotContainer}>
          <Animated.Text
            entering={FadeInUp.delay(100).duration(600)}
            style={styles.choiceMascot}
          >
            🐘
          </Animated.Text>
          <View style={styles.mascotLine} />
        </View>
      </View>

      {/* Title Section */}
      <Animated.Text entering={FadeInUp.delay(200).duration(500)} style={styles.screenTitle}>
        Welcome to{'\n'}<Text style={styles.highlight}>Tufts</Text>
      </Animated.Text>
      <Animated.Text entering={FadeInUp.delay(300).duration(500)} style={styles.screenSubtitle}>
        Join your campus community.{'\n'}Connect with fellow Jumbos!
      </Animated.Text>

      {/* Glass Card with Options */}
      <Animated.View entering={FadeInUp.delay(400).duration(500)} style={styles.glassCard}>
        <Text style={styles.choiceCardLabel}>Get started with your Tufts email</Text>

        <TouchableOpacity style={[styles.btnPrimary, { marginTop: 0 }]} onPress={handleCreateAccount}>
          <LinearGradient
            colors={[COLORS.coral, COLORS.violet]}
            style={styles.btnPrimaryGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.btnPrimaryText}>Create Account</Text>
            <Text style={styles.btnArrow}>→</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnSecondaryOutline} onPress={handleLogin}>
          <Text style={styles.btnSecondaryOutlineIcon}>👋</Text>
          <Text style={styles.btnSecondaryOutlineText}>I already have an account</Text>
        </TouchableOpacity>

        <View style={styles.choiceEmailHint}>
          <Text style={styles.choiceEmailHintText}>🎓 Use your </Text>
          <Text style={styles.choiceEmailHintHighlight}>@tufts.edu</Text>
          <Text style={styles.choiceEmailHintText}> email</Text>
        </View>
      </Animated.View>

      <View style={styles.spacer} />

      {/* Footer */}
      <Text style={styles.footerText}>
        By continuing, you agree to our{'\n'}
        <Text style={styles.footerLink}>Terms</Text> & <Text style={styles.footerLink}>Privacy Policy</Text>
      </Text>
    </View>
  );

  const handleBackToChoice = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep('choice');
  };

  const renderLoginStep = () => (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardAvoid}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity style={styles.backButton} onPress={handleBackToChoice}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        {/* Mascot */}
        <View style={styles.loginMascotSection}>
          <Animated.Text entering={FadeInUp.delay(100).duration(600)} style={styles.loginMascot}>
            👋
          </Animated.Text>
        </View>

        {/* Title */}
        <Animated.Text entering={FadeInUp.delay(200).duration(500)} style={styles.screenTitle}>
          Welcome{'\n'}<Text style={styles.highlight}>back!</Text>
        </Animated.Text>
        <Animated.Text entering={FadeInUp.delay(300).duration(500)} style={styles.screenSubtitle}>
          Sign in to continue to your campus
        </Animated.Text>

        {/* Login Form */}
        <Animated.View entering={FadeInUp.delay(400).duration(500)} style={styles.glassCard}>
          <Text style={styles.inputLabel}>Email</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={[styles.inputField, { paddingRight: 16 }]}
              placeholder="you@tufts.edu"
              placeholderTextColor={COLORS.textTertiary}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
            />
          </View>

          <View style={styles.loginPasswordGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              style={[styles.inputField, { paddingRight: 16 }]}
              placeholder="Enter your password"
              placeholderTextColor={COLORS.textTertiary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <TouchableOpacity
            style={[styles.btnPrimary, (!email.trim() || !password.trim() || isLoading) && styles.btnPrimaryDisabled]}
            onPress={handleSignIn}
            disabled={!email.trim() || !password.trim() || isLoading}
          >
            <LinearGradient
              colors={[COLORS.coral, COLORS.violet]}
              style={styles.btnPrimaryGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {isLoading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <Text style={styles.btnPrimaryText}>Sign In</Text>
                  <Text style={styles.btnArrow}>→</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.forgotPassword} onPress={handleForgotPassword}>
            <Text style={styles.forgotPasswordText}>Forgot password?</Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.spacer} />

        <Text style={styles.footerText}>
          By continuing, you agree to our{'\n'}
          <Text style={styles.footerLink}>Terms</Text> & <Text style={styles.footerLink}>Privacy Policy</Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  const renderEmailStep = () => (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardAvoid}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity style={styles.backButton} onPress={handleBackToChoice}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        <StepIndicator currentStep={0} totalSteps={3} />

        <View style={styles.mascotContainer}>
          <View style={styles.mascotPeek}>
            <Text style={styles.mascotEmoji}>🐘</Text>
          </View>
          <View style={styles.mascotLine} />
        </View>

        <Animated.Text entering={FadeInUp.delay(100).duration(500)} style={styles.screenTitle}>
          Join your{'\n'}<Text style={styles.highlight}>campus</Text>
        </Animated.Text>
        <Animated.Text entering={FadeInUp.delay(200).duration(500)} style={styles.screenSubtitle}>
          Enter your Tufts email to get started.{'\n'}We'll send you a magic link ✨
        </Animated.Text>

        <Animated.View entering={FadeInUp.delay(300).duration(500)} style={styles.glassCard}>
          <Text style={styles.inputLabel}>Your Tufts Email</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.inputField}
              placeholder="first.last"
              placeholderTextColor={COLORS.textTertiary}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
            />
            <Text style={styles.inputSuffix}>@tufts.edu</Text>
          </View>
          <View style={styles.inputHint}>
            <Text style={styles.inputHintText}>🎓 Only .edu emails can join</Text>
          </View>

          <TouchableOpacity
            style={[styles.btnPrimary, (!email.trim() || isLoading) && styles.btnPrimaryDisabled]}
            onPress={handleSendMagicLink}
            disabled={!email.trim() || isLoading}
          >
            <LinearGradient
              colors={[COLORS.coral, COLORS.violet]}
              style={styles.btnPrimaryGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {isLoading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <Text style={styles.btnPrimaryText}>Send Magic Link</Text>
                  <Text style={styles.btnArrow}>→</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.spacer} />

        <Text style={styles.footerText}>
          By continuing, you agree to our{'\n'}
          <Text style={styles.footerLink}>Terms</Text> & <Text style={styles.footerLink}>Privacy Policy</Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  const renderCheckEmailStep = () => (
    <View style={styles.content}>
      <StepIndicator currentStep={1} totalSteps={3} />

      <View style={styles.spacerSmall} />

      <Animated.View style={[styles.emailSentIcon, mailIconStyle]}>
        <LinearGradient
          colors={[COLORS.coral, COLORS.violet]}
          style={styles.emailSentIconGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.emailSentIconText}>✉️</Text>
        </LinearGradient>
      </Animated.View>

      <Animated.Text entering={FadeInUp.delay(100).duration(500)} style={styles.screenTitle}>
        Check your{'\n'}<Text style={styles.highlight}>inbox</Text>
      </Animated.Text>
      <Animated.Text entering={FadeInUp.delay(200).duration(500)} style={styles.screenSubtitle}>
        We sent a magic link to your email.{'\n'}Tap it to verify you're a Jumbo! 🐘
      </Animated.Text>

      <Animated.View entering={FadeInUp.delay(300).duration(500)} style={styles.glassCard}>
        <View style={styles.emailDisplay}>
          <Text style={styles.emailDisplayLabel}>Sent to</Text>
          <Text style={styles.emailDisplayValue}>{fullEmail}</Text>
        </View>

        <TouchableOpacity style={styles.btnSecondary} onPress={handleOpenEmailApp}>
          <Text style={styles.btnSecondaryText}>Open Email App</Text>
          <Text style={styles.btnSecondaryIcon}>📬</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleResendMagicLink}
          disabled={resendTimer > 0 || isLoading}
          style={styles.resendButton}
        >
          <Text style={styles.resendTimer}>
            {isLoading ? (
              <Text style={styles.resendTimerHighlight}>Sending...</Text>
            ) : resendTimer > 0 ? (
              <>Didn't get it? <Text style={styles.resendTimerHighlight}>Resend in 0:{resendTimer.toString().padStart(2, '0')}</Text></>
            ) : (
              <>Didn't get it? <Text style={[styles.resendTimerHighlight, styles.resendTimerTappable]}>Resend now</Text></>
            )}
          </Text>
        </TouchableOpacity>
      </Animated.View>

      <TouchableOpacity style={styles.btnText} onPress={handleGoBack}>
        <Text style={styles.btnTextContent}>← Use a different email</Text>
      </TouchableOpacity>

      {/* Demo button to simulate verification */}
      <TouchableOpacity style={styles.demoButton} onPress={handleSimulateVerify}>
        <Text style={styles.demoButtonText}>Demo: Simulate Verification</Text>
      </TouchableOpacity>

      <View style={styles.spacer} />
    </View>
  );

  const renderVerifiedStep = () => (
    <View style={styles.content}>
      {/* Confetti */}
      <View style={styles.confettiContainer}>
        <ConfettiPiece color={COLORS.coral} delay={0} x={SCREEN_WIDTH * 0.1} isCircle />
        <ConfettiPiece color={COLORS.violet} delay={100} x={SCREEN_WIDTH * 0.2} isCircle={false} />
        <ConfettiPiece color={COLORS.green} delay={200} x={SCREEN_WIDTH * 0.3} isCircle />
        <ConfettiPiece color="#fbbf24" delay={150} x={SCREEN_WIDTH * 0.4} isCircle={false} />
        <ConfettiPiece color={COLORS.coral} delay={250} x={SCREEN_WIDTH * 0.5} isCircle />
        <ConfettiPiece color="#22d3ee" delay={50} x={SCREEN_WIDTH * 0.6} isCircle={false} />
        <ConfettiPiece color={COLORS.violet} delay={300} x={SCREEN_WIDTH * 0.7} isCircle />
        <ConfettiPiece color="#f472b6" delay={120} x={SCREEN_WIDTH * 0.8} isCircle={false} />
        <ConfettiPiece color={COLORS.coral} delay={220} x={SCREEN_WIDTH * 0.9} isCircle />
      </View>

      <StepIndicator currentStep={2} totalSteps={3} />

      <View style={styles.spacerMedium} />

      <Animated.View style={[styles.successIcon, successIconStyle]}>
        <LinearGradient
          colors={[COLORS.green, COLORS.greenDark]}
          style={styles.successIconGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.successIconText}>✓</Text>
        </LinearGradient>
      </Animated.View>

      <Animated.Text entering={FadeInUp.delay(300).duration(500)} style={styles.screenTitle}>
        You're{'\n'}<Text style={styles.highlight}>verified!</Text>
      </Animated.Text>
      <Animated.Text entering={FadeInUp.delay(400).duration(500)} style={styles.screenSubtitle}>
        Welcome to the Tufts community 🎉{'\n'}Your email has been confirmed.
      </Animated.Text>

      <Animated.View entering={FadeInUp.delay(500).duration(500)} style={[styles.glassCard, styles.glassCardCentered]}>
        <Text style={styles.verifiedMascot}>🐘</Text>
        <Text style={styles.verifiedEmail}>
          <Text style={styles.verifiedEmailBold}>{fullEmail}</Text>
          {'\n'}is now verified
        </Text>
      </Animated.View>

      <View style={styles.spacer} />

      <TouchableOpacity style={styles.btnPrimary} onPress={handleContinueFromVerified}>
        <LinearGradient
          colors={[COLORS.coral, COLORS.violet]}
          style={styles.btnPrimaryGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.btnPrimaryText}>Let's go</Text>
          <Text style={styles.btnArrow}>→</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  const renderWelcomeStep = () => (
    <View style={styles.content}>
      <View style={styles.spacerSmall} />

      <View style={styles.welcomeMascotContainer}>
        <PulsingRing size={140} color="rgba(255, 107, 74, 0.3)" delay={0} />
        <PulsingRing size={180} color="rgba(139, 92, 246, 0.2)" delay={300} />
        <PulsingRing size={220} color="rgba(34, 211, 238, 0.15)" delay={600} />
        <Animated.Text style={[styles.welcomeMascot, mascotStyle]}>🐘</Animated.Text>
      </View>

      <Animated.Text entering={FadeInUp.delay(200).duration(500)} style={styles.welcomeTitle}>
        JumboHQ
      </Animated.Text>
      <Animated.Text entering={FadeInUp.delay(300).duration(500)} style={styles.welcomeSubtitle}>
        Your campus. Your community.
      </Animated.Text>

      <View style={styles.spacer} />

      <TouchableOpacity style={styles.btnPrimaryLarge} onPress={handleLetsGo}>
        <LinearGradient
          colors={[COLORS.coral, COLORS.violet]}
          style={styles.btnPrimaryGradientLarge}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.btnPrimaryTextLarge}>Let's Go!</Text>
          <Text style={styles.btnArrowLarge}>🎉</Text>
        </LinearGradient>
      </TouchableOpacity>

      <Text style={styles.signedInText}>
        Signed in as <Text style={styles.signedInEmail}>{fullEmail}</Text>
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Warm gradient background */}
      <LinearGradient
        colors={['#ffe8dc', '#ffd9c8', '#ffcdb8', '#ffc4a8']}
        style={styles.background}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      <SafeAreaView style={styles.safeArea}>
        {step === 'choice' && renderChoiceStep()}
        {step === 'login' && renderLoginStep()}
        {step === 'email' && renderEmailStep()}
        {step === 'checkEmail' && renderCheckEmailStep()}
        {step === 'verified' && renderVerifiedStep()}
        {step === 'welcome' && renderWelcomeStep()}
      </SafeAreaView>

      {/* Verifying overlay */}
      {isVerifying && (
        <View style={styles.verifyingOverlay}>
          <View style={styles.verifyingCard}>
            <ActivityIndicator size="large" color={COLORS.coral} />
            <Text style={styles.verifyingText}>Verifying your email...</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  orbContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  safeArea: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 20,
    paddingBottom: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 20,
  },

  // Step Indicator
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 32,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  stepDotActive: {
    width: 24,
    borderRadius: 4,
    backgroundColor: COLORS.coral,
  },
  stepDotCompleted: {
    backgroundColor: COLORS.coral,
  },

  // Mascot
  mascotContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  mascotPeek: {
    width: 160,
    height: 80,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  mascotEmoji: {
    fontSize: 70,
    marginBottom: -10,
  },
  mascotLine: {
    width: 120,
    height: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 2,
    marginTop: -5,
  },

  // Typography
  screenTitle: {
    fontFamily: 'Syne_700Bold',
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    lineHeight: 38,
    marginBottom: 12,
  },
  highlight: {
    color: COLORS.coral,
  },
  screenSubtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 36,
  },

  // Glass Card
  glassCard: {
    backgroundColor: COLORS.glassBg,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 32,
    elevation: 4,
  },
  glassCardCentered: {
    alignItems: 'center',
    paddingVertical: 32,
  },

  // Input
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    position: 'relative',
  },
  inputField: {
    width: '100%',
    padding: 16,
    paddingRight: 100,
    fontSize: 16,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.inputBg,
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: 16,
  },
  inputSuffix: {
    position: 'absolute',
    right: 20,
    top: 18,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textTertiary,
  },
  inputHint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginLeft: 4,
  },
  inputHintText: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },

  // Choice step styles
  choiceMascotSection: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 32,
  },
  choiceMascotContainer: {
    alignItems: 'center',
  },
  choiceMascot: {
    fontSize: 80,
    marginBottom: -8,
  },
  choiceCardLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  btnSecondaryOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    marginTop: 12,
  },
  btnSecondaryOutlineText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  btnSecondaryOutlineIcon: {
    fontSize: 18,
  },
  choiceEmailHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    padding: 12,
    backgroundColor: 'rgba(255, 107, 74, 0.08)',
    borderRadius: 12,
  },
  choiceEmailHintText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  choiceEmailHintHighlight: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.coral,
  },

  // Back button
  backButton: {
    alignSelf: 'flex-start',
    padding: 8,
    marginBottom: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },

  // Login step styles
  loginMascotSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  loginMascot: {
    fontSize: 60,
  },
  loginPasswordGroup: {
    marginTop: 16,
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: 16,
    padding: 8,
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.coral,
  },

  // Buttons
  btnPrimary: {
    marginTop: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: COLORS.coral,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 8,
  },
  btnPrimaryDisabled: {
    opacity: 0.5,
  },
  btnPrimaryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  btnPrimaryText: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
  },
  btnArrow: {
    fontSize: 18,
    color: 'white',
  },
  btnPrimaryLarge: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: COLORS.coral,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 8,
  },
  btnPrimaryGradientLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 22,
    paddingHorizontal: 32,
  },
  btnPrimaryTextLarge: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
  },
  btnArrowLarge: {
    fontSize: 20,
  },
  btnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  btnSecondaryText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  btnSecondaryIcon: {
    fontSize: 18,
  },
  btnText: {
    padding: 12,
    marginTop: 16,
    alignItems: 'center',
  },
  btnTextContent: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },

  // Email sent step
  emailSentIcon: {
    alignSelf: 'center',
    marginBottom: 24,
  },
  emailSentIconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.coral,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 32,
  },
  emailSentIconText: {
    fontSize: 36,
  },
  emailDisplay: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(255, 107, 74, 0.08)',
    borderRadius: 12,
    marginBottom: 20,
  },
  emailDisplayLabel: {
    fontSize: 12,
    color: COLORS.textTertiary,
    marginBottom: 4,
  },
  emailDisplayValue: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  resendTimer: {
    textAlign: 'center',
    fontSize: 13,
    color: COLORS.textTertiary,
    marginTop: 16,
  },
  resendTimerHighlight: {
    color: COLORS.coral,
    fontWeight: '600',
  },

  // Verified step
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  successIcon: {
    alignSelf: 'center',
    marginBottom: 24,
  },
  successIconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.green,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 40,
  },
  successIconText: {
    fontSize: 48,
    color: 'white',
    fontWeight: '700',
  },
  verifiedMascot: {
    fontSize: 48,
    marginBottom: 12,
  },
  verifiedEmail: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  verifiedEmailBold: {
    fontWeight: '700',
    color: COLORS.textPrimary,
  },

  // Welcome step
  welcomeMascotContainer: {
    width: 220,
    height: 220,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  welcomeMascot: {
    fontSize: 100,
  },
  welcomeTitle: {
    fontFamily: 'Syne_700Bold',
    fontSize: 42,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 17,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 48,
  },
  signedInText: {
    textAlign: 'center',
    fontSize: 12,
    color: COLORS.textTertiary,
    marginTop: 32,
  },
  signedInEmail: {
    fontWeight: '700',
    color: COLORS.textSecondary,
  },

  // Spacers
  spacer: {
    flex: 1,
  },
  spacerSmall: {
    height: 40,
  },
  spacerMedium: {
    height: 60,
  },

  // Footer
  footerText: {
    textAlign: 'center',
    fontSize: 12,
    color: COLORS.textTertiary,
    lineHeight: 18,
  },
  footerLink: {
    color: COLORS.textSecondary,
    textDecorationLine: 'underline',
  },

  // Demo button
  demoButton: {
    marginTop: 20,
    padding: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 12,
    alignItems: 'center',
  },
  demoButtonText: {
    fontSize: 13,
    color: COLORS.violet,
    fontWeight: '600',
  },

  // Resend button
  resendButton: {
    marginTop: 16,
    padding: 8,
  },
  resendTimerTappable: {
    textDecorationLine: 'underline',
  },

  // Verifying overlay
  verifyingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifyingCard: {
    backgroundColor: COLORS.glassBg,
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 32,
  },
  verifyingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
});

export default AuthScreen;
