import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
  TouchableOpacity,
  Easing,
  Platform,
  StatusBar,
  ScrollView,
  Dimensions,
  Alert,
  AppState
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur'; 
import { LinearGradient } from 'expo-linear-gradient'; 
import { collection, getDocs, query, where, doc, getDoc, setDoc, addDoc, serverTimestamp, increment } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../services/AuthContext';
import AdService from '../services/AdService';
import { TinderCard } from '../components/TinderCard';
import { MatchModal } from '../components/MatchModal';
import { PurchaseModal } from '../components/PurchaseModal';
import { AppHeader } from '../components/AppHeader';
import { GlassChip } from '../components/GlassChip';
import { INTERESTS_LIST, LOOKING_FOR_OPTIONS } from '../data/constants';
import { getLocalImage } from '../utils/imageMap';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

import StorageService from '../services/StorageService';

const { width, height } = Dimensions.get('window');
const GAP = 10;
const ITEM_WIDTH = (width - 24 - (GAP * 2)) / 3; // 24 is paddingHorizontal (12*2)

const THEME = {
  bg: '#000000',
  accent: '#FF2D55', 
  success: '#32D74B', 
  error: '#FF453A', 
  text: '#FFFFFF',
  secondaryText: '#8E8E93',
  glassBorder: 'rgba(255, 255, 255, 0.15)',
};

