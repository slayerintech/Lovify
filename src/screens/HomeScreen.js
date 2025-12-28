import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, Animated, TouchableOpacity, Easing, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur'; 
import { LinearGradient } from 'expo-linear-gradient'; 
import { collection, query, where, getDocs, doc, setDoc, getDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../services/AuthContext';
import { TinderCard } from '../components/TinderCard';
import { MatchModal } from '../components/MatchModal';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

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
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const topCardRef = useRef(null);

  useEffect(() => {
    startHeartbeat();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchProfiles();
    }, [user, userData])
  );

  const startHeartbeat = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  };

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
        {/* Frosted Glass Header */}
        <View style={styles.headerContainer}>
          <BlurView intensity={30} tint="dark" style={styles.headerBlur}>
            <TouchableOpacity style={styles.header} onPress={() => fetchProfiles()} activeOpacity={0.7}>
              <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                <LinearGradient colors={[THEME.accent, '#ff5e7d']} style={styles.logoCircle}>
                  <Ionicons name="heart" size={24} color="white" />
                </LinearGradient>
              </Animated.View>
              <Text style={styles.logoText}>Lovify</Text>
            </TouchableOpacity>
          </BlurView>
        </View>
        
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

        {profiles.length > 0 && (
          <View style={styles.buttonsContainer}>
            <TouchableOpacity 
              style={[styles.glassButton, styles.shadowRed]} 
              onPress={() => topCardRef.current?.swipeLeft()}
            >
              <BlurView intensity={40} tint="light" style={styles.buttonIconBg}>
                <Ionicons name="close" size={36} color={THEME.error} />
              </BlurView>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.glassButton, styles.shadowGreen]} 
              onPress={() => topCardRef.current?.swipeRight()}
            >
              <BlurView intensity={40} tint="light" style={styles.buttonIconBg}>
                <Ionicons name="heart" size={36} color={THEME.success} />
              </BlurView>
            </TouchableOpacity>
          </View>
        )}
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
  headerContainer: {
    marginHorizontal: 20,
    marginTop: Platform.OS === 'android' ? 40 : 10,
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: THEME.glassBorder,
  },
  headerBlur: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: THEME.accent,
    shadowRadius: 10,
    shadowOpacity: 0.5,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '900',
    color: THEME.text,
    marginLeft: 12,
    letterSpacing: -1,
  },
  cardsContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
    paddingBottom: 40,
  },
  glassButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: THEME.glassBorder,
  },
  buttonIconBg: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shadowRed: {
    shadowColor: THEME.error,
    shadowRadius: 20,
    shadowOpacity: 0.4,
    elevation: 15,
  },
  shadowGreen: {
    shadowColor: THEME.success,
    shadowRadius: 20,
    shadowOpacity: 0.4,
    elevation: 15,
  },
  noMoreCards: {
    alignItems: 'center',
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