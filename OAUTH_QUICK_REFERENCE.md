# OAuth Quick Reference - ATC Frontend

## Clerk Publishable Key
```
pk_test_YWJvdmUtZ29yaWxsYS04OC5jbGVyay5hY2NvdW50cy5kZXYk
```

## OAuth Strategies
| Provider | Strategy | Endpoint |
|----------|----------|----------|
| Google | `oauth_google` | `/auth/clerk-google` |
| Apple | `oauth_apple` | `/auth/clerk-apple` |
| Facebook | `oauth_facebook` | `/auth/clerk-facebook` |

## Configuration Files
- **config/config.ts** - Centralized OAuth configuration
- **app.json** - App configuration with iOS associated domains
- **App.tsx** - ClerkProvider setup

## Key Implementation Files
- **app/screens/SignIn.tsx** - Sign in with OAuth
- **app/screens/Signup.tsx** - Sign up with OAuth
- **services/clerkAuthService.ts** - Backend sync
- **context/AuthContext.tsx** - Auth state management

## Backend Endpoints Required
```
POST /auth/clerk-google
POST /auth/clerk-apple
POST /auth/clerk-facebook
```

## iOS Associated Domain
```
applinks:atc.clerk.accounts.dev
```

## Backend URI
```
http://localhost:3000/api/v1
```
(Update for production)

## OAuth Flow
1. User taps OAuth button
2. Clear existing Clerk session
3. Start OAuth flow with Clerk
4. User authenticates with provider
5. Clerk returns session ID
6. Activate session
7. Sync user data with backend
8. Navigate to ProfileSetup or Home

## Testing
1. Start backend with OAuth endpoints
2. Configure Clerk Dashboard with OAuth providers
3. Test on physical device (OAuth requires real devices)
4. Test all three providers

## Common Issues
- **OAuth not working**: Check Clerk key and backend URI
- **Already signed in**: App auto-clears session, try again
- **Network errors**: Verify backend is running
- **No user data**: Check Clerk OAuth configuration

## Documentation Files
- `OAUTH_SETUP_GUIDE.md` - Complete setup guide
- `OAUTH_CONFIGURATION_SUMMARY.md` - Configuration details
- `OAUTH_FIX_VERIFICATION.md` - Verification checklist
- `OAUTH_QUICK_REFERENCE.md` - This file
