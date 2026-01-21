import React, { useRef, useEffect, useCallback, useState } from 'react';
import { View, StyleSheet, Image, TouchableWithoutFeedback, Animated, Dimensions } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TAB_BAR_MARGIN = 20;
const TAB_BAR_WIDTH = SCREEN_WIDTH - (TAB_BAR_MARGIN * 2);
const NUM_TABS = 5;
const TAB_WIDTH = TAB_BAR_WIDTH / NUM_TABS;
const ACTIVE_INDICATOR_SIZE = 40;
import {
  FeedScreen,
  MyPlansScreen,
  CreateEventScreen,
  FriendsScreen,
  ProfileScreen,
} from '../screens';
import { useEventCreationAnimation } from '../context/EventCreationAnimationContext';

const Tab = createBottomTabNavigator();

// Animated nav icon component with spring animation
interface AnimatedNavIconProps {
  children: React.ReactNode;
  active: boolean;
  onPress: () => void;
}

const AnimatedNavIcon: React.FC<AnimatedNavIconProps> = ({ children, active, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(active ? 1.12 : 1)).current;
  const translateYAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate to active/inactive state with spring
    Animated.spring(scaleAnim, {
      toValue: active ? 1.12 : 1,
      stiffness: 300,
      damping: 18,
      mass: 1,
      useNativeDriver: true,
    }).start();
  }, [active, scaleAnim]);

  const handlePressIn = () => {
    // Scale up and move up on press
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: active ? 1.22 : 1.1,
        stiffness: 400,
        damping: 15,
        mass: 1,
        useNativeDriver: true,
      }),
      Animated.spring(translateYAnim, {
        toValue: -2,
        stiffness: 400,
        damping: 15,
        mass: 1,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    // Return to normal state
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: active ? 1.12 : 1,
        stiffness: 300,
        damping: 18,
        mass: 1,
        useNativeDriver: true,
      }),
      Animated.spring(translateYAnim, {
        toValue: 0,
        stiffness: 300,
        damping: 18,
        mass: 1,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <TouchableWithoutFeedback
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          styles.tabIconContainer,
          {
            transform: [
              { scale: scaleAnim },
              { translateY: translateYAnim },
            ],
          },
        ]}
      >
        {children}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

