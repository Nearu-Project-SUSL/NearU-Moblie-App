import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TextInput,
  useColorScheme,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Switch,
  Platform,
  Appearance,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '../../hooks/useAuth';
import { useProfile } from '../../hooks/useProfile';
import { Colors } from '../../constants/Colors';
import { Card } from '../Card';
import { Button } from '../Button';
import { Modal } from '../Modal';
import { LinearGradient } from 'expo-linear-gradient';
import { riderService } from '../../services/riderService';
import {
  User as UserIcon,
  Mail as MailIcon,
  Phone as PhoneIcon,
  MapPin as MapPinIcon,
  Lock as LockIcon,
  LogOut as LogOutIcon,
  ChevronRight as ChevronRightIcon,
  Camera as CameraIcon,
  Trash2 as TrashIcon,
  HelpCircle as HelpIcon,
  Settings as SettingsIcon,
  Bike as BikeIcon,
  Notebook as DocIcon,
  ShieldCheck
} from 'lucide-react-native';

export default function RiderProfileView() {
  const { user, logout } = useAuth();
  const systemTheme = useColorScheme() ?? 'light';
  const themeColors = Colors[systemTheme];

  const {
    profile,
    isLoading: isProfileLoading,
    isSaving,
    isEditing,
    editForm,
    startEditing,
    cancelEditing,
    updateFormFields,
    saveProfile,
    changeAvatar,
    deleteAccount,
  } = useProfile();

  // Rider-specific document details
  const [vehicleNumber, setVehicleNumber] = useState('N/A');
  const [licenseNumber, setLicenseNumber] = useState('N/A');
  const [vehicleType, setVehicleType] = useState('Tuk-Tuk');

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const res = await riderService.getRiderStatus();
        if (res.success && res.data) {
          // Mock or fetch actual document details from registration/backend if available
          setVehicleNumber('ST-4409');
          setLicenseNumber('WP-L889392');
          setVehicleType(res.data.riderTier === 'Premium' ? 'Premium Tuk-Tuk' : 'Standard Tuk-Tuk');
        }
      } catch (e) {
        console.log('Error fetching rider doc info:', e);
      }
    };
    fetchDocs();
  }, []);

  // Modal States
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  // Password Update Fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Account Deletion Fields
  const [deletePhrase, setDeletePhrase] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteCountdown, setDeleteCountdown] = useState(3);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Handle countdown timer for account deletion
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (deleteModalVisible && deleteCountdown > 0) {
      timer = setTimeout(() => {
        setDeleteCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [deleteModalVisible, deleteCountdown]);

  const closePasswordModal = () => {
    setPasswordModalVisible(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const closeDeleteModal = () => {
    setDeleteModalVisible(false);
    setDeletePhrase('');
    setDeletePassword('');
    setDeleteCountdown(3);
  };

  const handleAvatarPress = async () => {
    const result = await changeAvatar();
    if (!result.success && result.error) {
      Alert.alert('Upload Failed', result.error);
    }
  };

  const handleSaveProfile = async () => {
    const result = await saveProfile();
    if (result.success) {
      Alert.alert('Success', 'Profile details updated.');
    } else {
      Alert.alert('Save Failed', result.error || 'Unable to update profile.');
    }
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'All fields are required.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    setIsUpdatingPassword(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsUpdatingPassword(false);
    
    Alert.alert('Success', 'Your password has been changed.');
    closePasswordModal();
  };

  const handleDeleteAccount = async () => {
    if (deletePhrase !== 'DELETE') {
      Alert.alert('Error', 'Please type "DELETE" exactly to confirm.');
      return;
    }
    if (!deletePassword) {
      Alert.alert('Error', 'Password is required.');
      return;
    }

    setIsDeletingAccount(true);
    const result = await deleteAccount(deletePassword);
    setIsDeletingAccount(false);
    if (result.success) {
      closeDeleteModal();
      Alert.alert('Account Deleted', 'Your profile has been permanently removed.');
    } else {
      Alert.alert('Deletion Failed', result.error || 'Incorrect password.');
    }
  };

  const handleToggleTheme = async (isDark: boolean) => {
    const newTheme = isDark ? 'dark' : 'light';
    Appearance.setColorScheme(newTheme);
    try {
      await SecureStore.setItemAsync('user-theme', newTheme);
    } catch (e) {
      console.log('Error saving theme configuration:', e);
    }
  };

  if (isProfileLoading) {
    return (
      <View style={[styles.loadingScreen, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color={Colors.brand.accent} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: themeColors.background }]} showsVerticalScrollIndicator={false}>
      
      {/* ── Cover Photo Banner & Avatar ── */}
      <View style={styles.headerContainer}>
        <LinearGradient
          colors={systemTheme === 'light' ? ['#10B981', '#065F46'] : ['#064E3B', '#022C22']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.coverGradient}
        />
        
        {/* Profile Card Overlay */}
        <View style={[styles.profileCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
          <Pressable onPress={handleAvatarPress} style={styles.avatarWrapper}>
            {profile?.profilePictureUrl ? (
              <Image source={{ uri: profile.profilePictureUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                <UserIcon size={40} color="#10B981" />
              </View>
            )}
            <View style={[styles.cameraBadge, { backgroundColor: '#10B981' }]}>
              <CameraIcon size={14} color="#FFFFFF" />
            </View>
            <View style={[styles.verifiedBadge, { backgroundColor: themeColors.success }]}>
              <ShieldCheck size={10} color="#FFFFFF" />
            </View>
          </Pressable>

          <Text style={[styles.displayName, { color: themeColors.text }]}>
            {profile?.username || `${user?.firstName} ${user?.lastName}`}
          </Text>
          <Text style={[styles.displayRole, { color: '#10B981' }]}>
            Campus Ride Partner
          </Text>

          {isSaving && (
            <ActivityIndicator size="small" color="#10B981" style={{ marginTop: 8 }} />
          )}

          {/* Edit / Save Actions */}
          <View style={styles.actionHeaderRow}>
            {!isEditing ? (
              <Button
                title="Edit Profile"
                onPress={startEditing}
                variant="outline"
                size="small"
                icon={<CameraIcon size={14} color={themeColors.text} />}
                style={{ borderRadius: 20, paddingHorizontal: 16 }}
              />
            ) : (
              <View style={styles.editingActions}>
                <Button
                  title="Cancel"
                  onPress={cancelEditing}
                  variant="secondary"
                  size="small"
                  style={{ marginRight: 8, borderRadius: 20 }}
                />
                <Button
                  title="Save"
                  onPress={handleSaveProfile}
                  variant="primary"
                  size="small"
                  style={{ borderRadius: 20, backgroundColor: '#10B981' }}
                />
              </View>
            )}
          </View>
        </View>
      </View>

      {/* ── Main Content Area ── */}
      <View style={styles.content}>
        
        {/* ── Section: Personal Information ── */}
        <Text style={[styles.sectionTitle, { color: themeColors.textSecondary }]}>Personal Information</Text>
        <Card variant="elevated" style={styles.sectionCard} padding="medium">
          
          <View style={styles.fieldItem}>
            <View style={styles.fieldHeader}>
              <UserIcon size={16} color="#10B981" style={{ marginRight: 10 }} />
              <Text style={[styles.fieldLabel, { color: themeColors.textSecondary }]}>Rider Name</Text>
            </View>
            {isEditing ? (
              <TextInput
                value={editForm.username}
                onChangeText={(val) => updateFormFields({ username: val })}
                style={[styles.fieldInput, { color: themeColors.text, borderColor: themeColors.border }]}
              />
            ) : (
              <Text style={[styles.fieldValue, { color: themeColors.text }]}>{profile?.username || 'N/A'}</Text>
            )}
          </View>
          
          <View style={[styles.fieldDivider, { backgroundColor: themeColors.border }]} />

          <View style={styles.fieldItem}>
            <View style={styles.fieldHeader}>
              <MailIcon size={16} color="#10B981" style={{ marginRight: 10 }} />
              <Text style={[styles.fieldLabel, { color: themeColors.textSecondary }]}>Email Address</Text>
            </View>
            <Text style={[styles.fieldValue, { color: themeColors.textMuted }]}>{profile?.email || 'N/A'}</Text>
          </View>

          <View style={[styles.fieldDivider, { backgroundColor: themeColors.border }]} />

          <View style={styles.fieldItem}>
            <View style={styles.fieldHeader}>
              <PhoneIcon size={16} color="#10B981" style={{ marginRight: 10 }} />
              <Text style={[styles.fieldLabel, { color: themeColors.textSecondary }]}>Mobile Number</Text>
            </View>
            {isEditing ? (
              <TextInput
                value={editForm.mobileNumber}
                onChangeText={(val) => updateFormFields({ mobileNumber: val })}
                keyboardType="phone-pad"
                style={[styles.fieldInput, { color: themeColors.text, borderColor: themeColors.border }]}
              />
            ) : (
              <Text style={[styles.fieldValue, { color: themeColors.text }]}>{profile?.mobileNumber || 'N/A'}</Text>
            )}
          </View>
        </Card>

        {/* ── Section: Vehicle & Documents ── */}
        <Text style={[styles.sectionTitle, { color: themeColors.textSecondary }]}>Vehicle & Credentials</Text>
        <Card variant="elevated" style={styles.sectionCard} padding="medium">
          
          <View style={styles.fieldItem}>
            <View style={styles.fieldHeader}>
              <BikeIcon size={16} color="#10B981" style={{ marginRight: 10 }} />
              <Text style={[styles.fieldLabel, { color: themeColors.textSecondary }]}>Vehicle Class</Text>
            </View>
            <Text style={[styles.fieldValue, { color: themeColors.text }]}>{vehicleType}</Text>
          </View>

          <View style={[styles.fieldDivider, { backgroundColor: themeColors.border }]} />

          <View style={styles.fieldItem}>
            <View style={styles.fieldHeader}>
              <BikeIcon size={16} color="#10B981" style={{ marginRight: 10 }} />
              <Text style={[styles.fieldLabel, { color: themeColors.textSecondary }]}>Plate Number</Text>
            </View>
            <Text style={[styles.fieldValue, { color: themeColors.text }]}>{vehicleNumber}</Text>
          </View>

          <View style={[styles.fieldDivider, { backgroundColor: themeColors.border }]} />

          <View style={styles.fieldItem}>
            <View style={styles.fieldHeader}>
              <DocIcon size={16} color="#10B981" style={{ marginRight: 10 }} />
              <Text style={[styles.fieldLabel, { color: themeColors.textSecondary }]}>Licence Number</Text>
            </View>
            <Text style={[styles.fieldValue, { color: themeColors.text }]}>{licenseNumber}</Text>
          </View>
        </Card>

        {/* ── Section: Settings ── */}
        <Text style={[styles.sectionTitle, { color: themeColors.textSecondary }]}>Rider Settings</Text>
        <Card variant="elevated" style={styles.settingsCard} padding="none">
          
          <View style={[styles.settingsRow, { borderBottomColor: themeColors.border }]}>
            <View style={styles.settingsRowLeft}>
              <View style={[styles.settingsIconBg, { backgroundColor: systemTheme === 'light' ? '#F1F5F9' : '#0F172A' }]}>
                <SettingsIcon size={18} color={themeColors.textSecondary} />
              </View>
              <View>
                <Text style={[styles.settingsLabel, { color: themeColors.text }]}>Appearance Mode</Text>
                <Text style={[styles.settingsSub, { color: themeColors.textSecondary }]}>
                  {systemTheme === 'dark' ? 'Dark theme active' : 'Light theme active'}
                </Text>
              </View>
            </View>
            <Switch value={systemTheme === 'dark'} onValueChange={handleToggleTheme} />
          </View>

          <Pressable
            onPress={() => setPasswordModalVisible(true)}
            style={({ pressed }) => [
              styles.settingsRow,
              { borderBottomColor: themeColors.border },
              pressed && { backgroundColor: systemTheme === 'light' ? '#F8FAFC' : '#253041' },
            ]}
          >
            <View style={styles.settingsRowLeft}>
              <View style={[styles.settingsIconBg, { backgroundColor: systemTheme === 'light' ? '#F1F5F9' : '#0F172A' }]}>
                <LockIcon size={18} color={themeColors.textSecondary} />
              </View>
              <View>
                <Text style={[styles.settingsLabel, { color: themeColors.text }]}>Change Password</Text>
                <Text style={[styles.settingsSub, { color: themeColors.textSecondary }]}>Modify account password credentials</Text>
              </View>
            </View>
            <ChevronRightIcon size={18} color={themeColors.textMuted} />
          </Pressable>
        </Card>

        {/* ── Action Buttons Block ── */}
        <View style={styles.footerButtons}>
          <Button
            title="Sign Out"
            onPress={logout}
            variant="outline"
            icon={<LogOutIcon size={16} color={themeColors.danger} />}
            textStyle={{ color: themeColors.danger }}
            style={[styles.logoutBtn, { borderColor: themeColors.danger }]}
          />

          <Pressable
            onPress={() => setDeleteModalVisible(true)}
            style={styles.deleteLink}
          >
            <TrashIcon size={13} color={themeColors.danger} style={{ marginRight: 6 }} />
            <Text style={[styles.deleteLinkText, { color: themeColors.danger }]}>Delete Rider account permanently</Text>
          </Pressable>
        </View>

        <View style={{ height: 110 }} />
      </View>

      {/* ── Password Change Modal ── */}
      <Modal
        visible={passwordModalVisible}
        onClose={closePasswordModal}
        title="Change Password"
      >
        <View style={styles.modalContent}>
          <TextInput
            placeholder="Current Password"
            secureTextEntry={!showCurrentPassword}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholderTextColor={themeColors.textMuted}
            style={[styles.modalInput, { color: themeColors.text, borderColor: themeColors.border }]}
          />
          <TextInput
            placeholder="New Password"
            secureTextEntry={!showNewPassword}
            value={newPassword}
            onChangeText={setNewPassword}
            placeholderTextColor={themeColors.textMuted}
            style={[styles.modalInput, { color: themeColors.text, borderColor: themeColors.border, marginTop: 12 }]}
          />
          <TextInput
            placeholder="Confirm New Password"
            secureTextEntry={!showConfirmPassword}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholderTextColor={themeColors.textMuted}
            style={[styles.modalInput, { color: themeColors.text, borderColor: themeColors.border, marginTop: 12 }]}
          />
          <Button
            title="Update Password"
            onPress={handleUpdatePassword}
            variant="primary"
            style={{ marginTop: 20, backgroundColor: '#10B981' }}
            loading={isUpdatingPassword}
          />
        </View>
      </Modal>

      {/* ── Delete Account Modal ── */}
      <Modal
        visible={deleteModalVisible}
        onClose={closeDeleteModal}
        title="Delete Rider Profile?"
      >
        <View style={styles.modalContent}>
          <Text style={[styles.warningText, { color: themeColors.danger }]}>
            WARNING: This action is irreversible. All your earnings history, ratings, and vehicle document records will be purged.
          </Text>
          <TextInput
            placeholder="Type 'DELETE' to confirm"
            value={deletePhrase}
            onChangeText={setDeletePhrase}
            placeholderTextColor={themeColors.textMuted}
            style={[styles.modalInput, { color: themeColors.text, borderColor: themeColors.border, marginTop: 16 }]}
          />
          <TextInput
            placeholder="Enter Password"
            secureTextEntry
            value={deletePassword}
            onChangeText={setDeletePassword}
            placeholderTextColor={themeColors.textMuted}
            style={[styles.modalInput, { color: themeColors.text, borderColor: themeColors.border, marginTop: 12 }]}
          />
          <Button
            title={deleteCountdown > 0 ? `Confirm (${deleteCountdown}s)` : "Delete Permanently"}
            onPress={handleDeleteAccount}
            variant="danger"
            disabled={deletePhrase !== 'DELETE' || !deletePassword || deleteCountdown > 0}
            style={{ marginTop: 20 }}
            loading={isDeletingAccount}
          />
        </View>
      </Modal>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  headerContainer: {
    position: 'relative',
    height: 290,
  },
  coverGradient: {
    height: 150,
  },
  profileCard: {
    position: 'absolute',
    top: 80,
    left: 20,
    right: 20,
    borderRadius: 20,
    alignItems: 'center',
    paddingTop: 65,
    paddingBottom: 20,
    borderWidth: 1.5,
    elevation: 6,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  avatarWrapper: {
    position: 'absolute',
    top: -50,
    alignSelf: 'center',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  verifiedBadge: {
    position: 'absolute',
    top: 2,
    left: 2,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  displayName: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  displayRole: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 4,
  },
  actionHeaderRow: {
    marginTop: 14,
  },
  editingActions: {
    flexDirection: 'row',
  },
  content: {
    paddingHorizontal: 20,
    marginTop: 15,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 24,
    marginBottom: 10,
  },
  sectionCard: {
    marginBottom: 16,
  },
  fieldItem: {
    paddingVertical: 4,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  fieldValue: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 6,
    marginLeft: 26,
  },
  fieldInput: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 6,
    marginLeft: 26,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  fieldDivider: {
    height: 1,
    marginVertical: 12,
  },
  settingsCard: {
    marginBottom: 24,
  },
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  settingsRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingsIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingsLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  settingsSub: {
    fontSize: 11,
    marginTop: 2,
  },
  footerButtons: {
    marginTop: 12,
    alignItems: 'center',
  },
  logoutBtn: {
    width: '100%',
    borderRadius: 12,
  },
  deleteLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 8,
  },
  deleteLinkText: {
    fontSize: 13,
    fontWeight: '600',
  },
  modalContent: {
    paddingVertical: 10,
  },
  modalInput: {
    height: 48,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  warningText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
});
