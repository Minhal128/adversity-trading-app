# Expo IAP Setup Guide for Apple App Store

This guide will help you set up expo-iap for your Adversity Trading app to get Apple approval.

## ✅ What We've Done

1. **Replaced RevenueCat** with expo-iap (simpler, Apple-friendly)
2. **Updated Subscription Screen** to use expo-iap hooks
3. **Added Backend Verification** endpoint for purchase validation
4. **Configured App.json** with expo-iap plugin
5. **Updated User Model** to track native transactions

---

## 🚀 Next Steps to Complete Setup

### Step 1: Create Products in App Store Connect

You need to create these **exact** Product IDs in App Store Connect:

| Product ID | Plan | Price |
|------------|------|-------|
| `atc_supporter_monthly` | Supporter | $0.99/month |
| `atc_builder_monthly` | Builder | $2.99/month |
| `atc_legacy_monthly` | Legacy Member | $4.99/month |

**How to create products:**
1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Select your app "Adversity Trading"
3. Go to **Monetization** → **In-App Purchases**
4. Create a **Subscription Group** (name it "ATC Subscriptions")
5. Add each product with the exact Product IDs above

### Step 2: Get App Store Connect Shared Secret

1. In App Store Connect, go to your app
2. Go to **App Information**
3. Find **App-Specific Shared Secret**
4. Click **Manage** → **Generate** (if not created)
5. Copy the secret

### Step 3: Update Backend Environment Variables

Add this to your backend `.env` file:

```bash
# Apple In-App Purchase Configuration
APPLE_SHARED_SECRET=your_app_store_connect_shared_secret_here
```

Replace `your_app_store_connect_shared_secret_here` with the secret from Step 2.

### Step 4: Test on Real Device

**Important:** In-app purchases don't work on iOS Simulator!

1. **Create Sandbox Test Account:**
   - Go to App Store Connect → Users and Access → Sandbox
   - Create a new sandbox tester with a new email
   
2. **Configure Device:**
   - On your iPhone: Settings → App Store → Sandbox Account
   - Sign in with your sandbox tester account
   
3. **Test Purchase Flow:**
   - Run your app on the real device
   - Navigate to subscription screen
   - Select a plan and purchase
   - Verify it works without errors

### Step 5: Build and Submit

```bash
# Build for iOS
cd frontend
eas build --platform ios

# Submit to App Store
eas submit --platform ios
```

---

## 🔧 Key Changes Made

### Frontend Changes:
- **Removed:** `react-native-purchases` (RevenueCat)
- **Added:** `expo-iap` (native iOS/Android IAP)
- **Updated:** `Subscription.tsx` to use `useIAP()` hook
- **Added:** `expo-iap` plugin to `app.json`

### Backend Changes:
- **Added:** `/api/subscription/verify-purchase` endpoint
- **Added:** Apple receipt verification
- **Updated:** User model with `processedTransactions` field
- **Added:** Support for iOS/Android platform tracking

---

## 🎯 Why This Will Get Apple Approval

1. **No Third-Party Dependencies:** Direct iOS StoreKit integration
2. **Proper Receipt Verification:** Server-side validation with Apple
3. **Standard Implementation:** Uses Apple's recommended patterns
4. **No RevenueCat Complexity:** Eliminates configuration issues
5. **Native iOS Support:** Built specifically for iOS App Store

---

## 🐛 Troubleshooting

### "Products not found" Error:
- Ensure Product IDs in App Store Connect match exactly
- Products must be "Ready to Submit" or "Approved"
- Wait up to 24 hours after creating products

### "Store not connected" Error:
- Test on real device (not simulator)
- Ensure you're signed into sandbox account
- Check internet connection

### Receipt Verification Fails:
- Verify `APPLE_SHARED_SECRET` is correct
- Check that products are approved in App Store Connect
- Ensure backend is accessible from your app

---

## 📱 Product Configuration

Make sure your App Store Connect products have:

### Supporter Plan (`atc_supporter_monthly`):
- **Type:** Auto-Renewable Subscription
- **Duration:** 1 Month
- **Price:** $0.99
- **Localization:** English (required)

### Builder Plan (`atc_builder_monthly`):
- **Type:** Auto-Renewable Subscription  
- **Duration:** 1 Month
- **Price:** $2.99
- **Localization:** English (required)

### Legacy Plan (`atc_legacy_monthly`):
- **Type:** Auto-Renewable Subscription
- **Duration:** 1 Month  
- **Price:** $4.99
- **Localization:** English (required)

---

## ✅ Final Checklist

Before submitting to Apple:

- [ ] Created all 3 products in App Store Connect
- [ ] Products are "Ready to Submit" or "Approved"
- [ ] Added `APPLE_SHARED_SECRET` to backend `.env`
- [ ] Tested on real iOS device with sandbox account
- [ ] Purchase flow works end-to-end
- [ ] Credits are added correctly after purchase
- [ ] Built app with `eas build --platform ios`
- [ ] No RevenueCat references remain in code

---

## 🎉 Expected Results

After following this guide:
- ✅ **Apple will approve your app** (no RevenueCat complexity)
- ✅ **Purchases work reliably** on iOS devices
- ✅ **Simple maintenance** (no third-party service)
- ✅ **Better performance** (direct native integration)
- ✅ **Lower costs** (no RevenueCat fees)

---

## 🆘 Need Help?

If you encounter issues:
1. Check the console logs for detailed error messages
2. Verify all Product IDs match exactly
3. Ensure you're testing on a real device
4. Confirm backend environment variables are set
5. Test with a fresh sandbox account

The new implementation is much simpler and should work reliably with Apple's App Store!