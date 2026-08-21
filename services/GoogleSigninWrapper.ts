import { NativeModules } from 'react-native';

let GoogleSignin: any = {
  configure: () => {},
  hasPlayServices: async () => false,
  signIn: async () => {
    throw new Error('Google Sign-In is not supported in Expo Go. Use a development client.');
  },
  signOut: async () => {},
};

let hasRNGoogleSignin = false;
try {
  // Try to check both NativeModules and TurboModuleRegistry
  const { TurboModuleRegistry } = require('react-native');
  hasRNGoogleSignin = !!NativeModules.RNGoogleSignin || (TurboModuleRegistry && !!TurboModuleRegistry.get('RNGoogleSignin'));
} catch (e) {
  hasRNGoogleSignin = !!NativeModules.RNGoogleSignin;
}

if (hasRNGoogleSignin) {
  try {
    const lib = require('@react-native-google-signin/google-signin');
    GoogleSignin = lib.GoogleSignin;
  } catch (e) {
    console.warn('Google Sign-In native module found but failed to load:', e);
  }
} else {
  console.warn('Google Sign-In native module "RNGoogleSignin" is not available in this environment. Falling back to Mock.');
}

export { GoogleSignin };
