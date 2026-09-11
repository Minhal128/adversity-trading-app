import React, { useRef, useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import authApi from "../../services/authApi";
import { useAuth } from "../../context/AuthContext";

export default function OTPScreen() {
  const navigation = useNavigation() as any;
  const route = useRoute();
  const { login } = useAuth();
  const email = (route.params as any)?.email || "";
  const userId = (route.params as any)?.userId || "";
  const isPasswordReset = (route.params as any)?.isPasswordReset || false;
  const [loading, setLoading] = useState(false);

  // Initialize refs safely
  const inputs = useRef(Array(6).fill(null));
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);

  const handleChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Safely focus next input if it exists
    if (text && index < 5) {
      const nextInput = inputs.current[index + 1];
      if (nextInput && typeof nextInput.focus === "function") {
        nextInput.focus();
      }
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && otp[index] === "" && index > 0) {
      const prevInput = inputs.current[index - 1];
      if (prevInput && typeof prevInput.focus === "function") {
        prevInput.focus();
      }
    }
  };

  const handleVerifyOTP = async () => {
    try {
      const code = otp.join("");
      if (code.length !== 6) {
        Alert.alert("Error", "Please enter the 6-digit OTP.");
        return;
      }

      setLoading(true);

      if (isPasswordReset) {
        // For password reset, navigate to password change screen with OTP
        navigation.navigate("PasswordChangeScreen", { 
          email, 
          otp: code, 
          isPasswordReset: true 
        });
      } else {
        // For registration, verify OTP with backend
        const response = await authApi.verifyOTP({ userId, otp: code });

        // Save auth token and user data
        await login(response.token, response.user);

        Alert.alert("Success", "OTP verified successfully!");
        
        // Check if profile needs to be completed
        if (response.nextStep === 'complete-profile') {
          navigation.navigate("ProfileSetup");
        } else {
          navigation.navigate("Home");
        }
      }
    } catch (error: any) {
      Alert.alert("Verification Failed", error.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-white px-6 pt-16"
      contentContainerStyle={{ alignItems: "center", paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      <Text className="text-3xl font-bold text-gray-800 mb-4">Enter OTP</Text>
      <Text className="text-gray-600 mb-2">We sent a 6-digit code to:</Text>
      <Text className="text-gray-800 font-semibold mb-10">{email}</Text>

      {/* OTP Boxes */}
      <View className="flex-row justify-center gap-2 mb-10">
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => { inputs.current[index] = ref; }}
            className="border border-orange-400 w-12 h-14 rounded-2xl text-center text-lg font-semibold bg-white shadow-sm"
            keyboardType="number-pad"
            maxLength={1}
            value={digit}
            onChangeText={(text) => handleChange(text, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
          />
        ))}
      </View>

      {/* Verify Button */}
      <TouchableOpacity
        className="bg-orange-500 rounded-full py-4 w-full shadow-lg"
        style={{ elevation: 3 }}
        onPress={handleVerifyOTP}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-center text-white text-lg font-semibold">
            Verify OTP
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity className="mt-6" onPress={() => navigation.goBack()}>
        <Text className="text-blue-500 text-center font-semibold">
          Back to Forgot Password
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
