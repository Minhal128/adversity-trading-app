import { Platform } from 'react-native';
import Constants from 'expo-constants';
import Purchases, { PRODUCT_CATEGORY, PurchasesStoreProduct } from 'react-native-purchases';

// Detect if running inside Expo Go (native store unavailable)
const isExpoGo = Constants.appOwnership === 'expo';
const storeUnavailable = isExpoGo || Platform.OS === 'web';

// Credit amounts per product. PRODUCT_IDS is derived from this so the two can't drift.
export const CREDITS_MAP: { [key: string]: number } = {
  atc_credits_100: 100,
  atc_350_credit: 350,
  atc_credits_500: 500,
};

// Must match App Store Connect / Google Play Console exactly
export const PRODUCT_IDS = Object.keys(CREDITS_MAP);

export interface PurchaseResult {
  productId: string;
  transactionId: string;
  transactionReceipt?: string;
  purchaseToken?: string;
  redirected?: boolean;
  userCancelled?: boolean;
  platform?: string;
}

// Products from the last successful fetch, reused by buyMonthly
let storeProducts: PurchasesStoreProduct[] = [];

/**
 * Configure RevenueCat. Safe to call more than once.
 */
export const initIAP = async (): Promise<boolean> => {
  try {
    if (storeUnavailable) {
      console.warn('⚠️ IAP unavailable here (Expo Go or web) — use a development build');
      return false;
    }

    if (await Purchases.isConfigured()) {
      return true;
    }

    const apiKey =
      Platform.OS === 'ios'
        ? process.env.EXPO_PUBLIC_REVENUECAT_APPLE_KEY
        : process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_KEY;

    if (!apiKey) {
      console.error(`❌ Missing RevenueCat API key for ${Platform.OS} — check .env`);
      return false;
    }

    Purchases.configure({ apiKey });
    console.log(`✅ RevenueCat configured for ${Platform.OS}`);
    return true;
  } catch (error) {
    console.error('❌ RevenueCat initialization failed:', error);
    return false;
  }
};

// Credit packs are consumables, so they must be queried as NON_SUBSCRIPTION.
const fetchStoreProducts = async (): Promise<PurchasesStoreProduct[]> => {
  storeProducts = await Purchases.getProducts(PRODUCT_IDS, PRODUCT_CATEGORY.NON_SUBSCRIPTION);
  return storeProducts;
};

/**
 * Load available credit packages from the store.
 * fromStore is false when the prices are fallbacks — nothing is purchasable then.
 */
export const loadSubscriptions = async () => {
  try {
    if (storeUnavailable || !(await initIAP())) {
      return { packages: getFallbackPackages(), fromStore: false };
    }

    const products = await fetchStoreProducts();

    if (products.length === 0) {
      console.warn('⚠️ No products returned. Check RevenueCat + store product setup for:', PRODUCT_IDS);
      return { packages: getFallbackPackages(), fromStore: false };
    }

    return {
      packages: products.map((product) => ({
        productId: product.identifier,
        price: product.priceString,
        localizedPrice: product.priceString,
        title: product.title,
        description: product.description,
        priceAmountMicros: Math.round(product.price * 1000000),
        priceCurrencyCode: product.currencyCode || 'USD',
      })),
      fromStore: true,
    };
  } catch (error) {
    console.error('❌ Failed to load products:', error);
    storeProducts = [];
    return { packages: getFallbackPackages(), fromStore: false };
  }
};

// Display-only prices for when the store can't be reached. Callers get fromStore:false
// alongside these, and must not offer a purchase.
const getFallbackPackages = () => [
  {
    productId: 'atc_credits_100',
    price: '$2.99',
    localizedPrice: '$2.99',
    title: 'Builder Package',
    description: '100 credits for ATC',
    priceAmountMicros: 2990000,
    priceCurrencyCode: 'USD',
  },
  {
    productId: 'atc_350_credit',
    price: '$9.99',
    localizedPrice: '$9.99',
    title: 'Legacy Package',
    description: '350 credits for ATC',
    priceAmountMicros: 9990000,
    priceCurrencyCode: 'USD',
  },
  {
    productId: 'atc_credits_500',
    price: '$14.99',
    localizedPrice: '$14.99',
    title: 'Supporter Package',
    description: '500 credits for ATC',
    priceAmountMicros: 14990000,
    priceCurrencyCode: 'USD',
  },
];

/**
 * Purchase a credit pack. Resolves with userCancelled:true if the user backs out.
 */
export const buyMonthly = async (productId: string): Promise<PurchaseResult> => {
  if (storeUnavailable) {
    throw new Error('In-app purchases are not available here. Please use a development build.');
  }

  if (!(await initIAP())) {
    throw new Error('Could not connect to the store. Please check your connection and try again.');
  }

  try {
    console.log(`🛒 Starting purchase for ${productId} on ${Platform.OS}`);

    const product =
      storeProducts.find((p) => p.identifier === productId) ??
      (await fetchStoreProducts()).find((p) => p.identifier === productId);

    if (!product) {
      throw new Error('Product data is not available from the store yet. Please try again in a moment.');
    }

    const { productIdentifier, transaction } = await Purchases.purchaseStoreProduct(product);
    console.log('✅ Purchase successful:', productIdentifier);

    return {
      productId: productIdentifier,
      transactionId: transaction?.transactionIdentifier || '',
      transactionReceipt: transaction?.transactionIdentifier || '',
      purchaseToken: transaction?.transactionIdentifier || '',
      platform: Platform.OS,
      userCancelled: false,
    };
  } catch (error: any) {
    if (error.userCancelled) {
      console.log('ℹ️ Purchase cancelled by user');
      return { productId, transactionId: '', platform: Platform.OS, userCancelled: true };
    }

    console.error('❌ Purchase failed:', error);
    throw error;
  }
};

/**
 * Restore previous purchases. Consumables that were already spent won't come back.
 */
export const restore = async (): Promise<PurchaseResult[]> => {
  if (storeUnavailable) {
    throw new Error('Restore purchases is not available here. Please use a development build.');
  }

  if (!(await initIAP())) {
    throw new Error('Could not connect to the store. Please check your connection and try again.');
  }

  const customerInfo = await Purchases.restorePurchases();
  const transactions = customerInfo.nonSubscriptionTransactions || [];

  console.log(`🔄 Restored ${transactions.length} non-subscription transaction(s)`);

  return transactions.map((t) => ({
    productId: t.productIdentifier,
    transactionId: t.transactionIdentifier,
    transactionReceipt: t.transactionIdentifier,
    purchaseToken: t.transactionIdentifier,
    platform: Platform.OS,
  }));
};
