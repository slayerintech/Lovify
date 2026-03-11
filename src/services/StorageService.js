import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Professional Storage Service Wrapper
 * Handles JSON parsing, error logging, and type safety.
 */
class StorageService {
  /**
   * Store a value in AsyncStorage
   * @param {string} key 
   * @param {any} value - Will be stringified if it's an object
   */
  static async set(key, value) {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      await AsyncStorage.setItem(key, stringValue);
      return true;
    } catch (error) {
      console.error(`[StorageService] Error saving key "${key}":`, error);
      return false;
    }
  }

  /**
   * Get a value from AsyncStorage
   * @param {string} key 
   * @param {boolean} isObject - Whether to parse the result as JSON
   */
  static async get(key, isObject = false) {
    try {
      const value = await AsyncStorage.getItem(key);
      if (value === null) return null;
      return isObject ? JSON.parse(value) : value;
    } catch (error) {
      console.error(`[StorageService] Error reading key "${key}":`, error);
      return null;
    }
  }

  /**
   * Remove an item from AsyncStorage
   * @param {string} key 
   */
  static async remove(key) {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`[StorageService] Error removing key "${key}":`, error);
      return false;
    }
  }

  /**
   * Clear all app storage (use with caution)
   */
  static async clearAll() {
    try {
      await AsyncStorage.clear();
      return true;
    } catch (error) {
      console.error('[StorageService] Error clearing all storage:', error);
      return false;
    }
  }

  // --- Specific App Keys Helpers ---

  static async setHasVisitedMatches(userId) {
    return this.set(`hasVisitedMatches_${userId}`, 'true');
  }

  static async getHasVisitedMatches(userId) {
    return this.get(`hasVisitedMatches_${userId}`);
  }

  static async setForceRefreshMatches(userId, value) {
    return this.set(`forceRefreshMatches_${userId}`, value ? 'true' : 'false');
  }

  static async getForceRefreshMatches(userId) {
    const val = await this.get(`forceRefreshMatches_${userId}`);
    return val === 'true';
  }
}

export default StorageService;
