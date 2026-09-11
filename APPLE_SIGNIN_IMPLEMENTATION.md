# Apple Sign In Implementation (Without Clerk)

This document describes the native Apple Sign In implementation for the Adversity Trading app.

## Overview

Apple Sign In is implemented using:
- **Frontend**: `expo-apple-authentication` + `expo-crypto` for native iOS authentication
- **Backend**: `apple-signin-auth` package for token verification

## Configuration

### Apple Developer Console Setup
The following credentials are configured:
- **Bundle ID**: `com.booali.Atc`
- **Team ID**: `7M383KT75Y`
- **Key ID**: `324VFURHZ5`
- **Private Key**: Stored in backend `.env` as `APPLE_PRIVATE_KEY`

### Backend Environment Variables (.env)
```env
APPLE_CLIENT_ID=com.booali.Atc
APPLE_TEAM_ID=7M383KT75Y
APPLE_KEY_ID=324VFURHZ5
APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
```

## Files Modified/Created

### Frontend
1. **`services/appleAuthService.ts`** - Apple authentication service
   - `isAppleAuthAvailable()` - Check if Apple Sign In is available
   - `signInWithApple(login)` - Perform Apple Sign In with nonce
   - `getCredentialState()` - Check credential authorization status
   - `isCredentialRevoked()` - Check if user revoked access

2. **`app/screens/SignIn.tsx`** - Updated to use native Apple Sign In
3. **`app/screens/Signup.tsx`** - Updated to use native Apple Sign In

### Backend
1. **`controllers/appleAuthController.js`** - Apple Sign In handler
   - `appleSignIn()` - Verify Apple identity token and create/login user
   - `verifyAppleAuthCode()` - Exchange authorization code for tokens
   - `revokeAppleToken()` - Revoke Apple tokens on logout

2. **`routes/authRoutes.js`** - Added Apple Sign In routes:
   - `POST /auth/apple-signin` - Main sign in endpoint
   - `POST /auth/apple-verify-code` - Verify authorization code
   - `POST /auth/apple-revoke` - Revoke tokens

3. **`models/User.js`** - Added OAuth fields:
   - `appleUserId` - Apple's unique user identifier
   - `googleUserId` - For future Google Sign In
   - `authProvider` - Track authentication provider

## How It Works

### Flow
1. User taps "Sign in with Apple" button
2. iOS presents native Apple Sign In sheet
3. User authenticates with Face ID/Touch ID/Password
4. App receives `identityToken` from Apple
5. Token is sent to backend for verification
6. Backend verifies token using Apple's public keys
7. Backend creates/retrieves user and issues JWT
8. User is logged in

### Security
- **Nonce**: A cryptographic nonce is generated and hashed before sending to Apple
- **Token Verification**: The backend verifies the `identityToken` using Apple's JWKS
- **Email Privacy**: Apple's "Hide My Email" feature is supported

## Important Notes

1. **First Sign In Only**: Apple only provides email and name on the FIRST sign in. On subsequent sign-ins, these fields are null. The backend handles this by looking up users by their Apple User ID.

2. **Development Build Required**: Apple Sign In only works in development builds, NOT in Expo Go.

3. **iOS Only**: The Apple Sign In button only appears on iOS devices where Apple Sign In is available.

4. **Clerk Removed**: The Clerk-based OAuth flow has been replaced with native implementation. You can optionally remove Clerk dependencies if not using them for other auth providers.

## Testing

1. Rebuild the app with `npx expo prebuild` and `npx expo run:ios`
2. Test on a real iOS device (simulator has limited support)
3. Ensure the backend is running with the correct environment variables

## Troubleshooting

### "Apple Sign In is not available"
- Make sure you're running a development build, not Expo Go
- Ensure `expo-apple-authentication` plugin is in `app.json`
- Ensure `usesAppleSignIn: true` in ios config

### "Invalid Apple identity token"
- Check that the backend has the correct `APPLE_CLIENT_ID` (bundle ID)
- Verify the private key is correctly formatted in `.env`

### User not found on subsequent sign-ins
- Apple only provides email on first sign-in
- The backend should look up users by `appleUserId`
