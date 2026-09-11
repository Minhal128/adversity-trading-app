import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  FlatList,
  StatusBar,
  Platform,
  ActivityIndicator,
  Alert,
  Modal,
  Linking,
  Keyboard,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import chatApi from '../../services/chatApi';
import safeTradeSpotApi, { SafeTradeSpot } from '../../services/safeTradeSpotApi';
import { useAuth } from '../../context/AuthContext';
import { useStreamVideo, useStreamVideoContext } from '../../context/StreamVideoContext';
import socketService from '../../services/socketService';
import SafeTradeSpotInviteModal from '../../components/safeTradeSpot/SafeTradeSpotInviteModal';
import SafeTradeSpotInviteCard from '../../components/safeTradeSpot/SafeTradeSpotInviteCard';
import SafeTradeSpotLockedBanner from '../../components/safeTradeSpot/SafeTradeSpotLockedBanner';
import ShareLocationModal from '../../components/safeTradeSpot/ShareLocationModal';

// Conditional import for CallType
let CallType: any = null;
if (Platform.OS !== 'web') {
  try {
    const streamVideo = require('@stream-io/video-react-native-sdk');
    CallType = streamVideo.CallType;
  } catch (error) {
    console.warn('Stream Video SDK not available');
  }
}

type ChatRouteParams = {
  chatId: string;
  userName?: string;
  userAvatar?: string;
  userId?: string;
  otherUserId?: string;
};

