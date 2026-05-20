import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Image, 
  TextInput, 
  useColorScheme, 
  ScrollView,
  Pressable 
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { Colors } from '../../constants/Colors';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { 
  User, 
  ShieldCheck, 
  ShieldAlert, 
  ChevronRight, 
  LogOut, 
  Settings, 
  Store, 
  HelpCircle,
  CheckCircle2
} from 'lucide-react-native';

export default function ProfileScreen() {
  const { user, logout, verifyStudentId, isLoading } = useAuth();
  const systemTheme = useColorScheme() ?? 'light';
  const themeColors = Colors[systemTheme];

  const [studentCardNum, setStudentCardNum] = useState('');
  const [showVerifyInput, setShowVerifyInput] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifySuccess, setVerifySuccess] = useState(false);

  const handleVerifyId = async () => {
    if (!studentCardNum) {
      setVerifyError('Please enter your card number.');
      return;
    }
    setVerifyError(null);
    const result = await verifyStudentId(studentCardNum);
    if (result.success) {
      setVerifySuccess(true);
      setTimeout(() => {
        setShowVerifyInput(false);
      }, 1500);
    } else {
      setVerifyError(result.error || 'Verification failed.');
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  const actionItems = [
    { label: 'Register as Service Provider', sub: 'Sell printing, food or errand runs to peers', icon: <Store size={18} color={themeColors.primary} />, link: null },
    { label: 'Campus Settings', sub: 'Change primary campus location & notifications', icon: <Settings size={18} color={themeColors.textSecondary} />, link: null },
    { label: 'Help & Support Desk', sub: 'Browse FAQs or contact student moderators', icon: <HelpCircle size={18} color={themeColors.textSecondary} />, link: null },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: themeColors.background }]}>
      
      {/* Profile Header */}
      <View style={[styles.profileHeader, { backgroundColor: themeColors.surface, borderBottomColor: themeColors.border }]}>
        <View style={styles.avatarWrapper}>
          {user?.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: themeColors.primaryLight }]}>
              <User size={36} color={themeColors.primary} />
            </View>
          )}
          {user?.isStudentVerified && (
            <View style={[styles.verifiedBadge, { backgroundColor: themeColors.success }]}>
              <ShieldCheck size={12} color="#FFFFFF" />
            </View>
          )}
        </View>

        <Text style={[styles.fullName, { color: themeColors.text }]}>
          {user?.firstName} {user?.lastName}
        </Text>
        
        <Text style={[styles.email, { color: themeColors.textSecondary }]}>
          {user?.email}
        </Text>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        
        {/* Verification Status Card */}
        <Card variant="bordered" style={styles.verifyCard}>
          {user?.isStudentVerified ? (
            <View style={styles.verifiedRow}>
              <ShieldCheck size={28} color={themeColors.success} style={styles.verifyIcon} />
              <View style={styles.verifyInfo}>
                <Text style={[styles.verifyTitle, { color: themeColors.text }]}>Verified Student ID</Text>
                <Text style={[styles.verifyDesc, { color: themeColors.textSecondary }]}>
                  Your account is verified. Card: {user.studentIdCardNumber}
                </Text>
              </View>
            </View>
          ) : (
            <View>
              <View style={styles.verifiedRow}>
                <ShieldAlert size={28} color={themeColors.warning} style={styles.verifyIcon} />
                <View style={styles.verifyInfo}>
                  <Text style={[styles.verifyTitle, { color: themeColors.text }]}>Verify Student ID</Text>
                  <Text style={[styles.verifyDesc, { color: themeColors.textSecondary }]}>
                    Unlock all peer marketplace operations by registering your university card.
                  </Text>
                </View>
              </View>
              
              {!showVerifyInput ? (
                <Button 
                  title="Verify Card Now" 
                  onPress={() => setShowVerifyInput(true)} 
                  variant="primary" 
                  size="small"
                  style={styles.verifyBtn}
                />
              ) : (
                <View style={styles.verifyInputWrapper}>
                  {verifySuccess ? (
                    <View style={styles.successWrapper}>
                      <CheckCircle2 size={16} color={themeColors.success} style={{ marginRight: 6 }} />
                      <Text style={[styles.successText, { color: themeColors.success }]}>Successfully Verified!</Text>
                    </View>
                  ) : (
                    <>
                      <TextInput
                        value={studentCardNum}
                        onChangeText={setStudentCardNum}
                        placeholder="Enter Student ID (e.g. STU-990)"
                        placeholderTextColor={themeColors.textMuted}
                        style={[styles.verifyInput, { color: themeColors.text, borderColor: themeColors.border, backgroundColor: systemTheme === 'light' ? '#F8FAFC' : '#0F172A' }]}
                      />
                      {verifyError && <Text style={[styles.errorText, { color: themeColors.danger }]}>{verifyError}</Text>}
                      <View style={styles.verifyActions}>
                        <Button title="Cancel" onPress={() => setShowVerifyInput(false)} variant="secondary" size="small" style={{ marginRight: 8 }} />
                        <Button title="Verify" onPress={handleVerifyId} loading={isLoading} size="small" />
                      </View>
                    </>
                  )}
                </View>
              )}
            </View>
          )}
        </Card>

        {/* Action Options List */}
        <Text style={[styles.sectionTitle, { color: themeColors.textSecondary }]}>Account Services</Text>
        <Card variant="elevated" style={styles.actionCard} padding="none">
          {actionItems.map((item, idx) => (
            <Pressable 
              key={idx} 
              style={({ pressed }) => [
                styles.actionRow, 
                { borderBottomColor: themeColors.border },
                pressed && { backgroundColor: systemTheme === 'light' ? '#F8FAFC' : '#1E293B' }
              ]}
            >
              <View style={styles.actionMain}>
                <View style={[styles.actionIconBg, { backgroundColor: systemTheme === 'light' ? '#F1F5F9' : '#0F172A' }]}>
                  {item.icon}
                </View>
                <View style={styles.actionText}>
                  <Text style={[styles.actionLabel, { color: themeColors.text }]}>{item.label}</Text>
                  <Text style={[styles.actionSub, { color: themeColors.textSecondary }]}>{item.sub}</Text>
                </View>
              </View>
              <ChevronRight size={18} color={themeColors.textMuted} />
            </Pressable>
          ))}
        </Card>

        {/* Logout Panel */}
        <Button 
          title="Sign Out" 
          onPress={handleLogout} 
          variant="outline" 
          loading={isLoading}
          icon={<LogOut size={16} color={themeColors.danger} />}
          textStyle={{ color: themeColors.danger }}
          style={[styles.logoutBtn, { borderColor: themeColors.danger }]}
        />
        
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    paddingTop: 64,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomRightRadius: 24,
    borderBottomLeftRadius: 24,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  fullName: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  email: {
    fontSize: 13,
    fontWeight: '500',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  verifyCard: {
    marginBottom: 24,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifyIcon: {
    marginRight: 14,
  },
  verifyInfo: {
    flex: 1,
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
  },
  verifyInputWrapper: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.1)',
    paddingTop: 12,
  },
  verifyInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 38,
    fontSize: 13,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 11,
    fontWeight: '500',
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
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    paddingLeft: 4,
  },
  actionCard: {
    marginBottom: 28,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  actionMain: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  actionIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  actionText: {
    flex: 1,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  actionSub: {
    fontSize: 11,
  },
  logoutBtn: {
    marginTop: 8,
    width: '100%',
    backgroundColor: 'transparent',
    borderWidth: 1.5,
  },
});
