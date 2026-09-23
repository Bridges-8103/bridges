import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useAuth, useSignUp } from '@clerk/expo';

type RoleType = 'STUDENT' | 'MENTOR';

export default function SignUpScreen() {
  const router = useRouter();
  const { isLoaded } = useAuth();
  const { signUp } = useSignUp();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<RoleType>('STUDENT');
  const [code, setCode] = useState('');

  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canContinueStep1 =
    fullName.trim().length > 0 && email.trim().length > 0 && password.length >= 6;
  const canVerify = code.trim().length > 0;

  const handleSelectRole = async (role: RoleType) => {
    setSelectedRole(role);
    if (!signUp || isSubmitting) return;

    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const generatedUsername =
        fullName
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '_')
          .slice(0, 20) +
        '_' +
        Math.floor(Math.random() * 1000);

      const { error: signUpError } = await signUp.password({
        username: generatedUsername,
        emailAddress: email.trim(),
        password,
        unsafeMetadata: { role },
      });

      if (signUpError) {
        setErrorMessage(getClerkErrorMessage(signUpError, 'Unable to create your account.'));
        setIsSubmitting(false);
        return;
      }

      const { error: sendError } = await signUp.verifications.sendEmailCode();
      if (sendError) {
        setErrorMessage(getClerkErrorMessage(sendError, 'Unable to send the verification code.'));
        setIsSubmitting(false);
        return;
      }

      setStep(3);
    } catch (caughtError) {
      setErrorMessage(getClerkErrorMessage(caughtError, 'Unable to create your account.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify = async () => {
    if (!canVerify || isSubmitting || !signUp) return;
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const { error: verifyError } = await signUp.verifications.verifyEmailCode({
        code: code.trim(),
      });
      if (verifyError) {
        setErrorMessage(getClerkErrorMessage(verifyError, 'That verification code is invalid.'));
        return;
      }

      if (signUp.status !== 'complete') {
        const missingFields = signUp.missingFields.join(', ');
        setErrorMessage(
          missingFields
            ? `Clerk still requires: ${missingFields}.`
            : 'Your account is not ready to finish yet.'
        );
        return;
      }

      const { error: finalizeError } = await signUp.finalize();
      if (finalizeError) {
        setErrorMessage(
          getClerkErrorMessage(finalizeError, 'Unable to finish creating your account.')
        );
        return;
      }

      // Redirection to profile setup depending on the selected role
      router.replace({
        pathname: '/mentor-profile',
        params: { role: selectedRole, isNew: 'true', name: fullName.trim() },
      });
    } catch (caughtError) {
      setErrorMessage(getClerkErrorMessage(caughtError, 'Unable to verify your account.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    setErrorMessage('');
    if (step === 3) {
      setStep(2);
      return;
    }
    if (step === 2) {
      setStep(1);
      return;
    }
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push('/welcome');
    }
  };

  if (!isLoaded) return null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {/* Back Button */}
          <Pressable
            accessibilityRole="button"
            onPress={handleBack}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
            <SymbolView
              name={{ ios: 'chevron.left', android: 'arrow_back', web: 'chevron_left' }}
              size={18}
              tintColor="#111827"
            />
          </Pressable>

          {/* Progress Bar Indicator */}
          <View style={styles.progressContainer}>
            <View style={[styles.progressSegment, styles.progressActive]} />
            <View
              style={[
                styles.progressSegment,
                step >= 2 ? styles.progressActive : styles.progressInactive,
              ]}
            />
            <View
              style={[
                styles.progressSegment,
                step === 3 ? styles.progressActive : styles.progressInactive,
              ]}
            />
          </View>

          {step === 1 && (
            <>
              {/* Heading */}
              <View style={styles.header}>
                <Text style={styles.title}>Create account</Text>
                <Text style={styles.subtitle}>Join thousands of students and mentors on Bridges.</Text>
              </View>

              {/* Form Fields */}
              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Full name</Text>
                  <TextInput
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="Jamie Chen"
                    placeholderTextColor="#9CA3AF"
                    autoCapitalize="words"
                    autoCorrect={false}
                    style={styles.input}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>University email</Text>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="you@university.edu"
                    placeholderTextColor="#9CA3AF"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoCorrect={false}
                    style={styles.input}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Password</Text>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Min. 6 characters"
                    placeholderTextColor="#9CA3AF"
                    secureTextEntry
                    autoCapitalize="none"
                    style={styles.input}
                  />
                </View>

                {/* Terms and Privacy Policy Note */}
                <Text style={styles.termsText}>
                  By continuing, you agree to Bridges&apos;{' '}
                  <Text
                    style={styles.termsLink}
                    onPress={() =>
                      Alert.alert('Terms of Service', 'Bridges student terms and code of conduct.')
                    }>
                    Terms of Service
                  </Text>{' '}
                  and{' '}
                  <Text
                    style={styles.termsLink}
                    onPress={() => Alert.alert('Privacy Policy', 'Bridges data privacy policy.')}>
                    Privacy Policy
                  </Text>
                  .
                </Text>

                {/* Continue to Step 2 Button */}
                <Pressable
                  accessibilityRole="button"
                  disabled={!canContinueStep1}
                  onPress={() => setStep(2)}
                  style={({ pressed }) => [
                    styles.continueButton,
                    !canContinueStep1 && styles.continueButtonDisabled,
                    pressed && canContinueStep1 && styles.pressed,
                  ]}>
                  <Text
                    style={[
                      styles.continueButtonText,
                      !canContinueStep1 && styles.continueButtonTextDisabled,
                    ]}>
                    Continue
                  </Text>
                </Pressable>
              </View>
            </>
          )}

          {step === 2 && (
            <>
              {/* Heading */}
              <View style={styles.header}>
                <Text style={styles.title}>I am a…</Text>
                <Text style={styles.subtitle}>
                  Choose your role on Bridges. You can change this later.
                </Text>
              </View>

              {Boolean(errorMessage) && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              )}

              {/* Role Cards */}
              <View style={styles.roleCardContainer}>
                <RoleCard
                  emoji="🎓"
                  title="Student"
                  description="I'm looking for guidance, career advice, and connections with industry professionals."
                  perks={[
                    'Browse 200+ verified mentors',
                    'Book 1-on-1 sessions',
                    'Get personalised career guidance',
                  ]}
                  color="#4A6CF7"
                  bg="#EEF3FF"
                  border="#C7D7FF"
                  loading={isSubmitting && selectedRole === 'STUDENT'}
                  disabled={isSubmitting}
                  onPress={() => handleSelectRole('STUDENT')}
                />

                <RoleCard
                  emoji="🌟"
                  title="Mentor"
                  description="I want to give back by sharing my experience and helping the next generation."
                  perks={[
                    'Set your own availability',
                    'Help students at your alma mater',
                    'Build your personal brand',
                  ]}
                  color="#7C3AED"
                  bg="#F3EEFF"
                  border="#D4BBFF"
                  loading={isSubmitting && selectedRole === 'MENTOR'}
                  disabled={isSubmitting}
                  onPress={() => handleSelectRole('MENTOR')}
                />
              </View>
            </>
          )}

          {step === 3 && (
            <>
              {/* Heading */}
              <View style={styles.header}>
                <Text style={styles.title}>Verify email</Text>
                <Text style={styles.subtitle}>We sent a verification code to {email}.</Text>
              </View>

              {/* Form Fields */}
              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Verification code</Text>
                  <TextInput
                    value={code}
                    onChangeText={setCode}
                    placeholder="Enter 6-digit code"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="number-pad"
                    autoFocus
                    style={styles.input}
                  />
                </View>

                {Boolean(errorMessage) && (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{errorMessage}</Text>
                  </View>
                )}

                <Pressable
                  accessibilityRole="button"
                  disabled={!canVerify || isSubmitting}
                  onPress={handleVerify}
                  style={({ pressed }) => [
                    styles.continueButton,
                    !canVerify && styles.continueButtonDisabled,
                    pressed && canVerify && styles.pressed,
                  ]}>
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text
                      style={[
                        styles.continueButtonText,
                        !canVerify && styles.continueButtonTextDisabled,
                      ]}>
                      Verify & Continue
                    </Text>
                  )}
                </Pressable>
              </View>
            </>
          )}

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Already have an account?{' '}
              <Text style={styles.footerLink} onPress={() => router.push('/sign-in')}>
                Sign in
              </Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function RoleCard({
  emoji,
  title,
  description,
  perks,
  color,
  bg,
  border,
  loading,
  disabled,
  onPress,
}: {
  emoji: string;
  title: string;
  description: string;
  perks: string[];
  color: string;
  bg: string;
  border: string;
  loading: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.roleCard,
        {
          borderColor: pressed ? color : border,
          backgroundColor: pressed ? bg : '#FAFBFF',
        },
        pressed && styles.roleCardPressed,
      ]}>
      {/* Header Row */}
      <View style={styles.roleCardHeader}>
        <View style={[styles.roleEmojiContainer, { backgroundColor: bg, borderColor: border }]}>
          <Text style={styles.roleEmoji}>{emoji}</Text>
        </View>

        <View style={styles.roleCardTitleSection}>
          <Text style={styles.roleTitle}>{title}</Text>
          <Text style={styles.roleDescription}>{description}</Text>
        </View>

        <View style={[styles.roleCheckCircle, { backgroundColor: bg, borderColor: border }]}>
          {loading ? (
            <ActivityIndicator size="small" color={color} />
          ) : (
            <SymbolView
              name={{ ios: 'checkmark', android: 'check', web: 'check' }}
              size={12}
              tintColor={color}
            />
          )}
        </View>
      </View>

      {/* Perks List */}
      <View style={[styles.rolePerksList, { borderTopColor: border }]}>
        {perks.map((perk) => (
          <View key={perk} style={styles.rolePerkItem}>
            <View style={[styles.perkDot, { backgroundColor: color }]}>
              <SymbolView
                name={{ ios: 'checkmark', android: 'check', web: 'check' }}
                size={8}
                tintColor="#FFFFFF"
              />
            </View>
            <Text style={styles.perkText}>{perk}</Text>
          </View>
        ))}
      </View>

      {/* Button Row */}
      <View style={styles.roleActionRow}>
        <Text style={[styles.roleActionText, { color }]}>Continue as {title}</Text>
        <SymbolView
          name={{ ios: 'arrow.right', android: 'arrow_forward', web: 'arrow_forward' }}
          size={14}
          tintColor={color}
        />
      </View>
    </Pressable>
  );
}

