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
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { LinearGradient } from 'expo-linear-gradient';
import {
  User,
  Mail,
  Phone,
  Calendar,
  GraduationCap,
  MapPin,
  Lock,
  ShieldCheck,
  LogOut,
  ChevronRight,
  Camera,
  Trash2,
  HelpCircle,
  Settings,
  Sparkles,
  ArrowRight,
  Eye,
  EyeOff,
} from 'lucide-react-native';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const systemTheme = useColorScheme() ?? 'light';
  const themeColors = Colors[systemTheme];

  const {
    profile,
    isLoading: isProfileLoading,
    isSaving,
    error: profileError,
    isEditing,
    editForm,
    startEditing,
    cancelEditing,
    updateFormFields,
    saveProfile,
    changeAvatar,
    deleteAccount,
  } = useProfile();


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

  const isGuest = user?.id === 'guest' || !user;

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

  // Reset states when modals close
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

  // Update profile image handler
  const handleAvatarPress = async () => {
    if (isGuest) {
      Alert.alert('Access Denied', 'Guests cannot customize profile pictures.');
      return;
    }
    const result = await changeAvatar();
    if (!result.success && result.error) {
      Alert.alert('Upload Failed', result.error);
    }
  };

  // Profile save details handler
  const handleSaveProfile = async () => {
    const result = await saveProfile();
    if (result.success) {
      Alert.alert('Success', 'Profile configurations saved.');
    } else {
      Alert.alert('Save Failed', result.error || 'Unable to update profile.');
    }
  };

  // Change password handler (simulated API update)
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
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsUpdatingPassword(false);
    
    Alert.alert('Success', 'Your password has been changed.');
    closePasswordModal();
  };

  // Account deletion handler
  const handleDeleteAccount = async () => {
    if (deletePhrase !== 'DELETE') {
      Alert.alert('Error', 'Please type "DELETE" exactly to confirm.');
      return;
    }
    if (!deletePassword) {
      Alert.alert('Error', 'Password is required to confirm identity.');
      return;
    }

    setIsDeletingAccount(true);
    const result = await deleteAccount(deletePassword);
    setIsDeletingAccount(false);
    if (result.success) {
      closeDeleteModal();
      Alert.alert('Account Deleted', 'Your profile has been permanently removed.');
    } else {
      Alert.alert('Deletion Failed', result.error || 'Unable to delete account.');
    }
  };

  // Static options alerts
  const handleComingSoon = (title: string, message: string) => {
    Alert.alert(title, message);
  };

  // Dynamic manual theme toggle
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
          colors={systemTheme === 'light' ? ['#2E9EBF', '#156175'] : ['#1C2A30', '#0E171B']}
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
              <View style={[styles.avatarPlaceholder, { backgroundColor: themeColors.primaryLight }]}>
                <User size={40} color={themeColors.primary} />
              </View>
            )}
            
            {!isGuest && (
              <View style={[styles.cameraBadge, { backgroundColor: Colors.brand.accent }]}>
                <Camera size={14} color="#FFFFFF" />
              </View>
            )}
            {profile?.role === 'Student' && user?.isStudentVerified && (
              <View style={[styles.verifiedBadge, { backgroundColor: themeColors.success }]}>
                <ShieldCheck size={10} color="#FFFFFF" />
              </View>
            )}
          </Pressable>

          <Text style={[styles.displayName, { color: themeColors.text }]}>
            {profile?.username || `${user?.firstName} ${user?.lastName}`}
          </Text>
          <Text style={[styles.displayRole, { color: Colors.brand.accent }]}>
            {profile?.role || 'Guest'}
          </Text>

          {isSaving && (
            <ActivityIndicator size="small" color={Colors.brand.accent} style={{ marginTop: 8 }} />
          )}

          {/* Edit / Save Actions */}
          {!isGuest && (
            <View style={styles.actionHeaderRow}>
              {!isEditing ? (
                <Button
                  title="Edit Profile"
                  onPress={startEditing}
                  variant="outline"
                  size="small"
                  icon={<Camera size={14} color={themeColors.text} />}
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
                    style={{ borderRadius: 20, backgroundColor: Colors.brand.accent }}
                  />
                </View>
              )}
            </View>
          )}
        </View>
      </View>

      {/* ── Main Content Area ── */}
      <View style={styles.content}>
        
        {/* Guest Lock Banner */}
        {isGuest && (
          <LinearGradient
            colors={['rgba(239, 68, 68, 0.15)', 'rgba(239, 68, 68, 0.05)']}
            style={styles.guestCard}
          >
            <View style={styles.guestRow}>
              <Lock size={24} color={themeColors.danger} style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.guestTitle, { color: themeColors.danger }]}>Guest Mode</Text>
                <Text style={[styles.guestSubtitle, { color: themeColors.textSecondary }]}>
                  Please register or log in to customize your profile details and access peer-to-peer services.
                </Text>
              </View>
            </View>
            <Button
              title="Go to Registration"
              onPress={logout}
              variant="danger"
              size="small"
              style={{ marginTop: 12, borderRadius: 10 }}
            />
          </LinearGradient>
        )}


        {/* ── Section: Personal Information ── */}
        <Text style={[styles.sectionTitle, { color: themeColors.textSecondary }]}>Personal Information</Text>
        <Card variant="elevated" style={styles.sectionCard} padding="medium">
          
          {/* Item: Full Name */}
          <View style={styles.fieldItem}>
            <View style={styles.fieldHeader}>
              <User size={16} color={Colors.brand.accent} style={{ marginRight: 10 }} />
              <Text style={[styles.fieldLabel, { color: themeColors.textSecondary }]}>Full Name</Text>
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

          {/* Item: Email */}
          <View style={styles.fieldItem}>
            <View style={styles.fieldHeader}>
              <Mail size={16} color={Colors.brand.accent} style={{ marginRight: 10 }} />
              <Text style={[styles.fieldLabel, { color: themeColors.textSecondary }]}>Email Address</Text>
            </View>
            <Text style={[styles.fieldValue, { color: themeColors.textMuted }]}>{profile?.email || 'N/A'}</Text>
            {isEditing && <Text style={[styles.helperText, { color: themeColors.textMuted }]}>Email cannot be changed.</Text>}
          </View>

          <View style={[styles.fieldDivider, { backgroundColor: themeColors.border }]} />

          {/* Item: Mobile Number */}
          <View style={styles.fieldItem}>
            <View style={styles.fieldHeader}>
              <Phone size={16} color={Colors.brand.accent} style={{ marginRight: 10 }} />
              <Text style={[styles.fieldLabel, { color: themeColors.textSecondary }]}>Mobile Number</Text>
            </View>
            {isEditing ? (
              <TextInput
                value={editForm.mobileNumber}
                onChangeText={(val) => updateFormFields({ mobileNumber: val })}
                placeholder="e.g. 0712345678"
                placeholderTextColor={themeColors.textMuted}
                keyboardType="phone-pad"
                style={[styles.fieldInput, { color: themeColors.text, borderColor: themeColors.border }]}
              />
            ) : (
              <Text style={[styles.fieldValue, { color: themeColors.text }]}>{profile?.mobileNumber || 'N/A'}</Text>
            )}
          </View>

          <View style={[styles.fieldDivider, { backgroundColor: themeColors.border }]} />

          {/* Item: DOB */}
          <View style={styles.fieldItem}>
            <View style={styles.fieldHeader}>
              <Calendar size={16} color={Colors.brand.accent} style={{ marginRight: 10 }} />
              <Text style={[styles.fieldLabel, { color: themeColors.textSecondary }]}>Date of Birth</Text>
            </View>
            {isEditing ? (
              <TextInput
                value={editForm.dateOfBirth}
                onChangeText={(val) => updateFormFields({ dateOfBirth: val })}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={themeColors.textMuted}
                style={[styles.fieldInput, { color: themeColors.text, borderColor: themeColors.border }]}
              />
            ) : (
              <Text style={[styles.fieldValue, { color: themeColors.text }]}>{profile?.dateOfBirth || 'N/A'}</Text>
            )}
          </View>
        </Card>

        {/* ── Section: Academic Details (Only for Student profiles) ── */}
        {!isGuest && profile?.role === 'Student' && (
          <>
            <Text style={[styles.sectionTitle, { color: themeColors.textSecondary }]}>Academic Information</Text>
            <Card variant="elevated" style={styles.sectionCard} padding="medium">
              
              {/* Item: Student ID */}
              <View style={styles.fieldItem}>
                <View style={styles.fieldHeader}>
                  <GraduationCap size={16} color={Colors.brand.accent} style={{ marginRight: 10 }} />
                  <Text style={[styles.fieldLabel, { color: themeColors.textSecondary }]}>Student ID</Text>
                </View>
                <Text style={[styles.fieldValue, { color: themeColors.textMuted }]}>{profile?.studentId || 'N/A'}</Text>
                {isEditing && <Text style={[styles.helperText, { color: themeColors.textMuted }]}>ID cannot be changed.</Text>}
              </View>

              <View style={[styles.fieldDivider, { backgroundColor: themeColors.border }]} />

              {/* Item: Faculty */}
              <View style={styles.fieldItem}>
                <View style={styles.fieldHeader}>
                  <GraduationCap size={16} color={Colors.brand.accent} style={{ marginRight: 10 }} />
                  <Text style={[styles.fieldLabel, { color: themeColors.textSecondary }]}>Faculty</Text>
                </View>
                {isEditing ? (
                  <TextInput
                    value={editForm.faculty}
                    onChangeText={(val) => updateFormFields({ faculty: val })}
                    placeholder="e.g. Computing"
                    placeholderTextColor={themeColors.textMuted}
                    style={[styles.fieldInput, { color: themeColors.text, borderColor: themeColors.border }]}
                  />
                ) : (
                  <Text style={[styles.fieldValue, { color: themeColors.text }]}>{profile?.faculty || 'N/A'}</Text>
                )}
              </View>

              <View style={[styles.fieldDivider, { backgroundColor: themeColors.border }]} />

              {/* Item: Year */}
              <View style={styles.fieldItem}>
                <View style={styles.fieldHeader}>
                  <GraduationCap size={16} color={Colors.brand.accent} style={{ marginRight: 10 }} />
                  <Text style={[styles.fieldLabel, { color: themeColors.textSecondary }]}>Academic Year</Text>
                </View>
                {isEditing ? (
                  <TextInput
                    value={editForm.year}
                    onChangeText={(val) => updateFormFields({ year: val })}
                    placeholder="e.g. 3rd Year"
                    placeholderTextColor={themeColors.textMuted}
                    style={[styles.fieldInput, { color: themeColors.text, borderColor: themeColors.border }]}
                  />
                ) : (
                  <Text style={[styles.fieldValue, { color: themeColors.text }]}>{profile?.year || 'N/A'}</Text>
                )}
              </View>
            </Card>
          </>
        )}

        {/* ── Section: Address Details ── */}
        {!isGuest && (
          <>
            <Text style={[styles.sectionTitle, { color: themeColors.textSecondary }]}>Location Coordinates</Text>
            <Card variant="elevated" style={styles.sectionCard} padding="medium">
              
              {/* Item: City */}
              <View style={styles.fieldItem}>
                <View style={styles.fieldHeader}>
                  <MapPin size={16} color={Colors.brand.accent} style={{ marginRight: 10 }} />
                  <Text style={[styles.fieldLabel, { color: themeColors.textSecondary }]}>City</Text>
                </View>
                {isEditing ? (
                  <TextInput
                    value={editForm.city}
                    onChangeText={(val) => updateFormFields({ city: val })}
                    placeholder="e.g. Belihuloya"
                    placeholderTextColor={themeColors.textMuted}
                    style={[styles.fieldInput, { color: themeColors.text, borderColor: themeColors.border }]}
                  />
                ) : (
                  <Text style={[styles.fieldValue, { color: themeColors.text }]}>{profile?.city || 'N/A'}</Text>
                )}
              </View>

              <View style={[styles.fieldDivider, { backgroundColor: themeColors.border }]} />

              {/* Item: Address */}
              <View style={styles.fieldItem}>
                <View style={styles.fieldHeader}>
                  <MapPin size={16} color={Colors.brand.accent} style={{ marginRight: 10 }} />
                  <Text style={[styles.fieldLabel, { color: themeColors.textSecondary }]}>Street Address</Text>
                </View>
                {isEditing ? (
                  <TextInput
                    value={editForm.address}
                    onChangeText={(val) => updateFormFields({ address: val })}
                    placeholder="e.g. Pambahinna"
                    placeholderTextColor={themeColors.textMuted}
                    style={[styles.fieldInput, { color: themeColors.text, borderColor: themeColors.border }]}
                  />
                ) : (
                  <Text style={[styles.fieldValue, { color: themeColors.text }]}>{profile?.address || 'N/A'}</Text>
                )}
              </View>
            </Card>
          </>
        )}

        {/* ── Section: Settings & Account Operations ── */}
        <Text style={[styles.sectionTitle, { color: themeColors.textSecondary }]}>Account Configuration</Text>
        <Card variant="elevated" style={styles.settingsCard} padding="none">
          
          {/* Appearance Switch */}
          <View style={[styles.settingsRow, { borderBottomColor: themeColors.border }]}>
            <View style={styles.settingsRowLeft}>
              <View style={[styles.settingsIconBg, { backgroundColor: systemTheme === 'light' ? '#F1F5F9' : '#0F172A' }]}>
                <Settings size={18} color={themeColors.textSecondary} />
              </View>
              <View>
                <Text style={[styles.settingsLabel, { color: themeColors.text }]}>Appearance Mode</Text>
                <Text style={[styles.settingsSub, { color: themeColors.textSecondary }]}>
                  {systemTheme === 'dark' ? 'Dark theme active' : 'Light theme active'}
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Switch value={systemTheme === 'dark'} onValueChange={handleToggleTheme} />
            </View>
          </View>


          {/* Help & Support Desk */}
          <Pressable
            onPress={() => handleComingSoon('Support Desk', 'Our help center is available via email at support@nearusab.me or by dialing university student services.')}
            style={({ pressed }) => [
              styles.settingsRow,
              { borderBottomColor: themeColors.border },
              pressed && { backgroundColor: systemTheme === 'light' ? '#F8FAFC' : '#253041' },
            ]}
          >
            <View style={styles.settingsRowLeft}>
              <View style={[styles.settingsIconBg, { backgroundColor: systemTheme === 'light' ? '#F1F5F9' : '#0F172A' }]}>
                <HelpCircle size={18} color={themeColors.textSecondary} />
              </View>
              <View>
                <Text style={[styles.settingsLabel, { color: themeColors.text }]}>Help & Support Desk</Text>
                <Text style={[styles.settingsSub, { color: themeColors.textSecondary }]}>Read campus guides or email moderators</Text>
              </View>
            </View>
            <ChevronRight size={18} color={themeColors.textMuted} />
          </Pressable>

          {/* Change Password (only for logged-in accounts) */}
          {!isGuest && (
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
                  <Lock size={18} color={themeColors.textSecondary} />
                </View>
                <View>
                  <Text style={[styles.settingsLabel, { color: themeColors.text }]}>Change Password</Text>
                  <Text style={[styles.settingsSub, { color: themeColors.textSecondary }]}>Modify account password credentials</Text>
                </View>
              </View>
              <ChevronRight size={18} color={themeColors.textMuted} />
            </Pressable>
          )}
        </Card>

        {/* ── Action Buttons Block ── */}
        <View style={styles.footerButtons}>
          
          <Button
            title={isGuest ? "Exit Guest Mode" : "Sign Out"}
            onPress={logout}
            variant="outline"
            icon={<LogOut size={16} color={themeColors.danger} />}
            textStyle={{ color: themeColors.danger }}
            style={[styles.logoutBtn, { borderColor: themeColors.danger }]}
          />

          {!isGuest && (
            <Pressable
              onPress={() => {
                setDeleteModalVisible(true);
                setDeleteCountdown(3);
              }}
              style={styles.deleteLink}
            >
              <Trash2 size={13} color={themeColors.danger} style={{ marginRight: 6 }} />
              <Text style={[styles.deleteLinkText, { color: themeColors.danger }]}>Delete Account permanently</Text>
            </Pressable>
          )}
        </View>

        {/* Bottom padding spacing for Tab Bar overlay */}
        <View style={{ height: 110 }} />
      </View>

      {/* ── Change Password Modal ── */}
      <Modal
        visible={passwordModalVisible}
        onClose={closePasswordModal}
        title="Change Password"
        height={460}
      >
        <ScrollView contentContainerStyle={styles.modalScrollBody} showsVerticalScrollIndicator={false}>
          
          <Text style={[styles.modalLabel, { color: themeColors.textSecondary }]}>Current Password</Text>
          <View style={[styles.passwordInputContainer, { borderColor: themeColors.border }]}>
            <TextInput
              secureTextEntry={!showCurrentPassword}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Enter current password"
              placeholderTextColor={themeColors.textMuted}
              style={[styles.passwordFieldInput, { color: themeColors.text }]}
            />
            <Pressable onPress={() => setShowCurrentPassword(!showCurrentPassword)} style={styles.passwordEye}>
              {showCurrentPassword ? <EyeOff size={16} color={themeColors.textSecondary} /> : <Eye size={16} color={themeColors.textSecondary} />}
            </Pressable>
          </View>

          <Text style={[styles.modalLabel, { color: themeColors.textSecondary }]}>New Password</Text>
          <View style={[styles.passwordInputContainer, { borderColor: themeColors.border }]}>
            <TextInput
              secureTextEntry={!showNewPassword}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Enter at least 6 characters"
              placeholderTextColor={themeColors.textMuted}
              style={[styles.passwordFieldInput, { color: themeColors.text }]}
            />
            <Pressable onPress={() => setShowNewPassword(!showNewPassword)} style={styles.passwordEye}>
              {showNewPassword ? <EyeOff size={16} color={themeColors.textSecondary} /> : <Eye size={16} color={themeColors.textSecondary} />}
            </Pressable>
          </View>

          <Text style={[styles.modalLabel, { color: themeColors.textSecondary }]}>Confirm New Password</Text>
          <View style={[styles.passwordInputContainer, { borderColor: themeColors.border }]}>
            <TextInput
              secureTextEntry={!showConfirmPassword}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Re-type new password"
              placeholderTextColor={themeColors.textMuted}
              style={[styles.passwordFieldInput, { color: themeColors.text }]}
            />
            <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.passwordEye}>
              {showConfirmPassword ? <EyeOff size={16} color={themeColors.textSecondary} /> : <Eye size={16} color={themeColors.textSecondary} />}
            </Pressable>
          </View>

          <View style={styles.modalActions}>
            <Button
              title="Cancel"
              onPress={closePasswordModal}
              variant="secondary"
              style={{ flex: 1, marginRight: 12 }}
            />
            <Button
              title="Change Password"
              onPress={handleUpdatePassword}
              loading={isUpdatingPassword}
              style={{ flex: 1.5, backgroundColor: Colors.brand.accent }}
            />
          </View>
        </ScrollView>
      </Modal>

      {/* ── Delete Account Confirmation Modal ── */}
      <Modal
        visible={deleteModalVisible}
        onClose={closeDeleteModal}
        title="Delete Account"
        height={480}
      >
        <ScrollView contentContainerStyle={styles.modalScrollBody} showsVerticalScrollIndicator={false}>
          
          <View style={[styles.dangerWarningBox, { backgroundColor: themeColors.dangerLight }]}>
            <Trash2 size={24} color={themeColors.danger} style={{ marginBottom: 8 }} />
            <Text style={[styles.dangerWarningTitle, { color: themeColors.danger }]}>This action is IRREVERSIBLE</Text>
            <Text style={[styles.dangerWarningText, { color: themeColors.danger }]}>
              All profile configs, active transactions, ride histories, and student credentials will be purged permanently from the NearU server.
            </Text>
          </View>

          <Text style={[styles.modalLabel, { color: themeColors.textSecondary }]}>
            Type "DELETE" to confirm
          </Text>
          <TextInput
            value={deletePhrase}
            onChangeText={setDeletePhrase}
            placeholder='Type DELETE'
            placeholderTextColor={themeColors.textMuted}
            autoCapitalize="characters"
            style={[styles.textInput, { color: themeColors.text, borderColor: themeColors.border }]}
          />

          <Text style={[styles.modalLabel, { color: themeColors.textSecondary }]}>
            Verify Account Password
          </Text>
          <TextInput
            secureTextEntry
            value={deletePassword}
            onChangeText={setDeletePassword}
            placeholder="Enter account password"
            placeholderTextColor={themeColors.textMuted}
            style={[styles.textInput, { color: themeColors.text, borderColor: themeColors.border, marginBottom: 20 }]}
          />

          <View style={styles.modalActions}>
            <Button
              title="Cancel"
              onPress={closeDeleteModal}
              variant="secondary"
              style={{ flex: 1, marginRight: 12 }}
            />
            <Button
              title={deleteCountdown > 0 ? `Confirm (${deleteCountdown}s)` : 'Delete Permanently'}
              onPress={handleDeleteAccount}
              loading={isDeletingAccount}
              variant="danger"
              disabled={deletePhrase !== 'DELETE' || !deletePassword || deleteCountdown > 0}
              style={{ flex: 1.8 }}
            />
          </View>
        </ScrollView>
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // ── Cover & Card Header ──
  headerContainer: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  coverGradient: {
    width: '100%',
    height: 180,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  profileCard: {
    width: '90%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
    marginTop: -80,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 6,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  displayName: {
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 2,
    textAlign: 'center',
  },
  displayRole: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  actionHeaderRow: {
    marginTop: 6,
    width: '100%',
    alignItems: 'center',
  },
  editingActions: {
    flexDirection: 'row',
  },

  // ── Main UI Layout ──
  content: {
    padding: 20,
  },
  sectionCard: {
    marginBottom: 20,
  },
  guestCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  guestRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  guestTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 3,
  },
  guestSubtitle: {
    fontSize: 12,
    lineHeight: 17,
  },

  // ── Verification Card ──
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifyTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  verifyDesc: {
    fontSize: 11,
    lineHeight: 16,
  },
  verifyBtn: {
    marginTop: 12,
    alignSelf: 'flex-start',
    borderRadius: 10,
  },
  verifyInputWrapper: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.1)',
    paddingTop: 12,
  },
  textInput: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 8,
  },
  verifyActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  successWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  successText: {
    fontSize: 13,
    fontWeight: '700',
  },

  // ── Field Styles ──
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
    paddingLeft: 4,
  },
  fieldItem: {
    paddingVertical: 6,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  fieldValue: {
    fontSize: 15,
    fontWeight: '700',
    paddingLeft: 26,
  },
  fieldInput: {
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 38,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 26,
  },
  helperText: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
    paddingLeft: 26,
  },
  fieldDivider: {
    height: 1,
    marginVertical: 12,
  },

  // ── Settings Lists ──
  settingsCard: {
    marginBottom: 24,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1.5,
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
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  settingsLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  settingsSub: {
    fontSize: 11,
  },

  // ── Footer Operations ──
  footerButtons: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
    marginTop: 12,
  },
  logoutBtn: {
    width: '100%',
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderRadius: 12,
  },
  deleteLink: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  deleteLinkText: {
    fontSize: 13,
    fontWeight: '700',
  },

  // ── Modals Forms ──
  modalScrollBody: {
    paddingBottom: 20,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 10,
    height: 42,
    marginBottom: 16,
    paddingRight: 12,
  },
  passwordFieldInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 12,
    fontSize: 13,
    fontWeight: '500',
  },
  passwordEye: {
    padding: 4,
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: 20,
  },
  dangerWarningBox: {
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  dangerWarningTitle: {
    fontSize: 14,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 4,
    textAlign: 'center',
  },
  dangerWarningText: {
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 16,
    textAlign: 'center',
  },
});
