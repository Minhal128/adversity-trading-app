import React, { useEffect, useState } from "react";
import { View, Text, Image, TouchableOpacity, TextInput, ScrollView, Alert, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";
import barterApi from "../../services/barterApi";
import { useAuth } from "../../context/AuthContext";

export default function TradeDetailsScreen() {
  const route = useRoute();
  const navigation = useNavigation() as any;
  const { user } = useAuth();
  const { tradeId } = (route.params as any) || {};
  
  const [trade, setTrade] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");

  useEffect(() => {
    loadTradeDetails();
  }, [tradeId]);

  const loadTradeDetails = async () => {
    try {
      setLoading(true);
      const data = await barterApi.getBarterById(tradeId);
      setTrade(data);
      setNote(data.note || "");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to load trade details");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelTrade = async () => {
    Alert.alert(
      "Cancel Trade",
      "Are you sure you want to cancel this trade?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes",
          style: "destructive",
          onPress: async () => {
            try {
              await barterApi.cancelBarter(tradeId);
              Alert.alert("Success", "Trade cancelled successfully");
              navigation.goBack();
            } catch (error: any) {
              Alert.alert("Error", error.message || "Failed to cancel trade");
            }
          },
        },
      ]
    );
  };

  const handleMarkCompleted = async () => {
    try {
      await barterApi.completeBarter({ 
        barterId: tradeId,
        rating: 5,
        comment: "Trade completed"
      } as any);
      Alert.alert("Success", "Trade marked as completed!");
      navigation.navigate("Rating", {
        trade,
        barterId: tradeId,
        userName: trade?.otherUser?.name,
        userImage: trade?.otherUser?.profileImage?.url,
      });
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to complete trade");
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-[#C7F3F5] items-center justify-center">
        <ActivityIndicator size="large" color="#008c99" />
      </View>
    );
  }

  if (!trade) {
    return (
      <View className="flex-1 bg-[#C7F3F5] items-center justify-center px-6">
        <Text className="text-gray-600 text-base">Trade not found</Text>
      </View>
    );
  }

  const otherUser = trade.otherUser || {};
  const status = trade.status || "pending";
  return (
    <View className="flex-1 bg-[#C7F3F5]">
      {/* Header */}
      <View className="flex-row items-center mt-10 px-4">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold ml-3">Trade with {otherUser.name || "User"}</Text>
      </View>

      <ScrollView className="px-4 mt-5" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Profile Card */}
        <View className="bg-white rounded-2xl shadow p-4 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Image
              source={{ uri: otherUser.profileImage?.url || "https://randomuser.me/api/portraits/women/2.jpg" }}
              className="w-14 h-14 rounded-full mr-3"
            />
            <View>
              <Text className="font-semibold text-lg">{otherUser.name || "User"}</Text>
              <View className="flex-row items-center">
                <Ionicons name="star" color="#facc15" size={14} />
                <Text className="ml-1 text-gray-600 text-sm">{otherUser.rating?.toFixed(1) || "N/A"}</Text>
              </View>
              <TouchableOpacity 
                className="bg-gray-100 px-3 py-1 mt-2 rounded-md"
                onPress={() => navigation.navigate("OtherProfile", {
                  userId: otherUser._id,
                  userName: otherUser.name,
                  rating: otherUser.rating,
                })}
              >
                <Text className="text-sm font-semibold text-gray-800">View Profile</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity>
            <Text className="text-teal-700 font-semibold text-sm">{otherUser.reviewCount || 0} Reviews</Text>
          </TouchableOpacity>
        </View>

        {/* Trade Summary */}
        <View className="mt-6">
          <Text className="text-lg font-bold mb-3">Trade Summary</Text>
          <View className="flex-row justify-between">
            {/* Offer */}
            <View className="bg-white flex-1 rounded-xl p-3 mr-2">
              <Text className="text-gray-600 text-sm mb-1">I Offer</Text>
              <Text className="font-bold text-gray-900">
                {trade.offeredSkill || "N/A"}
              </Text>
            </View>

            {/* Seek */}
            <View className="bg-white flex-1 rounded-xl p-3 ml-2">
              <Text className="text-gray-600 text-sm mb-1">I Seek</Text>
              <Text className="font-bold text-gray-900">{trade.requestedSkill || "N/A"}</Text>
            </View>
          </View>
        </View>

        {/* Progress Bar */}
        <View className="mt-6 bg-white rounded-xl p-4">
          <View className="flex-row justify-between mb-3">
            <Text className="text-gray-700 text-xs">Pending</Text>
            <Text className="text-gray-700 text-xs">Accepted</Text>
            <Text className="text-gray-700 text-xs">In Progress</Text>
            <Text className="text-gray-700 text-xs">Completed</Text>
          </View>

          <View className="flex-row justify-between items-center">
            {/* Dots with line */}
            {["pending", "accepted", "in-progress", "completed"].map((step, i) => {
              const currentIndex = ["pending", "accepted", "in-progress", "completed"].indexOf(status);
              const isActive = i <= currentIndex;
              const isCurrent = i === currentIndex;
              
              return (
                <React.Fragment key={i}>
                  <View
                    className={`w-4 h-4 rounded-full ${
                      isCurrent ? "bg-blue-500" : isActive ? "bg-green-500" : "bg-gray-300"
                    }`}
                  />
                  {i < 3 && (
                    <View
                      className={`flex-1 h-1 ${
                        isActive && i < currentIndex ? "bg-green-500" : isCurrent && i === currentIndex - 1 ? "bg-blue-300" : "bg-gray-300"
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </View>
        </View>

        {/* Credits Info */}
        <View className="bg-white rounded-xl shadow p-4 mt-6">
          <Text className="font-semibold text-lg mb-2">Credits Info</Text>
          <Text className="text-teal-700 font-semibold text-base">
            Balance: <Text className="font-bold">{user?.credits || 0} credits</Text>
          </Text>
          <Text className="text-gray-600 text-sm mt-1">
            *This trade cost {trade.creditsCost || 10} credits
          </Text>
        </View>

        {/* Additional Details */}
        <View className="bg-white rounded-xl shadow p-4 mt-6 mb-24">
          <Text className="font-semibold text-lg mb-3">Additional Details</Text>
          <View className="flex-row justify-between mb-2">
            <Text className="text-gray-600 text-sm">
              Date Created:{" "}
              <Text className="text-gray-900 font-semibold">
                {trade.createdAt ? new Date(trade.createdAt).toLocaleDateString() : "N/A"}
              </Text>
            </Text>
            <Text className="text-gray-600 text-sm">
              Trade ID: <Text className="text-gray-900 font-semibold">{trade._id?.slice(-8) || "N/A"}</Text>
            </Text>
          </View>

          <TextInput
            className="bg-gray-100 rounded-md h-20 text-gray-600 px-3 py-2 mt-2"
            placeholder="Write Note here..."
            placeholderTextColor="#888"
            multiline
            value={note}
            onChangeText={setNote}
          />
        </View>
      </ScrollView>

      {/* Bottom Buttons */}
      <View className="absolute bottom-0 left-0 right-0 flex-row justify-between px-5 pb-5">
        <TouchableOpacity 
          className="bg-red-600 flex-1 py-3 rounded-lg mr-2"
          onPress={handleCancelTrade}
        >
          <Text className="text-white text-center font-semibold text-base">
            Cancel Trade
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          className="bg-green-500 flex-1 py-3 rounded-lg ml-2"
          onPress={handleMarkCompleted}
        >
          <Text className="text-white text-center font-semibold text-base">
            Mark Completed
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
