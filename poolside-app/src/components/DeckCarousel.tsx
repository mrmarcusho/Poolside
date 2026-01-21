import React, { useState, useEffect } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
  runOnJS,
  SharedValue,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');
const CAROUSEL_PADDING = 16;
const SLIDE_WIDTH = width - CAROUSEL_PADDING * 2 - 60;
const PEEK_AMOUNT = 50;
const SWIPE_THRESHOLD = 60;

// Spring config for smooth, natural feel
const SPRING_CONFIG = {
  damping: 20,
  stiffness: 150,
  mass: 0.8,
};

interface SlideItemProps {
  photo: string;
  slideIndex: number;
  animatedIndex: SharedValue<number>;
  dragOffset: SharedValue<number>;
  isEditMode: boolean;
  isActive: boolean;
  totalPhotos: number;
  onRemovePhoto?: (index: number) => void;
}

// Separate component for each slide - hooks are called at component level (not in loop)
const SlideItem: React.FC<SlideItemProps> = ({
  photo,
  slideIndex,
  animatedIndex,
  dragOffset,
  isEditMode,
  isActive,
  totalPhotos,
  onRemovePhoto,
}) => {
  const [imageError, setImageError] = useState(false);

  const animatedStyle = useAnimatedStyle(() => {
    const position = slideIndex - animatedIndex.value;
    const dragInfluence = dragOffset.value / SLIDE_WIDTH;
    const effectivePosition = position + dragInfluence;

    const translateX = interpolate(
      effectivePosition,
      [-1, 0, 1, 2],
      [-SLIDE_WIDTH - 20, 0, SLIDE_WIDTH - PEEK_AMOUNT, SLIDE_WIDTH + 50],
      Extrapolation.CLAMP
    );

    const scale = interpolate(
      effectivePosition,
      [-1, 0, 1],
      [0.85, 1, 0.88],
      Extrapolation.CLAMP
    );

    const opacity = interpolate(
      effectivePosition,
      [-1, -0.5, 0, 0.5, 1, 2],
      [0, 0.5, 1, 0.9, 0.75, 0.5],
      Extrapolation.CLAMP
    );

    const distanceFromCenter = Math.abs(effectivePosition);
    const zIndex = interpolate(
      distanceFromCenter,
      [0, 0.5, 1, 2],
      [10, 8, 5, 1],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ translateX }, { scale }],
      opacity,
      zIndex: Math.round(zIndex),
    };
  });

  return (
    <Animated.View style={[styles.slide, animatedStyle]}>
      {imageError ? (
        <View style={styles.imageErrorPlaceholder}>
          <Text style={styles.imageErrorIcon}>📷</Text>
          <Text style={styles.imageErrorText}>Image not available</Text>
        </View>
      ) : (
        <Image
          source={{ uri: photo }}
          style={styles.slideImage}
          onError={() => setImageError(true)}
        />
      )}

      {isEditMode && (
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => onRemovePhoto?.(slideIndex)}
        >
          <BlurView intensity={80} tint="dark" style={styles.removeButtonBlur}>
            <Text style={styles.removeButtonText}>×</Text>
          </BlurView>
        </TouchableOpacity>
      )}

      {isEditMode && isActive && (
        <View style={styles.photoCountBadge}>
          <Text style={styles.photoCountText}>
            {slideIndex + 1} of {totalPhotos}
          </Text>
        </View>
      )}
    </Animated.View>
  );
};

interface AddPhotoCardProps {
  slideIndex: number;
  animatedIndex: SharedValue<number>;
  dragOffset: SharedValue<number>;
  onAddPhoto?: () => void;
}

