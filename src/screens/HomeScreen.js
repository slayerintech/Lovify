import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Animated, TouchableOpacity, Easing, Platform, StatusBar, ScrollView, Dimensions, Alert } from 'react-native';
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
import { INTERESTS_LIST } from '../data/constants';
import { getLocalImage } from '../utils/imageMap';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');
const GAP = 10;
const ITEM_WIDTH = (width - 40 - (GAP * 2)) / 3; // 40 is paddingHorizontal (20*2)

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

  useEffect(() => {
    // startHeartbeat();
  }, []);

  useEffect(() => {
    fetchProfiles();
  }, [user]);

  const fetchProfiles = async (reset = false) => {
    if (!user || !userData) return;
    try {
      let passedUserIds = [];
      // TEMPORARY: Commented out to show all users every time app restarts
      // if (!reset) {
      //   const likesSnapshot = await getDocs(collection(db, 'likes', user.uid, 'liked'));
      //   passedUserIds = likesSnapshot.docs.map(doc => doc.id);
      // }
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

      // Sort profiles: Dummy users first (top of stack)
      fetchedProfiles.sort((a, b) => {
        const isADummy = a.id.toString().startsWith('dummy_');
        const isBDummy = b.id.toString().startsWith('dummy_');

        if (isADummy && !isBDummy) return 1; // Dummy (a) > Real (b) -> a is placed after b (top of stack)
        if (!isADummy && isBDummy) return -1; // Real (a) < Dummy (b) -> a is placed before b
        return 0;
      });

      setProfiles(fetchedProfiles);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateDailySwipes = async () => {
    if (userData?.isPremium) return;
    try {
        const today = new Date().toDateString();
        const statsRef = doc(db, 'users', user.uid, 'dailyStats', today);
        
        // Use increment for atomic updates to avoid race conditions
        await setDoc(statsRef, { swipesCount: increment(1) }, { merge: true });
        
        console.log("Updated daily swipes count");
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
    await setDoc(doc(db, 'likes', user.uid, 'liked', userSwiped.id), { type: 'like', timestamp: serverTimestamp() });
    setProfiles(prev => prev.filter(p => p.id !== userSwiped.id));
    AdService.handleSwipe();
    updateDailySwipes();

    const likedBackSnapshot = await getDoc(doc(db, 'likes', userSwiped.id, 'liked', user.uid));
    if (likedBackSnapshot.exists() && likedBackSnapshot.data().type === 'like') {
      const matchData = { users: [user.uid, userSwiped.id], usersData: { [user.uid]: userData, [userSwiped.id]: userSwiped }, createdAt: serverTimestamp() };
      const matchRef = await addDoc(collection(db, 'matches'), matchData);
      setLastMatch({ ...userSwiped, matchId: matchRef.id });
      setMatchModalVisible(true);
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
      {/* iOS Futuristic Mesh Gradient Background */}
      <LinearGradient colors={['#0f0f0f', '#000000', '#1a0b12']} style={StyleSheet.absoluteFill} />
      
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
                <Text style={styles.noMoreText}>You've seen everyone!</Text>
                <Text style={styles.subText}>Upgrade to Premium to see more people and get unlimited swipes.</Text>
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
              <View style={styles.infoSection}>
                {currentProfile.job ? <Text style={styles.job}>{currentProfile.job}</Text> : null}
              </View>

              {/* Bio Section */}
              {currentProfile.bio ? (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>About Me</Text>
                  <View style={styles.resetButton}>
                    <BlurView intensity={50} tint="dark" style={styles.resetBlur}>
                      <Text style={[styles.resetButtonText, { lineHeight: 24, textTransform: 'none' }]}>{currentProfile.bio}</Text>
                    </BlurView>
                  </View>
                </View>
              ) : null}

              {/* Looking For Section */}
              {currentProfile.lookingFor ? (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Looking For</Text>
                  <View style={styles.interestsContainer}>
                    <View style={styles.resetButton}>
                      <BlurView intensity={50} tint="dark" style={styles.resetBlur}>
                         <View style={{flexDirection: 'row', alignItems: 'center'}}>
                           <Ionicons name="search-outline" size={16} color={THEME.text} style={{ marginRight: 8 }} />
                           <Text style={styles.resetButtonText}>{currentProfile.lookingFor}</Text>
                         </View>
                      </BlurView>
                    </View>
                  </View>
                </View>
              ) : null}

              {/* Interests Section */}
              {currentProfile.interests && currentProfile.interests.length > 0 ? (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Interests</Text>
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
                          style={{ width: ITEM_WIDTH, marginRight: 0, marginBottom: 0 }}
                        />
                      );
                    })}
                  </View>
                </View>
              ) : null}

              {/* Religion Section */}
              {currentProfile.religion ? (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Religion</Text>
                  <View style={styles.interestsContainer}>
                    <View style={styles.resetButton}>
                      <BlurView intensity={50} tint="dark" style={styles.resetBlur}>
                         <View style={{flexDirection: 'row', alignItems: 'center'}}>
                           <Ionicons name="book-outline" size={16} color={THEME.text} style={{ marginRight: 8 }} />
                           <Text style={styles.resetButtonText}>{currentProfile.religion}</Text>
                         </View>
                      </BlurView>
                    </View>
                  </View>
                </View>
              ) : null}

              {/* Other Details */}
              {currentProfile.gender ? (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Details</Text>
                  <View style={styles.interestsContainer}>
                    <GlassChip 
                      label={currentProfile.gender}
                      icon={currentProfile.gender.toLowerCase() === 'male' ? 'male-outline' : currentProfile.gender.toLowerCase() === 'female' ? 'female-outline' : 'person-outline'}
                      selected={true}
                      onPress={() => {}}
                      style={{ width: ITEM_WIDTH, marginRight: 0, marginBottom: 0 }}
                    />
                  </View>
                </View>
              ) : null}
            </View>
          )}
          
          {/* Spacer for bottom scrolling */}
          <View style={{ height: 100 }} />
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
    height: height * 0.75,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  detailsContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 40,
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
    color: THEME.text,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: THEME.secondaryText,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
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