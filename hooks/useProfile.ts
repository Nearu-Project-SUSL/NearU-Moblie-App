import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { profileService, UserProfileResponse, UpdateProfileRequest } from '../services/profileService';
import * as ImagePicker from 'expo-image-picker';

export function useProfile() {
  const { user, updateUser, logout } = useAuth();
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editForm, setEditForm] = useState<UpdateProfileRequest>({
    username: '',
    mobileNumber: '',
    faculty: '',
    year: '',
    address: '',
    city: '',
    dateOfBirth: '',
  });

  const fetchProfile = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    const res = await profileService.getUserProfile(user.id, user.email);
    if (res.success && res.data) {
      setProfile(res.data);
      setEditForm({
        username: res.data.username || '',
        mobileNumber: res.data.mobileNumber || '',
        faculty: res.data.faculty || '',
        year: res.data.year || '',
        address: res.data.address || '',
        city: res.data.city || '',
        dateOfBirth: res.data.dateOfBirth || '',
      });
    } else {
      setError(res.message || 'Failed to load profile.');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchProfile();
  }, [user?.id]);

  const updateFormFields = (fields: Partial<UpdateProfileRequest>) => {
    setEditForm(prev => ({ ...prev, ...fields }));
  };

  const startEditing = () => {
    if (!profile) return;
    setEditForm({
      username: profile.username || '',
      mobileNumber: profile.mobileNumber || '',
      faculty: profile.faculty || '',
      year: profile.year || '',
      address: profile.address || '',
      city: profile.city || '',
      dateOfBirth: profile.dateOfBirth || '',
    });
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
  };

  const saveProfile = async (): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'No active session.' };
    setIsSaving(true);
    const res = await profileService.updateUserProfile(user.id, editForm);
    if (res.success && res.data) {
      setProfile(res.data);
      
      // Parse username back to firstName and lastName to sync useAuth context
      const parts = (res.data.username || '').trim().split(/\s+/);
      const firstName = parts[0] || 'User';
      const lastName = parts.slice(1).join(' ') || '';
      
      await updateUser({
        firstName,
        lastName,
        studentIdCardNumber: res.data.studentId || undefined,
        isStudentVerified: res.data.role === 'Student' || user.isStudentVerified, // Keep verified status
      });

      setIsEditing(false);
      setIsSaving(false);
      return { success: true };
    } else {
      setIsSaving(false);
      return { success: false, error: res.message || 'Failed to save profile changes.' };
    }
  };

  const changeAvatar = async (): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'No active session.' };
    
    // Request permission first
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      return { success: false, error: 'Media library access is required to update your profile photo.' };
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return { success: false };
    }

    const imageUri = result.assets[0].uri;
    setIsSaving(true);
    const res = await profileService.uploadProfilePicture(user.id, imageUri);
    if (res.success && res.data) {
      const newUrl = res.data.profilePictureUrl;
      setProfile(prev => prev ? { ...prev, profilePictureUrl: newUrl } : null);
      
      // Update the auth context avatar
      await updateUser({
        avatarUrl: newUrl
      });
      
      setIsSaving(false);
      return { success: true };
    } else {
      setIsSaving(false);
      return { success: false, error: res.message || 'Failed to upload image.' };
    }
  };

  const deleteAccount = async (password: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'No active session.' };
    
    const res = await profileService.deleteUserAccount(user.id, password);
    if (res.success) {
      await logout();
      return { success: true };
    } else {
      return { success: false, error: res.message || 'Failed to delete account. Incorrect password?' };
    }
  };

  return {
    profile,
    isLoading,
    isSaving,
    error,
    isEditing,
    editForm,
    fetchProfile,
    startEditing,
    cancelEditing,
    updateFormFields,
    saveProfile,
    changeAvatar,
    deleteAccount,
  };
}
