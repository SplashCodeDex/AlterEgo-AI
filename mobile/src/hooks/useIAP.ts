/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import functions from '@react-native-firebase/functions';
// Fix: Use namespace import to handle different library versions and their exports.
import * as RNIap from 'react-native-iap';
import { IAP_SKUS } from '../constants';

let purchaseUpdateSubscription: any;
let purchaseErrorSubscription: any;

const productSkus = Platform.select({
  ios: [IAP_SKUS.credits_30, IAP_SKUS.credits_100, IAP_SKUS.credits_500],
  android: [IAP_SKUS.credits_30, IAP_SKUS.credits_100, IAP_SKUS.credits_500],
})!;

const subscriptionSkus = Platform.select({
  ios: [IAP_SKUS.pro_monthly],
  android: [IAP_SKUS.pro_monthly],
})!;

// Add an interface for the server validation response
interface ValidationResponse {
  success: boolean;
  error?: string;
}

/**
 * A comprehensive custom hook to manage all In-App Purchase logic.
 * It handles connection, fetching products, processing purchases, and checking subscription status.
 */
export const useIAP = (onPurchaseVerified: (sku: string) => void) => {
  const [products, setProducts] = useState<RNIap.Product[]>([]);
  const [subscriptions, setSubscriptions] = useState<RNIap.Subscription[]>([]);
  const [isPro, setIsPro] = useState(false);

  // Initialize IAP connection and listeners
  useEffect(() => {
    const initializeIAP = async () => {
      try {
        const connected = await RNIap.initConnection();
        console.log('IAP connected:', connected);
        await loadProducts();
        await checkCurrentPurchase();
      } catch (error) {
        console.warn('IAP Initialization Error:', error);
      }
    };

    initializeIAP();

    purchaseErrorSubscription = RNIap.purchaseErrorListener((error: RNIap.PurchaseError) => {
      console.warn('purchaseErrorListener', error);
    });
    
    purchaseUpdateSubscription = RNIap.purchaseUpdatedListener(async (purchase: RNIap.Purchase) => {
      console.log('purchaseUpdatedListener', purchase);
      // Fix: Use `as any` to bypass potential type definition issues with transactionReceipt across versions.
      const receipt = (purchase as any).transactionReceipt;
      const token = (purchase as any).purchaseToken;
      
      if (receipt || token) {
        try {
          // *** CRITICAL: SERVER-SIDE VALIDATION ***
          const validatePurchase = functions().httpsCallable('validatePurchase');
          const response = await validatePurchase({
            receipt: receipt,
            token: token,
            // FIX: The purchase object uses productId, so we pass that.
            productId: purchase.productId,
            platform: Platform.OS,
          });
          
          // FIX: Cast the response data to our defined interface to safely access properties.
          const validationData = response.data as ValidationResponse;

          if (validationData.success) {
            console.log('Server validation successful');
            const isConsumable = productSkus.includes(purchase.productId);
            await RNIap.finishTransaction({ purchase, isConsumable });
            
            onPurchaseVerified(purchase.productId);
            
            if (subscriptionSkus.includes(purchase.productId)) {
              setIsPro(true);
            }
          } else {
             // FIX: Use the casted data to access the error message.
             console.error('Server validation failed:', validationData.error);
             // Do not finish transaction, let the user try again later.
          }

        } catch (ackErr) {
          console.warn('finishTransaction or validation error', ackErr);
        }
      }
    });

    return () => {
      purchaseUpdateSubscription?.remove();
      purchaseErrorSubscription?.remove();
      RNIap.endConnection();
    };
  }, [onPurchaseVerified]);

  // Function to check for active subscriptions on mount or resume
  const checkCurrentPurchase = async () => {
    try {
      const availablePurchases = await RNIap.getAvailablePurchases();
      if (availablePurchases && availablePurchases.length > 0) {
        const proPurchase = availablePurchases.find(p => subscriptionSkus.includes(p.productId));
        setIsPro(!!proPurchase);
      }
    } catch (error) {
      console.warn('getAvailablePurchases error', error);
    }
  };

  // Function to load products and subscriptions from the store
  const loadProducts = async () => {
    try {
      // FIX: Combine product and subscription SKUs and fetch all using getProducts,
      // as getSubscriptions might not be available in the user's version of the library.
      const allSkus = [...productSkus, ...subscriptionSkus];
      const items = await RNIap.getProducts({ skus: allSkus });
      
      const fetchedProducts: RNIap.Product[] = [];
      const fetchedSubscriptions: RNIap.Subscription[] = [];

      items.forEach((item) => {
        if (subscriptionSkus.includes(item.productId)) {
          fetchedSubscriptions.push(item as RNIap.Subscription);
        } else {
          fetchedProducts.push(item);
        }
      });
      
      setProducts(fetchedProducts);
      setSubscriptions(fetchedSubscriptions);
    } catch (error) {
      console.warn('Error fetching IAP products:', error);
    }
  };

  // Function to initiate a purchase for a consumable product
  const handleRequestPurchase = useCallback(async (sku: string) => {
    try {
      // FIX: Use `sku` instead of `productId` to match the expected argument property.
      await RNIap.requestPurchase({ sku });
    } catch (error) {
      console.warn('Request Purchase Error:', error);
    }
  }, []);

  // Function to initiate a subscription purchase
  const handleRequestSubscription = useCallback(async (sku: string) => {
    try {
      // FIX: Use requestPurchase for subscriptions, as requestSubscription might not exist.
      // Use `sku` instead of `productId` to match the expected argument property.
      await RNIap.requestPurchase({ sku });
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
