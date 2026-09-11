import { Platform } from 'react-native';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { getAuth, initializeAuth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authApi from './authApi';

const googleServices = require('../google-services.json');

const projectInfo = googleServices?.project_info || {};
const androidClient = googleServices?.client?.[0] || {};

const allOAuthClients = [
  ...(androidClient?.oauth_client || []),
  ...(androidClient?.services?.appinvite_service?.other_platform_oauth_client || []),
];

const findOAuthClientId = (
  predicate: (oauthClient: any) => boolean
): string => {
  const match = allOAuthClients.find((oauthClient: any) => predicate(oauthClient));
  return match?.client_id || '';
};

const detectedAndroidClientId = findOAuthClientId(
  (oauthClient) =>
    !!oauthClient?.android_info?.package_name &&
    oauthClient.android_info.package_name === androidClient?.client_info?.android_client_info?.package_name
);

const detectedWebClientId = findOAuthClientId(
  (oauthClient) => oauthClient?.client_type === 3 && !oauthClient?.android_info
);

const detectedIosClientId = findOAuthClientId(
  (oauthClient) => oauthClient?.client_type === 2
);

const envGoogleWebClientId =
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID) ||
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_GOOGLE_CLIENT_ID) ||
  '';

const envGoogleIosClientId =
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID) ||
  '';

const envGoogleAndroidClientId =
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID) ||
  '';

export const googleOAuthConfig = {
  webClientId: envGoogleWebClientId || detectedWebClientId || '',
  iosClientId: envGoogleIosClientId || detectedIosClientId || '',
  androidClientId: envGoogleAndroidClientId || detectedAndroidClientId || '',
};

export const hasRequiredGoogleClientId = (): boolean => {
  if (Platform.OS === 'ios') return !!googleOAuthConfig.iosClientId;
  if (Platform.OS === 'android') return !!googleOAuthConfig.androidClientId;
  if (Platform.OS === 'web') return !!googleOAuthConfig.webClientId;
  return false;
};

const firebaseConfig = {
  apiKey:
    (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_FIREBASE_API_KEY) ||
    androidClient?.api_key?.[0]?.current_key ||
    '',
  authDomain:
    (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN) ||
    (projectInfo?.project_id ? `${projectInfo.project_id}.firebaseapp.com` : ''),
  projectId:
    (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_FIREBASE_PROJECT_ID) ||
    projectInfo?.project_id ||
    '',
  storageBucket:
    (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET) ||
    projectInfo?.storage_bucket ||
    '',
  messagingSenderId:
    (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID) ||
    projectInfo?.project_number ||
    '',
  appId:
    (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_FIREBASE_APP_ID) ||
    androidClient?.client_info?.mobilesdk_app_id ||
    '',
};

const isFirebaseConfigured =
  !!firebaseConfig.apiKey &&
  !!firebaseConfig.projectId &&
  !!firebaseConfig.appId;

const firebaseApp = isFirebaseConfigured
  ? (getApps().length ? getApp() : initializeApp(firebaseConfig))
  : null;

let getReactNativePersistence: ((storage: any) => any) | null = null;
try {
  const rnAuth = require('firebase/auth/react-native');
  getReactNativePersistence = rnAuth?.getReactNativePersistence || null;
} catch {
  getReactNativePersistence = null;
}

const firebaseAuth = (() => {
  if (!firebaseApp) return null;

  try {
    if ((Platform.OS === 'ios' || Platform.OS === 'android') && getReactNativePersistence) {
      return initializeAuth(firebaseApp, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
    }
    return getAuth(firebaseApp);
  } catch {
    // Auth might already be initialized; return existing instance
    return getAuth(firebaseApp);
  }
})();

export interface GoogleAuthResult {
  success: boolean;
  user?: any;
  token?: string;
  error?: string;
  isNewUser?: boolean;
  hasCompletedProfile?: boolean;
  oauthUser?: any;
}

interface GoogleTokenPayload {
  idToken?: string;
  accessToken?: string;
}

/**
 * Handle Google sign-in result using Firebase auth and sync with backend.
 */
export const handleGoogleOAuthResult = async (
  googleTokens: GoogleTokenPayload,
  login: (token: string, user: any) => Promise<void>
): Promise<GoogleAuthResult> => {
  try {
    if (!isFirebaseConfigured || !firebaseAuth) {
      return {
        success: false,
        error: 'Firebase is not configured. Please check Firebase setup and environment variables.',
      };
    }

    if (!googleTokens?.idToken && !googleTokens?.accessToken) {
      return {
        success: false,
        error: 'Google auth token is missing',
      };
    }

    const credential = GoogleAuthProvider.credential(
      googleTokens.idToken || null,
      googleTokens.accessToken
    );
    const firebaseResponse = await signInWithCredential(firebaseAuth, credential);

    const firebaseUser = firebaseResponse.user;
    const email = firebaseUser.email || '';
    const name = firebaseUser.displayName || email.split('@')[0] || 'User';
    const profileImage = firebaseUser.photoURL || '';
    const firebaseUid = firebaseUser.uid;

    if (!email) {
      return {
        success: false,
        error: 'Google account did not return an email address',
      };
    }

    const oauthLoginResponse = await authApi.oauthLogin({
      email,
      providerId: firebaseUid,
      provider: 'google',
      name,
    });

    if (oauthLoginResponse?.token && oauthLoginResponse?.user) {
      await login(oauthLoginResponse.token, oauthLoginResponse.user);

      const hasCompletedProfile =
        Array.isArray(oauthLoginResponse.user.skills) &&
        oauthLoginResponse.user.skills.length > 0;

      return {
        success: true,
        user: oauthLoginResponse.user,
        token: oauthLoginResponse.token,
        hasCompletedProfile,
        isNewUser: !hasCompletedProfile,
        oauthUser: {
          email,
          name: oauthLoginResponse.user.name || name,
          provider: 'google',
          profileImage,
          firebaseUid,
          isOAuth: true,
        },
      };
    }

    return {
      success: false,
      error: 'Invalid login response from backend',
    };

  } catch (error: any) {
    console.error('❌ Google Firebase auth error:', error);
    return {
      success: false,
      error: error.message || 'Google authentication failed',
    };
  }
};

/**
 * Check if Google Sign-In is available
 */
export const isGoogleAuthAvailable = (): boolean => {
  // Native requires platform-specific OAuth client IDs.
  // Using a WEB client ID with a custom scheme on iOS/Android causes: invalid_request.
  return Platform.OS !== 'web' && isFirebaseConfigured && hasRequiredGoogleClientId();
};