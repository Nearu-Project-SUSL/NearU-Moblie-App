import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  useColorScheme,
  Platform,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { JobResponse } from '../../types';
import { Colors } from '../../constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  MapPin,
  DollarSign,
  Clock,
  Briefcase,
  Layers,
  User,
  Mail,
  Phone,
  CheckCircle,
} from 'lucide-react-native';
import { HapticService } from '../../services/HapticService';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, SlideInDown, ZoomIn } from 'react-native-reanimated';

interface JobDetailModalProps {
  job: JobResponse | null;
  visible: boolean;
  onClose: () => void;
}

export const JobDetailModal: React.FC<JobDetailModalProps> = ({
  job,
  visible,
  onClose,
}) => {
  const systemTheme = useColorScheme() ?? 'light';
  const themeColors = Colors[systemTheme];
  const insets = useSafeAreaInsets();

  const [isApplying, setIsApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  if (!job) return null;

  const handleApply = () => {
    HapticService.triggerSelection();
    setIsApplying(true);
    
    // Simulate API Application posting
    setTimeout(() => {
      setIsApplying(false);
      setApplied(true);
      HapticService.triggerSuccess();
      
      // Auto close after 2.5s
      setTimeout(() => {
        setApplied(false);
        onClose();
      }, 2500);
    }, 1500);
  };

  const handleEmail = () => {
    if (job.postedBy.email) {
      Linking.openURL(`mailto:${job.postedBy.email}?subject=Job Application: ${job.title}`);
    }
  };

  const handlePhone = () => {
    if (job.postedBy.mobileNumber) {
      Linking.openURL(`tel:${job.postedBy.mobileNumber}`);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={[styles.root, { backgroundColor: themeColors.background, paddingTop: insets.top }]}>
        
        {/* Banner Cover with Gradient overlay */}
        <View style={styles.bannerContainer}>
          <LinearGradient
            colors={systemTheme === 'light' ? ['#2E9EBF', '#156175'] : ['#1E293B', '#0F172A']}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.bannerDecorCircle1} />
          <View style={styles.bannerDecorCircle2} />
          
          <Pressable
            onPress={() => {
              HapticService.triggerTap();
              onClose();
            }}
            style={[styles.closeBtn, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}
          >
            <X size={20} color="#FFFFFF" />
          </Pressable>
          
          <View style={styles.logoBadgeContainer}>
            <View style={styles.logoAvatar}>
              <Text style={styles.logoText}>
                {job.company ? job.company.charAt(0).toUpperCase() : 'G'}
              </Text>
            </View>
            <Text style={styles.bannerTitle} numberOfLines={2}>
              {job.title}
            </Text>
            <Text style={styles.bannerCompany}>
              {job.company}
            </Text>
          </View>
        </View>

        {/* Scrollable details */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        >
          {/* Key details grids */}
          <View style={styles.detailsGrid}>
            <View style={[styles.gridCell, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
              <DollarSign size={16} color={themeColors.success} />
              <View>
                <Text style={[styles.cellLabel, { color: themeColors.textMuted }]}>Salary</Text>
                <Text style={[styles.cellValue, { color: themeColors.text }]}>{job.payRange}</Text>
              </View>
            </View>
            <View style={[styles.gridCell, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
              <MapPin size={16} color="#3B82F6" />
              <View>
                <Text style={[styles.cellLabel, { color: themeColors.textMuted }]}>Location</Text>
                <Text style={[styles.cellValue, { color: themeColors.text }]} numberOfLines={1}>{job.location}</Text>
              </View>
            </View>
            <View style={[styles.gridCell, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
              <Clock size={16} color="#EC4899" />
              <View>
                <Text style={[styles.cellLabel, { color: themeColors.textMuted }]}>Job Type</Text>
                <Text style={[styles.cellValue, { color: themeColors.text }]}>{job.jobType}</Text>
              </View>
            </View>
            <View style={[styles.gridCell, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
              <Layers size={16} color={Colors.brand.accent} />
              <View>
                <Text style={[styles.cellLabel, { color: themeColors.textMuted }]}>Category</Text>
                <Text style={[styles.cellValue, { color: themeColors.text }]}>{job.category}</Text>
              </View>
            </View>
          </View>

          {/* Description Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>About the Role</Text>
            <Text style={[styles.bodyText, { color: themeColors.textSecondary }]}>
              {job.longDescription || job.description}
            </Text>
          </View>

          {/* Requirements Section */}
          {job.requirements && job.requirements.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Requirements</Text>
              <View style={styles.bulletList}>
                {job.requirements.map((req, idx) => (
                  <View key={idx} style={styles.bulletRow}>
                    <View style={[styles.bulletPoint, { backgroundColor: Colors.brand.accent }]} />
                    <Text style={[styles.bulletText, { color: themeColors.textSecondary }]}>{req}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Tags Section */}
          {job.tags && job.tags.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Skills & Tags</Text>
              <View style={styles.tagsContainer}>
                {job.tags.map((tag, idx) => (
                  <View key={idx} style={[styles.tagPill, { backgroundColor: themeColors.surfaceElevated, borderColor: themeColors.border }]}>
                    <Text style={[styles.tagText, { color: themeColors.textSecondary }]}>#{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Posted By Contact Info */}
          <View style={[styles.postedByCard, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
            <Text style={[styles.postedByHeader, { color: themeColors.textMuted }]}>POSTED BY</Text>
            <View style={styles.posterRow}>
              <View style={[styles.posterAvatar, { backgroundColor: systemTheme === 'light' ? '#E2E8F0' : '#334155' }]}>
                <User size={18} color={themeColors.textSecondary} />
              </View>
              <View style={styles.posterInfo}>
                <Text style={[styles.posterName, { color: themeColors.text }]}>{job.postedBy.name}</Text>
                <Text style={[styles.posterEmail, { color: themeColors.textSecondary }]}>{job.postedBy.email}</Text>
              </View>
            </View>

            <View style={styles.contactButtonsRow}>
              <Pressable
                onPress={handleEmail}
                style={[styles.contactBtn, { backgroundColor: themeColors.surfaceElevated, borderColor: themeColors.border }]}
              >
                <Mail size={14} color={Colors.brand.accent} />
                <Text style={[styles.contactBtnText, { color: themeColors.textSecondary }]}>Email Recruiter</Text>
              </Pressable>
              
              {job.postedBy.mobileNumber ? (
                <Pressable
                  onPress={handlePhone}
                  style={[styles.contactBtn, { backgroundColor: themeColors.surfaceElevated, borderColor: themeColors.border }]}
                >
                  <Phone size={14} color={Colors.brand.accent} />
                  <Text style={[styles.contactBtnText, { color: themeColors.textSecondary }]}>Call Contact</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        </ScrollView>

        {/* Footer Fixed Apply Bar */}
        <View style={[styles.footer, { backgroundColor: themeColors.surface, borderTopColor: themeColors.border, paddingBottom: insets.bottom + 12 }]}>
          {!applied ? (
            <Pressable
              onPress={handleApply}
              disabled={isApplying}
              style={[styles.applyBtn, { backgroundColor: Colors.brand.accent }]}
            >
              {isApplying ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.applyBtnText}>Apply Instantly</Text>
              )}
            </Pressable>
          ) : (
            <Animated.View entering={ZoomIn} style={styles.appliedRow}>
              <CheckCircle size={20} color={themeColors.success} />
              <Text style={[styles.appliedText, { color: themeColors.success }]}>Application Submitted!</Text>
            </Animated.View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  bannerContainer: {
    height: 180,
    justifyContent: 'center',
    paddingHorizontal: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  bannerDecorCircle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    top: -100,
    right: -50,
  },
  bannerDecorCircle2: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    bottom: -60,
    left: -25,
  },
  closeBtn: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  logoBadgeContainer: {
    marginTop: 20,
    gap: 4,
  },
  logoAvatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 8,
  },
  logoText: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.brand.accent,
  },
  bannerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  bannerCompany: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
    fontWeight: '600',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  gridCell: {
    flexBasis: '48%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
  },
  cellLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  cellValue: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 10,
  },
  bodyText: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
  },
  bulletList: {
    gap: 8,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
  },
  bulletText: {
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
    fontWeight: '500',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  postedByCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    marginTop: 10,
    gap: 14,
  },
  postedByHeader: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  posterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  posterAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  posterInfo: {
    gap: 1,
  },
  posterName: {
    fontSize: 13,
    fontWeight: '700',
  },
  posterEmail: {
    fontSize: 11,
    fontWeight: '600',
  },
  contactButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  contactBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
  },
  contactBtnText: {
    fontSize: 11,
    fontWeight: '700',
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
  applyBtn: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '900',
  },
  appliedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
  },
  appliedText: {
    fontSize: 14,
    fontWeight: '800',
  },
});
