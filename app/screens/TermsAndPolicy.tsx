import React from 'react';
import { ScrollView, View, Text, Linking, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TermsPoliciesScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const sections = [
    {
      title: "User Agreement",
      content: "By creating an account and using Adversity Trading, you agree to these terms. You must be at least 18 years old to use this service. You are responsible for maintaining the security of your account."
    },
    {
      title: "Acceptable Use",
      content: "You agree to use the app only for lawful barter trading purposes. You will not post fraudulent listings, spam other users, or engage in any activity that violates applicable laws."
    },
    {
      title: "Content Guidelines",
      content: "All content you post must be accurate and not misleading. You retain ownership of your content but grant us a license to display it within the app. We may remove content that violates our policies."
    },
    {
      title: "Transactions",
      content: "Adversity Trading facilitates connections between users but is not a party to any barter transactions. Users are solely responsible for fulfilling their agreed trades. We recommend meeting in public places for exchanges."
    },
    {
      title: "Subscriptions & Payments",
      content: "Subscription fees are billed through the Apple App Store or Google Play Store. You can cancel anytime through your device settings. Refunds are subject to store policies."
    },
    {
      title: "Zero Tolerance Policy",
      content: "We have zero tolerance for objectionable content and abusive behavior. Users posting discriminatory, harassing, or mean-spirited content will have their accounts permanently suspended. Report violations through the app."
    },
    {
      title: "Limitation of Liability",
      content: "Adversity Trading is provided 'as is' without warranties. We are not liable for any disputes between users, failed transactions, or damages arising from use of the service."
    },
    {
      title: "Termination",
      content: "We reserve the right to suspend or terminate accounts that violate these terms. You may delete your account at any time through app settings."
    }
  ];

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center px-5 py-4 border-b border-gray-100">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Ionicons name="document-text-outline" size={24} color="#008C99" />
        <Text className="ml-2 text-xl font-bold text-gray-800">Terms & Policies</Text>
      </View>

      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: insets.bottom + 40, paddingTop: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Introduction */}
        <View className="mb-6">
          <Text className="text-gray-600 text-sm leading-6">
            Welcome to Adversity Trading. These terms govern your use of our app and services. 
            By using our app, you agree to these terms.
          </Text>
        </View>

        {/* Sections */}
        {sections.map((section, index) => (
          <View key={index} className="mb-4 bg-gray-50 rounded-xl p-4">
            <Text className="text-base font-semibold text-gray-800 mb-2">
              {index + 1}. {section.title}
            </Text>
            <Text className="text-gray-600 text-sm leading-5">
              {section.content}
            </Text>
          </View>
        ))}

        {/* Links */}
        <View className="mt-4 space-y-3">
          <TouchableOpacity
            className="bg-[#008C99] rounded-xl py-4"
            onPress={() => Linking.openURL('https://www.apple.com/legal/internet-services/itunes/dev/stdeula/')}
          >
            <Text className="text-white text-center font-semibold">
              Apple's Standard EULA
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-gray-100 rounded-xl py-4 mt-3"
            onPress={() => Linking.openURL('https://adversitytrading.com/privacy')}
          >
            <Text className="text-[#008C99] text-center font-semibold">
              View Privacy Policy
            </Text>
          </TouchableOpacity>
        </View>

        {/* Last Updated */}
        <View className="rounded-2xl border border-[#BFECEF] bg-[#E6FAFC] p-4 mt-6">
          <Text className="font-semibold text-[#008C99]">Last Updated:</Text>
          <Text className="text-gray-600">January 2026</Text>
        </View>

        {/* Contact */}
        <View className="mt-4 mb-4">
          <Text className="text-gray-500 text-xs text-center">
            Questions? Contact us at{' '}
            <Text 
              className="text-[#008C99]"
              onPress={() => Linking.openURL('mailto:support@adversitytrading.com')}
            >
              support@adversitytrading.com
            </Text>
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
