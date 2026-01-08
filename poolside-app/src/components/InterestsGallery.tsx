import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  Easing,
  interpolateColor,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

// Dynamic import for native color extraction (may not be available in Expo Go)
let getColors: any = null;
try {
  getColors = require('react-native-image-colors').getColors;
} catch (e) {
  console.log('react-native-image-colors not available, using fallback colors');
}

// Interest types
interface MovieInterest {
  type: 'movie';
  title: string;
  year: string;
  image: string;
}

interface ArtistInterest {
  type: 'artist';
  name: string;
  image: string;
}

interface SongInterest {
  type: 'song';
  title: string;
  artist: string;
  image: string;
}

interface FoodInterest {
  type: 'food';
  name: string;
  cuisine: string;
  emoji: string;
  image: string;
}

interface SportInterest {
  type: 'sport';
  name: string;
  level: 'casual' | 'competitive';
  emoji: string;
}

export type Interest = MovieInterest | ArtistInterest | SongInterest | FoodInterest | SportInterest;

interface InterestsGalleryProps {
  interests: Interest[];
  isEditMode?: boolean;
  onInterestPress?: (index: number, type: Interest['type']) => void;
}

// Extract dominant color from image
const useImageColors = (imageUrl: string | undefined) => {
  const [colors, setColors] = useState({
    primary: 'rgba(139, 92, 246, 0.3)',
    secondary: 'rgba(34, 211, 238, 0.2)',
  });

  useEffect(() => {
    // Skip if no image or native module not available
    if (!imageUrl || !getColors) return;

    const extractColors = async () => {
      try {
        const result = await getColors(imageUrl, {
          fallback: '#8b5cf6',
          cache: true,
          key: imageUrl,
        });

        if (result.platform === 'ios') {
          setColors({
            primary: result.primary + '40', // Add alpha
            secondary: result.secondary + '30',
          });
        } else if (result.platform === 'android') {
          setColors({
            primary: (result.dominant || '#8b5cf6') + '40',
            secondary: (result.vibrant || '#22d3ee') + '30',
          });
        }
      } catch (error) {
        // Keep default colors on error
      }
    };

    extractColors();
  }, [imageUrl]);

  return colors;
};

// Animated pressable wrapper with scale effect
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// Waveform animation component
const Waveform: React.FC = () => {
  const heights = [0.4, 0.7, 1, 0.6, 0.8];
  const bars = heights.map((h, i) => {
    const scale = useSharedValue(1);

    useEffect(() => {
      scale.value = withDelay(
        i * 100,
        withTiming(0.5, {
          duration: 500,
          easing: Easing.inOut(Easing.ease),
        })
      );
      const interval = setInterval(() => {
        scale.value = withTiming(scale.value === 1 ? 0.5 : 1, {
          duration: 500,
          easing: Easing.inOut(Easing.ease),
        });
      }, 500);
      return () => clearInterval(interval);
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scaleY: scale.value }],
    }));

    return (
      <Animated.View
        key={i}
        style={[
          styles.waveformBar,
          { height: 24 * h },
          animatedStyle,
        ]}
      >
        <LinearGradient
          colors={['#22d3ee', '#8b5cf6']}
          style={styles.waveformGradient}
        />
      </Animated.View>
    );
  });

  return <View style={styles.waveform}>{bars}</View>;
};

// Animated card wrapper with color extraction
interface AnimatedCardProps {
  index: number;
  children: React.ReactNode;
  style?: any;
  imageUrl?: string;
  onPress?: () => void;
  isEditMode?: boolean;
}

