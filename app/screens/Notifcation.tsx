import React, { useState, useEffect } from "react";
import { View, Text, Switch, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Image, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import userApi from "../../services/userApi";
import barterApi from "../../services/barterApi";
import { useAuth } from "../../context/AuthContext";

interface FriendRequest {
  _id: string;
  from: {
    _id: string;
    name: string;
    email: string;
    profileImage?: { url: string };
    rating?: number;
  };
  createdAt: string;
}

interface BarterProposal {
  _id: string;
  requester: {
    _id: string;
    name: string;
    email: string;
    profileImage?: { url: string };
    rating?: number;
  };
  offered_skill: string;
  wanted_skill: string;
  createdAt: string;
}

export default function NotificationScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(false);
  const [loading, setLoading] = useState(false);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [barterProposals, setBarterProposals] = useState<BarterProposal[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  useEffect(() => {
    loadFriendRequests();
    if (user?.notificationPreferences) {
      setEmailNotif(user.notificationPreferences.email || false);
      setPushNotif(user.notificationPreferences.push || false);
    }
  }, [user]);

  const loadFriendRequests = async () => {
    try {
      const [friendReqResponse, barterResponse] = await Promise.all([
        barterApi.getPendingFriendRequests(),
        barterApi.getPendingBarters()
      ]);
      setFriendRequests(friendReqResponse.friendRequests || []);
      setBarterProposals(barterResponse.barters || []);
    } catch (error: any) {
      console.error("Error loading notifications:", error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFriendRequests();
    setRefreshing(false);
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      setAcceptingId(requestId);
      await barterApi.acceptFriendRequest(requestId);
      Alert.alert(
        "🎉 Friend Added!", 
        "You can now find this person in your Friends list and propose a barter to start trading skills!",
        [
          { text: "View Friends", onPress: () => (navigation as any).navigate("FriendsList") },
          { text: "Stay Here", style: "cancel" }
        ]
      );
      loadFriendRequests(); // Reload the list
    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.message || "Failed to accept friend request");
    } finally {
      setAcceptingId(null);
    }
  };

  const handleAcceptBarter = async (barterId: string) => {
    try {
      setAcceptingId(barterId);
      await barterApi.acceptBarter(barterId);
      Alert.alert("Success", "Barter accepted! You can now message each other. 10 credits deducted.");
      loadFriendRequests(); // Reload the list
    } catch (error: any) {
      Alert.alert("Error", error.response?.data?.message || "Failed to accept barter");
    } finally {
      setAcceptingId(null);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      Alert.alert("Success", "Notification settings updated!");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to update settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView 
      className="flex-1 bg-white"
      contentContainerStyle={{ paddingBottom: 100 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View className="px-6 pt-14 pb-6">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#008c99" />
            </TouchableOpacity>
            <Text className="text-[#008c99] text-2xl font-semibold ml-3">
              Notifications
            </Text>
          </View>
          <TouchableOpacity 
            onPress={() => (navigation as any).navigate("FriendsList")}
            className="bg-[#008c99] px-4 py-2 rounded-full flex-row items-center"
          >
            <Ionicons name="people" size={16} color="white" />
            <Text className="text-white font-semibold ml-1 text-sm">Friends</Text>
          </TouchableOpacity>
        </View>

        {/* Friend Requests Section */}
        {friendRequests.length > 0 && (
          <View className="mb-6">
            <Text className="text-lg font-bold text-gray-800 mb-3">
              Friend Requests ({friendRequests.length})
            </Text>
            {friendRequests.map((request) => (
              <View key={request._id} className="bg-white border border-gray-200 rounded-2xl p-4 mb-3 shadow-sm">
                <View className="flex-row items-center">
                  <Image
                    source={{
                      uri: request.from.profileImage?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(request.from.name)}&size=100&background=008C99&color=fff`
                    }}
                    className="w-12 h-12 rounded-full mr-3"
                  />
                  <View className="flex-1">
                    <Text className="font-semibold text-gray-800">{request.from.name}</Text>
                    <Text className="text-sm text-gray-500">{request.from.email}</Text>
                    <Text className="text-xs text-gray-400 mt-1">
                      {new Date(request.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleAcceptRequest(request._id)}
                    disabled={acceptingId === request._id}
                    className="bg-[#008c99] px-4 py-2 rounded-full"
                  >
                    {acceptingId === request._id ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text className="text-white font-semibold">Accept</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Barter Proposals Section */}
        {barterProposals.length > 0 && (
          <View className="mb-6">
            <Text className="text-lg font-bold text-gray-800 mb-3">
              Barter Proposals ({barterProposals.length})
            </Text>
            {barterProposals.map((barter) => (
              <View key={barter._id} className="bg-white border border-gray-200 rounded-2xl p-4 mb-3 shadow-sm">
                <View className="flex-row items-center mb-3">
                  <Image
                    source={{
                      uri: barter.requester.profileImage?.url || `https://ui-avatars.com/api/?name=${encodeURIComponent(barter.requester.name)}&size=100&background=008C99&color=fff`
                    }}
                    className="w-12 h-12 rounded-full mr-3"
                  />
                  <View className="flex-1">
                    <Text className="font-semibold text-gray-800">{barter.requester.name}</Text>
                    <Text className="text-xs text-gray-400 mt-1">
                      {new Date(barter.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                <View className="bg-gray-50 rounded-lg p-3 mb-3">
                  <View className="flex-row items-center mb-2">
                    <Text className="text-sm text-gray-600 mr-2">Offers:</Text>
                    <Text className="text-sm font-semibold text-[#008c99]">{barter.offered_skill}</Text>
                  </View>
                  <View className="flex-row items-center">
                    <Text className="text-sm text-gray-600 mr-2">Wants:</Text>
                    <Text className="text-sm font-semibold text-[#ff9500]">{barter.wanted_skill}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => handleAcceptBarter(barter._id)}
                  disabled={acceptingId === barter._id}
                  className="bg-[#008c99] py-2 rounded-full"
                >
                  {acceptingId === barter._id ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text className="text-white font-semibold text-center">Accept Barter (10 credits)</Text>
                  )}
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Notification Options */}
        <Text className="text-lg font-bold text-gray-800 mb-3">Settings</Text>
        <View className="bg-gray-100 rounded-2xl p-5 mb-4">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-gray-700 text-base font-medium">
              Email Notifications
            </Text>
            <Switch
              trackColor={{ false: "#ccc", true: "#ff9500" }}
              thumbColor={emailNotif ? "#008c99" : "#f4f3f4"}
              value={emailNotif}
              onValueChange={setEmailNotif}
            />
          </View>

          <View className="flex-row justify-between items-center">
            <Text className="text-gray-700 text-base font-medium">
              Push Notifications
            </Text>
            <Switch
              trackColor={{ false: "#ccc", true: "#ff9500" }}
              thumbColor={pushNotif ? "#008c99" : "#f4f3f4"}
              value={pushNotif}
              onValueChange={setPushNotif}
            />
          </View>
        </View>

        {/* Save Changes */}
        <TouchableOpacity
          onPress={handleSaveSettings}
          className="bg-[#008c99] py-4 rounded-2xl mt-2"
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-center text-lg font-semibold">
              Save Changes
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
