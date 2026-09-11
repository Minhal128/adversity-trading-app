import React from "react";
import { View, Text, TouchableOpacity, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function HelpSupportScreen() {
  return (
    <View className="flex-1 bg-white px-6 pt-14 pb-24">
      {/* Header */}
      <View className="flex-row items-center mb-4">
        <Ionicons name="help-circle-outline" size={26} color="#008C99" />
        <Text className="text-[#008C99] text-3xl font-bold ml-3">
          Help & Support
        </Text>
      </View>

      {/* Subtext */}
      <Text className="text-gray-500 text-base mb-6">
        Need assistance? We're here to help. Reach out to our support team anytime.
      </Text>

      {/* Email Contact */}
      <TouchableOpacity
        onPress={() => Linking.openURL("mailto:support@yourapp.com")}
        activeOpacity={0.8}
        className="bg-[#E6FAFC] p-5 rounded-2xl border border-[#BFECEF] mb-4 flex-row items-center"
      >
        <Ionicons name="mail-outline" size={22} color="#008C99" />
        <Text className="text-[#008C99] ml-3 font-medium">
          support@yourapp.com
        </Text>
      </TouchableOpacity>

      {/* FAQ / Contact Buttons */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => Linking.openURL("https://yourapp.com/faq")}
        className="bg-[#FF7B00] py-4 rounded-2xl mb-3"
      >
        <Text className="text-white text-center font-semibold text-base">
          Visit FAQ
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => Linking.openURL("https://yourapp.com/contact")}
        className="border border-[#008C99] py-4 rounded-2xl"
      >
        <Text className="text-[#008C99] text-center font-semibold text-base">
          Contact Us Online
        </Text>
      </TouchableOpacity>
    </View>
  );
}
