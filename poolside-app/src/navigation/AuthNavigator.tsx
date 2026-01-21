import React, { useState } from 'react';
import { LoginScreen } from '../screens/LoginScreen';
import { RegisterScreen } from '../screens/RegisterScreen';
import { WelcomeScreen } from '../screens/WelcomeScreen';

type AuthScreen = 'welcome' | 'login' | 'register';

export const AuthNavigator: React.FC = () => {
  // Welcome screen is now handled in App.tsx, so start with login
  const [currentScreen, setCurrentScreen] = useState<AuthScreen>('login');

  const handleWelcomeComplete = () => {
    setCurrentScreen('login');
  };

  if (currentScreen === 'welcome') {
    return <WelcomeScreen onComplete={handleWelcomeComplete} />;
  }

  if (currentScreen === 'login') {
    return <LoginScreen onSwitchToRegister={() => setCurrentScreen('register')} />;
  }

  return <RegisterScreen onSwitchToLogin={() => setCurrentScreen('login')} />;
};
