import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Video, ResizeMode } from 'expo-av';

interface VideoBackgroundProps {
  source: any;
  style?: object;
}

export const VideoBackground: React.FC<VideoBackgroundProps> = ({ source, style }) => {
  return (
    <View style={[styles.container, style]}>
      <Video
        source={source}
        rate={1.0}
        volume={0}
        isMuted={true}
        resizeMode={ResizeMode.COVER}
        shouldPlay={true}
        isLooping={true}
        style={styles.video}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    backgroundColor: '#0a0a0f',
  },
  video: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
});