// Custom bottom tab bar component with frosted glass effect
const CustomTabBar = ({ state, descriptors, navigation }: any) => {
  const { setTargetPosition, animationState } = useEventCreationAnimation();
  const feedTabRef = useRef<View>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Animated position for the white circle indicator
  const indicatorPosition = useRef(new Animated.Value(state.index * TAB_WIDTH)).current;

  // Animate indicator when active tab changes
  useEffect(() => {
    Animated.spring(indicatorPosition, {
      toValue: state.index * TAB_WIDTH,
      stiffness: 180,
      damping: 20,
      mass: 1,
      useNativeDriver: true,
    }).start();
  }, [state.index, indicatorPosition]);

  // Measure feed tab position on mount
  const measureFeedTab = useCallback(() => {
    if (feedTabRef.current) {
      feedTabRef.current.measureInWindow((x, y, width, height) => {
        if (x !== undefined && y !== undefined) {
          setTargetPosition({ x, y, width, height });
        }
      });
    }
  }, [setTargetPosition]);

  useEffect(() => {
    // Delay measurement to ensure layout is complete
    const timer = setTimeout(measureFeedTab, 500);
    return () => clearTimeout(timer);
  }, [measureFeedTab]);

  // Pulse animation when receiving event
  useEffect(() => {
    if (animationState.isAnimating) {
      // Wait for card to arrive, then pulse
      const timer = setTimeout(() => {
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.3,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.spring(pulseAnim, {
            toValue: 1,
            stiffness: 300,
            damping: 10,
            useNativeDriver: true,
          }),
        ]).start();
      }, 750);
      return () => clearTimeout(timer);
    }
  }, [animationState.isAnimating, pulseAnim]);

  return (
    <View style={styles.tabBarContainer}>
      <BlurView intensity={60} tint="dark" style={styles.tabBar}>
        {/* Animated white circle indicator */}
        <Animated.View
          style={[
            styles.activeIndicator,
            {
              transform: [
                { translateX: Animated.add(indicatorPosition, (TAB_WIDTH - ACTIVE_INDICATOR_SIZE) / 2) },
              ],
            },
          ]}
        />

        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const isFeedTab = route.name === 'Feed';

          const onPress = () => {
            Haptics.impactAsync(
              route.name === 'Create'
                ? Haptics.ImpactFeedbackStyle.Medium
                : Haptics.ImpactFeedbackStyle.Light
            );

            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const getIcon = () => {
            switch (route.name) {
              case 'Feed':
                return (
                  <Animated.View
                    style={[
                      animationState.isAnimating && {
                        transform: [{ scale: pulseAnim }],
                      },
                    ]}
                  >
                    <Image
                      source={require('../../assets/home-icon.png')}
                      style={[styles.homeIcon, isFocused && styles.iconFocused]}
                      resizeMode="contain"
                    />
                  </Animated.View>
                );
              case 'MyPlans':
                return (
                  <Image
                    source={require('../../assets/calendar-icon.png')}
                    style={[styles.iconImage, isFocused && styles.iconFocused]}
                    resizeMode="contain"
                  />
                );
              case 'Create':
                return (
                  <Image
                    source={require('../../assets/create-icon.png')}
                    style={[styles.createButtonImage, isFocused && styles.iconFocused]}
                    resizeMode="contain"
                  />
                );
              case 'Friends':
                return (
                  <Image
                    source={require('../../assets/friends-icon.png')}
                    style={[styles.friendsIcon, isFocused && styles.iconFocused]}
                    resizeMode="contain"
                  />
                );
              case 'Profile':
                return (
                  <Image
                    source={require('../../assets/profile-icon.png')}
                    style={[styles.profileIcon, isFocused && styles.iconFocused]}
                    resizeMode="contain"
                  />
                );
              default:
                return null;
            }
          };

          return (
            <View
              key={route.key}
              style={styles.tabButton}
              ref={isFeedTab ? feedTabRef : undefined}
              collapsable={false}
              onLayout={isFeedTab ? measureFeedTab : undefined}
            >
              <AnimatedNavIcon active={isFocused} onPress={onPress}>
                {getIcon()}
              </AnimatedNavIcon>
            </View>
          );
        })}
      </BlurView>
    </View>
  );
};

export const TabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        lazy: false,
        animation: 'shift',
        animationDuration: 600,
      }}
      sceneContainerStyle={{ backgroundColor: '#0a0a0f' }}
    >
      <Tab.Screen name="Feed" component={FeedScreen} />
      <Tab.Screen name="MyPlans" component={MyPlansScreen} />
      <Tab.Screen name="Create" component={CreateEventScreen} />
      <Tab.Screen name="Friends" component={FriendsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 30,
    left: TAB_BAR_MARGIN,
    right: TAB_BAR_MARGIN,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(30, 30, 50, 0.7)',
    borderRadius: 28,
    height: 56,
    justifyContent: 'space-around',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 12,
  },
  activeIndicator: {
    position: 'absolute',
    width: ACTIVE_INDICATOR_SIZE,
    height: ACTIVE_INDICATOR_SIZE,
    borderRadius: ACTIVE_INDICATOR_SIZE / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    left: 0,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeIcon: {
    width: 28,
    height: 28,
    opacity: 0.5,
  },
  iconImage: {
    width: 28,
    height: 28,
    opacity: 0.5,
  },
  createButtonImage: {
    width: 38,
    height: 30,
    opacity: 0.5,
  },
  friendsIcon: {
    width: 30,
    height: 46,
    opacity: 0.5,
  },
  profileIcon: {
    width: 30,
    height: 46,
    opacity: 0.5,
  },
  iconFocused: {
    opacity: 1,
  },
});
