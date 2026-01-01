import Constants, { ExecutionEnvironment } from 'expo-constants';
import { View, Text } from 'react-native';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let GoogleMobileAds;

// Safely try to require the native module
try {
  if (!isExpoGo) {
    // We use a conditional require to avoid Metro bundling this for Expo Go if possible,
    // though Metro usually bundles everything. The try-catch is the main safety net.
    GoogleMobileAds = require('react-native-google-mobile-ads');
  }
} catch (e) {
  console.warn('Google Mobile Ads failed to load (likely in Expo Go):', e);
}

// ------------------------------------------------------------------
// MOCK IMPLEMENTATIONS (For Expo Go)
// ------------------------------------------------------------------

const MockBannerAd = ({ unitId, size }) => (
  <View style={{ height: 50, width: '100%', backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#ccc' }}>
    <Text style={{ color: '#888', fontSize: 10, fontWeight: 'bold' }}>[MOCK] AdMob Banner</Text>
    <Text style={{ color: '#aaa', fontSize: 8 }}>{size} | {unitId ? 'ID Set' : 'No ID'}</Text>
  </View>
);

const MockRewardedAd = {
  createForAdRequest: (adUnitId, options) => {
    let _loaded = false;
    let _onLoaded = null;
    let _onEarnedReward = null;

    return {
      addAdEventListener: (event, callback) => {
        if (event === 'loaded') {
          _onLoaded = callback;
          // Simulate load delay
          if (_loaded) callback(); 
        } else if (event === 'earned_reward') {
          _onEarnedReward = callback;
        }
      },
      load: () => {
        console.log(`[MOCK] Loading Rewarded Ad: ${adUnitId}`);
        setTimeout(() => {
          _loaded = true;
          if (_onLoaded) _onLoaded();
          console.log(`[MOCK] Rewarded Ad Loaded`);
        }, 1000);
      },
      show: () => {
        console.log(`[MOCK] Showing Rewarded Ad`);
        return new Promise((resolve) => {
          setTimeout(() => {
            if (_onEarnedReward) _onEarnedReward({ amount: 10, type: 'coins' });
            console.log(`[MOCK] Rewarded Ad Closed (Reward Earned)`);
            resolve();
          }, 1500);
        });
      },
    };
  },
};

// ------------------------------------------------------------------
// EXPORTS
// ------------------------------------------------------------------

export const TestIds = {
  BANNER: 'ca-app-pub-3940256099942544/6300978111',
  REWARDED: 'ca-app-pub-3940256099942544/5224354917',
  INTERSTITIAL: 'ca-app-pub-3940256099942544/1033173712',
};

// If native module exists, use it. Otherwise use Mocks.
export const BannerAd = GoogleMobileAds?.BannerAd || MockBannerAd;
export const RewardedAd = GoogleMobileAds?.RewardedAd || MockRewardedAd;
export const BannerAdSize = GoogleMobileAds?.BannerAdSize || {
  ANCHORED_ADAPTIVE_BANNER: 'ANCHORED_ADAPTIVE_BANNER',
  BANNER: 'BANNER',
  LARGE_BANNER: 'LARGE_BANNER',
  MEDIUM_RECTANGLE: 'MEDIUM_RECTANGLE',
  FULL_BANNER: 'FULL_BANNER',
  LEADERBOARD: 'LEADERBOARD',
  SMART_BANNER: 'SMART_BANNER',
};
export const RewardedAdEventType = GoogleMobileAds?.RewardedAdEventType || {
  LOADED: 'loaded',
  EARNED_REWARD: 'earned_reward',
};

export const initializeAds = async () => {
  if (GoogleMobileAds?.default) {
    return GoogleMobileAds.default().initialize();
  }
  console.log('[MOCK] AdMob SDK Initialized');
  return Promise.resolve();
};

export default GoogleMobileAds;
