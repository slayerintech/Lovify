import { initializeApp, getApp, getApps } from 'firebase/app';
// Import compat/auth to ensure component registration happens globally
// This is a workaround for "Component auth has not been registered yet" in Expo/Metro
import 'firebase/compat/auth';
import 'firebase/auth';
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Replace these with your actual Firebase configuration
export const firebaseConfig = {
  apiKey: "AIzaSyAitYrMK973b9K7iFa6g9DDBwUxDtzyoaw",
  authDomain: "lovify-2fa76.firebaseapp.com",
  projectId: "lovify-2fa76",
  storageBucket: "lovify-2fa76.firebasestorage.app",
  messagingSenderId: "1014322922040",
  appId: "1:1014322922040:web:2def46a4b19bfe6a5c9ccd",
  measurementId: "G-GPY3ZEZM6N"
};

let app;
let auth;
let db;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
  db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
  });
} else {
  app = getApp();
  auth = getAuth(app);
  db = getFirestore(app);
}

const storage = getStorage(app);

export { auth, db, storage };
