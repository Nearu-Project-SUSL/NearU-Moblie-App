import React, { useState, useRef, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  Pressable, 
  useColorScheme, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView,
  StatusBar,
  Animated
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { Colors } from '../../constants/Colors';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { HapticService } from '../../services/HapticService';
import { GoogleIcon } from '../../components/GoogleIcon';
import { NearULogo } from '../../components/NearULogo';
import { KeyRound, Mail, Eye, EyeOff, Sparkles, AlertCircle, UserPlus } from 'lucide-react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import Constants, { ExecutionEnvironment } from 'expo-constants';

export default function LoginScreen() {
  const router = useRouter();
  const { login, loginWithGoogle } = useAuth();
  const systemTheme = useColorScheme() ?? 'dark'; // Fallback to dark for premium look
  const themeColors = Colors[systemTheme];
  const isDark = systemTheme === 'dark';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Validation and Status states
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'error' | 'warning' | 'success' } | null>(null);

  // Local interaction loaders and active focused glows
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Performance: Offloaded Native-Thread Pulsating Animations
  const orb1Scale = useRef(new Animated.Value(1)).current;
  const orb2Scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const createOrbAnimation = (value: Animated.Value, toValue: number, duration: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(value, {
            toValue: toValue,
            duration: duration,
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 1,
            duration: duration,
            useNativeDriver: true,
          })
        ])
      );
    };

    const anim1 = createOrbAnimation(orb1Scale, 1.15, 7000);
    const anim2 = createOrbAnimation(orb2Scale, 1.20, 8500);

    anim1.start();
    const delayTimer = setTimeout(() => {
      anim2.start();
    }, 1500);

    return () => {
      anim1.stop();
      anim2.stop();
      clearTimeout(delayTimer);
    };
  }, []);

  // Email format validator
  const validateEmail = (text: string) => {
    const reg = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w\w+)+$/;
    return reg.test(text);
  };

  const handleLogin = async () => {
    let hasError = false;

    if (!email) {
      setEmailError('Email is required');
      hasError = true;
    } else if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      hasError = true;
    } else {
      setEmailError(null);
    }

    if (!password) {
      setPasswordError('Password is required');
      hasError = true;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      hasError = true;
    } else {
      setPasswordError(null);
    }

    if (hasError) {
      HapticService.triggerError();
      return;
    }

    setStatusMsg(null);
    HapticService.triggerTap();
    setIsSubmitting(true);
    
    // Call authentication service
    const result = await login(email, password);
    setIsSubmitting(false);
    
    if (result.success) {
      HapticService.triggerSuccess();
      if (result.error) {
        // Logged in successfully but with a warning (e.g. Mock fail-safe fallback)
        setStatusMsg({ text: result.error, type: 'warning' });
        setTimeout(() => {
          router.replace('/(tabs)/browse');
        }, 1500);
      } else {
        setStatusMsg({ text: 'Sign in successful! Entering campus...', type: 'success' });
        setTimeout(() => {
          router.replace('/(tabs)/browse');
        }, 800);
      }
    } else {
      HapticService.triggerError();
      setStatusMsg({ text: result.error || 'Authentication rejected.', type: 'error' });
    }
  };

  const handleGuestLogin = async () => {
    HapticService.triggerSuccess();
    setStatusMsg({ text: 'Logging in as Guest Student...', type: 'success' });
    setIsSubmitting(true);
    const result = await login('guest@nearu.com', 'password123');
    setIsSubmitting(false);
    if (result.success) {
      router.replace('/(tabs)/browse');
    } else {
      HapticService.triggerError();
      setStatusMsg({ text: 'Failed to access guest session.', type: 'error' });
    }
  };

  const handleGoogleLogin = async () => {
    // Detect if running in Expo Go (native Google SDK isn't linked/available in Expo Go)
    const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
    
    if (isExpoGo) {
      HapticService.triggerSelection();
      setStatusMsg({
        text: 'Google Sign-in requires native configurations. Logging in with a guest student account.',
        type: 'warning'
      });
      setTimeout(() => {
        handleGuestLogin();
      }, 3000);
      return;
    }

    try {
      HapticService.triggerTap();
      setStatusMsg(null);
      setIsSubmitting(true);

      // Verify Google Play Services is available
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      
      // Sign in
      const response = await GoogleSignin.signIn();
      const idToken = response.data?.idToken;

      if (!idToken) {
        throw new Error('No ID Token received from Google Sign-in.');
      }

      const googleUser = response.data?.user;
      
      // Perform context login
      const result = await loginWithGoogle(idToken, googleUser);
      setIsSubmitting(false);

      if (result.success) {
        HapticService.triggerSuccess();
        if (result.error) {
          // Warning/Notice about local mock mode
          setStatusMsg({ text: result.error, type: 'warning' });
          setTimeout(() => {
            router.replace('/(tabs)/browse');
          }, 2500);
        } else {
          setStatusMsg({ text: 'Sign in successful! Welcome to campus.', type: 'success' });
          setTimeout(() => {
            router.replace('/(tabs)/browse');
          }, 800);
        }
      } else {
        HapticService.triggerError();
        setStatusMsg({ text: result.error || 'Google login failed.', type: 'error' });
      }
    } catch (error: any) {
      setIsSubmitting(false);
      HapticService.triggerError();
      
      if (error.code === 'SIGN_IN_CANCELLED') {
        setStatusMsg({ text: 'Google Sign-in cancelled by user.', type: 'warning' });
      } else if (error.code === 'IN_PROGRESS') {
        setStatusMsg({ text: 'Google Sign-in is already in progress.', type: 'warning' });
      } else if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
        setStatusMsg({ text: 'Google Play Services not available or outdated.', type: 'error' });
      } else {
        setStatusMsg({ text: error.message || 'Google Sign-in failed.', type: 'error' });
      }
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
      style={[styles.container, { backgroundColor: isDark ? '#080C14' : '#F8FAFC' }]}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* 60FPS Pulsating Background Orbs */}
      <View style={styles.backgroundContainer} pointerEvents="none">
        <Animated.View style={[
          styles.glowingOrb, 
          styles.orbTopRight, 
          { 
            backgroundColor: isDark ? 'rgba(59, 130, 246, 0.11)' : 'rgba(37, 99, 235, 0.08)',
            transform: [{ scale: orb1Scale }] 
          }
        ]} />
        <Animated.View style={[
          styles.glowingOrb, 
          styles.orbBottomLeft, 
          { 
            backgroundColor: isDark ? 'rgba(46, 158, 191, 0.13)' : 'rgba(46, 158, 191, 0.07)',
            transform: [{ scale: orb2Scale }] 
          }
        ]} />
      </View>

      <ScrollView 
        style={{ flex: 1, zIndex: 1 }}
        contentContainerStyle={styles.scrollContent} 
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Brand Header */}
        <View style={styles.headerBlock}>
          <View 
            style={[styles.logoIconContainer, { 
              backgroundColor: isDark ? 'rgba(46, 158, 191, 0.08)' : 'rgba(46, 158, 191, 0.05)',
              borderColor: isDark ? 'rgba(46, 158, 191, 0.25)' : 'rgba(46, 158, 191, 0.15)',
              borderWidth: 1.5,
              padding: 8,
              borderRadius: 26,
              width: 84,
              height: 84,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 14,
            }]}
            accessible={true}
            accessibilityRole="image"
            accessibilityLabel="NearU Logo"
          >
            <NearULogo size={62} />
          </View>
          <Text style={[styles.brandTitle, { color: themeColors.text }]}>NearU</Text>
          <Text style={[styles.brandSubtitle, { color: themeColors.textSecondary }]}>
            Connecting Your Campus • One Tap Away
          </Text>
          

        </View>

        {/* Credentials Form Card */}
        <Card 
          variant={isDark ? 'elevated' : 'bordered'} 
          padding="large" 
          style={{
            ...styles.formCard, 
            backgroundColor: isDark ? 'rgba(30, 41, 59, 0.65)' : 'rgba(255, 255, 255, 0.9)',
            borderColor: isDark ? 'rgba(46, 158, 191, 0.25)' : '#E2E8F0',
            borderWidth: 1.5,
          }}
        >
          <View style={styles.cardHeader}>
            <Text style={[styles.formTitle, { color: themeColors.text }]}>Welcome Back</Text>
            <Text style={[styles.formSubtitle, { color: themeColors.textSecondary }]}>
              Enter credentials to access campus services
            </Text>
          </View>

          {/* Status Message (Toasts/Errors) */}
          {statusMsg && (
            <View 
              style={[
                styles.statusBox, 
                { 
                  backgroundColor: statusMsg.type === 'error' ? themeColors.dangerLight : 
                                  statusMsg.type === 'warning' ? themeColors.warningLight : 
                                  themeColors.successLight 
                }
              ]}
              accessible={true}
              accessibilityRole="alert"
              accessibilityLabel={`Authentication status: ${statusMsg.text}`}
            >
              <AlertCircle size={16} color={
                statusMsg.type === 'error' ? themeColors.danger : 
                statusMsg.type === 'warning' ? themeColors.warning : 
                themeColors.success
              } style={styles.statusIcon} />
              <Text style={[
                styles.statusText, 
                { 
                  color: statusMsg.type === 'error' ? themeColors.danger : 
                         statusMsg.type === 'warning' ? themeColors.warning : 
                         themeColors.success 
                }
              ]}>
                {statusMsg.text}
              </Text>
            </View>
          )}

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>University Email</Text>
            <View style={[
              styles.inputWrapper, 
              { 
                borderColor: emailError ? themeColors.danger : isDark ? 'rgba(46, 158, 191, 0.25)' : themeColors.border, 
                backgroundColor: isDark ? 'rgba(15, 23, 42, 0.6)' : '#F8FAFC',
              }
            ]}>
              <Mail size={18} color={emailError ? themeColors.danger : themeColors.textMuted} style={styles.inputIcon} />
              <TextInput
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (emailError) setEmailError(null);
                }}
                placeholder="student@sab.lk"
                placeholderTextColor={themeColors.textMuted}
                autoCapitalize="none"
                keyboardType="email-address"
                textContentType="emailAddress"
                style={[styles.textInput, { color: themeColors.text }]}
                editable={!isSubmitting}
                accessible={true}
                accessibilityLabel="University Email Input field"
                accessibilityHint="Enter your registered campus email address."
              />
            </View>
            {emailError && <Text style={[styles.errorLabel, { color: themeColors.danger }]}>{emailError}</Text>}
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <View style={styles.passwordHeader}>
              <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>Password</Text>
              <Pressable 
                onPress={() => {
                  HapticService.triggerSelection();
                  router.push('/(auth)/forgot');
                }}
                style={styles.forgotBtn}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Forgot Password link"
                accessibilityHint="Double tap to reset your login password."
              >
                <Text style={[styles.forgotText, { color: isDark ? '#60A5FA' : themeColors.primary }]}>Forgot Password?</Text>
              </Pressable>
            </View>
            <View style={[
              styles.inputWrapper, 
              { 
                borderColor: passwordError ? themeColors.danger : isDark ? 'rgba(46, 158, 191, 0.25)' : themeColors.border, 
                backgroundColor: isDark ? 'rgba(15, 23, 42, 0.6)' : '#F8FAFC',
              }
            ]}>
              <KeyRound size={18} color={passwordError ? themeColors.danger : themeColors.textMuted} style={styles.inputIcon} />
              <TextInput
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (passwordError) setPasswordError(null);
                }}
                placeholder="Enter password"
                placeholderTextColor={themeColors.textMuted}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                textContentType="password"
                style={[styles.textInput, { color: themeColors.text }]}
                editable={!isSubmitting}
                accessible={true}
                accessibilityLabel="Password Input field"
                accessibilityHint="Enter your secure password."
              />
              <Pressable 
                onPress={() => {
                  setShowPassword(!showPassword);
                }} 
                style={styles.eyeBtn}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? "Hide password text" : "Reveal password text"}
              >
                {showPassword ? (
                  <EyeOff size={18} color={themeColors.textMuted} />
                ) : (
                  <Eye size={18} color={themeColors.textMuted} />
                )}
              </Pressable>
            </View>
            {passwordError && <Text style={[styles.errorLabel, { color: themeColors.danger }]}>{passwordError}</Text>}
          </View>

          {/* Login Button */}
          <Button 
            title="Log In" 
            onPress={handleLogin} 
            loading={isSubmitting}
            variant="primary"
            style={[styles.actionBtn, { 
              backgroundColor: isDark ? '#2E9EBF' : themeColors.primary,
              shadowColor: isDark ? '#2E9EBF' : themeColors.primary,
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: isDark ? 0.3 : 0.15,
              shadowRadius: 10,
              elevation: 4
            }]}
            textStyle={{ color: isDark ? '#000000' : '#FFFFFF', fontWeight: '700' }}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Primary Log In Button"
            accessibilityHint="Double tap to authenticate your credentials."
          />

          {/* Prominent Create Account Button */}
          <Button 
            title="Create an Account" 
            onPress={() => {
              router.push('/(auth)/register');
            }} 
            variant="outline"
            icon={<UserPlus size={16} color={isDark ? '#60A5FA' : themeColors.primary} />}
            style={[styles.actionBtn, { 
              marginTop: 12,
              backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
              borderWidth: 0,
              borderRadius: 14,
              elevation: 0,
              shadowOpacity: 0,
            }]}
            textStyle={{ color: isDark ? '#60A5FA' : themeColors.primary, fontWeight: '700' }}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Primary Create an Account Button"
            accessibilityHint="Double tap to switch to user registration wizards."
          />

          {/* Or Divider */}
          <View style={styles.dividerBlock}>
            <View style={[styles.dividerLine, { backgroundColor: isDark ? 'rgba(46, 158, 191, 0.2)' : themeColors.border }]} />
            <Text style={[styles.dividerText, { color: themeColors.textMuted, backgroundColor: isDark ? '#1C2738' : '#FFFFFF' }]}>
              OR CONTINUE WITH
            </Text>
          </View>

          {/* Social and Guest Access Buttons */}
          <View style={styles.row}>
            <Pressable 
              onPress={handleGoogleLogin} 
              style={[
                styles.socialBtn, 
                { 
                  borderColor: isDark ? 'rgba(46, 158, 191, 0.2)' : themeColors.border,
                  backgroundColor: isDark ? 'rgba(15, 23, 42, 0.4)' : '#FFFFFF' 
                }
              ]}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Google Authentication button"
            >
              <GoogleIcon size={14} style={{ marginRight: 6 }} />
              <Text style={[styles.socialBtnText, { color: themeColors.text }]}>Google</Text>
            </Pressable>

            <Pressable 
              onPress={handleGuestLogin} 
              style={[
                styles.socialBtn, 
                { 
                  borderColor: isDark ? 'rgba(46, 158, 191, 0.2)' : themeColors.border,
                  backgroundColor: isDark ? 'rgba(15, 23, 42, 0.4)' : '#FFFFFF'
                }
              ]}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel="Guest Access button"
              accessibilityHint="Instant student preview session"
            >
              <Sparkles size={14} color={isDark ? '#60A5FA' : themeColors.primary} style={{ marginRight: 6 }} />
              <Text style={[styles.socialBtnText, { color: themeColors.text }]}>Guest</Text>
            </Pressable>
          </View>

        </Card>

        {/* Footer Redirect Options */}
        <View style={styles.footerOptions}>
          <Text style={[styles.footerText, { color: themeColors.textSecondary }]}>
            New to NearU?{' '}
          </Text>
          <Pressable 
            onPress={() => {
              router.push('/(auth)/register');
            }}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Create Account link text"
          >
            <Text style={[styles.footerLink, { color: isDark ? '#60A5FA' : themeColors.primary }]}>Create an Account</Text>
          </Pressable>
        </View>
        
        <Text style={[styles.legalText, { color: themeColors.textMuted }]}>
          By continuing, you agree to NearU's Terms of Service and Privacy Policy.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    zIndex: 0,
  },
  glowingOrb: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    opacity: 0.8,
  },
  orbTopRight: {
    top: -50,
    right: -50,
  },
  orbBottomLeft: {
    bottom: -80,
    left: -80,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 22,
    zIndex: 1,
  },
  headerBlock: {
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 12,
  },
  logoIconContainer: {
    width: 68,
    height: 68,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    marginBottom: 14,
  },
  brandTitle: {
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -0.8,
    marginBottom: 6,
  },
  brandSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 0.2,
  },

  formCard: {
    borderRadius: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  cardHeader: {
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: -0.4,
  },
  formSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  statusIcon: {
    marginRight: 10,
  },
  statusText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  inputGroup: {
    marginBottom: 15,
  },
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  forgotBtn: {
    paddingVertical: 2,
  },
  forgotText: {
    fontSize: 12,
    fontWeight: '700',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    height: '100%',
  },
  eyeBtn: {
    padding: 6,
  },
  errorLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
    marginLeft: 2,
  },
  actionBtn: {
    marginTop: 10,
    width: '100%',
    height: 50,
  },
  dividerBlock: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    width: '100%',
  },
  dividerLine: {
    height: 1,
    width: '100%',
  },
  dividerText: {
    position: 'absolute',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    paddingHorizontal: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  socialBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderRadius: 14,
    height: 46,
    marginHorizontal: 6,
  },
  socialBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  footerOptions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
  },
  footerText: {
    fontSize: 13,
    fontWeight: '500',
  },
  footerLink: {
    fontSize: 13,
    fontWeight: '800',
  },
  legalText: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 16,
    paddingHorizontal: 12,
  },
});
