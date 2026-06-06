import { Redirect } from 'expo-router';
import { useAuth } from '../hooks/useAuth';

export default function Index() {
  const { isAuthenticated, isSessionLoading } = useAuth();

  if (isSessionLoading) {
    return null;
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)/browse" />;
  }

  return <Redirect href="/(auth)/login" />;
}
