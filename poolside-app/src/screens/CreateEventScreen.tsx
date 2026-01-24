import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  Modal,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  ImageBackground,
  ScrollView,
  Switch,
  InputAccessoryView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProfileBackground, CurvedPickerWheel, VideoBackground } from '../components';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { eventsService } from '../api/services/events';
import { uploadsService } from '../api/services/uploads';
import { TUFTS_LOCATIONS, LOCATION_CATEGORIES, TuftsLocation, LocationCategory, searchLocations } from '../data/tuftsLocations';
import { useEventCreationAnimation } from '../context/EventCreationAnimationContext';
import ColorPicker, { Panel1, HueSlider, Preview } from 'reanimated-color-picker';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import ViewShot from 'react-native-view-shot';
import * as ImagePicker from 'expo-image-picker';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TOTAL_SLIDES = 5;

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

const TIME_OPTIONS = [
  '12:00 AM', '12:30 AM', '1:00 AM', '1:30 AM', '2:00 AM', '2:30 AM',
  '3:00 AM', '3:30 AM', '4:00 AM', '4:30 AM', '5:00 AM', '5:30 AM',
  '6:00 AM', '6:30 AM', '7:00 AM', '7:30 AM', '8:00 AM', '8:30 AM',
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
  '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM',
  '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM',
  '9:00 PM', '9:30 PM', '10:00 PM', '10:30 PM', '11:00 PM', '11:30 PM',
];


const COVER_COLORS = [
  { name: 'white', color: '#f8f8f8', dark: false },
  { name: 'pink', color: '#ffd6e0', dark: false },
  { name: 'mint', color: '#b8f0c0', dark: false },
  { name: 'sky', color: '#b8e4f0', dark: false },
  { name: 'lavender', color: '#d4d4f7', dark: false },
  { name: 'peach', color: '#f5d5c0', dark: false },
  { name: 'cream', color: '#f7f5c0', dark: false },
];

const FONT_OPTIONS = [
  { name: 'Classic', fontFamily: 'Montserrat_600SemiBold' },
  { name: 'Elegant', fontFamily: 'PlayfairDisplay_700Bold' },
  { name: 'Script', fontFamily: 'DancingScript_700Bold' },
  { name: 'Retro', fontFamily: 'SpaceMono_700Bold' },
  { name: 'Chill', fontFamily: 'Pacifico_400Regular' },
  { name: 'Impact', fontFamily: 'Oswald_600SemiBold' },
  { name: 'Fun', fontFamily: 'Lobster_400Regular' },
];

