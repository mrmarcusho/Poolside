import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Switch,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SearchableDropdown, DropdownOption } from '../components/SearchableDropdown';
import { usersService } from '../api/services/users';

const { width } = Dimensions.get('window');

// Mock location options - in production this would come from an API
const LOCATION_OPTIONS: DropdownOption[] = [
  { id: 'san-diego-ca', label: 'San Diego, California', icon: '🏙' },
  { id: 'los-angeles-ca', label: 'Los Angeles, California', icon: '🏙' },
  { id: 'san-francisco-ca', label: 'San Francisco, California', icon: '🏙' },
  { id: 'new-york-ny', label: 'New York, New York', icon: '🏙' },
  { id: 'miami-fl', label: 'Miami, Florida', icon: '🏙' },
  { id: 'austin-tx', label: 'Austin, Texas', icon: '🏙' },
  { id: 'seattle-wa', label: 'Seattle, Washington', icon: '🏙' },
  { id: 'denver-co', label: 'Denver, Colorado', icon: '🏙' },
  { id: 'boston-ma', label: 'Boston, Massachusetts', icon: '🏙' },
  { id: 'chicago-il', label: 'Chicago, Illinois', icon: '🏙' },
  { id: 'prefer-not-say-location', label: 'Prefer not to say', icon: '🚫', isSpecial: true },
];

// Mock school options - in production this would come from an API
const SCHOOL_OPTIONS: DropdownOption[] = [
  { id: 'ucla', label: 'UCLA - University of California, Los Angeles', icon: '🎓' },
  { id: 'usc', label: 'USC - University of Southern California', icon: '🎓' },
  { id: 'stanford', label: 'Stanford University', icon: '🎓' },
  { id: 'berkeley', label: 'UC Berkeley', icon: '🎓' },
  { id: 'ucsd', label: 'UC San Diego', icon: '🎓' },
  { id: 'nyu', label: 'New York University', icon: '🎓' },
  { id: 'harvard', label: 'Harvard University', icon: '🎓' },
  { id: 'mit', label: 'MIT - Massachusetts Institute of Technology', icon: '🎓' },
  { id: 'not-in-college', label: 'Not in college yet', icon: '📚', isSpecial: true },
  { id: 'prefer-not-say-school', label: 'Prefer not to say', icon: '🚫', isSpecial: true },
];

// Available interest options
const INTEREST_OPTIONS = [
  { emoji: '🎶', label: 'Live Music' },
  { emoji: '🏊', label: 'Swimming' },
  { emoji: '🍴', label: 'Foodie' },
  { emoji: '📷', label: 'Photography' },
  { emoji: '🎮', label: 'Gaming' },
  { emoji: '🏃', label: 'Fitness' },
  { emoji: '🎨', label: 'Art' },
  { emoji: '✈️', label: 'Travel' },
  { emoji: '📖', label: 'Reading' },
  { emoji: '🎬', label: 'Movies' },
];

interface EditProfileScreenProps {
  visible: boolean;
  onClose: () => void;
  initialData: {
    name: string;
    age: number;
    location: string;
    school: string;
    bio: string;
    interests: { emoji: string; label: string }[];
    photo: string;
    showEventsHosted: boolean;
    showEventsAttended: boolean;
  };
  onSave: (data: any) => void;
}

