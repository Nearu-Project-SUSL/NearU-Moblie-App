import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  useColorScheme,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getShopById, updateShop, ShopResponse } from '../../services/foodshop';
import { Colors } from '../../constants/Colors';

const CATEGORIES = ['Meals', 'Beverages', 'Snacks', 'Desserts', 'Other'];

export default function EditFoodShopScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const theme = useColorScheme() ?? 'light';
  const themeColors = Colors[theme];

  const [shop, setShop] = useState<ShopResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getShopById(id);
        setShop(data);
        setName(data.name);
        setDescription(data.description ?? '');
        setAddress(data.address ?? '');
        setPhoneNumber(data.phoneNumber ?? '');
        setCategory(data.category);
      } catch {
        setError('Could not load shop details.');
      } finally {
        setLoading(false);
      }
    };
    if (id) load();
  }, [id]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Validation', 'Shop name is required.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await updateShop(id, {
        name,
        description,
        address,
        phoneNumber,
        category,
      });

      Alert.alert('Success', 'Shop updated successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch {
      setError('Failed to update shop. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color={Colors.brand.accent} />
        <Text style={[styles.loadingText, { color: themeColors.textSecondary }]}>
          Loading shop...
        </Text>
      </View>
    );
  }

  if (!shop) {
    return (
      <View style={[styles.centered, { backgroundColor: themeColors.background }]}>
        <Text style={[styles.errorText, { color: themeColors.danger }]}>
          {error ?? 'Shop not found.'}
        </Text>

        <TouchableOpacity
          style={[styles.btn, { backgroundColor: Colors.brand.accent }]}
          onPress={() => router.back()}
        >
          <Text style={styles.btnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: themeColors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={[styles.header, { backgroundColor: themeColors.surface }]}>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: themeColors.surfaceElevated }]}
            onPress={() => router.back()}
          >
            <Text style={[styles.backBtnText, { color: themeColors.text }]}>
              ←
            </Text>
          </TouchableOpacity>

          <Text style={[styles.headerTitle, { color: themeColors.text }]}>
            Edit Shop
          </Text>

          <View style={{ width: 38 }} />
        </View>

        {/* Photo */}
        {shop.photoUrl ? (
          <Image source={{ uri: shop.photoUrl }} style={styles.currentPhoto} />
        ) : (
          <View
            style={[
              styles.photoPlaceholder,
              { backgroundColor: themeColors.nearuAccentSubtle },
            ]}
          >
            <Text style={styles.photoPlaceholderText}>🍽️</Text>
            <Text style={[styles.photoPlaceholderLabel, { color: Colors.brand.accent }]}>
              No photo
            </Text>
          </View>
        )}

        <View style={styles.form}>

          {error ? (
            <View
              style={[
                styles.errorBox,
                { backgroundColor: themeColors.primaryLight },
              ]}
            >
              <Text style={{ color: themeColors.danger }}>
                {error}
              </Text>
            </View>
          ) : null}

          {/* Name */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: themeColors.textSecondary }]}>
              Shop Name *
            </Text>

            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: themeColors.surface,
                  borderColor: themeColors.border,
                  color: themeColors.text,
                },
              ]}
              value={name}
              onChangeText={setName}
              placeholder="Enter shop name"
              placeholderTextColor={themeColors.textMuted}
            />
          </View>

          {/* Description */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: themeColors.textSecondary }]}>
              Description
            </Text>

            <TextInput
              style={[
                styles.input,
                styles.textArea,
                {
                  backgroundColor: themeColors.surface,
                  borderColor: themeColors.border,
                  color: themeColors.text,
                },
              ]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe your shop..."
              placeholderTextColor={themeColors.textMuted}
              multiline
            />
          </View>

          {/* Address */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: themeColors.textSecondary }]}>
              Address
            </Text>

            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: themeColors.surface,
                  borderColor: themeColors.border,
                  color: themeColors.text,
                },
              ]}
              value={address}
              onChangeText={setAddress}
              placeholder="Shop address"
              placeholderTextColor={themeColors.textMuted}
            />
          </View>

          {/* Phone */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: themeColors.textSecondary }]}>
              Phone Number
            </Text>

            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: themeColors.surface,
                  borderColor: themeColors.border,
                  color: themeColors.text,
                },
              ]}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="0712345678"
              placeholderTextColor={themeColors.textMuted}
              keyboardType="phone-pad"
            />
          </View>

          {/* Categories */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: themeColors.textSecondary }]}>
              Category
            </Text>

            <View style={styles.categoryGrid}>
              {CATEGORIES.map(cat => {
                const active = category === cat;

                return (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryChip,
                      {
                        backgroundColor: active
                          ? Colors.brand.accent
                          : themeColors.surfaceElevated,
                        borderColor: themeColors.border,
                      },
                    ]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        { color: active ? '#fff' : themeColors.textSecondary },
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Save */}
          <TouchableOpacity
            style={[
              styles.saveBtn,
              { backgroundColor: Colors.brand.accent },
              saving && { opacity: 0.6 },
            ]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>Save Changes</Text>
            )}
          </TouchableOpacity>

          <View style={{ height: 32 }} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },

  errorText: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 16,
  },

  btn: {
    backgroundColor: Colors.brand.accent,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
  },

  btnText: {
    color: '#fff',
    fontWeight: '600',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: Colors.light.surface,
  },

  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.light.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },

  backBtnText: {
    fontSize: 20,
    color: Colors.light.text,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
  },

  currentPhoto: {
    width: '100%',
    height: 200,
    backgroundColor: Colors.light.surfaceElevated,
  },

  photoPlaceholder: {
    width: '100%',
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },

  photoPlaceholderText: {
    fontSize: 48,
  },

  photoPlaceholderLabel: {
    color: Colors.brand.accent,
    fontSize: 13,
    marginTop: 6,
  },

  form: {
    padding: 20,
  },

  errorBox: {
    backgroundColor: Colors.light.primaryLight,
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: Colors.light.danger,
  },

  errorBoxText: {
    color: Colors.light.danger,
    fontSize: 13,
    fontWeight: '500',
  },

  field: {
    marginBottom: 18,
  },

  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    marginBottom: 6,
  },

  input: {
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.light.text,
  },

  textArea: {
    minHeight: 90,
    paddingTop: 12,
  },

  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.light.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },

  categoryChipActive: {
    backgroundColor: Colors.brand.accent,
    borderColor: Colors.brand.accent,
  },

  categoryChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.light.textSecondary,
  },

  categoryChipTextActive: {
    color: '#fff',
  },

  saveBtn: {
    backgroundColor: Colors.brand.accent,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
  },

  saveBtnDisabled: {
    opacity: 0.6,
  },

  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});