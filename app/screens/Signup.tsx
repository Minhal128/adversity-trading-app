import React, { useState, useCallback, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Image, Platform } from "react-native";
import InputField from "../components/Inputfield";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, CommonActions } from "@react-navigation/native";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import authApi from "../../services/authApi";
import { saveUserId, saveOAuthUser } from "../../utils/storage";
import { useAuth } from "../../context/AuthContext";
import { signInWithApple, isAppleAuthAvailable } from "../../services/appleAuthService";
import { handleGoogleOAuthResult, isGoogleAuthAvailable, googleOAuthConfig } from "../../services/googleAuthService";
import type { NavigationProp } from "../../types/navigation";

// Warm up browser for OAuth on Android
if (Platform.OS === 'android') {
  WebBrowser.warmUpAsync().catch(() => { });
}

WebBrowser.maybeCompleteAuthSession();

export default function SignUp() {
  const navigation = useNavigation<NavigationProp>();
  const { login } = useAuth();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [appleSignInAvailable, setAppleSignInAvailable] = useState(false);
  const [googleSignInAvailable, setGoogleSignInAvailable] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

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

      console.log('🔍 Auth availability (SignUp):', {
        apple: appleAvailable,
        google: googleAvailable,
        googleRequestReady: !!googleRequest,
      });
    };
    checkAuthAvailability();
  }, [googleRequest]);

  const handleSignUp = async () => {
    try {
      if (!name || !email || !phone || !password) {
        Alert.alert("Error", "Please fill in all fields");
        return;
      }

      if (password.length < 6) {
        Alert.alert("Error", "Password must be at least 6 characters");
        return;
      }

      setLoading(true);

      const response = await authApi.register({ name, email, phone, password });

      // Save userId for OTP verification
      await saveUserId(response.userId);

      Alert.alert("Success", response.message || "OTP sent to your email");
      navigation.navigate("OTPScreen", { userId: response.userId, email });
    } catch (error: any) {
      Alert.alert("Registration Failed", error.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  // Handle Apple Sign Up (Native - without Clerk)
  const handleAppleSignUp = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🍎 Starting Apple Sign Up...');

      const result = await signInWithApple();

      if (result.success && result.user && result.token) {
        // Persist token and user data before navigating
        await login(result.token, result.user);

        const userName = result.user.name || '';
        const needsNameUpdate = result.needsNameUpdate || result.user.name === 'Apple User';
        const hasCompletedProfile = !!(result.user && Array.isArray(result.user.skills) && result.user.skills.length > 0);

        if (!hasCompletedProfile || needsNameUpdate) {
          Alert.alert("Success", `Welcome! Please complete your profile.`);
          navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'ProfileSetup' }] }));
        } else {
          Alert.alert("Success", `Welcome back, ${userName}!`);
          navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Home' }] }));
        }
      } else {
        // Don't show alert for cancelled sign in
        if (result.error && !result.error.includes('cancel')) {
          Alert.alert("Sign Up Failed", result.error || "Apple Sign Up failed");
        }
      }
    } catch (error: any) {
      console.error('Apple Sign Up error:', error);
      Alert.alert("Error", error.message || "Apple Sign Up failed");
    } finally {
      setLoading(false);
    }
  }, [login, navigation]);

  // Handle Google Sign Up using Firebase + Google auth
  const handleGoogleSignUp = useCallback(async () => {
    if (!googleSignInAvailable || !promptGoogleAuth) {
      Alert.alert(
        "Not Available",
        "Google Sign-Up is not configured for this platform. Add EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID (iOS) or EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID (Android)."
      );
      return;
    }

    try {
      setLoading(true);
      console.log('🔍 Starting Google Sign-Up with Firebase...');

      const authResponse = await promptGoogleAuth();
      if (authResponse.type !== 'success') {
        console.log('ℹ️ Google Sign-Up cancelled or dismissed');
        return;
      }

      const authPayload: any = authResponse.authentication || {};
      const authParams: any = (authResponse as any).params || {};
      const idToken = authPayload.idToken || authPayload.id_token || authParams.id_token;
      const accessToken = authPayload.accessToken || authPayload.access_token || authParams.access_token;

      if (!idToken && !accessToken) {
        throw new Error('Google did not return auth tokens. Check your Google client IDs.');
      }

      const result = await handleGoogleOAuthResult({ idToken, accessToken }, login);

      if (result.success) {
        const userName = result.user?.name || result.oauthUser?.name || '';

        if (result.hasCompletedProfile) {
          Alert.alert("Success", `Welcome back${userName ? ', ' + userName : ''}!`);
          navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Home' }] }));
        } else {
          if (result.oauthUser) {
            await saveOAuthUser(result.oauthUser);
          }
          const welcomeMessage = result.isNewUser
            ? `Welcome${userName ? ', ' + userName : ''}! Please complete your profile.`
            : `Welcome back${userName ? ', ' + userName : ''}! Please complete your profile.`;
          Alert.alert("Success", welcomeMessage);
          navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'ProfileSetup' }] }));
        }
      } else {
        Alert.alert("Sign Up Failed", result.error || "Google Sign-Up failed");
      }
    } catch (error: any) {
      console.error('❌ Google Sign-Up error:', error);

      // Handle specific OAuth errors
      if (error.message?.includes('cancelled') || error.message?.includes('canceled')) {
        console.log('ℹ️ Google Sign-Up was cancelled by user');
        return; // Don't show error for user cancellation
      }

      Alert.alert("Sign Up Failed", error.message || "Google Sign-Up failed");
    } finally {
      setLoading(false);
    }
  }, [googleSignInAvailable, promptGoogleAuth, login, navigation]);

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{
        flexGrow: 1,
        paddingHorizontal: 24,
        paddingTop: 50,
        paddingBottom: 40
      }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Tabs */}
      <View className="flex-row justify-center mb-6 rounded-lg overflow-hidden border border-gray-200">
        <TouchableOpacity
          className="flex-1 items-center py-4 bg-gray-100"
          onPress={() => navigation.navigate("SignIn")}
        >
          <Text className="text-gray-600 text-base font-medium">Sign In</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-1 items-center py-4"
          style={{ backgroundColor: "#008C9E" }}
        >
          <Text className="text-white text-base font-semibold">Sign Up</Text>
        </TouchableOpacity>
      </View>

      {/* Title */}
      <Text className="text-2xl font-bold text-gray-800 mb-8">Create Account</Text>

      {/* Inputs */}
      <InputField
        label="Full Name"
        placeholder="Enter your full name"
        value={name}
        onChangeText={setName}
      />
      <InputField
        label="Email Address"
        placeholder="Enter your email address"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />
      <InputField
        label="Phone Number"
        placeholder="Enter your phone number"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
      />

      {/* Password Input with Eye Icon */}
      <InputField
        label="Password"
        placeholder="Create your password"
        secureTextEntry={!isPasswordVisible}
        showPasswordToggle={true}
        isPasswordVisible={isPasswordVisible}
        onTogglePassword={togglePasswordVisibility}
        value={password}
        onChangeText={setPassword}
      />

      {/* Create Account Button */}
      <TouchableOpacity
        className="bg-orange-500 rounded-full py-4 mt-6 shadow-lg"
        style={{ elevation: 3 }}
        onPress={handleSignUp}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-center text-white text-lg font-semibold">
            Create Account
          </Text>
        )}
      </TouchableOpacity>

      {/* Divider */}
      <View className="flex-row items-center my-6">
        <View className="flex-1 h-px bg-gray-300" />
        <Text className="mx-4 text-gray-500 text-sm">or continue with</Text>
        <View className="flex-1 h-px bg-gray-300" />
      </View>

      {/* Social Logins */}
      <View className="gap-3 mb-6">
        <TouchableOpacity
          className="flex-row items-center justify-center space-x-3 border border-gray-300 rounded-full py-3 bg-white"
          style={{ elevation: 1 }}
          onPress={() => {
            if (!googleSignInAvailable) {
              Alert.alert("Not Available", "Google Sign-Up is unavailable on this build.");
              return;
            }
            handleGoogleSignUp();
          }}
          disabled={loading}
        >
          <Image
            source={{ uri: 'https://www.google.com/favicon.ico' }}
            style={{ width: 20, height: 20 }}
          />
          <Text className="text-base text-gray-700 font-medium ml-2">
            Sign up with Google
          </Text>
        </TouchableOpacity>

        {/* Apple Sign In - iOS only */}
        {Platform.OS === 'ios' && (
          <TouchableOpacity
            className="flex-row items-center justify-center space-x-3 border border-gray-300 rounded-full py-3 bg-black"
            style={{ elevation: 1 }}
            onPress={() => {
              if (!appleSignInAvailable) {
                Alert.alert("Not Available", "Apple Sign In requires a development build. It's not available in Expo Go.");
                return;
              }
              handleAppleSignUp();
            }}
            disabled={loading}
          >
            <Ionicons name="logo-apple" size={22} color="white" />
            <Text className="text-base text-white font-medium ml-2">
              Sign up with Apple
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Already have account */}
      <View className="flex-row justify-center mt-4 mb-4">
        <Text className="text-gray-600">Already have an account? </Text>
        <TouchableOpacity onPress={() => navigation.navigate("SignIn")}>
          <Text className="text-blue-500 font-semibold">Sign In</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}