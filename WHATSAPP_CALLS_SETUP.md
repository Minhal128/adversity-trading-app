# WhatsApp-Like Voice & Video Calls Setup Guide

## Overview
Your ATC app now has production-ready voice and video calling powered by **Stream Video SDK**. This implementation provides:

✅ **WhatsApp-like features:**
- Full-screen call UI
- Voice and video calls
- Camera flip/toggle
- Microphone mute/unmute
- Real-time call duration
- Incoming call notifications
- End call functionality

## 🚀 Quick Start

### Step 1: Sign Up for Stream
1. Go to https://getstream.io/video/
2. Create a free account
3. Create a new app in the dashboard
4. Get your **API Key** and **API Secret**

### Step 2: Configure Frontend

**Update `frontend/config/streamConfig.ts`:**
```typescript
export const STREAM_API_KEY = 'YOUR_ACTUAL_API_KEY_HERE';
```

**Update `frontend/context/StreamVideoContext.tsx`:**

For development/testing:
```typescript
// Get development token from Stream Dashboard → Authentication → Development Tokens
const devToken = 'YOUR_DEVELOPMENT_TOKEN_HERE';

const videoClient = new StreamVideoClient({
  apiKey: STREAM_API_KEY,
  user: streamUser,
  token: devToken,
});
```

### Step 3: Setup Backend Token Generation (REQUIRED for Production)

**Install Stream server SDK in backend:**
```bash
cd backend
npm install stream-chat
```

**Create `backend/routes/streamRoutes.js`:**
```javascript
const express = require('express');
const router = express.Router();
const { StreamChat } = require('stream-chat');
const auth = require('../middleware/auth');

// Initialize Stream server client
const serverClient = StreamChat.getInstance(
  process.env.STREAM_API_KEY,
  process.env.STREAM_API_SECRET
);

// Generate token for authenticated user
router.post('/token', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const token = serverClient.createToken(userId);
    
    res.json({
      token,
      userId,
      apiKey: process.env.STREAM_API_KEY,
    });
  } catch (error) {
    console.error('Stream token error:', error);
    res.status(500).json({ error: 'Failed to generate token' });
  }
});

module.exports = router;
```

**Add to `backend/server.js`:**
```javascript
const streamRoutes = require('./routes/streamRoutes');
app.use('/api/stream', streamRoutes);
```

**Update `backend/.env`:**
```
STREAM_API_KEY=your_api_key
STREAM_API_SECRET=your_api_secret
```

### Step 4: Update Frontend to Use Backend Token

**In `frontend/context/StreamVideoContext.tsx`, replace dev token with:**
```typescript
const tokenProvider = async () => {
  try {
    const response = await fetch('YOUR_BACKEND_URL/api/stream/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user.token}`,
      },
    });
    const data = await response.json();
    return data.token;
  } catch (error) {
    console.error('Token fetch error:', error);
    throw error;
  }
};

const videoClient = new StreamVideoClient({
  apiKey: STREAM_API_KEY,
  user: streamUser,
  tokenProvider, // Use backend token provider
});
```

## 📱 How to Use

### Making Calls
1. Open any chat conversation
2. Tap the **phone icon** (📞) for voice call
3. Tap the **video icon** (📹) for video call
4. Call screen opens with full controls

### Receiving Calls
1. Incoming call notification appears
2. Tap **Accept** to join the call
3. Tap **Decline** to reject the call

### During Call
- **Voice Calls:**
  - Mute/unmute microphone
  - End call button (red)
  - See call duration

- **Video Calls:**
  - All voice call features +
  - Toggle camera on/off
  - Flip camera (front/back)
  - See participant video streams

## 🔧 Testing

### Development Testing (No Real Backend Yet)
1. Get a development token from Stream Dashboard
2. Put it in `StreamVideoContext.tsx` as shown above
3. Build and run the app on a real device (not emulator)
4. Make calls between two test accounts

### Why Real Devices?
- Camera/microphone don't work reliably on emulators
- WebRTC peer connections need real network interfaces
- Better reflects actual user experience

## 📋 Permissions (Already Configured)

**iOS** (`app.json`)
```json
"NSCameraUsageDescription": "This app needs access to your camera for video calls",
"NSMicrophoneUsageDescription": "This app needs access to your microphone for voice and video calls"
```

**Android** (`app.json`)
```json
"permissions": [
  "CAMERA",
  "RECORD_AUDIO",
  "MODIFY_AUDIO_SETTINGS",
  "ACCESS_NETWORK_STATE",
  "CHANGE_NETWORK_STATE",
  "INTERNET"
]
```

## 🏗️ Architecture

### Files Modified/Created

1. **`app/screens/CallScreen.tsx`** - Full-screen call UI
   - Video/voice call interface
   - Call controls (mute, camera, end)
   - WhatsApp-like design

2. **`context/StreamVideoContext.tsx`** - Stream Video client provider
   - Initializes Stream Video SDK
   - Manages user connection
   - Provides client to all screens

3. **`config/streamConfig.ts`** - Configuration file
   - API key storage
   - Token provider URL

4. **`app/screens/Chat.tsx`** - Updated chat screen
   - Integrated call initiation
   - Stream Video call creation
   - Navigation to CallScreen

5. **`App.tsx`** - Navigation setup
   - Added CallScreen route
   - Wrapped in StreamVideoProvider

### Call Flow

```
User taps call button
    ↓
Chat.tsx creates Stream call
    ↓
Navigates to CallScreen with call object
    ↓
CallScreen joins call automatically
    ↓
Stream handles WebRTC peer connection
    ↓
Video/audio streams established
    ↓
Users can see/hear each other
    ↓
End call → Navigate back to chat
```

## 🔒 Security Notes

⚠️ **NEVER expose your API Secret in frontend code**
- API Key: Safe to expose (used in frontend)
- API Secret: MUST stay on backend only
- Use backend token generation for production
- Development tokens are for testing only

## 💰 Pricing

Stream Video Free Tier includes:
- 10,000 monthly active users
- Unlimited calls
- All features enabled
- Perfect for development and small apps

Paid plans start at $99/month for more users.

## 🐛 Troubleshooting

### "Video client not initialized"
- Check STREAM_API_KEY is set correctly
- Verify user is authenticated before opening chat
- Check console for StreamVideoContext initialization logs

### Calls don't connect
- Ensure both users have valid tokens
- Check internet connection
- Verify permissions are granted
- Use real devices, not emulators

### No video/audio
- Check device permissions (Camera, Microphone)
- Verify camera isn't used by another app
- Check iOS/Android permission settings
- Test on different device

### Build errors
- Run `npx expo prebuild` to regenerate native folders
- Run `npx pod-install` for iOS dependencies
- Clear metro cache: `npx expo start -c`

## 📚 Additional Resources

- [Stream Video Docs](https://getstream.io/video/docs/react-native/)
- [React Native WebRTC](https://github.com/react-native-webrtc/react-native-webrtc)
- [Stream Dashboard](https://dashboard.getstream.io/)

## ✨ Next Steps

1. **Get Stream API credentials** (highest priority)
2. **Implement backend token generation** (required for production)
3. **Test on real devices** (2 phones with different accounts)
4. **Add push notifications** for incoming calls (when app is closed)
5. **Add call history** feature
6. **Implement group video calls** (Stream supports this)

## 🎯 Current Status

✅ Frontend UI complete
✅ Call logic implemented
✅ Navigation configured
✅ Permissions added
⏳ Needs Stream API credentials
⏳ Needs backend token generation
⏳ Ready for testing

---

**Ready to test?** Just add your Stream API key and development token, then build and run on a real device!
