import React from 'react';
import { StyleSheet, View, Image } from 'react-native';

interface ProfileBackgroundProps {
  style?: object;
}

export const ProfileBackground: React.FC<ProfileBackgroundProps> = ({ style }) => {
  return (
    <View style={[styles.container, style]}>
      <Image
        source={require('../assets/images/Starynight.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
    backgroundColor: '#0a0a0f',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
});
