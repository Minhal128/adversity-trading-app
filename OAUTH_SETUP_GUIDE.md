# OAuth Setup Guide for ATC Frontend

## Overview
This guide explains the OAuth configuration for Google, Apple, and Facebook sign-in in the ATC frontend application.

## Configuration Files

### 1. **config/config.ts** (NEW)
Centralized configuration file for Clerk and OAuth endpoints:
```typescript
- Clerk Publishable Key: pk_test_YWJvdmUtZ29yaWxsYS04OC5jbGVyay5hY2NvdW50cy5kZXYk
- Google OAuth Endpoint: {BACKEND_URI}/auth/clerk-google
- Apple OAuth Endpoint: {BACKEND_URI}/auth/clerk-apple
- Facebook OAuth Endpoint: {BACKEND_URI}/auth/clerk-facebook
```

### 2. **app.json** (UPDATED)
Added iOS associated domains for Clerk deep linking:
```json
"ios": {
  "associatedDomains": [
    "applinks:atc.clerk.accounts.dev"
  ]
}
```

Added backend URI configuration:
```json
"extra": {
  "BACKEND_URI": "http://localhost:3000/api/v1"
}
```

### 3. **App.tsx** (UPDATED)
Now uses the centralized config:
```typescript
import config from "./config/config";

<ClerkProvider 
  publishableKey={config.clerkPublishableKey}
  tokenCache={tokenCache}
>
```

## OAuth Providers Configuration

### Google OAuth
- **Strategy**: `oauth_google`
- **Endpoint**: `/auth/clerk-google`
- **Used in**: SignIn.tsx (line 29), Signup.tsx (line 31)

### Apple OAuth
- **Strategy**: `oauth_apple`
- **Endpoint**: `/auth/clerk-apple`
- **Used in**: SignIn.tsx (line 30), Signup.tsx (line 32)

### Facebook OAuth
- **Strategy**: `oauth_facebook`
- **Endpoint**: `/auth/clerk-facebook`
- **Used in**: SignIn.tsx (line 31), Signup.tsx (line 33)

## Clerk Dashboard Configuration

### Required Setup Steps:

1. **Go to Clerk Dashboard**: https://dashboard.clerk.com
2. **Select Your Application** or create a new one
3. **Configure OAuth Providers**:
   - Navigate to Settings → OAuth Applications
   - Enable Google, Apple, and Facebook OAuth

### For Each Provider:

#### Google OAuth
1. Add Google OAuth credentials from Google Cloud Console
2. Configure redirect URIs:
   - `https://atc.clerk.accounts.dev/oauth/callback`
   - `atc://oauth-callback` (for mobile deep linking)

#### Apple OAuth
1. Configure Apple Developer credentials
2. Configure redirect URIs:
   - `https://atc.clerk.accounts.dev/oauth/callback`
   - `atc://oauth-callback` (for mobile deep linking)

#### Facebook OAuth
1. Add Facebook App credentials
2. Configure redirect URIs:
   - `https://atc.clerk.accounts.dev/oauth/callback`
   - `atc://oauth-callback` (for mobile deep linking)

## Backend Integration

Your backend should have these endpoints:

### POST `/auth/clerk-google`
**Request Body:**
```json
{
  "clerkId": "user_xxx",
  "sessionId": "sess_xxx",
  "googleId": "google_id",
  "email": "user@example.com",
  "emailVerified": true,
  "name": "User Name",
  "firstName": "User",
  "lastName": "Name",
  "username": "username",
  "photo": "https://...",
  "phoneNumber": "+1234567890",
  "authMethod": "clerk_google",
  "provider": "google",
  "platform": "ios|android|web",
  "role": "provider",
  "appType": "service"
}
```

### POST `/auth/clerk-apple`
**Request Body:**
```json
{
  "clerkId": "user_xxx",
  "sessionId": "sess_xxx",
  "email": "user@example.com",
  "name": "User Name",
  "firstName": "User",
  "lastName": "Name",
  "photo": "https://...",
  "phoneNumber": "+1234567890",
  "authMethod": "clerk_apple",
  "provider": "apple",
  "platform": "ios|android|web",
  "role": "provider",
  "appType": "service"
}
```

