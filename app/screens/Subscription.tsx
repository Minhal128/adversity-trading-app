import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { initIAP, loadSubscriptions, buyMonthly, restore, CREDITS_MAP } from '../../services/iapService';

// This is important for the redirect to work properly
WebBrowser.maybeCompleteAuthSession();

interface PurchaseResult {
  productId: string;
  transactionId: string;
  transactionReceipt?: string;
  purchaseToken?: string;
  redirected?: boolean;
  userCancelled?: boolean;
  platform?: string;
}

type TabType = 'CREDITS';

interface RevenueCatPackage {
  productId: string;
  price?: string;
  localizedPrice?: string;
  title?: string;
  description?: string;
}

export default function CreditsScreen() {
  const navigation = useNavigation<NavigationProp<any>>();
  const [activeTab, setActiveTab] = useState<TabType>('CREDITS');
  const [activePackageIndex, setActivePackageIndex] = useState<number>(0);
  const [purchasing, setPurchasing] = useState(false);
  const [packages, setPackages] = useState<RevenueCatPackage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [storeReady, setStoreReady] = useState(false);
  const [premium, setPremium] = useState(false);
  const { user, token } = useAuth();

  // Initialize IAP on mount
  useEffect(() => {
    const initializeIAP = async () => {
      try {
        if (Platform.OS === 'web') {
          console.log('⚠️ IAP not supported on web platform');
          setIsConnected(true);
          return;
        }

        console.log('🔄 Initializing StoreKit IAP...');
        const connected = await initIAP();

        if (connected) {
          const { packages: loadedPackages, fromStore } = await loadSubscriptions();
          setPackages(loadedPackages);
          setStoreReady(fromStore);
          console.log('✅ IAP initialized successfully');
          console.log(`📦 Credit packages (fromStore: ${fromStore}):`, loadedPackages.map(s => ({
            productId: s.productId,
            price: s.localizedPrice,
            title: s.title
          })));
        } else {
          console.warn('⚠️ Could not connect to store, showing fallback UI');
        }

        setIsConnected(true);
      } catch (error) {
        console.error('❌ IAP initialization failed:', error);
        setIsConnected(true); // Show UI with fallback prices
      }
    };

    initializeIAP();

    // Keep IAP connected globally; do not disconnect on screen unmount.
    // This avoids losing purchase updates during navigation lifecycle changes.
    return undefined;
  }, []);

  // Informational log only
  useEffect(() => {
    console.log('✅ Using native StoreKit purchase flow');
  }, []);

  // Verify purchase with backend using StoreKit transaction data
  const verifyPurchaseWithBackend = async (purchase: any) => {
    try {
      console.log('🔍 Verifying purchase with backend...');
      console.log('📄 Purchase details:', {
        productId: purchase.productId,
        transactionId: purchase.transactionId,
        platform: Platform.OS,
        hasReceipt: !!(purchase.transactionReceipt || purchase.purchaseToken),
        hasCustomerInfo: !!purchase.customerInfo
      });

      // Choose the correct endpoint based on platform
      const endpoint = Platform.OS === 'ios' ? 'verify-ios' : 'verify-android';

      const creditsToAdd = CREDITS_MAP[purchase.productId] || 0;

      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URI || 'https://stingray-app-priwf.ondigitalocean.app'}/api/subscription/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || ''}`,
        },
        body: JSON.stringify({
          // Required fields for backend verification
          receipt: purchase.transactionReceipt || purchase.transactionId,
          productId: purchase.productId,
          platform: Platform.OS,
          userId: user?.id,
          transactionId: purchase.transactionId,
          credits: creditsToAdd,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Backend verification failed:', response.status, errorText);
        throw new Error(`Backend verification failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Purchase verified with backend:', result);
      return result;
    } catch (error) {
      console.error('❌ Backend verification failed:', error);
      throw error;
    }
  };

  const handlePurchase = async () => {
    if (!isConnected) {
      Alert.alert('Error', 'Service not available. Please try again.');
      return;
    }

    if (!storeReady) {
      Alert.alert(
        'Purchases unavailable',
        'Credit packages could not be loaded from the store. Please try again later.'
      );
      return;
    }

    if (!user?.id) {
      Alert.alert('Error', 'Please sign in to purchase credits.');
      return;
    }

    if (purchasing) return;

    try {
      setPurchasing(true);
      console.log(`🛒 Attempting to purchase credits on ${Platform.OS}`);

      if (!currentPackage?.productId) {
        Alert.alert('Error', 'No product selected or available.');
        return;
      }

      const purchase: PurchaseResult = await buyMonthly(currentPackage.productId);

      if (purchase && !purchase.userCancelled) {
        console.log('🎉 Purchase completed:', purchase.productId);

        // Verify purchase with backend (don't block on errors)
        try {
          await verifyPurchaseWithBackend(purchase);
        } catch (verifyError) {
          console.error('⚠️ Backend verification failed, but purchase succeeded:', verifyError);
          // Don't block the success flow for verification errors
        }

        setPremium(true);

        const creditsAdded = CREDITS_MAP[purchase.productId] || 0;

        // Navigate with product info so success screen can display correct credits
        navigation.navigate('SubscriptionSuccess', {
          productId: purchase.productId,
          creditsAdded: creditsAdded,
        } as never);
      }

    } catch (err: any) {
      if (!err.userCancelled) {
        console.error("❌ Purchase error:", err);
        Alert.alert('Error', err.message || 'An unexpected error occurred.');
      } else {
        console.log('ℹ️ Purchase cancelled by user');
      }
    } finally {
      setPurchasing(false);
    }
  };



  const handleRestorePurchase = async () => {
    try {
      setPurchasing(true);
      const restored = await restore();

      if (restored.length > 0) {
        // Verify restored purchases with backend
        for (const purchase of restored) {
          try {
            await verifyPurchaseWithBackend(purchase);
          } catch (verifyError) {
            console.error('⚠️ Backend verification failed for restored purchase:', verifyError);
          }
        }

        Alert.alert('Success', 'Your purchases have been restored.');
        setPremium(true);
      } else {
        Alert.alert('Restore Purchases', 'No previous purchases found.');
      }
    } catch (err: any) {
      console.error("❌ Restore error:", err);
      Alert.alert('Error', 'Failed to restore purchases.');
    } finally {
      setPurchasing(false);
    }
  };

  // Calculate trial end date (7 days from now) - REMOVED: No longer needed for one-time purchases
  // const getTrialEndDate = () => {
  //   const trialEnd = new Date();
  //   trialEnd.setDate(trialEnd.getDate() + 7);
  //   return trialEnd.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' });
  // };

  const currentPackage = packages[activePackageIndex];

  const PlanCard = ({ pkg }: { pkg: RevenueCatPackage }) => {
    const displayPrice = pkg?.localizedPrice || pkg?.price || '—';

    return (
      <View className="mx-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-lg">
        <View className="-mx-2 mb-4 rounded-lg bg-[#008C99] px-3 py-3">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-base font-extrabold text-white">{pkg.title || 'In-App Purchase'}</Text>
              {pkg.description ? (
                <Text className="text-xs text-white/90">{pkg.description}</Text>
              ) : null}
            </View>
            <View className="rounded-md bg-white/20 px-2 py-1">
              <Text className="text-base font-black text-white">{displayPrice}</Text>
            </View>
          </View>
        </View>

        {pkg.description ? (
          <View className="space-y-2">
            <View className="flex-row items-start">
              <Ionicons
                name="checkmark-circle"
                size={16}
                color="#FF7B00"
                style={{ marginTop: 1, marginRight: 8 }}
              />
              <Text className="flex-1 text-xs font-medium leading-4 text-gray-700">{pkg.description}</Text>
            </View>
          </View>
        ) : null}
      </View>
    );
  };

  // Show loading while connecting to store
  if (!isConnected) {
    return (
      <View className="flex-1 bg-white justify-center items-center p-10">
        <ActivityIndicator size="large" color="#008C99" />
        <Text className="mt-4 text-gray-600">Connecting to store...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <StatusBar backgroundColor="white" barStyle="dark-content" />

      {/* Header */}
      <View className="bg-white pb-4">
        <View className="flex-row items-center px-5 pt-12">
          <TouchableOpacity onPress={() => navigation.goBack()} className="p-2">
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <Text className="ml-3 text-xl font-bold">Credit Packages</Text>
        </View>
      </View>

      {/* Main Content */}
      <View className="flex-1 rounded-t-[40px] bg-[#008C99] pt-6">
        <Text className="mb-4 text-center text-base font-semibold text-white">Select a credit package</Text>

        {/* Offerings Tabs (fetched from RevenueCat) */}
        <View className="mx-4 mb-6 flex-row rounded-xl bg-white/10 p-1">
          {packages.map((pkg, idx) => {
            const isActive = activePackageIndex === idx;

            return (
              <TouchableOpacity
                key={pkg.productId}
                onPress={() => setActivePackageIndex(idx)}
                className={`flex-1 rounded-lg py-2 px-3 ${isActive ? 'bg-white' : ''}`}
              >
                <Text className={`text-center text-xs font-medium ${isActive ? 'text-[#008C99]' : 'text-white'}`}>
                  {pkg.title || 'In-App Purchase'}
                </Text>
                <Text className={`text-center text-xs ${isActive ? 'text-[#008C99]/70' : 'text-white/70'}`}>
                  {pkg.localizedPrice || pkg.price || '—'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}>
          {/* Offer Card */}
          {currentPackage ? <PlanCard pkg={currentPackage} /> : null}

          {/* One-Time Purchase Section */}
          <View className="mx-4 my-6">
            <View className="rounded-2xl bg-white p-5 shadow-lg shadow-[#FF7B00]/40">
              <View className="mb-3 flex-row items-center justify-center">
                <Ionicons name="flash" size={22} color="orange" />
                <Text className="ml-2 text-lg font-extrabold text-orange-500">
                  One-Time Purchase
                </Text>
              </View>
              <Text className="text-orange text-center text-xs font-medium leading-5">
                Buy credits once and use them anytime.{'\n'}
                No recurring charges or subscriptions.
              </Text>
            </View>
          </View>

          {/* Purchase Button */}
          <TouchableOpacity
            className={`mx-4 mb-4 rounded-2xl py-3 shadow-lg shadow-black/20 ${
              storeReady ? 'bg-orange-500' : 'bg-gray-400'
            }`}
            onPress={handlePurchase}
            disabled={purchasing || !storeReady}>
            {purchasing ? (
              <ActivityIndicator size="small" color="white" />
            ) : !storeReady ? (
              <>
                <Text className="text-center text-base font-bold text-white">
                  Purchases unavailable
                </Text>
                <Text className="mt-1 text-center text-xs text-white/80">
                  Credit packages could not be loaded from the store.
                </Text>
              </>
            ) : (
              <>
                {(() => {
                  // Find the correct package price for the button
                  const displayPrice = currentPackage?.localizedPrice || currentPackage?.price || '—';

                  return (
                    <>
                      <Text className="text-center text-base font-bold text-white">
                        Buy – {displayPrice}
                      </Text>
                      {currentPackage?.description ? (
                        <Text className="mt-1 text-center text-xs text-white/80">
                          {currentPackage.description}
                        </Text>
                      ) : null}
                    </>
                  );
                })()}
              </>
            )}
          </TouchableOpacity>

          {/* Features Grid */}
          <View className="mx-4 mb-4">
            <Text className="mb-3 text-center text-xs font-medium text-white">
              Credit packages include:
            </Text>
            <View className="flex-row flex-wrap justify-between">
              <View className="mb-3 w-1/3 items-center">
                <Ionicons name="shield-checkmark" size={18} color="white" />
                <Text className="mt-1 text-center text-xs text-white">Secure Payment</Text>
              </View>
              <View className="mb-3 w-1/3 items-center">
                <Ionicons name="flash" size={18} color="white" />
                <Text className="mt-1 text-center text-xs text-white">Instant Delivery</Text>
              </View>
              <View className="mb-3 w-1/3 items-center">
                <Ionicons name="infinite" size={18} color="white" />
                <Text className="mt-1 text-center text-xs text-white">No Expiration</Text>
              </View>
            </View>
          </View>

          {/* Terms */}
          <Text className="px-8 text-center text-xs leading-4 text-white/80">
            By purchasing credits, you agree to our{' '}
            <Text
              className="underline font-bold"
              onPress={() => WebBrowser.openBrowserAsync('https://www.apple.com/legal/internet-services/itunes/dev/stdeula/')}
            >
              Terms of Service
            </Text>{' '}
            and{' '}
            <Text
              className="underline font-bold"
              onPress={() => WebBrowser.openBrowserAsync('https://adversitytrading.com/privacy')}
            >
              Privacy Policy
            </Text>
            . Credits are non-refundable.
          </Text>

          <TouchableOpacity
            onPress={handleRestorePurchase}
            disabled={purchasing}
            className="mt-6 mb-2"
          >
            <Text className="text-center text-xs font-semibold text-white underline opacity-90">
              Restore Purchase
            </Text>
          </TouchableOpacity>

          <View className="h-5" />
        </ScrollView>
      </View>
    </View>
  );
}
