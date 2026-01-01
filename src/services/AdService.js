import { RewardedAd, RewardedAdEventType, TestIds, BannerAd, BannerAdSize } from '../utils/AdMob';
import { View } from 'react-native';
import React from 'react';

// Use TestIds for development. 
// When you are ready for production, replace 'null' with your actual Ad Unit IDs from AdMob Console.
const PRODUCTION_AD_UNITS = {
  SAVE_PROFILE_REWARDED: 'ca-app-pub-7503400330650109/8632925567/xxxxxxxxxx',
  SWIPE_REWARDED: 'ca-app-pub-7503400330650109/8632925567',
  MATCHES_BANNER: 'ca-app-pub-7503400330650109/1931785849',
  CHATS_BANNER: 'ca-app-pub-7503400330650109/1931785849',
  CHAT_REWARDED: 'ca-app-pub-7503400330650109/8632925567', // Reusing rewarded ID
};

const AD_UNITS = {
  SAVE_PROFILE_REWARDED: PRODUCTION_AD_UNITS.SAVE_PROFILE_REWARDED || TestIds.REWARDED,
  SWIPE_REWARDED: PRODUCTION_AD_UNITS.SWIPE_REWARDED || TestIds.REWARDED,
  MATCHES_BANNER: PRODUCTION_AD_UNITS.MATCHES_BANNER || TestIds.BANNER,
  CHATS_BANNER: PRODUCTION_AD_UNITS.CHATS_BANNER || TestIds.BANNER,
  CHAT_REWARDED: PRODUCTION_AD_UNITS.CHAT_REWARDED || TestIds.REWARDED,
};

class AdService {
  static swipeCount = 0;
  static saveProfileAd = null;
  static swipeAd = null;
  static isSaveProfileAdLoaded = false;
  static isSwipeAdLoaded = false;

  static async init() {
    await initializeAds();
    this.loadSaveProfileAd();
    this.loadSwipeAd();
  }

  static loadSaveProfileAd() {
    // Create a new Rewarded Ad instance
    const rewarded = RewardedAd.createForAdRequest(AD_UNITS.SAVE_PROFILE_REWARDED, {
      requestNonPersonalizedAdsOnly: true,
    });

    rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
      this.isSaveProfileAdLoaded = true;
      this.saveProfileAd = rewarded;
      console.log('Save Profile Ad Loaded');
    });

    rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, (reward) => {
      console.log('User earned reward from Save Profile Ad', reward);
    });

    rewarded.load();
  }

  static loadSwipeAd() {
    const rewarded = RewardedAd.createForAdRequest(AD_UNITS.SWIPE_REWARDED, {
      requestNonPersonalizedAdsOnly: true,
    });

    rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
      this.isSwipeAdLoaded = true;
      this.swipeAd = rewarded;
      console.log('Swipe Ad Loaded');
    });

    rewarded.addAdEventListener(RewardedAdEventType.EARNED_REWARD, (reward) => {
      console.log('User earned reward from Swipe Ad', reward);
    });

    rewarded.load();
  }

  static async showSaveProfileAd() {
    if (this.isSaveProfileAdLoaded && this.saveProfileAd) {
      try {
        await this.saveProfileAd.show();
        // Reset and reload after showing
        this.saveProfileAd = null;
        this.isSaveProfileAdLoaded = false;
        this.loadSaveProfileAd();
        return true;
      } catch (error) {
        console.error('Error showing Save Profile Ad:', error);
        // Try to reload if it failed
        this.loadSaveProfileAd();
        return false;
      }
    } else {
      console.log('Save Profile Ad not ready yet');
      // Attempt to load for next time
      if (!this.saveProfileAd) this.loadSaveProfileAd();
      return false;
    }
  }

  static async showChatAd() {
    if (this.isChatAdLoaded && this.chatAd) {
      try {
        await this.chatAd.show();
        this.chatAd = null;
        this.isChatAdLoaded = false;
        this.loadChatAd();
        return true;
      } catch (error) {
        console.error('Error showing Chat Ad:', error);
        this.loadChatAd();
        return false;
      }
    } else {
      console.log('Chat Ad not ready yet');
      if (!this.chatAd) this.loadChatAd();
      return false;
    }
  }

  static async handleSwipe() {
    this.swipeCount++;
    console.log(`Swipe count: ${this.swipeCount}`);

    if (this.swipeCount % 5 === 0) {
      console.log('Triggering Swipe Ad');
      if (this.isSwipeAdLoaded && this.swipeAd) {
        try {
          await this.swipeAd.show();
          this.swipeAd = null;
          this.isSwipeAdLoaded = false;
          this.loadSwipeAd();
          return true;
        } catch (error) {
          console.error('Error showing Swipe Ad:', error);
          this.loadSwipeAd();
          return false;
        }
      } else {
        console.log('Swipe Ad not ready yet');
        if (!this.swipeAd) this.loadSwipeAd();
        return false;
      }
    }
    return false;
  }
}

// Banner Component helper
export function MatchesBanner() {
  return (
    <View style={{ alignItems: 'center', width: '100%' }}>
      <BannerAd
        unitId={AD_UNITS.MATCHES_BANNER}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
      />
    </View>
  );
}

export function ChatsBanner() {
  return (
    <View style={{ alignItems: 'center', width: '100%' }}>
      <BannerAd
        unitId={AD_UNITS.CHATS_BANNER}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
      />
    </View>
  );
}

// Initialize ads immediately
AdService.init();

export default AdService;
