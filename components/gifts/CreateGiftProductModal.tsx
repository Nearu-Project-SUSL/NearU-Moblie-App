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
import { GiftProductResponseDto, addGiftProduct, updateGiftProduct } from '../../services/giftshop';
import { Colors } from '../../constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Plus, Camera, Image as ImageIcon } from 'lucide-react-native';
import { HapticService } from '../../services/HapticService';
import * as ImagePicker from 'expo-image-picker';

interface CreateGiftProductModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  giftShopId: string;
  productToEdit?: GiftProductResponseDto | null;
}

export const CreateGiftProductModal: React.FC<CreateGiftProductModalProps> = ({
  visible,
  onClose,
  onSuccess,
  giftShopId,
  productToEdit = null,
}) => {
  const systemTheme = useColorScheme() ?? 'light';
  const themeColors = Colors[systemTheme];
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(false);

  // Form States
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(true);

  // Validation State
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name);
      setPrice(productToEdit.price.toString());
      setImageUri(productToEdit.photoUrl || null);
      setIsActive(productToEdit.isActive);
    } else {
      setName('');
      setPrice('');
      setImageUri(null);
      setIsActive(true);
    }
    setErrors({});
  }, [productToEdit, visible]);

  const handlePickImage = async () => {
    HapticService.triggerSelection();
    
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Media library access is required to upload a product photo.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1], // Square aspect ratio is standard for products
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, boolean> = {};
    if (!name.trim()) newErrors.name = true;
    if (!price.trim() || isNaN(Number(price)) || Number(price) <= 0) newErrors.price = true;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    HapticService.triggerSelection();
    if (!validate()) {
      HapticService.triggerError();
      Alert.alert('Validation Error', 'Please verify product name and enter a valid positive price.');
      return;
    }

    setLoading(true);

    let photoData = null;
    if (imageUri && !imageUri.startsWith('http')) {
      const filename = imageUri.split('/').pop() || 'product.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;
      photoData = {
        uri: imageUri,
        name: filename,
        type,
      };
    }

    try {
      if (productToEdit) {
        await updateGiftProduct(productToEdit.id, {
          name: name.trim(),
          price: Number(price),
          isActive,
          image: photoData,
        });
      } else {
        await addGiftProduct(giftShopId, {
          name: name.trim(),
          price: Number(price),
          image: photoData,
        });
      }

      HapticService.triggerSuccess();
      onSuccess();
      onClose();
    } catch (err: any) {
      HapticService.triggerError();
      Alert.alert('Error', err.response?.data?.message || err.message || 'Failed to save product details.');
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
            {productToEdit ? 'Edit Product details' : 'Add New Product'}
          </Text>
          <View style={styles.closeIconPlaceholder} />
        </View>

        {/* Form */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.formContent, { paddingBottom: insets.bottom + 120 }]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Product Image Square Picker */}
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
                  <Text style={styles.changeImageText}>Change Product Image</Text>
                </View>
              </View>
            ) : (
              <View style={styles.imagePlaceholder}>
                <ImageIcon size={40} color={themeColors.textMuted} />
                <Text style={[styles.imagePlaceholderText, { color: themeColors.textSecondary }]}>
                  Upload Product Image
                </Text>
                <Text style={{ color: themeColors.textMuted, fontSize: 11, marginTop: 2 }}>
                  Recommended: 1:1 (Square) Aspect Ratio
                </Text>
              </View>
            )}
          </Pressable>

          {/* Name */}
          <View style={styles.formGroup}>
            <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>
              Product Name <Text style={{ color: Colors.brand.logoCoral }}>*</Text>
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Red Velvet Valentine Cake"
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

          {/* Price */}
          <View style={styles.formGroup}>
            <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>
              Price (LKR) <Text style={{ color: Colors.brand.logoCoral }}>*</Text>
            </Text>
            <TextInput
              value={price}
              onChangeText={setPrice}
              placeholder="e.g. 2500"
              keyboardType="numeric"
              placeholderTextColor={themeColors.textMuted}
              style={[
                styles.textInput,
                {
                  color: themeColors.text,
                  backgroundColor: themeColors.surface,
                  borderColor: errors.price ? Colors.brand.logoCoral : themeColors.border,
                },
              ]}
            />
          </View>

          {/* Active Status (Only for edit mode) */}
          {productToEdit && (
            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.toggleTitle, { color: themeColors.text }]}>Available / Active</Text>
                <Text style={{ color: themeColors.textMuted, fontSize: 12 }}>
                  Show this product in the catalog for students to order
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
                {productToEdit ? 'Save Product' : 'Add to Catalog'}
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
  imagePicker: {
    height: 180,
    width: 180,
    alignSelf: 'center',
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
    fontSize: 11,
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  imagePlaceholderText: {
    fontWeight: '700',
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
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
