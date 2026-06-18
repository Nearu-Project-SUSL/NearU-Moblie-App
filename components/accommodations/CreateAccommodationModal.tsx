import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  useColorScheme,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { Accommodation } from '../../types/accommodation';
import { createAccommodation, updateAccommodation } from '../../services/accommodation';
import { Colors } from '../../constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Camera, Image as ImageIcon } from 'lucide-react-native';
import { HapticService } from '../../services/HapticService';
import * as ImagePicker from 'expo-image-picker';

interface CreateAccommodationModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  accommodationToEdit?: Accommodation | null;
}

const ACCOMMODATION_TYPES = ['Boarding', 'Annex', 'Apartment'];
const THEME_ACCENT = '#10B981'; // Emerald Green accent

export const CreateAccommodationModal: React.FC<CreateAccommodationModalProps> = ({
  visible,
  onClose,
  onSuccess,
  accommodationToEdit = null,
}) => {
  const systemTheme = useColorScheme() ?? 'light';
  const themeColors = Colors[systemTheme];
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Boarding');
  const [location, setLocation] = useState('');
  const [distanceKm, setDistanceKm] = useState('');
  const [monthlyRent, setMonthlyRent] = useState('');
  const [availableBeds, setAvailableBeds] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);

  // Validation
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  // Pre-populate if editing
  useEffect(() => {
    if (accommodationToEdit) {
      setTitle(accommodationToEdit.title);
      setType(accommodationToEdit.type);
      setLocation(accommodationToEdit.location);
      setDistanceKm(accommodationToEdit.distanceKm.toString());
      setMonthlyRent(accommodationToEdit.monthlyRent.toString());
      setAvailableBeds(accommodationToEdit.availableBeds.toString());
      setContactPhone(accommodationToEdit.contactPhone);
      setDescription(accommodationToEdit.description);
      setImageUri(accommodationToEdit.image || null);
    } else {
      setTitle('');
      setType('Boarding');
      setLocation('');
      setDistanceKm('');
      setMonthlyRent('');
      setAvailableBeds('');
      setContactPhone('');
      setDescription('');
      setImageUri(null);
    }
    setErrors({});
  }, [accommodationToEdit, visible]);

  const handlePickImage = async () => {
    HapticService.triggerSelection();
    
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Media library access is required to upload a cover photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, boolean> = {};
    if (!title.trim()) newErrors.title = true;
    if (!location.trim()) newErrors.location = true;
    if (!contactPhone.trim()) newErrors.contactPhone = true;
    
    const rentNum = Number(monthlyRent);
    if (!monthlyRent.trim() || isNaN(rentNum) || rentNum <= 0) newErrors.monthlyRent = true;

    const bedsNum = Number(availableBeds);
    if (!availableBeds.trim() || isNaN(bedsNum) || bedsNum < 0) newErrors.availableBeds = true;

    const distNum = Number(distanceKm);
    if (!distanceKm.trim() || isNaN(distNum) || distNum < 0) newErrors.distanceKm = true;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    HapticService.triggerSelection();
    if (!validate()) {
      HapticService.triggerError();
      Alert.alert('Incomplete Form', 'Please correct the highlighted fields.');
      return;
    }

    setLoading(true);

    let photoData = null;
    if (imageUri && !imageUri.startsWith('http')) {
      const filename = imageUri.split('/').pop() || 'accommodation.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const fileType = match ? `image/${match[1]}` : `image/jpeg`;
      photoData = {
        uri: imageUri,
        name: filename,
        type: fileType,
      };
    }

    try {
      const payload = {
        title: title.trim(),
        type: type,
        location: location.trim(),
        distanceKm: Number(distanceKm),
        monthlyRent: Number(monthlyRent),
        availableBeds: Number(availableBeds),
        contactPhone: contactPhone.trim(),
        description: description.trim(),
        image: photoData,
      };

      if (accommodationToEdit) {
        await updateAccommodation(accommodationToEdit.id, payload);
      } else {
        await createAccommodation(payload);
      }

      HapticService.triggerSuccess();
      onSuccess();
      onClose();
    } catch (err: any) {
      HapticService.triggerError();
      Alert.alert('Error', err.response?.data?.message || err.message || 'Failed to save accommodation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={[styles.root, { backgroundColor: themeColors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: themeColors.border, backgroundColor: themeColors.surface }]}>
          <Pressable
            onPress={() => {
              HapticService.triggerTap();
              onClose();
            }}
            style={styles.closeIconBtn}
          >
            <X size={22} color={themeColors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>
            {accommodationToEdit ? 'Update Place' : 'Register New Accommodation'}
          </Text>
          <View style={styles.closeIconPlaceholder} />
        </View>

        {/* Scrollable Form */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.formContent, { paddingBottom: insets.bottom + 120 }]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Cover Photo Picker */}
          <Pressable
            onPress={handlePickImage}
            style={[
              styles.imagePicker,
              {
                backgroundColor: themeColors.surfaceElevated,
                borderColor: themeColors.border,
              },
            ]}
          >
            {imageUri ? (
              <View style={StyleSheet.absoluteFill}>
                <Image source={{ uri: imageUri }} style={styles.pickedImage} />
                <View style={styles.imageOverlay}>
                  <Camera size={20} color="#FFFFFF" />
                  <Text style={styles.changeImageText}>Change Cover Photo</Text>
                </View>
              </View>
            ) : (
              <View style={styles.imagePlaceholder}>
                <ImageIcon size={40} color={themeColors.textMuted} />
                <Text style={[styles.imagePlaceholderText, { color: themeColors.textSecondary }]}>
                  Upload Cover Photo
                </Text>
                <Text style={{ color: themeColors.textMuted, fontSize: 11, marginTop: 2 }}>
                  Recommended: 16:9 Aspect Ratio
                </Text>
              </View>
            )}
          </Pressable>

          {/* Title */}
          <View style={styles.formGroup}>
            <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>
              Accommodation Name / Title <Text style={{ color: Colors.brand.logoCoral }}>*</Text>
            </Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Sunrise Student Boarding House"
              placeholderTextColor={themeColors.textMuted}
              style={[
                styles.textInput,
                {
                  color: themeColors.text,
                  backgroundColor: themeColors.surface,
                  borderColor: errors.title ? Colors.brand.logoCoral : themeColors.border,
                },
              ]}
            />
          </View>

          {/* Type Picker */}
          <View style={styles.formGroup}>
            <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>
              Type <Text style={{ color: Colors.brand.logoCoral }}>*</Text>
            </Text>
            <View style={styles.typeSelectorRow}>
              {ACCOMMODATION_TYPES.map((t) => {
                const active = type === t;
                return (
                  <Pressable
                    key={t}
                    onPress={() => {
                      HapticService.triggerSelection();
                      setType(t);
                    }}
                    style={[
                      styles.typeSelectorBtn,
                      {
                        backgroundColor: active ? THEME_ACCENT : themeColors.surface,
                        borderColor: active ? THEME_ACCENT : themeColors.border,
                      },
                    ]}
                  >
                    <Text style={[styles.typeSelectorText, { color: active ? '#FFFFFF' : themeColors.textSecondary }]}>
                      {t}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Location Address */}
          <View style={styles.formGroup}>
            <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>
              Address / Location <Text style={{ color: Colors.brand.logoCoral }}>*</Text>
            </Text>
            <TextInput
              value={location}
              onChangeText={setLocation}
              placeholder="e.g. No 15, Pambahinna Junction, Belihuloya"
              placeholderTextColor={themeColors.textMuted}
              style={[
                styles.textInput,
                {
                  color: themeColors.text,
                  backgroundColor: themeColors.surface,
                  borderColor: errors.location ? Colors.brand.logoCoral : themeColors.border,
                },
              ]}
            />
          </View>

          {/* Distance & Rent */}
          <View style={styles.rowGroup}>
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>
                Distance (km) <Text style={{ color: Colors.brand.logoCoral }}>*</Text>
              </Text>
              <TextInput
                value={distanceKm}
                onChangeText={setDistanceKm}
                placeholder="e.g. 0.8"
                keyboardType="numeric"
                placeholderTextColor={themeColors.textMuted}
                style={[
                  styles.textInput,
                  {
                    color: themeColors.text,
                    backgroundColor: themeColors.surface,
                    borderColor: errors.distanceKm ? Colors.brand.logoCoral : themeColors.border,
                  },
                ]}
              />
            </View>

            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>
                Rent (LKR/mo) <Text style={{ color: Colors.brand.logoCoral }}>*</Text>
              </Text>
              <TextInput
                value={monthlyRent}
                onChangeText={setMonthlyRent}
                placeholder="e.g. 15000"
                keyboardType="numeric"
                placeholderTextColor={themeColors.textMuted}
                style={[
                  styles.textInput,
                  {
                    color: themeColors.text,
                    backgroundColor: themeColors.surface,
                    borderColor: errors.monthlyRent ? Colors.brand.logoCoral : themeColors.border,
                  },
                ]}
              />
            </View>
          </View>

          {/* Beds & Phone */}
          <View style={styles.rowGroup}>
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>
                Available Beds <Text style={{ color: Colors.brand.logoCoral }}>*</Text>
              </Text>
              <TextInput
                value={availableBeds}
                onChangeText={setAvailableBeds}
                placeholder="e.g. 4"
                keyboardType="numeric"
                placeholderTextColor={themeColors.textMuted}
                style={[
                  styles.textInput,
                  {
                    color: themeColors.text,
                    backgroundColor: themeColors.surface,
                    borderColor: errors.availableBeds ? Colors.brand.logoCoral : themeColors.border,
                  },
                ]}
              />
            </View>

            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>
                Contact Phone <Text style={{ color: Colors.brand.logoCoral }}>*</Text>
              </Text>
              <TextInput
                value={contactPhone}
                onChangeText={setContactPhone}
                placeholder="e.g. 0771234567"
                keyboardType="phone-pad"
                placeholderTextColor={themeColors.textMuted}
                style={[
                  styles.textInput,
                  {
                    color: themeColors.text,
                    backgroundColor: themeColors.surface,
                    borderColor: errors.contactPhone ? Colors.brand.logoCoral : themeColors.border,
                  },
                ]}
              />
            </View>
          </View>

          {/* Description */}
          <View style={styles.formGroup}>
            <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>
              Description
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Provide detail about boarding facilities, amenities, environment, rules, etc."
              placeholderTextColor={themeColors.textMuted}
              style={[
                styles.textInput,
                styles.textArea,
                {
                  color: themeColors.text,
                  backgroundColor: themeColors.surface,
                  borderColor: themeColors.border,
                },
              ]}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { backgroundColor: themeColors.surface, borderTopColor: themeColors.border, paddingBottom: insets.bottom + 12 }]}>
          <Pressable
            onPress={handleSubmit}
            disabled={loading}
            style={[styles.submitBtn, { backgroundColor: THEME_ACCENT }]}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.submitBtnText}>
                {accommodationToEdit ? 'Save Changes' : 'Register Accommodation'}
              </Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    height: Platform.OS === 'ios' ? 96 : 76,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  closeIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  closeIconPlaceholder: {
    width: 40,
  },
  formContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 20,
  },
  formGroup: {
    gap: 8,
  },
  rowGroup: {
    flexDirection: 'row',
    gap: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  textInput: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    fontSize: 13,
    fontWeight: '600',
  },
  textArea: {
    height: 100,
    paddingVertical: 12,
  },
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typeSelectorBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeSelectorText: {
    fontSize: 12,
    fontWeight: '700',
  },
  imagePicker: {
    height: 180,
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  changeImageText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  imagePlaceholderText: {
    fontWeight: '700',
    fontSize: 13,
    marginTop: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    alignItems: 'center',
  },
  submitBtn: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
});
