import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TabNavigator } from './TabNavigator';
import { ChatScreen, EditProfileScreen } from '../screens';

export type MainStackParamList = {
  Tabs: undefined;
  Chat: {
    conversation: {
      id: string;
      name: string;
      emoji: string;
      isOnline: boolean;
    };
  };
  EditProfile: undefined;
};

const Stack = createNativeStackNavigator<MainStackParamList>();

export const MainNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0a0a0f' },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Tabs" component={TabNavigator} />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{
          animation: 'slide_from_bottom',
          presentation: 'modal',
        }}
      />
    </Stack.Navigator>
  );
};
