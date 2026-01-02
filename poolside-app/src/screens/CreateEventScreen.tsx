import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
  LayoutRectangle,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
// NOTE: expo-image-picker is dynamically imported in handlePickImage to prevent crash on screen load
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { eventsService } from '../api/services/events';
import { useAuth } from '../context/AuthContext';
import { useEventCreationAnimation } from '../context/EventCreationAnimationContext';
// import { useEventsContext } from '../context/EventsContext';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const TIME_OPTIONS = [
  '12:00 AM', '12:15 AM', '12:30 AM', '12:45 AM',
  '1:00 AM', '1:15 AM', '1:30 AM', '1:45 AM',
  '2:00 AM', '2:15 AM', '2:30 AM', '2:45 AM',
  '3:00 AM', '3:15 AM', '3:30 AM', '3:45 AM',
  '4:00 AM', '4:15 AM', '4:30 AM', '4:45 AM',
  '5:00 AM', '5:15 AM', '5:30 AM', '5:45 AM',
  '6:00 AM', '6:15 AM', '6:30 AM', '6:45 AM',
  '7:00 AM', '7:15 AM', '7:30 AM', '7:45 AM',
  '8:00 AM', '8:15 AM', '8:30 AM', '8:45 AM',
  '9:00 AM', '9:15 AM', '9:30 AM', '9:45 AM',
  '10:00 AM', '10:15 AM', '10:30 AM', '10:45 AM',
  '11:00 AM', '11:15 AM', '11:30 AM', '11:45 AM',
  '12:00 PM', '12:15 PM', '12:30 PM', '12:45 PM',
  '1:00 PM', '1:15 PM', '1:30 PM', '1:45 PM',
  '2:00 PM', '2:15 PM', '2:30 PM', '2:45 PM',
  '3:00 PM', '3:15 PM', '3:30 PM', '3:45 PM',
  '4:00 PM', '4:15 PM', '4:30 PM', '4:45 PM',
  '5:00 PM', '5:15 PM', '5:30 PM', '5:45 PM',
  '6:00 PM', '6:15 PM', '6:30 PM', '6:45 PM',
  '7:00 PM', '7:15 PM', '7:30 PM', '7:45 PM',
  '8:00 PM', '8:15 PM', '8:30 PM', '8:45 PM',
  '9:00 PM', '9:15 PM', '9:30 PM', '9:45 PM',
  '10:00 PM', '10:15 PM', '10:30 PM', '10:45 PM',
  '11:00 PM', '11:15 PM', '11:30 PM', '11:45 PM',
];

const COVER_COLORS = [
  { name: 'white', color: '#ffffff' },
  { name: 'pink', color: '#FFB6C1' },
  { name: 'mint', color: '#98FB98' },
  { name: 'sky', color: '#87CEEB' },
  { name: 'lavender', color: '#E6E6FA' },
  { name: 'peach', color: '#FFDAB9' },
  { name: 'yellow', color: '#FFFACD' },
];

const FONT_OPTIONS = [
  { name: 'Sans', fontFamily: 'System' },
  { name: 'Serif', fontFamily: 'Georgia' },
  { name: 'Script', fontFamily: 'System' },
  { name: 'Display', fontFamily: 'System' },
  { name: 'Marker', fontFamily: 'System' },
];

