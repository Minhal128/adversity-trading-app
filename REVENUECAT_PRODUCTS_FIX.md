# RevenueCat Products Configuration Fix

## Problem
RevenueCat can fetch offerings from the API, but products cannot be fetched from App Store Connect:
```
Error: None of the products registered in the RevenueCat dashboard could be fetched from App Store Connect
```

## Product IDs
- `Atc_builder_monthly` (note the capital 'A')
- `atc_supporter_monthly`
- `atc_legacy_monthly`

## Solutions (Try in Order)

### 1. Use StoreKit Configuration File for Testing (Immediate Fix)

I've created `ios/Configuration.storekit` for local testing. To use it:

1. Open your project in Xcode
2. Go to **Product** → **Scheme** → **Edit Scheme**
3. Select **Run** in the left sidebar
4. Go to the **Options** tab
5. Under **StoreKit Configuration**, select `Configuration.storekit`
6. Click **Close**
7. Clean build folder: **Product** → **Clean Build Folder** (Cmd+Shift+K)
8. Run the app again

This allows testing without App Store Connect setup.

### 2. Verify App Store Connect Products (Production Fix)

The products must exist in App Store Connect with EXACT matching IDs:

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Navigate to **My Apps** → **Adversity Trading**
3. Go to **Subscriptions** (or **In-App Purchases**)
4. Verify these EXACT product IDs exist:
   - `Atc_builder_monthly` ⚠️ (Capital 'A')
   - `atc_supporter_monthly`
   - `atc_legacy_monthly`

**Important:** Product IDs are case-sensitive!

### 3. Check Product Status in App Store Connect

Each product must be:
- ✅ **Ready to Submit** or **Approved** status
- ✅ Have at least one price set
- ✅ Have a subscription group assigned
- ✅ Have all required metadata filled

### 4. Wait for App Store Connect Sync

If you just created the products:
- Wait 15-30 minutes for Apple's servers to sync
- Products won't be available immediately

### 5. Fix Product ID Case Inconsistency (Recommended)

Notice the inconsistency: `Atc_builder_monthly` vs `atc_supporter_monthly`

**Option A: Update RevenueCat Dashboard**
1. Go to RevenueCat Dashboard
2. Update product IDs to be consistent (all lowercase):
   - Change `Atc_builder_monthly` → `atc_builder_monthly`

**Option B: Update App Store Connect**
- If products don't exist yet, create them with consistent naming

### 6. Verify Bundle Identifier Match

Ensure your bundle ID matches:
- **App Store Connect:** `com.booali.Atc`
- **Xcode Project:** `com.booali.Atc`
- **app.json:** `com.booali.Atc` ✅

### 7. Check Agreements in App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Click **Agreements, Tax, and Banking**
3. Ensure **Paid Applications** agreement is:
   - ✅ Active
   - ✅ Banking info complete
   - ✅ Tax forms submitted

Without this, products won't load even if configured correctly.

## Testing Checklist

- [ ] StoreKit Configuration file added to Xcode scheme
- [ ] Products exist in App Store Connect with exact IDs
- [ ] Product IDs are case-sensitive matches
- [ ] Products have "Ready to Submit" status
- [ ] Waited 15-30 minutes after creating products
- [ ] Bundle identifier matches everywhere
- [ ] Paid Applications agreement is active
- [ ] Banking and tax info complete

## Quick Test Command

Test if products are visible via RevenueCat API:
```bash
curl -X GET "https://api.revenuecat.com/v1/subscribers/test-user/offerings" \
  -H "Authorization: Bearer appl_iBGsKrzmtPbnKFEqjMrLcIxuOtU"
```

## Common Issues

1. **Case sensitivity:** `Atc_builder_monthly` ≠ `atc_builder_monthly`
2. **Timing:** New products take 15-30 minutes to sync
3. **Status:** Products must be "Ready to Submit" or better
4. **Agreements:** Paid Apps agreement must be signed
5. **Testing:** Use StoreKit Configuration for local testing

## Next Steps

1. Use the StoreKit Configuration file for immediate testing
2. Verify/create products in App Store Connect for production
3. Ensure all product IDs match exactly (case-sensitive)
4. Wait for sync if products were just created
5. Test again

## Support Links

- [RevenueCat: Why are offerings empty?](https://rev.cat/why-are-offerings-empty)
- [Apple: Testing In-App Purchases](https://developer.apple.com/documentation/storekit/in-app_purchase/testing_in-app_purchases_in_xcode)
