/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import {
  initConnection,
  endConnection,
  getAvailablePurchases,
  getProducts,
  getSubscriptions,
  requestPurchase,
  requestSubscription,
  purchaseErrorListener,
  purchaseUpdatedListener,
} from 'react-native-iap';
import type { Product, Purchase, Subscription, PurchaseError } from 'react-native-iap';
import { IAP_SKUS } from '../constants';

let purchaseUpdateSubscription: any;
let purchaseErrorSubscription: any;

const productSkus = Platform.select({
  ios: [
    IAP_SKUS.credits_30,
    IAP_SKUS.credits_100,
    IAP_SKUS.credits_500,
  ],
  android: [
    IAP_SKUS.credits_30,
    IAP_SKUS.credits_100,
    IAP_SKUS.credits_500,
  ],
})!;

const subscriptionSkus = Platform.select({
  ios: [IAP_SKUS.pro_monthly],
  android: [IAP_SKUS.pro_monthly],
})!;

/**
 * A comprehensive custom hook to manage all In-App Purchase logic.
 * It handles connection, fetching products, processing purchases, and checking subscription status.
 */
export const useIAP = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isPro, setIsPro] = useState(false);

  // Initialize IAP connection and listeners
  useEffect(() => {
    const initializeIAP = async () => {
      try {
        await initConnection();
        // FIX: `flushFailedPurchasesCachedAsPendingAndroid` has been removed in `react-native-iap` v8+.
        // This functionality is now handled automatically by `initConnection`.
        await loadProducts();
      } catch (error) {
        console.warn('IAP Initialization Error:', error);
      }
    };

    initializeIAP();

    // Set up listeners for purchase events
    purchaseUpdateSubscription = purchaseUpdatedListener(
      async (purchase: Purchase) => {
        console.log('purchaseUpdatedListener', purchase);
        // FIX: `transactionReceipt` does not exist on the `Purchase` type in this version. 
        // Using `purchaseToken` is the correct, more reliable way to verify a purchase.
        const receipt = purchase.purchaseToken;
        if (receipt) {
          try {
            // Here you would typically validate the receipt with your backend server.
            // For this example, we'll assume the purchase is valid.
            // FIX: The `productId` property does not exist in this version. The correct property is `sku`.
            if (purchase.sku === IAP_SKUS.pro_monthly) {
              setIsPro(true);
            }
          } catch (ackErr) {
            console.warn('ackErr', ackErr);
          }
        }
      },
    );

    purchaseErrorSubscription = purchaseErrorListener(
      (error: PurchaseError) => {
        console.warn('purchaseErrorListener', error);
      },
    );

    return () => {
      if (purchaseUpdateSubscription) {
        purchaseUpdateSubscription.remove();
        purchaseUpdateSubscription = null;
      }
      if (purchaseErrorSubscription) {
        purchaseErrorSubscription.remove();
        purchaseErrorSubscription = null;
      }
      endConnection();
    };
  }, []);

  // Check for active subscriptions on mount
  useEffect(() => {
    const checkCurrentPurchase = async () => {
      try {
        const availablePurchases = await getAvailablePurchases();
        if (availablePurchases && availablePurchases.length > 0) {
          const proPurchase = availablePurchases.find(
            // FIX: The `productId` property does not exist in this version. The correct property is `sku`.
            purchase => purchase.sku === IAP_SKUS.pro_monthly,
          );
          setIsPro(!!proPurchase);
        }
      } catch (error) {
        console.warn('getAvailablePurchases error', error);
      }
    };
    checkCurrentPurchase();
  }, []);

  // Function to load products and subscriptions from the store
  const loadProducts = async () => {
    try {
      // FIX: The API for fetching products/subscriptions in this version of `react-native-iap` expects an array of SKUs directly, not an object.
      const fetchedProducts = await getProducts(productSkus);
      const fetchedSubscriptions = await getSubscriptions(subscriptionSkus);
      setProducts(fetchedProducts);
      setSubscriptions(fetchedSubscriptions);
    } catch (error) {
      console.warn('Error fetching IAP products:', error);
    }
  };

  // Function to initiate a purchase for a consumable product
  const handleRequestPurchase = useCallback(async (sku: string) => {
    try {
      // FIX: The `requestPurchase` method in this version of `react-native-iap` expects the SKU as a string argument, not inside an object.
      await requestPurchase(sku);
    } catch (error) {
      console.warn('Request Purchase Error:', error);
    }
  }, []);

  // Function to initiate a subscription purchase
  const handleRequestSubscription = useCallback(async (sku: string) => {
    try {
      // FIX: The `requestSubscription` method in this version of `react-native-iap` expects the SKU as a string argument, not inside an object.
      await requestSubscription(sku);
    } catch (error) {
      console.warn('Request Subscription Error:', error);
    }
  }, []);

  return {
    isPro,
    products,
    subscriptions,
    requestPurchase: handleRequestPurchase,
    requestSubscription: handleRequestSubscription,
  };
};
