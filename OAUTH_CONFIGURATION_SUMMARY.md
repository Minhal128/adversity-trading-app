# OAuth Configuration Summary - ATC Frontend

## Configuration Copied from KCL Frontend

### Clerk Publishable Key
```
pk_test_YWJvdmUtZ29yaWxsYS04OC5jbGVyay5hY2NvdW50cy5kZXYk
```

### OAuth Strategies
The following OAuth strategies are configured in Clerk and used in the frontend:

1. **Google OAuth**
   - Strategy: `oauth_google`
   - Backend Endpoint: `/auth/clerk-google`
   - Used in: SignIn.tsx, Signup.tsx

2. **Apple OAuth**
   - Strategy: `oauth_apple`
   - Backend Endpoint: `/auth/clerk-apple`
   - Used in: SignIn.tsx, Signup.tsx

3. **Facebook OAuth**
   - Strategy: `oauth_facebook`
   - Backend Endpoint: `/auth/clerk-facebook`
   - Used in: SignIn.tsx, Signup.tsx

## Files Updated

### 1. config/config.ts (NEW)
```typescript
const CLERK_PUBLISHABLE_KEY = "pk_test_YWJvdmUtZ29yaWxsYS04OC5jbGVyay5hY2NvdW50cy5kZXYk";

const config = {
  baseUrl: BACKEND_URI,
  clerkPublishableKey: CLERK_PUBLISHABLE_KEY,
  
  // OAuth endpoints
  clerkGoogleEndpoint: `${BACKEND_URI}/auth/clerk-google`,
  clerkAppleEndpoint: `${BACKEND_URI}/auth/clerk-apple`,
  clerkFacebookEndpoint: `${BACKEND_URI}/auth/clerk-facebook`,
  
  // App configuration
  appName: "ATC",
  appVersion: "1.0.0",
  appType: "service",
  userType: "provider",
};
```

### 2. app.json (UPDATED)
Added iOS associated domains:
```json
"ios": {
  "associatedDomains": [
    "applinks:atc.clerk.accounts.dev"
  ]
}
```

Added backend URI:
```json
"extra": {
  "BACKEND_URI": "http://localhost:3000/api/v1"
}
```

### 3. App.tsx (UPDATED)
```typescript
import config from "./config/config";

<ClerkProvider 
  publishableKey={config.clerkPublishableKey}
  tokenCache={tokenCache}
>
```

## OAuth Implementation Details

### SignIn.tsx (Lines 29-31)
```typescript
const { startOAuthFlow: startGoogleOAuth } = useOAuth({ strategy: "oauth_google" });
const { startOAuthFlow: startAppleOAuth } = useOAuth({ strategy: "oauth_apple" });
const { startOAuthFlow: startFacebookOAuth } = useOAuth({ strategy: "oauth_facebook" });
```

### Signup.tsx (Lines 31-33)
```typescript
const { startOAuthFlow: startGoogleOAuth } = useOAuth({ strategy: "oauth_google" });
const { startOAuthFlow: startAppleOAuth } = useOAuth({ strategy: "oauth_apple" });
const { startOAuthFlow: startFacebookOAuth } = useOAuth({ strategy: "oauth_facebook" });
```

### OAuth Flow Handler (SignIn.tsx, Lines 63-174)
```typescript
const handleOAuthSignIn = async (provider: "google" | "apple" | "facebook") => {
  // 1. Clear existing session
  await logout();
  if (clerk.user) {
    await clerk.signOut();
  }
  
  // 2. Start OAuth flow
  const { createdSessionId, setActive } = await startOAuth();
  
  // 3. Activate session
  if (createdSessionId) {
    await setActive!({ session: createdSessionId });
    
    // 4. Sync with backend
    const result = await syncClerkUserWithBackend(currentUser, login);
    
    // 5. Navigate based on result
    if (result.bypassVerification) {
      navigation.navigate("ProfileSetup");
    }
  }
}
```

## Backend Integration Required

Your backend must implement these endpoints:

### 1. POST /auth/clerk-google
Handles Google OAuth authentication

### 2. POST /auth/clerk-apple
Handles Apple OAuth authentication

### 3. POST /auth/clerk-facebook
Handles Facebook OAuth authentication

All endpoints should:
- Accept OAuth user data from Clerk
- Create or update user account
- Return JWT token and user data
- Handle OAuth users (bypass OTP verification)

## Clerk Dashboard Configuration

The following must be configured in Clerk Dashboard (https://dashboard.clerk.com):

1. **OAuth Providers**
   - Google OAuth (enabled)
   - Apple OAuth (enabled)
   - Facebook OAuth (enabled)

2. **Redirect URIs** (for each provider)
   - `https://atc.clerk.accounts.dev/oauth/callback`
   - `atc://oauth-callback`

3. **Associated Domains** (iOS)
   - `applinks:atc.clerk.accounts.dev`

## Testing the OAuth Setup

### Prerequisites
1. Backend server running with OAuth endpoints
2. Clerk Dashboard configured with OAuth providers
3. Physical device or simulator with network access

### Test Steps
1. Open app and navigate to SignIn or SignUp
2. Tap "Sign in with Google" / "Sign in with Apple" / "Sign in with Facebook"
3. Complete OAuth flow with provider
4. Verify user data is synced with backend
5. Verify user is logged in and navigated to ProfileSetup or Home

### Expected Behavior
- OAuth users should bypass OTP verification
- User data should be extracted from Clerk
- Backend should receive OAuth data
- User should be logged in after successful OAuth
- Navigation should work correctly

## Comparison with KCL Frontend

| Aspect | KCL | ATC |
|--------|-----|-----|
| Clerk Publishable Key | pk_test_YWJvdmUtZ29yaWxsYS04OC5jbGVyay5hY2NvdW50cy5kZXYk | pk_test_YWJvdmUtZ29yaWxsYS04OC5jbGVyay5hY2NvdW50cy5kZXYk |
| OAuth Strategies | google, apple, facebook | google, apple, facebook |
| Config File | config.js | config/config.ts |
| Backend URI | https://kclbackend.vercel.app/api/v1 | http://localhost:3000/api/v1 |
| App Type | rider | service |
| User Type | customer | provider |

## Notes

- The Clerk Publishable Key is the same for both KCL and ATC (test environment)
- OAuth strategies are identical between both projects
- Backend URIs differ (KCL uses production URL, ATC uses local development)
- App configuration differs (ATC is for service providers, KCL is for customers)
- All OAuth implementation code is identical between projects