function getClerkErrorMessage(error: unknown, fallback: string) {
  const clerkError = error as {
    longMessage?: string;
    message?: string;
    errors?: { longMessage?: string; message?: string }[];
  };
  return (
    clerkError?.longMessage ??
    clerkError?.errors?.[0]?.longMessage ??
    clerkError?.errors?.[0]?.message ??
    clerkError?.message ??
    fallback
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 28,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F3F4F8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  progressContainer: {
    flexDirection: 'row',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 32,
    gap: 6,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  progressActive: {
    backgroundColor: '#4A6CF7',
  },
  progressInactive: {
    backgroundColor: '#EEF0F6',
  },
  header: {
    marginBottom: 28,
    gap: 8,
  },
  title: {
    color: '#111827',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  subtitle: {
    color: '#6B7280',
    fontSize: 15,
    lineHeight: 22,
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#F8F9FD',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#111827',
  },
  termsText: {
    color: '#9CA3AF',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  termsLink: {
    color: '#3B5DF6',
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '500',
  },
  continueButton: {
    backgroundColor: '#3B5DF6',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    shadowColor: '#3B5DF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonDisabled: {
    backgroundColor: '#D1D5DB',
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  continueButtonTextDisabled: {
    color: '#9CA3AF',
  },
  roleCardContainer: {
    gap: 16,
  },
  roleCard: {
    borderWidth: 2,
    borderRadius: 20,
    padding: 20,
    backgroundColor: '#FAFBFF',
    gap: 14,
  },
  roleCardPressed: {
    opacity: 0.95,
    transform: [{ scale: 0.99 }],
  },
  roleCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  roleEmojiContainer: {
    width: 48,
    height: 48,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  roleEmoji: {
    fontSize: 22,
  },
  roleCardTitleSection: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A1A2E',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  roleDescription: {
    fontSize: 12,
    color: '#7A8499',
    lineHeight: 18,
  },
  roleCheckCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rolePerksList: {
    borderTopWidth: 1,
    paddingTop: 12,
    gap: 8,
  },
  rolePerkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  perkDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  perkText: {
    fontSize: 12,
    color: '#3D4456',
    fontWeight: '500',
  },
  roleActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 4,
  },
  roleActionText: {
    fontSize: 13,
    fontWeight: '700',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 36,
    alignItems: 'center',
  },
  footerText: {
    color: '#6B7280',
    fontSize: 14,
  },
  footerLink: {
    color: '#3B5DF6',
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.85,
  },
});
