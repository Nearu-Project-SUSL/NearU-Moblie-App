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
import { 
  Mail, 
  KeyRound, 
  ArrowLeft, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  EyeOff,
  Lock
} from 'lucide-react-native';

type ResetStep = 0 | 1 | 2 | 3; // 0: Email request, 1: OTP verification, 2: New password, 3: Success

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { requestPasswordReset, resetPassword } = useAuth();
  const systemTheme = useColorScheme() ?? 'dark';
  const themeColors = Colors[systemTheme];
  const isDark = systemTheme === 'dark';

  const [activeStep, setActiveStep] = useState<ResetStep>(0);
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status and Validation errors
  const [emailError, setEmailError] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'error' | 'warning' | 'success' } | null>(null);

  // Isolated local step loader & input focus glow state
  const [isStepLoading, setIsStepLoading] = useState(false);
  const [isOtpFocused, setIsOtpFocused] = useState(false);
  const otpInputRef = useRef<TextInput>(null);

  // Pulsating Background Animations (Offloaded to Native Thread)
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

  const validateEmail = (text: string) => {
    const reg = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w\w+)+$/;
    return reg.test(text);
  };

  // Password strength algorithm
  const getPasswordStrength = (passVal: string) => {
    if (!passVal) return { score: 0, label: '', color: 'transparent' };
    let score = 0;
    if (passVal.length >= 6) score += 1;
    if (passVal.length >= 10) score += 1;
    if (/[A-Z]/.test(passVal)) score += 1;
    if (/[0-9]/.test(passVal)) score += 1;
    if (/[^A-Za-z0-9]/.test(passVal)) score += 1;

    switch (score) {
      case 0:
      case 1:
      case 2:
        return { score, label: 'Weak Password', color: '#EF4444' };
      case 3:
      case 4:
        return { score, label: 'Good Password', color: '#FBBF24' };
      case 5:
      default:
        return { score, label: 'Excellent Password', color: '#10B981' };
    }
  };

  const renderPasswordStrength = (passVal: string) => {
    const strength = getPasswordStrength(passVal);
    if (!passVal) return null;
    return (
      <View style={styles.strengthContainer} accessible={true} accessibilityLabel={`Password Strength: ${strength.label}`}>
        <View style={styles.strengthBarRow}>
          {[1, 2, 3].map((barIdx) => {
            const isActive = barIdx === 1 || (barIdx === 2 && strength.score >= 3) || (barIdx === 3 && strength.score === 5);
            return (
              <View 
                key={barIdx} 
                style={[
                  styles.strengthBar, 
                  { 
                    backgroundColor: isActive ? strength.color : (isDark ? 'rgba(148, 163, 184, 0.15)' : '#E2E8F0') 
                  }
                ]} 
              />
            );
          })}
        </View>
        <Text style={[styles.strengthText, { color: strength.color }]}>{strength.label}</Text>
      </View>
    );
  };

  // 1. Email Submission
  const handleSubmitEmail = async () => {
    if (!email) {
      setEmailError('University email is required.');
      HapticService.triggerError();
      return;
    }
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address.');
      HapticService.triggerError();
      return;
    }

    setEmailError(null);
    setStatusMsg(null);
    HapticService.triggerSelection();
    setIsStepLoading(true);

    const res = await requestPasswordReset(email);
    setIsStepLoading(false);
    
    if (res.success) {
      setActiveStep(1);
      setStatusMsg({
        text: 'A 6-digit verification code has been dispatched to your email address.',
        type: 'success'
      });
    } else {
      HapticService.triggerError();
      setStatusMsg({ text: res.error || 'Failed to dispatch verification code.', type: 'error' });
    }
  };

  // 2. OTP Submission
  const handleSubmitOTP = () => {
    if (!otpCode || otpCode.length !== 6) {
      setOtpError('Please enter the 6-digit verification code.');
      HapticService.triggerError();
      return;
    }

    setOtpError(null);
    setStatusMsg(null);
    HapticService.triggerSelection();
    setIsStepLoading(true);
    
    // Brief interactive transition delay to feel premium and professional
    setTimeout(() => {
      setIsStepLoading(false);
      setActiveStep(2);
    }, 600);
  };

  // 3. Password Reset Submission
  const handleResetPassword = async () => {
    let hasError = false;

    if (!password) {
      setPasswordError('Password is required.');
      hasError = true;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      hasError = true;
    } else {
      setPasswordError(null);
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match.');
      hasError = true;
    } else {
      setConfirmPasswordError(null);
    }

    if (hasError) {
      HapticService.triggerError();
      return;
    }

    setStatusMsg(null);
    HapticService.triggerTap();
    setIsStepLoading(true);

    const res = await resetPassword(email, otpCode, password);
    setIsStepLoading(false);
    
    if (res.success) {
      HapticService.triggerSuccess();
      setActiveStep(3);
    } else {
      HapticService.triggerError();
      setStatusMsg({ text: res.error || 'Password update rejected.', type: 'error' });
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
        {/* Back navigation button */}
        {activeStep !== 3 && (
          <Pressable 
            onPress={() => {
              HapticService.triggerSelection();
              if (activeStep > 0) {
                setActiveStep((prev) => (prev - 1) as ResetStep);
              } else {
                router.back();
              }
            }} 
            style={styles.backBtn}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Back link button"
            accessibilityHint="Double tap to navigate back to the previous screen."
          >
            <ArrowLeft size={16} color={themeColors.text} />
            <Text style={[styles.backText, { color: themeColors.text }]}>
              {activeStep === 0 ? 'Back to Login' : 'Back'}
            </Text>
          </Pressable>
        )}

        {/* Intro header */}
        <View style={styles.introBlock}>
          <Text style={[styles.title, { color: themeColors.text }]}>
            {activeStep === 3 ? 'Reset Successful' : 'Reset Password'}
          </Text>
          <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
            {activeStep === 0 && 'Enter your campus email to receive a password reset OTP.'}
            {activeStep === 1 && 'Input the verification code sent to your student email.'}
            {activeStep === 2 && 'Set a new password to restore your university portal.'}
            {activeStep === 3 && 'Your security credentials have been updated successfully.'}
          </Text>
        </View>

        {/* credentials Card */}
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
          {/* Status Box */}
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
              accessibilityLabel={`Reset Alert: ${statusMsg.text}`}
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

          {/* STEP 0: Email input request */}
          {activeStep === 0 && (
            <View>
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
                    onChangeText={(t) => {
                      setEmail(t);
                      if (emailError) setEmailError(null);
                    }}
                    placeholder="student@sab.lk"
                    placeholderTextColor={themeColors.textMuted}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    style={[styles.textInput, { color: themeColors.text }]}
                    editable={!isStepLoading}
                    accessible={true}
                    accessibilityLabel="University Email Input"
                  />
                </View>
                {emailError && <Text style={[styles.errorLabel, { color: themeColors.danger }]}>{emailError}</Text>}
              </View>

              <Button 
                title="Send Code" 
                onPress={handleSubmitEmail} 
                loading={isStepLoading}
                variant="primary"
                icon={<ChevronRight size={18} color={isDark ? '#000000' : '#FFFFFF'} />}
                style={[styles.actionBtn, { 
                  backgroundColor: isDark ? '#2E9EBF' : themeColors.primary
                }]}
                textStyle={{ color: isDark ? '#000000' : '#FFFFFF', fontWeight: '700' }}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Submit Email Button"
              />
            </View>
          )}

          {/* STEP 1: OTP Passcode entry */}
          {activeStep === 1 && (
            <View>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: themeColors.textSecondary, marginBottom: 12 }]}>
                  Verification Code
                </Text>
                
                {/* Pressable Split OTP Container */}
                <Pressable 
                  onPress={() => otpInputRef.current?.focus()}
                  style={styles.otpBoxesContainer}
                  accessible={true}
                  accessibilityLabel="Enter 6-digit OTP verification code"
                >
                  {[0, 1, 2, 3, 4, 5].map((index) => {
                    const char = otpCode[index] || '';
                    const isCurrent = index === otpCode.length;
                    const hasValue = otpCode.length > index;
                    
                    return (
                      <View 
                        key={index} 
                        style={[
                          styles.otpBox, 
                          { 
                            borderColor: otpError ? themeColors.danger : 
                                         (isCurrent && isOtpFocused) ? (isDark ? '#2E9EBF' : themeColors.primary) : 
                                         hasValue ? (isDark ? 'rgba(46, 158, 191, 0.4)' : themeColors.primary) :
                                         (isDark ? 'rgba(46, 158, 191, 0.15)' : themeColors.border),
                            backgroundColor: isDark ? 'rgba(15, 23, 42, 0.55)' : '#F8FAFC',
                          }
                        ]}
                      >
                        <Text style={[styles.otpBoxText, { color: themeColors.text }]}>
                          {char}
                        </Text>
                        {/* Elegant blinking indicator line for focused box */}
                        {isCurrent && isOtpFocused && (
                          <View style={[styles.otpCaret, { backgroundColor: isDark ? '#2E9EBF' : themeColors.primary }]} />
                        )}
                      </View>
                    );
                  })}
                </Pressable>

                {/* Completely hidden input handling Gboard autofocus, SMS codes, and full paste support */}
                <TextInput
                  ref={otpInputRef}
                  value={otpCode}
                  onChangeText={(t) => {
                    // Only allow numeric input
                    const numericValue = t.replace(/[^0-9]/g, '');
                    setOtpCode(numericValue);
                    if (otpError) setOtpError(null);
                  }}
                  onFocus={() => setIsOtpFocused(true)}
                  onBlur={() => setIsOtpFocused(false)}
                  keyboardType="number-pad"
                  maxLength={6}
                  style={styles.hiddenInput}
                  editable={!isStepLoading}
                  textContentType="oneTimeCode"
                />
                
                {otpError && <Text style={[styles.errorLabel, { color: themeColors.danger, marginTop: 8 }]}>{otpError}</Text>}
              </View>

              <Button 
                title="Verify Code" 
                onPress={handleSubmitOTP} 
                loading={isStepLoading}
                variant="primary"
                icon={<ChevronRight size={18} color={isDark ? '#000000' : '#FFFFFF'} />}
                style={[styles.actionBtn, { 
                  backgroundColor: isDark ? '#2E9EBF' : themeColors.primary
                }]}
                textStyle={{ color: isDark ? '#000000' : '#FFFFFF', fontWeight: '700' }}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Submit OTP Verification Code Button"
              />
            </View>
          )}

          {/* STEP 2: Password reset inputs */}
          {activeStep === 2 && (
            <View>
              {/* Password */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>New Password</Text>
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
                    onChangeText={(t) => {
                      setPassword(t);
                      if (passwordError) setPasswordError(null);
                    }}
                    placeholder="Enter new password"
                    placeholderTextColor={themeColors.textMuted}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    style={[styles.textInput, { color: themeColors.text }]}
                    editable={!isStepLoading}
                    accessible={true}
                    accessibilityLabel="New Password input field"
                  />
                  <Pressable 
                    onPress={() => setShowPassword(!showPassword)} 
                    style={styles.eyeBtn}
                  >
                    {showPassword ? <EyeOff size={18} color={themeColors.textMuted} /> : <Eye size={18} color={themeColors.textMuted} />}
                  </Pressable>
                </View>
                {/* Password strength meter */}
                {renderPasswordStrength(password)}
                {passwordError && <Text style={[styles.errorLabel, { color: themeColors.danger }]}>{passwordError}</Text>}
              </View>

              {/* Confirm Password */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>Confirm Password</Text>
                <View style={[
                  styles.inputWrapper, 
                  { 
                    borderColor: confirmPasswordError ? themeColors.danger : isDark ? 'rgba(46, 158, 191, 0.25)' : themeColors.border, 
                    backgroundColor: isDark ? 'rgba(15, 23, 42, 0.6)' : '#F8FAFC',
                  }
                ]}>
                  <KeyRound size={18} color={confirmPasswordError ? themeColors.danger : themeColors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    value={confirmPassword}
                    onChangeText={(t) => {
                      setConfirmPassword(t);
                      if (confirmPasswordError) setConfirmPasswordError(null);
                    }}
                    placeholder="Confirm new password"
                    placeholderTextColor={themeColors.textMuted}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    style={[styles.textInput, { color: themeColors.text }]}
                    editable={!isStepLoading}
                    accessible={true}
                    accessibilityLabel="Confirm New Password input field"
                  />
                  <Pressable 
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)} 
                    style={styles.eyeBtn}
                  >
                    {showConfirmPassword ? <EyeOff size={18} color={themeColors.textMuted} /> : <Eye size={18} color={themeColors.textMuted} />}
                  </Pressable>
                </View>
                {confirmPasswordError && <Text style={[styles.errorLabel, { color: themeColors.danger }]}>{confirmPasswordError}</Text>}
              </View>

              <Button 
                title="Update Password" 
                onPress={handleResetPassword} 
                loading={isStepLoading}
                variant="primary"
                icon={<CheckCircle2 size={18} color={isDark ? '#000000' : '#FFFFFF'} />}
                style={[styles.actionBtn, { 
                  backgroundColor: '#10B981' // Green theme for successful action
                }]}
                textStyle={{ color: '#FFFFFF', fontWeight: '700' }}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Confirm Update Password Button"
              />
            </View>
          )}

          {/* STEP 3: Successful completion display */}
          {activeStep === 3 && (
            <View style={styles.successBlock}>
              <View style={styles.successIconOuter}>
                <CheckCircle2 size={48} color="#10B981" />
              </View>
              <Text style={[styles.successTitle, { color: themeColors.text }]}>
                All Done!
              </Text>
              <Text style={[styles.successDescription, { color: themeColors.textSecondary }]}>
                Your portal password has been updated securely. You can now use your new credentials to enter the campus.
              </Text>

              {/* Solid-color elegant "Return to Login" button */}
              <Button 
                title="Back to Sign In" 
                onPress={() => {
                  HapticService.triggerSelection();
                  router.replace('/(auth)/login');
                }} 
                variant="outline"
                style={[styles.actionBtn, { 
                  marginTop: 10,
                  backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                  borderWidth: 0,
                  borderRadius: 14,
                  elevation: 0,
                  shadowOpacity: 0,
                }]}
                textStyle={{ color: isDark ? '#60A5FA' : themeColors.primary, fontWeight: '700' }}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Back to Sign In button"
              />
            </View>
          )}
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  otpBoxesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10,
    width: '100%',
  },
  otpBox: {
    width: 44,
    height: 52,
    borderWidth: 1.8,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  otpBoxText: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  otpCaret: {
    position: 'absolute',
    bottom: 10,
    width: 14,
    height: 2,
    borderRadius: 1,
  },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
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
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  backText: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
  },
  introBlock: {
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.6,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  formCard: {
    borderRadius: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
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
    marginBottom: 14,
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
    height: 48,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 13,
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
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 2,
  },
  strengthBarRow: {
    flexDirection: 'row',
    flex: 1,
    marginRight: 10,
  },
  strengthBar: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    marginHorizontal: 2,
  },
  strengthText: {
    fontSize: 10,
    fontWeight: '800',
    width: 90,
    textAlign: 'right',
  },
  actionBtn: {
    marginTop: 14,
    width: '100%',
    height: 48,
  },
  successBlock: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  successIconOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  successDescription: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
    paddingHorizontal: 10,
  },
});
