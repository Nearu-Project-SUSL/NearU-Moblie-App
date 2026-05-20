import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  Pressable, 
  useColorScheme, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView 
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { Colors } from '../../constants/Colors';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { KeyRound, Mail, User as UserIcon, ArrowLeft } from 'lucide-react-native';

export default function RegisterScreen() {
  const router = useRouter();
  const { register, isLoading } = useAuth();
  const systemTheme = useColorScheme() ?? 'light';
  const themeColors = Colors[systemTheme];

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRegister = async () => {
    if (!firstName || !lastName || !email || !password) {
      setErrorMsg('Please populate all sign up input fields.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }
    setErrorMsg(null);
    const result = await register(firstName, lastName, email, password);
    if (!result.success) {
      setErrorMsg(result.error || 'Failed to initialize account.');
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Back Button */}
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={themeColors.text} />
          <Text style={[styles.backText, { color: themeColors.text }]}>Back to Login</Text>
        </Pressable>

        {/* Brand Intro */}
        <View style={styles.introBlock}>
          <Text style={[styles.title, { color: themeColors.text }]}>Join NearU</Text>
          <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
            Verify your student ID and gain access to peer-led services and local campus offers
          </Text>
        </View>

        {/* Form Card */}
        <Card style={styles.formCard} padding="large">
          {errorMsg && (
            <View style={[styles.errorBox, { backgroundColor: themeColors.dangerLight }]}>
              <Text style={[styles.errorText, { color: themeColors.danger }]}>{errorMsg}</Text>
            </View>
          )}

          {/* First Name & Last Name */}
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>First Name</Text>
              <View style={[styles.inputWrapper, { borderColor: themeColors.border, backgroundColor: systemTheme === 'light' ? '#F8FAFC' : '#0F172A' }]}>
                <UserIcon size={16} color={themeColors.textMuted} style={styles.inputIcon} />
                <TextInput
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="Alex"
                  placeholderTextColor={themeColors.textMuted}
                  style={[styles.textInput, { color: themeColors.text }]}
                />
              </View>
            </View>
            
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>Last Name</Text>
              <View style={[styles.inputWrapper, { borderColor: themeColors.border, backgroundColor: systemTheme === 'light' ? '#F8FAFC' : '#0F172A' }]}>
                <TextInput
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Smith"
                  placeholderTextColor={themeColors.textMuted}
                  style={[styles.textInput, { color: themeColors.text }]}
                />
              </View>
            </View>
          </View>

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>University Email</Text>
            <View style={[styles.inputWrapper, { borderColor: themeColors.border, backgroundColor: systemTheme === 'light' ? '#F8FAFC' : '#0F172A' }]}>
              <Mail size={18} color={themeColors.textMuted} style={styles.inputIcon} />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="alex@university.edu"
                placeholderTextColor={themeColors.textMuted}
                autoCapitalize="none"
                keyboardType="email-address"
                style={[styles.textInput, { color: themeColors.text }]}
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>Create Password</Text>
            <View style={[styles.inputWrapper, { borderColor: themeColors.border, backgroundColor: systemTheme === 'light' ? '#F8FAFC' : '#0F172A' }]}>
              <KeyRound size={18} color={themeColors.textMuted} style={styles.inputIcon} />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Min. 6 characters"
                placeholderTextColor={themeColors.textMuted}
                secureTextEntry
                autoCapitalize="none"
                style={[styles.textInput, { color: themeColors.text }]}
              />
            </View>
          </View>

          {/* Register Button */}
          <Button 
            title="Create Student Account" 
            onPress={handleRegister} 
            loading={isLoading}
            variant="primary"
            style={styles.actionBtn}
          />
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    alignSelf: 'flex-start',
  },
  backText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  introBlock: {
    marginBottom: 28,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  formCard: {
    borderRadius: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    height: '100%',
  },
  actionBtn: {
    marginTop: 8,
    width: '100%',
  },
  errorBox: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '500',
  },
});
