import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Safely require Purchases only if not in Expo Go
let Purchases;
try {
  if (!isExpoGo) {
    Purchases = require('react-native-purchases').default;
    
    // Fix for "customLogHandler is not a function" error in react-native-purchases v9.6.12
    // The library attempts to log before configure() is called, causing a crash if no handler is set.
    if (Purchases.setLogHandler) {
      Purchases.setLogHandler((logLevel, message) => {
        // Suppress Configuration Error noise in Development
        if (__DEV__ && (message.includes('Configuration Error') || message.includes('ConfigurationError'))) return;
        
        // Map log levels to console
        const prefix = '[RevenueCat]';
        switch (logLevel) {
          case 'ERROR': console.error(prefix, message); break;
          case 'WARN': console.warn(prefix, message); break;
          case 'INFO': console.info(prefix, message); break;
          case 'DEBUG': console.debug(prefix, message); break;
          default: console.log(prefix, message);
        }
      });
    }
  }
} catch (e) {
  console.warn('RevenueCat (react-native-purchases) failed to load:', e);
}

// TODO: Replace with your actual RevenueCat API Keys
const API_KEYS = {
  apple: 'goog_SDuDFCzotjxFVuGgvCzUvGLEJhJ',
  google: 'goog_SDuDFCzotjxFVuGgvCzUvGLEJhJ',
};

const MOCK_PACKAGES = [
  { identifier: 'monthly_subscription', packageType: 'MONTHLY', product: { priceString: '$4.99' } },
  { identifier: 'yearly_subscription', packageType: 'ANNUAL', product: { priceString: '$49.99' } },
  { identifier: 'lifetime_access', packageType: 'LIFETIME', product: { priceString: '$99.99' } },
];

const MOCK_CUSTOMER_INFO = {
  entitlements: {
    active: {},
    all: {}
  }
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
      if (__DEV__) {
        await Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
      }
      this.isInitialized = true;
    } catch (e) {
      console.warn('RevenueCat init failed:', e);
      this.isInitialized = false;
    }
  }

  static async logIn(userId) {
    if (!this.isInitialized || !Purchases) {
       // If initialization failed, we can't do real IAP.
       // But if we want to debug why, we shouldn't just silently return mocks if we expect it to work.
       if (__DEV__) console.log('RevenueCat not initialized, returning mocks.');
       if (__DEV__) return MOCK_CUSTOMER_INFO;
       return;
    }
    try {
      return await Purchases.logIn(userId);
    } catch (e) {
      console.error('Error logging in to RevenueCat:', e);
      // Don't throw, just log
    }
  }

  static async logOut() {
    if (!this.isInitialized || !Purchases) {
       if (__DEV__) return MOCK_CUSTOMER_INFO;
       return;
    }
    try {
      return await Purchases.logOut();
    } catch (e) {
      console.error('Error logging out of RevenueCat:', e);
    }
  }

  static async getOfferings() {
    if (!this.isInitialized || !Purchases) {
      if (__DEV__) {
         console.log('Returning MOCK packages for Expo Go / Missing Module');
         return MOCK_PACKAGES;
      }
      return [];
    }
    try {
      const offerings = await Purchases.getOfferings();
      if (offerings.current !== null && offerings.current.availablePackages.length !== 0) {
        return offerings.current.availablePackages;
      }
      console.log('No offerings found. Check RevenueCat configuration.');
      return []; // Return empty if real fetch returns nothing, don't force mocks
    } catch (e) {
      console.error('Error getting offerings:', e.message);
      
      if (__DEV__) {
          console.log("RevenueCat Error Details:");
          console.log("Code:", e.code);
          console.log("Message:", e.message);
          console.log("Underlying Error:", e.underlyingErrorMessage);
          if (e.userInfo) console.log("User Info:", JSON.stringify(e.userInfo, null, 2));
      }
      return []; // Don't fall back to mocks, return empty so we know it failed
    }
  }

  static async purchasePackage(pack) {
    // Mock purchase ONLY if not initialized (Expo Go)
    if (!this.isInitialized || !Purchases) {
        if (__DEV__) {
            console.log('Simulating MOCK purchase for:', pack.identifier);
            return { 
                entitlements: { 
                    active: { 
                        premium: { identifier: 'premium', isActive: true }
                    } 
                } 
            };
        }
        throw new Error('RevenueCat not initialized');
    }

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
    if (!this.isInitialized || !Purchases) {
       if (__DEV__) return MOCK_CUSTOMER_INFO;
       return null;
    }
    try {
      const customerInfo = await Purchases.restorePurchases();
      return customerInfo;
    } catch (e) {
      if (__DEV__ && (e.message.includes('ConfigurationError') || e.message.includes('Configuration Error'))) {
        console.log('RevenueCat restore failed (using mocks):', e.message);
        return MOCK_CUSTOMER_INFO;
      }
      console.error('Error restoring purchases:', e);
      throw e;
    }
  }

  static async getCustomerInfo() {
    if (!this.isInitialized || !Purchases) {
       if (__DEV__) return MOCK_CUSTOMER_INFO;
       return null;
    }
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      return customerInfo;
    } catch (e) {
      if (__DEV__ && (e.message.includes('ConfigurationError') || e.message.includes('Configuration Error'))) {
        console.log('RevenueCat getInfo failed (using mocks):', e.message);
        return MOCK_CUSTOMER_INFO;
      }
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
