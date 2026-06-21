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
} from 'react-native';
import { AccommodationItem } from '../../types/accommodation';
import { createAccommodationItem, updateAccommodationItem } from '../../services/accommodation';
import { Colors } from '../../constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { HapticService } from '../../services/HapticService';

interface CreateAccommodationItemModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  accommodationId: string;
  itemToEdit?: AccommodationItem | null;
}

const THEME_ACCENT = '#10B981'; // Emerald Green accent

export const CreateAccommodationItemModal: React.FC<CreateAccommodationItemModalProps> = ({
  visible,
  onClose,
  onSuccess,
  accommodationId,
  itemToEdit = null,
}) => {
  const systemTheme = useColorScheme() ?? 'light';
  const themeColors = Colors[systemTheme];
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');

  // Validation
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  // Pre-populate if editing
  useEffect(() => {
    if (itemToEdit) {
      setName(itemToEdit.name);
      setPrice(itemToEdit.price.toString());
      setDescription(itemToEdit.description);
    } else {
      setName('');
      setPrice('');
      setDescription('');
    }
    setErrors({});
  }, [itemToEdit, visible]);

  const validate = (): boolean => {
    const newErrors: Record<string, boolean> = {};
    if (!name.trim()) newErrors.name = true;
    
    const priceNum = Number(price);
    if (!price.trim() || isNaN(priceNum) || priceNum <= 0) newErrors.price = true;

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

    try {
      const payload = {
        name: name.trim(),
        price: Number(price),
        description: description.trim(),
      };

      if (itemToEdit) {
        await updateAccommodationItem(accommodationId, itemToEdit.id, payload);
      } else {
        await createAccommodationItem(accommodationId, payload);
      }

      HapticService.triggerSuccess();
      onSuccess();
      onClose();
    } catch (err: any) {
      HapticService.triggerError();
      Alert.alert('Error', err.response?.data?.message || err.message || 'Failed to save item.');
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
            {itemToEdit ? 'Edit Item Details' : 'Add New Item'}
          </Text>
          <View style={styles.closeIconPlaceholder} />
        </View>

        {/* Scrollable Form */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.formContent, { paddingBottom: insets.bottom + 120 }]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Name */}
          <View style={styles.formGroup}>
            <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>
              Item / Room Name <Text style={{ color: Colors.brand.logoCoral }}>*</Text>
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Single Room with balcony"
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
              Monthly Rent / Price (LKR) <Text style={{ color: Colors.brand.logoCoral }}>*</Text>
            </Text>
            <TextInput
              value={price}
              onChangeText={setPrice}
              placeholder="e.g. 12000"
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

          {/* Description */}
          <View style={styles.formGroup}>
            <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>
              Item Description
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="e.g. Fully furnished room, includes one study table, chair, fan, and private bathroom."
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
                {itemToEdit ? 'Save Changes' : 'Add to Accommodation'}
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
    height: 100,
    paddingVertical: 12,
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
