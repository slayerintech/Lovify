import Purchases from 'react-native-purchases';
import { Platform } from 'react-native';

// TODO: Replace with your actual RevenueCat API Keys
const API_KEYS = {
  apple: 'test_xJaQLygSDpThuySQTyjpeHPNXus',
  google: 'test_xJaQLygSDpThuySQTyjpeHPNXus',
};

class RevenueCatService {
  static async init() {
    if (Platform.OS === 'ios') {
      Purchases.configure({ apiKey: API_KEYS.apple });
    } else if (Platform.OS === 'android') {
      Purchases.configure({ apiKey: API_KEYS.google });
    }
    
    // Debug logs (disable in production)
    await Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
  }

  static async getOfferings() {
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
    try {
      const customerInfo = await Purchases.restorePurchases();
      return customerInfo;
    } catch (e) {
      console.error('Error restoring purchases:', e);
      throw e;
    }
  }

  static async getCustomerInfo() {
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
