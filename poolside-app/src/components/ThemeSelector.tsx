import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { ProfileTheme } from '../api/services/users';

interface ThemeSelectorProps {
  currentTheme: ProfileTheme;
  onThemeChange: (theme: ProfileTheme) => void;
  disabled?: boolean;
}

interface ThemeOption {
  id: ProfileTheme;
  label: string;
  icon: string;
  colors: [string, string];
}

const themes: ThemeOption[] = [
  { id: 'pool_water', label: 'Pool', icon: '🌊', colors: ['#1a4a7a', '#3d8fc0'] },
  { id: 'flames', label: 'Fire', icon: '🔥', colors: ['#8b2500', '#ff4500'] },
  { id: 'marble', label: 'Marble', icon: '💎', colors: ['#5a5a5a', '#d4af37'] },
];

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  currentTheme,
  onThemeChange,
  disabled = false,
}) => {
  const handlePress = (theme: ProfileTheme) => {
    if (disabled || theme === currentTheme) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onThemeChange(theme);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile Theme</Text>
      <View style={styles.toggleContainer}>
        {themes.map((theme) => {
          const isSelected = currentTheme === theme.id;

          return (
            <TouchableOpacity
              key={theme.id}
              onPress={() => handlePress(theme.id)}
              disabled={disabled}
              activeOpacity={0.7}
              style={[
                styles.themeOption,
                isSelected && styles.themeOptionActive,
              ]}
            >
              {isSelected ? (
                <LinearGradient
                  colors={theme.colors}
                  style={styles.gradientBackground}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.themeIcon}>{theme.icon}</Text>
                  <Text style={styles.themeLabel}>{theme.label}</Text>
                </LinearGradient>
              ) : (
                <BlurView intensity={20} tint="dark" style={styles.blurBackground}>
                  <View style={styles.blurContent}>
                    <Text style={styles.themeIcon}>{theme.icon}</Text>
                    <Text style={styles.themeLabelInactive}>{theme.label}</Text>
                  </View>
                </BlurView>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  toggleContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  themeOption: {
    flex: 1,
    height: 80,
    borderRadius: 16,
    overflow: 'hidden',
  },
  themeOptionActive: {
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  gradientBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blurBackground: {
    flex: 1,
    overflow: 'hidden',
  },
  blurContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  themeIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  themeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  themeLabelInactive: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.6)',
  },
});
