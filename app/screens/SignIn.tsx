import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import InputField from '../components/Inputfield';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, CommonActions } from '@react-navigation/native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import authApi from '../../services/authApi';
import { useAuth } from '../../context/AuthContext';
import { signInWithApple, isAppleAuthAvailable } from '../../services/appleAuthService';
import {
  handleGoogleOAuthResult,
  isGoogleAuthAvailable,
  googleOAuthConfig,
} from '../../services/googleAuthService';
import { saveOAuthUser } from '../../utils/storage';
import type { NavigationProp } from '../../types/navigation';

// Warm up browser for OAuth on Android
if (Platform.OS === 'android') {
  WebBrowser.warmUpAsync().catch(() => { });
}

WebBrowser.maybeCompleteAuthSession();

export default function SignIn() {
  const navigation = useNavigation<NavigationProp>();
  const { login } = useAuth();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [appleSignInAvailable, setAppleSignInAvailable] = useState(false);
  const [googleSignInAvailable, setGoogleSignInAvailable] = useState(false);

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const googleAuthRequestConfig =
    Platform.OS === 'ios'
      ? {
        iosClientId: googleOAuthConfig.iosClientId,
        scopes: ['openid', 'profile', 'email'],
        selectAccount: true,
      }
      : Platform.OS === 'android'
        ? {
          androidClientId: googleOAuthConfig.androidClientId,
          scopes: ['openid', 'profile', 'email'],
          selectAccount: true,
        }
        : {
          webClientId: googleOAuthConfig.webClientId,
          scopes: ['openid', 'profile', 'email'],
          selectAccount: true,
        };

  const [googleRequest, , promptGoogleAuth] = Google.useAuthRequest(googleAuthRequestConfig);

  // Cleanup WebBrowser on unmount (Android only)
  useEffect(() => {
    return () => {
      if (Platform.OS === 'android') {
        WebBrowser.coolDownAsync().catch(() => { });
      }
    };
  }, []);

  // Check if Apple and Google Sign In are available on mount
  useEffect(() => {
    const checkAuthAvailability = async () => {
      const appleAvailable = await isAppleAuthAvailable();
      const googleAvailable = isGoogleAuthAvailable() && !!googleRequest;
      setAppleSignInAvailable(appleAvailable);
      setGoogleSignInAvailable(googleAvailable);

      console.log('🔍 Auth availability:', {
        apple: appleAvailable,
        google: googleAvailable,
        googleRequestReady: !!googleRequest,
      });
    };
    checkAuthAvailability();
  }, [googleRequest]);

  const handleSignIn = async () => {
    try {
      if (!email || !password) {
        Alert.alert('Error', 'Please fill in all fields');
        return;
      }

      setLoading(true);
      const response = await authApi.login({ email, password });
      await login(response.token, response.user);

      Alert.alert('Success', 'Login successful!');

      // Check if profile is complete (has skills)
      if (
        response.user.skills &&
        Array.isArray(response.user.skills) &&
        response.user.skills.length > 0
      ) {
        // Reset navigation stack to prevent going back to login
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Home' }],
          })
        );
      } else {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'ProfileSetup' }],
          })
        );
      }
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  // Handle Apple Sign In (Native - without Clerk)
  const handleAppleSignIn = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🍎 Starting Apple Sign In...');

      const result = await signInWithApple();

      if (result.success && result.user && result.token) {
        // Persist token and user data before navigating
        await login(result.token, result.user);

        const userName = result.user.name || '';
        Alert.alert(
          'Success',
          `Welcome${userName && userName !== 'Apple User' ? ', ' + userName : ''}!`
        );

        const hasCompletedProfile = !!(
          result.user &&
          Array.isArray(result.user.skills) &&
          result.user.skills.length > 0
        );
        const needsNameUpdate = result.needsNameUpdate || result.user.name === 'Apple User';

        if (!hasCompletedProfile || needsNameUpdate) {
          navigation.dispatch(
            CommonActions.reset({ index: 0, routes: [{ name: 'ProfileSetup' }] })
          );
        } else {
          navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Home' }] }));
        }
      } else {
        // Don't show alert for cancelled sign in
        if (result.error && !result.error.includes('cancel')) {
          Alert.alert('Sign In Failed', result.error || 'Apple Sign In failed');
        }
      }
    } catch (error: any) {
      console.error('Apple Sign In error:', error);
      Alert.alert('Error', error.message || 'Apple Sign In failed');
    } finally {
      setLoading(false);
    }
  }, [login, navigation]);

  // Handle Google Sign In using Firebase + Google auth
  const handleGoogleSignIn = useCallback(async () => {
    if (!googleSignInAvailable || !promptGoogleAuth) {
      Alert.alert(
        'Not Available',
        'Google Sign-In is not configured for this platform. Add EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID (iOS) or EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID (Android).'
      );
      return;
    }

    try {
      setLoading(true);
      console.log('🔍 Starting Google Sign-In with Firebase...');

      const authResponse = await promptGoogleAuth();
      console.log('🔍 Google auth response type:', authResponse.type);
      console.log('🔍 Google auth response:', JSON.stringify(authResponse, null, 2));

      if (authResponse.type !== 'success') {
        console.log('ℹ️ Google Sign-In cancelled or dismissed');
        return;
      }

      const authPayload: any = authResponse.authentication || {};
      const authParams: any = (authResponse as any).params || {};
      console.log('🔍 Auth payload:', JSON.stringify(authPayload, null, 2));
      console.log('🔍 Auth params:', JSON.stringify(authParams, null, 2));

      let idToken = authPayload.idToken || authPayload.id_token || authParams.id_token;
      let accessToken =
        authPayload.accessToken || authPayload.access_token || authParams.access_token;

      // Some Google OAuth responses return an authorization code (PKCE) instead of tokens.
      // Exchange the code for tokens so Firebase can create a credential.
      const authCode = authParams.code;
      if ((!idToken && !accessToken) && authCode && googleRequest) {
        try {
          const platformClientId =
            Platform.OS === 'ios'
              ? googleOAuthConfig.iosClientId
              : Platform.OS === 'android'
                ? googleOAuthConfig.androidClientId
                : googleOAuthConfig.webClientId;

          if (!platformClientId) {
            throw new Error('Missing Google OAuth client ID for token exchange.');
          }

          const tokenResponse = await AuthSession.exchangeCodeAsync(
            {
              clientId: platformClientId,
              code: authCode,
              redirectUri: (googleRequest as any).redirectUri,
              extraParams: {
                code_verifier: (googleRequest as any).codeVerifier,
              },
            },
            {
              tokenEndpoint: 'https://oauth2.googleapis.com/token',
            }
          );

          idToken = (tokenResponse as any)?.idToken || (tokenResponse as any)?.id_token;
          accessToken =
            tokenResponse.accessToken ||
            (tokenResponse as any)?.access_token ||
            accessToken;

          console.log('🔍 Token exchange success:', {
            hasIdToken: !!idToken,
            hasAccessToken: !!accessToken,
          });
        } catch (exchangeError) {
          console.error('❌ Google token exchange failed:', exchangeError);
        }
      }

      if (!idToken && !accessToken) {
        throw new Error('Google did not return auth tokens. Check your Google client IDs.');
      }

      const result = await handleGoogleOAuthResult({ idToken, accessToken }, login);

      if (result.success) {
        const userName = result.user?.name || result.oauthUser?.name || '';

        if (result.hasCompletedProfile) {
          Alert.alert('Success', `Welcome back${userName ? ', ' + userName : ''}!`);
          navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Home' }] }));
        } else {
          if (result.oauthUser) {
            await saveOAuthUser(result.oauthUser);
          }
          Alert.alert(
            'Success',
            `Welcome${userName ? ', ' + userName : ''}! Please complete your profile.`
          );
          navigation.dispatch(
            CommonActions.reset({ index: 0, routes: [{ name: 'ProfileSetup' }] })
          );
        }
      } else {
        Alert.alert('Sign In Failed', result.error || 'Google Sign-In failed');
      }
    } catch (error: any) {
      console.error('❌ Google Sign-In error:', error);

      // Handle specific OAuth errors
      if (error.message?.includes('cancelled') || error.message?.includes('canceled')) {
        console.log('ℹ️ Google Sign-In was cancelled by user');
        return; // Don't show error for user cancellation
      }

      Alert.alert('Sign In Failed', error.message || 'Google Sign-In failed');
    } finally {
      setLoading(false);
    }
  }, [googleSignInAvailable, promptGoogleAuth, login, navigation]);

  return (
    <ScrollView
      className="flex-1 bg-white px-6"
      contentContainerStyle={{ paddingBottom: 40, paddingTop: 50 }}
      showsVerticalScrollIndicator={false}>
      {/* Tabs */}
      <View className="mb-8 flex-row justify-center overflow-hidden rounded-lg border border-gray-200">
        <TouchableOpacity
          className="flex-1 items-center py-4"
          style={{ backgroundColor: '#008C99' }}>
          <Text className="text-base font-semibold text-white">Sign In</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-1 items-center bg-gray-100 py-4"
          onPress={() => navigation.navigate('SignUp')}>
          <Text className="text-base font-medium text-gray-600">Sign Up</Text>
        </TouchableOpacity>
      </View>

      <Text className="mb-8 text-2xl font-bold text-gray-800">Welcome Back</Text>

      <InputField
        label="Email"
        placeholder="username@gmail.com"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />

      {/* Password Input with Eye Icon */}
      <InputField
        label="Password"
        placeholder="Enter your password"
        secureTextEntry={!isPasswordVisible}
        showPasswordToggle={true}
        isPasswordVisible={isPasswordVisible}
        onTogglePassword={togglePasswordVisibility}
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity
        className="mb-6 self-end"
        onPress={() => navigation.navigate('ForgotPassword')}>
        <Text className="text-sm font-medium text-blue-500">Forgot Password?</Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="rounded-full py-4 shadow-lg"
        style={{ elevation: 3, backgroundColor: '#F97316' }}
        onPress={handleSignIn}
        disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-center text-lg font-semibold text-white">Sign In</Text>
        )}
      </TouchableOpacity>

      <View className="my-8 flex-row items-center">
        <View className="h-px flex-1 bg-gray-300" />
        <Text className="mx-4 text-sm text-gray-500">or continue with</Text>
        <View className="h-px flex-1 bg-gray-300" />
      </View>

      {/* Social Logins */}
      <View className="gap-4">
        <TouchableOpacity
          className="flex-row items-center justify-center space-x-3 rounded-full border border-gray-300 bg-white py-3"
          style={{ elevation: 1 }}
          onPress={() => {
            if (!googleSignInAvailable) {
              Alert.alert('Not Available', 'Google Sign-In is unavailable on this build.');
              return;
            }
            handleGoogleSignIn();
          }}
          disabled={loading}>
          <Image
            source={{ uri: 'https://www.google.com/favicon.ico' }}
            style={{ width: 20, height: 20 }}
          />
          <Text className="ml-2 text-base font-medium text-gray-700">Sign in with Google</Text>
        </TouchableOpacity>

        {/* Apple Sign In - iOS only */}
        {Platform.OS === 'ios' && (
          <TouchableOpacity
            className="flex-row items-center justify-center space-x-3 rounded-full border border-gray-300 bg-black py-3"
            style={{ elevation: 1 }}
            onPress={() => {
              if (!appleSignInAvailable) {
                Alert.alert(
                  'Not Available',
                  "Apple Sign In requires a development build. It's not available in Expo Go."
                );
                return;
              }
              handleAppleSignIn();
            }}
            disabled={loading}>
            <Ionicons name="logo-apple" size={22} color="white" />
            <Text className="ml-2 text-base font-medium text-white">Sign in with Apple</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}