export const CreateEventScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const navigation = useNavigation();
  const { triggerAnimation } = useEventCreationAnimation();
  const timePickerRef = useRef<ScrollView>(null);
  const formRef = useRef<View>(null);

  // Form state
  const [title, setTitle] = useState('Untitled Event');
  const [coverText, setCoverText] = useState('');
  const [coverColor, setCoverColor] = useState('#ffffff');
  const [coverFont, setCoverFont] = useState('Sans');
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [location, setLocation] = useState('');
  const [spots, setSpots] = useState('');
  const [description, setDescription] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState('6:00 PM');

  // UI state
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Temp state for date picker
  const [tempDate, setTempDate] = useState<Date | null>(null);
  const [tempTime, setTempTime] = useState('6:00 PM');

  // Scroll to selected time when modal opens
  useEffect(() => {
    if (isDatePickerVisible && timePickerRef.current) {
      const timeIndex = TIME_OPTIONS.indexOf(tempTime);
      if (timeIndex > 0) {
        const scrollPosition = Math.max(0, (timeIndex - 2) * 50);
        setTimeout(() => {
          timePickerRef.current?.scrollTo({ y: scrollPosition, animated: false });
        }, 100);
      }
    }
  }, [isDatePickerVisible]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return { firstDay, daysInMonth };
  };

  const { firstDay, daysInMonth } = getDaysInMonth(currentMonth);

  // Check if a specific day in the current calendar month is in the past
  const isPastDay = (day: number) => {
    const now = new Date();
    const checkDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    // Set both to start of day for comparison
    now.setHours(0, 0, 0, 0);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate < now;
  };

  // Check if current calendar month is the current month (to prevent going further back)
  const isCurrentMonth = () => {
    const now = new Date();
    return currentMonth.getFullYear() === now.getFullYear() &&
           currentMonth.getMonth() === now.getMonth();
  };

  const handlePrevMonth = () => {
    // Don't allow navigating to past months
    if (isCurrentMonth()) return;
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleDateSelect = (day: number) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    setTempDate(newDate);
  };

  const handleOpenDatePicker = () => {
    setTempDate(selectedDate);
    setTempTime(selectedTime);
    if (!selectedDate) {
      setCurrentMonth(new Date());
    }
    setIsDatePickerVisible(true);
  };

  const handleDatePickerDone = () => {
    if (tempDate) {
      setSelectedDate(tempDate);
      setSelectedTime(tempTime);
    }
    setIsDatePickerVisible(false);
  };

  const handleDatePickerClear = () => {
    setTempDate(null);
    setTempTime('6:00 PM');
  };

  const formatSelectedDateTime = () => {
    if (!selectedDate) return 'Set a date...';
    const dayName = SHORT_DAYS[selectedDate.getDay()];
    const monthName = SHORT_MONTHS[selectedDate.getMonth()];
    const day = selectedDate.getDate();
    return `${dayName} ${monthName} ${day}, ${selectedTime}`;
  };

  const handlePickImage = async () => {
    // Dynamically import expo-image-picker to prevent crash on screen load
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
    if (title === 'Untitled Event' || !title.trim()) {
      Alert.alert('Missing Title', 'Please enter a title for your event.');
      return;
    }
    if (title.trim().length < 3) {
      Alert.alert('Title Too Short', 'Title must be at least 3 characters.');
      return;
    }
    if (!selectedDate) {
      Alert.alert('Missing Date', 'Please select a date and time for your event.');
      return;
    }
    if (!location.trim()) {
      Alert.alert('Missing Location', 'Please enter a location for your event.');
      return;
    }

    // Description must be at least 10 characters (backend requirement)
    const eventDescription = description.trim() || `${title.trim()} event`;
    if (eventDescription.length < 10) {
      Alert.alert('Description Too Short', 'Please add a description (at least 10 characters).');
      return;
    }

    // Build the full dateTime to validate it's in the future
    const [time, period] = selectedTime.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    let hour24 = hours;
    if (period === 'PM' && hours !== 12) hour24 += 12;
    if (period === 'AM' && hours === 12) hour24 = 0;

    const dateTime = new Date(selectedDate);
    dateTime.setHours(hour24, minutes, 0, 0);

    // Validate the event is in the future
    if (dateTime.getTime() <= Date.now()) {
      Alert.alert('Invalid Date', 'Please select a date and time in the future.');
      return;
    }

    setIsCreating(true);

    try {
      const eventData = {
        title: title.trim(),
        description: eventDescription,
        locationName: location.trim(),
        dateTime: dateTime.toISOString(),
      };
      console.log('Creating event with data:', JSON.stringify(eventData, null, 2));

      await eventsService.createEvent(eventData);

      // Measure form position for animation
      formRef.current?.measureInWindow((x, y, width, height) => {
        const formPosition: LayoutRectangle = { x, y, width, height };

        // Trigger the toss animation
        triggerAnimation(formPosition, {
          title: title.trim(),
          dateTime: formatSelectedDateTime(),
          location: location.trim(),
          coverColor: coverColor,
          coverImage: coverImage,
        });

        // Reset form after a short delay
        setTimeout(() => {
          setTitle('Untitled Event');
          setCoverText('');
          setCoverColor('#ffffff');
          setCoverImage(null);
          setLocation('');
          setSpots('');
          setDescription('');
          setSelectedDate(null);
          setSelectedTime('6:00 PM');

          // Navigate to feed after animation starts
          navigation.navigate('Feed' as never);
        }, 100);
      });
    } catch (error: any) {
      console.error('Failed to create event:', error);
      console.error('Error response data:', JSON.stringify(error.response?.data, null, 2));
      // Handle NestJS validation errors (message can be string or array)
      const errorMessage = error.response?.data?.message;
      const displayMessage = Array.isArray(errorMessage)
        ? errorMessage.join('\n')
        : errorMessage || 'Failed to create event. Please try again.';
      Alert.alert('Error', displayMessage);
    } finally {
      setIsCreating(false);
    }
  };

  const renderCalendarDays = () => {
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.calendarDay} />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const isSelected = tempDate &&
        tempDate.getDate() === day &&
        tempDate.getMonth() === currentMonth.getMonth() &&
        tempDate.getFullYear() === currentMonth.getFullYear();
      const isPast = isPastDay(day);

      days.push(
        <TouchableOpacity
          key={day}
          style={styles.calendarDay}
          onPress={() => !isPast && handleDateSelect(day)}
          disabled={isPast}
        >
          {isSelected ? (
            <View style={styles.selectedDay}>
              <Text style={styles.selectedDayText}>{day}</Text>
            </View>
          ) : (
            <Text style={[styles.calendarDayText, isPast && styles.calendarDayTextDisabled]}>{day}</Text>
          )}
        </TouchableOpacity>
      );
    }

    return days;
  };

  const getUserInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return 'MH';
  };

  const getUserName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return 'Marcus Ho';
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a1a3e', '#0d0d2b']}
        style={StyleSheet.absoluteFill}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Title Card - This is the element we'll animate */}
          <View ref={formRef} collapsable={false}>
          <BlurView intensity={40} tint="dark" style={styles.titleCard}>
            <TextInput
              style={styles.titleInput}
              value={title}
              onChangeText={setTitle}
              placeholder="Untitled Event"
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              textAlign="center"
            />
          </BlurView>

          {/* Cover Image Section */}
          <View style={styles.coverContainer}>
            {coverImage ? (
              <Image source={{ uri: coverImage }} style={styles.coverImage} />
            ) : (
              <View style={[styles.coverCanvas, { backgroundColor: coverColor }]}>
                <TextInput
                  style={[styles.coverTextInput, { color: coverColor === '#ffffff' ? '#333' : '#fff' }]}
                  value={coverText}
                  onChangeText={setCoverText}
                  placeholder="Type something..."
                  placeholderTextColor={coverColor === '#ffffff' ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.5)'}
                  multiline
                  textAlign="center"
                />
              </View>
            )}
            <TouchableOpacity style={styles.uploadImageBtn} onPress={handlePickImage}>
              <Ionicons name="image-outline" size={18} color="#fff" />
              <Text style={styles.uploadImageText}>Upload image</Text>
            </TouchableOpacity>
          </View>

          {/* Customization Bar - only show when no image */}
          {!coverImage && (
            <View style={styles.customizationBar}>
              <View style={styles.colorPicker}>
                {COVER_COLORS.map((c) => (
                  <TouchableOpacity
                    key={c.name}
                    style={[
                      styles.colorOption,
                      { backgroundColor: c.color },
                      coverColor === c.color && styles.colorOptionActive,
                    ]}
                    onPress={() => setCoverColor(c.color)}
                  />
                ))}
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.fontSelector}>
                {FONT_OPTIONS.map((f) => (
                  <TouchableOpacity
                    key={f.name}
                    style={[
                      styles.fontOption,
                      coverFont === f.name && styles.fontOptionActive,
                    ]}
                    onPress={() => setCoverFont(f.name)}
                  >
                    <Text style={styles.fontOptionText}>{f.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Date Selector */}
          <TouchableOpacity style={styles.dateSelector} onPress={handleOpenDatePicker}>
            <Text style={[styles.dateSelectorText, selectedDate && styles.dateSelectorTextActive]}>
              {formatSelectedDateTime()}
            </Text>
            <Ionicons name="chevron-down" size={16} color="rgba(255,255,255,0.6)" />
          </TouchableOpacity>

          {/* Form Section */}
          <BlurView intensity={20} tint="dark" style={styles.formSection}>
            {/* Host Section */}
            <View style={styles.hostSection}>
              <View style={styles.hostRow}>
                <View style={styles.hostInfo}>
                  <LinearGradient
                    colors={['#6366f1', '#8b5cf6']}
                    style={styles.avatar}
                  >
                    <Text style={styles.avatarText}>{getUserInitials()}</Text>
                  </LinearGradient>
                  <Text style={styles.hostName}>{getUserName()}</Text>
                </View>
                <TouchableOpacity style={styles.addCohostsBtn}>
                  <Text style={styles.addCohostsBtnText}>+ Add cohosts</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Location */}
            <View style={styles.formField}>
              <View style={styles.formFieldIcon}>
                <Ionicons name="location-outline" size={20} color="rgba(255,255,255,0.5)" />
              </View>
              <TextInput
                style={styles.formFieldInput}
                value={location}
                onChangeText={setLocation}
                placeholder="Location"
                placeholderTextColor="rgba(255,255,255,0.5)"
              />
            </View>

            {/* Spots */}
            <View style={styles.formField}>
              <View style={styles.formFieldIcon}>
                <Ionicons name="people-outline" size={20} color="rgba(255,255,255,0.5)" />
              </View>
              <TextInput
                style={styles.formFieldInput}
                value={spots}
                onChangeText={setSpots}
                placeholder="Unlimited spots"
                placeholderTextColor="rgba(255,255,255,0.5)"
                keyboardType="number-pad"
              />
            </View>

            {/* Description */}
            <View style={styles.descriptionField}>
              <TextInput
                style={styles.descriptionInput}
                value={description}
                onChangeText={setDescription}
                placeholder="Add a description of your event"
                placeholderTextColor="rgba(255,255,255,0.4)"
                multiline
                textAlignVertical="top"
              />
            </View>
          </BlurView>

          {/* Create Button */}
          <TouchableOpacity
            style={[styles.createBtn, isCreating && styles.createBtnDisabled]}
            onPress={handleCreate}
            disabled={isCreating}
          >
            {isCreating ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.createBtnText}>Create Event</Text>
            )}
          </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Date Picker Modal */}
      <Modal
        visible={isDatePickerVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setIsDatePickerVisible(false)}
      >
        <View style={[styles.modalContainer, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
          <View style={styles.modalSafeArea}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={handleDatePickerClear} style={styles.modalHeaderBtn}>
                <Text style={styles.modalClearBtn}>Clear</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Date & Time</Text>
              <TouchableOpacity onPress={handleDatePickerDone} style={styles.modalHeaderBtn}>
                <Text style={styles.modalDoneBtn}>Done</Text>
              </TouchableOpacity>
            </View>

            {/* Selected DateTime Display */}
            <View style={styles.selectedDateTimeRow}>
              <Text style={styles.selectedDateTimeText}>
                {tempDate
                  ? `${SHORT_DAYS[tempDate.getDay()]} ${SHORT_MONTHS[tempDate.getMonth()]} ${tempDate.getDate()}, ${tempTime}`
                  : `Select a date, ${tempTime}`
                }
              </Text>
            </View>

            {/* Calendar */}
            <View style={styles.calendarSection}>
              <View style={styles.monthHeader}>
                <View style={styles.monthName}>
                  <Text style={styles.monthNameText}>
                    {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                  </Text>
                  <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.5)" />
                </View>
                <View style={styles.navArrows}>
                  <TouchableOpacity
                    onPress={handlePrevMonth}
                    style={styles.navArrowBtn}
                    disabled={isCurrentMonth()}
                  >
                    <Text style={[styles.navArrowText, isCurrentMonth() && styles.navArrowTextDisabled]}>‹</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleNextMonth} style={styles.navArrowBtn}>
                    <Text style={styles.navArrowText}>›</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.daysHeader}>
                {DAYS.map(day => (
                  <Text key={day} style={styles.dayHeaderText}>{day}</Text>
                ))}
              </View>

              <View style={styles.calendarGrid}>
                {renderCalendarDays()}
              </View>
            </View>

            {/* Time Picker */}
            <ScrollView
              ref={timePickerRef}
              style={styles.timePicker}
              contentContainerStyle={styles.timePickerContent}
              showsVerticalScrollIndicator={false}
            >
              {TIME_OPTIONS.map((time) => {
                const isSelected = time === tempTime;
                return (
                  <TouchableOpacity
                    key={time}
                    style={[
                      styles.timeOption,
                      isSelected && styles.timeOptionSelected
                    ]}
                    onPress={() => setTempTime(time)}
                  >
                    <Text style={[
                      styles.timeOptionText,
                      isSelected && styles.timeOptionTextSelected
                    ]}>
                      {time}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0d2b',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  // Title Card
  titleCard: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(100, 100, 180, 0.3)',
  },
  titleInput: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  // Cover Image
  coverContainer: {
    width: '100%',
    height: 280,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    position: 'relative',
  },
  coverCanvas: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  coverTextInput: {
    width: '90%',
    fontSize: 36,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 44,
  },
  uploadImageBtn: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(80, 80, 140, 0.9)',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  uploadImageText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
  // Customization Bar
  customizationBar: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
    padding: 12,
    backgroundColor: 'rgba(40, 40, 80, 0.5)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(60, 60, 100, 0.3)',
  },
  colorPicker: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  colorOption: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorOptionActive: {
    borderColor: '#fff',
  },
  fontSelector: {
    flex: 1,
  },
  fontOption: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(60, 60, 100, 0.5)',
    borderRadius: 16,
    marginRight: 6,
    borderWidth: 1,
    borderColor: 'rgba(100, 100, 160, 0.3)',
  },
  fontOptionActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.6)',
    borderColor: 'rgba(99, 102, 241, 0.8)',
  },
  fontOptionText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
  },
  // Date Selector
  dateSelector: {
    backgroundColor: 'rgba(40, 40, 80, 0.6)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(80, 80, 140, 0.3)',
  },
  dateSelectorText: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  dateSelectorTextActive: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  // Form Section
  formSection: {
    borderRadius: 16,
    padding: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(60, 60, 100, 0.3)',
    marginBottom: 20,
  },
  // Host Section
  hostSection: {
    marginBottom: 16,
  },
  hostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hostInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  hostName: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  addCohostsBtn: {
    backgroundColor: 'rgba(60, 60, 100, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(100, 100, 160, 0.4)',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  addCohostsBtnText: {
    color: '#fff',
    fontSize: 13,
  },
  // Form Fields
  formField: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(60, 60, 100, 0.3)',
  },
  formFieldIcon: {
    width: 24,
    marginRight: 14,
  },
  formFieldInput: {
    flex: 1,
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  // Description
  descriptionField: {
    paddingTop: 16,
  },
  descriptionInput: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.9)',
    minHeight: 100,
    lineHeight: 22,
  },
  // Create Button
  createBtn: {
    backgroundColor: '#667eea',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
  },
  createBtnDisabled: {
    opacity: 0.6,
  },
  createBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: '#151528',
  },
  modalSafeArea: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalHeaderBtn: {
    minWidth: 50,
  },
  modalClearBtn: {
    fontSize: 17,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  modalDoneBtn: {
    fontSize: 17,
    fontWeight: '500',
    color: '#fff',
    textAlign: 'right',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
  },
  // Selected DateTime Row
  selectedDateTimeRow: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginBottom: 16,
  },
  selectedDateTimeText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  // Calendar
  calendarSection: {
    paddingHorizontal: 24,
    marginBottom: 40,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  monthName: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  monthNameText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  navArrows: {
    flexDirection: 'row',
    gap: 24,
  },
  navArrowBtn: {
    padding: 8,
  },
  navArrowText: {
    fontSize: 22,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  navArrowTextDisabled: {
    color: 'rgba(255, 255, 255, 0.1)',
  },
  daysHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  dayHeaderText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.4)',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.28%',
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  calendarDayText: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  calendarDayTextDisabled: {
    color: 'rgba(255, 255, 255, 0.2)',
  },
  selectedDay: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(80, 80, 120, 0.6)',
  },
  selectedDayText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#fff',
  },
  // Time Picker
  timePicker: {
    flex: 1,
    marginHorizontal: 16,
  },
  timePickerContent: {
    paddingBottom: 40,
  },
  timeOption: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginVertical: 2,
    alignItems: 'center',
  },
  timeOptionSelected: {
    backgroundColor: 'rgba(60, 60, 90, 0.6)',
  },
  timeOptionText: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  timeOptionTextSelected: {
    fontWeight: '500',
    color: '#fff',
  },
});
