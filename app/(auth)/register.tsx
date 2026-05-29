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
  GraduationCap, 
  Building2, 
  Bike, 
  Mail, 
  KeyRound, 
  User as UserIcon, 
  Phone, 
  MapPin, 
  Calendar, 
  ArrowLeft, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  EyeOff,
  Store,
  Briefcase
} from 'lucide-react-native';

type UserType = 'student' | 'business' | 'rider';
type StudentStep = 0 | 1 | 2;

export default function RegisterScreen() {
  const router = useRouter();
  const { registerStudent, registerBusiness, registerRider, isLoading } = useAuth();
  const systemTheme = useColorScheme() ?? 'dark';
  const themeColors = Colors[systemTheme];
  const isDark = systemTheme === 'dark';

  const [userType, setUserType] = useState<UserType>('student');
  const [activeStep, setActiveStep] = useState<StudentStep>(0);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'error' | 'warning' | 'success' } | null>(null);

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Performance: Native-Thread Pulsating Background Animations
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

  // Dropdown option sets
  const faculties = ['Computing', 'Engineering', 'Management', 'Social Sciences', 'Applied Sciences'];
  const years = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
  const businessTypes = ['Food Vendor', 'Accommodation', 'Transport', 'Retail Shop', 'Services'];
  const vehicleTypes = ['Tuk Tuk', 'Motorcycle', 'Bicycle', 'Car'];

  // Form states
  const [studentForm, setStudentForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    studentId: '',
    phone: '',
    faculty: 'Computing',
    year: '1st Year',
    address: '',
    city: '',
    dateOfBirth: ''
  });

  const [businessForm, setBusinessForm] = useState({
    businessName: '',
    ownerName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    businessType: 'Food Vendor',
    address: '',
    description: '',
    registrationNumber: '',
    taxId: ''
  });

  const [riderForm, setRiderForm] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    vehicleType: 'Tuk Tuk',
    vehicleNumber: '',
    licenseNumber: '',
    address: ''
  });

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  const validateEmail = (text: string) => {
    const reg = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w\w+)+$/;
    return reg.test(text);
  };

  // Password strength algorithm
  const getPasswordStrength = (password: string) => {
    if (!password) return { score: 0, label: '', color: 'transparent' };
    let score = 0;
    if (password.length >= 6) score += 1;
    if (password.length >= 10) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

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

  const renderPasswordStrength = (passwordVal: string) => {
    const strength = getPasswordStrength(passwordVal);
    if (!passwordVal) return null;
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

  const handleNext = () => {
    const newErrors: Record<string, string | null> = {};

    if (activeStep === 0) {
      if (!studentForm.fullName) newErrors.fullName = 'Full Name is required';
      if (!studentForm.email) {
        newErrors.email = 'Email is required';
      } else if (!validateEmail(studentForm.email)) {
        newErrors.email = 'Enter a valid email address';
      }
      if (!studentForm.password) {
        newErrors.password = 'Password is required';
      } else if (studentForm.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }
      if (studentForm.password !== studentForm.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    } else if (activeStep === 1) {
      if (!studentForm.studentId) newErrors.studentId = 'Student ID is required';
      if (!studentForm.phone) newErrors.phone = 'Phone number is required';
    }

    if (Object.keys(newErrors).length > 0) {
      HapticService.triggerError();
      setErrors(newErrors);
      return;
    }

    setErrors({});
    HapticService.triggerSelection();
    setActiveStep((prev) => (prev + 1) as StudentStep);
  };

  const handleBack = () => {
    HapticService.triggerSelection();
    setActiveStep((prev) => (prev - 1) as StudentStep);
  };

  const handleStudentSubmit = async () => {
    const newErrors: Record<string, string | null> = {};
    if (!studentForm.address) newErrors.address = 'Address is required';
    if (!studentForm.city) newErrors.city = 'City is required';
    if (!studentForm.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';

    if (Object.keys(newErrors).length > 0) {
      HapticService.triggerError();
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setStatusMsg(null);
    HapticService.triggerTap();
    const result = await registerStudent(studentForm);

    if (result.success) {
      HapticService.triggerSuccess();
      if (result.error) {
        setStatusMsg({ text: result.error, type: 'warning' });
        setTimeout(() => router.replace('/(tabs)/browse'), 2000);
      } else {
        setStatusMsg({ text: 'Student registration successful! Logging in...', type: 'success' });
        setTimeout(() => router.replace('/(tabs)/browse'), 1000);
      }
    } else {
      HapticService.triggerError();
      setStatusMsg({ text: result.error || 'Student registration failed.', type: 'error' });
    }
  };

  const handleBusinessSubmit = async () => {
    const newErrors: Record<string, string | null> = {};
    if (!businessForm.businessName) newErrors.businessName = 'Business Name is required';
    if (!businessForm.ownerName) newErrors.ownerName = 'Owner Name is required';
    if (!businessForm.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(businessForm.email)) {
      newErrors.email = 'Enter a valid email';
    }
    if (!businessForm.password) {
      newErrors.password = 'Password is required';
    } else if (businessForm.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (businessForm.password !== businessForm.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (!businessForm.phone) newErrors.phone = 'Phone number is required';
    if (!businessForm.address) newErrors.address = 'Address is required';
    if (!businessForm.description) newErrors.description = 'Description is required';
    if (!businessForm.registrationNumber) newErrors.registrationNumber = 'Registration number is required';

    if (Object.keys(newErrors).length > 0) {
      HapticService.triggerError();
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setStatusMsg(null);
    HapticService.triggerTap();
    const result = await registerBusiness(businessForm);

    if (result.success) {
      HapticService.triggerSuccess();
      if (result.error) {
        setStatusMsg({ text: result.error, type: 'warning' });
        setTimeout(() => router.replace('/(tabs)/browse'), 2000);
      } else {
        setStatusMsg({ text: 'Business application submitted! Logging in...', type: 'success' });
        setTimeout(() => router.replace('/(tabs)/browse'), 1000);
      }
    } else {
      HapticService.triggerError();
      setStatusMsg({ text: result.error || 'Business registration failed.', type: 'error' });
    }
  };

  const handleRiderSubmit = async () => {
    const newErrors: Record<string, string | null> = {};
    if (!riderForm.fullName) newErrors.fullName = 'Full Name is required';
    if (!riderForm.phone) newErrors.phone = 'Phone is required';
    if (!riderForm.email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(riderForm.email)) {
      newErrors.email = 'Enter a valid email';
    }
    if (!riderForm.password) {
      newErrors.password = 'Password is required';
    } else if (riderForm.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (riderForm.password !== riderForm.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (!riderForm.vehicleNumber) newErrors.vehicleNumber = 'Vehicle Number is required';
    if (!riderForm.licenseNumber) newErrors.licenseNumber = 'License Number is required';
    if (!riderForm.address) newErrors.address = 'Address is required';

    if (Object.keys(newErrors).length > 0) {
      HapticService.triggerError();
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setStatusMsg(null);
    HapticService.triggerTap();
    const result = await registerRider(riderForm);

    if (result.success) {
      HapticService.triggerSuccess();
      if (result.error) {
        setStatusMsg({ text: result.error, type: 'warning' });
        setTimeout(() => router.replace('/(tabs)/browse'), 2000);
      } else {
        setStatusMsg({ text: 'Rider application submitted! Logging in...', type: 'success' });
        setTimeout(() => router.replace('/(tabs)/browse'), 1000);
      }
    } else {
      HapticService.triggerError();
      setStatusMsg({ text: result.error || 'Rider registration failed.', type: 'error' });
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
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
        contentContainerStyle={styles.scrollContent} 
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Back Button */}
        <Pressable 
          onPress={() => {
            HapticService.triggerSelection();
            router.back();
          }} 
          style={styles.backBtn}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Back link button"
          accessibilityHint="Double tap to navigate back to login screen."
        >
          <ArrowLeft size={16} color={themeColors.text} />
          <Text style={[styles.backText, { color: themeColors.text }]}>Back to Login</Text>
        </Pressable>

        {/* Intro */}
        <View style={styles.introBlock}>
          <Text style={[styles.title, { color: themeColors.text }]}>Create Account</Text>
          <Text style={[styles.subtitle, { color: themeColors.textSecondary }]}>
            Join the NearU campus marketplace community
          </Text>
        </View>

        {/* Role Type Selector Grid */}
        <View style={styles.roleContainer}>
          {[
            { type: 'student', icon: GraduationCap, label: 'Student' },
            { type: 'business', icon: Building2, label: 'Business' },
            { type: 'rider', icon: Bike, label: 'Rider' }
          ].map((item) => (
            <Pressable
              key={item.type}
              onPress={() => {
                HapticService.triggerSelection();
                setUserType(item.type as UserType);
                setStatusMsg(null);
                setErrors({});
              }}
              style={[
                styles.roleBtn,
                {
                  borderColor: userType === item.type ? (isDark ? '#2E9EBF' : themeColors.primary) : (isDark ? 'rgba(46, 158, 191, 0.15)' : themeColors.border),
                  backgroundColor: userType === item.type ? (isDark ? 'rgba(46, 158, 191, 0.1)' : 'rgba(37, 99, 235, 0.06)') : (isDark ? 'rgba(15, 23, 42, 0.5)' : '#FFFFFF'),
                }
              ]}
              accessible={true}
              accessibilityRole="tab"
              accessibilityLabel={`${item.label} registration selector`}
              accessibilityState={{ selected: userType === item.type }}
            >
              <View style={[
                styles.roleIconBg,
                { backgroundColor: userType === item.type ? (isDark ? '#2E9EBF' : themeColors.primary) : (isDark ? 'rgba(148, 163, 184, 0.12)' : '#F1F5F9') }
              ]}>
                <item.icon size={20} color={userType === item.type ? (isDark ? '#000000' : '#FFFFFF') : themeColors.textSecondary} />
              </View>
              <Text style={[styles.roleBtnText, { color: themeColors.text }]}>{item.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Form Content Card */}
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
          {/* Status Message Display */}
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
              accessibilityLabel={`Registration Alert: ${statusMsg.text}`}
            >
              <AlertCircle size={16} color={
                statusMsg.type === 'error' ? themeColors.danger : 
                statusMsg.type === 'warning' ? themeColors.warning : 
                themeColors.success
              } style={{ marginRight: 8 }} />
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

          {/* 1. STUDENT REGISTRATION FLOW */}
          {userType === 'student' && (
            <View>
              {/* Stepper Dots */}
              <View style={styles.stepperContainer} accessible={true} accessibilityLabel={`Registration Step ${activeStep + 1} of 3`}>
                {['Basic Info', 'Personal', 'Additional'].map((stepLabel, idx) => (
                  <View key={idx} style={styles.stepIndicatorItem}>
                    <View style={[
                      styles.stepDot,
                      { backgroundColor: idx === activeStep ? (isDark ? '#2E9EBF' : themeColors.primary) : (idx < activeStep ? themeColors.success : (isDark ? '#334155' : '#CBD5E1')) }
                    ]} />
                    <Text style={[styles.stepLabelText, { color: idx === activeStep ? themeColors.text : themeColors.textMuted }]}>
                      {stepLabel}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Onboarding wizard helper caption */}
              <Text style={[styles.onboardingHintText, { color: themeColors.textSecondary }]}>
                {activeStep === 0 ? 'Enter your full name and choose a strong password to secure your student portal.' :
                 activeStep === 1 ? 'Select your faculty and year to unlock peer discount catalogs and course printing.' :
                 'Provide your delivery address and city for secure camp drop-offs.'}
              </Text>

              {/* Step 1: Basic Info */}
              {activeStep === 0 && (
                <View>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>Full Name</Text>
                    <View style={[styles.inputWrapper, { borderColor: errors.fullName ? themeColors.danger : isDark ? 'rgba(46, 158, 191, 0.2)' : themeColors.border, backgroundColor: isDark ? 'rgba(15, 23, 42, 0.6)' : '#F8FAFC' }]}>
                      <UserIcon size={18} color={themeColors.textMuted} style={styles.inputIcon} />
                      <TextInput
                        value={studentForm.fullName}
                        onChangeText={(t) => setStudentForm({...studentForm, fullName: t})}
                        placeholder="Alex Mercer"
                        placeholderTextColor={themeColors.textMuted}
                        style={[styles.textInput, { color: themeColors.text }]}
                        accessible={true}
                        accessibilityLabel="Full Name input"
                      />
                    </View>
                    {errors.fullName && <Text style={[styles.errorLabel, { color: themeColors.danger }]}>{errors.fullName}</Text>}
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>Email Address</Text>
                    <View style={[styles.inputWrapper, { borderColor: errors.email ? themeColors.danger : isDark ? 'rgba(46, 158, 191, 0.2)' : themeColors.border, backgroundColor: isDark ? 'rgba(15, 23, 42, 0.6)' : '#F8FAFC' }]}>
                      <Mail size={18} color={themeColors.textMuted} style={styles.inputIcon} />
                      <TextInput
                        value={studentForm.email}
                        onChangeText={(t) => setStudentForm({...studentForm, email: t})}
                        placeholder="student@sab.lk"
                        placeholderTextColor={themeColors.textMuted}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        style={[styles.textInput, { color: themeColors.text }]}
                        accessible={true}
                        accessibilityLabel="Student Email Input"
                      />
                    </View>
                    {errors.email && <Text style={[styles.errorLabel, { color: themeColors.danger }]}>{errors.email}</Text>}
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>Password</Text>
                    <View style={[styles.inputWrapper, { borderColor: errors.password ? themeColors.danger : isDark ? 'rgba(46, 158, 191, 0.2)' : themeColors.border, backgroundColor: isDark ? 'rgba(15, 23, 42, 0.6)' : '#F8FAFC' }]}>
                      <KeyRound size={18} color={themeColors.textMuted} style={styles.inputIcon} />
                      <TextInput
                        value={studentForm.password}
                        onChangeText={(t) => setStudentForm({...studentForm, password: t})}
                        placeholder="Min. 6 characters"
                        placeholderTextColor={themeColors.textMuted}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        style={[styles.textInput, { color: themeColors.text }]}
                        accessible={true}
                        accessibilityLabel="Register Password Input"
                      />
                      <Pressable 
                        onPress={() => {
                          setShowPassword(!showPassword);
                        }} 
                        style={styles.eyeBtn}
                      >
                        {showPassword ? <EyeOff size={18} color={themeColors.textMuted} /> : <Eye size={18} color={themeColors.textMuted} />}
                      </Pressable>
                    </View>
                    {/* Password Strength Meter */}
                    {renderPasswordStrength(studentForm.password)}
                    {errors.password && <Text style={[styles.errorLabel, { color: themeColors.danger }]}>{errors.password}</Text>}
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>Confirm Password</Text>
                    <View style={[styles.inputWrapper, { borderColor: errors.confirmPassword ? themeColors.danger : isDark ? 'rgba(46, 158, 191, 0.2)' : themeColors.border, backgroundColor: isDark ? 'rgba(15, 23, 42, 0.6)' : '#F8FAFC' }]}>
                      <KeyRound size={18} color={themeColors.textMuted} style={styles.inputIcon} />
                      <TextInput
                        value={studentForm.confirmPassword}
                        onChangeText={(t) => setStudentForm({...studentForm, confirmPassword: t})}
                        placeholder="Re-enter password"
                        placeholderTextColor={themeColors.textMuted}
                        secureTextEntry={!showConfirmPassword}
                        autoCapitalize="none"
                        style={[styles.textInput, { color: themeColors.text }]}
                        accessible={true}
                        accessibilityLabel="Confirm Password Input"
                      />
                      <Pressable 
                        onPress={() => {
                          setShowConfirmPassword(!showConfirmPassword);
                        }} 
                        style={styles.eyeBtn}
                      >
                        {showConfirmPassword ? <EyeOff size={18} color={themeColors.textMuted} /> : <Eye size={18} color={themeColors.textMuted} />}
                      </Pressable>
                    </View>
                    {errors.confirmPassword && <Text style={[styles.errorLabel, { color: themeColors.danger }]}>{errors.confirmPassword}</Text>}
                  </View>

                  <Button 
                    title="Next Step" 
                    onPress={handleNext}
                    icon={<ChevronRight size={18} color={isDark ? '#000000' : '#FFFFFF'} />}
                    style={[styles.actionBtn, { backgroundColor: isDark ? '#2E9EBF' : themeColors.primary }]}
                    textStyle={{ color: isDark ? '#000000' : '#FFFFFF', fontWeight: '700' }}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel="Next Step navigation button"
                  />
                </View>
              )}

              {/* Step 2: Personal Details */}
              {activeStep === 1 && (
                <View>
                  <View style={styles.row}>
                    <View style={[styles.inputGroup, { flex: 1, marginRight: 6 }]}>
                      <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>Student ID</Text>
                      <View style={[styles.inputWrapper, { borderColor: errors.studentId ? themeColors.danger : isDark ? 'rgba(46, 158, 191, 0.2)' : themeColors.border, backgroundColor: isDark ? 'rgba(15, 23, 42, 0.6)' : '#F8FAFC' }]}>
                        <TextInput
                          value={studentForm.studentId}
                          onChangeText={(t) => setStudentForm({...studentForm, studentId: t})}
                          placeholder="STU-2026-904"
                          placeholderTextColor={themeColors.textMuted}
                          style={[styles.textInput, { color: themeColors.text }]}
                          accessible={true}
                          accessibilityLabel="Student Card ID Input"
                        />
                      </View>
                    </View>
                    <View style={[styles.inputGroup, { flex: 1, marginLeft: 6 }]}>
                      <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>Phone Number</Text>
                      <View style={[styles.inputWrapper, { borderColor: errors.phone ? themeColors.danger : isDark ? 'rgba(46, 158, 191, 0.2)' : themeColors.border, backgroundColor: isDark ? 'rgba(15, 23, 42, 0.6)' : '#F8FAFC' }]}>
                        <Phone size={16} color={themeColors.textMuted} style={styles.inputIcon} />
                        <TextInput
                          value={studentForm.phone}
                          onChangeText={(t) => setStudentForm({...studentForm, phone: t})}
                          placeholder="0712345678"
                          placeholderTextColor={themeColors.textMuted}
                          keyboardType="phone-pad"
                          style={[styles.textInput, { color: themeColors.text }]}
                          accessible={true}
                          accessibilityLabel="Student Mobile Number Input"
                        />
                      </View>
                    </View>
                  </View>
                  {(errors.studentId || errors.phone) && (
                    <Text style={[styles.errorLabel, { color: themeColors.danger, marginBottom: 10 }]}>
                      {errors.studentId || errors.phone}
                    </Text>
                  )}

                  {/* Faculty select grids */}
                  <View style={styles.pickerSection}>
                    <Text style={[styles.pickerLabel, { color: themeColors.textSecondary }]}>Select Faculty</Text>
                    <View style={styles.pickerGrid}>
                      {faculties.map((fac) => (
                        <Pressable
                          key={fac}
                          onPress={() => {
                            setStudentForm({...studentForm, faculty: fac});
                          }}
                          style={[
                            styles.pickerItem,
                            { 
                              borderColor: studentForm.faculty === fac ? (isDark ? '#2E9EBF' : themeColors.primary) : (isDark ? 'rgba(46, 158, 191, 0.1)' : themeColors.border),
                              backgroundColor: studentForm.faculty === fac ? (isDark ? 'rgba(46, 158, 191, 0.1)' : 'rgba(37, 99, 235, 0.05)') : 'transparent'
                            }
                          ]}
                          accessible={true}
                          accessibilityRole="checkbox"
                          accessibilityState={{ checked: studentForm.faculty === fac }}
                          accessibilityLabel={`Faculty option: ${fac}`}
                        >
                          <Text style={[styles.pickerItemText, { color: themeColors.text, fontWeight: studentForm.faculty === fac ? '700' : '500' }]}>
                            {fac}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>

                  {/* Academic Year select */}
                  <View style={styles.pickerSection}>
                    <Text style={[styles.pickerLabel, { color: themeColors.textSecondary }]}>Select Academic Year</Text>
                    <View style={styles.pickerHorizontal}>
                      {years.map((y) => (
                        <Pressable
                          key={y}
                          onPress={() => {
                            setStudentForm({...studentForm, year: y});
                          }}
                          style={[
                            styles.pickerItemHorizontal,
                            { 
                              borderColor: studentForm.year === y ? (isDark ? '#2E9EBF' : themeColors.primary) : (isDark ? 'rgba(46, 158, 191, 0.1)' : themeColors.border),
                              backgroundColor: studentForm.year === y ? (isDark ? 'rgba(46, 158, 191, 0.1)' : 'rgba(37, 99, 235, 0.05)') : 'transparent'
                            }
                          ]}
                          accessible={true}
                          accessibilityRole="checkbox"
                          accessibilityState={{ checked: studentForm.year === y }}
                          accessibilityLabel={`Year option: ${y}`}
                        >
                          <Text style={[styles.pickerItemText, { color: themeColors.text, fontWeight: studentForm.year === y ? '700' : '500' }]}>
                            {y}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>

                  <View style={styles.btnRow}>
                    <Button 
                      title="Back" 
                      onPress={handleBack} 
                      variant="secondary"
                      icon={<ChevronLeft size={16} color={themeColors.text} />}
                      style={{ flex: 1, marginRight: 6 }}
                      accessible={true}
                      accessibilityLabel="Stepper back button"
                    />
                    <Button 
                      title="Next" 
                      onPress={handleNext}
                      icon={<ChevronRight size={16} color={isDark ? '#000000' : '#FFFFFF'} />}
                      style={{ flex: 1, marginLeft: 6, backgroundColor: isDark ? '#2E9EBF' : themeColors.primary }}
                      textStyle={{ color: isDark ? '#000000' : '#FFFFFF', fontWeight: '700' }}
                      accessible={true}
                      accessibilityLabel="Stepper next step button"
                    />
                  </View>
                </View>
              )}

              {/* Step 3: Additional details */}
              {activeStep === 2 && (
                <View>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>Delivery Address</Text>
                    <View style={[styles.inputWrapper, { borderColor: errors.address ? themeColors.danger : isDark ? 'rgba(46, 158, 191, 0.2)' : themeColors.border, backgroundColor: isDark ? 'rgba(15, 23, 42, 0.6)' : '#F8FAFC', height: 60 }]}>
                      <MapPin size={18} color={themeColors.textMuted} style={styles.inputIcon} />
                      <TextInput
                        value={studentForm.address}
                        onChangeText={(t) => setStudentForm({...studentForm, address: t})}
                        placeholder="Hostel A, Room 12"
                        placeholderTextColor={themeColors.textMuted}
                        multiline
                        style={[styles.textInput, { color: themeColors.text, paddingTop: 8 }]}
                        accessible={true}
                        accessibilityLabel="Hostel Delivery Address input"
                      />
                    </View>
                    {errors.address && <Text style={[styles.errorLabel, { color: themeColors.danger }]}>{errors.address}</Text>}
                  </View>

                  <View style={styles.row}>
                    <View style={[styles.inputGroup, { flex: 1, marginRight: 6 }]}>
                      <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>City</Text>
                      <View style={[styles.inputWrapper, { borderColor: errors.city ? themeColors.danger : isDark ? 'rgba(46, 158, 191, 0.2)' : themeColors.border, backgroundColor: isDark ? 'rgba(15, 23, 42, 0.6)' : '#F8FAFC' }]}>
                        <TextInput
                          value={studentForm.city}
                          onChangeText={(t) => setStudentForm({...studentForm, city: t})}
                          placeholder="Belihuloya"
                          placeholderTextColor={themeColors.textMuted}
                          style={[styles.textInput, { color: themeColors.text }]}
                          accessible={true}
                          accessibilityLabel="Campus City input"
                        />
                      </View>
                    </View>
                    <View style={[styles.inputGroup, { flex: 1, marginLeft: 6 }]}>
                      <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>Date of Birth</Text>
                      <View style={[styles.inputWrapper, { borderColor: errors.dateOfBirth ? themeColors.danger : isDark ? 'rgba(46, 158, 191, 0.2)' : themeColors.border, backgroundColor: isDark ? 'rgba(15, 23, 42, 0.6)' : '#F8FAFC' }]}>
                        <Calendar size={16} color={themeColors.textMuted} style={styles.inputIcon} />
                        <TextInput
                          value={studentForm.dateOfBirth}
                          onChangeText={(t) => setStudentForm({...studentForm, dateOfBirth: t})}
                          placeholder="YYYY-MM-DD"
                          placeholderTextColor={themeColors.textMuted}
                          style={[styles.textInput, { color: themeColors.text }]}
                          accessible={true}
                          accessibilityLabel="Student Date of Birth input"
                        />
                      </View>
                    </View>
                  </View>
                  {(errors.city || errors.dateOfBirth) && (
                    <Text style={[styles.errorLabel, { color: themeColors.danger, marginBottom: 10 }]}>
                      {errors.city || errors.dateOfBirth}
                    </Text>
                  )}

                  <View style={styles.btnRow}>
                    <Button 
                      title="Back" 
                      onPress={handleBack} 
                      variant="secondary"
                      icon={<ChevronLeft size={16} color={themeColors.text} />}
                      style={{ flex: 1, marginRight: 6 }}
                      accessible={true}
                      accessibilityLabel="Stepper back button"
                    />
                    <Button 
                      title="Complete Register" 
                      onPress={handleStudentSubmit}
                      loading={isLoading}
                      icon={<CheckCircle2 size={16} color="#FFFFFF" />}
                      style={{ flex: 1.3, marginLeft: 6, backgroundColor: '#10B981' }}
                      textStyle={{ color: '#FFFFFF', fontWeight: '700' }}
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel="Final Complete Student Registration Button"
                    />
                  </View>
                </View>
              )}
            </View>
          )}

          {/* 2. BUSINESS REGISTRATION FLOW */}
          {userType === 'business' && (
            <View>
              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 6 }]}>
                  <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>Business Name</Text>
                  <View style={[styles.inputWrapper, { borderColor: errors.businessName ? themeColors.danger : isDark ? 'rgba(46, 158, 191, 0.2)' : themeColors.border, backgroundColor: isDark ? 'rgba(15, 23, 42, 0.6)' : '#F8FAFC' }]}>
                    <Store size={16} color={themeColors.textMuted} style={styles.inputIcon} />
                    <TextInput
                      value={businessForm.businessName}
                      onChangeText={(t) => setBusinessForm({...businessForm, businessName: t})}
                      placeholder="Campus Cafe"
                      placeholderTextColor={themeColors.textMuted}
                      style={[styles.textInput, { color: themeColors.text }]}
                      accessible={true}
                      accessibilityLabel="Business Name Input"
                    />
                  </View>
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 6 }]}>
                  <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>Owner Name</Text>
                  <View style={[styles.inputWrapper, { borderColor: errors.ownerName ? themeColors.danger : isDark ? 'rgba(46, 158, 191, 0.2)' : themeColors.border, backgroundColor: isDark ? 'rgba(15, 23, 42, 0.6)' : '#F8FAFC' }]}>
                    <UserIcon size={16} color={themeColors.textMuted} style={styles.inputIcon} />
                    <TextInput
                      value={businessForm.ownerName}
                      onChangeText={(t) => setBusinessForm({...businessForm, ownerName: t})}
                      placeholder="Jane Doe"
                      placeholderTextColor={themeColors.textMuted}
                      style={[styles.textInput, { color: themeColors.text }]}
                      accessible={true}
                      accessibilityLabel="Business Owner Full Name Input"
                    />
                  </View>
                </View>
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 6 }]}>
                  <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>Business Email</Text>
                  <View style={[styles.inputWrapper, { borderColor: errors.email ? themeColors.danger : isDark ? 'rgba(46, 158, 191, 0.2)' : themeColors.border, backgroundColor: isDark ? 'rgba(15, 23, 42, 0.6)' : '#F8FAFC' }]}>
                    <Mail size={16} color={themeColors.textMuted} style={styles.inputIcon} />
                    <TextInput
                      value={businessForm.email}
                      onChangeText={(t) => setBusinessForm({...businessForm, email: t})}
                      placeholder="cafe@sab.lk"
                      placeholderTextColor={themeColors.textMuted}
                      autoCapitalize="none"
                      style={[styles.textInput, { color: themeColors.text }]}
                      accessible={true}
                      accessibilityLabel="Business Contact Email Input"
                    />
                  </View>
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 6 }]}>
                  <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>Business Phone</Text>
                  <View style={[styles.inputWrapper, { borderColor: errors.phone ? themeColors.danger : isDark ? 'rgba(46, 158, 191, 0.2)' : themeColors.border, backgroundColor: isDark ? 'rgba(15, 23, 42, 0.6)' : '#F8FAFC' }]}>
                    <Phone size={16} color={themeColors.textMuted} style={styles.inputIcon} />
                    <TextInput
                      value={businessForm.phone}
                      onChangeText={(t) => setBusinessForm({...businessForm, phone: t})}
                      placeholder="0712345678"
                      placeholderTextColor={themeColors.textMuted}
                      keyboardType="phone-pad"
                      style={[styles.textInput, { color: themeColors.text }]}
                      accessible={true}
                      accessibilityLabel="Business Mobile Phone Input"
                    />
                  </View>
                </View>
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 6 }]}>
                  <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>Password</Text>
                  <View style={[styles.inputWrapper, { borderColor: errors.password ? themeColors.danger : isDark ? 'rgba(46, 158, 191, 0.2)' : themeColors.border, backgroundColor: isDark ? 'rgba(15, 23, 42, 0.6)' : '#F8FAFC' }]}>
                    <TextInput
                      value={businessForm.password}
                      onChangeText={(t) => setBusinessForm({...businessForm, password: t})}
                      placeholder="Min. 6 chars"
                      placeholderTextColor={themeColors.textMuted}
                      secureTextEntry
                      autoCapitalize="none"
                      style={[styles.textInput, { color: themeColors.text }]}
                      accessible={true}
                      accessibilityLabel="Business Account Password Input"
                    />
                  </View>
                  {renderPasswordStrength(businessForm.password)}
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 6 }]}>
                  <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>Confirm</Text>
                  <View style={[styles.inputWrapper, { borderColor: errors.confirmPassword ? themeColors.danger : isDark ? 'rgba(46, 158, 191, 0.2)' : themeColors.border, backgroundColor: isDark ? 'rgba(15, 23, 42, 0.6)' : '#F8FAFC' }]}>
                    <TextInput
                      value={businessForm.confirmPassword}
                      onChangeText={(t) => setBusinessForm({...businessForm, confirmPassword: t})}
                      placeholder="Re-enter"
                      placeholderTextColor={themeColors.textMuted}
                      secureTextEntry
                      autoCapitalize="none"
                      style={[styles.textInput, { color: themeColors.text }]}
                      accessible={true}
                      accessibilityLabel="Confirm Password Input"
                    />
                  </View>
                </View>
              </View>

              {/* Business Type selector grid */}
              <View style={styles.pickerSection}>
                <Text style={[styles.pickerLabel, { color: themeColors.textSecondary }]}>Select Business Type</Text>
                <View style={styles.pickerGrid}>
                  {businessTypes.map((type) => (
                    <Pressable
                      key={type}
                      onPress={() => {
                        setBusinessForm({...businessForm, businessType: type});
                      }}
                      style={[
                        styles.pickerItem,
                        { 
                          borderColor: businessForm.businessType === type ? (isDark ? '#2E9EBF' : themeColors.primary) : (isDark ? 'rgba(46, 158, 191, 0.1)' : themeColors.border),
                          backgroundColor: businessForm.businessType === type ? (isDark ? 'rgba(46, 158, 191, 0.1)' : 'rgba(37, 99, 235, 0.05)') : 'transparent'
                        }
                      ]}
                      accessible={true}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: businessForm.businessType === type }}
                      accessibilityLabel={`Business Type: ${type}`}
                    >
                      <Text style={[styles.pickerItemText, { color: themeColors.text, fontWeight: businessForm.businessType === type ? '700' : '500' }]}>
                        {type}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>Business Address</Text>
                <View style={[styles.inputWrapper, { borderColor: errors.address ? themeColors.danger : isDark ? 'rgba(46, 158, 191, 0.2)' : themeColors.border, backgroundColor: isDark ? 'rgba(15, 23, 42, 0.6)' : '#F8FAFC' }]}>
                  <MapPin size={18} color={themeColors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    value={businessForm.address}
                    onChangeText={(t) => setBusinessForm({...businessForm, address: t})}
                    placeholder="Pambahinna Junction, Belihuloya"
                    placeholderTextColor={themeColors.textMuted}
                    style={[styles.textInput, { color: themeColors.text }]}
                    accessible={true}
                    accessibilityLabel="Physical Business Address Input"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>Business Description</Text>
                <View style={[styles.inputWrapper, { borderColor: errors.description ? themeColors.danger : isDark ? 'rgba(46, 158, 191, 0.2)' : themeColors.border, backgroundColor: isDark ? 'rgba(15, 23, 42, 0.6)' : '#F8FAFC', height: 60 }]}>
                  <Briefcase size={18} color={themeColors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    value={businessForm.description}
                    onChangeText={(t) => setBusinessForm({...businessForm, description: t})}
                    placeholder="Describe products or menus offered to students"
                    placeholderTextColor={themeColors.textMuted}
                    multiline
                    style={[styles.textInput, { color: themeColors.text, paddingTop: 8 }]}
                    accessible={true}
                    accessibilityLabel="Short Business description Input"
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 6 }]}>
                  <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>Registration No</Text>
                  <View style={[styles.inputWrapper, { borderColor: errors.registrationNumber ? themeColors.danger : isDark ? 'rgba(46, 158, 191, 0.2)' : themeColors.border, backgroundColor: isDark ? 'rgba(15, 23, 42, 0.6)' : '#F8FAFC' }]}>
                    <TextInput
                      value={businessForm.registrationNumber}
                      onChangeText={(t) => setBusinessForm({...businessForm, registrationNumber: t})}
                      placeholder="REG-990-213"
                      placeholderTextColor={themeColors.textMuted}
                      style={[styles.textInput, { color: themeColors.text }]}
                      accessible={true}
                      accessibilityLabel="Corporate Registration ID input"
                    />
                  </View>
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 6 }]}>
                  <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>Tax ID (Optional)</Text>
                  <View style={[styles.inputWrapper, { borderColor: themeColors.border, backgroundColor: isDark ? 'rgba(15, 23, 42, 0.6)' : '#F8FAFC' }]}>
                    <TextInput
                      value={businessForm.taxId}
                      onChangeText={(t) => setBusinessForm({...businessForm, taxId: t})}
                      placeholder="TAX-101"
                      placeholderTextColor={themeColors.textMuted}
                      style={[styles.textInput, { color: themeColors.text }]}
                      accessible={true}
                      accessibilityLabel="Tax Identification number input"
                    />
                  </View>
                </View>
              </View>

              {/* Validation alert label display */}
              {Object.keys(errors).length > 0 && (
                <Text style={[styles.errorLabel, { color: themeColors.danger, marginBottom: 10 }]}>
                  Please fill all required business registration fields.
                </Text>
              )}

              <View style={[styles.infoCallout, { backgroundColor: isDark ? 'rgba(46, 158, 191, 0.05)' : 'rgba(37, 99, 235, 0.05)', borderColor: isDark ? 'rgba(46, 158, 191, 0.2)' : 'rgba(37, 99, 235, 0.1)' }]}>
                <Text style={[styles.infoCalloutText, { color: isDark ? '#60A5FA' : themeColors.primary }]}>
                  Information: Business accounts require an administrative document audit prior to going active.
                </Text>
              </View>

              <Button 
                title="Submit Application" 
                onPress={handleBusinessSubmit}
                loading={isLoading}
                icon={<CheckCircle2 size={18} color="#FFFFFF" />}
                style={[styles.actionBtn, { backgroundColor: '#10B981' }]}
                textStyle={{ color: '#FFFFFF', fontWeight: '700' }}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Submit Business Registration Application button"
              />
            </View>
          )}

          {/* 3. RIDER REGISTRATION FLOW */}
          {userType === 'rider' && (
            <View>
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>Full Name</Text>
                <View style={[styles.inputWrapper, { borderColor: errors.fullName ? themeColors.danger : isDark ? 'rgba(46, 158, 191, 0.2)' : themeColors.border, backgroundColor: isDark ? 'rgba(15, 23, 42, 0.6)' : '#F8FAFC' }]}>
                  <UserIcon size={18} color={themeColors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    value={riderForm.fullName}
                    onChangeText={(t) => setRiderForm({...riderForm, fullName: t})}
                    placeholder="Alex Smith"
                    placeholderTextColor={themeColors.textMuted}
                    style={[styles.textInput, { color: themeColors.text }]}
                    accessible={true}
                    accessibilityLabel="Rider Full Name Input"
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 6 }]}>
                  <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>Rider Email</Text>
                  <View style={[styles.inputWrapper, { borderColor: errors.email ? themeColors.danger : isDark ? 'rgba(46, 158, 191, 0.2)' : themeColors.border, backgroundColor: isDark ? 'rgba(15, 23, 42, 0.6)' : '#F8FAFC' }]}>
                    <Mail size={16} color={themeColors.textMuted} style={styles.inputIcon} />
                    <TextInput
                      value={riderForm.email}
                      onChangeText={(t) => setRiderForm({...riderForm, email: t})}
                      placeholder="rider@sab.lk"
                      placeholderTextColor={themeColors.textMuted}
                      autoCapitalize="none"
                      style={[styles.textInput, { color: themeColors.text }]}
                      accessible={true}
                      accessibilityLabel="Rider Account Email Input"
                    />
                  </View>
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 6 }]}>
                  <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>Phone Number</Text>
                  <View style={[styles.inputWrapper, { borderColor: errors.phone ? themeColors.danger : isDark ? 'rgba(46, 158, 191, 0.2)' : themeColors.border, backgroundColor: isDark ? 'rgba(15, 23, 42, 0.6)' : '#F8FAFC' }]}>
                    <Phone size={16} color={themeColors.textMuted} style={styles.inputIcon} />
                    <TextInput
                      value={riderForm.phone}
                      onChangeText={(t) => setRiderForm({...riderForm, phone: t})}
                      placeholder="0712345678"
                      placeholderTextColor={themeColors.textMuted}
                      keyboardType="phone-pad"
                      style={[styles.textInput, { color: themeColors.text }]}
                      accessible={true}
                      accessibilityLabel="Rider Contact Phone Number Input"
                    />
                  </View>
                </View>
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 6 }]}>
                  <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>Password</Text>
                  <View style={[styles.inputWrapper, { borderColor: errors.password ? themeColors.danger : isDark ? 'rgba(46, 158, 191, 0.2)' : themeColors.border, backgroundColor: isDark ? 'rgba(15, 23, 42, 0.6)' : '#F8FAFC' }]}>
                    <TextInput
                      value={riderForm.password}
                      onChangeText={(t) => setRiderForm({...riderForm, password: t})}
                      placeholder="Min. 6 chars"
                      placeholderTextColor={themeColors.textMuted}
                      secureTextEntry
                      autoCapitalize="none"
                      style={[styles.textInput, { color: themeColors.text }]}
                      accessible={true}
                      accessibilityLabel="Rider Secure Account Password Input"
                    />
                  </View>
                  {renderPasswordStrength(riderForm.password)}
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 6 }]}>
                  <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>Confirm</Text>
                  <View style={[styles.inputWrapper, { borderColor: errors.confirmPassword ? themeColors.danger : isDark ? 'rgba(46, 158, 191, 0.2)' : themeColors.border, backgroundColor: isDark ? 'rgba(15, 23, 42, 0.6)' : '#F8FAFC' }]}>
                    <TextInput
                      value={riderForm.confirmPassword}
                      onChangeText={(t) => setRiderForm({...riderForm, confirmPassword: t})}
                      placeholder="Re-enter"
                      placeholderTextColor={themeColors.textMuted}
                      secureTextEntry
                      autoCapitalize="none"
                      style={[styles.textInput, { color: themeColors.text }]}
                      accessible={true}
                      accessibilityLabel="Confirm Password Input"
                    />
                  </View>
                </View>
              </View>

              {/* Vehicle Type selector grid */}
              <View style={styles.pickerSection}>
                <Text style={[styles.pickerLabel, { color: themeColors.textSecondary }]}>Select Vehicle Type</Text>
                <View style={styles.pickerGrid}>
                  {vehicleTypes.map((type) => (
                    <Pressable
                      key={type}
                      onPress={() => {
                        setRiderForm({...riderForm, vehicleType: type});
                      }}
                      style={[
                        styles.pickerItem,
                        { 
                          borderColor: riderForm.vehicleType === type ? (isDark ? '#2E9EBF' : themeColors.primary) : (isDark ? 'rgba(46, 158, 191, 0.1)' : themeColors.border),
                          backgroundColor: riderForm.vehicleType === type ? (isDark ? 'rgba(46, 158, 191, 0.1)' : 'rgba(37, 99, 235, 0.05)') : 'transparent'
                        }
                      ]}
                      accessible={true}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: riderForm.vehicleType === type }}
                      accessibilityLabel={`Vehicle type option: ${type}`}
                    >
                      <Text style={[styles.pickerItemText, { color: themeColors.text, fontWeight: riderForm.vehicleType === type ? '700' : '500' }]}>
                        {type}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 6 }]}>
                  <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>Vehicle Number</Text>
                  <View style={[styles.inputWrapper, { borderColor: errors.vehicleNumber ? themeColors.danger : isDark ? 'rgba(46, 158, 191, 0.2)' : themeColors.border, backgroundColor: isDark ? 'rgba(15, 23, 42, 0.6)' : '#F8FAFC' }]}>
                    <TextInput
                      value={riderForm.vehicleNumber}
                      onChangeText={(t) => setRiderForm({...riderForm, vehicleNumber: t})}
                      placeholder="SP QA-1234"
                      placeholderTextColor={themeColors.textMuted}
                      style={[styles.textInput, { color: themeColors.text }]}
                      accessible={true}
                      accessibilityLabel="Vehicle License Plate number Input"
                    />
                  </View>
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 6 }]}>
                  <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>License Number</Text>
                  <View style={[styles.inputWrapper, { borderColor: errors.licenseNumber ? themeColors.danger : isDark ? 'rgba(46, 158, 191, 0.2)' : themeColors.border, backgroundColor: isDark ? 'rgba(15, 23, 42, 0.6)' : '#F8FAFC' }]}>
                    <TextInput
                      value={riderForm.licenseNumber}
                      onChangeText={(t) => setRiderForm({...riderForm, licenseNumber: t})}
                      placeholder="LIC-5509-X"
                      placeholderTextColor={themeColors.textMuted}
                      style={[styles.textInput, { color: themeColors.text }]}
                      accessible={true}
                      accessibilityLabel="Driver License card ID input"
                    />
                  </View>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: themeColors.textSecondary }]}>Base Address</Text>
                <View style={[styles.inputWrapper, { borderColor: errors.address ? themeColors.danger : isDark ? 'rgba(46, 158, 191, 0.2)' : themeColors.border, backgroundColor: isDark ? 'rgba(15, 23, 42, 0.6)' : '#F8FAFC' }]}>
                  <MapPin size={18} color={themeColors.textMuted} style={styles.inputIcon} />
                  <TextInput
                    value={riderForm.address}
                    onChangeText={(t) => setRiderForm({...riderForm, address: t})}
                    placeholder="Belihuloya, Sri Lanka"
                    placeholderTextColor={themeColors.textMuted}
                    style={[styles.textInput, { color: themeColors.text }]}
                    accessible={true}
                    accessibilityLabel="Rider Base Address location input"
                  />
                </View>
              </View>

              {Object.keys(errors).length > 0 && (
                <Text style={[styles.errorLabel, { color: themeColors.danger, marginBottom: 10 }]}>
                  Please fill all required fields.
                </Text>
              )}

              <View style={[styles.infoCallout, { backgroundColor: isDark ? 'rgba(46, 158, 191, 0.05)' : 'rgba(37, 99, 235, 0.05)', borderColor: isDark ? 'rgba(46, 158, 191, 0.2)' : 'rgba(37, 99, 235, 0.1)' }]}>
                <Text style={[styles.infoCalloutText, { color: isDark ? '#60A5FA' : themeColors.primary }]}>
                  Information: Rider accounts require an administrative license audit prior to going active.
                </Text>
              </View>

              <Button 
                title="Submit Rider Application" 
                onPress={handleRiderSubmit}
                loading={isLoading}
                icon={<CheckCircle2 size={18} color="#FFFFFF" />}
                style={[styles.actionBtn, { backgroundColor: '#10B981' }]}
                textStyle={{ color: '#FFFFFF', fontWeight: '700' }}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Submit Rider Registration Application button"
              />
            </View>
          )}

        </Card>

        {/* Footer Redirect Options */}
        <View style={styles.footerOptions}>
          <Text style={[styles.footerText, { color: themeColors.textSecondary }]}>
            Already have an account?{' '}
          </Text>
          <Pressable 
            onPress={() => {
              HapticService.triggerSelection();
              router.push('/(auth)/login');
            }}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Navigate to Login link"
          >
            <Text style={[styles.footerLink, { color: isDark ? '#60A5FA' : themeColors.primary }]}>Sign In</Text>
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
  },
  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    width: '100%',
  },
  roleBtn: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderRadius: 16,
    paddingVertical: 12,
    marginHorizontal: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  roleIconBg: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  roleBtnText: {
    fontSize: 11,
    fontWeight: '700',
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
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 16,
  },
  statusText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  stepperContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.1)',
    paddingBottom: 14,
  },
  stepIndicatorItem: {
    alignItems: 'center',
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginBottom: 4,
  },
  stepLabelText: {
    fontSize: 10,
    fontWeight: '700',
  },
  onboardingHintText: {
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 16,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 10,
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
  pickerSection: {
    marginBottom: 14,
  },
  pickerLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  pickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  pickerItem: {
    width: '46%',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginHorizontal: '2%',
    marginVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerItemText: {
    fontSize: 11,
    textAlign: 'center',
  },
  pickerHorizontal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pickerItemHorizontal: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 8,
    marginHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    width: '100%',
  },
  actionBtn: {
    marginTop: 14,
    width: '100%',
    height: 48,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  infoCallout: {
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 6,
    marginBottom: 6,
  },
  infoCalloutText: {
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 16,
  },
  footerOptions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
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
