import React from 'react';
import { Tabs } from 'expo-router';
import { useColorScheme, Platform } from 'react-native';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../hooks/useAuth';
import { 
  Home, 
  Bike, 
  Heart, 
  User, 
  Clock, 
  Store, 
  Percent, 
  Play 
} from 'lucide-react-native';

export default function TabsLayout() {
  const systemTheme = useColorScheme() ?? 'light';
  const themeColors = Colors[systemTheme];
  const { user } = useAuth();
  const role = user?.role;

  // Determine Tab configurations based on user role
  const getTabConfig = (tabName: 'browse' | 'rides' | 'favourites' | 'profile') => {
    if (role === 'Rider') {
      switch (tabName) {
        case 'browse':
          return { title: 'Dashboard', icon: (color: string, size: number) => <Home size={size - 2} color={color} /> };
        case 'rides':
          return { title: 'Active Job', icon: (color: string, size: number) => <Play size={size - 2} color={color} /> };
        case 'favourites':
          return { title: 'History', icon: (color: string, size: number) => <Clock size={size - 2} color={color} /> };
        case 'profile':
          return { title: 'Rider Profile', icon: (color: string, size: number) => <User size={size - 2} color={color} /> };
      }
    }

    if (role === 'Business') {
      switch (tabName) {
        case 'browse':
          return { title: 'Dashboard', icon: (color: string, size: number) => <Home size={size - 2} color={color} /> };
        case 'rides':
          return { title: 'Shop Menu', icon: (color: string, size: number) => <Store size={size - 2} color={color} /> };
        case 'favourites':
          return { title: 'Offers', icon: (color: string, size: number) => <Percent size={size - 2} color={color} /> };
        case 'profile':
          return { title: 'Shop Profile', icon: (color: string, size: number) => <User size={size - 2} color={color} /> };
      }
    }

    // Default student/guest configurations
    switch (tabName) {
      case 'browse':
        return { title: 'Home', icon: (color: string, size: number) => <Home size={size - 2} color={color} /> };
      case 'rides':
        return { title: 'Rides', icon: (color: string, size: number) => <Bike size={size - 2} color={color} /> };
      case 'favourites':
        return { title: 'Favourites', icon: (color: string, size: number) => <Heart size={size - 2} color={color} /> };
      case 'profile':
        return { title: 'Profile', icon: (color: string, size: number) => <User size={size - 2} color={color} /> };
    }
  };

  const browseConfig = getTabConfig('browse');
  const ridesConfig = getTabConfig('rides');
  const favouritesConfig = getTabConfig('favourites');
  const profileConfig = getTabConfig('profile');

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.brand.accent,
        tabBarInactiveTintColor: themeColors.tabIconDefault,
        tabBarStyle: {
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 24 : 16,
          left: 18,
          right: 18,
          borderRadius: 24,
          height: 66,
          backgroundColor: systemTheme === 'light' ? 'rgba(255, 255, 255, 0.94)' : 'rgba(15, 23, 42, 0.90)',
          borderWidth: 1.5,
          borderColor: systemTheme === 'light' ? 'rgba(226, 232, 240, 0.8)' : 'rgba(46, 158, 191, 0.25)',
          paddingBottom: Platform.OS === 'ios' ? 4 : 8,
          paddingTop: 8,
          elevation: 10,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: systemTheme === 'light' ? 0.08 : 0.35,
          shadowRadius: 16,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="browse"
        options={{
          title: browseConfig.title,
          tabBarIcon: ({ color, size }) => browseConfig.icon(color, size),
        }}
      />
      <Tabs.Screen
        name="rides"
        options={{
          title: ridesConfig.title,
          tabBarIcon: ({ color, size }) => ridesConfig.icon(color, size),
        }}
      />
      <Tabs.Screen
        name="favourites"
        options={{
          title: favouritesConfig.title,
          tabBarIcon: ({ color, size }) => favouritesConfig.icon(color, size),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: profileConfig.title,
          tabBarIcon: ({ color, size }) => profileConfig.icon(color, size),
        }}
      />
    </Tabs>
  );
}

