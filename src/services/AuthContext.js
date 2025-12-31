import React, { createContext, useState, useEffect, useContext } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import RevenueCatService from './revenueCat';
import Purchases from 'react-native-purchases';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize RevenueCat
  useEffect(() => {
    RevenueCatService.init();
  }, []);

  // Listen to Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Identify user in RevenueCat
        try {
            await Purchases.logIn(currentUser.uid);
            await checkPremiumStatus(); // Sync status on login
        } catch (e) {
            console.error("RevenueCat login error:", e);
        }
      } else {
        setUserData(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Listen to User Data (Real-time)
  useEffect(() => {
    let unsubscribeSnapshot;

    if (user) {
      setLoading(true);
      const userDocRef = doc(db, 'users', user.uid);
      
      unsubscribeSnapshot = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          setUserData(docSnap.data());
        } else {
          setUserData(null);
        }
        setLoading(false);
      }, (error) => {
        console.error("Error listening to user data:", error);
        setLoading(false);
      });
    }

    return () => {
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
      }
    };
  }, [user]);

  const logout = async () => {
    await signOut(auth);
    await Purchases.logOut();
  };

  const refreshUserData = async () => {
    // No-op: Data is automatically updated via onSnapshot
  };

  const checkPremiumStatus = async () => {
      if (!auth.currentUser) return;
      
      const customerInfo = await RevenueCatService.getCustomerInfo();
      const isPremium = RevenueCatService.isPremium(customerInfo);
      
      // Sync with Firestore if different
      if (isPremium) {
          await updateDoc(doc(db, 'users', auth.currentUser.uid), {
              isPremium: true,
              premiumSince: new Date().toISOString() // Or keep existing
          });
      }
      // Note: If expired, we might want to set isPremium: false, but let's leave that logic for now
  };

  const upgradeToPremium = async () => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        isPremium: true,
        premiumSince: new Date().toISOString()
      });
      return true;
    } catch (error) {
      console.error("Error upgrading to premium:", error);
      throw error;
    }
  };

  const cancelPremium = async () => {
    // For IAP, we can't cancel via API, but we can update our local DB to reflect user choice
    // or guide them to the store.
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        isPremium: false,
        premiumSince: null
      });
      return true;
    } catch (error) {
      console.error("Error cancelling premium:", error);
      throw error;
    }
  };
  
  const restorePurchases = async () => {
      try {
          const customerInfo = await RevenueCatService.restorePurchases();
          if (RevenueCatService.isPremium(customerInfo)) {
              await upgradeToPremium();
              return true;
          }
          return false;
      } catch (e) {
          console.error("Restore error:", e);
          throw e;
      }
  };

  return (
    <AuthContext.Provider value={{ user, userData, loading, logout, refreshUserData, upgradeToPremium, cancelPremium, restorePurchases }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
