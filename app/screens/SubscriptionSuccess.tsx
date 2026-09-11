import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, NavigationProp, RouteProp } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import subscriptionApi from '../../services/subscriptionApi';
import * as WebBrowser from 'expo-web-browser';

type SubscriptionSuccessParams = {
  SubscriptionSuccess: { session_id?: string; productId?: string; creditsAdded?: number };
};

interface SubscriptionData {
  plan: string | null;
  credits: number;
  status: string | null;
  creditsAdded: number;
}

export default function SubscriptionSuccessScreen() {
  const navigation = useNavigation<NavigationProp<any>>();
  const route = useRoute<RouteProp<SubscriptionSuccessParams, 'SubscriptionSuccess'>>();
  const { refreshUser, user } = useAuth();
  const [verifying, setVerifying] = useState(true);
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData>({
    plan: null,
    credits: 0,
    status: null,
    creditsAdded: 0,
  });
  
  // Prevent multiple verification attempts
  const hasVerified = useRef(false);

  // Get params from navigation
  const sessionId = route.params?.session_id;
  const productId = route.params?.productId;
  const creditsAdded = route.params?.creditsAdded;

  // Plan display names
  const planDisplayNames: { [key: string]: string } = {
    basic: 'SUPPORTER',
    standard: 'BUILDER',
    premium: 'LEGACY MEMBER',
  };

  // Product ID to credits mapping
  const productCredits: { [key: string]: number } = {
    'atc_credits_100': 100,
    'atc_350_credit': 350,
    'atc_credits_500': 500,
  };

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

  // Verify subscription and refresh user data - only once
  const verifyAndRefresh = useCallback(async () => {
    // Prevent multiple calls
    if (hasVerified.current) {
      console.log('⚠️ Already verified, skipping...');
      return;
    }
    hasVerified.current = true;

    try {
      console.log('🔄 Starting user data refresh...');
      
      // For RevenueCat purchases, we just need to refresh user data
      // The backend already processed the purchase via verify-ios/verify-android
      await refreshUser();
      console.log('✅ User data refreshed');

      // Calculate credits added from product ID
      const addedCredits = creditsAdded || (productId ? productCredits[productId] : 0) || 0;
      
      setVerifying(false);

      // Set subscription data from refreshed user
      // Give a small delay to ensure user state is updated
      setTimeout(() => {
        setSubscriptionData({
          plan: user?.subscription?.plan || null,
          credits: user?.credits || 0,
          status: user?.subscription?.status || 'active',
          creditsAdded: addedCredits,
        });
      }, 100);

    } catch (error) {
      console.error('❌ Error refreshing user data:', error);
      setVerifying(false);

      // Still show success since the purchase went through
      const addedCredits = creditsAdded || (productId ? productCredits[productId] : 0) || 0;
      setSubscriptionData({
        plan: null,
        credits: user?.credits || 0,
        status: 'active',
        creditsAdded: addedCredits,
      });
    }
  }, [refreshUser, productId, creditsAdded]); // Removed user to prevent loops

  useEffect(() => {
    verifyAndRefresh();
  }, [verifyAndRefresh]);
  
  // Update subscription data when user changes (after refresh)
  useEffect(() => {
    if (!verifying && user) {
      const addedCredits = creditsAdded || (productId ? productCredits[productId] : 0) || 0;
      setSubscriptionData(prev => ({
        ...prev,
        credits: user.credits || 0,
        plan: user.subscription?.plan || prev.plan,
        creditsAdded: addedCredits,
      }));
    }
  }, [user, verifying, productId, creditsAdded]);

  const handleContinue = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Home' as never }],
    });
  };

  return (
    <View className="flex-1 items-center justify-center bg-white px-6">
      {/* Success Icon */}
      <View className="mb-6">
        <View className="h-24 w-24 items-center justify-center rounded-full bg-green-100">
          <Ionicons name="checkmark-circle" size={80} color="#10B981" />
        </View>
      </View>

      {/* Success Message */}
      <Text className="mb-2 text-center text-3xl font-bold text-gray-800">Payment Successful!</Text>

      <Text className="mb-4 text-center text-base leading-6 text-gray-600">
        Congratulations! Your subscription has been activated.
      </Text>

      {/* Verification Status */}
      {verifying ? (
        <View className="mb-6">
          <ActivityIndicator size="large" color="#008C99" />
          <Text className="mt-2 text-center text-gray-500">Updating your account...</Text>
        </View>
      ) : (
        <>
          {/* Plan & Credits Info */}
          <View className="mb-6 w-full rounded-2xl bg-[#008C99] p-6">
            {subscriptionData.plan && (
              <View className="mb-4 items-center">
                <Text className="text-sm text-white/80">Your Plan</Text>
                <Text className="text-2xl font-bold text-white">
                  {planDisplayNames[subscriptionData.plan] || subscriptionData.plan.toUpperCase()}
                </Text>
              </View>
            )}

            <View className="items-center rounded-xl bg-white/20 p-4">
              <Text className="text-sm text-white/80">Credits Added</Text>
              <View className="flex-row items-center">
                <Ionicons name="star" size={28} color="#FFD700" />
                <Text className="ml-2 text-4xl font-bold text-white">
                  +{subscriptionData.creditsAdded || 0}
                </Text>
              </View>
              <Text className="mt-2 text-sm text-white/80">
                Total Balance:{' '}
                <Text className="font-bold text-white">{subscriptionData.credits} credits</Text>
              </Text>
            </View>
          </View>
        </>
      )}

      {/* Benefits */}
      <View className="mb-6 w-full rounded-2xl bg-blue-50 p-5">
        <Text className="mb-3 text-base font-semibold text-gray-800">Your Plan Includes:</Text>
        <View className="gap-2">
          <View className="flex-row items-center">
            <Ionicons name="checkmark-circle" size={18} color="#10B981" />
            <Text className="ml-2 text-sm text-gray-700">Access to ATC trades & community</Text>
          </View>
          <View className="flex-row items-center">
            <Ionicons name="checkmark-circle" size={18} color="#10B981" />
            <Text className="ml-2 text-sm text-gray-700">Priority barter matching</Text>
          </View>
          <View className="flex-row items-center">
            <Ionicons name="checkmark-circle" size={18} color="#10B981" />
            <Text className="ml-2 text-sm text-gray-700">Cancel anytime</Text>
          </View>
        </View>
      </View>

      {/* Continue Button */}
      <TouchableOpacity
        className="mb-3 w-full items-center rounded-2xl bg-[#FF7B00] py-4 shadow-lg"
        onPress={handleContinue}
        disabled={verifying}>
        <Text className="text-lg font-bold text-white">
          {verifying ? 'Please wait...' : 'Start Using Your Credits →'}
        </Text>
      </TouchableOpacity>

      {/* View Subscription Details */}
      <TouchableOpacity
        className="w-full items-center py-3"
        onPress={() => navigation.navigate('MySubscription' as never)}>
        <Text className="text-base font-semibold text-[#008C99]">View Subscription Details</Text>
      </TouchableOpacity>
    </View>
  );
}
