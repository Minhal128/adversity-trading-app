import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function PrivacyScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const privacySections = [
    {
      title: "Data We Collect",
      icon: "document-text-outline",
      content: "We collect information you provide directly, including your name, email, phone number, profile photo, and skills. This data is used solely to provide our barter trading services and improve your experience."
    },
    {
      title: "How We Use Your Data",
      icon: "analytics-outline",
      content: "Your data is used to: match you with potential trading partners, facilitate communication between users, process transactions, send important notifications, and improve our services. We never sell your personal data to third parties."
    },
    {
      title: "Data Storage & Security",
      icon: "shield-checkmark-outline",
      content: "Your data is encrypted and stored securely on protected servers. We use industry-standard security measures including SSL encryption, secure authentication, and regular security audits to protect your information."
    },
    {
      title: "Third-Party Services",
      icon: "apps-outline",
      content: "We use trusted third-party services for authentication (Firebase), payments (Apple/Google), cloud storage (Cloudinary), and real-time communication (Stream). These services have their own privacy policies and are GDPR compliant."
    },
    {
      title: "Your Rights",
      icon: "person-outline",
      content: "You have the right to access, update, or delete your personal data at any time. You can export your data, request deletion, or opt-out of marketing communications through your account settings."
    },
    {
      title: "Data Retention",
      icon: "time-outline",
      content: "We retain your data only as long as necessary to provide our services. When you delete your account, your personal data will be permanently removed within 30 days, except where legally required to retain."
    },
    {
      title: "Cookies & Tracking",
      icon: "eye-off-outline",
      content: "We do not use tracking cookies or sell your data to advertisers. We only use essential cookies required for app functionality and authentication purposes."
    }
  ];

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center px-5 py-4 border-b border-gray-100">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-800">Privacy Policy</Text>
      </View>

      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: insets.bottom + 40, paddingTop: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Introduction */}
        <View className="mb-6">
          <Text className="text-gray-600 text-sm leading-6">
            At Adversity Trading, we are committed to protecting your privacy. This policy explains
            how we collect, use, and safeguard your personal information when you use our app.
          </Text>
        </View>

        {/* Privacy Sections */}
        {privacySections.map((section, index) => (
          <View key={index} className="mb-5 bg-gray-50 rounded-xl p-4">
            <View className="flex-row items-center mb-2">
              <View className="bg-[#008C99] p-2 rounded-lg mr-3">
                <Ionicons name={section.icon as any} size={20} color="white" />
              </View>
              <Text className="text-base font-semibold text-gray-800 flex-1">
                {section.title}
              </Text>
            </View>
            <Text className="text-gray-600 text-sm leading-5 ml-11">
              {section.content}
            </Text>
          </View>
        ))}

        {/* Full Privacy Policy Link */}
        <TouchableOpacity
          className="bg-[#008C99] rounded-xl py-4 mt-4 mb-6"
          onPress={() => Linking.openURL('https://adversitytrading.com/privacy')}
        >
          <Text className="text-white text-center font-semibold">
            Read Full Privacy Policy
          </Text>
        </TouchableOpacity>

        {/* Contact Section */}
        <View className="bg-orange-50 rounded-xl p-4 mb-4">
          <Text className="text-gray-800 font-semibold mb-2">Questions?</Text>
          <Text className="text-gray-600 text-sm">
            If you have any questions about our privacy practices, please contact us at{' '}
            <Text
              className="text-[#008C99] underline"
              onPress={() => Linking.openURL('mailto:privacy@adversitytrading.com')}
            >
              privacy@adversitytrading.com
            </Text>
          </Text>
        </View>

        {/* Last Updated */}
        <Text className="text-gray-400 text-xs text-center mt-4">
          Last updated: January 2026
        </Text>
      </ScrollView>
    </View>
  );
}
