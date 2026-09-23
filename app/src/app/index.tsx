import { Redirect } from 'expo-router';
import { useAuth } from '@clerk/expo';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useProfileQuery } from '@/services/profile/queries';

export default function Index() {
  const { isLoaded, isSignedIn } = useAuth();
  const { data: profile, isLoading: isProfileLoading } = useProfileQuery({
    enabled: Boolean(isSignedIn),
  });

  if (!isLoaded || (isSignedIn && isProfileLoading)) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3B5DF6" />
      </View>
    );
  }

  if (!isSignedIn) {
    return <Redirect href="/welcome" />;
  }

  // If user has not created a profile yet, route to profile setup
  if (!profile) {
    return <Redirect href="/mentor-profile" />;
  }

  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
