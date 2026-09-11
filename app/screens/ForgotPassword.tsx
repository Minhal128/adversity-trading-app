import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert, TextInput, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import authApi from "../../services/authApi";

const InputField = ({ 
  label, 
  placeholder, 
  keyboardType = "default", 
  secureTextEntry = false,
  autoCapitalize = "sentences",
  value = "",
  onChangeText = () => {}
}: {
  label: string;
  placeholder: string;
  keyboardType?: any;
  secureTextEntry?: boolean;
  autoCapitalize?: any;
  value?: string;
  onChangeText?: (text: string) => void;
}) => {
  return (
    <View className="mb-4">
      <Text className="text-gray-700 text-sm font-medium mb-2">
        {label}
      </Text>
      <TextInput
        className="border border-gray-300 rounded-lg px-4 py-3 bg-white"
        placeholder={placeholder}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
};

export default function ForgotPasswordScreen() {
  const navigation = useNavigation() as any;
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    try {
      if (!email) {
        Alert.alert("Error", "Please enter your email.");
        return;
      }
      
      setLoading(true);
      const response = await authApi.forgotPassword({ email });
      
      Alert.alert("Success", response.message || "OTP sent to your email");
      navigation.navigate("OTPScreen", { 
        email,
        isPasswordReset: true 
      });
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-white px-6 pt-10"
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      <Text className="text-2xl font-bold text-gray-800 mb-8">
        Forgot Password
      </Text>
      <Text className="text-gray-600 mb-8">
        Enter your registered email address. We'll send you a verification code.
      </Text>

      <InputField
        label="Email"
        placeholder="Enter your email"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />

      <TouchableOpacity
        className="bg-orange-500 rounded-full py-4 shadow-lg mt-8"
        style={{ elevation: 3 }}
        onPress={handleContinue}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-center text-white text-lg font-semibold">
            Continue
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        className="mt-6"
        onPress={() => navigation.navigate("SignIn")}
      >
        <Text className="text-blue-500 text-center font-semibold">
          Back to Sign In
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
