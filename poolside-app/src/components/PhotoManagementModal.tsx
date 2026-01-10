import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  Animated,
  PanResponder,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';

const { width, height } = Dimensions.get('window');
const PHOTO_WIDTH = 120;
const PHOTO_HEIGHT = 150;
const PHOTO_GAP = 12;
const STRIP_PADDING = 20;

interface PhotoManagementModalProps {
  visible: boolean;
  photos: string[];
  onClose: () => void;
  onSave: (photos: string[]) => void;
}

const LONG_PRESS_DELAY = 200;
const DRAG_THRESHOLD = 10; // pixels of movement before canceling long-press

interface DraggablePhotoProps {
  photo: string;
  index: number;
  isFirst: boolean;
  isBeingDragged: boolean;
  onDragStart: (index: number, pageX: number, pageY: number) => void;
  onDragMove: (dx: number, dy: number, pageX: number) => void;
  onDragEnd: (pageX: number) => void;
  onRemove: (index: number) => void;
}

const DraggablePhoto: React.FC<DraggablePhotoProps> = ({
  photo,
  index,
  isFirst,
  isBeingDragged,
  onDragStart,
  onDragMove,
  onDragEnd,
  onRemove,
}) => {
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const isDragging = useRef(false);
  const startPosition = useRef({ x: 0, y: 0 });
  const hasTriggeredLongPress = useRef(false);

  // Store callbacks in refs to avoid stale closures in PanResponder
  const indexRef = useRef(index);
  const onDragStartRef = useRef(onDragStart);
  const onDragMoveRef = useRef(onDragMove);
  const onDragEndRef = useRef(onDragEnd);

  // Update refs when props change
  indexRef.current = index;
  onDragStartRef.current = onDragStart;
  onDragMoveRef.current = onDragMove;
  onDragEndRef.current = onDragEnd;

  const panResponder = useRef(
    PanResponder.create({
      // Always start tracking to detect long-press
      onStartShouldSetPanResponder: () => true,
      // Only claim move if we're in drag mode OR if we haven't moved much yet (waiting for long-press)
      onMoveShouldSetPanResponder: (_, gestureState) => {
        if (isDragging.current) return true;
        const distance = Math.sqrt(gestureState.dx ** 2 + gestureState.dy ** 2);
        // If user hasn't moved much, keep tracking for potential long-press
        return distance < DRAG_THRESHOLD;
      },
      // Allow parent (ScrollView) to take over if user starts scrolling before long-press
      onPanResponderTerminationRequest: () => !isDragging.current,
      onPanResponderGrant: (e) => {
        const { pageX, pageY } = e.nativeEvent;
        startPosition.current = { x: pageX, y: pageY };
        isDragging.current = false;
        hasTriggeredLongPress.current = false;

        // Start long-press timer
        longPressTimer.current = setTimeout(() => {
          hasTriggeredLongPress.current = true;
          isDragging.current = true;
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
          onDragStartRef.current(indexRef.current, pageX, pageY);
        }, LONG_PRESS_DELAY);
      },
      onPanResponderMove: (e, gestureState) => {
        const { pageX } = e.nativeEvent;

        // If we haven't triggered long-press yet, check if movement exceeds threshold
        if (!hasTriggeredLongPress.current) {
          const distance = Math.sqrt(gestureState.dx ** 2 + gestureState.dy ** 2);
          if (distance > DRAG_THRESHOLD) {
            // Cancel long-press - user is scrolling
            if (longPressTimer.current) {
              clearTimeout(longPressTimer.current);
              longPressTimer.current = null;
            }
            return;
          }
        }

        // If dragging, update position
        if (isDragging.current) {
          onDragMoveRef.current(gestureState.dx, gestureState.dy, pageX);
        }
      },
      onPanResponderRelease: (e) => {
        const { pageX } = e.nativeEvent;

        // Clear timer if still running
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }

        // If we were dragging, end the drag
        if (isDragging.current) {
          isDragging.current = false;
          onDragEndRef.current(pageX);
        }
      },
      onPanResponderTerminate: () => {
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }
        if (isDragging.current) {
          isDragging.current = false;
          onDragEndRef.current(startPosition.current.x);
        }
      },
    })
  ).current;

  return (
    <View
      testID={`photo-card-${index}`}
      style={[
        styles.photoCard,
        isBeingDragged && styles.photoCardPlaceholder,
      ]}
      {...panResponder.panHandlers}
    >
      {!isBeingDragged && (
        <>
          <Image source={{ uri: photo }} style={styles.photoImage} />

          {/* Main Badge */}
          {isFirst && (
            <LinearGradient
              colors={['#f0c674', '#e0a84c']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.mainBadge}
            >
              <Text style={styles.mainBadgeText}>MAIN</Text>
            </LinearGradient>
          )}

          {/* Remove Button */}
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => onRemove(index)}
            testID={`remove-photo-${index}`}
          >
            <Text style={styles.removeButtonText}>×</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
};

export const PhotoManagementModal: React.FC<PhotoManagementModalProps> = ({
  visible,
  photos: initialPhotos,
  onClose,
  onSave,
}) => {
  const [photos, setPhotos] = useState<string[]>(initialPhotos);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const slideAnim = useRef(new Animated.Value(height)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const dragX = useRef(new Animated.Value(0)).current;
  const dragY = useRef(new Animated.Value(0)).current;
  const dragScale = useRef(new Animated.Value(1)).current;

  const scrollViewRef = useRef<ScrollView>(null);
  const scrollOffset = useRef(0);
  const dragStartX = useRef(0);

  // Reset photos when modal opens
  useEffect(() => {
    if (visible) {
      setPhotos(initialPhotos);
      setDraggingIndex(null);
      setDragOverIndex(null);
      // Animate in
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          damping: 20,
          stiffness: 150,
          mass: 0.8,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, initialPhotos]);

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.parallel([
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const handleDone = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSave(photos);
    Animated.parallel([
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const handleAddPhoto = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Sorry, we need camera roll permissions to add photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotos([...photos, result.assets[0].uri]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleRemovePhoto = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const getIndexFromPosition = (pageX: number): number => {
    // Calculate which index the dragged item is over
    const relativeX = pageX - STRIP_PADDING + scrollOffset.current;
    const index = Math.floor(relativeX / (PHOTO_WIDTH + PHOTO_GAP));
    return Math.max(0, Math.min(index, photos.length - 1));
  };

  // Called when long-press triggers drag start
  const handleDragStart = (index: number, pageX: number, _pageY: number) => {
    setDraggingIndex(index);
    dragStartX.current = pageX;

    // Calculate initial position of the dragged item
    const itemX = STRIP_PADDING + index * (PHOTO_WIDTH + PHOTO_GAP) - scrollOffset.current;
    dragX.setValue(itemX);
    dragY.setValue(0);

    // Scale up the dragged item
    Animated.spring(dragScale, {
      toValue: 1.1,
      useNativeDriver: true,
    }).start();
  };

  // Called during drag movement
  const handleDragMove = (dx: number, dy: number, pageX: number) => {
    if (draggingIndex === null) return;

    const newX = STRIP_PADDING + draggingIndex * (PHOTO_WIDTH + PHOTO_GAP) - scrollOffset.current + dx;
    dragX.setValue(newX);
    dragY.setValue(dy);

    // Calculate which index we're over
    const targetIndex = getIndexFromPosition(pageX);
    if (targetIndex !== dragOverIndex) {
      setDragOverIndex(targetIndex);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  // Called when drag ends
  const handleDragEnd = (pageX: number) => {
    if (draggingIndex === null) return;

    const targetIndex = getIndexFromPosition(pageX);

    // Reorder the photos
    if (targetIndex !== draggingIndex) {
      const newPhotos = [...photos];
      const [movedPhoto] = newPhotos.splice(draggingIndex, 1);
      newPhotos.splice(targetIndex, 0, movedPhoto);
      setPhotos(newPhotos);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    // Reset drag state
    setDraggingIndex(null);
    setDragOverIndex(null);

    Animated.spring(dragScale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handleScroll = (event: any) => {
    scrollOffset.current = event.nativeEvent.contentOffset.x;
  };

  // Get display order of photos (reordered while dragging)
  const getDisplayPhotos = () => {
    if (draggingIndex === null || dragOverIndex === null || draggingIndex === dragOverIndex) {
      return photos.map((photo, index) => ({ photo, originalIndex: index }));
    }

    const result = photos.map((photo, index) => ({ photo, originalIndex: index }));
    const [dragged] = result.splice(draggingIndex, 1);
    result.splice(dragOverIndex, 0, dragged);
    return result;
  };

  if (!visible) return null;

  const displayPhotos = getDisplayPhotos();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Backdrop */}
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: backdropAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0.7],
              }),
            },
          ]}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={handleClose}
          />
        </Animated.View>

        {/* Modal Card */}
        <Animated.View
          style={[
            styles.modalCard,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Add Photos</Text>
            <TouchableOpacity style={styles.doneButton} onPress={handleDone} testID="done-button">
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.doneButtonGradient}
              >
                <Text style={styles.doneButtonText}>Done</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Photo Strip */}
          <View style={styles.photoStripContainer}>
            <ScrollView
              ref={scrollViewRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.photoStrip}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              scrollEnabled={draggingIndex === null}
            >
              {/* Empty state - show one empty card */}
              {photos.length === 0 && (
                <TouchableOpacity
                  style={styles.emptyPhotoCard}
                  onPress={handleAddPhoto}
                  activeOpacity={0.8}
                >
                  <View style={styles.emptyIcon}>
                    <Text style={styles.emptyIconText}>📷</Text>
                  </View>
                  <Text style={styles.emptyText}>Tap to add</Text>
                </TouchableOpacity>
              )}

              {/* Photo Cards */}
              {displayPhotos.map(({ photo, originalIndex }, displayIndex) => {
                const isBeingDragged = originalIndex === draggingIndex;
                const isFirst = displayIndex === 0;

                return (
                  <View
                    key={`photo-${originalIndex}`}
                    style={[
                      styles.photoCardWrapper,
                      isBeingDragged && styles.photoCardHidden,
                    ]}
                  >
                    <DraggablePhoto
                      photo={photo}
                      index={originalIndex}
                      isFirst={isFirst}
                      isBeingDragged={isBeingDragged}
                      onDragStart={handleDragStart}
                      onDragMove={handleDragMove}
                      onDragEnd={handleDragEnd}
                      onRemove={handleRemovePhoto}
                    />
                  </View>
                );
              })}

              {/* Add Photo Button - just the plus */}
              <TouchableOpacity
                style={styles.addPhotoButton}
                onPress={handleAddPhoto}
                activeOpacity={0.7}
              >
                <View style={styles.addIcon}>
                  <Text style={styles.addIconText}>+</Text>
                </View>
              </TouchableOpacity>
            </ScrollView>

            {/* Floating dragged photo */}
            {draggingIndex !== null && (
              <Animated.View
                style={[
                  styles.floatingPhoto,
                  {
                    transform: [
                      { translateX: dragX },
                      { translateY: dragY },
                      { scale: dragScale },
                    ],
                  },
                ]}
                pointerEvents="none"
              >
                <Image
                  source={{ uri: photos[draggingIndex] }}
                  style={styles.photoImage}
                />
                {draggingIndex === 0 && (
                  <LinearGradient
                    colors={['#f0c674', '#e0a84c']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.mainBadge}
                  >
                    <Text style={styles.mainBadgeText}>MAIN</Text>
                  </LinearGradient>
                )}
              </Animated.View>
            )}
          </View>

          {/* Hint text */}
          {photos.length > 1 && draggingIndex === null && (
            <Text style={styles.hintText}>Hold and drag to reorder</Text>
          )}

          {/* Bottom padding for safe area */}
          <View style={styles.bottomPadding} />
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  modalCard: {
    backgroundColor: 'rgba(20, 20, 30, 0.95)',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 22,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: -2,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: -0.3,
  },
  doneButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  doneButtonGradient: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  doneButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  photoStripContainer: {
    paddingVertical: 20,
    position: 'relative',
  },
  photoStrip: {
    paddingHorizontal: STRIP_PADDING,
    gap: PHOTO_GAP,
    flexDirection: 'row',
    alignItems: 'center',
  },
  photoCardWrapper: {
    width: PHOTO_WIDTH,
    height: PHOTO_HEIGHT,
  },
  photoCardHidden: {
    opacity: 0.3,
  },
  emptyPhotoCard: {
    width: PHOTO_WIDTH,
    height: PHOTO_HEIGHT,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  emptyIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyIconText: {
    fontSize: 16,
  },
  emptyText: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.35)',
  },
  photoCard: {
    width: PHOTO_WIDTH,
    height: PHOTO_HEIGHT,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  photoCardPlaceholder: {
    backgroundColor: 'rgba(102, 126, 234, 0.2)',
    borderStyle: 'dashed',
    borderColor: 'rgba(102, 126, 234, 0.5)',
  },
  photoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  mainBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  mainBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: '#1a1a2e',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    fontSize: 16,
    color: '#fff',
    marginTop: -1,
  },
  floatingPhoto: {
    position: 'absolute',
    top: 20,
    left: 0,
    width: PHOTO_WIDTH,
    height: PHOTO_HEIGHT,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
    borderWidth: 2,
    borderColor: '#667eea',
  },
  addPhotoButton: {
    width: 44,
    height: PHOTO_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(102, 126, 234, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addIconText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '300',
  },
  hintText: {
    textAlign: 'center',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
    marginBottom: 8,
  },
  bottomPadding: {
    height: 40,
  },
});
