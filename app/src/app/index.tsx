import { Redirect } from 'expo-router';
import { useAuth } from '@clerk/expo';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { ROUTES } from '@/constants/routes';
import { useProfileQuery } from '@/services/profile/queries';

export default function MiddleGateScreen() {
  const { isLoaded, isSignedIn } = useAuth();
  const {
    data: profile,
    isLoading: isProfileLoading,
    isSuccess: isProfileSuccess,
  } = useProfileQuery({
    enabled: Boolean(isLoaded && isSignedIn),
  });

  // 1. Wait for Clerk auth to resolve
  if (!isLoaded) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3B5DF6" />
      </View>
    );
  }

  // 2. If unauthenticated, redirect to welcome
  if (!isSignedIn) {
    return <Redirect href={ROUTES.WELCOME} />;
  }

  // 3. If authenticated, wait for profile check to resolve
  if (isProfileLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3B5DF6" />
      </View>
    );
  }

  // 4. If profile was successfully checked and user did NOT setup profile yet (profile === null),
  // redirect to choose role screen so they can choose their role before editing their profile
  if (isProfileSuccess && profile === null) {
    return <Redirect href={ROUTES.CHOOSE_ROLE} />;
  }

  // 5. Profile is set up (or API error occurred), move on to authenticated main app
  return <Redirect href={ROUTES.TABS} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
