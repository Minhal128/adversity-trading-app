import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, NavigationProp, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import userApi from '../../services/userApi';
import chatApi from '../../services/chatApi';

interface Friend {
  _id: string;
  name: string;
  email: string;
  profileImage?: { url: string };
  skills_offered?: string[];
  skills_wanted?: string[];
  rating?: number;
}

export default function FriendsListScreen() {
  const navigation = useNavigation<NavigationProp<any>>();
  const { user, refreshUser } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [chattingWith, setChattingWith] = useState<string | null>(null);
  
  // Track if initial load has been done to prevent re-renders
  const hasLoadedRef = useRef(false);
  const previousFriendsRef = useRef<string | null>(null);

  // Memoize friends data to prevent unnecessary re-renders
  const userFriends = useMemo(() => {
    const userData = user as any;
    return userData?.friends || [];
  }, [user]);

  // Create a stable string representation of friends for comparison
  const friendsKey = useMemo(() => {
    if (!userFriends || userFriends.length === 0) return '';
    return userFriends.map((f: any) => (typeof f === 'string' ? f : f._id)).join(',');
  }, [userFriends]);

  const loadFriends = useCallback(async (forceRefresh = false) => {
    // Skip if already loaded and friends haven't changed (unless force refresh)
    if (!forceRefresh && hasLoadedRef.current && previousFriendsRef.current === friendsKey) {
      return;
    }

    try {
      setLoading(true);

      if (userFriends && Array.isArray(userFriends) && userFriends.length > 0) {
        // If friends are already populated objects
        if (
          typeof userFriends[0] === 'object' &&
          userFriends[0]._id
        ) {
          setFriends(userFriends);
        } else {
          // If friends are just IDs, fetch each friend's details
          const friendDetails = await Promise.all(
            userFriends.map(async (friendId: string | { _id: string }) => {
              try {
                const id = typeof friendId === 'string' ? friendId : friendId._id;
                const response = await userApi.getUserById(id);
                return response.user;
              } catch (error) {
                console.log('Error fetching friend:', error);
                return null;
              }
            })
          );
          setFriends(friendDetails.filter(Boolean));
        }
      } else {
        setFriends([]);
      }
      
      // Mark as loaded and store current friends key
      hasLoadedRef.current = true;
      previousFriendsRef.current = friendsKey;
    } catch (error: any) {
      console.error('Error loading friends:', error);
      Alert.alert('Error', 'Failed to load friends list');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userFriends, friendsKey]);

  // Initial load - only runs once when component mounts or friends actually change
  useEffect(() => {
    if (user) {
      loadFriends();
    }
  }, [friendsKey, user]); // Only re-run if friendsKey changes (actual friends data changed)

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshUser();
    // Reset the loaded flag to force a refresh
    hasLoadedRef.current = false;
    previousFriendsRef.current = null;
    loadFriends(true);
  };

  const handleViewProfile = (friend: Friend) => {
    navigation.navigate('OtherProfile', {
      userId: friend._id,
      userName: friend.name,
      rating: friend.rating || 0,
    });
  };

  const handleProposeBarter = (friend: Friend) => {
    navigation.navigate('ProposeBarter', {
      userId: friend._id,
      userName: friend.name,
    });
  };

  const handleStartChat = async (friend: Friend) => {
    try {
      setChattingWith(friend._id);
      const response = await chatApi.getOrCreateChat({ userId: friend._id });
      navigation.navigate('Chat', {
        chatId: response.chatId,
        userName: friend.name,
        userAvatar: friend.profileImage?.url,
      });
    } catch (error: any) {
      if (error.response?.status === 403) {
        Alert.alert(
          'Messaging Restricted',
          'Direct messaging is only available for users with an active barter agreement. Would you like to propose a barter to this user?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Propose Barter', onPress: () => handleProposeBarter(friend) },
          ]
        );
      }
    } finally {
      setChattingWith(null);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#008C99" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center px-4 pb-4 pt-14">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#008c99" />
        </TouchableOpacity>
        <Text className="ml-3 text-2xl font-semibold text-[#008c99]">My Friends</Text>
        <View className="flex-1" />
        <TouchableOpacity
          onPress={() => navigation.navigate('UserDiscovery')}
          className="flex-row items-center rounded-full bg-[#008c99] px-4 py-2">
          <Ionicons name="person-add" size={16} color="white" />
          <Text className="ml-1 text-sm font-semibold text-white">Add</Text>
        </TouchableOpacity>
      </View>

      {/* Info Banner */}
      {/* <View className="mx-4 mb-4 rounded-xl border border-blue-100 bg-blue-50 p-4">
        <View className="flex-row items-start">
          <Ionicons name="information-circle" size={20} color="#3B82F6" />
          <View className="ml-2 flex-1">
            <Text className="text-sm font-semibold text-blue-800">How to start a barter?</Text>
            <Text className="mt-1 text-xs text-blue-600">
              Tap "Propose Barter" on any friend's card to exchange skills. Once accepted, you can
              chat and start trading!
            </Text>
          </View>
        </View>
      </View> */}

      {/* Friends List */}
      <ScrollView
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {friends.length === 0 ? (
          <View className="items-center justify-center py-20">
            <Ionicons name="people-outline" size={64} color="#ccc" />
            <Text className="mt-4 text-lg font-medium text-gray-500">No friends yet</Text>
            <Text className="mt-2 px-8 text-center text-sm text-gray-400">
              Search for users and send friend requests to start bartering!
            </Text>
            <TouchableOpacity
              className="mt-6 rounded-full bg-[#008c99] px-6 py-3"
              onPress={() => navigation.navigate('UserDiscovery')}>
              <Text className="font-semibold text-white">Find People</Text>
            </TouchableOpacity>
          </View>
        ) : (
          friends.map((friend) => (
            <View
              key={friend._id}
              className="mb-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              {/* Friend Info */}
              <View className="mb-3 flex-row items-center">
                <TouchableOpacity
                  className="flex-1 flex-row items-center"
                  onPress={() => handleViewProfile(friend)}>
                  <Image
                    source={{
                      uri:
                        friend.profileImage?.url ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.name)}&size=100&background=008C99&color=fff`,
                    }}
                    className="mr-3 h-14 w-14 rounded-full"
                  />
                  <View className="flex-1">
                    <Text className="text-lg font-bold text-gray-800">{friend.name}</Text>
                    <Text className="text-sm text-gray-500">{friend.email}</Text>
                    {friend.rating && (
                      <View className="mt-1 flex-row items-center">
                        <Ionicons name="star" size={14} color="#FACC15" />
                        <Text className="ml-1 text-xs text-gray-600">
                          {friend.rating.toFixed(1)}
                        </Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              </View>

              {/* Skills Preview */}
              {friend.skills_offered && friend.skills_offered.length > 0 && (
                <View className="mb-3">
                  <Text className="mb-1 text-xs font-semibold text-gray-600">Offers:</Text>
                  <View className="flex-row flex-wrap gap-1">
                    {friend.skills_offered.slice(0, 3).map((skill, i) => (
                      <Text
                        key={i}
                        className="rounded-full bg-green-100 px-2 py-1 text-xs text-green-700">
                        {skill}
                      </Text>
                    ))}
                    {friend.skills_offered.length > 3 && (
                      <Text className="px-1 py-1 text-xs text-gray-400">
                        +{friend.skills_offered.length - 3} more
                      </Text>
                    )}
                  </View>
                </View>
              )}

              {/* Action Buttons */}
              <View className="mt-2 flex-row gap-2">
                <TouchableOpacity
                  className="flex-1 flex-row items-center justify-center rounded-full bg-[#008c99] py-2.5"
                  onPress={() => handleProposeBarter(friend)}>
                  <Ionicons name="swap-horizontal" size={16} color="white" />
                  <Text className="ml-1 text-sm font-semibold text-white">Propose Barter</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="flex-1 flex-row items-center justify-center rounded-full bg-orange-500 py-2.5"
                  onPress={() => handleStartChat(friend)}
                  disabled={chattingWith === friend._id}>
                  {chattingWith === friend._id ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <>
                      <Ionicons name="chatbubble" size={16} color="white" />
                      <Text className="ml-1 text-sm font-semibold text-white">Message</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Bottom Tab Bar */}
      <View
        style={{
          position: 'absolute',
          bottom: 40,
          left: 16,
          right: 16,
          backgroundColor: '#008C99',
          borderRadius: 50,
          flexDirection: 'row',
          justifyContent: 'space-around',
          paddingVertical: 12,
          elevation: 6,
          shadowColor: '#000',
          shadowOpacity: 0.3,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 2 },
        }}>
        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
          <Ionicons name="home-outline" size={22} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('ActiveTrades')}>
          <Ionicons name="swap-horizontal-outline" size={22} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Chats')}>
          <Ionicons name="chatbubbles-outline" size={22} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
          <Ionicons name="person-outline" size={22} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