### POST `/auth/clerk-facebook`
**Request Body:**
```json
{
  "clerkId": "user_xxx",
  "sessionId": "sess_xxx",
  "email": "user@example.com",
  "name": "User Name",
  "firstName": "User",
  "lastName": "Name",
  "photo": "https://...",
  "phoneNumber": "+1234567890",
  "authMethod": "clerk_facebook",
  "provider": "facebook",
  "platform": "ios|android|web",
  "role": "provider",
  "appType": "service"
}
```

**Expected Response (All Endpoints):**
```json
{
  "success": true,
  "token": "jwt_token",
  "user": {
    "_id": "user_id",
    "email": "user@example.com",
    "name": "User Name",
    "skills": [],
    "isVerified": true,
    ...
  }
}
```

## How OAuth Sign-In Works

### SignIn Flow (SignIn.tsx)
1. User taps "Sign in with Google/Apple/Facebook"
2. `handleOAuthSignIn()` is called
3. Existing Clerk session is cleared
4. OAuth flow starts with Clerk
5. User authenticates with provider
6. Clerk returns session ID
7. Session is activated
8. User data is synced with backend via `syncClerkUserWithBackend()`
9. User is navigated to ProfileSetup or Home based on profile completion

### SignUp Flow (Signup.tsx)
1. User taps "Sign up with Google/Apple/Facebook"
2. `handleOAuthSignUp()` is called
3. Existing Clerk session is cleared
4. OAuth flow starts with Clerk
5. User authenticates with provider
6. Clerk returns session ID
7. Session is activated
8. User data is synced with backend
9. OAuth users bypass OTP verification (already verified by provider)
10. User is navigated to ProfileSetup

## Key Files Modified/Created

### Created:
- `config/config.ts` - Centralized configuration

### Modified:
- `app.json` - Added iOS associated domains and BACKEND_URI
- `App.tsx` - Updated to use config file
- `app/screens/SignIn.tsx` - Uses OAuth strategies (already implemented)
- `app/screens/Signup.tsx` - Uses OAuth strategies (already implemented)
- `services/clerkAuthService.ts` - Syncs Clerk users with backend (already implemented)

## Troubleshooting

### OAuth Not Working
1. **Check Clerk Publishable Key**: Verify it matches in `config/config.ts` and Clerk Dashboard
2. **Verify Backend URI**: Check `app.json` extra.BACKEND_URI is correct
3. **Check OAuth Endpoints**: Ensure backend has `/auth/clerk-google`, `/auth/clerk-apple`, `/auth/clerk-facebook`
4. **Verify Redirect URIs**: Ensure Clerk Dashboard has correct redirect URIs configured

### "Already Signed In" Error
- The app automatically handles this by clearing the session first
- If error persists, check Clerk Dashboard session settings

### Network Errors
- Verify backend is running and accessible
- Check `BACKEND_URI` in `app.json`
- Ensure network connectivity on device

### No User Data
- Check Clerk Dashboard OAuth configuration
- Verify redirect URIs are correctly configured
- Check browser console for Clerk errors

## Security Notes

1. **Never commit Clerk keys** - Use environment variables in production
2. **Secure token storage** - Tokens stored in secure storage via `expo-secure-store`
3. **HTTPS only** - Ensure all backend endpoints use HTTPS in production
4. **Token refresh** - Backend should implement token refresh logic
5. **Session validation** - Backend should validate Clerk session IDs

## Testing Checklist

- [ ] Google sign-in works on iOS
- [ ] Google sign-in works on Android
- [ ] Apple sign-in works on iOS
- [ ] Facebook sign-in works on iOS/Android
- [ ] User data is correctly extracted
- [ ] Backend receives correct data
- [ ] Tokens are stored securely
- [ ] User is logged into app after sign-in
- [ ] Session clearing works on "already signed in" error
- [ ] Navigation works after successful sign-in
- [ ] OAuth users bypass OTP verification
- [ ] Profile setup works after OAuth sign-in

## Support

For issues with:
- **Clerk**: https://clerk.com/docs
- **Expo**: https://docs.expo.dev
- **React Native**: https://reactnative.dev
