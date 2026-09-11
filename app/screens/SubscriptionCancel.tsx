import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import * as WebBrowser from 'expo-web-browser';

export default function SubscriptionCancelScreen() {
  const navigation = useNavigation<NavigationProp<any>>();

  // Close any open browser when this screen mounts (from deep link)
  useEffect(() => {
    const closeBrowser = async () => {
      try {
        await WebBrowser.dismissBrowser();
      } catch {
        // Browser might not be open, ignore error
      }
    };
    closeBrowser();
  }, []);

  const handleRetry = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Subscription' as any }],
    });
  };

  const handleHome = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Home' as any }],
    });
  };

  return (
    <View className="flex-1 items-center justify-center bg-white px-6">
      {/* Cancel Icon */}
      <View className="mb-6">
        <View className="h-24 w-24 items-center justify-center rounded-full bg-red-100">
          <Ionicons name="close-circle" size={80} color="#EF4444" />
        </View>
      </View>

      {/* Cancel Message */}
      <Text className="mb-2 text-center text-3xl font-bold text-gray-800">Payment Cancelled</Text>

      <Text className="mb-8 text-center text-base leading-6 text-gray-600">
        Your payment was not completed. No charges have been made to your account.
      </Text>

      {/* Info Box */}
      <View className="mb-8 w-full rounded-2xl border border-yellow-200 bg-yellow-50 p-6">
        <Text className="text-center text-gray-700">
          You can try again anytime or choose a different plan.
        </Text>
      </View>

      {/* Retry Button */}
      <TouchableOpacity
        className="mb-3 w-full items-center rounded-2xl bg-[#008C99] py-4"
        onPress={handleRetry}>
        <Text className="text-lg font-semibold text-white">Try Again</Text>
      </TouchableOpacity>

      {/* Back to Home */}
      <TouchableOpacity className="w-full items-center py-3" onPress={handleHome}>
        <Text className="text-base font-semibold text-[#008C99]">Back to Home</Text>
      </TouchableOpacity>
    </View>
  );
}
