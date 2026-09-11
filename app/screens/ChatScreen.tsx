import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, NavigationProp } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import chatApi from "../../services/chatApi";
import { useAuth } from "../../context/AuthContext";
import socketService from "../../services/socketService";

export default function ChatsScreen() {
  const navigation = useNavigation<NavigationProp<any>>();
  const { user } = useAuth();
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const isNavigatingRef = useRef(false);
  const insets = useSafeAreaInsets();

  // Debounced navigation to prevent multiple rapid taps
  const handleChatPress = useCallback((chat: any, otherUser: any) => {
    if (isNavigatingRef.current) return;
    
    isNavigatingRef.current = true;
    navigation.navigate("Chat", {
      chatId: chat._id,
      userName: otherUser?.name,
      userAvatar: otherUser?.profileImage?.url,
    });
    
    // Reset navigation lock after a delay
    setTimeout(() => {
      isNavigatingRef.current = false;
    }, 1000);
  }, [navigation]);

  useEffect(() => {
    loadChats();
    setupSocketListeners();

    return () => {
      socketService.disconnect();
    };
  }, []);

  const setupSocketListeners = () => {
    socketService.connect();
    socketService.onNewMessage((message) => {
      loadChats();
    });
  };

  const loadChats = async () => {
    try {
      setLoading(true);
      const response = await chatApi.getChats();
      console.log('📋 Chats response:', response);
      
      if (response && response.chats) {
        console.log('✅ Found chats:', response.chats.length);
        setChats(response.chats);
      } else if (response && Array.isArray(response)) {
        console.log('✅ Found chats (array):', response.length);
        setChats(response);
      } else if (response && typeof response === 'object') {
        console.log('⚠️ Response is object but no chats property');
        setChats([]);
      } else {
        console.log('⚠️ Unexpected response format');
        setChats([]);
      }
    } catch (error: any) {
      console.error('❌ Load chats error:', error);
      // Check if it's the ObjectId casting error - this means no chats exist
      if (error.message && error.message.includes('Cast to ObjectId')) {
        console.log('No chats available - backend route issue');
        setChats([]);
      } else {
        console.error('Unexpected error loading chats:', error);
        setChats([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadChats();
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const filteredChats = chats.filter((chat: any) => {
    const otherUser = chat.otherUser || chat.participants?.find((p: any) => p._id !== user?.id);
    return otherUser?.name?.toLowerCase().includes(search.toLowerCase());
  });

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#008C99" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <StatusBar backgroundColor="#C7F3F5" barStyle="dark-content" />

      {/* Gradient Header with Curved Bottom */}
      <LinearGradient
        colors={["#C7F3F5", "#ffffff"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        className="pb-6"
        style={{ paddingTop: Platform.OS === 'ios' ? insets.top : insets.top + 10 }}
      >
        {/* Header Content */}
        <View className="flex-row items-center px-4 pt-4 pb-4">
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <Text className="text-xl font-bold ml-4">Chats</Text>
        </View>

        {/* Curved Bottom for Header */}
        <View className="bg-white h-6 rounded-t-[30px] -mb-6" />
      </LinearGradient>

      {/* Search Bar */}
      <View className="px-4 pb-2">
        <View className="flex-row items-center bg-white rounded-full px-4 py-2">
          <Ionicons name="search" size={20} color="gray" />
          <TextInput
            className="flex-1 ml-2 text-gray-800"
            placeholder="Search chats..."
            placeholderTextColor="gray"
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* Chat List */}
      <ScrollView
        className="flex-1 px-4 mt-2"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredChats.length === 0 ? (
          <View className="items-center justify-center py-20">
            <Ionicons name="chatbubbles-outline" size={64} color="#ccc" />
            <Text className="text-gray-500 mt-4">No chats yet</Text>
          </View>
        ) : (
          filteredChats.map((chat: any) => {
            const otherUser = chat.otherUser || chat.participants?.find((p: any) => p._id !== user?.id);
            const lastMsg = chat.lastMessage;
            const unreadCount = chat.unreadCount || 0;

            console.log('💬 Rendering chat with:', otherUser?.name, '| Current user:', user?.name);

            return (
              <TouchableOpacity
                key={chat._id}
                activeOpacity={0.7}
                delayPressIn={0}
                onPress={() => handleChatPress(chat, otherUser)}
                className="flex-row items-center justify-between bg-white rounded-2xl shadow-sm p-4 mb-3 border border-gray-100"
              >
                {/* Left: Avatar + Info */}
                <View className="flex-row items-center flex-1">
                  <Image
                    source={{
                      uri: otherUser?.profileImage?.url || "https://randomuser.me/api/portraits/lego/1.jpg",
                    }}
                    className="w-14 h-14 rounded-full mr-4"
                  />
                  <View className="flex-1">
                    <Text className="font-bold text-gray-900 text-base">
                      {otherUser?.name || "User"}
                    </Text>
                    <Text className="text-gray-500 text-sm mt-1" numberOfLines={1}>
                      {lastMsg?.content || "No messages yet"}
                    </Text>
                  </View>
                </View>

                {/* Right: Time + Unread Badge */}
                <View className="items-end">
                  <Text className="text-gray-400 text-xs mb-2">
                    {lastMsg ? formatTime(lastMsg.createdAt) : ""}
                  </Text>
                  {unreadCount > 0 && (
                    <View className="bg-red-500 rounded-full min-w-[20px] h-5 items-center justify-center">
                      <Text className="text-white text-xs font-bold px-1">
                        {unreadCount}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Bottom Navigation Bar */}
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
            <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate("Home")}>
              <Ionicons name="home-outline" size={22} color="white" />
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate("ActiveTrades")}>
              <Ionicons name="swap-horizontal-outline" size={22} color="white" />
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate("Chats")}>
              <Ionicons name="chatbubbles" size={22} color="white" />
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate("Settings")}>
              <Ionicons name="person-outline" size={22} color="white" />
            </TouchableOpacity>
          </View>
    </View>
  );
}
