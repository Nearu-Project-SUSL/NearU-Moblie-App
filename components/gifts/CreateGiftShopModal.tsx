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
import { GiftShopResponseDto } from '../../services/giftshop';
import { createGiftShop, updateGiftShop } from '../../services/giftshop';
import { Colors } from '../../constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Plus, AlertCircle, Camera, Image as ImageIcon } from 'lucide-react-native';
import { HapticService } from '../../services/HapticService';
import * as ImagePicker from 'expo-image-picker';

interface CreateGiftShopModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  shopToEdit?: GiftShopResponseDto | null;
}

export const CreateGiftShopModal: React.FC<CreateGiftShopModalProps> = ({
  visible,
  onClose,
  onSuccess,
  shopToEdit = null,
}) => {
  const systemTheme = useColorScheme() ?? 'light';
  const themeColors = Colors[systemTheme];
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [locationName, setLocationName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(true);

  // Validation
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  // Pre-populate if editing
  useEffect(() => {
    if (shopToEdit) {
      setName(shopToEdit.name);
      setLocationName(shopToEdit.locationName);
      setPhone(shopToEdit.phone);
      setEmail(shopToEdit.email || '');
      setAddress(shopToEdit.address);
      setImageUri(shopToEdit.imageUrl || null);
      setIsActive(shopToEdit.isActive);
    } else {
      setName('');
      setLocationName('');
      setPhone('');
      setEmail('');
      setAddress('');
      setImageUri(null);
      setIsActive(true);
    }
    setErrors({});
  }, [shopToEdit, visible]);

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
    if (!name.trim()) newErrors.name = true;
    if (!locationName.trim()) newErrors.locationName = true;
    if (!phone.trim()) newErrors.phone = true;
    if (!address.trim()) newErrors.address = true;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    HapticService.triggerSelection();
    if (!validate()) {
      HapticService.triggerError();
      Alert.alert('Incomplete Form', 'Please fill in all the required fields.');
      return;
    }

    setLoading(true);

    let photoData = null;
    if (imageUri && !imageUri.startsWith('http')) {
      const filename = imageUri.split('/').pop() || 'shop.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;
      photoData = {
        uri: imageUri,
        name: filename,
        type,
      };
    }

    try {
      if (shopToEdit) {
        await updateGiftShop(shopToEdit.id, {
          name: name.trim(),
          locationName: locationName.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          address: address.trim(),
          isActive,
          image: photoData,
        });
      } else {
        await createGiftShop({
          name: name.trim(),
          locationName: locationName.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          address: address.trim(),
          image: photoData,
        });
      }

      HapticService.triggerSuccess();
      onSuccess();
      onClose();
    } catch (err: any) {
      HapticService.triggerError();
      Alert.alert('Error', err.response?.data?.message || err.message || 'Failed to save gift shop details.');
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
            {shopToEdit ? 'Update Gift Shop' : 'Register New Gift Shop'}
          </Text>
          <View style={styles.closeIconPlaceholder} />
        </View>

        {/* Scrollable Form */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.formContent, { paddingBottom: insets.bottom + 120 }]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Shop Image Cover Picker */}
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
                  Upload Shop Cover Image
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
              Shop Name <Text style={{ color: Colors.brand.logoCoral }}>*</Text>
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Blossom Florists & Gift Hub"
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

          {/* Location Name */}
          <View style={styles.formGroup}>
            <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>
              Location/Campus Neighborhood <Text style={{ color: Colors.brand.logoCoral }}>*</Text>
            </Text>
            <TextInput
              value={locationName}
              onChangeText={setLocationName}
              placeholder="e.g. Pambahinna Junction"
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

          {/* Phone */}
          <View style={styles.formGroup}>
            <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>
              Contact Number <Text style={{ color: Colors.brand.logoCoral }}>*</Text>
            </Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="e.g. 0712345678"
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

          {/* Email */}
          <View style={styles.formGroup}>
            <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>
              Email Address (Optional)
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="e.g. contact@blossomgifts.com"
              keyboardType="email-address"
              autoCapitalize="none"
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

          {/* Address */}
          <View style={styles.formGroup}>
            <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>
              Full Address <Text style={{ color: Colors.brand.logoCoral }}>*</Text>
            </Text>
            <TextInput
              value={address}
              onChangeText={setAddress}
              placeholder="e.g. No 45, Badulla Road, Pambahinna"
              placeholderTextColor={themeColors.textMuted}
              style={[
                styles.textInput,
                styles.textArea,
                {
                  color: themeColors.text,
                  backgroundColor: themeColors.surface,
                  borderColor: errors.address ? Colors.brand.logoCoral : themeColors.border,
                },
              ]}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>

          {/* Active Status (Only for edit mode) */}
          {shopToEdit && (
            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.toggleTitle, { color: themeColors.text }]}>Active Status</Text>
                <Text style={{ color: themeColors.textMuted, fontSize: 12 }}>
                  Set whether this shop is currently open and listed for students
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  HapticService.triggerSelection();
                  setIsActive(!isActive);
                }}
                style={[
                  styles.switchBg,
                  {
                    backgroundColor: isActive ? Colors.brand.accent : themeColors.border,
                  },
                ]}
              >
                <View style={[styles.switchThumb, { transform: [{ translateX: isActive ? 20 : 2 }] }]} />
              </Pressable>
            </View>
          )}
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { backgroundColor: themeColors.surface, borderTopColor: themeColors.border, paddingBottom: insets.bottom + 12 }]}>
          <Pressable
            onPress={handleSubmit}
            disabled={loading}
            style={[styles.submitBtn, { backgroundColor: Colors.brand.accent }]}
          >
            {loading ? (
              <ActivityIndicator color="#000000" size="small" />
            ) : (
              <Text style={styles.submitBtnText}>
                {shopToEdit ? 'Save Changes' : 'Create Shop Listing'}
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
    height: 80,
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
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 16,
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  switchBg: {
    width: 48,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    position: 'relative',
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
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
    color: '#000000',
    fontSize: 14,
    fontWeight: '900',
  },
});
