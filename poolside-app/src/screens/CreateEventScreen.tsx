import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Animated,
  Dimensions,
  Image,
  Modal,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProfileBackground, CurvedPickerWheel, VideoBackground } from '../components';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { eventsService } from '../api/services/events';
import { uploadsService } from '../api/services/uploads';
import { useEventCreationAnimation } from '../context/EventCreationAnimationContext';
import ColorPicker, { Panel1, HueSlider, Preview } from 'reanimated-color-picker';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import ViewShot from 'react-native-view-shot';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TOTAL_SLIDES = 5;

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

const TIME_OPTIONS = [
  '12:00 AM', '12:30 AM', '1:00 AM', '1:30 AM', '2:00 AM', '2:30 AM',
  '3:00 AM', '3:30 AM', '4:00 AM', '4:30 AM', '5:00 AM', '5:30 AM',
  '6:00 AM', '6:30 AM', '7:00 AM', '7:30 AM', '8:00 AM', '8:30 AM',
  '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM',
  '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM', '5:00 PM', '5:30 PM',
  '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM',
  '9:00 PM', '9:30 PM', '10:00 PM', '10:30 PM', '11:00 PM', '11:30 PM',
];

const LOCATION_SUGGESTIONS = [
  { emoji: '🏊', name: 'Pool Deck' },
  { emoji: '🍹', name: 'Lido Bar' },
  { emoji: '🍽️', name: 'Main Dining' },
  { emoji: '🎰', name: 'Casino' },
  { emoji: '🎭', name: 'Theater' },
  { emoji: '💆', name: 'Spa Deck' },
];

const COVER_COLORS = [
  { name: 'white', color: '#f8f8f8', dark: false },
  { name: 'pink', color: '#ffd6e0', dark: false },
  { name: 'mint', color: '#b8f0c0', dark: false },
  { name: 'sky', color: '#b8e4f0', dark: false },
  { name: 'lavender', color: '#d4d4f7', dark: false },
  { name: 'peach', color: '#f5d5c0', dark: false },
  { name: 'cream', color: '#f7f5c0', dark: false },
];

const FONT_OPTIONS = [
  { name: 'Classic', fontFamily: 'Montserrat_600SemiBold' },
  { name: 'Elegant', fontFamily: 'PlayfairDisplay_700Bold' },
  { name: 'Script', fontFamily: 'DancingScript_700Bold' },
  { name: 'Retro', fontFamily: 'SpaceMono_700Bold' },
  { name: 'Chill', fontFamily: 'Pacifico_400Regular' },
  { name: 'Impact', fontFamily: 'Oswald_600SemiBold' },
  { name: 'Fun', fontFamily: 'Lobster_400Regular' },
];

