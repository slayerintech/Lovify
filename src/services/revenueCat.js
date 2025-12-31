import Purchases from 'react-native-purchases';
import { Platform } from 'react-native';

// TODO: Replace with your actual RevenueCat API Keys
const API_KEYS = {
  apple: 'test_xJaQLygSDpThuySQTyjpeHPNXus',
  google: 'test_xJaQLygSDpThuySQTyjpeHPNXus',
};

class RevenueCatService {
  static isInitialized = false;

  static async init() {
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
      console.warn('RevenueCat init failed (likely missing native module):', e);
      this.isInitialized = false;
    }
  }

  static async logIn(userId) {
    if (!this.isInitialized) return;
    try {
      return await Purchases.logIn(userId);
    } catch (e) {
      console.error('Error logging in to RevenueCat:', e);
      throw e;
    }
  }

  static async logOut() {
    if (!this.isInitialized) return;
    try {
      return await Purchases.logOut();
    } catch (e) {
      console.error('Error logging out of RevenueCat:', e);
    }
  }

  static async getOfferings() {
    if (!this.isInitialized) return [];
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
    if (!this.isInitialized) throw new Error('RevenueCat not initialized');
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
    if (!this.isInitialized) return null;
    try {
      const customerInfo = await Purchases.restorePurchases();
      return customerInfo;
    } catch (e) {
      console.error('Error restoring purchases:', e);
      throw e;
    }
  }

  static async getCustomerInfo() {
    if (!this.isInitialized) return null;
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      return customerInfo;
    } catch (e) {
      console.error('Error getting customer info:', e);
      return null;
    }
  }

  // Helper to check if user has active entitlement
  static isPremium(customerInfo) {
    // Replace 'pro_access' with your actual Entitlement ID from RevenueCat dashboard
    return customerInfo?.entitlements?.active?.['pro_access'] !== undefined;
  }
}

export default RevenueCatService;