export const EditProfileScreen: React.FC<EditProfileScreenProps> = ({
  visible,
  onClose,
  initialData,
  onSave,
}) => {
  const [name, setName] = useState(initialData.name);
  const [age, setAge] = useState(initialData.age.toString());
  const [locationId, setLocationId] = useState<string | null>(
    LOCATION_OPTIONS.find(opt => opt.label === initialData.location)?.id || null
  );
  const [schoolId, setSchoolId] = useState<string | null>(
    SCHOOL_OPTIONS.find(opt => opt.label.includes(initialData.school.split(' ')[0]))?.id || null
  );
  const [bio, setBio] = useState(initialData.bio);
  const [interests, setInterests] = useState(initialData.interests);
  const [showEventsHosted, setShowEventsHosted] = useState(initialData.showEventsHosted);
  const [showEventsAttended, setShowEventsAttended] = useState(initialData.showEventsAttended);
  const [showInterestPicker, setShowInterestPicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Re-sync state when modal opens with new initialData
  useEffect(() => {
    if (visible) {
      setName(initialData.name);
      setAge(initialData.age.toString());
      setLocationId(
        LOCATION_OPTIONS.find(opt => opt.label === initialData.location)?.id || null
      );
      setSchoolId(
        initialData.school
          ? SCHOOL_OPTIONS.find(opt => opt.label.includes(initialData.school.split(' ')[0]))?.id || null
          : null
      );
      setBio(initialData.bio);
      setInterests(initialData.interests);
      setShowEventsHosted(initialData.showEventsHosted);
      setShowEventsAttended(initialData.showEventsAttended);
      setShowInterestPicker(false);
    }
  }, [visible, initialData]);

  const BIO_MAX_LENGTH = 300;

  const handleSave = async () => {
    const selectedLocation = LOCATION_OPTIONS.find(opt => opt.id === locationId);
    const selectedSchool = SCHOOL_OPTIONS.find(opt => opt.id === schoolId);

    setIsSaving(true);

    try {
      // Call the API to update the profile
      // Use null (not undefined) to explicitly clear fields
      const updatedUser = await usersService.updateProfile({
        name,
        age: parseInt(age, 10) || null,
        location: selectedLocation?.label || null,
        school: selectedSchool?.label || null,
        bio: bio || null,
        interests,
      });

      // Pass the updated data back to the parent
      onSave({
        name: updatedUser.name,
        age: updatedUser.age || parseInt(age, 10),
        location: updatedUser.location || '',
        school: updatedUser.school || '',
        bio: updatedUser.bio || '',
        interests: updatedUser.interests || interests,
        showEventsHosted,
        showEventsAttended,
      });
      onClose();
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to update profile. Please try again.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveInterest = (index: number) => {
    setInterests(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddInterest = (interest: { emoji: string; label: string }) => {
    if (!interests.some(i => i.label === interest.label)) {
      setInterests(prev => [...prev, interest]);
    }
    setShowInterestPicker(false);
  };

  const availableInterests = INTEREST_OPTIONS.filter(
    opt => !interests.some(i => i.label === opt.label)
  );

  const insets = useSafeAreaInsets();

  if (!visible) return null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelBtn}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <TouchableOpacity
            style={[styles.doneBtn, isSaving && styles.doneBtnDisabled]}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.doneBtnText}>Done</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Photo Section */}
          <View style={styles.photoSection}>
            <View style={styles.mainPhoto}>
              {initialData.photo ? (
                <Image source={{ uri: initialData.photo }} style={styles.photoImage} />
              ) : (
                <View style={styles.emptyPhotoPlaceholder}>
                  <View style={styles.emptyPhotoPlusIcon}>
                    <Text style={styles.emptyPhotoPlusText}>+</Text>
                  </View>
                  <Text style={styles.emptyPhotoTitle}>Add Photos</Text>
                  <Text style={styles.emptyPhotoSubtitle}>Tap to upload your first photo</Text>
                </View>
              )}
              <TouchableOpacity style={styles.changePhotoBtn}>
                <Text style={styles.changePhotoBtnText}>📷 {initialData.photo ? 'Change Photo' : 'Add Photo'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Form Section */}
          <View style={styles.formSection}>
            {/* Name and Age inline */}
            <View style={styles.inlineGroup}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>NAME</Text>
                <TextInput
                  style={styles.formInput}
                  value={name}
                  onChangeText={setName}
                  placeholder="Your name"
                  placeholderTextColor="rgba(255, 255, 255, 0.25)"
                />
              </View>
              <View style={[styles.formGroup, { width: 80 }]}>
                <Text style={styles.formLabel}>AGE</Text>
                <TextInput
                  style={styles.formInput}
                  value={age}
                  onChangeText={setAge}
                  placeholder="Age"
                  placeholderTextColor="rgba(255, 255, 255, 0.25)"
                  keyboardType="number-pad"
                  maxLength={2}
                />
              </View>
            </View>

            {/* Location Dropdown */}
            <SearchableDropdown
              label="Location"
              placeholder="Search your city..."
              searchPlaceholder="Search city or town..."
              options={LOCATION_OPTIONS}
              value={locationId}
              onSelect={(option) => setLocationId(option?.id || null)}
              icon="🏙"
            />

            {/* School Dropdown */}
            <SearchableDropdown
              label="School"
              placeholder="Search your university..."
              searchPlaceholder="Search university..."
              options={SCHOOL_OPTIONS}
              value={schoolId}
              onSelect={(option) => setSchoolId(option?.id || null)}
              icon="🎓"
            />

            {/* Bio */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>BIO</Text>
              <TextInput
                style={styles.formTextarea}
                value={bio}
                onChangeText={(text) => setBio(text.slice(0, BIO_MAX_LENGTH))}
                placeholder="Tell us about yourself..."
                placeholderTextColor="rgba(255, 255, 255, 0.25)"
                multiline
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>
                {bio.length} / {BIO_MAX_LENGTH}
              </Text>
            </View>

            {/* Interests */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>INTERESTS</Text>
              <View style={styles.tagsSection}>
                {interests.map((interest, index) => (
                  <View key={interest.label} style={styles.tagItem}>
                    <Text style={styles.tagText}>
                      {interest.emoji} {interest.label}
                    </Text>
                    <TouchableOpacity
                      style={styles.removeTag}
                      onPress={() => handleRemoveInterest(index)}
                    >
                      <Text style={styles.removeTagText}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
                <TouchableOpacity
                  style={styles.addTagBtn}
                  onPress={() => setShowInterestPicker(!showInterestPicker)}
                >
                  <Text style={styles.addTagBtnText}>+ Add</Text>
                </TouchableOpacity>
              </View>

              {/* Interest Picker */}
              {showInterestPicker && availableInterests.length > 0 && (
                <View style={styles.interestPicker}>
                  {availableInterests.map((interest) => (
                    <TouchableOpacity
                      key={interest.label}
                      style={styles.interestOption}
                      onPress={() => handleAddInterest(interest)}
                    >
                      <Text style={styles.interestOptionText}>
                        {interest.emoji} {interest.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Privacy Settings */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>PRIVACY</Text>

              <View style={styles.toggleGroup}>
                <Text style={styles.toggleText}>Show events I've hosted</Text>
                <Switch
                  value={showEventsHosted}
                  onValueChange={setShowEventsHosted}
                  trackColor={{ false: 'rgba(255, 255, 255, 0.15)', true: '#667eea' }}
                  thumbColor="#fff"
                />
              </View>

              <View style={styles.toggleGroup}>
                <Text style={styles.toggleText}>Show events I've attended</Text>
                <Switch
                  value={showEventsAttended}
                  onValueChange={setShowEventsAttended}
                  trackColor={{ false: 'rgba(255, 255, 255, 0.15)', true: '#667eea' }}
                  thumbColor="#fff"
                />
              </View>
            </View>

            {/* Bottom padding */}
            <View style={{ height: 100 }} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
    backgroundColor: '#0a0a0f',
  },
  cancelBtn: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
  doneBtn: {
    backgroundColor: '#667eea',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  doneBtnDisabled: {
    opacity: 0.6,
  },
  doneBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  photoSection: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  mainPhoto: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  emptyPhotoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  emptyPhotoPlusIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyPhotoPlusText: {
    fontSize: 32,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  emptyPhotoTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.4)',
  },
  emptyPhotoSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.25)',
  },
  changePhotoBtn: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  changePhotoBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
  formSection: {
    paddingHorizontal: 20,
  },
  inlineGroup: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.4)',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  formInput: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.15)',
    fontSize: 16,
    color: '#fff',
  },
  formTextarea: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.15)',
    fontSize: 16,
    color: '#fff',
    minHeight: 80,
    lineHeight: 24,
  },
  charCount: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.3)',
    textAlign: 'right',
    marginTop: 6,
  },
  tagsSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingTop: 8,
  },
  tagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 25,
  },
  tagText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  removeTag: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeTagText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  addTagBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 25,
  },
  addTagBtnText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  interestPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 12,
  },
  interestOption: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(102, 126, 234, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.3)',
    borderRadius: 20,
  },
  interestOptionText: {
    fontSize: 13,
    color: '#a5b4fc',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 28,
  },
  toggleGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  toggleText: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.9)',
  },
});