// Helper function to determine if a hex color is dark
const isColorDark = (hex: string): boolean => {
  const color = hex.replace('#', '');
  const r = parseInt(color.substr(0, 2), 16);
  const g = parseInt(color.substr(2, 2), 16);
  const b = parseInt(color.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.5;
};

export const CreateEventScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { triggerAnimation } = useEventCreationAnimation();

  // Splash state
  const [showSplash, setShowSplash] = useState(true);

  // Slide state
  const [currentSlide, setCurrentSlide] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Form state - Slide 1: Title
  const [title, setTitle] = useState('');

  // Form state - Slide 2: Time
  const [isNow, setIsNow] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(0); // January
  const [selectedDay, setSelectedDay] = useState(7);
  const [selectedTime, setSelectedTime] = useState('8:00 PM');

  // Form state - Slide 3: Location
  const [location, setLocation] = useState('');

  // Form state - Slide 4: Cover
  const [coverText, setCoverText] = useState('');
  const [coverColor, setCoverColor] = useState('#f8f8f8');
  const [coverColorDark, setCoverColorDark] = useState(false);
  const [coverFont, setCoverFont] = useState('Classic');
  const [coverFontFamily, setCoverFontFamily] = useState('Montserrat_600SemiBold');
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [tempPickerColor, setTempPickerColor] = useState('#f8f8f8');
  const [showTextEditor, setShowTextEditor] = useState(false);
  const [editingText, setEditingText] = useState('');

  // Form state - Slide 5: Final touches
  const [spots, setSpots] = useState('');
  const [description, setDescription] = useState('');

  // UI state
  const [isCreating, setIsCreating] = useState(false);

  // Animation values for toggle and picker
  const toggleAnim = useRef(new Animated.Value(0)).current;
  const pickerOpacityAnim = useRef(new Animated.Value(1)).current;
  const cursorOpacity = useRef(new Animated.Value(1)).current;
  const coverCanvasRef = useRef<View>(null);

  // Blinking cursor animation for text editor
  useEffect(() => {
    if (showTextEditor && !editingText) {
      const blink = Animated.loop(
        Animated.sequence([
          Animated.timing(cursorOpacity, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(cursorOpacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      blink.start();
      return () => blink.stop();
    } else {
      cursorOpacity.setValue(1);
    }
  }, [showTextEditor, editingText, cursorOpacity]);

  const handleToggleNow = () => {
    const newValue = !isNow;
    setIsNow(newValue);

    // Animate toggle knob
    Animated.spring(toggleAnim, {
      toValue: newValue ? 1 : 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();

    // Animate picker opacity
    Animated.timing(pickerOpacityAnim, {
      toValue: newValue ? 0.3 : 1,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  const goToSlide = (index: number) => {
    Animated.spring(slideAnim, {
      toValue: index,
      useNativeDriver: true,
      tension: 50,
      friction: 10,
    }).start();
    setCurrentSlide(index);
  };

  const nextSlide = () => {
    if (currentSlide < TOTAL_SLIDES - 1) {
      goToSlide(currentSlide + 1);
    } else {
      handleCreate();
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      goToSlide(currentSlide - 1);
    } else {
      navigation.goBack();
    }
  };

  const handlePickImage = async () => {
    const ImagePicker = await import('expo-image-picker');
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setCoverImage(result.assets[0].uri);
    }
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert('Missing Title', 'Please enter a title for your event.');
      goToSlide(0);
      return;
    }
    if (!location.trim()) {
      Alert.alert('Missing Location', 'Please enter a location for your event.');
      goToSlide(2);
      return;
    }

    // Build date time
    let dateTime: Date;
    if (isNow) {
      dateTime = new Date();
    } else {
      const now = new Date();
      dateTime = new Date(now.getFullYear(), selectedMonth, selectedDay);
      const [time, period] = selectedTime.split(' ');
      const [hours, minutes] = time.split(':').map(Number);
      let hour24 = hours;
      if (period === 'PM' && hours !== 12) hour24 += 12;
      if (period === 'AM' && hours === 12) hour24 = 0;
      dateTime.setHours(hour24, minutes, 0, 0);

      if (dateTime.getTime() <= Date.now()) {
        Alert.alert('Invalid Date', 'Please select a date and time in the future.');
        goToSlide(1);
        return;
      }
    }

    const eventDescription = description.trim() || `${title.trim()} event`;

    setIsCreating(true);

    try {
      // Get the cover image URL - either from uploaded image or captured canvas
      let uploadedImageUrl: string | undefined;

      if (coverImage) {
        // User uploaded an image - upload it
        try {
          const uploadResult = await uploadsService.uploadImage(coverImage);
          uploadedImageUrl = uploadResult.url;
        } catch (uploadError) {
          console.error('Failed to upload image:', uploadError);
        }
      } else if (coverCanvasRef.current) {
        // No uploaded image - capture the canvas (solid color + text)
        try {
          const capturedUri = await ViewShot.captureRef(coverCanvasRef, {
            format: 'jpg',
            quality: 0.9,
          });
          const uploadResult = await uploadsService.uploadImage(capturedUri);
          uploadedImageUrl = uploadResult.url;
        } catch (captureError) {
          console.error('Failed to capture/upload canvas:', captureError);
        }
      }

      const eventData = {
        title: title.trim(),
        description: eventDescription,
        locationName: location.trim(),
        dateTime: dateTime.toISOString(),
        eventImage: uploadedImageUrl,
      };

      await eventsService.createEvent(eventData);

      // Reset form
      setTitle('');
      setIsNow(false);
      setSelectedMonth(0);
      setSelectedDay(7);
      setSelectedTime('8:00 PM');
      setLocation('');
      setCoverText('');
      setCoverColor('#f8f8f8');
      setCoverColorDark(false);
      setCoverFont('Classic');
      setCoverFontFamily('Montserrat_600SemiBold');
      setCoverImage(null);
      setSpots('');
      setDescription('');
      setCurrentSlide(0);
      slideAnim.setValue(0); // Reset the animation value too

      navigation.navigate('Feed' as never);
    } catch (error: any) {
      console.error('Failed to create event:', error);
      const errorMessage = error.response?.data?.message;
      const displayMessage = Array.isArray(errorMessage)
        ? errorMessage.join('\n')
        : errorMessage || 'Failed to create event. Please try again.';
      Alert.alert('Error', displayMessage);
    } finally {
      setIsCreating(false);
    }
  };

  const getTimeDisplayText = () => {
    if (isNow) return 'Starting right now ⚡';
    return `${MONTHS[selectedMonth]} ${selectedDay} at ${selectedTime}`;
  };

  const renderProgressBar = () => {
    const progress = ((currentSlide + 1) / TOTAL_SLIDES) * 100;
    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <Animated.View
            style={[
              styles.progressFill,
              { width: `${progress}%` },
            ]}
          />
        </View>
        <View style={styles.progressDots}>
          {Array.from({ length: TOTAL_SLIDES }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.progressDot,
                i === currentSlide && styles.progressDotActive,
                i < currentSlide && styles.progressDotCompleted,
              ]}
            />
          ))}
        </View>
      </View>
    );
  };

  // Slide 1: Title
  const renderTitleSlide = () => (
    <View style={styles.slideContent}>
      <View style={styles.slideIcon}>
        <Text style={styles.slideIconEmoji}>✨</Text>
      </View>
      <Text style={styles.slideQuestion}>What's happening?</Text>
      <Text style={styles.slideHint}>Give your event a catchy name</Text>
      <TextInput
        style={styles.titleInput}
        value={title}
        onChangeText={setTitle}
        placeholder="Pool party at sunset..."
        placeholderTextColor="rgba(255, 255, 255, 0.35)"
        maxLength={50}
      />
      <Text style={styles.charCount}>{title.length}/50</Text>
    </View>
  );

  // Slide 2: Time
  const renderTimeSlide = () => (
    <View style={styles.slideContent}>
      <View style={styles.slideHeaderCompact}>
        <View style={styles.slideIconSmall}>
          <Text style={styles.slideIconEmojiSmall}>🕐</Text>
        </View>
        <View style={styles.slideHeaderText}>
          <Text style={styles.slideQuestionSmall}>When?</Text>
          <Text style={styles.slideHintSmall}>Pick the perfect time</Text>
        </View>
      </View>

      {/* Now Toggle */}
      <TouchableOpacity
        style={[styles.nowToggle, isNow && styles.nowToggleActive]}
        onPress={handleToggleNow}
        activeOpacity={0.8}
      >
        <View style={styles.nowToggleLeft}>
          <Text style={styles.nowIcon}>⚡</Text>
          <Text style={styles.nowLabel}>Starting Now</Text>
        </View>
        <View style={[styles.nowSwitch, isNow && styles.nowSwitchActive]}>
          <Animated.View
            style={[
              styles.nowSwitchKnob,
              {
                transform: [{
                  translateX: toggleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 22],
                  }),
                }],
              },
            ]}
          />
        </View>
      </TouchableOpacity>

      {/* DateTime Picker */}
      <Animated.View style={[styles.datetimePicker, { opacity: pickerOpacityAnim }]} pointerEvents={isNow ? 'none' : 'auto'}>
        <View style={styles.pickerRow}>
          <CurvedPickerWheel
            items={MONTHS}
            selectedIndex={selectedMonth}
            onSelect={(index) => {
              setSelectedMonth(index);
              if (selectedDay > DAYS_IN_MONTH[index]) {
                setSelectedDay(DAYS_IN_MONTH[index]);
              }
            }}
            label="MONTH"
            width={115}
          />
          <CurvedPickerWheel
            items={Array.from({ length: DAYS_IN_MONTH[selectedMonth] }, (_, i) => String(i + 1))}
            selectedIndex={selectedDay - 1}
            onSelect={(index) => setSelectedDay(index + 1)}
            label="DAY"
            width={70}
          />
          <CurvedPickerWheel
            items={TIME_OPTIONS}
            selectedIndex={TIME_OPTIONS.indexOf(selectedTime)}
            onSelect={(index) => setSelectedTime(TIME_OPTIONS[index])}
            label="TIME"
            width={100}
          />
        </View>
      </Animated.View>

      {/* Selected time display */}
      <Text style={styles.selectedTimeText}>{getTimeDisplayText()}</Text>
    </View>
  );

  // Slide 3: Location
  const renderLocationSlide = () => (
    <View style={styles.slideContent}>
      <View style={styles.slideHeaderCompact}>
        <View style={styles.slideIconSmall}>
          <Text style={styles.slideIconEmojiSmall}>📍</Text>
        </View>
        <View style={styles.slideHeaderText}>
          <Text style={styles.slideQuestionSmall}>Where?</Text>
          <Text style={styles.slideHintSmall}>Enter the location</Text>
        </View>
      </View>

      <View style={styles.locationInputContainer}>
        <TextInput
          style={styles.locationInput}
          value={location}
          onChangeText={setLocation}
          placeholder="Pool Deck, Lido Bar, Cabin 7042..."
          placeholderTextColor="rgba(255, 255, 255, 0.35)"
        />
        <View style={styles.locationInputIcon}>
          <Ionicons name="location" size={24} color="rgba(255, 255, 255, 0.35)" />
        </View>
      </View>

      {/* Quick suggestions */}
      <View style={styles.locationSuggestions}>
        <Text style={styles.suggestionsLabel}>POPULAR SPOTS</Text>
        <View style={styles.suggestionChips}>
          {LOCATION_SUGGESTIONS.map((loc) => (
            <TouchableOpacity
              key={loc.name}
              style={styles.suggestionChip}
              onPress={() => setLocation(loc.name)}
            >
              <Text style={styles.suggestionChipText}>{loc.emoji} {loc.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  // Handler for color picker completion
  const handleColorPickerComplete = ({ hex }: { hex: string }) => {
    setTempPickerColor(hex);
  };

  const applyCustomColor = () => {
    setCoverColor(tempPickerColor);
    setCoverColorDark(isColorDark(tempPickerColor));
    setCoverImage(null);
    setShowColorPicker(false);
  };

  // Slide 4: Cover Image
  const renderCoverSlide = () => (
    <View style={styles.slideContent}>
      {/* Upload Label */}
      <Text style={styles.coverUploadLabel}>Upload a photo</Text>

      {/* Large Canvas Preview */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setEditingText(coverText);
          setShowTextEditor(true);
        }}
        style={styles.coverCanvasTouchable}
      >
        {/* This View is captured for the event image */}
        <View
          ref={coverCanvasRef}
          style={[styles.coverCanvas, { backgroundColor: coverImage ? 'transparent' : coverColor }]}
          collapsable={false}
        >
          {coverImage && (
            <>
              <Image source={{ uri: coverImage }} style={styles.coverCanvasImage} />
              <View style={styles.coverCanvasOverlay} />
            </>
          )}
          {coverText ? (
            <Text
              style={[
                styles.coverDisplayText,
                {
                  color: coverImage || coverColorDark ? 'rgba(255, 255, 255, 0.95)' : 'rgba(0, 0, 0, 0.85)',
                  fontFamily: coverFontFamily,
                },
              ]}
            >
              {coverText}
            </Text>
          ) : (
            <Text style={[styles.coverPlaceholder, { color: coverImage || coverColorDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.25)' }]}>
              Tap to add text...
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.coverUploadBtn}
          onPress={(e) => {
            e.stopPropagation();
            handlePickImage();
          }}
        >
          <Ionicons name="image-outline" size={18} color="#fff" />
          <Text style={styles.coverUploadBtnText}>Upload image</Text>
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Color Picker */}
      <View style={styles.coverToolbar}>
        <View style={styles.coverColors}>
          {/* Color wheel button - on the left */}
          <TouchableOpacity
            style={[
              styles.coverColorSwatch,
              styles.coverColorWheelBtn,
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
              setTempPickerColor(coverColor);
              setShowColorPicker(true);
            }}
          >
            <LinearGradient
              colors={['#ff0000', '#ff8000', '#ffff00', '#00ff00', '#00ffff', '#0080ff', '#8000ff', '#ff0080']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.rainbowWheel}
            />
          </TouchableOpacity>
          {COVER_COLORS.map((c) => (
            <TouchableOpacity
              key={c.name}
              style={[
                styles.coverColorSwatch,
                { backgroundColor: c.color },
                c.name === 'white' && styles.coverColorSwatchWhite,
                coverColor === c.color && styles.coverColorSwatchSelected,
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
                setCoverColor(c.color);
                setCoverColorDark(c.dark);
                setCoverImage(null);
              }}
            />
          ))}
        </View>
      </View>

      {/* Color Picker Modal */}
      <Modal
        visible={showColorPicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowColorPicker(false)}
      >
        <View style={styles.colorPickerOverlay}>
          <View style={styles.colorPickerContainer}>
            <Text style={styles.colorPickerTitle}>Choose a custom color</Text>
            <ColorPicker
              style={styles.colorPicker}
              value={tempPickerColor}
              onChangeJS={handleColorPickerComplete}
            >
              <Preview style={styles.colorPreview} />
              <Panel1 style={styles.colorPanel} />
              <HueSlider style={styles.hueSlider} />
            </ColorPicker>
            <View style={styles.colorPickerButtons}>
              <TouchableOpacity
                style={styles.colorPickerCancelBtn}
                onPress={() => setShowColorPicker(false)}
              >
                <Text style={styles.colorPickerCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.colorPickerApplyBtn}
                onPress={applyCustomColor}
              >
                <Text style={styles.colorPickerApplyText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Text Editor Modal */}
      <Modal
        visible={showTextEditor}
        animationType="slide"
        transparent
        onRequestClose={() => setShowTextEditor(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView
            style={styles.textEditorOverlay}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <BlurView intensity={40} tint="dark" style={styles.textEditorContainer}>
            {/* Header */}
            <View style={styles.textEditorHeader}>
              <TouchableOpacity
                onPress={() => setShowTextEditor(false)}
                style={styles.textEditorCancelBtn}
              >
                <Text style={styles.textEditorCancelText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.textEditorTitle}>Add Text</Text>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setCoverText(editingText);
                  setShowTextEditor(false);
                }}
                style={styles.textEditorDoneBtn}
              >
                <Text style={styles.textEditorDoneText}>Done</Text>
              </TouchableOpacity>
            </View>

            {/* Preview */}
            <View style={[styles.textEditorPreview, { backgroundColor: coverColor }]}>
              {editingText ? (
                <Text
                  style={[
                    styles.textEditorPreviewText,
                    {
                      fontFamily: coverFontFamily,
                      color: coverColorDark ? 'rgba(255, 255, 255, 0.95)' : 'rgba(0, 0, 0, 0.85)',
                    },
                  ]}
                >
                  {editingText}
                </Text>
              ) : (
                <Animated.View
                  style={[
                    styles.blinkingCursor,
                    {
                      opacity: cursorOpacity,
                      backgroundColor: coverColorDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.6)',
                    },
                  ]}
                />
              )}
            </View>

            {/* Text Input */}
            <TextInput
              style={styles.textEditorInput}
              value={editingText}
              onChangeText={(text) => {
                // Limit to 4 lines (max 3 newlines)
                const newlineCount = (text.match(/\n/g) || []).length;
                if (newlineCount <= 3) {
                  setEditingText(text);
                }
              }}
              placeholder="Type your text here..."
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              multiline
              numberOfLines={4}
              autoFocus
              maxLength={100}
            />

            {/* Font Picker */}
            <View style={styles.textEditorFonts}>
              {FONT_OPTIONS.map((f) => (
                <TouchableOpacity
                  key={f.name}
                  style={[
                    styles.textEditorFontPill,
                    coverFont === f.name && styles.textEditorFontPillSelected,
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
                    setCoverFont(f.name);
                    setCoverFontFamily(f.fontFamily);
                  }}
                >
                  <Text
                    style={[
                      styles.textEditorFontPillText,
                      coverFont === f.name && styles.textEditorFontPillTextSelected,
                      { fontFamily: f.fontFamily },
                    ]}
                  >
                    {f.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            </BlurView>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );

  // Slide 5: Final Touches
  const renderFinalSlide = () => (
    <View style={styles.slideContent}>
      <View style={styles.slideHeaderCompact}>
        <View style={styles.slideIconSmall}>
          <Text style={styles.slideIconEmojiSmall}>🎨</Text>
        </View>
        <View style={styles.slideHeaderText}>
          <Text style={styles.slideQuestionSmall}>Final touches</Text>
          <Text style={styles.slideHintSmall}>Add some extra details</Text>
        </View>
      </View>

      <View style={styles.optionalSection}>
        {/* Spots input */}
        <View style={styles.optionalField}>
          <Text style={styles.optionalLabel}>How many people can join?</Text>
          <View style={styles.spotsInputContainer}>
            <TextInput
              style={styles.spotsInput}
              value={spots}
              onChangeText={setSpots}
              placeholder="Unlimited"
              placeholderTextColor="rgba(255, 255, 255, 0.35)"
              keyboardType="number-pad"
            />
            <Text style={styles.spotsInputIcon}>👥</Text>
          </View>
        </View>

        {/* Description */}
        <View style={styles.optionalField}>
          <Text style={styles.optionalLabel}>Description</Text>
          <TextInput
            style={styles.optionalTextarea}
            value={description}
            onChangeText={setDescription}
            placeholder="What should people know about this event?"
            placeholderTextColor="rgba(255, 255, 255, 0.35)"
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
        </View>
      </View>
    </View>
  );

  const renderSlide = (index: number) => {
    switch (index) {
      case 0: return renderTitleSlide();
      case 1: return renderTimeSlide();
      case 2: return renderLocationSlide();
      case 3: return renderCoverSlide();
      case 4: return renderFinalSlide();
      default: return null;
    }
  };

  // Render splash screen with video background
  if (showSplash) {
    return (
      <View style={styles.container}>
        <VideoBackground source={require('../assets/videos/PoolsideAnimation.mp4')} />
        <View style={styles.splashContent}>
          {/* Frosted Glass Card */}
          <BlurView intensity={60} tint="light" style={styles.splashCard}>
            {/* Glass highlight effect */}
            <View style={styles.splashCardHighlight} />
            <Text style={styles.splashTitle}>Host Your Event</Text>
            <Text style={styles.splashSubtitle}>Bring people together on the cruise</Text>
            <TouchableOpacity
              style={styles.splashButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setShowSplash(false);
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.splashButtonText}>Let's Create</Text>
            </TouchableOpacity>
          </BlurView>
        </View>
      </View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        <ProfileBackground />

        <View style={[styles.screenContent, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity style={styles.backBtn} onPress={prevSlide}>
                <Ionicons name="chevron-back" size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.skipBtn, currentSlide === TOTAL_SLIDES - 1 && styles.skipBtnVisible]}
                onPress={handleCreate}
                disabled={currentSlide !== TOTAL_SLIDES - 1}
              >
                <Text style={styles.skipBtnText}>Skip extras</Text>
              </TouchableOpacity>
            </View>

            {/* Progress */}
            {renderProgressBar()}

            {/* Slides */}
            <View style={styles.slidesContainer}>
              {Array.from({ length: TOTAL_SLIDES }).map((_, index) => {
                const inputRange = [index - 1, index, index + 1];
                const translateX = slideAnim.interpolate({
                  inputRange,
                  outputRange: [SCREEN_WIDTH, 0, -SCREEN_WIDTH],
                  extrapolate: 'clamp',
                });
                const opacity = slideAnim.interpolate({
                  inputRange,
                  outputRange: [0, 1, 0],
                  extrapolate: 'clamp',
                });

                return (
                  <Animated.View
                    key={index}
                    style={[
                      styles.slide,
                      {
                        transform: [{ translateX }],
                        opacity,
                      },
                    ]}
                    pointerEvents={currentSlide === index ? 'auto' : 'none'}
                  >
                    {renderSlide(index)}
                  </Animated.View>
                );
              })}
            </View>

            {/* Bottom actions */}
            <View style={[styles.bottomActions, { paddingBottom: insets.bottom + 90 }]}>
              <TouchableOpacity
                style={[
                  styles.nextBtn,
                  currentSlide === TOTAL_SLIDES - 1 && styles.nextBtnCreate,
                  isCreating && styles.nextBtnDisabled,
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  nextSlide();
                }}
                disabled={isCreating}
              >
                {isCreating ? (
                  <ActivityIndicator size="small" color="#0a0a12" />
                ) : (
                  <Text style={[styles.nextBtnText, currentSlide === TOTAL_SLIDES - 1 && styles.nextBtnTextCreate]}>
                    {currentSlide === TOTAL_SLIDES - 1 ? 'Create Event 🎉' : 'Next'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Splash screen styles
  splashContent: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 180,
    paddingHorizontal: 28,
  },
  splashCard: {
    width: '100%',
    paddingVertical: 36,
    paddingHorizontal: 28,
    borderRadius: 28,
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 32,
    elevation: 16,
  },
  splashCardHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  splashTitle: {
    fontSize: 32,
    fontFamily: 'Syne_700Bold',
    color: '#1a1a2e',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  splashSubtitle: {
    fontSize: 15,
    fontFamily: 'Outfit_400Regular',
    color: 'rgba(26, 26, 46, 0.65)',
    textAlign: 'center',
    marginBottom: 28,
  },
  splashButton: {
    width: '100%',
    backgroundColor: '#1a1a2e',
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1a1a2e',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  splashButtonText: {
    fontSize: 17,
    fontFamily: 'Outfit_600SemiBold',
    color: '#fff',
    letterSpacing: 0.3,
  },
  screenContent: {
    flex: 1,
    position: 'relative',
    zIndex: 1,
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    opacity: 0,
  },
  skipBtnVisible: {
    opacity: 1,
  },
  skipBtnText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.55)',
  },
  // Progress
  progressContainer: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2dd4bf',
    borderRadius: 2,
  },
  progressDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  progressDotActive: {
    backgroundColor: '#2dd4bf',
  },
  progressDotCompleted: {
    backgroundColor: '#2dd4bf',
  },
  // Slides
  slidesContainer: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  slide: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 24,
  },
  slideContent: {
    flex: 1,
  },
  // Slide 1: Title
  slideIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(45, 212, 191, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  slideIconEmoji: {
    fontSize: 36,
  },
  slideQuestion: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  slideHint: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.55)',
    marginBottom: 32,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: '500',
    color: '#fff',
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 16,
  },
  charCount: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.35)',
    marginTop: 12,
    textAlign: 'right',
  },
  // Compact header (slides 2-5)
  slideHeaderCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  slideIconSmall: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: 'rgba(45, 212, 191, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  slideIconEmojiSmall: {
    fontSize: 24,
  },
  slideHeaderText: {
    flex: 1,
  },
  slideQuestionSmall: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
    letterSpacing: -0.3,
  },
  slideHintSmall: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.55)',
  },
  // Slide 2: Time
  nowToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
  },
  nowToggleActive: {
    backgroundColor: 'rgba(45, 212, 191, 0.12)',
    borderColor: '#2dd4bf',
  },
  nowToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  nowIcon: {
    fontSize: 24,
  },
  nowLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  nowSwitch: {
    width: 52,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 3,
  },
  nowSwitchActive: {
    backgroundColor: '#2dd4bf',
  },
  nowSwitchKnob: {
    width: 24,
    height: 24,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  datetimePicker: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
  },
  selectedTimeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2dd4bf',
    textAlign: 'center',
    marginTop: 12,
  },
  // Slide 3: Location
  locationInputContainer: {
    position: 'relative',
    marginBottom: 24,
  },
  locationInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 18,
    padding: 20,
    paddingRight: 56,
    fontSize: 18,
    color: '#fff',
  },
  locationInputIcon: {
    position: 'absolute',
    right: 18,
    top: '50%',
    transform: [{ translateY: -12 }],
  },
  locationSuggestions: {},
  suggestionsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.35)',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  suggestionChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  suggestionChip: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 24,
  },
  suggestionChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.55)',
  },
  // Slide 4: Cover
  coverUploadLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  coverCanvasTouchable: {
    flex: 1,
    minHeight: 240,
    maxHeight: 280,
    position: 'relative',
  },
  coverCanvas: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverCanvasImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  coverCanvasOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  coverEditableText: {
    fontSize: 28,
    textAlign: 'center',
    padding: 30,
    maxWidth: '100%',
    zIndex: 3,
  },
  coverUploadBtn: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 18,
    backgroundColor: 'rgba(102, 126, 234, 0.9)',
    borderRadius: 24,
    zIndex: 10,
  },
  coverUploadBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
  coverToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    padding: 14,
  },
  coverColors: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  coverColorSwatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  coverColorSwatchWhite: {
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  coverColorSwatchSelected: {
    borderColor: '#2dd4bf',
  },
  coverFontToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    padding: 12,
  },
  coverFonts: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  coverFontPill: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(102, 126, 234, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.3)',
    borderRadius: 20,
  },
  coverFontPillSelected: {
    backgroundColor: 'rgba(102, 126, 234, 0.9)',
    borderColor: 'transparent',
  },
  coverFontPillText: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  coverFontPillTextSelected: {
    color: '#fff',
  },
  // Cover display text (static, not TextInput)
  coverDisplayText: {
    fontSize: 28,
    textAlign: 'center',
    padding: 30,
    maxWidth: '100%',
    zIndex: 3,
  },
  coverPlaceholder: {
    fontSize: 18,
    textAlign: 'center',
    zIndex: 3,
  },
  // Text Editor Modal
  textEditorOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 10, 18, 0.9)',
  },
  textEditorContainer: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 40,
    marginTop: 60,
    overflow: 'hidden',
  },
  textEditorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  textEditorCancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  textEditorCancelText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  textEditorTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  textEditorDoneBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#2dd4bf',
    borderRadius: 16,
  },
  textEditorDoneText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0a0a12',
  },
  textEditorPreview: {
    marginTop: 20,
    borderRadius: 16,
    padding: 24,
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textEditorPreviewText: {
    fontSize: 24,
    textAlign: 'center',
  },
  blinkingCursor: {
    width: 3,
    height: 32,
    borderRadius: 2,
  },
  textEditorInput: {
    marginTop: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 16,
    padding: 16,
    fontSize: 18,
    color: '#fff',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  textEditorFonts: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    flexWrap: 'wrap',
  },
  textEditorFontPill: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(102, 126, 234, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.3)',
    borderRadius: 20,
  },
  textEditorFontPillSelected: {
    backgroundColor: 'rgba(102, 126, 234, 0.9)',
    borderColor: 'transparent',
  },
  textEditorFontPillText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  textEditorFontPillTextSelected: {
    color: '#fff',
  },
  // Slide 5: Final touches
  optionalSection: {},
  optionalField: {
    marginBottom: 20,
  },
  optionalLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.55)',
    marginBottom: 10,
  },
  spotsInputContainer: {
    position: 'relative',
  },
  spotsInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 18,
    paddingRight: 56,
    fontSize: 18,
    color: '#fff',
  },
  spotsInputIcon: {
    position: 'absolute',
    right: 18,
    top: '50%',
    transform: [{ translateY: -12 }],
    fontSize: 20,
  },
  optionalTextarea: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 18,
    fontSize: 16,
    color: '#fff',
    minHeight: 120,
    lineHeight: 24,
  },
  // Bottom actions
  bottomActions: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  nextBtn: {
    backgroundColor: '#2dd4bf',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  nextBtnCreate: {
    backgroundColor: '#fb7185',
  },
  nextBtnDisabled: {
    opacity: 0.6,
  },
  nextBtnText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#0a0a12',
  },
  nextBtnTextCreate: {
    color: '#fff',
  },
  // Color wheel button
  coverColorWheelBtn: {
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  rainbowWheel: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  // Color picker modal
  colorPickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  colorPickerContainer: {
    backgroundColor: '#1a1a2e',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  colorPickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  colorPicker: {
    gap: 16,
  },
  colorPreview: {
    height: 50,
    borderRadius: 12,
  },
  colorPanel: {
    height: 200,
    borderRadius: 12,
  },
  hueSlider: {
    height: 30,
    borderRadius: 15,
  },
  colorPickerButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  colorPickerCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
  },
  colorPickerCancelText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  colorPickerApplyBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#2dd4bf',
    alignItems: 'center',
  },
  colorPickerApplyText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0a0a12',
  },
});
