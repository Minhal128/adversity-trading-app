import React, { useState } from "react";
import { View, Text, TouchableOpacity, Image, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";

export default function SecurityScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);

  const handleToggle2FA = () => {
    setTwoFAEnabled(!twoFAEnabled);
    Alert.alert(
      "Two-Factor Authentication",
      twoFAEnabled ? "2FA has been disabled" : "2FA has been enabled"
    );
  };

  return (
    <View className="flex-1 bg-white px-6 py-10 pb-24">
      {/* Header */}
      <View className="flex-row items-center mb-6">
        <Ionicons name="lock-closed-outline" size={24} color="#008c99" />
        <Text className="text-[#008c99] text-2xl font-bold ml-3">
          Security
        </Text>
      </View>

      {/* Section: Password */}
      <TouchableOpacity
        className="bg-white border border-gray-300 rounded-2xl p-4 mb-4 shadow-sm"
        activeOpacity={0.8}
        onPress={() => navigation.navigate("ChangePassword")}
      >
        <View className="flex-row items-center">
          <Ionicons name="key-outline" size={22} color="#F97316" />
          <Text className="text-gray-700 text-base ml-3 font-medium">
            Change Password
          </Text>
        </View>
      </TouchableOpacity>

      {/* Section: Two-Factor Authentication */}
      <View className="bg-white border border-gray-300 rounded-2xl p-5 shadow-sm">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center">
            <Ionicons
              name="shield-checkmark-outline"
              size={22}
              color="#008c99"
            />
            <Text className="text-gray-700 text-base ml-3 font-medium">
              Two-Factor Authentication
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleToggle2FA}
            className={`px-4 py-1 rounded-full ${
              twoFAEnabled ? "bg-[#008c99]" : "bg-gray-300"
            }`}
          >
            <Text
              className={`text-sm ${
                twoFAEnabled ? "text-white font-semibold" : "text-gray-700"
              }`}
            >
              {twoFAEnabled ? "ON" : "OFF"}
            </Text>
          </TouchableOpacity>
        </View>

        {twoFAEnabled && (
          <View className="items-center mt-4">
            <Text className="text-gray-500 text-sm mb-3">
              Scan this QR code in your Authenticator App
            </Text>

            {/* QR Placeholder */}
            <View className="bg-white rounded-lg p-3 mb-4 border border-gray-200">
              <Image
                source={{
                  uri: "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=2FA-SETUP",
                }}
                className="w-36 h-36"
              />
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              className="bg-[#F97316] rounded-2xl px-6 py-3 w-full"
            >
              <Text className="text-center text-white font-semibold text-base">
                Verify Setup
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}
