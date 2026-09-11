import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Image,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';

// Check if running in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

// Conditional import for Stream Video SDK
let Call: any = null;
let CallContent: any = null;
let StreamCall: any = null;
let useCall: any = null;
let useCallStateHooks: any = null;

// Only load Stream Video SDK in development builds, not Expo Go
if (Platform.OS !== 'web' && !isExpoGo) {
  try {
    const streamVideo = require('@stream-io/video-react-native-sdk');
    Call = streamVideo.Call;
    CallContent = streamVideo.CallContent;
    StreamCall = streamVideo.StreamCall;
    useCall = streamVideo.useCall;
    useCallStateHooks = streamVideo.useCallStateHooks;
  } catch (error) {
    // Silent fail - SDK not available
  }
}

const { width, height } = Dimensions.get('window');

interface CallScreenProps {
  route: {
    params: {
      call: any;
      isVideoCall: boolean;
      otherUserName: string;
      otherUserAvatar?: string;
    };
  };
}

const CallControls: React.FC<{
  isVideoCall: boolean;
  onEndCall: () => void;
}> = ({ isVideoCall, onEndCall }) => {
  const call = useCall();
  const { useMicrophoneState, useCameraState } = useCallStateHooks();
  const { isMute } = useMicrophoneState();
  const { isMute: isVideoMute } = useCameraState();

  const toggleMicrophone = async () => {
    await call?.microphone.toggle();
  };

  const toggleCamera = async () => {
    await call?.camera.toggle();
  };

  const flipCamera = async () => {
    await call?.camera.flip();
  };

  return (
    <View style={styles.controlsContainer}>
      <View style={styles.controls}>
        {/* Microphone Toggle */}
        <TouchableOpacity
          style={[styles.controlButton, isMute && styles.controlButtonMuted]}
          onPress={toggleMicrophone}
        >
          <Ionicons
            name={isMute ? 'mic-off' : 'mic'}
            size={28}
            color="white"
          />
        </TouchableOpacity>

        {/* End Call Button */}
        <TouchableOpacity
          style={[styles.controlButton, styles.endCallButton]}
          onPress={onEndCall}
        >
          <Ionicons name="call" size={28} color="white" />
        </TouchableOpacity>

        {/* Video/Camera Controls (only for video calls) */}
        {isVideoCall && (
          <>
            <TouchableOpacity
              style={[
                styles.controlButton,
                isVideoMute && styles.controlButtonMuted,
              ]}
              onPress={toggleCamera}
            >
              <Ionicons
                name={isVideoMute ? 'videocam-off' : 'videocam'}
                size={28}
                color="white"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlButton}
              onPress={flipCamera}
            >
              <Ionicons name="camera-reverse" size={28} color="white" />
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
};

const CallScreen: React.FC<CallScreenProps> = ({ route, navigation }: any) => {
  const { call, isVideoCall, otherUserName, otherUserAvatar } = route.params;
  const [callDuration, setCallDuration] = useState(0);

  // Show alert if Stream Video SDK is not available
  useEffect(() => {
    if (!StreamCall || Platform.OS === 'web') {
      Alert.alert(
        'Development Build Required',
        'Voice and video calls require a development build of the app.\n\nTo enable calls:\n1. Run: npx expo prebuild\n2. Run: npx expo run:android (or run:ios)\n\nThis feature is not available in Expo Go.',
        [
          {
            text: 'Go Back',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = async () => {
    await call.leave();
    await call.endCall();
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          {otherUserAvatar ? (
            <Image
              source={{ uri: otherUserAvatar }}
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>
                {otherUserName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <Text style={styles.userName}>{otherUserName}</Text>
          <Text style={styles.callStatus}>
            {isVideoCall ? 'Video Call' : 'Voice Call'} • {formatDuration(callDuration)}
          </Text>
        </View>
      </View>

      {/* Call Content */}
      <StreamCall call={call}>
        {isVideoCall ? (
          <CallContent
            onHangupCallHandler={handleEndCall}
            CallControls={() => null} // We'll use custom controls
          />
        ) : (
          <View style={styles.voiceCallContent}>
            <View style={styles.voiceCallCenter}>
              {otherUserAvatar ? (
                <Image
                  source={{ uri: otherUserAvatar }}
                  style={styles.largeAvatar}
                />
              ) : (
                <View style={[styles.largeAvatar, styles.avatarPlaceholder]}>
                  <Text style={styles.largeAvatarText}>
                    {otherUserName.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Custom Controls */}
        <CallControls isVideoCall={isVideoCall} onEndCall={handleEndCall} />
      </StreamCall>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  headerContent: {
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 10,
  },
  avatarPlaceholder: {
    backgroundColor: '#008c99',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  userName: {
    color: 'white',
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 5,
  },
  callStatus: {
    color: '#aaa',
    fontSize: 14,
  },
  voiceCallContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  voiceCallCenter: {
    alignItems: 'center',
  },
  largeAvatar: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 20,
  },
  largeAvatarText: {
    color: 'white',
    fontSize: 60,
    fontWeight: 'bold',
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 50,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 20,
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonMuted: {
    backgroundColor: '#555',
  },
  endCallButton: {
    backgroundColor: '#dc3545',
    width: 70,
    height: 70,
    borderRadius: 35,
  },
});

export default CallScreen;