export default function HomeScreen() {
  const { user, userData, upgradeToPremium } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [matchModalVisible, setMatchModalVisible] = useState(false);
  const [lastMatch, setLastMatch] = useState(null);
  const [purchasing, setPurchasing] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const navigation = useNavigation();
  const topCardRef = useRef(null);

  const handlePurchase = () => {
    if (userData?.isPremium) {
        Alert.alert('Already Premium', 'You are already a Lovify Premium member!');
        return;
    }
    setShowPurchaseModal(true);
  };

  const confirmPurchase = async () => {
    setPurchasing(true);
    try {
        // Simulate a delay for the "Purchase" process
        await new Promise(resolve => setTimeout(resolve, 2000));
        await upgradeToPremium();
        setShowPurchaseModal(false);
        Alert.alert('Success', 'Welcome to Lovify Premium!');
    } catch (error) {
        Alert.alert('Error', 'Purchase failed. Please try again.');
    } finally {
        setPurchasing(false);
    }
  };

  // Get current top profile for details view
  const currentProfile = profiles.length > 0 ? profiles[profiles.length - 1] : null;

  const fetchProfiles = async (reset = false) => {
    if (!user || !userData) return;
    try {
      let passedUserIds = [];
      // To show all users again on reload or when stack is empty, 
      // we only exclude the current user.
      passedUserIds.push(user.uid);

      let q = query(collection(db, 'users'));

      const usersSnapshot = await getDocs(q);
      
      // Filter out self and already swiped users
      let fetchedProfiles = usersSnapshot.docs
        .map(doc => {
          const data = doc.data();
          const localImage = getLocalImage(doc.id);
          
          // Use local image if available, otherwise use data.photos (single string or array)
          let photos = [];
          if (localImage) {
            photos = [localImage];
          } else if (data.photo) {
             // Handle single photo string from EditProfileScreen
             photos = [data.photo];
          } else if (Array.isArray(data.photos) && data.photos.length > 0) {
             photos = data.photos;
          }
          
          return {
            id: doc.id,
            ...data,
            photos
          };
        })
        .filter(profile => !passedUserIds.includes(profile.id));

      // 1. First, Shuffle all profiles randomly
      for (let i = fetchedProfiles.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [fetchedProfiles[i], fetchedProfiles[j]] = [fetchedProfiles[j], fetchedProfiles[i]];
      }

      // 2. Then, Apply Priority Sort (Preferred gender first)
      // Since we already shuffled, users within the same priority will stay in random order
      fetchedProfiles.sort((a, b) => {
        const preferredGender = userData.gender === 'Male' ? 'Female' : (userData.gender === 'Female' ? 'Male' : null);
        
        // Priority 1: Preferred Gender
        const isAPreferred = preferredGender && a.gender === preferredGender;
        const isBPreferred = preferredGender && b.gender === preferredGender;

        if (isAPreferred && !isBPreferred) return 1; // a is placed after b (top of stack)
        if (!isAPreferred && isBPreferred) return -1;

        // Priority 2: Dummy Users (if gender is same or neither is preferred)
        const isADummy = a.id.toString().startsWith('dummy_');
        const isBDummy = b.id.toString().startsWith('dummy_');

        if (isADummy && !isBDummy) return 1;
        if (!isADummy && isBDummy) return -1;

        return 0;
      });

      setProfiles(fetchedProfiles);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Use useFocusEffect to refresh profiles only if stack is empty
  useFocusEffect(
    useCallback(() => {
      if (profiles.length === 0) {
        fetchProfiles();
      }
    }, [user, userData, profiles.length]) // Re-fetch only if empty
  );

  useEffect(() => {
    // Listener for app state changes (foreground/background)
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        // Only refresh if we have no profiles left to avoid jumping the stack
        if (profiles.length === 0) {
          console.log('App in foreground and stack empty, refreshing...');
          fetchProfiles();
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [user, userData, profiles.length]); // Re-subscribe if profiles length changes

  const updateDailySwipes = async () => {
    if (userData?.isPremium) return;
    try {
        const today = new Date().toDateString();
        const statsRef = doc(db, 'users', user.uid, 'dailyStats', today);
        
        // Use increment for atomic updates to avoid race conditions
        await setDoc(statsRef, { swipesCount: increment(1) }, { merge: true });
        
        console.log("Updated daily swipes count for " + today);
        
        // Debugging: Fetch current count to verify
        const snap = await getDoc(statsRef);
        if (snap.exists()) {
             const currentCount = snap.data().swipesCount;
             console.log("Current swipe count:", currentCount);
             
             // Force refresh logic for testing locked match
             if (currentCount >= 3) {
                 await StorageService.setForceRefreshMatches(user.uid, true);
                 console.log("Swipe threshold reached! Forcing locked match refresh.");
             }
        }
    } catch (e) {
        console.error("Error updating daily stats:", e);
        Alert.alert("Debug Error", "Stats update failed: " + e.message);
    }
  };

  const swipeLeft = async (cardIndex) => {
    const userSwiped = profiles[cardIndex];
    await setDoc(doc(db, 'likes', user.uid, 'liked', userSwiped.id), { type: 'dislike', timestamp: serverTimestamp() });
    setProfiles(prev => prev.filter(p => p.id !== userSwiped.id));
    AdService.handleSwipe();
    updateDailySwipes();
  };

  const swipeRight = async (cardIndex) => {
    const userSwiped = profiles[cardIndex];
    
    try {
      // 1. Save the like in the target user's "whoLikedMe" subcollection
      const targetUserLikesRef = doc(db, 'users', userSwiped.id, 'whoLikedMe', user.uid);
      await setDoc(targetUserLikesRef, {
        id: user.uid,
        name: userData.name,
        photo: userData.photo,
        age: userData.age,
        timestamp: serverTimestamp()
      });

      // 2. Save in the current user's "liked" collection (as before)
      await setDoc(doc(db, 'likes', user.uid, 'liked', userSwiped.id), { type: 'like', timestamp: serverTimestamp() });
      
      setProfiles(prev => prev.filter(p => p.id !== userSwiped.id));
      AdService.handleSwipe();
      updateDailySwipes();

      // 3. Check for a mutual match
      const likedBackSnapshot = await getDoc(doc(db, 'likes', userSwiped.id, 'liked', user.uid));
      if (likedBackSnapshot.exists() && likedBackSnapshot.data().type === 'like') {
        const matchData = { users: [user.uid, userSwiped.id], usersData: { [user.uid]: userData, [userSwiped.id]: userSwiped }, createdAt: serverTimestamp() };
        const matchRef = await addDoc(collection(db, 'matches'), matchData);
        setLastMatch({ ...userSwiped, matchId: matchRef.id });
        setMatchModalVisible(true);
      }
    } catch (error) {
      console.error("Error in swipeRight:", error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={THEME.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      {/* Mesh Gradient Background - Simplified to solid black at the bottom */}
      <LinearGradient colors={['#0f0f0f', '#000000', '#000000']} style={StyleSheet.absoluteFill} />
      
      <SafeAreaView style={styles.safeArea}>
        
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={[styles.scrollContent, { paddingTop: 50}]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.cardsContainer}>
            {profiles.length > 0 ? (
              profiles.map((profile, index) => {
                // Optimization: Only render the top 2 cards to reduce lag
                const isTop = index === profiles.length - 1;
                const isSecond = index === profiles.length - 2;
                
                if (!isTop && !isSecond) return null;

                return (
                  <TinderCard
                    ref={isTop ? topCardRef : null}
                    key={profile.id}
                    user={profile}
                    active={isTop} // Pass active state for idle animation
                    onSwipeLeft={() => swipeLeft(index)}
                    onSwipeRight={() => swipeRight(index)}
                  />
                );
              }) 
            ) : (
              <View style={styles.noMoreCards}>
                <BlurView intensity={20} tint="light" style={styles.emptyCircle}>
                   <Ionicons name="diamond-outline" size={50} color={THEME.accent} />
                </BlurView>
                <Text style={styles.noMoreText}>Unlock More Profiles!</Text>
                <Text style={styles.subText}>Get Lovify Premium to discover more people and enjoy unlimited swipes.</Text>
                <TouchableOpacity 
                  activeOpacity={0.9}
                  onPress={handlePurchase}
                  disabled={purchasing}
                >
                  <LinearGradient
                    colors={userData?.isPremium ? ['#32D74B', '#28A745'] : ['#FF2D55', '#FFA500']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.upgradeButton}
                  >
                     <Text style={styles.upgradeButtonText}>
                       {purchasing ? 'PROCESSING...' : (userData?.isPremium ? 'PREMIUM ACTIVE' : 'UPGRADE TO PRO')}
                     </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Details Section for Current Profile */}
          {currentProfile && (
            <View style={styles.detailsContainer}>
              {/* Job Title and Bio removed as they are on the card */}

              {/* Looking For Section */}
              {currentProfile.lookingFor ? (
                <View style={[styles.section, { padding: 0, backgroundColor: 'transparent', borderWidth: 0, marginBottom: 12 }]}>
                  <View style={styles.lookingForWrapper}>
                    <View style={[styles.resetButton, { flex: 1, borderWidth: 1.5, borderColor: 'rgba(255, 45, 85, 0.4)', backgroundColor: 'rgba(255, 45, 85, 0.05)' }]}>
                      <BlurView intensity={30} tint="dark" style={{ overflow: 'hidden' }}>
                        <LinearGradient
                          colors={['rgba(255, 45, 85, 0.2)', 'rgba(255, 45, 85, 0.05)']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={{ paddingHorizontal: 15, paddingVertical: 12 }}
                        >
                           <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start'}}>
                             <Ionicons 
                               name={LOOKING_FOR_OPTIONS.find(opt => opt.label === currentProfile.lookingFor)?.icon || "search-outline"} 
                               size={26} 
                               color={THEME.accent} 
                               style={{ marginRight: 14 }} 
                             />
                             <Text style={[styles.resetButtonText, { fontSize: 16, fontWeight: '800', color: '#fff' }]}>{currentProfile.lookingFor}</Text>
                           </View>
                        </LinearGradient>
                      </BlurView>
                    </View>
                    <TouchableOpacity 
                      activeOpacity={0.8}
                      onPress={() => handlePurchase()}
                      style={styles.chatIconButton}
                    >
                      <LinearGradient
                        colors={['#FF2D55', '#FF375F']}
                        style={styles.chatIconGradient}
                      >
                        <Ionicons name="chatbubbles" size={22} color="#fff" />
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : null}

              {/* Interests Section */}
              {currentProfile.interests && currentProfile.interests.length > 0 ? (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="sparkles-outline" size={18} color="#FFD700" style={styles.sectionIcon} />
                    <Text style={styles.sectionTitle}>Interests</Text>
                  </View>
                  <View style={styles.interestsContainer}>
                    {currentProfile.interests.map((interest, index) => {
                      const interestItem = INTERESTS_LIST.find(item => item.label === interest);
                      const icon = interestItem ? interestItem.icon : 'star-outline';
                      return (
                        <GlassChip 
                          key={index}
                          label={interest}
                          icon={icon}
                          selected={true}
                          onPress={() => {}}
                          style={{ width: ITEM_WIDTH, marginRight: 0, marginBottom: 0, height: 48, borderRadius: 16 }}
                          gradientColors={['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.05)']}
                          borderColor="rgba(255, 255, 255, 0.2)"
                        />
                      );
                    })}
                  </View>
                </View>
              ) : null}

              {/* Religion Section */}
              {currentProfile.religion ? (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="leaf-outline" size={18} color="#32D74B" style={styles.sectionIcon} />
                    <Text style={styles.sectionTitle}>Religion</Text>
                  </View>
                  <View style={styles.interestsContainer}>
                    <View style={[styles.resetButton, { flex: 1, borderWidth: 1.5, borderColor: 'rgba(50, 215, 75, 0.4)', backgroundColor: 'rgba(50, 215, 75, 0.05)' }]}>
                      <BlurView intensity={30} tint="dark" style={{ overflow: 'hidden' }}>
                        <LinearGradient
                          colors={['rgba(50, 215, 75, 0.2)', 'rgba(50, 215, 75, 0.05)']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={{ paddingHorizontal: 15, paddingVertical: 12 }}
                        >
                           <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start'}}>
                             <Ionicons name="book-outline" size={26} color="#32D74B" style={{ marginRight: 14 }} />
                             <Text style={[styles.resetButtonText, { fontSize: 16, fontWeight: '800', color: '#fff' }]}>{currentProfile.religion}</Text>
                           </View>
                        </LinearGradient>
                      </BlurView>
                    </View>
                  </View>
                </View>
              ) : null}

              {/* Other Details Section */}
              {currentProfile.gender ? (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="person-outline" size={18} color="#0A84FF" style={styles.sectionIcon} />
                    <Text style={styles.sectionTitle}>Gender</Text>
                  </View>
                  <View style={styles.interestsContainer}>
                    <GlassChip 
                      label={currentProfile.gender}
                      icon={currentProfile.gender.toLowerCase() === 'male' ? 'male-outline' : currentProfile.gender.toLowerCase() === 'female' ? 'female-outline' : 'person-outline'}
                      selected={true}
                      onPress={() => {}}
                      style={{ width: ITEM_WIDTH, marginRight: 0, marginBottom: 0, height: 48, borderRadius: 16 }}
                      gradientColors={['rgba(10, 132, 255, 0.2)', 'rgba(10, 132, 255, 0.1)']}
                      borderColor="rgba(10, 132, 255, 0.3)"
                    />
                  </View>
                </View>
              ) : null}
            </View>
          )}
          
          {/* Spacer for bottom scrolling removed as padding handles it */}
        </ScrollView>

        {/* Tinder-like Header */}
        <AppHeader onPress={() => fetchProfiles()} style={styles.header} />
      </SafeAreaView>

      <MatchModal
        visible={matchModalVisible}
        currentUser={userData}
        matchedUser={lastMatch}
        onClose={() => setMatchModalVisible(false)}
        onChat={() => {
          setMatchModalVisible(false);
          navigation.navigate('Conversation', { matchId: lastMatch.matchId, user: lastMatch });
        }}
      />

      <PurchaseModal 
        visible={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        onPurchase={confirmPurchase}
        processing={purchasing}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  cardsContainer: {
      height: height * 0.72,
      width: width,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 10, // Added small margin to show top corner radius
    },
  scrollView: {
    flex: 1,
    marginBottom: Platform.OS === 'ios' ? 105 : 83,
  },
  scrollContent: {
    flexGrow: 1,
  },
  detailsContainer: {
    paddingHorizontal: 12, 
    paddingTop: 0, 
    paddingBottom: 10, 
    marginTop: 20, // Increased from -10 to create space below the card
  },
  infoSection: {
    marginBottom: 20,
  },
  name: {
    fontSize: 32,
    fontWeight: 'bold',
    color: THEME.text,
  },
  job: {
    fontSize: 22,
    fontWeight: 'bold',
    color: THEME.secondaryText,
    marginTop: 4,
  },
  section: {
    marginBottom: 12, // Reduced from 20
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 24,
    padding: 12, 
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center', 
    marginBottom: 12,
    gap: 8,
  },
  lookingForWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  chatIconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    shadowColor: '#FF2D55',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  chatIconGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: THEME.secondaryText,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  sectionIcon: {
    opacity: 0.6,
  },
  bioText: {
    fontSize: 16,
    color: THEME.text,
    lineHeight: 24,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'flex-start',
    paddingHorizontal: 0,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: 'rgba(255, 45, 85, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 45, 85, 0.3)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipText: {
    color: THEME.accent,
    fontSize: 14,
    fontWeight: '600',
  },
  detailItems: {
    gap: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailText: {
    fontSize: 16,
    color: THEME.text,
  },
  noMoreCards: {
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  emptyCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: THEME.glassBorder,
    overflow: 'hidden',
  },
  noMoreText: {
    color: THEME.secondaryText,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 25,
    letterSpacing: -0.5,
  },
  subText: {
    color: THEME.secondaryText,
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
    marginBottom: 30,
    lineHeight: 20,
  },
  resetButton: {
    borderRadius: 25,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: THEME.glassBorder,
  },
  resetBlur: {
    paddingVertical: 14,
    paddingHorizontal: 30,
  },
  resetButtonText: {
    color: THEME.text,
    fontSize: 16,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  upgradeButton: {
    borderRadius: 30,
    paddingVertical: 14,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  upgradeButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});