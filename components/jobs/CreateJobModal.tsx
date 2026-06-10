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
import { JobResponse, CreateJobData } from '../../types';
import { Colors } from '../../constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Plus, AlertCircle } from 'lucide-react-native';
import { HapticService } from '../../services/HapticService';
import { jobService } from '../../services/jobService';
import { useAuth } from '../../hooks/useAuth';

const JOB_TYPES = ['Part-Time', 'Internship', 'Freelance', 'Campus', 'Full-Time'];
const CATEGORIES = ['Campus', 'Delivery', 'Marketing', 'Tutoring', 'Tech', 'Food & Bev', 'Other'];

interface CreateJobModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  jobToEdit?: JobResponse | null;
}

export const CreateJobModal: React.FC<CreateJobModalProps> = ({
  visible,
  onClose,
  onSuccess,
  jobToEdit = null,
}) => {
  const systemTheme = useColorScheme() ?? 'light';
  const themeColors = Colors[systemTheme];
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);

  // Form States
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('');
  const [payRange, setPayRange] = useState('');
  const [jobType, setJobType] = useState('Part-Time');
  const [category, setCategory] = useState('Campus');
  const [description, setDescription] = useState('');
  const [longDescription, setLongDescription] = useState('');
  
  // Custom Tag Inputs
  const [reqInput, setReqInput] = useState('');
  const [requirements, setRequirements] = useState<string[]>([]);
  
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  // Validation state
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  // Pre-fill fields if in Edit Mode
  useEffect(() => {
    if (jobToEdit) {
      setTitle(jobToEdit.title);
      setCompany(jobToEdit.company);
      setLocation(jobToEdit.location);
      setPayRange(jobToEdit.payRange);
      setJobType(jobToEdit.jobType);
      setCategory(jobToEdit.category);
      setDescription(jobToEdit.description);
      setLongDescription(jobToEdit.longDescription || '');
      setRequirements(jobToEdit.requirements || []);
      setTags(jobToEdit.tags || []);
    } else {
      // Clear fields if creating
      setTitle('');
      setCompany('');
      setLocation('');
      setPayRange('');
      setJobType('Part-Time');
      setCategory('Campus');
      setDescription('');
      setLongDescription('');
      setRequirements([]);
      setTags([]);
    }
    setErrors({});
  }, [jobToEdit, visible]);

  const handleAddRequirement = () => {
    if (reqInput.trim()) {
      HapticService.triggerSelection();
      setRequirements([...requirements, reqInput.trim()]);
      setReqInput('');
    }
  };

  const handleRemoveRequirement = (idx: number) => {
    HapticService.triggerSelection();
    setRequirements(requirements.filter((_, i) => i !== idx));
  };

  const handleAddTag = () => {
    if (tagInput.trim()) {
      HapticService.triggerSelection();
      setTags([...tags, tagInput.trim().replace(/\s+/g, '')]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (idx: number) => {
    HapticService.triggerSelection();
    setTags(tags.filter((_, i) => i !== idx));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, boolean> = {};
    if (!title.trim()) newErrors.title = true;
    if (!company.trim()) newErrors.company = true;
    if (!location.trim()) newErrors.location = true;
    if (!payRange.trim()) newErrors.payRange = true;
    if (!description.trim()) newErrors.description = true;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    HapticService.triggerSelection();
    if (!validate()) {
      HapticService.triggerError();
      Alert.alert('Incomplete Form', 'Please fill in all the required fields marked in red.');
      return;
    }

    setLoading(true);

    const payload: CreateJobData = {
      title: title.trim(),
      company: company.trim(),
      location: location.trim(),
      payRange: payRange.trim(),
      jobType,
      category,
      description: description.trim(),
      longDescription: longDescription.trim() || description.trim(),
      requirements,
      tags,
    };

    try {
      let res;
      if (jobToEdit) {
        res = await jobService.updateJob(jobToEdit.id, payload);
      } else {
        res = await jobService.createJob(payload, user);
      }

      if (res.success) {
        HapticService.triggerSuccess();
        onSuccess();
        onClose();
      } else {
        HapticService.triggerError();
        Alert.alert('Error', res.message || 'Failed to submit the gig.');
      }
    } catch (err: any) {
      HapticService.triggerError();
      Alert.alert('Error', err.message || 'An unexpected networking failure occurred.');
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
        {/* Header bar */}
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
            {jobToEdit ? 'Update Gig Listing' : 'Post a New Gig'}
          </Text>
          <View style={styles.closeIconPlaceholder} />
        </View>

        {/* Scrollable form */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.formContent, { paddingBottom: 120 }]}
          keyboardShouldPersistTaps="handled"
        >
          {/* 1. Job Title */}
          <View style={styles.formGroup}>
            <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>
              Gig Title <Text style={{ color: Colors.brand.logoCoral }}>*</Text>
            </Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Computer Lab Assistant"
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

          {/* 2. Company / Department */}
          <View style={styles.formGroup}>
            <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>
              Offering Organization / Dept <Text style={{ color: Colors.brand.logoCoral }}>*</Text>
            </Text>
            <TextInput
              value={company}
              onChangeText={setCompany}
              placeholder="e.g. Faculty of Computing"
              placeholderTextColor={themeColors.textMuted}
              style={[
                styles.textInput,
                {
                  color: themeColors.text,
                  backgroundColor: themeColors.surface,
                  borderColor: errors.company ? Colors.brand.logoCoral : themeColors.border,
                },
              ]}
            />
          </View>

          {/* 3. Location */}
          <View style={styles.formGroup}>
            <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>
              Location <Text style={{ color: Colors.brand.logoCoral }}>*</Text>
            </Text>
            <TextInput
              value={location}
              onChangeText={setLocation}
              placeholder="e.g. Main Lab Complex, SUSL"
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

          {/* 4. Pay Range */}
          <View style={styles.formGroup}>
            <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>
              Pay Range / Rate <Text style={{ color: Colors.brand.logoCoral }}>*</Text>
            </Text>
            <TextInput
              value={payRange}
              onChangeText={setPayRange}
              placeholder="e.g. Rs. 500/hr or Rs. 5,000/gig"
              placeholderTextColor={themeColors.textMuted}
              style={[
                styles.textInput,
                {
                  color: themeColors.text,
                  backgroundColor: themeColors.surface,
                  borderColor: errors.payRange ? Colors.brand.logoCoral : themeColors.border,
                },
              ]}
            />
          </View>

          {/* 5. Job Type selector */}
          <View style={styles.formGroup}>
            <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>Gig Type</Text>
            <View style={styles.pickerRow}>
              {JOB_TYPES.map((type) => {
                const active = jobType === type;
                return (
                  <Pressable
                    key={type}
                    onPress={() => {
                      HapticService.triggerSelection();
                      setJobType(type);
                    }}
                    style={[
                      styles.pickerPill,
                      {
                        backgroundColor: active
                          ? systemTheme === 'light'
                            ? '#EBF5FF'
                            : 'rgba(59, 130, 246, 0.2)'
                          : themeColors.surface,
                        borderColor: active ? '#3B82F6' : themeColors.border,
                      },
                    ]}
                  >
                    <Text style={[styles.pickerText, { color: active ? '#3B82F6' : themeColors.textSecondary }]}>
                      {type}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* 6. Category selector */}
          <View style={styles.formGroup}>
            <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>Category</Text>
            <View style={styles.pickerRow}>
              {CATEGORIES.map((cat) => {
                const active = category === cat;
                return (
                  <Pressable
                    key={cat}
                    onPress={() => {
                      HapticService.triggerSelection();
                      setCategory(cat);
                    }}
                    style={[
                      styles.pickerPill,
                      {
                        backgroundColor: active
                          ? systemTheme === 'light'
                            ? '#FCE7F3'
                            : 'rgba(236, 72, 153, 0.2)'
                          : themeColors.surface,
                        borderColor: active ? '#EC4899' : themeColors.border,
                      },
                    ]}
                  >
                    <Text style={[styles.pickerText, { color: active ? '#EC4899' : themeColors.textSecondary }]}>
                      {cat}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* 7. Short Description */}
          <View style={styles.formGroup}>
            <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>
              Short Description <Text style={{ color: Colors.brand.logoCoral }}>*</Text>
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="A brief 1-2 sentence overview of the role..."
              placeholderTextColor={themeColors.textMuted}
              style={[
                styles.textInput,
                styles.textAreaShort,
                {
                  color: themeColors.text,
                  backgroundColor: themeColors.surface,
                  borderColor: errors.description ? Colors.brand.logoCoral : themeColors.border,
                },
              ]}
              multiline
              numberOfLines={2}
            />
          </View>

          {/* 8. Long Description */}
          <View style={styles.formGroup}>
            <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>Detailed Role Description</Text>
            <TextInput
              value={longDescription}
              onChangeText={setLongDescription}
              placeholder="Provide all essential guidelines, job duties, schedules, and work setup details..."
              placeholderTextColor={themeColors.textMuted}
              style={[
                styles.textInput,
                styles.textAreaLong,
                {
                  color: themeColors.text,
                  backgroundColor: themeColors.surface,
                  borderColor: themeColors.border,
                },
              ]}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
            />
          </View>

          {/* 9. Requirements Manager */}
          <View style={styles.formGroup}>
            <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>Candidate Requirements</Text>
            <View style={styles.tagInputRow}>
              <TextInput
                value={reqInput}
                onChangeText={setReqInput}
                placeholder="e.g. undergraduate, min 10 hrs"
                placeholderTextColor={themeColors.textMuted}
                onSubmitEditing={handleAddRequirement}
                style={[
                  styles.textInput,
                  {
                    color: themeColors.text,
                    backgroundColor: themeColors.surface,
                    borderColor: themeColors.border,
                    flex: 1,
                    marginBottom: 0,
                  },
                ]}
              />
              <Pressable
                onPress={handleAddRequirement}
                style={[styles.addTagBtn, { backgroundColor: Colors.brand.accent }]}
              >
                <Plus size={18} color="#000000" />
              </Pressable>
            </View>

            <View style={styles.tagsContainer}>
              {requirements.map((req, idx) => (
                <View key={idx} style={[styles.tagItem, { backgroundColor: themeColors.surfaceElevated, borderColor: themeColors.border }]}>
                  <Text style={[styles.tagItemText, { color: themeColors.text }]} numberOfLines={1}>
                    {req}
                  </Text>
                  <Pressable onPress={() => handleRemoveRequirement(idx)} style={styles.removeTagBtn}>
                    <X size={12} color={themeColors.textMuted} />
                  </Pressable>
                </View>
              ))}
            </View>
          </View>

          {/* 10. Tags Manager */}
          <View style={styles.formGroup}>
            <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>Tags & Skills</Text>
            <View style={styles.tagInputRow}>
              <TextInput
                value={tagInput}
                onChangeText={setTagInput}
                placeholder="e.g. Figma, Creative, Admin"
                placeholderTextColor={themeColors.textMuted}
                onSubmitEditing={handleAddTag}
                style={[
                  styles.textInput,
                  {
                    color: themeColors.text,
                    backgroundColor: themeColors.surface,
                    borderColor: themeColors.border,
                    flex: 1,
                    marginBottom: 0,
                  },
                ]}
              />
              <Pressable
                onPress={handleAddTag}
                style={[styles.addTagBtn, { backgroundColor: Colors.brand.accent }]}
              >
                <Plus size={18} color="#000000" />
              </Pressable>
            </View>

            <View style={styles.tagsContainer}>
              {tags.map((tag, idx) => (
                <View key={idx} style={[styles.tagItem, { backgroundColor: themeColors.surfaceElevated, borderColor: themeColors.border }]}>
                  <Text style={[styles.tagItemText, { color: themeColors.text }]}>#{tag}</Text>
                  <Pressable onPress={() => handleRemoveTag(idx)} style={styles.removeTagBtn}>
                    <X size={12} color={themeColors.textMuted} />
                  </Pressable>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Footer Submit Button */}
        <View style={[styles.footer, { backgroundColor: themeColors.surface, borderTopColor: themeColors.border, paddingBottom: insets.bottom + 12 }]}>
          <Pressable
            onPress={handleSubmit}
            disabled={loading}
            style={[styles.submitBtn, { backgroundColor: Colors.brand.accent }]}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.submitBtnText}>
                {jobToEdit ? 'Save Changes' : 'Publish Gig Listing'}
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
  textAreaShort: {
    height: 60,
    paddingVertical: 10,
    textAlignVertical: 'top',
  },
  textAreaLong: {
    height: 120,
    paddingVertical: 12,
  },
  pickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pickerPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  pickerText: {
    fontSize: 11,
    fontWeight: '700',
  },
  tagInputRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  addTagBtn: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  tagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 10,
    paddingRight: 6,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
  },
  tagItemText: {
    fontSize: 11,
    fontWeight: '600',
    maxWidth: 160,
  },
  removeTagBtn: {
    padding: 3,
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
