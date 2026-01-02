import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Safely require Purchases only if not in Expo Go
let Purchases;
try {
  if (!isExpoGo) {
    Purchases = require('react-native-purchases').default;
  }
} catch (e) {
  console.warn('RevenueCat (react-native-purchases) failed to load:', e);
}

// TODO: Replace with your actual RevenueCat API Keys
const API_KEYS = {
  apple: 'goog_SDuDFCzotjxFVuGgvCzUvGLEJhJ',
  google: 'goog_SDuDFCzotjxFVuGgvCzUvGLEJhJ',
};

class RevenueCatService {
  static isInitialized = false;

  static async init() {
    // If in Expo Go or Purchases failed to load, skip initialization
    if (isExpoGo || !Purchases) {
      console.log('RevenueCat initialization skipped (Expo Go or Native Module missing)');
      return;
    }

    try {
      if (Platform.OS === 'ios') {
        Purchases.configure({ apiKey: API_KEYS.apple });
      } else if (Platform.OS === 'android') {
        Purchases.configure({ apiKey: API_KEYS.google });
      } else {
        console.log('RevenueCat skipped: Platform not supported (' + Platform.OS + ')');
        return;
      }
      
      // Debug logs (disable in production)
      await Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
      this.isInitialized = true;
    } catch (e) {
      console.warn('RevenueCat init failed:', e);
      this.isInitialized = false;
    }
  }

  static async logIn(userId) {
    if (!this.isInitialized || !Purchases) return;
    try {
      return await Purchases.logIn(userId);
    } catch (e) {
      console.error('Error logging in to RevenueCat:', e);
      throw e;
    }
  }

  static async logOut() {
    if (!this.isInitialized || !Purchases) return;
    try {
      return await Purchases.logOut();
    } catch (e) {
      console.error('Error logging out of RevenueCat:', e);
    }
  }

  static async getOfferings() {
    if (!this.isInitialized || !Purchases) return [];
    try {
      const offerings = await Purchases.getOfferings();
      if (offerings.current !== null && offerings.current.availablePackages.length !== 0) {
        return offerings.current.availablePackages;
      }
      return [];
    } catch (e) {
      console.error('Error getting offerings:', e);
      return [];
    }
  }

  static async purchasePackage(pack) {
    if (!this.isInitialized || !Purchases) throw new Error('RevenueCat not initialized (or running in Expo Go)');
    try {
      const { customerInfo } = await Purchases.purchasePackage(pack);
      return customerInfo;
    } catch (e) {
      if (!e.userCancelled) {
        // console.error('Error purchasing package:', e);
        throw e;
      }
      throw new Error('User cancelled transaction');
    }
  }

  static async restorePurchases() {
    if (!this.isInitialized || !Purchases) return null;
    try {
      const customerInfo = await Purchases.restorePurchases();
      return customerInfo;
    } catch (e) {
      console.error('Error restoring purchases:', e);
      throw e;
    }
  }

  static async getCustomerInfo() {
    if (!this.isInitialized || !Purchases) return null;
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      return customerInfo;
    } catch (e) {
      console.error('Error getting customer info:', e);
      return null;
    }
  }

  static isPremium(customerInfo) {
    if (!customerInfo || !customerInfo.entitlements || !customerInfo.entitlements.active) {
      return false;
    }
    // Check if the user has the "premium" entitlement active
    return typeof customerInfo.entitlements.active['premium'] !== 'undefined';
  }
}

export default RevenueCatService;