// Separate component for add photo card
const AddPhotoCard: React.FC<AddPhotoCardProps> = ({
  slideIndex,
  animatedIndex,
  dragOffset,
  onAddPhoto,
}) => {
  const animatedStyle = useAnimatedStyle(() => {
    const position = slideIndex - animatedIndex.value;
    const dragInfluence = dragOffset.value / SLIDE_WIDTH;
    const effectivePosition = position + dragInfluence;

    const translateX = interpolate(
      effectivePosition,
      [-1, 0, 1, 2],
      [-SLIDE_WIDTH - 20, 0, SLIDE_WIDTH - PEEK_AMOUNT, SLIDE_WIDTH + 50],
      Extrapolation.CLAMP
    );

    const scale = interpolate(
      effectivePosition,
      [-1, 0, 1],
      [0.85, 1, 0.88],
      Extrapolation.CLAMP
    );

    const opacity = interpolate(
      effectivePosition,
      [-1, -0.5, 0, 0.5, 1, 2],
      [0, 0.5, 1, 0.9, 0.75, 0.5],
      Extrapolation.CLAMP
    );

    const distanceFromCenter = Math.abs(effectivePosition);
    const zIndex = interpolate(
      distanceFromCenter,
      [0, 0.5, 1, 2],
      [10, 8, 5, 1],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ translateX }, { scale }],
      opacity,
      zIndex: Math.round(zIndex),
    };
  });

  return (
    <Animated.View style={[styles.slide, styles.addPhotoSlide, animatedStyle]}>
      <TouchableOpacity style={styles.addPhotoContent} onPress={onAddPhoto}>
        <View style={styles.addPhotoIcon}>
          <Text style={styles.addPhotoIconText}>+</Text>
        </View>
        <Text style={styles.addPhotoText}>Add Photo</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

interface DeckCarouselProps {
  photos: string[];
  isEditMode?: boolean;
  showAddButton?: boolean;
  onRemovePhoto?: (index: number) => void;
  onAddPhoto?: () => void;
}

export const DeckCarousel: React.FC<DeckCarouselProps> = ({
  photos,
  isEditMode = false,
  showAddButton = true,
  onRemovePhoto,
  onAddPhoto,
}) => {
  const [displayIndex, setDisplayIndex] = useState(0);

  // The key: use shared value for animated index
  const animatedIndex = useSharedValue(0);
  const dragOffset = useSharedValue(0);

  // Show add button if showAddButton is true (always show add card at end)
  const totalSlides = photos.length + (showAddButton ? 1 : 0);

  // Sync display index with animated index for UI elements
  const syncDisplayIndex = (index: number) => {
    setDisplayIndex(index);
  };

  // Reset animated index when photos change
  useEffect(() => {
    if (displayIndex >= photos.length && !showAddButton) {
      animatedIndex.value = withSpring(Math.max(0, photos.length - 1), SPRING_CONFIG);
      setDisplayIndex(Math.max(0, photos.length - 1));
    }
  }, [photos.length, showAddButton]);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-10, 10])
    .onUpdate((e) => {
      // Constrain drag at boundaries
      const currentIdx = animatedIndex.value;
      let drag = e.translationX;

      // Add resistance at edges
      if ((currentIdx <= 0 && drag > 0) || (currentIdx >= totalSlides - 1 && drag < 0)) {
        drag = drag * 0.3;
      }

      dragOffset.value = drag;
    })
    .onEnd((e) => {
      const velocity = e.velocityX;
      const drag = e.translationX;
      const currentIdx = Math.round(animatedIndex.value);

      let newIndex = currentIdx;

      // Determine direction based on drag distance AND velocity
      if (drag < -SWIPE_THRESHOLD || velocity < -500) {
        newIndex = Math.min(currentIdx + 1, totalSlides - 1);
      } else if (drag > SWIPE_THRESHOLD || velocity > 500) {
        newIndex = Math.max(currentIdx - 1, 0);
      }

      // Reset drag offset
      dragOffset.value = withSpring(0, SPRING_CONFIG);

      // Animate to new index
      animatedIndex.value = withSpring(newIndex, SPRING_CONFIG);

      // Update display index
      runOnJS(syncDisplayIndex)(newIndex);
    });

  const goToSlide = (index: number) => {
    animatedIndex.value = withSpring(index, SPRING_CONFIG);
    setDisplayIndex(index);
  };

  return (
    <View style={styles.container}>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={styles.track}>
          {photos.map((photo, index) => (
            <SlideItem
              key={`photo-${index}`}
              photo={photo}
              slideIndex={index}
              animatedIndex={animatedIndex}
              dragOffset={dragOffset}
              isEditMode={isEditMode}
              isActive={index === displayIndex}
              totalPhotos={photos.length}
              onRemovePhoto={onRemovePhoto}
            />
          ))}
          {showAddButton && (
            <AddPhotoCard
              slideIndex={photos.length}
              animatedIndex={animatedIndex}
              dragOffset={dragOffset}
              onAddPhoto={onAddPhoto}
            />
          )}
        </Animated.View>
      </GestureDetector>

      {/* Pagination Dots */}
      <View style={styles.pagination}>
        {Array.from({ length: showAddButton ? photos.length + 1 : photos.length }).map((_, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.dot,
              displayIndex === index && styles.dotActive,
            ]}
            onPress={() => goToSlide(index)}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 20,
  },
  track: {
    position: 'relative',
    width: '100%',
    height: 400,
    paddingHorizontal: CAROUSEL_PADDING,
  },
  slide: {
    position: 'absolute',
    top: 0,
    left: CAROUSEL_PADDING,
    width: SLIDE_WIDTH,
    height: '100%',
    borderRadius: 20,
    overflow: 'hidden',
  },
  slideImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageErrorPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(30, 30, 40, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  imageErrorIcon: {
    fontSize: 48,
    opacity: 0.5,
  },
  imageErrorText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    fontWeight: '500',
  },
  removeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    zIndex: 10,
  },
  removeButtonBlur: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
  },
  removeButtonText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '300',
  },
  photoCountBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    zIndex: 10,
  },
  photoCountText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#fff',
  },
  addPhotoSlide: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  addPhotoContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  addPhotoIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
  },
  addPhotoIconText: {
    fontSize: 28,
    color: '#fff',
    fontWeight: '300',
  },
  addPhotoText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  dotActive: {
    width: 24,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
});