// Helper function to determine if a hex color is dark
const isColorDark = (hex: string): boolean => {
  const color = hex.replace('#', '');
  const r = parseInt(color.substr(0, 2), 16);
  const g = parseInt(color.substr(2, 2), 16);
  const b = parseInt(color.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.5;
};

export const CreateEventScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { triggerAnimation } = useEventCreationAnimation();

  // Splash state
  const [showSplash, setShowSplash] = useState(true);

  // Reset splash when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      setShowSplash(true);
    }, [])
  );

  // Slide state
  const [currentSlide, setCurrentSlide] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Form state - Slide 1: Title
  const [title, setTitle] = useState('');

  // Form state - Slide 2: Time
  const [isNow, setIsNow] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(0); // January
  const [selectedDay, setSelectedDay] = useState(7);
  const [selectedTime, setSelectedTime] = useState('8:00 PM');

  // Form state - Slide 3: Location
  const [location, setLocation] = useState('');
  const [selectedVenue, setSelectedVenue] = useState<TuftsLocation | null>(null);
  const [locationDetails, setLocationDetails] = useState('');
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  const [selectedLocationCategory, setSelectedLocationCategory] = useState<'all' | LocationCategory>('all');
  const [showLocationSearchModal, setShowLocationSearchModal] = useState(false);
  const [showDetailsInModal, setShowDetailsInModal] = useState(false);
  const [customLocation, setCustomLocation] = useState('');

  // Form state - Slide 4: Cover
  const [coverText, setCoverText] = useState('');
  const [coverTextEdited, setCoverTextEdited] = useState(false); // Track if user manually edited cover text
  const [hasOpenedTextEditor, setHasOpenedTextEditor] = useState(false); // Track if user has seen the text editor
  const [coverColor, setCoverColor] = useState('#f8f8f8');
  const [coverColorDark, setCoverColorDark] = useState(false);
  const [coverFont, setCoverFont] = useState('Classic');
  const [coverFontFamily, setCoverFontFamily] = useState('Montserrat_600SemiBold');
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [tempPickerColor, setTempPickerColor] = useState('#f8f8f8');
  const [showTextEditor, setShowTextEditor] = useState(false);
  const [editingText, setEditingText] = useState('');

  // Form state - Slide 5: Final touches
  const [spots, setSpots] = useState('');
  const [description, setDescription] = useState('');
  const [enableWaitlist, setEnableWaitlist] = useState(true);
  const [hideDetailsWhenFull, setHideDetailsWhenFull] = useState(false);
  const [spotsFocused, setSpotsFocused] = useState(false);
  const [descFocused, setDescFocused] = useState(false);
  const spotsBorderAnim = useRef(new Animated.Value(0)).current;
  const descBorderAnim = useRef(new Animated.Value(0)).current;
  const spotsInputRef = useRef<TextInput>(null);
  const descInputRef = useRef<TextInput>(null);

  // UI state
  const [isCreating, setIsCreating] = useState(false);
  const [titleError, setTitleError] = useState(false);
  const [locationError, setLocationError] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(true);

  // Animation values for toggle and picker
  const toggleAnim = useRef(new Animated.Value(0)).current;
  const pickerOpacityAnim = useRef(new Animated.Value(1)).current;
  const titleShakeAnim = useRef(new Animated.Value(0)).current;
  const locationShakeAnim = useRef(new Animated.Value(0)).current;
  const cursorOpacity = useRef(new Animated.Value(1)).current;
  const titleCursorOpacity = useRef(new Animated.Value(1)).current;
  const nowPillPulse = useRef(new Animated.Value(1)).current;
  const pickerExpandAnim = useRef(new Animated.Value(0)).current;
  const coverCanvasRef = useRef<View>(null);
  const dateButtonRef = useRef<TouchableOpacity>(null);
  const timeButtonRef = useRef<TouchableOpacity>(null);
  const [activePicker, setActivePicker] = useState<'date' | 'time' | null>(null);
  const [buttonMeasurements, setButtonMeasurements] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const locationDetailsExpandAnim = useRef(new Animated.Value(0)).current;
  const [venueCardMeasurements, setVenueCardMeasurements] = useState({ x: 0, y: 0, width: 0, height: 0 });

  // Pulsing animation for the "Starting right now" indicator
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(nowPillPulse, {
          toValue: 1.15,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(nowPillPulse, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [nowPillPulse]);

  // Blinking cursor animation for title preview (when empty)
  useEffect(() => {
    if (currentSlide === 0 && !title.trim()) {
      const blink = Animated.loop(
        Animated.sequence([
          Animated.timing(titleCursorOpacity, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(titleCursorOpacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      blink.start();
      return () => blink.stop();
    } else {
      titleCursorOpacity.setValue(1);
    }
  }, [currentSlide, title, titleCursorOpacity]);

  // Blinking cursor animation for text editor
  useEffect(() => {
    if (showTextEditor && !editingText) {
      const blink = Animated.loop(
        Animated.sequence([
          Animated.timing(cursorOpacity, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(cursorOpacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      blink.start();
      return () => blink.stop();
    } else {
      cursorOpacity.setValue(1);
    }
  }, [showTextEditor, editingText, cursorOpacity]);

  // Blinking cursor for cover canvas (only shows before user has opened text editor)
  useEffect(() => {
    if (currentSlide === 3 && coverText && !showTextEditor && !hasOpenedTextEditor) {
      const interval = setInterval(() => {
        setCursorVisible(v => !v);
      }, 530);
      return () => clearInterval(interval);
    } else {
      setCursorVisible(true);
    }
  }, [currentSlide, coverText, showTextEditor, hasOpenedTextEditor]);

  const handleToggleNow = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
    const newValue = !isNow;
    setIsNow(newValue);

    // Animate toggle knob
    Animated.spring(toggleAnim, {
      toValue: newValue ? 1 : 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();

    // Animate picker opacity
    Animated.timing(pickerOpacityAnim, {
      toValue: newValue ? 0.3 : 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  // Shake animation for title input validation
  const shakeTitleInput = () => {
    setTitleError(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

    // Quick jolt animation sequence
    Animated.sequence([
      Animated.timing(titleShakeAnim, {
        toValue: -8,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(titleShakeAnim, {
        toValue: 8,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(titleShakeAnim, {
        toValue: -4,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(titleShakeAnim, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Shake animation for location input validation
  const shakeLocationInput = () => {
    setLocationError(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

    // Quick jolt animation sequence
    Animated.sequence([
      Animated.timing(locationShakeAnim, {
        toValue: -8,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(locationShakeAnim, {
        toValue: 8,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(locationShakeAnim, {
        toValue: -4,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(locationShakeAnim, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const goToSlide = (index: number) => {
    // When entering the cover slide (index 3), sync cover text with title if user hasn't manually edited it
    if (index === 3 && !coverTextEdited && title.trim()) {
      setCoverText(title.trim());
      setEditingText(title.trim());
    }

    Animated.spring(slideAnim, {
      toValue: index,
      useNativeDriver: true,
      tension: 50,
      friction: 10,
    }).start();
    setCurrentSlide(index);
  };

  const nextSlide = () => {
    // Validate title on slide 0
    if (currentSlide === 0 && !title.trim()) {
      shakeTitleInput();
      return;
    }

    // Validate location on slide 2 - must have a venue selected OR custom location
    if (currentSlide === 2 && !selectedVenue && !customLocation.trim()) {
      shakeLocationInput();
      return;
    }

    if (currentSlide < TOTAL_SLIDES - 1) {
      goToSlide(currentSlide + 1);
    } else {
      handleCreate();
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      goToSlide(currentSlide - 1);
    } else {
      navigation.goBack();
    }
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setCoverImage(result.assets[0].uri);
    }
  };

  const handleCreate = async () => {
    // Build date time
    let dateTime: Date;
    if (isNow) {
      dateTime = new Date();
    } else {
      const now = new Date();
      dateTime = new Date(now.getFullYear(), selectedMonth, selectedDay);
      const [time, period] = selectedTime.split(' ');
      const [hours, minutes] = time.split(':').map(Number);
      let hour24 = hours;
      if (period === 'PM' && hours !== 12) hour24 += 12;
      if (period === 'AM' && hours === 12) hour24 = 0;
      dateTime.setHours(hour24, minutes, 0, 0);

      if (dateTime.getTime() <= Date.now()) {
        Alert.alert('Invalid Date', 'Please select a date and time in the future.');
        goToSlide(1);
        return;
      }
    }

    // Description defaults to empty if not provided (will show nothing on event card)
    const eventDescription = description.trim() || '';

    setIsCreating(true);

    try {
      // Get the cover image URL - either from uploaded image or captured canvas
      let uploadedImageUrl: string | undefined;

      if (coverImage) {
        // User uploaded an image - upload it
        try {
          const uploadResult = await uploadsService.uploadImage(coverImage);
          uploadedImageUrl = uploadResult.url;
        } catch (uploadError) {
          console.error('Failed to upload image:', uploadError);
        }
      } else if (coverCanvasRef.current) {
        // No uploaded image - capture the canvas (solid color + text)
        try {
          const capturedUri = await ViewShot.captureRef(coverCanvasRef, {
            format: 'jpg',
            quality: 0.9,
          });
          const uploadResult = await uploadsService.uploadImage(capturedUri);
          uploadedImageUrl = uploadResult.url;
        } catch (captureError) {
          console.error('Failed to capture/upload canvas:', captureError);
        }
      }

      // Combine venue name and details for final location, or use custom location
      let finalLocation: string;
      if (selectedVenue) {
        finalLocation = locationDetails.trim()
          ? `${selectedVenue.name} · ${locationDetails.trim()}`
          : selectedVenue.name;
      } else {
        finalLocation = customLocation.trim();
      }

      const eventData = {
        title: title.trim(),
        description: eventDescription,
        locationName: finalLocation,
        dateTime: dateTime.toISOString(),
        eventImage: uploadedImageUrl,
      };

      await eventsService.createEvent(eventData);

      // Reset form
      setTitle('');
      setIsNow(false);
      setSelectedMonth(0);
      setSelectedDay(7);
      setSelectedTime('8:00 PM');
      setLocation('');
      setSelectedVenue(null);
      setLocationDetails('');
      setLocationSearchQuery('');
      setSelectedLocationCategory('all');
      setShowLocationDetails(false);
      setShowLocationSearchModal(false);
      setShowDetailsInModal(false);
      setCustomLocation('');
      setCoverText('');
      setCoverTextEdited(false);
      setHasOpenedTextEditor(false);
      setCoverColor('#f8f8f8');
      setCoverColorDark(false);
      setCoverFont('Classic');
      setCoverFontFamily('Montserrat_600SemiBold');
      setCoverImage(null);
      setSpots('');
      setDescription('');
      setCurrentSlide(0);
      slideAnim.setValue(0); // Reset the animation value too

      navigation.navigate('Feed' as never);
    } catch (error: any) {
      console.error('Failed to create event:', error);
      const errorMessage = error.response?.data?.message;
      const displayMessage = Array.isArray(errorMessage)
        ? errorMessage.join('\n')
        : errorMessage || 'Failed to create event. Please try again.';
      Alert.alert('Error', displayMessage);
    } finally {
      setIsCreating(false);
    }
  };

  const getTimeDisplayText = () => {
    if (isNow) return 'Starting right now ⚡';
    return `${MONTHS[selectedMonth]} ${selectedDay} at ${selectedTime}`;
  };

  // Animated picker open/close functions - true morph from button
  const openPickerWithAnimation = (type: 'date' | 'time') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);

    const buttonRef = type === 'date' ? dateButtonRef : timeButtonRef;

    // Measure button position
    buttonRef.current?.measureInWindow((x, y, width, height) => {
      setButtonMeasurements({ x, y, width, height });
      setActivePicker(type);

      // Reset and animate
      pickerExpandAnim.setValue(0);
      Animated.spring(pickerExpandAnim, {
        toValue: 1,
        useNativeDriver: false, // Need false for layout animations
        tension: 50,
        friction: 12,
      }).start();
    });
  };

  const closePickerWithAnimation = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    Animated.timing(pickerExpandAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: false,
    }).start(() => {
      setActivePicker(null);
    });
  };

  const renderProgressDots = () => {
    return (
      <View style={styles.progressDotsInline}>
        {Array.from({ length: TOTAL_SLIDES }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.progressDot,
              i === currentSlide && styles.progressDotActive,
              i < currentSlide && styles.progressDotCompleted,
            ]}
          />
        ))}
      </View>
    );
  };

  // Slide 1: Title - New ultra-minimal purple glow design (matching When slide)
  const renderTitleSlide = () => (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.slideContent}>
        {/* Header with step indicator */}
        <View style={styles.titleHeader}>
          <Text style={styles.titleStepText}>Step 1 of 5</Text>
          <Text style={styles.titleMainText}>
            What's your event{'\n'}<Text style={styles.titleAccentText}>called</Text>?
          </Text>
        </View>

        {/* Large Editable Title Display Area */}
        <Animated.View
          style={[
            styles.titleDisplayArea,
            { transform: [{ translateX: titleShakeAnim }] },
          ]}
        >
          <TextInput
            style={[
              styles.titleDirectInput,
              titleError && styles.titleDirectInputError,
            ]}
            value={title}
            onChangeText={(text) => {
              // Remove any newlines - text wraps automatically
              const cleanText = text.replace(/\n/g, '');
              setTitle(cleanText);
              if (titleError) setTitleError(false);
            }}
            placeholder="Your title"
            placeholderTextColor="rgba(255, 255, 255, 0.15)"
            maxLength={50}
            multiline
            textAlign="center"
            autoFocus={false}
            returnKeyType="done"
            blurOnSubmit={true}
            onSubmitEditing={Keyboard.dismiss}
          />
          {/* Blinking cursor overlay when empty */}
          {!title && (
            <Animated.View
              style={[
                styles.titleCursorOverlay,
                { opacity: titleCursorOpacity },
              ]}
              pointerEvents="none"
            />
          )}
        </Animated.View>

        {/* Character count and error */}
        <View style={styles.titleFooter}>
          {titleError && (
            <Text style={styles.titleErrorText}>Please enter a title for your event</Text>
          )}
          <Text style={[styles.titleCharCount, title.length > 40 && styles.titleCharCountWarning]}>
            {title.length}/50
          </Text>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );

  // Slide 2: Time - New ultra-minimal purple glow design
  const renderTimeSlide = () => {
    // Format date for display (e.g., "Jan 7")
    const getShortMonth = (monthIndex: number) => {
      const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return shortMonths[monthIndex];
    };

    const formattedDate = `${getShortMonth(selectedMonth)} ${selectedDay}`;
    const formattedTime = selectedTime;

    return (
      <View style={styles.slideContent}>
        {/* Header with step indicator */}
        <View style={styles.whenHeader}>
          <Text style={styles.whenStepText}>Step 2 of 5</Text>
          <Text style={styles.whenMainText}>
            When is your{'\n'}event <Text style={styles.whenAccentText}>happening</Text>?
          </Text>
        </View>

          {/* Starting right now pill - glowing purple gradient */}
          <TouchableOpacity
            style={[styles.nowPill, isNow && styles.nowPillActive]}
            onPress={handleToggleNow}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={
                isNow
                  ? ['rgba(99, 102, 241, 0.55)', 'rgba(139, 92, 246, 0.5)', 'rgba(168, 85, 247, 0.45)', 'rgba(192, 132, 252, 0.5)']
                  : ['rgba(255, 255, 255, 0.06)', 'rgba(255, 255, 255, 0.04)']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.nowPillGradient}
            >
              <Animated.View
                style={[
                  styles.nowPillIndicator,
                  isNow && styles.nowPillIndicatorActive,
                  { transform: [{ scale: isNow ? nowPillPulse : 1 }] },
                ]}
              />
              <Text style={[styles.nowPillText, isNow && styles.nowPillTextActive]}>
                Starting right now
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Date/Time Display */}
          <Animated.View style={[styles.whenDateTimeDisplay, { opacity: isNow ? 0.3 : 1 }]}>
            <Text style={styles.whenDateText}>{formattedDate}</Text>
            <Text style={styles.whenTimeText}>{formattedTime}</Text>
          </Animated.View>

          {/* Change Date / Change Time buttons */}
          <View style={styles.whenControls}>
            <TouchableOpacity
              ref={dateButtonRef}
              style={[styles.whenControlBtn, activePicker === 'date' && styles.whenControlBtnHidden]}
              onPress={() => !isNow && openPickerWithAnimation('date')}
              disabled={isNow || activePicker !== null}
              activeOpacity={0.7}
            >
              <Text style={[styles.whenControlBtnText, isNow && styles.whenControlBtnTextDisabled]}>
                Change Date
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              ref={timeButtonRef}
              style={[styles.whenControlBtn, styles.whenControlBtnPrimary, activePicker === 'time' && styles.whenControlBtnHidden]}
              onPress={() => !isNow && openPickerWithAnimation('time')}
              disabled={isNow || activePicker !== null}
              activeOpacity={0.7}
            >
              <Text style={[styles.whenControlBtnPrimaryText, isNow && styles.whenControlBtnTextDisabled]}>
                Change Time
              </Text>
            </TouchableOpacity>
          </View>

        {/* Morphing Picker Overlay */}
        {activePicker && (
          <Modal
            visible={true}
            transparent
            animationType="none"
            onRequestClose={closePickerWithAnimation}
          >
            <View style={styles.pickerMorphOverlay}>
              {/* Tap outside to close */}
              <TouchableOpacity
                style={StyleSheet.absoluteFillObject}
                activeOpacity={1}
                onPress={closePickerWithAnimation}
              />
              <Animated.View
                style={[
                  styles.pickerMorphContainer,
                  {
                    // Animate from button position to center
                    top: pickerExpandAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [buttonMeasurements.y, (Dimensions.get('window').height - 400) / 2],
                    }),
                    left: pickerExpandAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [buttonMeasurements.x, 24],
                    }),
                    width: pickerExpandAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [buttonMeasurements.width, Dimensions.get('window').width - 48],
                    }),
                    height: pickerExpandAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [buttonMeasurements.height, 400],
                    }),
                    borderRadius: pickerExpandAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [30, 28],
                    }),
                  },
                ]}
              >
                <BlurView intensity={100} tint="dark" style={styles.pickerMorphBlur}>
                  {/* Content fades in as it expands */}
                  <Animated.View
                    style={{
                      opacity: pickerExpandAnim.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [0, 0, 1],
                      }),
                      flex: 1,
                    }}
                  >
                    <Text style={styles.pickerModalTitle}>
                      {activePicker === 'date' ? 'Select Date' : 'Select Time'}
                    </Text>
                    <View style={styles.pickerModalContent}>
                      {activePicker === 'date' ? (
                        <>
                          <CurvedPickerWheel
                            items={MONTHS}
                            selectedIndex={selectedMonth}
                            onSelect={(index) => {
                              setSelectedMonth(index);
                              if (selectedDay > DAYS_IN_MONTH[index]) {
                                setSelectedDay(DAYS_IN_MONTH[index]);
                              }
                            }}
                            label="MONTH"
                            width={140}
                          />
                          <CurvedPickerWheel
                            items={Array.from({ length: DAYS_IN_MONTH[selectedMonth] }, (_, i) => String(i + 1))}
                            selectedIndex={selectedDay - 1}
                            onSelect={(index) => setSelectedDay(index + 1)}
                            label="DAY"
                            width={80}
                          />
                        </>
                      ) : (
                        <CurvedPickerWheel
                          items={TIME_OPTIONS}
                          selectedIndex={TIME_OPTIONS.indexOf(selectedTime)}
                          onSelect={(index) => setSelectedTime(TIME_OPTIONS[index])}
                          label="TIME"
                          width={160}
                        />
                      )}
                    </View>
                    <TouchableOpacity
                      style={styles.pickerMorphDoneBtn}
                      onPress={closePickerWithAnimation}
                    >
                      <Text style={styles.pickerMorphDoneText}>Done</Text>
                    </TouchableOpacity>
                  </Animated.View>
                </BlurView>
              </Animated.View>
            </View>
          </Modal>
        )}
      </View>
    );
  };

  // Filter locations based on search and category
  const getFilteredLocations = () => {
    let filtered = locationSearchQuery ? searchLocations(locationSearchQuery) : TUFTS_LOCATIONS;
    if (selectedLocationCategory !== 'all') {
      filtered = filtered.filter(loc => loc.category === selectedLocationCategory);
    }
    return filtered;
  };

  // Store refs for each location card to measure position for morph animation
  const locationCardRefs = useRef<{ [key: string]: TouchableOpacity | null }>({});

  // Slide 3: Location - New design matching mockup
  const renderLocationSlide = () => {
    const filteredLocations = getFilteredLocations();
    const { height: SCREEN_HEIGHT } = Dimensions.get('window');

    // Handle selecting a venue - measure card and trigger morph animation
    const handleVenueSelect = (venue: TuftsLocation) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Clear details if selecting a different venue
      const isNewVenue = !selectedVenue || selectedVenue.id !== venue.id;
      if (isNewVenue) {
        setLocationDetails('');
      }

      const cardRef = locationCardRefs.current[venue.id];
      if (cardRef) {
        cardRef.measureInWindow((x, y, width, height) => {
          setVenueCardMeasurements({ x, y, width, height });
          setSelectedVenue(venue);
          setLocation(venue.name);
          setCustomLocation(''); // Clear custom location when venue selected
          setLocationSearchQuery('');
          if (locationError) setLocationError(false);
          setShowDetailsInModal(true);

          // Start morph animation from card to center
          locationDetailsExpandAnim.setValue(0);
          Animated.spring(locationDetailsExpandAnim, {
            toValue: 1,
            useNativeDriver: false,
            tension: 65,
            friction: 12,
          }).start();
        });
      } else {
        // Fallback if ref not found
        setSelectedVenue(venue);
        setLocation(venue.name);
        setCustomLocation('');
        setLocationSearchQuery('');
        if (locationError) setLocationError(false);
        setShowDetailsInModal(true);
        locationDetailsExpandAnim.setValue(1);
      }
    };

    // Confirm selection - morph back to card (stays in modal)
    const handleConfirmVenue = () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      Keyboard.dismiss();

      Animated.timing(locationDetailsExpandAnim, {
        toValue: 0,
        duration: 220,
        useNativeDriver: false,
      }).start(() => {
        setShowDetailsInModal(false);
        // Modal stays open - user presses checkmark to confirm and close
      });
    };

    // Confirm and close modal (checkmark button)
    const handleConfirmAndClose = () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setShowDetailsInModal(false);
      setShowLocationSearchModal(false);
    };

    // Go back to grid to choose different location
    const handleBackToGrid = () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      Keyboard.dismiss();

      Animated.timing(locationDetailsExpandAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: false,
      }).start(() => {
        setShowDetailsInModal(false);
        setSelectedVenue(null);
        setLocationDetails('');
      });
    };

    // Close modal entirely
    const handleCloseModal = () => {
      if (showDetailsInModal) {
        Animated.timing(locationDetailsExpandAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: false,
        }).start(() => {
          setShowDetailsInModal(false);
          setShowLocationSearchModal(false);
        });
      } else {
        setShowLocationSearchModal(false);
      }
    };

    // Calculate popup position/size interpolations for morph effect
    const popupWidth = SCREEN_WIDTH - 40;
    const popupHeight = 340;
    const centerX = 20;
    const centerY = (SCREEN_HEIGHT - popupHeight) / 2 - 40;

    const morphLeft = locationDetailsExpandAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [venueCardMeasurements.x, centerX],
    });
    const morphTop = locationDetailsExpandAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [venueCardMeasurements.y, centerY],
    });
    const morphWidth = locationDetailsExpandAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [venueCardMeasurements.width || 150, popupWidth],
    });
    const morphHeight = locationDetailsExpandAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [venueCardMeasurements.height || 110, popupHeight],
    });
    const morphOpacity = locationDetailsExpandAnim.interpolate({
      inputRange: [0, 0.3, 1],
      outputRange: [0, 0.8, 1],
    });
    const morphScale = locationDetailsExpandAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.95, 1],
    });
    const gridDimOpacity = locationDetailsExpandAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0.25],
    });

    return (
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.slideContent}>
          {/* Header matching other slides */}
          <View style={styles.locationHeader}>
            <Text style={styles.locationStepText}>Step 3 of 5</Text>
            <Text style={styles.locationMainText}>
              Where is it <Text style={styles.locationAccentText}>happening</Text>?
            </Text>
          </View>

          {/* Search bar OR Selected location preview - same position */}
          {!selectedVenue ? (
            <Animated.View style={[{ transform: [{ translateX: locationShakeAnim }] }]}>
              <TouchableOpacity
                style={[styles.locationSearchBarTappable, locationError && styles.locationSearchBarError]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowLocationSearchModal(true);
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="search" size={20} color="rgba(255, 255, 255, 0.4)" />
                <Text style={styles.locationSearchPlaceholder}>Search Tufts locations...</Text>
              </TouchableOpacity>
            </Animated.View>
          ) : (
            <TouchableOpacity
              onPress={() => setShowLocationSearchModal(true)}
              activeOpacity={0.8}
              style={styles.selectedLocationPreviewWrapper}
            >
              <LinearGradient
                colors={['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#ff6b6b']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.selectedLocationPreviewBorder}
              >
                <View style={styles.selectedLocationPreviewInner}>
                  <Text style={styles.selectedLocationPreviewEmoji}>{selectedVenue.emoji}</Text>
                  <View style={styles.selectedLocationPreviewInfo}>
                    <Text style={styles.selectedLocationPreviewName}>{selectedVenue.name}</Text>
                    {locationDetails ? (
                      <Text style={styles.selectedLocationPreviewDetails}>{locationDetails}</Text>
                    ) : null}
                  </View>
                  <Text style={styles.selectedLocationPreviewEdit}>Edit</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* Divider with "or" */}
          <View style={styles.locationDivider}>
            <View style={styles.locationDividerLine} />
            <Text style={styles.locationDividerText}>OR</Text>
            <View style={styles.locationDividerLine} />
          </View>

          {/* Custom location input section */}
          <View style={styles.customLocationSection}>
            <Text style={styles.customLocationLabel}>Enter a custom location</Text>
            <TextInput
              style={[styles.customLocationInput, locationError && !selectedVenue && styles.customLocationInputError]}
              value={customLocation}
              onChangeText={(text) => {
                setCustomLocation(text);
                if (text.trim()) {
                  setSelectedVenue(null);
                  setLocationDetails('');
                }
                if (locationError) setLocationError(false);
              }}
              placeholder="e.g. My dorm room, Off-campus house..."
              placeholderTextColor="rgba(255, 255, 255, 0.3)"
            />
            <Text style={styles.customLocationHelper}>
              Use this for locations not in our directory, like dorm rooms, apartments, or off-campus spots.
            </Text>
          </View>

          {/* Error message */}
          {locationError && (
            <Text style={styles.locationErrorText}>Please select or enter a location</Text>
          )}

          {/* Search Modal */}
          <Modal
            visible={showLocationSearchModal}
            animationType="slide"
            transparent
            onRequestClose={handleCloseModal}
          >
            <KeyboardAvoidingView
              style={styles.locationSearchModal}
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
              <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFillObject} />
              <View style={styles.locationSearchModalContent}>
                {/* Modal header with close button and search input */}
                <View style={styles.locationModalHeader}>
                      <TouchableOpacity
                        style={styles.locationModalCloseBtn}
                        onPress={selectedVenue ? handleConfirmAndClose : handleCloseModal}
                      >
                        <Ionicons
                          name={selectedVenue ? "checkmark" : "close"}
                          size={20}
                          color={selectedVenue ? "#2dd4bf" : "#fff"}
                        />
                      </TouchableOpacity>
                      <View style={styles.locationModalSearchWrapper}>
                        <Ionicons name="search" size={18} color="rgba(255, 255, 255, 0.4)" />
                        <TextInput
                          style={styles.locationModalSearchInput}
                          value={locationSearchQuery}
                          onChangeText={setLocationSearchQuery}
                          placeholder="Search locations..."
                          placeholderTextColor="rgba(255, 255, 255, 0.35)"
                        />
                      </View>
                    </View>

                    {/* Category pills */}
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={styles.locationModalCategoryScroll}
                      contentContainerStyle={styles.locationModalCategoryContent}
                    >
                      <TouchableOpacity
                        style={[
                          styles.locationModalPill,
                          selectedLocationCategory === 'all' && styles.locationModalPillActive,
                        ]}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setSelectedLocationCategory('all');
                        }}
                      >
                        <Text style={[
                          styles.locationModalPillText,
                          selectedLocationCategory === 'all' && styles.locationModalPillTextActive,
                        ]}>All</Text>
                      </TouchableOpacity>
                      {LOCATION_CATEGORIES.map((category) => (
                        <TouchableOpacity
                          key={category.id}
                          style={[
                            styles.locationModalPill,
                            selectedLocationCategory === category.id && styles.locationModalPillActive,
                          ]}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setSelectedLocationCategory(category.id);
                          }}
                        >
                          <Text style={[
                            styles.locationModalPillText,
                            selectedLocationCategory === category.id && styles.locationModalPillTextActive,
                          ]}>{category.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>

                    {/* Locations grid - stays visible but dims when popup shown */}
                    <Animated.View style={{ flex: 1, opacity: showDetailsInModal ? gridDimOpacity : 1 }}>
                      <ScrollView
                        style={styles.locationModalGrid}
                        contentContainerStyle={styles.locationModalGridContent}
                        showsVerticalScrollIndicator={false}
                        scrollEnabled={!showDetailsInModal}
                      >
                        {filteredLocations.map((loc) => {
                          const isSelected = selectedVenue?.id === loc.id;
                          const hasDetails = isSelected && locationDetails;
                          return (
                            <TouchableOpacity
                              key={loc.id}
                              ref={(ref) => { locationCardRefs.current[loc.id] = ref; }}
                              style={[
                                styles.locationModalCard,
                                isSelected && styles.locationModalCardSelected,
                              ]}
                              onPress={() => handleVenueSelect(loc)}
                              activeOpacity={0.7}
                              disabled={showDetailsInModal}
                            >
                              {isSelected && (
                                <View style={styles.locationModalCardCheck}>
                                  <Ionicons name="checkmark" size={12} color="#fff" strokeWidth={3} />
                                </View>
                              )}
                              <Text style={styles.locationModalCardEmoji}>{loc.emoji}</Text>
                              <Text style={styles.locationModalCardName}>{loc.shortName || loc.name}</Text>
                              {hasDetails ? (
                                <Text style={styles.locationModalCardDetails} numberOfLines={1}>{locationDetails}</Text>
                              ) : (
                                <Text style={styles.locationModalCardType}>
                                  {LOCATION_CATEGORIES.find(c => c.id === loc.category)?.name}
                                </Text>
                              )}
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </Animated.View>

                {/* Morph Popup - Animated overlay that expands from card */}
                {showDetailsInModal && selectedVenue && (
                  <Animated.View
                    style={[
                      styles.locationMorphPopup,
                      {
                        position: 'absolute',
                        left: morphLeft,
                        top: morphTop,
                        width: morphWidth,
                        height: morphHeight,
                        opacity: morphOpacity,
                        transform: [{ scale: morphScale }],
                      },
                    ]}
                  >
                    {/* Venue header in popup */}
                    <View style={styles.morphPopupHeader}>
                      <Text style={styles.morphPopupEmoji}>{selectedVenue.emoji}</Text>
                      <View style={styles.morphPopupVenueInfo}>
                        <Text style={styles.morphPopupVenueName}>{selectedVenue.name}</Text>
                        <Text style={styles.morphPopupVenueCategory}>
                          {LOCATION_CATEGORIES.find(c => c.id === selectedVenue.category)?.name}
                        </Text>
                      </View>
                    </View>

                    {/* Details input */}
                    <View style={styles.morphPopupInputSection}>
                      <Text style={styles.morphPopupLabel}>Where exactly? (optional)</Text>
                      <TextInput
                        style={styles.morphPopupInput}
                        value={locationDetails}
                        onChangeText={setLocationDetails}
                        placeholder="Room 302, 3rd floor, near the windows..."
                        placeholderTextColor="rgba(255, 255, 255, 0.35)"
                      />
                      <Text style={styles.morphPopupHint}>
                        Help people find you — add room number, floor, or landmark
                      </Text>
                    </View>

                    {/* Action buttons */}
                    <View style={styles.morphPopupActions}>
                      <TouchableOpacity
                        style={styles.morphPopupChangeBtn}
                        onPress={handleBackToGrid}
                      >
                        <Text style={styles.morphPopupChangeBtnText}>Different location</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.morphPopupDoneBtn}
                        onPress={handleConfirmVenue}
                      >
                        <Text style={styles.morphPopupDoneBtnText}>Done</Text>
                      </TouchableOpacity>
                    </View>
                  </Animated.View>
                )}
              </View>
            </KeyboardAvoidingView>
          </Modal>
        </View>
      </TouchableWithoutFeedback>
    );
  };

  // Handler for color picker completion
  const handleColorPickerComplete = ({ hex }: { hex: string }) => {
    setTempPickerColor(hex);
  };

  const applyCustomColor = () => {
    setCoverColor(tempPickerColor);
    setCoverColorDark(isColorDark(tempPickerColor));
    setCoverImage(null);
    setShowColorPicker(false);
  };

  // Slide 4: Cover Image
  const renderCoverSlide = () => (
    <View style={styles.slideContent}>
      {/* Header matching other slides */}
      <View style={styles.locationHeader}>
        <Text style={styles.locationStepText}>Step 4 of 5</Text>
        <Text style={styles.locationMainText}>
          Design your event{'\n'}<Text style={styles.locationAccentText}>cover</Text>
        </Text>
      </View>

      {/* Large Canvas Preview */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setEditingText(coverText);
          setShowTextEditor(true);
          setHasOpenedTextEditor(true);
        }}
        style={styles.coverCanvasTouchable}
      >
        {/* This View is captured for the event image */}
        <View
          ref={coverCanvasRef}
          style={[styles.coverCanvas, { backgroundColor: coverImage ? 'transparent' : coverColor }]}
          collapsable={false}
        >
          {coverImage && (
            <>
              <Image source={{ uri: coverImage }} style={styles.coverCanvasImage} />
              <View style={styles.coverCanvasOverlay} />
            </>
          )}
          {coverText ? (
            <View style={styles.coverTextContainer}>
              <Text
                style={[
                  styles.coverDisplayText,
                  {
                    color: coverImage || coverColorDark ? 'rgba(255, 255, 255, 0.95)' : 'rgba(0, 0, 0, 0.85)',
                    fontFamily: coverFontFamily,
                  },
                ]}
              >
                {coverText}
              </Text>
            </View>
          ) : (
            <Text style={[styles.coverPlaceholder, { color: coverImage || coverColorDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.25)' }]}>
              Tap to add text...
            </Text>
          )}
        </View>
        {/* Tap to edit hint - bottom left of canvas */}
        <View style={styles.coverEditHint}>
          <Ionicons name="pencil" size={12} color="rgba(255, 255, 255, 0.5)" />
          <Text style={styles.coverEditHintText}>Tap to edit text</Text>
        </View>
        <TouchableOpacity
          style={styles.coverUploadBtn}
          onPress={(e) => {
            e.stopPropagation();
            handlePickImage();
          }}
        >
          <Ionicons name="image-outline" size={18} color="#fff" />
          <Text style={styles.coverUploadBtnText}>Upload image</Text>
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Color Picker */}
      <View style={styles.coverToolbar}>
        <View style={styles.coverColors}>
          {/* Color wheel button - on the left */}
          <TouchableOpacity
            style={[
              styles.coverColorSwatch,
              styles.coverColorWheelBtn,
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
              setTempPickerColor(coverColor);
              setShowColorPicker(true);
            }}
          >
            <LinearGradient
              colors={['#ff0000', '#ff8000', '#ffff00', '#00ff00', '#00ffff', '#0080ff', '#8000ff', '#ff0080']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.rainbowWheel}
            />
          </TouchableOpacity>
          {COVER_COLORS.map((c) => (
            <TouchableOpacity
              key={c.name}
              style={[
                styles.coverColorSwatch,
                { backgroundColor: c.color },
                c.name === 'white' && styles.coverColorSwatchWhite,
                coverColor === c.color && styles.coverColorSwatchSelected,
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
                setCoverColor(c.color);
                setCoverColorDark(c.dark);
                setCoverImage(null);
              }}
            />
          ))}
        </View>
      </View>

      {/* Color Picker Modal */}
      <Modal
        visible={showColorPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowColorPicker(false)}
      >
        <View style={styles.colorPickerOverlay}>
          <View style={styles.colorPickerContainer}>
            <Text style={styles.colorPickerTitle}>Choose a custom color</Text>
            <ColorPicker
              style={styles.colorPicker}
              value={tempPickerColor}
              onChangeJS={handleColorPickerComplete}
            >
              <Preview style={styles.colorPreview} />
              <Panel1 style={styles.colorPanel} />
              <HueSlider style={styles.hueSlider} />
            </ColorPicker>
            <View style={styles.colorPickerButtons}>
              <TouchableOpacity
                style={styles.colorPickerCancelBtn}
                onPress={() => setShowColorPicker(false)}
              >
                <Text style={styles.colorPickerCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.colorPickerApplyBtn}
                onPress={applyCustomColor}
              >
                <Text style={styles.colorPickerApplyText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Text Editor Modal */}
      <Modal
        visible={showTextEditor}
        animationType="slide"
        transparent
        onRequestClose={() => setShowTextEditor(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView
            style={styles.textEditorOverlay}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <BlurView intensity={40} tint="dark" style={styles.textEditorContainer}>
            {/* Header */}
            <View style={styles.textEditorHeader}>
              <TouchableOpacity
                onPress={() => setShowTextEditor(false)}
                style={styles.textEditorCancelBtn}
              >
                <Text style={styles.textEditorCancelText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.textEditorTitle}>Add Text</Text>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setCoverText(editingText);
                  // Mark as edited if user changed it from the auto-filled title
                  if (editingText.trim() !== title.trim()) {
                    setCoverTextEdited(true);
                  }
                  setShowTextEditor(false);
                }}
                style={styles.textEditorDoneBtn}
              >
                <Text style={styles.textEditorDoneText}>Done</Text>
              </TouchableOpacity>
            </View>

            {/* Preview */}
            <View style={[styles.textEditorPreview, { backgroundColor: coverColor }]}>
              {editingText ? (
                <Text
                  style={[
                    styles.textEditorPreviewText,
                    {
                      fontFamily: coverFontFamily,
                      color: coverColorDark ? 'rgba(255, 255, 255, 0.95)' : 'rgba(0, 0, 0, 0.85)',
                    },
                  ]}
                >
                  {editingText}
                </Text>
              ) : (
                <Animated.View
                  style={[
                    styles.blinkingCursor,
                    {
                      opacity: cursorOpacity,
                      backgroundColor: coverColorDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.6)',
                    },
                  ]}
                />
              )}
            </View>

            {/* Text Input */}
            <TextInput
              style={styles.textEditorInput}
              value={editingText}
              onChangeText={(text) => {
                // Limit to 4 lines (max 3 newlines)
                const newlineCount = (text.match(/\n/g) || []).length;
                if (newlineCount <= 3) {
                  setEditingText(text);
                }
              }}
              placeholder="Type your text here..."
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              multiline
              numberOfLines={4}
              autoFocus
              maxLength={100}
            />

            {/* Font Picker */}
            <View style={styles.textEditorFonts}>
              {FONT_OPTIONS.map((f) => (
                <TouchableOpacity
                  key={f.name}
                  style={[
                    styles.textEditorFontPill,
                    coverFont === f.name && styles.textEditorFontPillSelected,
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
                    setCoverFont(f.name);
                    setCoverFontFamily(f.fontFamily);
                  }}
                >
                  <Text
                    style={[
                      styles.textEditorFontPillText,
                      coverFont === f.name && styles.textEditorFontPillTextSelected,
                      { fontFamily: f.fontFamily },
                    ]}
                  >
                    {f.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            </BlurView>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );

  // Slide 5: Final Touches
  const renderFinalSlide = () => (
    <>
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ScrollView style={styles.slideContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.finalHeader}>
          <Text style={styles.finalStepText}>Step {currentSlide + 1} of {TOTAL_SLIDES}</Text>
          <Text style={styles.finalMainText}>
            Any final{'\n'}<Text style={styles.finalAccentText}>details</Text>?
          </Text>
          <Text style={styles.finalSubtitle}>These are optional but helpful</Text>
        </View>

        {/* Guest limit */}
        <View style={styles.finalField}>
          <Text style={styles.finalLabel}>Guest limit</Text>
          <View style={[styles.finalGradientBorder, spotsFocused && styles.finalGradientBorderActive]}>
            <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { opacity: spotsBorderAnim }]}>
              <LinearGradient
                colors={['#f472b6', '#fb923c', '#facc15', '#4ade80', '#38bdf8', '#a78bfa', '#e879f9', '#f472b6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
            </Animated.View>
            <TouchableWithoutFeedback onPress={() => spotsInputRef.current?.focus()}>
              <View style={[styles.finalInputContainer, spotsFocused && styles.finalInputContainerFocused]}>
                <Text style={styles.finalInputIcon}>👥</Text>
                <TextInput
                  ref={spotsInputRef}
                  style={styles.finalInput}
                  value={spots}
                  onChangeText={setSpots}
                  placeholder="Unlimited"
                  placeholderTextColor="rgba(255, 255, 255, 0.35)"
                  keyboardType="number-pad"
                  inputAccessoryViewID="spotsDoneBtn"
                  onFocus={() => {
                    setSpotsFocused(true);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
                    Animated.timing(spotsBorderAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
                  }}
                  onBlur={() => {
                    Animated.timing(spotsBorderAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
                      setSpotsFocused(false);
                    });
                  }}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </View>

        {/* Description */}
        <View style={styles.finalField}>
          <Text style={styles.finalLabel}>Description</Text>
          <View style={[styles.finalGradientBorder, descFocused && styles.finalGradientBorderActive]}>
            <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { opacity: descBorderAnim }]}>
              <LinearGradient
                colors={['#f472b6', '#fb923c', '#facc15', '#4ade80', '#38bdf8', '#a78bfa', '#e879f9', '#f472b6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
            </Animated.View>
            <TouchableWithoutFeedback onPress={() => descInputRef.current?.focus()}>
              <View style={[styles.finalTextareaInner, descFocused && styles.finalTextareaInnerFocused]}>
                <TextInput
                  ref={descInputRef}
                  style={styles.finalTextarea}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="What should people know about this event?"
                  placeholderTextColor="rgba(255, 255, 255, 0.35)"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  returnKeyType="done"
                  blurOnSubmit={true}
                  onFocus={() => {
                    setDescFocused(true);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
                    Animated.timing(descBorderAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
                  }}
                  onBlur={() => {
                    Animated.timing(descBorderAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
                      setDescFocused(false);
                    });
                  }}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </View>

        {/* Enable waitlist toggle */}
        <View style={styles.finalToggleRow}>
          <View style={styles.finalToggleInfo}>
            <Text style={styles.finalToggleLabel}>Enable waitlist</Text>
            <Text style={styles.finalToggleHint}>Let people join a waitlist when full</Text>
          </View>
          <Switch
            value={enableWaitlist}
            onValueChange={setEnableWaitlist}
            trackColor={{ false: 'rgba(255, 255, 255, 0.15)', true: '#34D399' }}
            thumbColor="#fff"
            ios_backgroundColor="rgba(255, 255, 255, 0.15)"
          />
        </View>

        {/* Hide details when full toggle */}
        <View style={styles.finalToggleRow}>
          <View style={styles.finalToggleInfo}>
            <Text style={styles.finalToggleLabel}>Hide details when full</Text>
            <Text style={styles.finalToggleHint}>Only show basics & keep lineup private</Text>
          </View>
          <Switch
            value={hideDetailsWhenFull}
            onValueChange={setHideDetailsWhenFull}
            trackColor={{ false: 'rgba(255, 255, 255, 0.15)', true: '#34D399' }}
            thumbColor="#fff"
            ios_backgroundColor="rgba(255, 255, 255, 0.15)"
          />
        </View>
      </ScrollView>
    </TouchableWithoutFeedback>
    {Platform.OS === 'ios' && (
      <InputAccessoryView nativeID="spotsDoneBtn">
        <View style={styles.keyboardAccessory}>
          <View style={{ flex: 1 }} />
          <TouchableOpacity onPress={Keyboard.dismiss} style={styles.keyboardDoneBtn}>
            <Text style={styles.keyboardDoneBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </InputAccessoryView>
    )}
    </>
  );

  const renderSlide = (index: number) => {
    switch (index) {
      case 0: return renderTitleSlide();
      case 1: return renderTimeSlide();
      case 2: return renderLocationSlide();
      case 3: return renderCoverSlide();
      case 4: return renderFinalSlide();
      default: return null;
    }
  };

  // Render splash screen with video background
  if (showSplash) {
    return (
      <View style={styles.container}>
        <VideoBackground source={require('../assets/videos/PoolsideAnimation.mp4')} />
        <View style={styles.splashContent}>
          {/* Frosted Glass Card */}
          <BlurView intensity={60} tint="light" style={styles.splashCard}>
            {/* Glass highlight effect */}
            <View style={styles.splashCardHighlight} />
            <Text style={styles.splashTitle}>Host Your Event</Text>
            <Text style={styles.splashSubtitle}>Bring people together on the cruise</Text>
            <TouchableOpacity
              style={styles.splashButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setShowSplash(false);
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.splashButtonText}>Let's Create</Text>
            </TouchableOpacity>
          </BlurView>
        </View>
      </View>
    );
  }

  // Render different background based on slide
  const renderBackground = () => {
    if (currentSlide === 0 || currentSlide === 1 || currentSlide === 2) {
      // Title, When, and Location slides use feed background
      return (
        <ImageBackground
          source={require('../assets/images/feed-background.png')}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
        />
      );
    }
    return <ProfileBackground />;
  };

  return (
    <View style={styles.container}>
      {renderBackground()}

      <View style={[styles.screenContent, { paddingTop: insets.top }]}>
          {/* Header with dots */}
            <View style={styles.header}>
              <TouchableOpacity style={styles.backBtn} onPress={prevSlide}>
                <Ionicons name="chevron-back" size={20} color="#fff" />
              </TouchableOpacity>
              {renderProgressDots()}
              <View style={styles.skipBtn} />
            </View>

            {/* Slides */}
            <View style={styles.slidesContainer}>
              {Array.from({ length: TOTAL_SLIDES }).map((_, index) => {
                const inputRange = [index - 1, index, index + 1];
                const translateX = slideAnim.interpolate({
                  inputRange,
                  outputRange: [SCREEN_WIDTH, 0, -SCREEN_WIDTH],
                  extrapolate: 'clamp',
                });
                const opacity = slideAnim.interpolate({
                  inputRange,
                  outputRange: [0, 1, 0],
                  extrapolate: 'clamp',
                });

                return (
                  <Animated.View
                    key={index}
                    style={[
                      styles.slide,
                      {
                        transform: [{ translateX }],
                        opacity,
                      },
                    ]}
                    pointerEvents={currentSlide === index ? 'auto' : 'none'}
                  >
                    {renderSlide(index)}
                  </Animated.View>
                );
              })}
            </View>

            {/* Bottom actions - floating over content */}
            <View style={[styles.bottomActions, { paddingBottom: insets.bottom + 90 }]}>
              <TouchableOpacity
                style={[
                  styles.nextBtn,
                  (currentSlide === 0 || currentSlide === 1) && styles.nextBtnWhen,
                  currentSlide === TOTAL_SLIDES - 1 && styles.nextBtnCreate,
                  isCreating && styles.nextBtnDisabled,
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  nextSlide();
                }}
                disabled={isCreating}
              >
                {isCreating ? (
                  <ActivityIndicator size="small" color="#0a0a12" />
                ) : (
                  <Text style={[styles.nextBtnText, currentSlide === TOTAL_SLIDES - 1 && styles.nextBtnTextCreate]}>
                    {currentSlide === TOTAL_SLIDES - 1 ? 'Create Event 🎉' : 'Next'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
        </View>
      </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Splash screen styles
  splashContent: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 180,
    paddingHorizontal: 28,
  },
  splashCard: {
    width: '100%',
    paddingVertical: 36,
    paddingHorizontal: 28,
    borderRadius: 28,
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 32,
    elevation: 16,
  },
  splashCardHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  splashTitle: {
    fontSize: 32,
    fontFamily: 'Syne_700Bold',
    color: '#1a1a2e',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  splashSubtitle: {
    fontSize: 15,
    fontFamily: 'Outfit_400Regular',
    color: 'rgba(26, 26, 46, 0.65)',
    textAlign: 'center',
    marginBottom: 28,
  },
  splashButton: {
    width: '100%',
    backgroundColor: '#1a1a2e',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1a1a2e',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  splashButtonText: {
    fontSize: 17,
    fontFamily: 'Outfit_600SemiBold',
    color: '#fff',
    letterSpacing: 0.3,
  },
  screenContent: {
    flex: 1,
    position: 'relative',
    zIndex: 1,
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipBtn: {
    width: 36,
  },
  // Progress dots (centered absolutely in header)
  progressDotsInline: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  progressDotActive: {
    backgroundColor: '#a78bfa',
    shadowColor: '#a78bfa',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
  },
  progressDotCompleted: {
    backgroundColor: '#a78bfa',
  },
  // Slides
  slidesContainer: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  slide: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 24,
  },
  slideContent: {
    flex: 1,
  },
  // Slide 1: Title - New ultra-minimal purple glow design
  titleHeader: {
    marginBottom: 48,
  },
  titleStepText: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.4)',
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  titleMainText: {
    fontFamily: 'Syne_700Bold',
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  titleAccentText: {
    color: '#a78bfa',
    textShadowColor: 'rgba(167, 139, 250, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  titleDisplayArea: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 40,
    paddingHorizontal: 8,
    position: 'relative',
    minHeight: 120,
  },
  titleDirectInput: {
    fontFamily: 'Inter_200ExtraLight',
    fontSize: 44,
    fontWeight: '200',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: -1.5,
    lineHeight: 52,
    width: '100%',
    padding: 16,
  },
  titleDirectInputError: {
    color: '#fb7185',
  },
  titleCursorOverlay: {
    position: 'absolute',
    top: 56,
    width: 2,
    height: 48,
    backgroundColor: '#a78bfa',
    borderRadius: 1,
    shadowColor: '#a78bfa',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  titleFooter: {
    paddingBottom: 20,
  },
  titleErrorText: {
    fontSize: 14,
    color: '#fb7185',
    marginBottom: 8,
    textAlign: 'center',
  },
  titleCharCount: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.35)',
    textAlign: 'center',
  },
  titleCharCountWarning: {
    color: '#fb7185',
  },
  // Compact header (slides 2-5)
  slideHeaderCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  slideIconSmall: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: 'rgba(45, 212, 191, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slideIconEmojiSmall: {
    fontSize: 24,
  },
  slideHeaderText: {
    flex: 1,
  },
  slideQuestionSmall: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
    letterSpacing: -0.3,
  },
  slideHintSmall: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.55)',
  },
  // Slide 2: When - New ultra-minimal purple glow design
  whenHeader: {
    marginBottom: 32,
  },
  whenStepText: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.4)',
    marginBottom: 8,
  },
  whenMainText: {
    fontFamily: 'Syne_700Bold',
    fontSize: 32,
    fontWeight: '600',
    color: '#fff',
    lineHeight: 40,
  },
  whenAccentText: {
    color: '#a78bfa',
  },
  nowPill: {
    borderRadius: 16,
    marginBottom: 40,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  nowPillActive: {
    borderColor: 'rgba(167, 139, 250, 0.5)',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
  nowPillGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  nowPillIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  nowPillIndicatorActive: {
    backgroundColor: '#fff',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  nowPillText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  nowPillTextActive: {
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  whenDateTimeDisplay: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  whenDateText: {
    fontSize: 80,
    fontWeight: '200',
    color: '#fff',
    letterSpacing: -3,
    marginBottom: 12,
  },
  whenTimeText: {
    fontFamily: 'SpaceMono_700Bold',
    fontSize: 20,
    letterSpacing: 4,
    color: '#a78bfa',
  },
  whenControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  whenControlBtn: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 30,
    alignItems: 'center',
  },
  whenControlBtnPrimary: {
    // Same style as regular button
  },
  whenControlBtnText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#fff',
  },
  whenControlBtnPrimaryText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#fff',
  },
  whenControlBtnTextDisabled: {
    color: 'rgba(255, 255, 255, 0.3)',
  },
  whenControlBtnHidden: {
    opacity: 0,
  },
  // Picker Morph Animation styles - matches button style for seamless morph
  pickerMorphOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  pickerMorphContainer: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    overflow: 'hidden',
  },
  pickerMorphBlur: {
    flex: 1,
    padding: 24,
    backgroundColor: 'rgba(20, 20, 30, 0.2)',
  },
  pickerModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  pickerModalContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    flex: 1,
  },
  pickerMorphDoneBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 30,
    paddingVertical: 16,
    marginTop: 20,
    alignItems: 'center',
  },
  pickerMorphDoneText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  // Slide 3: Location - New Tufts picker styles
  locationHeader: {
    marginBottom: 24,
  },
  locationStepText: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.4)',
    marginBottom: 8,
  },
  locationMainText: {
    fontFamily: 'Syne_700Bold',
    fontSize: 32,
    fontWeight: '600',
    color: '#fff',
    lineHeight: 40,
  },
  locationAccentText: {
    color: '#a78bfa',
    textShadowColor: 'rgba(167, 139, 250, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  // Selected location preview - Rainbow gradient border
  selectedLocationPreviewWrapper: {
    marginBottom: 24,
    shadowColor: '#ff6b6b',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 5,
  },
  selectedLocationPreviewBorder: {
    borderRadius: 16,
    padding: 2,
  },
  selectedLocationPreviewInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 15, 25, 0.95)',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 14,
  },
  selectedLocationPreviewEmoji: {
    fontSize: 28,
  },
  selectedLocationPreviewInfo: {
    flex: 1,
  },
  selectedLocationPreviewName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  selectedLocationPreviewDetails: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2,
  },
  selectedLocationPreviewEdit: {
    fontSize: 14,
    fontWeight: '500',
    color: '#48dbfb',
  },
  // Tappable search bar - mockup exact
  locationSearchBarTappable: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 16,
  },
  locationSearchBarError: {
    borderColor: '#fb7185',
  },
  locationSearchPlaceholder: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.35)',
  },
  // Divider with "or" - mockup exact
  locationDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginVertical: 24,
  },
  locationDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  locationDividerText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.4)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  // Custom location input section - mockup exact
  customLocationSection: {
    marginTop: 8,
  },
  customLocationLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 12,
  },
  customLocationInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 20,
    fontSize: 16,
    color: '#fff',
  },
  customLocationInputError: {
    borderColor: '#fb7185',
  },
  customLocationHelper: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.4)',
    marginTop: 12,
    lineHeight: 20,
  },
  // Location error text
  locationErrorText: {
    fontSize: 14,
    color: '#fb7185',
    marginTop: 16,
    textAlign: 'center',
  },
  // Search Modal - mockup exact
  locationSearchModal: {
    flex: 1,
    backgroundColor: 'rgba(10, 10, 18, 0.95)',
  },
  locationSearchModalContent: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  locationModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  locationModalCloseBtn: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationModalSearchWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 10,
  },
  locationModalSearchInput: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
  },
  // Category pills in modal - mockup exact
  locationModalCategoryScroll: {
    maxHeight: 44,
    marginBottom: 20,
  },
  locationModalCategoryContent: {
    flexDirection: 'row',
    gap: 10,
    paddingBottom: 8,
  },
  locationModalPill: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 50,
    backgroundColor: 'rgba(30, 30, 35, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  locationModalPillActive: {
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  locationModalPillText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  locationModalPillTextActive: {
    color: '#fff',
  },
  // Location cards grid in modal - mockup exact
  locationModalGrid: {
    flex: 1,
  },
  locationModalGridContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingBottom: 20,
  },
  locationModalCard: {
    width: '47%',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 16,
    position: 'relative',
  },
  locationModalCardSelected: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderColor: 'rgba(139, 92, 246, 0.5)',
  },
  locationModalCardCheck: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 22,
    height: 22,
    backgroundColor: '#8b5cf6',
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationModalCardEmoji: {
    fontSize: 28,
    marginBottom: 10,
  },
  locationModalCardName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  locationModalCardType: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  locationModalCardDetails: {
    fontSize: 11,
    color: '#a78bfa',
    fontStyle: 'italic',
  },
  // Morph Popup styles - the card that expands from grid
  locationMorphPopup: {
    backgroundColor: 'rgba(20, 20, 35, 0.98)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.4)',
    padding: 20,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 10,
  },
  morphPopupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 14,
  },
  morphPopupEmoji: {
    fontSize: 40,
  },
  morphPopupVenueInfo: {
    flex: 1,
  },
  morphPopupVenueName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  morphPopupVenueCategory: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  morphPopupInputSection: {
    marginBottom: 24,
  },
  morphPopupLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 10,
  },
  morphPopupInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.35)',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#fff',
    marginBottom: 10,
  },
  morphPopupHint: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.35)',
    fontStyle: 'italic',
  },
  morphPopupActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 'auto',
  },
  morphPopupChangeBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  morphPopupChangeBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  morphPopupDoneBtn: {
    flex: 1,
    backgroundColor: '#2dd4bf',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  morphPopupDoneBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0a0a12',
  },
  // Location Details View styles (shown after selecting a venue)
  locationDetailsView: {
    flex: 1,
  },
  locationDetailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  locationDetailsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  locationDetailsVenueCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.4)',
    borderRadius: 16,
    padding: 16,
    gap: 14,
    marginBottom: 32,
  },
  locationDetailsEmoji: {
    fontSize: 32,
  },
  locationDetailsVenueInfo: {
    flex: 1,
  },
  locationDetailsVenueName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  locationDetailsVenueCategory: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  locationDetailsLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 12,
  },
  locationDetailsInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.35)',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 18,
    fontSize: 16,
    color: '#fff',
    marginBottom: 24,
  },
  locationDetailsActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 'auto',
  },
  locationDetailsChangeBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  locationDetailsChangeBtnText: {
    fontSize: 15,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  locationDetailsDoneBtn: {
    flex: 1,
    backgroundColor: '#2dd4bf',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  locationDetailsDoneBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0a0a12',
  },
  // Keep old styles for backward compatibility (can be removed later)
  locationSearchBar: {
    position: 'relative',
    marginBottom: 16,
  },
  locationSearchIcon: {
    position: 'absolute',
    left: 18,
    top: 18,
    zIndex: 1,
  },
  locationSearchInput: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 20,
    paddingLeft: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    fontSize: 16,
    color: '#fff',
  },
  categoryPillsScroll: {
    maxHeight: 44,
    marginBottom: 12,
    marginHorizontal: -24,
  },
  categoryPillsContent: {
    gap: 10,
    paddingHorizontal: 24,
    paddingVertical: 4,
  },
  categoryPill: {
    paddingTop: 5,
    paddingBottom: 5,
    paddingHorizontal: 10,
    borderRadius: 50,
    backgroundColor: 'rgba(30, 30, 35, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryPillActive: {
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  categoryPillText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.5)',
    lineHeight: 16,
  },
  categoryPillTextActive: {
    color: '#ffffff',
  },
  locationErrorTextNew: {
    fontSize: 14,
    color: '#fb7185',
    marginBottom: 12,
  },
  locationsGridScroll: {
    flex: 1,
  },
  locationsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingBottom: 140,
  },
  locationCard: {
    width: '47%',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 16,
    gap: 8,
    position: 'relative',
  },
  locationCardSelected: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderColor: 'rgba(139, 92, 246, 0.5)',
  },
  locationCardIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  locationCardName: {
    fontWeight: '600',
    fontSize: 15,
    color: '#fff',
  },
  locationCardNameSelected: {
    color: '#c4b5fd',
  },
  locationCardType: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  locationCardCheck: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#8b5cf6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Selected location summary (shown at top when a location is selected)
  selectedLocationSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.4)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    gap: 12,
  },
  selectedLocationEmoji: {
    fontSize: 24,
  },
  selectedLocationInfo: {
    flex: 1,
  },
  selectedLocationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  selectedLocationDetails: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 2,
  },
  selectedLocationEdit: {
    fontSize: 13,
    color: '#a78bfa',
    fontWeight: '500',
  },
  // Location details morph modal styles
  locationDetailsMorphOverlay: {
    flex: 1,
  },
  locationDetailsMorphContainer: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.4)',
    overflow: 'hidden',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
  },
  locationDetailsMorphBlur: {
    flex: 1,
    padding: 24,
    backgroundColor: 'rgba(20, 20, 30, 0.4)',
  },
  modalVenueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 24,
  },
  modalVenueIcon: {
    width: 56,
    height: 56,
    backgroundColor: 'rgba(139, 92, 246, 0.25)',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalVenueEmoji: {
    fontSize: 28,
  },
  modalVenueInfo: {
    flex: 1,
  },
  modalVenueName: {
    fontWeight: '600',
    fontSize: 20,
    color: '#fff',
    marginBottom: 4,
  },
  modalVenueCategory: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  modalDetailsLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 12,
  },
  modalDetailsInput: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.35)',
    borderRadius: 14,
    fontSize: 16,
    color: '#fff',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 'auto',
  },
  modalChangeBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  modalChangeBtnText: {
    fontSize: 15,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  modalDoneBtn: {
    flex: 1,
    backgroundColor: 'rgba(139, 92, 246, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.6)',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  modalDoneBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  // Slide 4: Cover
  coverCanvasTouchable: {
    flex: 1,
    minHeight: 240,
    maxHeight: 280,
    position: 'relative',
  },
  coverEditHint: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  coverEditHintText: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  coverCanvas: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverCanvasImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  coverCanvasOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  coverEditableText: {
    fontSize: 28,
    textAlign: 'center',
    padding: 30,
    maxWidth: '100%',
    zIndex: 3,
  },
  coverUploadBtn: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 18,
    backgroundColor: 'rgba(102, 126, 234, 0.9)',
    borderRadius: 24,
    zIndex: 10,
  },
  coverUploadBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
  coverToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    padding: 14,
  },
  coverColors: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  coverColorSwatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  coverColorSwatchWhite: {
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  coverColorSwatchSelected: {
    borderColor: '#2dd4bf',
  },
  coverFontToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    padding: 12,
  },
  coverFonts: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  coverFontPill: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(102, 126, 234, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.3)',
    borderRadius: 20,
  },
  coverFontPillSelected: {
    backgroundColor: 'rgba(102, 126, 234, 0.9)',
    borderColor: 'transparent',
  },
  coverFontPillText: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  coverFontPillTextSelected: {
    color: '#fff',
  },
  // Cover display text (static, not TextInput)
  coverTextContainer: {
    zIndex: 3,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverDisplayText: {
    fontSize: 28,
    textAlign: 'center',
    maxWidth: '90%',
  },
  coverEditCursorText: {
    fontSize: 28,
    fontWeight: '300',
  },
  coverPlaceholder: {
    fontSize: 18,
    textAlign: 'center',
    zIndex: 3,
  },
  // Text Editor Modal
  textEditorOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 10, 18, 0.9)',
  },
  textEditorContainer: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
    marginTop: 60,
    overflow: 'hidden',
  },
  textEditorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  textEditorCancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  textEditorCancelText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  textEditorTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  textEditorDoneBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#2dd4bf',
    borderRadius: 16,
  },
  textEditorDoneText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0a0a12',
  },
  textEditorPreview: {
    marginTop: 20,
    borderRadius: 16,
    padding: 24,
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textEditorPreviewText: {
    fontSize: 24,
    textAlign: 'center',
  },
  blinkingCursor: {
    width: 3,
    height: 32,
    borderRadius: 2,
  },
  textEditorInput: {
    marginTop: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 16,
    padding: 16,
    fontSize: 18,
    color: '#fff',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  textEditorFonts: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    flexWrap: 'wrap',
  },
  textEditorFontPill: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(102, 126, 234, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.3)',
    borderRadius: 20,
  },
  textEditorFontPillSelected: {
    backgroundColor: 'rgba(102, 126, 234, 0.9)',
    borderColor: 'transparent',
  },
  textEditorFontPillText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  textEditorFontPillTextSelected: {
    color: '#fff',
  },
  // Slide 5: Final touches
  finalHeader: {
    marginBottom: 28,
  },
  finalStepText: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.4)',
    marginBottom: 8,
  },
  finalMainText: {
    fontFamily: 'Syne_700Bold',
    fontSize: 32,
    fontWeight: '600',
    color: '#fff',
    lineHeight: 40,
    marginBottom: 8,
  },
  finalAccentText: {
    color: '#a78bfa',
  },
  finalSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.45)',
  },
  finalField: {
    marginBottom: 20,
  },
  finalLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.55)',
    marginBottom: 10,
  },
  finalGradientBorder: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  finalGradientBorderActive: {
    shadowColor: '#a78bfa',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  finalInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a0a14',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  finalInputContainerFocused: {
    margin: 2,
    borderWidth: 0,
    borderRadius: 14,
  },
  finalInputIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  finalInput: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
  },
  finalTextareaInner: {
    backgroundColor: '#0a0a14',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 16,
  },
  finalTextareaInnerFocused: {
    margin: 2,
    borderWidth: 0,
    borderRadius: 14,
  },
  finalTextarea: {
    padding: 16,
    fontSize: 15,
    color: '#fff',
    minHeight: 100,
    lineHeight: 22,
  },
  finalToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  finalToggleInfo: {
    flex: 1,
    marginRight: 12,
  },
  finalToggleLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 3,
  },
  finalToggleHint: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  keyboardAccessory: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#1c1c1e',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  keyboardDoneBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(167, 139, 250, 0.2)',
  },
  keyboardDoneBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#a78bfa',
  },
  // Bottom actions - floating over content
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    zIndex: 10,
  },
  nextBtn: {
    backgroundColor: '#2dd4bf',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  nextBtnWhen: {
    backgroundColor: '#fff',
  },
  nextBtnCreate: {
    backgroundColor: '#fb7185',
  },
  nextBtnDisabled: {
    opacity: 0.6,
  },
  nextBtnText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#0a0a12',
  },
  nextBtnTextCreate: {
    color: '#fff',
  },
  // Color wheel button
  coverColorWheelBtn: {
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  rainbowWheel: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  // Color picker modal
  colorPickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  colorPickerContainer: {
    backgroundColor: '#1a1a2e',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  colorPickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  colorPicker: {
    gap: 16,
  },
  colorPreview: {
    height: 50,
    borderRadius: 12,
  },
  colorPanel: {
    height: 200,
    borderRadius: 12,
  },
  hueSlider: {
    height: 30,
    borderRadius: 15,
  },
  colorPickerButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  colorPickerCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
  },
  colorPickerCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  colorPickerApplyBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#2dd4bf',
    alignItems: 'center',
  },
  colorPickerApplyText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0a0a12',
  },
});
