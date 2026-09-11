import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  StatusBar,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, Search } from 'lucide-react-native';
import { useNavigation, NavigationProp, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import barterApi from '../../services/barterApi';
import chatApi from '../../services/chatApi';

interface Trade {
  _id: string;
  offered_skill?: string;
  wanted_skill?: string;
  otherUser?: {
    _id: string;
    name?: string;
    profileImage?: { url?: string };
    rating?: number;
  };
}

const HomeScreen = () => {
  const [activeTab, setActiveTab] = useState('Ongoing');
  const navigation = useNavigation<NavigationProp<any>>();
  const { user, refreshUser } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(false);
  const [chattingWith, setChattingWith] = useState<string | null>(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const insets = useSafeAreaInsets();

  const loadTrades = useCallback(async () => {
    try {
      setLoading(true);
      const statusMap: { [key: string]: string } = {
        Ongoing: 'ongoing',
        Completed: 'completed',
        Pending: 'pending',
      };
      const response = await barterApi.getActiveTrades(statusMap[activeTab]);
      const tradesData = response.trades || [];
      console.log('📊 Trades loaded:', tradesData);
      console.log('📊 First trade structure:', tradesData[0]);
      setTrades(tradesData);
    } catch (error: any) {
      console.log('Error loading trades:', error.message);
      setTrades([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  const loadNotificationCount = useCallback(async () => {
    try {
      const [friendRequestsResponse, pendingBartersResponse] = await Promise.all([
        barterApi.getPendingFriendRequests(),
        barterApi.getPendingBarters(),
      ]);

      const friendRequestsCount = friendRequestsResponse.requests?.length || 0;
      const pendingBartersCount = pendingBartersResponse.barters?.length || 0;
      const totalCount = friendRequestsCount + pendingBartersCount;

      setNotificationCount(totalCount);
    } catch (error: any) {
      console.log('Error loading notification count:', error.message);
      setNotificationCount(0);
    }
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshUser();
      await loadTrades();
      await loadNotificationCount();
    } catch {
      Alert.alert('Error', 'Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  };

  const handleOpenChat = async (trade: Trade) => {
    try {
      console.log('🔍 Opening chat for trade:', trade);
      console.log('🔍 Trade otherUser:', trade.otherUser);

      if (!trade.otherUser?._id) {
        Alert.alert('Error', 'User information not available');
        return;
      }

      setChattingWith(trade.otherUser._id);
      console.log('📞 Calling getOrCreateChat with userId:', trade.otherUser._id);
      const response = await chatApi.getOrCreateChat({ userId: trade.otherUser._id });
      console.log('✅ Chat response:', response);

      navigation.navigate('Chat', {
        chatId: response.chatId,
        userName: trade.otherUser.name,
        userAvatar: trade.otherUser.profileImage?.url,
      });
    } catch (error: any) {
      console.error('❌ Chat error:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to open chat');
    } finally {
      setChattingWith(null);
    }
  };

  // Load trades when activeTab changes
  useEffect(() => {
    loadTrades();
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  // Initial load - runs once on mount only
  useEffect(() => {
    refreshUser();
    loadNotificationCount();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Refresh user data when screen comes into focus (e.g., after purchase)
  useFocusEffect(
    useCallback(() => {
      refreshUser();
    }, [])
  );

  return (
    <View className="flex-1 bg-white">
      <StatusBar backgroundColor="#FACC15" barStyle="dark-content" />

      {/* Header */}
      <View className="relative overflow-hidden rounded-b-[30px] bg-[#FACC15] pb-8" style={{ paddingTop: Platform.OS === 'ios' ? insets.top : insets.top + 10 }}>
        <Image
          source={require('../../assets/pattern.jpg')}
          className="absolute h-full w-full opacity-20"
          resizeMode="cover"
        />

        {/* App Header - Instagram Style */}
        <View className="px-6 pt-2 pb-4 flex-row items-center">
          <Image
            source={require('../../assets/logo1.png')}
            className="h-8 w-8 mr-2"
            resizeMode="contain"
          />
          <Text className="text-xl font-bold text-gray-800">Adversity Trading</Text>
        </View>

        {/* User Info */}
        <View className="flex-row items-start justify-between px-6 pb-6">
          <TouchableOpacity
            className="flex-1 flex-row items-center"
            onPress={() => navigation.navigate('Profile')}>
            <View className="border-3 h-14 w-14 items-center justify-center rounded-full border-white bg-white/30">
              <Image
                source={{
                  uri:
                    user?.profileImage?.url ||
                    'https://images.unsplash.com/photo-1502767089025-6572583495b0?w=100&h=100&fit=crop',
                }}
                className="h-12 w-12 rounded-full"
              />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-base font-bold text-gray-800">{user?.name || 'User'}</Text>
              <Text className="text-xs text-gray-700">{user?.email || ''}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            className="relative rounded-full p-2"
            onPress={() => navigation.navigate('Notification')}>
            <Bell size={20} color="#000" />
            {notificationCount > 0 && (
              <View className="absolute -right-1 -top-1 h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500">
                <Text className="text-xs font-bold text-white">
                  {notificationCount > 99 ? '99+' : notificationCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Credit Card */}
        <View className="mx-6 flex-row items-center justify-between rounded-3xl border-0 bg-[#FACC15] p-5 shadow-lg">
          <View>
            <Text className="mb-2 text-xs font-semibold text-gray-700">Available Credits</Text>
            <Text className="text-3xl font-bold text-gray-800">{user?.credits || 0}</Text>
          </View>

          <TouchableOpacity
            className="rounded-full bg-[#008c99] px-5 py-3"
            onPress={() => navigation.navigate('Subscription')}>
            <Text className="text-sm font-bold text-white">Manage Subscription</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        className="px-6 pt-4"
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {/* Search Bar - Navigate to User Discovery */}
        <TouchableOpacity
          onPress={() => navigation.navigate('UserDiscovery' as any)}
          className="mb-4 flex-row items-center rounded-full bg-gray-100 px-4 py-3">
          <Text className="ml-2 flex-1 text-sm text-gray-500">Find skills, goods, people</Text>
          <Search size={18} color="gray" />
        </TouchableOpacity>

        {/* Quick Actions */}
        <View className="mb-6 flex-row gap-3">
          <TouchableOpacity
            className="flex-1 flex-row items-center justify-center rounded-xl bg-[#008c99] px-4 py-3"
            onPress={() => navigation.navigate('FriendsList' as any)}>
            <Ionicons name="people" size={18} color="white" />
            <Text className="ml-2 text-sm font-semibold text-white">My Friends</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 flex-row items-center justify-center rounded-xl bg-orange-500 px-4 py-3"
            onPress={() => navigation.navigate('Notification' as any)}>
            <Ionicons name="notifications" size={18} color="white" />
            <Text className="ml-2 text-sm font-semibold text-white">Requests</Text>
          </TouchableOpacity>
        </View>

        {/* Active Trades Header */}
        <Text className="mb-4 text-lg font-bold text-gray-800">Active Trades</Text>

        {/* Tabs */}
        <View className="mb-5 flex-row overflow-hidden rounded-full bg-gray-100">
          {['Ongoing', 'Completed', 'Pending'].map((tab) => (
            <TouchableOpacity
              key={tab}
              activeOpacity={1}
              onPress={() => setActiveTab(tab)}
              style={{
                flex: 1,
                paddingVertical: 8,
                backgroundColor: activeTab === tab ? '#008c99' : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 9999,
              }}>
              <Text
                style={{
                  color: activeTab === tab ? '#fff' : '#374151',
                  fontWeight: '600',
                }}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Trades List */}
        {loading ? (
          <View className="items-center justify-center py-12">
            <ActivityIndicator size="large" color="#008c99" />
          </View>
        ) : trades.length === 0 ? (
          <View className="items-center justify-center rounded-2xl bg-gray-50 py-8">
            <Ionicons name="swap-horizontal-outline" size={48} color="#ccc" />
            <Text className="mt-4 text-center font-medium text-gray-600">No active trades yet</Text>
            <Text className="mt-2 px-6 text-center text-sm text-gray-400">
              Start by finding users, adding them as friends, and proposing a barter!
            </Text>
            <View className="mt-4 flex-row gap-3">
              <TouchableOpacity
                className="rounded-full bg-[#008c99] px-4 py-2"
                onPress={() => navigation.navigate('UserDiscovery' as any)}>
                <Text className="text-sm font-semibold text-white">Find Users</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="rounded-full bg-orange-500 px-4 py-2"
                onPress={() => navigation.navigate('FriendsList' as any)}>
                <Text className="text-sm font-semibold text-white">View Friends</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          trades.map((trade) => (
            <View
              key={trade._id}
              className="mb-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              {/* User Info and Buttons Row */}
              <View className="mb-3 flex-row items-start justify-between">
                <TouchableOpacity
                  className="flex-1 flex-row items-center"
                  onPress={() =>
                    navigation.navigate('OtherProfile', {
                      userId: trade.otherUser?._id,
                      userName: trade.otherUser?.name,
                      rating: trade.otherUser?.rating,
                    })
                  }>
                  <Image
                    source={{
                      uri:
                        trade.otherUser?.profileImage?.url ||
                        'https://randomuser.me/api/portraits/lego/1.jpg',
                    }}
                    className="mr-3 h-12 w-12 rounded-full"
                  />
                  <View className="flex-1">
                    <Text className="text-base font-bold text-gray-800">
                      {trade.otherUser?.name || 'User'}
                    </Text>
                    <View className="flex-row items-center">
                      <Text className="mr-1 text-yellow-500">★</Text>
                      <Text className="text-sm text-gray-600">
                        {trade.otherUser?.rating?.toFixed(1) || 'N/A'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>

                <View className="ml-2 flex-row gap-2">
                  <TouchableOpacity
                    className="rounded-lg bg-orange-500 px-3 py-1"
                    onPress={() => handleOpenChat(trade)}
                    disabled={chattingWith === trade.otherUser?._id}>
                    {chattingWith === trade.otherUser?._id ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text className="text-xs font-semibold text-white">Chat</Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="rounded-lg bg-gray-300 px-3 py-1"
                    onPress={() => navigation.navigate('Trades', { tradeId: trade._id })}>
                    <Text className="text-xs font-semibold text-gray-800">Details</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Skills Info */}
              <View className="rounded-lg bg-gray-50 p-3">
                <Text className="mb-1 text-xs font-semibold text-gray-700">
                  You Offer: <Text className="font-normal">{trade.offered_skill || 'N/A'}</Text>
                </Text>
                <Text className="text-xs font-semibold text-gray-700">
                  You Receive: <Text className="font-normal">{trade.wanted_skill || 'N/A'}</Text>
                </Text>
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
        <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('Home')}>
          <Ionicons name="home" size={22} color="white" />
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('ActiveTrades')}>
          <Ionicons name="swap-horizontal-outline" size={22} color="white" />
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('Chats')}>
          <Ionicons name="chatbubbles-outline" size={22} color="white" />
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('Settings')}>
          <Ionicons name="person-outline" size={22} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default HomeScreen;