const AnimatedCard: React.FC<AnimatedCardProps> = ({
  index,
  children,
  style,
  imageUrl,
  onPress,
  isEditMode,
}) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);
  const scale = useSharedValue(1);
  const colors = useImageColors(imageUrl);
  const colorProgress = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(
      index * 100 + 100,
      withTiming(1, { duration: 500, easing: Easing.out(Easing.ease) })
    );
    translateY.value = withDelay(
      index * 100 + 100,
      withTiming(0, { duration: 500, easing: Easing.out(Easing.ease) })
    );
  }, []);

  // Animate color change
  useEffect(() => {
    colorProgress.value = withTiming(1, { duration: 300 });
  }, [colors.primary]);

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const handlePress = () => {
    if (isEditMode && onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onPress();
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={!isEditMode}
      style={[styles.card, style, animatedStyle]}
    >
      {/* Color tinted background */}
      <View style={[styles.colorTint, { backgroundColor: colors.primary }]} />
      <LinearGradient
        colors={[colors.secondary, 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.colorGradient}
      />
      {children}
      {/* Edit indicator */}
      {isEditMode && (
        <View style={styles.editIndicator}>
          <Text style={styles.editIndicatorText}>Tap to edit</Text>
        </View>
      )}
    </AnimatedPressable>
  );
};

// Movie Card
const MovieCard: React.FC<{
  interest: MovieInterest;
  index: number;
  isEditMode?: boolean;
  onPress?: () => void;
}> = ({ interest, index, isEditMode, onPress }) => (
  <AnimatedCard
    index={index}
    style={styles.cardMovie}
    imageUrl={interest.image}
    onPress={onPress}
    isEditMode={isEditMode}
  >
    <Image source={{ uri: interest.image }} style={styles.movieImage} />
    <View style={styles.cardInfo}>
      <Text style={styles.cardCategory}>Favorite Movie</Text>
      <Text style={styles.cardTitle} numberOfLines={1}>{interest.title}</Text>
      <View style={styles.yearBadge}>
        <Text style={styles.yearText}>{interest.year}</Text>
      </View>
    </View>
  </AnimatedCard>
);

// Artist Card
const ArtistCard: React.FC<{
  interest: ArtistInterest;
  index: number;
  isEditMode?: boolean;
  onPress?: () => void;
}> = ({ interest, index, isEditMode, onPress }) => (
  <AnimatedCard
    index={index}
    style={styles.cardAlbum}
    imageUrl={interest.image}
    onPress={onPress}
    isEditMode={isEditMode}
  >
    <Image source={{ uri: interest.image }} style={styles.albumImage} />
    <View style={styles.cardInfo}>
      <Text style={styles.cardCategory}>Favorite Artist</Text>
      <Text style={styles.cardTitle} numberOfLines={1}>{interest.name}</Text>
    </View>
  </AnimatedCard>
);

// Song Card
const SongCard: React.FC<{
  interest: SongInterest;
  index: number;
  isEditMode?: boolean;
  onPress?: () => void;
}> = ({ interest, index, isEditMode, onPress }) => (
  <AnimatedCard
    index={index}
    style={styles.cardSong}
    imageUrl={interest.image}
    onPress={onPress}
    isEditMode={isEditMode}
  >
    <Image source={{ uri: interest.image }} style={styles.songImage} />
    <View style={styles.songInfo}>
      <Text style={styles.cardCategory}>Favorite Song</Text>
      <Text style={styles.cardTitle} numberOfLines={1}>{interest.title}</Text>
      <Text style={styles.cardSubtitle} numberOfLines={1}>{interest.artist}</Text>
    </View>
    <Waveform />
  </AnimatedCard>
);

// Food Card
const FoodCard: React.FC<{
  interest: FoodInterest;
  index: number;
  isEditMode?: boolean;
  onPress?: () => void;
}> = ({ interest, index, isEditMode, onPress }) => (
  <AnimatedCard
    index={index}
    style={styles.cardFood}
    imageUrl={interest.image}
    onPress={onPress}
    isEditMode={isEditMode}
  >
    <View style={styles.foodEmoji}>
      <Text style={styles.foodEmojiText}>{interest.emoji}</Text>
    </View>
    <Image source={{ uri: interest.image }} style={styles.foodImage} />
    <View style={styles.cardInfo}>
      <Text style={styles.cardCategory}>Favorite Food</Text>
      <Text style={styles.cardTitle} numberOfLines={1}>{interest.name}</Text>
      <View style={styles.cuisineTag}>
        <Text style={styles.cuisineText}>{interest.cuisine}</Text>
      </View>
    </View>
  </AnimatedCard>
);

// Sport Card
const SportCard: React.FC<{
  interest: SportInterest;
  index: number;
  isEditMode?: boolean;
  onPress?: () => void;
}> = ({ interest, index, isEditMode, onPress }) => (
  <AnimatedCard
    index={index}
    style={styles.cardSport}
    onPress={onPress}
    isEditMode={isEditMode}
  >
    <View style={styles.sportIcon}>
      <Text style={styles.sportEmojiText}>{interest.emoji}</Text>
    </View>
    <View style={styles.sportInfo}>
      <Text style={styles.cardCategory}>Sport</Text>
      <Text style={styles.cardTitle}>{interest.name}</Text>
    </View>
    <LinearGradient
      colors={['#22d3ee', '#8b5cf6']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.levelBadge}
    >
      <Text style={styles.levelText}>{interest.level.toUpperCase()}</Text>
    </LinearGradient>
  </AnimatedCard>
);

export const InterestsGallery: React.FC<InterestsGalleryProps> = ({
  interests,
  isEditMode = false,
  onInterestPress,
}) => {
  const handlePress = useCallback((index: number, type: Interest['type']) => {
    if (onInterestPress) {
      onInterestPress(index, type);
    }
  }, [onInterestPress]);

  const renderInterest = (interest: Interest, index: number) => {
    const onPress = () => handlePress(index, interest.type);

    switch (interest.type) {
      case 'movie':
        return (
          <MovieCard
            key={`movie-${index}`}
            interest={interest}
            index={index}
            isEditMode={isEditMode}
            onPress={onPress}
          />
        );
      case 'artist':
        return (
          <ArtistCard
            key={`artist-${index}`}
            interest={interest}
            index={index}
            isEditMode={isEditMode}
            onPress={onPress}
          />
        );
      case 'song':
        return (
          <SongCard
            key={`song-${index}`}
            interest={interest}
            index={index}
            isEditMode={isEditMode}
            onPress={onPress}
          />
        );
      case 'food':
        return (
          <FoodCard
            key={`food-${index}`}
            interest={interest}
            index={index}
            isEditMode={isEditMode}
            onPress={onPress}
          />
        );
      case 'sport':
        return (
          <SportCard
            key={`sport-${index}`}
            interest={interest}
            index={index}
            isEditMode={isEditMode}
            onPress={onPress}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Favorites</Text>
        {isEditMode && (
          <View style={styles.editBadge}>
            <Text style={styles.editBadgeText}>Editing</Text>
          </View>
        )}
        <LinearGradient
          colors={['rgba(255,255,255,0.3)', 'rgba(139,92,246,0.3)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.headerLine}
        />
      </View>

      {/* Grid */}
      <View style={styles.grid}>
        {interests.map((interest, index) => renderInterest(interest, index))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 28,
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  title: {
    fontFamily: 'System',
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -0.5,
  },
  editBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
    borderRadius: 12,
  },
  editBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#a78bfa',
  },
  headerLine: {
    flex: 1,
    height: 1,
  },
  // Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 16,
  },
  // Base Card
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
  },
  colorTint: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  colorGradient: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  cardInfo: {
    padding: 12,
    zIndex: 2,
  },
  cardCategory: {
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: 'rgba(255, 255, 255, 0.4)',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  editIndicator: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(139, 92, 246, 0.6)',
    borderRadius: 8,
    zIndex: 10,
  },
  editIndicatorText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  // Movie Card
  cardMovie: {
    width: '48%',
  },
  movieImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
    zIndex: 2,
  },
  yearBadge: {
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
    borderRadius: 6,
  },
  yearText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#a78bfa',
  },
  // Album Card
  cardAlbum: {
    width: '48%',
  },
  albumImage: {
    width: '100%',
    aspectRatio: 1,
    resizeMode: 'cover',
    zIndex: 2,
  },
  // Song Card
  cardSong: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
  },
  songImage: {
    width: 56,
    height: 56,
    borderRadius: 10,
    resizeMode: 'cover',
    zIndex: 2,
  },
  songInfo: {
    flex: 1,
    zIndex: 2,
  },
  // Waveform
  waveform: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    height: 24,
    zIndex: 2,
  },
  waveformBar: {
    width: 3,
    borderRadius: 2,
    overflow: 'hidden',
  },
  waveformGradient: {
    flex: 1,
  },
  // Food Card
  cardFood: {
    width: '48%',
    position: 'relative',
  },
  foodEmoji: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 36,
    height: 36,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  foodEmojiText: {
    fontSize: 18,
  },
  foodImage: {
    width: '100%',
    aspectRatio: 1,
    resizeMode: 'cover',
    zIndex: 2,
  },
  cuisineTag: {
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: 'rgba(52, 211, 153, 0.2)',
    borderRadius: 6,
  },
  cuisineText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#34d399',
  },
  // Sport Card
  cardSport: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
  },
  sportIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 211, 238, 0.15)',
    zIndex: 2,
  },
  sportEmojiText: {
    fontSize: 26,
  },
  sportInfo: {
    flex: 1,
    zIndex: 2,
  },
  levelBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    zIndex: 2,
  },
  levelText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: 0.5,
  },
});
