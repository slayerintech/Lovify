import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, Animated, TouchableOpacity, Easing, Platform, StatusBar, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur'; 
import { LinearGradient } from 'expo-linear-gradient'; 
import { collection, query, where, getDocs, doc, setDoc, getDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../services/AuthContext';
import { TinderCard } from '../components/TinderCard';
import { MatchModal } from '../components/MatchModal';
import { AppHeader } from '../components/AppHeader';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

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
  const { user, userData } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [matchModalVisible, setMatchModalVisible] = useState(false);
  const [lastMatch, setLastMatch] = useState(null);
  const navigation = useNavigation();
  const topCardRef = useRef(null);

  // Get current top profile for details view
  const currentProfile = profiles.length > 0 ? profiles[profiles.length - 1] : null;

  useEffect(() => {
    // startHeartbeat();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchProfiles();
    }, [user, userData])
  );

  const fetchProfiles = async (reset = false) => {
    if (!user || !userData) return;
    try {
      let passedUserIds = [];
      if (!reset) {
        const likesSnapshot = await getDocs(collection(db, 'likes', user.uid, 'liked'));
        passedUserIds = likesSnapshot.docs.map(doc => doc.id);
      }
      passedUserIds.push(user.uid);

      let q = userData.interestedIn === 'both' 
        ? query(collection(db, 'users')) 
        : query(collection(db, 'users'), where('gender', '==', userData.interestedIn));

      const usersSnapshot = await getDocs(q);
      const fetchedProfiles = usersSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((profile) => !passedUserIds.includes(profile.id));

      setProfiles(fetchedProfiles);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const swipeLeft = async (cardIndex) => {
    const userSwiped = profiles[cardIndex];
    await setDoc(doc(db, 'likes', user.uid, 'liked', userSwiped.id), { type: 'dislike', timestamp: serverTimestamp() });
    setProfiles(prev => prev.filter(p => p.id !== userSwiped.id));
  };

  const swipeRight = async (cardIndex) => {
    const userSwiped = profiles[cardIndex];
    await setDoc(doc(db, 'likes', user.uid, 'liked', userSwiped.id), { type: 'like', timestamp: serverTimestamp() });
    setProfiles(prev => prev.filter(p => p.id !== userSwiped.id));
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
        {/* Tinder-like Header */}
        <AppHeader onPress={() => fetchProfiles()} />
        
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.cardsContainer}>
            {profiles.length > 0 ? (
              profiles.map((profile, index) => {
                const isTop = index === profiles.length - 1;
                return (
                  <TinderCard
                    ref={isTop ? topCardRef : null}
                    key={profile.id}
                    user={profile}
                    onSwipeLeft={() => swipeLeft(index)}
                    onSwipeRight={() => swipeRight(index)}
                  />
                );
              }).reverse() 
            ) : (
              <View style={styles.noMoreCards}>
                <BlurView intensity={20} tint="light" style={styles.emptyCircle}>
                   <Ionicons name="sparkles" size={50} color={THEME.accent} />
                </BlurView>
                <Text style={styles.noMoreText}>End of the world...</Text>
                <TouchableOpacity 
                  style={styles.resetButton}
                  onPress={() => { setLoading(true); fetchProfiles(true); }}
                >
                  <BlurView intensity={50} tint="dark" style={styles.resetBlur}>
                     <Text style={styles.resetButtonText}>Refresh Universe</Text>
                  </BlurView>
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
                  <Text style={styles.bioText}>{currentProfile.bio}</Text>
                </View>
              ) : null}

              {/* Interests Section */}
              {currentProfile.interests && currentProfile.interests.length > 0 ? (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Interests</Text>
                  <View style={styles.chipContainer}>
                    {currentProfile.interests.map((interest, index) => (
                      <View key={index} style={styles.chip}>
                        <Text style={styles.chipText}>{interest}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}

              {/* Other Details */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Details</Text>
                <View style={styles.detailItems}>
                  {currentProfile.lookingFor ? (
                    <View style={styles.detailItem}>
                      <Ionicons name="search-outline" size={20} color={THEME.secondaryText} />
                      <Text style={styles.detailText}>{currentProfile.lookingFor}</Text>
                    </View>
                  ) : null}
                  
                  {currentProfile.religion ? (
                    <View style={styles.detailItem}>
                      <Ionicons name="book-outline" size={20} color={THEME.secondaryText} />
                      <Text style={styles.detailText}>{currentProfile.religion}</Text>
                    </View>
                  ) : null}

                  {currentProfile.gender ? (
                    <View style={styles.detailItem}>
                      <Ionicons name="person-outline" size={20} color={THEME.secondaryText} />
                      <Text style={styles.detailText}>{currentProfile.gender}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </View>
          )}
          
          {/* Spacer for bottom scrolling */}
          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>

      <MatchModal
        visible={matchModalVisible}
        currentUser={userData}
        matchedUser={lastMatch}
        onClose={() => setMatchModalVisible(false)}
        onChat={() => {
          setMatchModalVisible(false);
          navigation.navigate('Chat', { matchId: lastMatch.matchId, user: lastMatch });
        }}
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
    fontSize: 18,
    color: THEME.secondaryText,
    marginTop: 4,
    fontWeight: '500',
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
});