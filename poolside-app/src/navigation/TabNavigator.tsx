import React from 'react';
import { View, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import {
  FeedScreen,
  MyPlansScreen,
  CreateEventScreen,
  FriendsScreen,
  ProfileScreen,
} from '../screens';

const Tab = createBottomTabNavigator();

// Custom bottom tab bar component with frosted glass effect
const CustomTabBar = ({ state, descriptors, navigation }: any) => {
  return (
    <BlurView intensity={80} tint="dark" style={styles.tabBar}>
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

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
                <Image
                  source={require('../../assets/home-icon.png')}
                  style={[styles.homeIcon, isFocused && styles.iconFocused]}
                  resizeMode="contain"
                />
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
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            onPress={onPress}
            style={styles.tabButton}
          >
            <View style={styles.tabIconContainer}>{getIcon()}</View>
          </TouchableOpacity>
        );
      })}
    </BlurView>
  );
};

export const TabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        lazy: true,
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
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: 'rgba(20, 20, 30, 0.7)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    height: 85,
    paddingTop: 10,
    paddingBottom: 25,
    justifyContent: 'space-around',
    alignItems: 'center',
    overflow: 'hidden',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeIcon: {
    width: 28,
    height: 28,
    opacity: 0.4,
  },
  iconImage: {
    width: 28,
    height: 28,
    opacity: 0.4,
  },
  createButtonImage: {
    width: 40,
    height: 30,
    opacity: 0.4,
  },
  friendsIcon: {
    width: 32,
    height: 50,
    opacity: 0.4,
  },
  profileIcon: {
    width: 32,
    height: 50,
    opacity: 0.4,
  },
  iconFocused: {
    opacity: 1,
  },
});
