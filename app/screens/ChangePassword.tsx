import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from "react-native";
import InputField from "../components/Inputfield";
import { useNavigation, useRoute } from "@react-navigation/native";
import authApi from "../../services/authApi";
import userApi from "../../services/userApi";

export default function PasswordChangeScreen() {
  const navigation = useNavigation() as any;
  const route = useRoute();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Check if this is a password reset or change
  const isPasswordReset = (route.params as any)?.isPasswordReset || false;
  const email = (route.params as any)?.email || "";
  const otp = (route.params as any)?.otp || "";

  const handlePasswordChange = async () => {
    try {
      if (!newPassword || !confirmPassword) {
        Alert.alert("Error", "Please fill out all fields.");
        return;
      }
      if (newPassword !== confirmPassword) {
        Alert.alert("Error", "Passwords do not match.");
        return;
      }
      if (newPassword.length < 6) {
        Alert.alert("Error", "Password must be at least 6 characters.");
        return;
      }

      setLoading(true);

      if (isPasswordReset) {
        // Reset password flow (forgot password) - uses email and OTP
        await authApi.resetPassword({ email, otp, newPassword });
      } else {
        // Change password flow (logged in user)
        await userApi.changePassword({ oldPassword, newPassword });
      }

      Alert.alert("Success", "Your password has been changed!");
      navigation.navigate("SignIn");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to change password");
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
        Create New Password
      </Text>
      <Text className="text-gray-600 mb-8">
        Enter a strong password you'll remember easily.
      </Text>

      {/* New Password */}
      <InputField
        label="New Password"
        placeholder="Enter new password"
        secureTextEntry
        value={newPassword}
        onChangeText={setNewPassword}
      />

      {/* Confirm Password */}
      <InputField
        label="Confirm Password"
        placeholder="Re-enter new password"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      {/* Submit Button */}
      <TouchableOpacity
        className="bg-orange-500 rounded-full py-4 shadow-lg mt-8"
        style={{ elevation: 3 }}
        onPress={handlePasswordChange}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-center text-white text-lg font-semibold">
            Change Password
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}
