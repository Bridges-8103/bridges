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

export default function SignUpScreen() {
  const router = useRouter();
  const { isLoaded } = useAuth();
  const { signUp } = useSignUp();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isFormValid = isVerifying
    ? code.trim().length > 0
    : fullName.trim().length > 0 && email.trim().length > 0 && password.length >= 6;

  const handleSignUp = async () => {
    if (!isFormValid || isSubmitting || !signUp) return;
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const generatedUsername = fullName
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .slice(0, 20) + '_' + Math.floor(Math.random() * 1000);

      const { error: signUpError } = await signUp.password({
        username: generatedUsername,
        emailAddress: email.trim(),
        password,
      });

      if (signUpError) {
        setErrorMessage(getClerkErrorMessage(signUpError, 'Unable to create your account.'));
        return;
      }

      const { error: sendError } = await signUp.verifications.sendEmailCode();
      if (sendError) {
        setErrorMessage(getClerkErrorMessage(sendError, 'Unable to send the verification code.'));
        return;
      }

      setIsVerifying(true);
    } catch (caughtError) {
      setErrorMessage(getClerkErrorMessage(caughtError, 'Unable to create your account.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify = async () => {
    if (!isFormValid || isSubmitting || !signUp) return;
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const { error: verifyError } = await signUp.verifications.verifyEmailCode({ code: code.trim() });
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
        setErrorMessage(getClerkErrorMessage(finalizeError, 'Unable to finish creating your account.'));
        return;
      }

      router.replace('/(tabs)');
    } catch (caughtError) {
      setErrorMessage(getClerkErrorMessage(caughtError, 'Unable to verify your account.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (isVerifying) {
      setIsVerifying(false);
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
            <View style={styles.progressBarActive} />
            <View style={[styles.progressBarInactive, isVerifying && styles.progressBarActive]} />
          </View>

          {/* Heading */}
          <View style={styles.header}>
            <Text style={styles.title}>{isVerifying ? 'Verify email' : 'Create account'}</Text>
            <Text style={styles.subtitle}>
              {isVerifying
                ? `We sent a verification code to ${email}.`
                : 'Join thousands of students and mentors on Bridges.'}
            </Text>
          </View>

          {/* Form Fields */}
          <View style={styles.form}>
            {isVerifying ? (
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
            ) : (
              <>
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
                  <Text style={styles.label}>Email</Text>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="you@gmail.com"
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
                    onPress={() => Alert.alert('Terms of Service', 'Bridges student terms and code of conduct.')}>
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
              </>
            )}

            {/* Error Message */}
            {Boolean(errorMessage) && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            {/* Continue / Verify Button */}
            <Pressable
              accessibilityRole="button"
              disabled={!isFormValid || isSubmitting}
              onPress={isVerifying ? handleVerify : handleSignUp}
              style={({ pressed }) => [
                styles.continueButton,
                !isFormValid && styles.continueButtonDisabled,
                pressed && isFormValid && styles.pressed,
              ]}>
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text
                  style={[
                    styles.continueButtonText,
                    !isFormValid && styles.continueButtonTextDisabled,
                  ]}>
                  {isVerifying ? 'Verify & Continue' : 'Continue'}
                </Text>
              )}
            </Pressable>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Already have an account?{' '}
              <Text
                style={styles.footerLink}
                onPress={() => router.push('/sign-in')}>
                Sign in
              </Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  progressBarActive: {
    flex: 1,
    backgroundColor: '#3B5DF6',
    borderRadius: 2,
  },
  progressBarInactive: {
    flex: 1,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
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
