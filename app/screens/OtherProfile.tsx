import React, { useEffect, useState } from "react";
import { View, Text, Image, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useAuth } from "../../context/AuthContext";
import userApi from "../../services/userApi";
import barterApi from "../../services/barterApi";
import chatApi from "../../services/chatApi";
import authApi from "../../services/authApi";

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  profileImage?: { url: string };
  skills_offered?: string[];
  skills_wanted?: string[];
  rating?: number;
}

export default function OtherProfileScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { userId } = (route.params as any) || {};
  const { user: currentUser, refreshUser } = useAuth();
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendingRequest, setSendingRequest] = useState(false);
  const [isFriend, setIsFriend] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [requestReceived, setRequestReceived] = useState(false);

  useEffect(() => {
    if (userId) {
      loadUserProfile();
      checkFriendStatus();
      checkFriendRequestStatus();
    }
  }, [userId, currentUser]);

  const checkFriendStatus = () => {
    if (currentUser?.friends && Array.isArray(currentUser.friends)) {
      const friendIds = currentUser.friends.map((f: any) => typeof f === 'string' ? f : f._id);
      setIsFriend(friendIds.includes(userId));
    }
  };

  const checkFriendRequestStatus = async () => {
    try {
      const response = await barterApi.getAllFriendRequests();
      const sentRequests = response.sentRequests || [];
      const receivedRequests = response.receivedRequests || [];

      // Check if current user has sent a request to this user
      const hasSentRequest = sentRequests.some((req: any) =>
        req.to?._id === userId || req.to === userId
      );

      // Check if this user has sent a request to current user
      const hasReceivedRequest = receivedRequests.some((req: any) =>
        req.from?._id === userId || req.from === userId
      );

      console.log('Friend request status:', { hasSentRequest, hasReceivedRequest, userId });

      setRequestSent(hasSentRequest);
      setRequestReceived(hasReceivedRequest);
    } catch (error) {
      console.log('Could not check friend request status:', error);
    }
  };

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const response = await userApi.getUserById(userId);
      setProfileData(response.user);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleAddFriend = async () => {
    try {
      console.log('🔵 Add Friend button clicked');
      setSendingRequest(true);

      // Refresh user data to get latest credits before checking
      await refreshUser();

      // Re-fetch user from context after refresh
      const freshUser = await authApi.getProfile();
      const userData = freshUser.user || freshUser.data?.user;

      console.log('Current user after refresh:', userData);

      // Check credits - users need at least 10 credits to send friend requests
      const userCredits = userData?.credits || 0;
      if (userCredits < 10) {
        console.log('❌ User has insufficient credits:', userCredits);
        Alert.alert(
          "Insufficient Credits",
          `You need 10 credits to send a friend request. You currently have ${userCredits} credits.`,
          [
            { text: "Cancel", style: "cancel" },
            { text: "Buy Credits", onPress: () => (navigation as any).navigate("Subscription") }
          ]
        );
        return;
      }

      console.log('✅ Validation passed, sending friend request to:', userId);
      await barterApi.sendFriendRequest({ toUserId: userId });
      console.log('✅ Friend request sent successfully');
      setRequestSent(true); // Update UI to show "Request Sent"
      await refreshUser(); // Refresh to update friend list and credits
      Alert.alert(
        "Request Sent! 🎉",
        "Friend request sent! 10 credits deducted. Once they accept, you'll find them in your Friends list where you can propose a barter.",
        [{ text: "OK" }]
      );
    } catch (error: any) {
      console.error('🔴 Error in handleAddFriend:', error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to send friend request";
      Alert.alert("Error", errorMessage);
    } finally {
      setSendingRequest(false);
    }
  };

  const handleMessage = async () => {
    try {
      const response = await chatApi.getOrCreateChat({ userId });
      (navigation as any).navigate("ChatScreen", {
        chatId: response.chatId,
        userName: profileData?.name,
        userAvatar: profileData?.profileImage?.url,
      });
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || "Failed to start chat";
      if (error.response?.status === 403) {
        Alert.alert(
          "Active Barter Required",
          "You can only message users with whom you have an active barter. Please propose and accept a barter first.",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Propose Barter", onPress: handleProposeBarter }
          ]
        );
      } else {
        Alert.alert("Error", errorMsg);
      }
    }
  };

  const handleProposeBarter = () => {
    // Check credits
    if (!currentUser?.credits || currentUser.credits < 1) {
      Alert.alert(
        "Insufficient Credits",
        "You need credits to propose a barter. Please purchase a subscription to continue.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Buy Credits", onPress: () => (navigation as any).navigate("Subscription") }
        ]
      );
      return;
    }

    (navigation as any).navigate("ProposeBarter", {
      userId,
      userName: profileData?.name,
    });
  };

  const handleBlockUser = async () => {
    Alert.alert(
      "Block User",
      "Are you sure you want to block this user? You will no longer see their messages or profile.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Block",
          style: "destructive",
          onPress: async () => {
            try {
              await userApi.blockUser(userId);
              Alert.alert("Blocked", "User has been blocked.");
              navigation.goBack();
            } catch (error: any) {
              Alert.alert("Error", error.message || "Failed to block user");
            }
          }
        }
      ]
    );
  };

  const handleReportUser = () => {
    Alert.alert(
      "Report User",
      "Why are you reporting this user?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Spam", onPress: () => submitReport("spam") },
        { text: "Harassment", onPress: () => submitReport("harassment") },
        { text: "Inappropriate Content", onPress: () => submitReport("inappropriate_content") },
        { text: "Scam", onPress: () => submitReport("scam") },
      ]
    );
  };

  const submitReport = async (reason: string) => {
    try {
      await userApi.reportUser({ reportedUserId: userId, reason });
      Alert.alert("Reported", "Thank you for your report. We will review it shortly.");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to submit report");
    }
  };

  const showOptions = () => {
    Alert.alert(
      "Options",
      "Select an action",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Report User", onPress: handleReportUser },
        { text: "Block User", style: "destructive", onPress: handleBlockUser },
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

  if (!profileData) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-gray-500">User not found</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <ScrollView showsVerticalScrollIndicator={false} className="px-5 pt-10" contentContainerStyle={{ paddingBottom: 100 }}>
        {/* 🔙 Back Button */}
        <TouchableOpacity
          className="absolute left-5 top-10 z-10"
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>

        {/* 🚨 Options Button */}
        <TouchableOpacity
          className="absolute right-5 top-10 z-10"
          onPress={showOptions}
        >
          <Ionicons name="ellipsis-vertical" size={24} color="black" />
        </TouchableOpacity>

        {/* 👤 Profile Header */}
        <View className="items-center mt-10">
          <Image
            source={{
              uri: profileData.profileImage?.url || "https://ui-avatars.com/api/?name=" + (profileData.name || "User") + "&size=200&background=008C99&color=fff",
            }}
            className="w-28 h-28 rounded-full mb-3"
          />
          <Text className="text-xl font-bold text-gray-800">{profileData.name || "User"}</Text>
          <View className="flex-row items-center">
            <Ionicons name="mail-outline" size={14} color="gray" />
            <Text className="text-gray-500 text-sm ml-1">{profileData.email || ""}</Text>
          </View>
        </View>

        {/* 🧡 Buttons */}
        <View className="flex-row justify-center mt-4 gap-3">
          {isFriend ? (
            <>
              <TouchableOpacity
                className="bg-green-500 px-4 py-2 rounded-full flex-row items-center"
                disabled
              >
                <Ionicons name="checkmark-circle" size={16} color="white" />
                <Text className="text-white font-semibold ml-1 text-sm">Friends</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="bg-[#008c99] px-4 py-2 rounded-full flex-row items-center"
                onPress={handleProposeBarter}
              >
                <Ionicons name="swap-horizontal" size={16} color="white" />
                <Text className="text-white font-semibold ml-1 text-sm">Propose Barter</Text>
              </TouchableOpacity>
            </>
          ) : requestSent ? (
            <TouchableOpacity
              className="bg-yellow-500 px-6 py-2 rounded-full flex-row items-center"
              disabled
            >
              <Ionicons name="time-outline" size={16} color="white" />
              <Text className="text-white font-semibold ml-1 text-sm">Request Sent</Text>
            </TouchableOpacity>
          ) : requestReceived ? (
            <TouchableOpacity
              className="bg-blue-500 px-6 py-2 rounded-full flex-row items-center"
              onPress={() => (navigation as any).navigate("Notification")}
            >
              <Ionicons name="person-add" size={16} color="white" />
              <Text className="text-white font-semibold ml-1 text-sm">Accept Request</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              className="bg-gray-200 px-6 py-2 rounded-full"
              onPress={handleAddFriend}
              disabled={sendingRequest}
            >
              {sendingRequest ? (
                <ActivityIndicator size="small" color="#008C99" />
              ) : (
                <Text className="text-gray-800 font-semibold text-sm">Add Friend</Text>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            className="bg-orange-500 px-6 py-2 rounded-full"
            onPress={handleMessage}
          >
            <Text className="text-white font-semibold text-sm">Message</Text>
          </TouchableOpacity>
        </View>

        {/* Info Banner for Friends */}
        {isFriend && (
          <View className="mx-0 mt-4 bg-blue-50 rounded-xl p-4 border border-blue-100">
            <View className="flex-row items-start">
              <Ionicons name="information-circle" size={20} color="#3B82F6" />
              <View className="ml-2 flex-1">
                <Text className="text-blue-800 font-semibold text-sm">You're friends! 🎉</Text>
                <Text className="text-blue-600 text-xs mt-1">
                  Tap "Propose Barter" above to start trading skills. Once your barter is accepted, you'll be able to message each other.
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* ⭐ Rating */}
        <View className="bg-[#0097A7] rounded-2xl px-5 py-4 mt-6 flex-row items-center justify-between">
          <View>
            <Text className="text-white text-lg font-semibold">{profileData.rating?.toFixed(1) || "N/A"}</Text>
            <Text className="text-white text-sm">Rating</Text>
          </View>
          <View className="flex-row">
            {[...Array(5)].map((_, i) => (
              <Ionicons
                key={i}
                name={i < Math.floor(profileData.rating || 0) ? "star" : "star-outline"}
                size={20}
                color="yellow"
              />
            ))}
          </View>
        </View>

        {/* 💼 Skills Offered */}
        <View className="mt-6">
          <Text className="font-bold text-gray-800 text-lg mb-2">
            Skills Offered
          </Text>
          <View className="border border-gray-300 rounded-2xl p-3 flex-row flex-wrap">
            {profileData.skills_offered && profileData.skills_offered.length > 0 ? (
              profileData.skills_offered.map((skill, i) => (
                <Text key={i} className="bg-green-100 px-3 py-1 rounded-full mr-2 mb-2 text-gray-800">
                  {skill}
                </Text>
              ))
            ) : (
              <Text className="text-gray-500">No skills listed</Text>
            )}
          </View>
        </View>

        {/* 🎯 Skills/Services Seeking */}
        <View className="mt-4">
          <Text className="font-bold text-gray-800 text-lg mb-2">
            Skills/Services Seeking
          </Text>
          <View className="border border-gray-300 rounded-2xl p-3 flex-row flex-wrap">
            {profileData.skills_wanted && profileData.skills_wanted.length > 0 ? (
              profileData.skills_wanted.map((skill, i) => (
                <Text key={i} className="bg-blue-100 px-3 py-1 rounded-full mr-2 mb-2 text-gray-800">
                  {skill}
                </Text>
              ))
            ) : (
              <Text className="text-gray-500">No skills listed</Text>
            )}
          </View>
        </View>

        {/* Phone Number */}
        {profileData.phone && (
          <View className="mt-4">
            <Text className="font-bold text-gray-800 text-lg mb-2">Contact</Text>
            <View className="bg-gray-50 rounded-2xl p-4 flex-row items-center">
              <Ionicons name="call-outline" size={20} color="#008C99" />
              <Text className="text-gray-700 ml-3">{profileData.phone}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* 🧭 Bottom Tab Bar */}
      <View
        style={{
          position: "absolute",
          bottom: 40,
          left: 16,
          right: 16,
          backgroundColor: "#008C99",
          borderRadius: 50,
          flexDirection: "row",
          justifyContent: "space-around",
          paddingVertical: 12,
          elevation: 6,
          shadowColor: "#000",
          shadowOpacity: 0.3,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 2 },
        }}
      >
        <TouchableOpacity onPress={() => (navigation as any).navigate("Home")}>
          <Ionicons name="home-outline" size={22} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => (navigation as any).navigate("ActiveTrades")}>
          <Ionicons name="swap-horizontal-outline" size={22} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => (navigation as any).navigate("Chats")}>
          <Ionicons name="chatbubbles-outline" size={22} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => (navigation as any).navigate("Settings")}>
          <Ionicons name="person-outline" size={22} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