export default function Chat() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { chatId, userName, userAvatar } = (route.params as ChatRouteParams) || {};
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const videoClient = useStreamVideo();
  const { isInitialized: streamInitialized, isConnecting: streamConnecting, initializeClient } = useStreamVideoContext();
  const flatListRef = useRef(null);



  console.log('👤 Current user:', user?.name, user?.id);
  console.log('👤 Chat with:', userName);
  console.log('📸 Avatar:', userAvatar);
  console.log('🎥 Stream client:', videoClient ? 'Available' : 'Not available');
  console.log('🔄 Stream initialized:', streamInitialized, 'Connecting:', streamConnecting);

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCall, setActiveCall] = useState(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [activeSpot, setActiveSpot] = useState<SafeTradeSpot | null>(null);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [counterModalOpen, setCounterModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [stsBusy, setStsBusy] = useState(false);
  const [counterTargetId, setCounterTargetId] = useState<string | null>(null);

  // Keyboard listener
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const keyboardShowListener = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });

    const keyboardHideListener = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      keyboardShowListener.remove();
      keyboardHideListener.remove();
    };
  }, []);

  // How much of the keyboard we have to get out of the way of ourselves.
  // Android <= 14 honours windowSoftInputMode="adjustResize" and shrinks the window
  // for us; Android 15 edge-to-edge and iOS do not. Padding by the difference covers
  // every case without sniffing the OS version — padding the full keyboard height on
  // a window that already shrank is what pushed the input bar off screen.
  // ponytail: baseline is the window height while the keyboard is closed
  const { height: windowHeight } = useWindowDimensions();
  const unshrunkHeightRef = useRef(windowHeight);

  useEffect(() => {
    if (keyboardHeight === 0) {
      unshrunkHeightRef.current = windowHeight;
    }
  }, [keyboardHeight, windowHeight]);

  const shrunkBy = Math.max(0, unshrunkHeightRef.current - windowHeight);
  const keyboardPad = keyboardHeight > 0 ? Math.max(0, keyboardHeight - shrunkBy) : 0;

  useEffect(() => {
    if (chatId) {
      loadMessages();
      loadActiveSpot();
      setupSocketListeners();
      setupCallListeners();
      socketService.joinChat(chatId);
    }

    return () => {
      if (chatId) {
        socketService.leaveChat(chatId);
        socketService.offNewMessage();
        socketService.offSafeTradeSpotUpdated();
        cleanupCallListeners();
      }
    };
  }, [chatId]);

  const loadActiveSpot = async () => {
    try {
      const res = await safeTradeSpotApi.getActive(chatId);
      setActiveSpot(res.safeTradeSpot || null);
    } catch (e) {
      console.warn('Failed to load Safe Trade Spot', e);
    }
  };

  const setupSocketListeners = () => {
    console.log('🔌 Setting up socket listeners for chatId:', chatId);

    // Remove any existing listeners first
    socketService.offNewMessage();
    socketService.offSafeTradeSpotUpdated();

    socketService.onNewMessage((message) => {
      console.log('📩 Received newMessage event:', message);

      // Check if message belongs to this chat
      if (message.chatId === chatId || message.chatId?.toString() === chatId?.toString()) {
        console.log('✅ Message belongs to this chat, adding to messages');
        setMessages((prev) => {
          // Avoid duplicates by checking if message already exists
          const exists = prev.some((m) => m._id === message._id);
          if (exists) {
            console.log('⚠️ Message already exists, skipping');
            return prev;
          }
          console.log('➕ Adding message to state');
          return [...prev, message];
        });
        if (
          message.type === 'safe_trade_spot_invite' ||
          message.type === 'safe_trade_spot_update'
        ) {
          if (message.payload) {
            setActiveSpot((prev) => ({
              ...(prev || {}),
              _id: message.payload.safeTradeSpotId,
              status: message.payload.status,
              location: message.payload.location,
              scheduledDate: message.payload.scheduledDate,
              scheduledDay: message.payload.scheduledDay,
              scheduledTime: message.payload.scheduledTime,
              scheduledAt: message.payload.scheduledAt,
              lockedAt: message.payload.lockedAt,
              initiatorUserId: message.payload.initiatorUserId,
              recipientUserId: message.payload.recipientUserId,
              chatThreadId: chatId,
            }));
          } else {
            loadActiveSpot();
          }
        }
        setTimeout(scrollToBottom, 100);
      } else {
        console.log('❌ Message does not belong to this chat');
      }
    });

    socketService.onSafeTradeSpotUpdated((data) => {
      if (data?.chatId?.toString() === chatId?.toString() && data.safeTradeSpot) {
        setActiveSpot(data.safeTradeSpot);
      }
    });
  };

  const setupCallListeners = () => {
    console.log('📞 Setting up call listeners');

    socketService.onCallInitiated((data) => {
      console.log('📞 Incoming call:', data);
      if (data.chatId === chatId) {
        setIncomingCall(data);
      }
    });

    socketService.onCallAccepted((data) => {
      console.log('✅ Call accepted:', data);
      if (data.chatId === chatId) {
        handleJoinCall(data);
      }
    });

    socketService.onCallRejected((data) => {
      console.log('❌ Call rejected:', data);
      if (data.chatId === chatId) {
        setActiveCall(null);
        setIncomingCall(null);
        Alert.alert('Call Ended', 'The call was declined');
      }
    });

    socketService.onCallEnded((data) => {
      console.log('📞 Call ended:', data);
      if (data.chatId === chatId) {
        setActiveCall(null);
        setIncomingCall(null);
      }
    });
  };

  const cleanupCallListeners = () => {
    socketService.offCallInitiated();
    socketService.offCallAccepted();
    socketService.offCallRejected();
    socketService.offCallEnded();
  };

  const handleVoiceCall = async () => {
    console.log('📞 Initiating voice call');

    if (!videoClient) {
      // Try to initialize if not done
      if (!streamConnecting) {
        await initializeClient();
      }

      if (!videoClient) {
        Alert.alert(
          'Video Calls Not Available',
          'Voice and video calls require a development build. This feature is not available in Expo Go.\n\nPlease build the app using EAS Build for full functionality.'
        );
        return;
      }
    }

    try {
      // Create unique call ID
      const callId = `call-${chatId}-${Date.now()}`;

      // Create call using Stream Video
      const call = videoClient.call('default', callId);

      // Create the call with members
      await call.getOrCreate({
        ring: true, // This will ring for the other user
        data: {
          members: [
            { user_id: user.id },
            { user_id: route.params?.userId || route.params?.otherUserId },
          ],
          custom: {
            chatId,
            callerName: user.name,
            receiverName: userName,
          },
        },
      });

      // Navigate to call screen
      navigation.navigate('CallScreen', {
        call,
        isVideoCall: false,
        otherUserName: userName,
        otherUserAvatar: userAvatar,
      });

      // Notify via Socket.io for backend tracking
      socketService.initiateCall({
        chatId,
        callerId: user.id,
        callerName: user.name,
        receiverId: route.params?.userId || route.params?.otherUserId,
        receiverName: userName,
        callType: 'audio',
        streamCallId: callId,
      } as any);
    } catch (error) {
      console.error('❌ Voice call error:', error);
      Alert.alert('Error', 'Failed to initiate voice call. Please try again.');
    }
  };

  const handleVideoCall = async () => {
    console.log('📹 Initiating video call');

    if (!videoClient) {
      // Try to initialize if not done
      if (!streamConnecting) {
        await initializeClient();
      }

      if (!videoClient) {
        Alert.alert(
          'Video Calls Not Available',
          'Voice and video calls require a development build. This feature is not available in Expo Go.\n\nPlease build the app using EAS Build for full functionality.'
        );
        return;
      }
    }

    try {
      // Create unique call ID
      const callId = `call-${chatId}-${Date.now()}`;

      // Create call using Stream Video
      const call = videoClient.call('default', callId);

      // Create the call with members
      await call.getOrCreate({
        ring: true, // This will ring for the other user
        data: {
          members: [
            { user_id: user.id },
            { user_id: route.params?.userId || route.params?.otherUserId },
          ],
          custom: {
            chatId,
            callerName: user.name,
            receiverName: userName,
          },
        },
      });

      // Navigate to call screen
      navigation.navigate('CallScreen', {
        call,
        isVideoCall: true,
        otherUserName: userName,
        otherUserAvatar: userAvatar,
      });

      // Notify via Socket.io for backend tracking
      socketService.initiateCall({
        chatId,
        callerId: user.id,
        callerName: user.name,
        receiverId: route.params?.userId || route.params?.otherUserId,
        receiverName: userName,
        callType: 'video',
        streamCallId: callId,
      } as any);
    } catch (error) {
      console.error('❌ Video call error:', error);
      Alert.alert('Error', 'Failed to initiate video call. Please try again.');
    }
  };

  const handleAcceptCall = async () => {
    console.log('✅ Accepting call');

    if (!incomingCall || !videoClient) return;

    try {
      // Join the existing call
      const call = videoClient.call('default', incomingCall.streamCallId);
      await call.join();

      // Navigate to call screen
      navigation.navigate('CallScreen', {
        call,
        isVideoCall: incomingCall.callType === 'video',
        otherUserName: incomingCall.callerName,
        otherUserAvatar: null, // You can pass this if available
      });

      // Notify via Socket.io
      socketService.acceptCall({
        chatId,
        callerId: incomingCall.callerId,
        receiverId: user.id,
      });

      setIncomingCall(null);
    } catch (error) {
      console.error('❌ Accept call error:', error);
      Alert.alert('Error', 'Failed to join call. Please try again.');
    }
  };

  const handleRejectCall = () => {
    console.log('❌ Rejecting call');
    if (incomingCall) {
      socketService.rejectCall({
        chatId,
        callerId: incomingCall.callerId,
        receiverId: user?.id,
      });
      setIncomingCall(null);
    }
  };

  const handleEndCall = () => {
    console.log('📞 Ending call');
    if (activeCall) {
      socketService.endCall({ chatId });
      setActiveCall(null);
    }
  };

  const handleJoinCall = (callData) => {
    // This is now handled by handleAcceptCall
    console.log('🔗 handleJoinCall - now using Stream Video');
  };

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await chatApi.getMessages(chatId);

      // Backend returns messages in response.messages or response.chat.messages
      const messagesArray = response.messages || response.chat?.messages || [];

      // Remove duplicates by creating a Map with _id as key
      const uniqueMessages = Array.from(
        new Map(messagesArray.map((msg: any) => [msg._id, msg])).values()
      );

      console.log(
        '📨 Loaded messages:',
        uniqueMessages.length,
        'unique from',
        messagesArray.length,
        'total'
      );
      setMessages(uniqueMessages);

      await chatApi.markMessagesSeen(chatId);

      setTimeout(scrollToBottom, 100);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    flatListRef.current?.scrollToEnd({ animated: true });
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    try {
      setSending(true);
      const messageText = inputText;
      setInputText('');

      await chatApi.sendMessage({
        chatId,
        message: messageText,
      });

      scrollToBottom();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleSendMedia = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please allow access to your photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const media = result.assets[0];

        setSending(true);
        await chatApi.sendMedia({
          chatId,
          file: {
            uri: media.uri,
            type: media.mimeType || 'image/jpeg',
            name: media.fileName || `image_${Date.now()}.jpg`,
          },
        });
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send image');
    } finally {
      setSending(false);
    }
  };

  const handleCreateSafeTradeSpot = async (data: {
    location: any;
    scheduledDate: string;
    scheduledTime: string;
  }) => {
    const res = await safeTradeSpotApi.create(chatId, data);
    if (res.message) {
      setMessages((prev) => {
        if (prev.some((m: any) => m._id === res.message._id)) return prev;
        return [...prev, res.message];
      });
    }
    setActiveSpot(res.safeTradeSpot);
    setTimeout(scrollToBottom, 100);
  };

  const handleAcceptSpot = async (spotId: string) => {
    try {
      setStsBusy(true);
      const res = await safeTradeSpotApi.respond(spotId, { action: 'accept' });
      setActiveSpot(res.safeTradeSpot);
      if (res.message) {
        setMessages((prev) => {
          if (prev.some((m: any) => m._id === res.message._id)) return prev;
          return [...prev, res.message];
        });
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to accept');
    } finally {
      setStsBusy(false);
    }
  };

  const handleCounterSubmit = async (data: {
    location: any;
    scheduledDate: string;
    scheduledTime: string;
  }) => {
    if (!counterTargetId) return;
    const res = await safeTradeSpotApi.respond(counterTargetId, {
      action: 'counter_propose',
      ...data,
    });
    setActiveSpot(res.safeTradeSpot);
    if (res.message) {
      setMessages((prev) => {
        if (prev.some((m: any) => m._id === res.message._id)) return prev;
        return [...prev, res.message];
      });
    }
    setCounterTargetId(null);
  };

  const handleCancelSpot = () => {
    if (!activeSpot?._id) return;
    Alert.alert('Cancel meetup?', 'This cancels the Safe Trade Spot for both of you.', [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Cancel meetup',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await safeTradeSpotApi.cancel(activeSpot._id);
            setActiveSpot(res.safeTradeSpot);
            if (res.message) {
              setMessages((prev) => {
                if (prev.some((m: any) => m._id === res.message._id)) return prev;
                return [...prev, res.message];
              });
            }
          } catch (e: any) {
            Alert.alert('Error', e.message || 'Failed to cancel');
          }
        },
      },
    ]);
  };

  // A Safe Trade Spot card renders the payload frozen into its message, so once the
  // spot moves on (accepted, locked, cancelled) every earlier card is stale — and a
  // stale "pending" one keeps offering Accept / Propose new on a settled meetup.
  // Keep only the newest message per spot, and prefer activeSpot's status, which the
  // socket can update without a new message arriving.
  const newestSpotMessageId = useMemo(() => {
    const map: Record<string, string> = {};
    for (const m of messages) {
      const spotId = m?.payload?.safeTradeSpotId;
      if (spotId) map[spotId] = m._id;
    }
    return map;
  }, [messages]);

  const renderMessage = (msg: any) => {
    // Handle both populated sender object {_id: "..."} and direct string ID
    const senderId = typeof msg.sender === 'object' ? msg.sender?._id : msg.sender;
    const isMe = senderId === user?.id || senderId?.toString() === user?.id?.toString();
    // Guard against missing/invalid dates which can crash rendering in some builds
    let time = '';
    try {
      if (msg?.createdAt) {
        const d = new Date(msg.createdAt);
        if (!isNaN(d.getTime())) {
          time = d.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          });
        }
      }
    } catch (e) {
      console.warn('Failed to format message time', e);
      time = '';
    }

    if (
      (msg.type === 'safe_trade_spot_invite' || msg.type === 'safe_trade_spot_update') &&
      msg.payload
    ) {
      const spotId = msg.payload.safeTradeSpotId;

      // Superseded by a later card for the same spot
      if (newestSpotMessageId[spotId] !== msg._id) {
        return null;
      }

      const status =
        activeSpot?._id === spotId && activeSpot.status ? activeSpot.status : msg.payload.status;

      return (
        <View key={msg._id}>
          <SafeTradeSpotInviteCard
            payload={status === msg.payload.status ? msg.payload : { ...msg.payload, status }}
            currentUserId={user?.id}
            busy={stsBusy}
            onAccept={() => handleAcceptSpot(msg.payload.safeTradeSpotId)}
            onCounter={() => {
              setCounterTargetId(msg.payload.safeTradeSpotId);
              setCounterModalOpen(true);
            }}
          />
          <Text className="mb-2 self-center text-xs text-gray-500">{time}</Text>
        </View>
      );
    }

    return (
      <View key={msg._id} className={`mb-3 flex-row ${isMe ? 'justify-end' : 'justify-start'}`}>
        <View
          className={`max-w-[70%] rounded-2xl px-4 py-2 ${isMe ? 'bg-[#008C99]' : 'bg-gray-200'}`}>
          {msg.mediaUrl && (
            <Image
              source={{ uri: msg.mediaUrl }}
              className="mb-2 h-48 w-48 rounded-lg"
              resizeMode="cover"
            />
          )}
          {msg.content && (
            <Text className={`text-base ${isMe ? 'text-white' : 'text-gray-800'}`}>
              {msg.content}
            </Text>
          )}
          <Text className={`mt-1 text-xs ${isMe ? 'text-gray-200' : 'text-gray-500'}`}>{time}</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#008C99" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white" style={{ paddingBottom: keyboardPad }}>
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />

      {/* Header */}
      <View
        className="flex-row items-center justify-between border-b border-gray-200 bg-white px-4 pb-4"
        style={{ paddingTop: insets.top + 10 }}>
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <Image
            source={{ uri: userAvatar || 'https://randomuser.me/api/portraits/lego/1.jpg' }}
            className="ml-3 h-10 w-10 rounded-full"
          />
          <View className="ml-2">
            <Text className="text-lg font-bold text-gray-900">{userName || 'User'}</Text>
            <Text className="text-xs text-gray-600">Active now</Text>
          </View>
        </View>
        <View className="flex-row space-x-4 gap-4">
          <TouchableOpacity onPress={handleVoiceCall} disabled={!!activeCall}>
            <Ionicons
              name="call-outline"
              size={22}
              color={activeCall ? "#ccc" : "#008C99"}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleVideoCall} disabled={!!activeCall}>
            <Ionicons
              name="videocam-outline"
              size={22}
              color={activeCall ? "#ccc" : "#008C99"}
            />
          </TouchableOpacity>
        </View>
      </View>

      {activeSpot && (activeSpot.status === 'locked' || activeSpot.status === 'cancelled') && (
        <SafeTradeSpotLockedBanner
          spot={activeSpot}
          onShare={() => setShareModalOpen(true)}
          onCancel={handleCancelSpot}
        />
      )}

      {/* Chat Messages Area */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item._id ?? item.id ?? String(item?.createdAt) ?? Math.random().toString()}
        renderItem={({ item }) => renderMessage(item)}
        className="flex-1 bg-[#C7F3F5] px-4"
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 10, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListHeaderComponent={
          <View className="mb-6 self-center rounded-full bg-gray-200 px-4 py-1">
            <Text className="text-xs font-medium text-gray-600">Today</Text>
          </View>
        }
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-20">
            <Ionicons name="chatbubble-outline" size={64} color="#ccc" />
            <Text className="mt-4 text-gray-500">No messages yet</Text>
            <Text className="text-sm text-gray-400">Send a message to start the conversation</Text>
          </View>
        }
      />

      {/* Input Bar */}
      <View
        className="border-t border-gray-200 bg-white px-4 py-2"
        style={{ paddingBottom: keyboardHeight > 0 ? 8 : Math.max(insets.bottom, 8) }}>
        <View className="flex-row items-center rounded-full bg-gray-100 px-4 py-2">
          <TouchableOpacity onPress={handleSendMedia} disabled={sending}>
            <Ionicons name="camera-outline" size={22} color="#008C99" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setInviteModalOpen(true)}
            disabled={sending}
            className="ml-2"
            accessibilityLabel="Safe Trade Spot">
            <Ionicons name="location-outline" size={22} color="#008C99" />
          </TouchableOpacity>
          <TextInput
            placeholder="Write your message"
            className="mx-2 flex-1 px-3 text-base text-gray-700"
            placeholderTextColor="gray"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={1000}
            style={{ maxHeight: 100 }}
          />
          <TouchableOpacity
            onPress={handleSendMessage}
            disabled={!inputText.trim() || sending}>
            {sending ? (
              <ActivityIndicator size="small" color="#008C99" />
            ) : (
              <Ionicons name="send" size={22} color={!inputText.trim() ? 'gray' : '#008C99'} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <SafeTradeSpotInviteModal
        visible={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        onSubmit={handleCreateSafeTradeSpot}
      />

      <SafeTradeSpotInviteModal
        visible={counterModalOpen}
        title="Propose new location/time"
        submitLabel="Send counter-proposal"
        initial={
          activeSpot
            ? {
                location: activeSpot.location,
                scheduledDate: activeSpot.scheduledDate,
                scheduledTime: activeSpot.scheduledTime,
              }
            : undefined
        }
        onClose={() => {
          setCounterModalOpen(false);
          setCounterTargetId(null);
        }}
        onSubmit={handleCounterSubmit}
      />

      {activeSpot?.status === 'locked' && (
        <ShareLocationModal
          visible={shareModalOpen}
          spot={activeSpot}
          onClose={() => setShareModalOpen(false)}
          onSubmit={async (recipientEmail, relationship) => {
            await safeTradeSpotApi.shareLocation(activeSpot._id, recipientEmail, relationship);
          }}
        />
      )}

      {/* Incoming Call Modal */}
      <Modal
        visible={!!incomingCall}
        transparent
        animationType="fade"
        onRequestClose={handleRejectCall}>
        <View className="flex-1 items-center justify-center bg-black/70">
          <View className="w-80 items-center rounded-3xl bg-white p-8 shadow-2xl">
            <View className="mb-6 h-24 w-24 items-center justify-center rounded-full bg-[#C7F3F5]">
              <Ionicons
                name={incomingCall?.callType === 'video' ? 'videocam' : 'call'}
                size={40}
                color="#008C99"
              />
            </View>

            <Text className="mb-2 text-xl font-bold text-gray-900">
              {incomingCall?.callerName || 'Unknown'}
            </Text>

            <Text className="mb-8 text-gray-500">
              Incoming {incomingCall?.callType === 'video' ? 'video' : 'voice'} call...
            </Text>

            <View className="w-full flex-row gap-4">
              <TouchableOpacity
                onPress={handleRejectCall}
                className="flex-1 items-center rounded-2xl bg-red-500 py-4">
                <Ionicons name="close" size={24} color="white" />
                <Text className="mt-1 font-semibold text-white">Decline</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleAcceptCall}
                className="flex-1 items-center rounded-2xl bg-green-500 py-4">
                <Ionicons name="checkmark" size={24} color="white" />
                <Text className="mt-1 font-semibold text-white">Accept</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
