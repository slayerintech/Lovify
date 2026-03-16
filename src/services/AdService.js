import React from 'react';
import { View, Text } from 'react-native';
import { BannerAd, BannerAdSize, TestIds, initializeAds, InterstitialAd, AdEventType } from '../utils/AdMob';

const PRODUCTION_AD_UNITS = {
  MATCHES_BANNER: 'ca-app-pub-7503400330650109/3141111145',
  CHATS_BANNER: 'ca-app-pub-7503400330650109/1931785849',
  REWARDED_VIDEO: 'ca-app-pub-7503400330650109/2456789012',
  INTERSTITIAL: 'ca-app-pub-7503400330650109/1234567890',
};

const AD_UNITS = {
  MATCHES_BANNER: PRODUCTION_AD_UNITS.MATCHES_BANNER || TestIds.BANNER,
  CHATS_BANNER: PRODUCTION_AD_UNITS.CHATS_BANNER || TestIds.BANNER,
  REWARDED_VIDEO: PRODUCTION_AD_UNITS.REWARDED_VIDEO || TestIds.REWARDED,
  INTERSTITIAL: PRODUCTION_AD_UNITS.INTERSTITIAL || TestIds.INTERSTITIAL,
};

let swipeCount = 0;
const SWIPE_THRESHOLD = 5;

class AdService {
  static isPremium = false;
  static interstitial = null;
  static isInterstitialLoaded = false;

  static setPremiumStatus(status) {
    AdService.isPremium = status;
    console.log('AdService: Premium status updated to', status);
  }

  static async init() {
    try {
      await initializeAds();
      console.log('AdMob Initialized');
      
      // Load first interstitial
      AdService.loadInterstitial();
    } catch (error) {
      console.error('AdMob Initialization Error:', error);
    }
  }

  static loadInterstitial() {
    if (AdService.isPremium) return;

    const adUnitId = __DEV__ ? TestIds.INTERSTITIAL : AD_UNITS.INTERSTITIAL;
    
    AdService.interstitial = InterstitialAd.createForAdRequest(adUnitId, {
      requestNonPersonalizedAdsOnly: false,
    });

    AdService.interstitial.addAdEventListener(AdEventType.LOADED, () => {
      AdService.isInterstitialLoaded = true;
      console.log('AdService: Interstitial Ad Loaded');
    });

    AdService.interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      AdService.isInterstitialLoaded = false;
      console.log('AdService: Interstitial Ad Closed');
      AdService.loadInterstitial(); // Preload next
    });

    AdService.interstitial.addAdEventListener(AdEventType.ERROR, (error) => {
      console.error('AdService: Interstitial Ad Error:', error);
      AdService.isInterstitialLoaded = false;
    });

    AdService.interstitial.load();
  }

  static async showSwipeAd() {
    if (AdService.isPremium) return;
    
    // Use global variable to ensure persistence across re-renders/module re-loads
    if (global.swipeCount === undefined) global.swipeCount = 0;
    
    global.swipeCount++;
    const threshold = 5;
    
    console.log(`[AD_DEBUG] Swipe: ${global.swipeCount}/${threshold}`);

    if (global.swipeCount >= threshold) {
      if (AdService.isInterstitialLoaded && AdService.interstitial) {
        try {
          console.log('[AD_DEBUG] Showing Ad...');
          await AdService.interstitial.show();
          global.swipeCount = 0;
        } catch (error) {
          console.error('[AD_DEBUG] Show Error:', error);
        }
      } else {
        console.log('[AD_DEBUG] Ad not ready. Preloading...');
        AdService.loadInterstitial();
      }
    }
  }

  static async showChatAd() {
    if (AdService.isPremium) return;

    if (AdService.isInterstitialLoaded && AdService.interstitial) {
      console.log('Showing Chat Interstitial');
      await AdService.interstitial.show();
    } else {
      console.log('Chat Ad not ready, loading now...');
      AdService.loadInterstitial();
    }
  }

  static async showSaveProfileAd() {
    if (AdService.isPremium) return;

    if (AdService.isInterstitialLoaded && AdService.interstitial) {
      console.log('Showing Save Profile Interstitial');
      await AdService.interstitial.show();
    } else {
      console.log('Save Profile Ad not ready');
      AdService.loadInterstitial();
    }
  }

  /**
   * Universal Banner Component
   */
  static Banner({ type = 'MATCHES' }) {
    if (AdService.isPremium) {
      console.log(`Banner Ad (${type}): Skipping because user is Premium`);
      return null;
    }
    
    const adUnitId = type === 'CHATS' ? AD_UNITS.CHATS_BANNER : AD_UNITS.MATCHES_BANNER;

    return (
      <View style={{ alignItems: 'center', marginVertical: 10, width: '100%', height: 60, justifyContent: 'center', backgroundColor: 'transparent' }}>
        <BannerAd
          unitId={adUnitId}
          size={BannerAdSize.BANNER}
          requestOptions={{
            requestNonPersonalizedAdsOnly: false,
          }}
          onAdFailedToLoad={(error) => console.log(`${type} Banner Ad Load Error:`, error)}
          onAdLoaded={() => console.log(`${type} Banner Ad Loaded`)}
        />
      </View>
    );
  }
}

/**
 * Convenience components for specific screens
 */
export function MatchesBanner() {
  if (AdService.isPremium) return null;

  return (
    <View style={{ alignItems: 'center', width: '100%', height: 60, justifyContent: 'center', backgroundColor: 'transparent' }}>
      <BannerAd
        unitId={AD_UNITS.MATCHES_BANNER}
        size={BannerAdSize.BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: false,
        }}
        onAdFailedToLoad={(error) => console.log('Matches Banner Ad Load Error:', error)}
        onAdLoaded={() => console.log('Matches Banner Ad Loaded')}
      />
    </View>
  );
}

export function ChatsBanner() {
  if (AdService.isPremium) {
    console.log('ChatsBanner: Skipping because user is Premium');
    return null;
  }

  // Use Test ID in development/testing if needed, or production ID
  const adUnitId = __DEV__ ? TestIds.BANNER : AD_UNITS.CHATS_BANNER;

  return (
    <View style={{ alignItems: 'center', width: '100%', minHeight: 50, justifyContent: 'center' }}>
      <BannerAd
        unitId={adUnitId}
        size={BannerAdSize.BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: false,
        }}
        onAdFailedToLoad={(error) => {
          console.error('ChatsBanner Ad Load Error:', error);
        }}
        onAdLoaded={() => console.log('ChatsBanner Ad Loaded')}
      />
    </View>
  );
}

// Initialize ads immediately
AdService.init();

export default AdService;
