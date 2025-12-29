import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  FeedScreen,
  MyPlansScreen,
  CreateEventScreen,
  FriendsScreen,
  ProfileScreen,
} from '../screens';

const Tab = createBottomTabNavigator();

interface TabIconProps {
  icon: string;
  focused: boolean;
}

const TabIcon: React.FC<TabIconProps> = ({ icon, focused }) => (
  <View style={styles.tabIconContainer}>
    <Text style={[styles.tabIcon, focused && styles.tabIconFocused]}>{icon}</Text>
  </View>
);

export const TabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="Feed"
        component={FeedScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.tabIconContainer}>
              <Image
                source={require('../../assets/home-icon.png')}
                style={[styles.homeIcon, focused && styles.homeIconFocused]}
                resizeMode="contain"
              />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="MyPlans"
        component={MyPlansScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.tabIconContainer}>
              <Image
                source={require('../../assets/calendar-icon.png')}
                style={[styles.iconImage, focused && styles.iconImageFocused]}
                resizeMode="contain"
              />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Create"
        component={CreateEventScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.createButtonContainer}>
              <Image
                source={require('../../assets/create-icon.png')}
                style={[styles.createButtonImage, focused && styles.createButtonImageFocused]}
                resizeMode="contain"
              />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Friends"
        component={FriendsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.tabIconContainer}>
              <Image
                source={require('../../assets/friends-icon.png')}
                style={[styles.friendsIcon, focused && styles.friendsIconFocused]}
                resizeMode="contain"
              />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.tabIconContainer}>
              <Image
                source={require('../../assets/profile-icon.png')}
                style={[styles.profileIcon, focused && styles.profileIconFocused]}
                resizeMode="contain"
              />
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    backgroundColor: 'rgba(20, 20, 30, 0.9)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    height: 85,
    paddingTop: 10,
    paddingBottom: 25,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 24,
    opacity: 0.4,
  },
  tabIconFocused: {
    opacity: 1,
  },
  homeIcon: {
    width: 28,
    height: 28,
    opacity: 0.4,
  },
  homeIconFocused: {
    opacity: 1,
  },
  iconImage: {
    width: 28,
    height: 28,
    opacity: 0.4,
  },
  iconImageFocused: {
    opacity: 1,
  },
  createButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonImage: {
    width: 40,
    height: 30,
    opacity: 0.4,
  },
  createButtonImageFocused: {
    opacity: 1,
  },
  profileIcon: {
    width: 32,
    height: 50,
    opacity: 0.4,
  },
  profileIconFocused: {
    opacity: 1,
  },
  friendsIcon: {
    width: 32,
    height: 50,
    opacity: 0.4,
  },
  friendsIconFocused: {
    opacity: 1,
  },
});
