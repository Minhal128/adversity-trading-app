# Voice & Video Call Setup Guide

## ✅ Installed Packages

```bash
npm install react-native-webrtc@124.0.4 @stream-io/video-react-native-sdk
```

## 📦 Package Details

### 1. **react-native-webrtc** (v124.0.4)
- Core WebRTC implementation for React Native
- Supports audio/video calling
- Peer-to-peer connections
- Works on iOS and Android

### 2. **@stream-io/video-react-native-sdk**
- Production-ready video calling SDK
- Built on top of WebRTC
- Handles signaling, TURN/STUN servers
- Easy integration with beautiful UI components

## 🔧 Additional Setup Required

### For React Native (iOS/Android)

#### 1. Install iOS Pods (iOS only)
```bash
cd ios
pod install
cd ..
```

#### 2. Update Android Permissions
Add to `android/app/src/main/AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
```

#### 3. Update iOS Permissions
Add to `ios/YourApp/Info.plist`:
```xml
<key>NSCameraUsageDescription</key>
<string>We need camera access for video calls</string>
<key>NSMicrophoneUsageDescription</key>
<string>We need microphone access for voice calls</string>
```

#### 4. Configure Metro (React Native)
Update `metro.config.js`:
```javascript
const { getDefaultConfig } = require('@expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts.push('cjs');

module.exports = config;
```

## 🚀 Alternative Solutions (Easier Setup)

### Option 1: **Agora SDK** (Recommended for Production)
```bash
npm install react-native-agora
```
- Free up to 10,000 minutes/month
- Excellent documentation
- Reliable infrastructure
- Easy to implement

### Option 2: **Twilio Programmable Video**
```bash
npm install twilio-video
```
- Pay-as-you-go pricing
- High quality calls
- Good developer experience

### Option 3: **100ms SDK**
```bash
npm install @100mslive/react-native-hms
```
- Free tier available
- Modern API
- Good for live streaming too

## 💡 Quick Implementation Guide

### Using Stream Video SDK (Recommended)

1. **Get API Key** from https://getstream.io/
2. **Update Chat.tsx** to use Stream Video components
3. **Initialize SDK** in App.tsx

### Using react-native-webrtc (More Control)

1. **Setup TURN/STUN servers** (free options: Twilio, Google)
2. **Implement WebRTC signaling** via Socket.io (already done!)
3. **Handle peer connections** in handleJoinCall()

## 📝 Next Steps

1. Choose your preferred solution (Stream/Agora/Twilio)
2. Get API credentials
3. Update the call handlers in Chat.tsx
4. Test on real devices (WebRTC doesn't work well on emulators)

## 🎯 Current Implementation Status

✅ UI components ready
✅ Socket.io signaling ready
✅ Call state management ready
✅ Incoming call modal ready
⏳ WebRTC peer connection (needs API key)
⏳ Audio/Video streaming (needs setup)

## 🔗 Useful Links

- **Stream Video**: https://getstream.io/video/docs/react-native/
- **Agora**: https://docs.agora.io/en/video-calling/get-started/get-started-sdk
- **Twilio**: https://www.twilio.com/docs/video
- **100ms**: https://www.100ms.live/docs/react-native/v2/foundation/basics
- **WebRTC**: https://github.com/react-native-webrtc/react-native-webrtc

## ⚠️ Important Notes

- **Web platform**: WebRTC works differently on web vs native
- **Emulators**: Video calls don't work well on emulators - use real devices
- **TURN servers**: Required for calls to work across different networks
- **Permissions**: Must request camera/microphone permissions at runtime
