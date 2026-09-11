import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import subscriptionApi from "../../services/subscriptionApi";
import { useAuth } from "../../context/AuthContext";

export default function MySubscriptionScreen() {
  const navigation = useNavigation();
  const { user, refreshUser } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      setLoading(true);
      const response = await subscriptionApi.getSubscriptionStatus();
      setSubscription(response.subscription);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to load subscription");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    Alert.alert(
      "Cancel Subscription",
      "Are you sure you want to cancel your subscription?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            try {
              setCancelling(true);
              await subscriptionApi.cancelSubscription();
              await refreshUser();
              await loadSubscription();
              Alert.alert("Success", "Subscription cancelled successfully");
            } catch (error: any) {
              Alert.alert("Error", error.message || "Failed to cancel subscription");
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#008C99" />
      </View>
    );
  }

  const isActive = subscription?.status === "active";
  const plan = user?.subscription?.plan || "free";

  return (
    <ScrollView className="flex-1 bg-white px-6 pt-14" contentContainerStyle={{ paddingBottom: 100 }}>
      {/* Header */}
      <Text className="text-[#008C99] text-3xl font-bold mb-2">
        My Subscription
      </Text>
      <Text className="text-gray-500 text-base mb-6">
        Manage your current plan and explore premium benefits.
      </Text>

      {/* Current Plan Card */}
      <View className="bg-[#F8F8F8] rounded-2xl p-5 mb-6 border border-gray-200 shadow-sm">
        <Text className="text-[#008C99] text-xl font-semibold mb-2">
          {plan.charAt(0).toUpperCase() + plan.slice(1)} Plan
        </Text>
        <Text className="text-gray-500 text-sm mb-4">
          {isActive
            ? `You are on the ${plan} plan with ${user?.credits || 0} credits.`
            : "You are currently using the free plan with limited access."}
        </Text>
        {!isActive ? (
          <TouchableOpacity
            className="bg-[#FF7B00] py-3 rounded-2xl"
            onPress={() => navigation.navigate("Subscription")}
          >
            <Text className="text-white text-center font-bold text-base">
              Upgrade to Premium
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            className="bg-red-500 py-3 rounded-2xl"
            onPress={handleCancelSubscription}
            disabled={cancelling}
          >
            {cancelling ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-center font-bold text-base">
                Cancel Subscription
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Premium Perks Section */}
      <View className="bg-[#E6FAFC] rounded-2xl p-5 border border-[#BFECEF]">
        <Text className="text-[#008C99] text-lg font-semibold mb-3">
          Premium Benefits
        </Text>

        <View className="flex-row items-center mb-2">
          <Ionicons name="checkmark-circle" size={20} color="#008C99" />
          <Text className="text-gray-700 ml-2">Unlimited skill exchanges</Text>
        </View>

        <View className="flex-row items-center mb-2">
          <Ionicons name="checkmark-circle" size={20} color="#008C99" />
          <Text className="text-gray-700 ml-2">Priority visibility in search</Text>
        </View>

        <View className="flex-row items-center mb-2">
          <Ionicons name="checkmark-circle" size={20} color="#008C99" />
          <Text className="text-gray-700 ml-2">Direct messaging with mentors</Text>
        </View>

        <View className="flex-row items-center">
          <Ionicons name="checkmark-circle" size={20} color="#008C99" />
          <Text className="text-gray-700 ml-2">Early access to new features</Text>
        </View>
      </View>

      <View className="h-10" />
    </ScrollView>
  );
}
