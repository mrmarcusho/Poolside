import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  Pressable,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  EVENT_TAGS,
  CLASS_YEARS,
  DATE_FILTERS,
  EventFilterState,
  DEFAULT_FILTER_STATE,
  countActiveFilters,
  ClassYearId,
  DateFilterId,
} from '../data/eventFilters';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface EventFilterModalProps {
  visible: boolean;
  onClose: () => void;
  filters: EventFilterState;
  onApply: (filters: EventFilterState) => void;
}

export const EventFilterModal: React.FC<EventFilterModalProps> = ({
  visible,
  onClose,
  filters,
  onApply,
}) => {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  // Local filter state for editing before applying
  const [localFilters, setLocalFilters] = useState<EventFilterState>(filters);

  // Reset local filters when modal opens
  useEffect(() => {
    if (visible) {
      setLocalFilters(filters);
    }
  }, [visible, filters]);

  // Animate modal in/out
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const toggleTag = (tagId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLocalFilters((prev) => ({
      ...prev,
      tags: prev.tags.includes(tagId)
        ? prev.tags.filter((t) => t !== tagId)
        : [...prev.tags, tagId],
    }));
  };

  const toggleClassYear = (yearId: ClassYearId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLocalFilters((prev) => ({
      ...prev,
      classYears: prev.classYears.includes(yearId)
        ? prev.classYears.filter((y) => y !== yearId)
        : [...prev.classYears, yearId],
    }));
  };

  const toggleDateFilter = (dateId: DateFilterId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLocalFilters((prev) => ({
      ...prev,
      dateFilter: prev.dateFilter === dateId ? null : dateId,
    }));
  };

  const handleReset = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLocalFilters(DEFAULT_FILTER_STATE);
  };

  const handleApply = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onApply(localFilters);
    onClose();
  };

  const activeCount = countActiveFilters(localFilters);

  return (
    <Modal visible={visible} transparent animationType="none">
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Modal Content */}
      <Animated.View
        style={[
          styles.modalContainer,
          {
            transform: [{ translateY: slideAnim }],
            paddingBottom: insets.bottom + 20,
          },
        ]}
      >
        <BlurView intensity={80} tint="dark" style={styles.blurContainer}>
          {/* Glass highlight effect */}
          <View style={styles.glassHighlight} />

          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Filter Events</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Categories Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>CATEGORIES</Text>
              <View style={styles.chipsGrid}>
                {EVENT_TAGS.map((tag) => (
                  <TouchableOpacity
                    key={tag.id}
                    style={[
                      styles.chip,
                      localFilters.tags.includes(tag.id) && styles.chipSelected,
                    ]}
                    onPress={() => toggleTag(tag.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.chipEmoji}>{tag.emoji}</Text>
                    <Text
                      style={[
                        styles.chipLabel,
                        localFilters.tags.includes(tag.id) &&
                          styles.chipLabelSelected,
                      ]}
                    >
                      {tag.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Open To Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>OPEN TO</Text>
              <View style={styles.chipsGrid}>
                {/* Everyone chip with special styling */}
                <TouchableOpacity
                  style={[
                    styles.chip,
                    styles.chipEveryone,
                    localFilters.classYears.length === 0 &&
                      styles.chipEveryoneSelected,
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setLocalFilters((prev) => ({ ...prev, classYears: [] }));
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.chipEmoji}>✨</Text>
                  <Text
                    style={[
                      styles.chipLabel,
                      localFilters.classYears.length === 0 &&
                        styles.chipLabelSelected,
                    ]}
                  >
                    Everyone
                  </Text>
                </TouchableOpacity>

                {CLASS_YEARS.map((year) => (
                  <TouchableOpacity
                    key={year.id}
                    style={[
                      styles.chip,
                      localFilters.classYears.includes(year.id) &&
                        styles.chipSelected,
                    ]}
                    onPress={() => toggleClassYear(year.id)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.chipLabel,
                        localFilters.classYears.includes(year.id) &&
                          styles.chipLabelSelected,
                      ]}
                    >
                      {year.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* When Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>WHEN</Text>
              <View style={styles.chipsGrid}>
                {DATE_FILTERS.map((dateFilter) => (
                  <TouchableOpacity
                    key={dateFilter.id}
                    style={[
                      styles.chip,
                      localFilters.dateFilter === dateFilter.id &&
                        styles.chipSelected,
                    ]}
                    onPress={() => toggleDateFilter(dateFilter.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.chipEmoji}>{dateFilter.emoji}</Text>
                    <Text
                      style={[
                        styles.chipLabel,
                        localFilters.dateFilter === dateFilter.id &&
                          styles.chipLabelSelected,
                      ]}
                    >
                      {dateFilter.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.resetButton}
              onPress={handleReset}
              activeOpacity={0.7}
            >
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.applyButton}
              onPress={handleApply}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#c084fc', '#e9d5ff', '#f5f3ff', '#ddd6fe', '#93c5fd', '#60a5fa']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.applyGradient}
              >
                <Text style={styles.applyButtonText}>Apply Filters</Text>
                {activeCount > 0 && (
                  <View style={styles.filterCount}>
                    <Text style={styles.filterCountText}>{activeCount}</Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </BlurView>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: SCREEN_HEIGHT * 0.85,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
  },
  blurContainer: {
    flex: 1,
    backgroundColor: 'rgba(30, 30, 45, 0.95)',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
  },
  glassHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  handle: {
    width: 36,
    height: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontFamily: 'Syne_700Bold',
    fontSize: 24,
    color: '#fff',
    letterSpacing: -0.3,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1.2,
    color: 'rgba(255, 255, 255, 0.4)',
    marginBottom: 14,
  },
  chipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 50,
  },
  chipSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderColor: '#fff',
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  chipEveryone: {
    backgroundColor: 'rgba(167, 139, 250, 0.15)',
    borderColor: 'rgba(167, 139, 250, 0.3)',
  },
  chipEveryoneSelected: {
    backgroundColor: 'rgba(167, 139, 250, 0.25)',
    borderColor: '#a78bfa',
    shadowColor: '#a78bfa',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  chipEmoji: {
    fontSize: 16,
    lineHeight: 20,
  },
  chipLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  chipLabelSelected: {
    color: '#fff',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 8,
    backgroundColor: 'rgba(20, 20, 35, 0.5)',
  },
  resetButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  applyButton: {
    flex: 2,
    borderRadius: 16,
    overflow: 'hidden',
  },
  applyGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a2e',
  },
  filterCount: {
    minWidth: 20,
    height: 20,
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  filterCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
});

export default EventFilterModal;
