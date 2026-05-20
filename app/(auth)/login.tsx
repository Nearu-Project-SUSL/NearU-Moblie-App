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
import { KeyRound, Mail, MapPin } from 'lucide-react-native';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading } = useAuth();
  const systemTheme = useColorScheme() ?? 'light';
  const themeColors = Colors[systemTheme];

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMsg('Please populate all credential inputs.');
      return;
    }
    setErrorMsg(null);
    const result = await login(email, password);
    if (!result.success) {
      setErrorMsg(result.error || 'Authentication rejected.');
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Brand Header */}
        <View style={styles.headerBlock}>
          <View style={[styles.logoIconContainer, { backgroundColor: themeColors.primaryLight }]}>
            <MapPin size={32} color={themeColors.primary} />
          </View>
          <Text style={[styles.brandTitle, { color: themeColors.text }]}>NearU</Text>
          <Text style={[styles.brandSubtitle, { color: themeColors.textSecondary }]}>
            Your university campus marketplace. Connect, order, and track locally.
          </Text>
        </View>

        {/* Credentials Form Card */}
        <Card style={styles.formCard} padding="large">
          <Text style={[styles.formTitle, { color: themeColors.text }]}>Welcome Back</Text>
          <Text style={[styles.formSubtitle, { color: themeColors.textSecondary }]}>
            Log in to access your student services
          </Text>

          {errorMsg && (
            <View style={[styles.errorBox, { backgroundColor: themeColors.dangerLight }]}>
              <Text style={[styles.errorText, { color: themeColors.danger }]}>{errorMsg}</Text>
            </View>
          )}

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
                textContentType="emailAddress"
                style={[styles.textInput, { color: themeColors.text }]}
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <View style={styles.passwordHeader}>
              <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>Password</Text>
              <Pressable>
                <Text style={[styles.forgotText, { color: themeColors.primary }]}>Forgot?</Text>
              </Pressable>
            </View>
            <View style={[styles.inputWrapper, { borderColor: themeColors.border, backgroundColor: systemTheme === 'light' ? '#F8FAFC' : '#0F172A' }]}>
              <KeyRound size={18} color={themeColors.textMuted} style={styles.inputIcon} />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={themeColors.textMuted}
                secureTextEntry
                autoCapitalize="none"
                textContentType="password"
                style={[styles.textInput, { color: themeColors.text }]}
              />
            </View>
          </View>

          {/* Login Button */}
          <Button 
            title="Log In" 
            onPress={handleLogin} 
            loading={isLoading}
            variant="primary"
            style={styles.actionBtn}
          />
        </Card>

        {/* Footer Redirect Options */}
        <View style={styles.footerOptions}>
          <Text style={[styles.footerText, { color: themeColors.textSecondary }]}>
            New to NearU?{' '}
          </Text>
          <Pressable onPress={() => router.push('/(auth)/register')}>
            <Text style={[styles.footerLink, { color: themeColors.primary }]}>Create an Account</Text>
          </Pressable>
        </View>
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
    justifyContent: 'center',
    padding: 24,
  },
  headerBlock: {
    alignItems: 'center',
    marginBottom: 32,
    paddingHorizontal: 12,
  },
  logoIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  brandSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  formCard: {
    borderRadius: 20,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 14,
    marginBottom: 20,
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
  inputGroup: {
    marginBottom: 18,
  },
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '600',
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
  footerOptions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '700',
  },
});
