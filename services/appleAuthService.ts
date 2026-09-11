import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';
import api from '../config/axios';

export interface AppleAuthResult {
  success: boolean;
  user?: any;
  token?: string;
  error?: string;
  isNewUser?: boolean;
  needsNameUpdate?: boolean;
}

/**
 * Check if Apple Sign-In is available on this device
 * Note: Only works on iOS 13+ and requires a development build (not Expo Go)
 */
export const isAppleAuthAvailable = async (): Promise<boolean> => {
  if (Platform.OS !== 'ios') {
    return false;
  }

  try {
    return await AppleAuthentication.isAvailableAsync();
  } catch {
    return false;
  }
};

/**
 * Sign in with Apple (Native - requires development build)
 * Returns user credentials which should be verified on the backend
 */
export const signInWithApple = async (): Promise<AppleAuthResult> => {
  try {
    // Check availability first
    const isAvailable = await isAppleAuthAvailable();
    if (!isAvailable) {
      return {
        success: false,
        error: 'Apple Sign-In is not available. Make sure you are running on iOS with a development build (not Expo Go).',
      };
    }

    console.log('🍎 Starting native Apple Sign-In...');

    // Request Apple Sign-In
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    console.log('🍎 Apple credential received:', {
      user: credential.user,
      email: credential.email,
      fullName: credential.fullName,
      hasIdentityToken: !!credential.identityToken,
      hasAuthorizationCode: !!credential.authorizationCode,
    });

    let identityToken = credential.identityToken;

    // Fallback: Some Apple flows can return only an authorization code.
    // Exchange it on the backend and reuse the returned id_token.
    if (!identityToken && credential.authorizationCode) {
      try {
        console.log('🍎 Exchanging Apple authorization code for tokens...');
        const verifyResponse = await api.post('/api/auth/apple-verify-code', {
          authorizationCode: credential.authorizationCode,
        });

        identityToken =
          verifyResponse?.data?.tokens?.id_token ||
          verifyResponse?.data?.tokens?.idToken ||
          null;

        console.log('🍎 Apple code exchange result:', {
          hasIdentityToken: !!identityToken,
        });
      } catch (exchangeError: any) {
        console.error('🍎 Apple code exchange failed:', exchangeError?.message || exchangeError);
      }
    }

    if (!identityToken || !credential.user) {
      return {
        success: false,
        error: 'Apple Sign-In did not return required credentials. Please try again.',
      };
    }

    // Send to backend for verification
    const response = await api.post('/api/auth/apple-signin', {
      identityToken,
      authorizationCode: credential.authorizationCode,
      user: credential.user, // Apple's unique user ID
      email: credential.email,
      fullName: credential.fullName ? {
        givenName: credential.fullName.givenName,
        familyName: credential.fullName.familyName,
      } : null,
    });

    console.log('✅ Apple Sign-In backend response:', response.data);

    return {
      success: true,
      user: response.data.user,
      token: response.data.token,
      isNewUser: response.data.isNewUser,
      needsNameUpdate: response.data.needsNameUpdate,
    };

  } catch (error: any) {
    console.error('🍎 Apple Sign-In error:', error);

    // Handle specific Apple errors
    if (error.code === 'ERR_REQUEST_CANCELED') {
      return {
        success: false,
        error: 'Sign-in was cancelled',
      };
    }

    if (error.code === 'ERR_INVALID_OPERATION') {
      return {
        success: false,
        error: 'Apple Sign-In is not available. Please use a development build instead of Expo Go.',
      };
    }

    return {
      success: false,
      error: error.message || 'Apple Sign-In failed',
    };
  }
};

/**
 * Get the credential state for a user (check if still authorized)
 */
export const getCredentialState = async (userId: string): Promise<string> => {
  try {
    const state = await AppleAuthentication.getCredentialStateAsync(userId);

    switch (state) {
      case AppleAuthentication.AppleAuthenticationCredentialState.AUTHORIZED:
        return 'authorized';
      case AppleAuthentication.AppleAuthenticationCredentialState.REVOKED:
        return 'revoked';
      case AppleAuthentication.AppleAuthenticationCredentialState.NOT_FOUND:
        return 'not_found';
      case AppleAuthentication.AppleAuthenticationCredentialState.TRANSFERRED:
        return 'transferred';
      default:
        return 'unknown';
    }
  } catch {
    return 'error';
  }
};
