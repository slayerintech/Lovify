import { db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import Constants from 'expo-constants';

class UpdateService {
  // Current version from app.json
  static CURRENT_VERSION_CODE = 18;
  static CURRENT_VERSION_NAME = '1.0.3';

  /**
   * Check if an update is required
   * @returns {Promise<{updateRequired: boolean, forced: boolean, latestVersion: string, storeUrl: string}>}
   */
  static async checkUpdate() {
    try {
      const configDoc = await getDoc(doc(db, 'app_config', 'android_update'));
      
      if (!configDoc.exists()) {
        console.log('UpdateService: No update config found in Firestore.');
        return { updateRequired: false };
      }

      const data = configDoc.data();
      const latestVersionCode = data.latestVersionCode || 0;
      const minRequiredVersionCode = data.minRequiredVersionCode || 0;
      const storeUrl = data.storeUrl || 'https://play.google.com/store/apps/details?id=com.slayer.lovify';

      const updateRequired = latestVersionCode > UpdateService.CURRENT_VERSION_CODE;
      const forced = minRequiredVersionCode > UpdateService.CURRENT_VERSION_CODE;

      return {
        updateRequired,
        forced,
        latestVersion: data.latestVersionName || '1.0.0',
        storeUrl,
        releaseNotes: data.releaseNotes || 'We have improved the app for you!'
      };
    } catch (error) {
      console.error('UpdateService Error:', error);
      return { updateRequired: false };
    }
  }
}

export default UpdateService;
