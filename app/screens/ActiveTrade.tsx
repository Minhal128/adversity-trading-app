import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Image, ScrollView, ActivityIndicator, Alert, RefreshControl } from "react-native";
import { ArrowLeftIcon, StarIcon, PencilIcon } from "react-native-heroicons/outline";
import { useNavigation } from "@react-navigation/native";
import barterApi from "../../services/barterApi";
import { useAuth } from "../../context/AuthContext";

interface Trade {
  id: string;
  name: string;
  image: string;
  rating: number;
  offered: string;
  received: string;
}

export default function ActiveTradesScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("Completed");
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadTrades();
  }, [activeTab]);

  const loadTrades = async () => {
    try {
      setLoading(true);
      const statusMap: { [key: string]: string } = {
        'Ongoing': 'ongoing',
        'Completed': 'completed',
        'Pending': 'pending'
      };
      const response = await barterApi.getActiveTrades(statusMap[activeTab]);
      const tradesData = response.trades || [];
      
      // Transform API response to match Trade interface
      const transformedTrades = tradesData.map((trade: any) => ({
        id: trade._id,
        name: trade.otherUser?.name || 'User',
        image: trade.otherUser?.profileImage?.url || 'https://randomuser.me/api/portraits/lego/1.jpg',
        rating: trade.otherUser?.rating || 0,
        offered: trade.offered_skill,
        received: trade.wanted_skill
      }));
      
      setTrades(transformedTrades);
    } catch (error: any) {
      console.log("Error loading trades:", error.message);
      Alert.alert("Error", error.message || "Failed to load trades");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTrades();
  };

  const handleWriteReview = (trade: Trade) => {
    // Navigate to TradeReview screen and pass the trade data
    (navigation as any).navigate("Rating", { trade });
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center px-4 mt-16 py-3">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeftIcon size={24} color="black" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-center flex-1 mr-6">
          Active Trades
        </Text>
      </View>

      {/* Increased White Space Above Tabs */}
      <View className="h-20 bg-white" />

      {/* Tabs Container */}
      <View className="bg-[#007d86] flex-1 rounded-t-3xl">
        {/* Tabs */}
        <View className="flex-row justify-around py-4 mt-2">
          {["Ongoing", "Completed", "Pending"].map((tab) => (
            <TouchableOpacity 
              key={tab} 
              onPress={() => setActiveTab(tab)}
              activeOpacity={1} 
              className={`px-6 py-3 rounded-full ${
                activeTab === tab ? "bg-[#ff7b00]" : "bg-transparent"
              }`}
            >
              <Text
                className={`font-semibold text-base ${
                  activeTab === tab ? "text-white" : "text-gray-200"
                }`}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Content Area */}
        <ScrollView 
          className="px-4 pt-2 gap-4"
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {loading ? (
            <View className="items-center justify-center py-20">
              <ActivityIndicator size="large" color="#008C99" />
            </View>
          ) : trades.length === 0 ? (
            <View className="items-center justify-center py-20">
              <Text className="text-gray-500 text-lg">No {activeTab.toLowerCase()} trades</Text>
            </View>
          ) : activeTab === "Completed" ? (
            trades.map((trade) => (
              <View
                key={trade.id}
                className="bg-white rounded-2xl p-5 mb-4 shadow-lg"
              >
                {/* User Info and Write Review in same row */}
                <View className="flex-row items-center justify-between mb-4">
                  {/* User Info on Left */}
                  <View className="flex-row items-center flex-1">
                    <Image
                      source={{ uri: trade.image }}
                      className="w-16 h-16 rounded-full mr-4"
                    />
                    <View className="flex-1">
                      <Text className="text-black font-bold text-lg">{trade.name}</Text>
                      <View className="flex-row items-center">
                        <StarIcon size={18} color="#FACC15" fill="#FACC15" />
                        <Text className="text-gray-600 font-medium ml-1">{trade.rating}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Write Review Button on Right with Icon */}
                  <TouchableOpacity 
                    className="flex-row items-center bg-[#ff7b00] px-4 py-3 rounded-xl ml-3"
                    onPress={() => handleWriteReview(trade)}
                  >
                    <PencilIcon size={18} color="white" />
                    <Text className="text-white font-semibold ml-2">
                      Write Review
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Skills Section - Full Width */}
                <View className="bg-gray-50 rounded-xl p-4">
                  <View className="flex-row justify-between items-center">
                    <View className="flex-1">
                      <Text className="text-gray-700 text-base mb-2">
                        <Text className="font-semibold">You Offered:</Text>
                      </Text>
                      <Text className="text-gray-800 text-lg font-medium">
                        {trade.offered}
                      </Text>
                    </View>
                    
                    <View className="w-px h-12 bg-gray-300 mx-4" />
                    
                    <View className="flex-1">
                      <Text className="text-gray-700 text-base mb-2">
                        <Text className="font-semibold">You Received:</Text>
                      </Text>
                      <Text className="text-gray-800 text-lg font-medium">
                        {trade.received}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View className="bg-white rounded-2xl p-8 items-center justify-center mt-10">
              <Text className="text-gray-500 text-lg font-medium text-center">
                No {activeTab.toLowerCase()} trades found
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </View>
  );
}