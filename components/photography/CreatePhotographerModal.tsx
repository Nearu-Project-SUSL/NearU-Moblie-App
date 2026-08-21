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
import { Photographer } from '../../types/photography';
import { createPhotographer, updatePhotographer } from '../../services/photography';
import { Colors } from '../../constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Camera, Image as ImageIcon } from 'lucide-react-native';
import { HapticService } from '../../services/HapticService';
import * as ImagePicker from 'expo-image-picker';

interface CreatePhotographerModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  photographerToEdit?: Photographer | null;
}

const THEME_ACCENT = '#8B5CF6'; // Creative Violet/Purple

export const CreatePhotographerModal: React.FC<CreatePhotographerModalProps> = ({
  visible,
  onClose,
  onSuccess,
  photographerToEdit = null,
}) => {
  const systemTheme = useColorScheme() ?? 'light';
  const themeColors = Colors[systemTheme];
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [baseRatePerHour, setBaseRatePerHour] = useState('');
  const [locationName, setLocationName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);

  // Validation
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  // Pre-populate if editing
  useEffect(() => {
    if (photographerToEdit) {
      setName(photographerToEdit.name);
      setBio(photographerToEdit.bio ?? '');
      setBaseRatePerHour(photographerToEdit.baseRatePerHour.toString());
      setLocationName(photographerToEdit.locationName);
      setPhone(photographerToEdit.phone);
      setEmail(photographerToEdit.email ?? '');
      setImageUri(photographerToEdit.imageUrl ?? null);
    } else {
      setName('');
      setBio('');
      setBaseRatePerHour('');
      setLocationName('');
      setPhone('');
      setEmail('');
      setImageUri(null);
    }
    setErrors({});
  }, [photographerToEdit, visible]);

  const handlePickImage = async () => {
    HapticService.triggerSelection();
    
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Media library access is required to upload a profile cover.');
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
    if (!name.trim()) newErrors.name = true;
    if (!locationName.trim()) newErrors.locationName = true;
    if (!phone.trim()) newErrors.phone = true;
    
    const rateNum = Number(baseRatePerHour);
    if (!baseRatePerHour.trim() || isNaN(rateNum) || rateNum <= 0) newErrors.baseRatePerHour = true;

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
      const filename = imageUri.split('/').pop() || 'photographer.jpg';
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
        name: name.trim(),
        bio: bio.trim() || undefined,
        baseRatePerHour: Number(baseRatePerHour),
        locationName: locationName.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        image: photoData,
      };

      if (photographerToEdit) {
        await updatePhotographer(photographerToEdit.id, {
          ...payload,
          isActive: photographerToEdit.isActive,
        });
      } else {
        await createPhotographer(payload);
      }

      HapticService.triggerSuccess();
      onSuccess();
      onClose();
    } catch (err: any) {
      HapticService.triggerError();
      Alert.alert('Error', err.response?.data?.message || err.message || 'Failed to save photographer profile.');
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
            {photographerToEdit ? 'Update Profile' : 'Register Photographer'}
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

          {/* Name */}
          <View style={styles.formGroup}>
            <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>
              Full Name / Studio Name <Text style={{ color: Colors.brand.logoCoral }}>*</Text>
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Aura Photography & Films"
              placeholderTextColor={themeColors.textMuted}
              style={[
                styles.textInput,
                {
                  color: themeColors.text,
                  backgroundColor: themeColors.surface,
                  borderColor: errors.name ? Colors.brand.logoCoral : themeColors.border,
                },
              ]}
            />
          </View>

          {/* Location / Area */}
          <View style={styles.formGroup}>
            <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>
              Service Location / Area <Text style={{ color: Colors.brand.logoCoral }}>*</Text>
            </Text>
            <TextInput
              value={locationName}
              onChangeText={setLocationName}
              placeholder="e.g. Belihuloya (Campus delivery)"
              placeholderTextColor={themeColors.textMuted}
              style={[
                styles.textInput,
                {
                  color: themeColors.text,
                  backgroundColor: themeColors.surface,
                  borderColor: errors.locationName ? Colors.brand.logoCoral : themeColors.border,
                },
              ]}
            />
          </View>

          {/* Rate & Contact details */}
          <View style={styles.rowGroup}>
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>
                Base Hourly Rate (LKR) <Text style={{ color: Colors.brand.logoCoral }}>*</Text>
              </Text>
              <TextInput
                value={baseRatePerHour}
                onChangeText={setBaseRatePerHour}
                placeholder="e.g. 5000"
                keyboardType="numeric"
                placeholderTextColor={themeColors.textMuted}
                style={[
                  styles.textInput,
                  {
                    color: themeColors.text,
                    backgroundColor: themeColors.surface,
                    borderColor: errors.baseRatePerHour ? Colors.brand.logoCoral : themeColors.border,
                  },
                ]}
              />
            </View>

            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>
                Contact Phone <Text style={{ color: Colors.brand.logoCoral }}>*</Text>
              </Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="e.g. 0771234567"
                keyboardType="phone-pad"
                placeholderTextColor={themeColors.textMuted}
                style={[
                  styles.textInput,
                  {
                    color: themeColors.text,
                    backgroundColor: themeColors.surface,
                    borderColor: errors.phone ? Colors.brand.logoCoral : themeColors.border,
                  },
                ]}
              />
            </View>
          </View>

          {/* Email */}
          <View style={styles.formGroup}>
            <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>
              Contact Email
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="e.g. contact@auraphotography.com"
              keyboardType="email-address"
              placeholderTextColor={themeColors.textMuted}
              style={[
                styles.textInput,
                {
                  color: themeColors.text,
                  backgroundColor: themeColors.surface,
                  borderColor: themeColors.border,
                },
              ]}
            />
          </View>

          {/* Biography / Bio */}
          <View style={styles.formGroup}>
            <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>
              Bio / Experience
            </Text>
            <TextInput
              value={bio}
              onChangeText={setBio}
              placeholder="Tell students about your camera setup, specialization, event styles, and background."
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
                {photographerToEdit ? 'Save Changes' : 'Register Profile'}
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
