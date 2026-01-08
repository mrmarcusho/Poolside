import React, { useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import * as Haptics from 'expo-haptics';

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

interface CurvedPickerWheelProps {
  items: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  label?: string;
  width?: number;
}

interface PickerItemProps {
  item: string;
  index: number;
  scrollY: Animated.Value;
}

const PickerItem: React.FC<PickerItemProps> = ({ item, index, scrollY }) => {
  // Calculate the center position for this item
  const itemCenterY = index * ITEM_HEIGHT;

  // The scroll position where this item would be centered
  const inputRange = [
    itemCenterY - ITEM_HEIGHT * 3,
    itemCenterY - ITEM_HEIGHT * 2,
    itemCenterY - ITEM_HEIGHT,
    itemCenterY,
    itemCenterY + ITEM_HEIGHT,
    itemCenterY + ITEM_HEIGHT * 2,
    itemCenterY + ITEM_HEIGHT * 3,
  ];

  // Rotation: items above center rotate forward, below rotate backward
  const rotateX = scrollY.interpolate({
    inputRange,
    outputRange: ['55deg', '40deg', '20deg', '0deg', '-20deg', '-40deg', '-55deg'],
    extrapolate: 'clamp',
  });

  // Scale: center item is 1, items further away are smaller
  const scale = scrollY.interpolate({
    inputRange,
    outputRange: [0.6, 0.75, 0.9, 1, 0.9, 0.75, 0.6],
    extrapolate: 'clamp',
  });

  // Opacity: center item is fully visible, fades toward edges
  const opacity = scrollY.interpolate({
    inputRange,
    outputRange: [0.15, 0.25, 0.5, 1, 0.5, 0.25, 0.15],
    extrapolate: 'clamp',
  });

  // TranslateY to create the curved wheel effect
  const translateY = scrollY.interpolate({
    inputRange,
    outputRange: [-12, -8, -3, 0, 3, 8, 12],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View
      style={[
        styles.pickerItem,
        {
          transform: [
            { perspective: 1000 },
            { rotateX },
            { scale },
            { translateY },
          ],
          opacity,
        },
      ]}
    >
      <Text style={styles.pickerItemText}>{item}</Text>
    </Animated.View>
  );
};

export const CurvedPickerWheel: React.FC<CurvedPickerWheelProps> = ({
  items,
  selectedIndex,
  onSelect,
  label,
  width = 100,
}) => {
  const scrollViewRef = useRef<Animated.ScrollView>(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const lastHapticIndex = useRef<number>(-1);

  // Scroll to selected index on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollViewRef.current?.scrollTo({
        y: selectedIndex * ITEM_HEIGHT,
        animated: false,
      });
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  // Handle scroll for haptic feedback
  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);

    if (index !== lastHapticIndex.current && index >= 0 && index < items.length) {
      lastHapticIndex.current = index;
      Haptics.selectionAsync();
    }
  }, [items.length]);

  // Handle scroll end to snap and update selection
  const handleScrollEnd = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / ITEM_HEIGHT);
    const clampedIndex = Math.max(0, Math.min(index, items.length - 1));

    if (clampedIndex !== selectedIndex) {
      onSelect(clampedIndex);
    }
  }, [items.length, selectedIndex, onSelect]);

  const paddingVertical = (PICKER_HEIGHT - ITEM_HEIGHT) / 2;

  return (
    <View style={[styles.container, { width }]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View style={styles.wheelContainer}>
        {/* Selection highlight bar */}
        <View style={styles.selectionBar} pointerEvents="none" />

        {/* Top fade gradient */}
        <View style={styles.fadeTop} pointerEvents="none" />

        {/* Bottom fade gradient */}
        <View style={styles.fadeBottom} pointerEvents="none" />

        <Animated.ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={{ paddingVertical }}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="fast"
          nestedScrollEnabled={true}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            {
              useNativeDriver: true,
              listener: handleScroll,
            }
          )}
          scrollEventThrottle={16}
          onMomentumScrollEnd={handleScrollEnd}
          onScrollEndDrag={handleScrollEnd}
        >
          {items.map((item, index) => (
            <PickerItem
              key={`${item}-${index}`}
              item={item}
              index={index}
              scrollY={scrollY}
            />
          ))}
        </Animated.ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.35)',
    letterSpacing: 0.5,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  wheelContainer: {
    height: PICKER_HEIGHT,
    position: 'relative',
    overflow: 'hidden',
  },
  scrollView: {
    height: PICKER_HEIGHT,
  },
  selectionBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    marginTop: -(ITEM_HEIGHT / 2),
    height: ITEM_HEIGHT,
    backgroundColor: 'rgba(60, 60, 67, 0.5)',
    borderRadius: 10,
    zIndex: 0,
  },
  fadeTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: PICKER_HEIGHT * 0.35,
    zIndex: 10,
    pointerEvents: 'none',
  },
  fadeBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: PICKER_HEIGHT * 0.35,
    zIndex: 10,
    pointerEvents: 'none',
  },
  pickerItem: {
    height: ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerItemText: {
    fontSize: 22,
    fontWeight: '400',
    color: '#fff',
  },
});
