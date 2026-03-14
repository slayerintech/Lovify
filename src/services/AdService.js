import { RewardedAd, RewardedAdEventType, InterstitialAd, AdEventType, TestIds, BannerAd, BannerAdSize, initializeAds } from '../utils/AdMob';
import { View } from 'react-native';
import React from 'react';

// Use TestIds for development. 
// When you are ready for production, replace 'null' with your actual Ad Unit IDs from AdMob Console.
const PRODUCTION_AD_UNITS = {
  SAVE_PROFILE_INTERSTITIAL: 'ca-app-pub-7503400330650109/6486409842',
  SWIPE_INTERSTITIAL: 'ca-app-pub-7503400330650109/6486409842',
  MATCHES_BANNER: 'ca-app-pub-7503400330650109/1931785849',
  CHATS_BANNER: 'ca-app-pub-7503400330650109/1931785849',
  CHAT_INTERSTITIAL: 'ca-app-pub-7503400330650109/6486409842',
};

const AD_UNITS = {
  SAVE_PROFILE_INTERSTITIAL: PRODUCTION_AD_UNITS.SAVE_PROFILE_INTERSTITIAL || TestIds.INTERSTITIAL,
  SWIPE_INTERSTITIAL: PRODUCTION_AD_UNITS.SWIPE_INTERSTITIAL || TestIds.INTERSTITIAL,
  MATCHES_BANNER: PRODUCTION_AD_UNITS.MATCHES_BANNER || TestIds.BANNER,
  CHATS_BANNER: PRODUCTION_AD_UNITS.CHATS_BANNER || TestIds.BANNER,
  CHAT_INTERSTITIAL: PRODUCTION_AD_UNITS.CHAT_INTERSTITIAL || TestIds.INTERSTITIAL,
};

class AdService {
  static swipeCount = 0;
  static saveProfileAd = null;
  static swipeAd = null;
  static chatAd = null;
  static isSaveProfileAdLoaded = false;
  static isSwipeAdLoaded = false;
  static isChatAdLoaded = false;
  static isPremium = false; // Add premium status

  static setPremiumStatus(status) {
    this.isPremium = status;
  }

  static async init() {
    await initializeAds();
    this.loadSaveProfileAd();
    this.loadSwipeAd();
    this.loadChatAd();
  }

  static loadChatAd() {
    const interstitial = InterstitialAd.createForAdRequest(AD_UNITS.CHAT_INTERSTITIAL, {
      requestNonPersonalizedAdsOnly: false,
    });

    interstitial.addAdEventListener(AdEventType.LOADED, () => {
      this.isChatAdLoaded = true;
      this.chatAd = interstitial;
      console.log('Chat Interstitial Ad Loaded');
    });

    interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      console.log('Chat Interstitial Ad Closed');
      this.isChatAdLoaded = false;
      this.chatAd = null;
      this.loadChatAd();
    });

    interstitial.addAdEventListener(AdEventType.ERROR, (error) => {
      console.log('Chat Interstitial Ad Load Error:', error);
      this.isChatAdLoaded = false;
      this.chatAd = null;
    });

    interstitial.load();
  }

  static loadSaveProfileAd() {
    const interstitial = InterstitialAd.createForAdRequest(AD_UNITS.SAVE_PROFILE_INTERSTITIAL, {
      requestNonPersonalizedAdsOnly: false,
    });

    interstitial.addAdEventListener(AdEventType.LOADED, () => {
      this.isSaveProfileAdLoaded = true;
      this.saveProfileAd = interstitial;
      console.log('Save Profile Interstitial Ad Loaded');
    });

    interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      console.log('Save Profile Interstitial Ad Closed');
      this.isSaveProfileAdLoaded = false;
      this.saveProfileAd = null;
      this.loadSaveProfileAd();
    });

    interstitial.addAdEventListener(AdEventType.ERROR, (error) => {
      console.log('Save Profile Interstitial Ad Load Error:', error);
      this.isSaveProfileAdLoaded = false;
      this.saveProfileAd = null;
    });

    interstitial.load();
  }

  static loadSwipeAd() {
    const interstitial = InterstitialAd.createForAdRequest(AD_UNITS.SWIPE_INTERSTITIAL, {
      requestNonPersonalizedAdsOnly: false,
    });

    interstitial.addAdEventListener(AdEventType.LOADED, () => {
      this.isSwipeAdLoaded = true;
      this.swipeAd = interstitial;
      console.log('Swipe Interstitial Ad Loaded');
    });

    interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      console.log('Swipe Interstitial Ad Closed');
      this.isSwipeAdLoaded = false;
      this.swipeAd = null;
      this.loadSwipeAd();
    });

    interstitial.addAdEventListener(AdEventType.ERROR, (error) => {
      console.log('Swipe Interstitial Ad Load Error:', error);
      this.isSwipeAdLoaded = false;
      this.swipeAd = null;
    });

    interstitial.load();
  }

  static async showSaveProfileAd() {
    if (this.isPremium) return; // Skip if premium
    try {
        if (this.isSaveProfileAdLoaded && this.saveProfileAd) {
          await this.saveProfileAd.show();
        } else {
          console.log('Save Profile Ad not ready yet');
          this.loadSaveProfileAd();
        }
    } catch (e) {
        console.error('Error showing Save Profile Ad:', e);
    }
  }

  static async handleSwipe() {
    if (this.isPremium) return; // Skip if premium
    this.swipeCount++;
    console.log('Swipe count:', this.swipeCount);
    
    if (this.swipeCount >= 5) {
      try {
          if (this.isSwipeAdLoaded && this.swipeAd) {
            await this.swipeAd.show();
            this.swipeCount = 0;
          } else {
            console.log('Swipe Ad not ready yet');
            this.loadSwipeAd();
          }
      } catch (e) {
          console.error('Error showing Swipe Ad:', e);
      }
    }
  }
  
  static async showChatAd() {
    if (this.isPremium) return; // Skip if premium
    if (this.isChatAdLoaded && this.chatAd) {
      await this.chatAd.show();
    } else {
      console.log('Chat Ad not ready yet');
      this.loadChatAd();
    }
  }

  static Banner({ type = 'MATCHES' }) {
    if (AdService.isPremium) return null; // Skip if premium
    
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

// Banner Component helper
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
  if (AdService.isPremium) return null;

  return (
    <View style={{ alignItems: 'center', width: '100%', height: 60, justifyContent: 'center', backgroundColor: 'transparent' }}>
      <BannerAd
        unitId={AD_UNITS.CHATS_BANNER}
        size={BannerAdSize.BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: false,
        }}
        onAdFailedToLoad={(error) => console.log('Chats Banner Ad Load Error:', error)}
        onAdLoaded={() => console.log('Chats Banner Ad Loaded')}
      />
    </View>
  );
}

// Initialize ads immediately
AdService.init();

export default AdService;
