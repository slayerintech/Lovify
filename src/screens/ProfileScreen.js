import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, Alert, Dimensions, StatusBar, TouchableOpacity, Platform, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../services/AuthContext';
import { GlassButton } from '../components/GlassButton';
import { PurchaseModal } from '../components/PurchaseModal';
import { COLORS } from '../styles/theme';
import { useNavigation } from '@react-navigation/native';
import { deleteUser } from 'firebase/auth';
import { doc, deleteDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AdService, { ChatsBanner } from '../services/AdService';

const { width, height } = Dimensions.get('window');

const PerkItem = ({ icon, text }) => (
  <View style={styles.perkItem}>
    <View style={styles.perkIconCircle}>
      <Ionicons name={icon} size={16} color="#FFD700" />
    </View>
    <Text style={styles.perkText}>{text}</Text>
  </View>
);

export default function ProfileScreen() {
  const { user, userData, logout, upgradeToPremium, cancelPremium } = useAuth();
  const navigation = useNavigation();
  const [purchasing, setPurchasing] = React.useState(false);
  const [cancelling, setCancelling] = React.useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = React.useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [matchesCount, setMatchesCount] = useState(0);
  const ripple1 = React.useRef(new Animated.Value(0)).current;
  const ripple2 = React.useRef(new Animated.Value(0)).current;
  const ripple3 = React.useRef(new Animated.Value(0)).current;

  // Gender-based theme color
  const getGenderColor = () => {
    if (userData?.isPremium) return ['#FFD700', 'rgba(255, 165, 0, 0.2)'];
    if (userData?.gender === 'Female') return ['#FF2D55', 'rgba(255, 55, 95, 0.2)'];
    return ['#0A84FF', 'rgba(10, 132, 255, 0.2)']; // Default for Male/Other
  };

  const getAvatarBorderColor = () => {
    if (userData?.isPremium) return ['#FFD700', '#FFA500'];
    if (userData?.gender === 'Female') return ['#FF2D55', '#FF375F'];
    return ['#0A84FF', '#5AC8FA']; // Default for Male/Other
  };

  const getHeaderGlowColor = () => {
    if (userData?.isPremium) return ['rgba(255, 215, 0, 0.12)', 'transparent'];
    if (userData?.gender === 'Female') return ['rgba(255, 45, 85, 0.12)', 'transparent'];
    return ['rgba(10, 132, 255, 0.12)', 'transparent']; // Default for Male/Other
  };

  useEffect(() => {
    // Gen Z style triple ripple animation
    const createRipple = (anim, delay) => {
      return Animated.sequence([
        Animated.delay(delay),
        Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: 1,
              duration: 4000,
              easing: Easing.bezier(0.25, 0.1, 0.25, 1),
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0,
              duration: 0,
              useNativeDriver: true,
            }),
          ])
        ),
      ]);
    };

    createRipple(ripple1, 0).start();
    createRipple(ripple2, 1000).start();
    createRipple(ripple3, 2000).start();

    if (!user) return;

    // Sync premium status with AdService
    AdService.setPremiumStatus(userData?.isPremium);

    // 1. Fetch real-time Likes Count (Who Liked Me)
    const likesQuery = collection(db, 'users', user.uid, 'whoLikedMe');
    const unsubscribeLikes = onSnapshot(likesQuery, (snapshot) => {
      setLikesCount(snapshot.size);
    });

    // 2. Fetch real-time Matches Count
    const matchesQuery = query(collection(db, 'matches'), where('users', 'array-contains', user.uid));
    const unsubscribeMatches = onSnapshot(matchesQuery, (snapshot) => {
      setMatchesCount(snapshot.size);
    });

    return () => {
      unsubscribeLikes();
      unsubscribeMatches();
    };
  }, [user]);

  const handlePurchase = () => {
    if (userData?.isPremium) return;
    setShowPurchaseModal(true);
  };

  const handleCancelSubscription = () => {
    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel your Lovify Premium subscription?',
      [
        { text: 'Keep', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              await cancelPremium();
              Alert.alert('Subscription Removed');
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel.');
            } finally {
              setCancelling(false);
            }
          }
        }
      ]
    );
  };

  const confirmPurchase = async () => {
    setPurchasing(true);
    try {
        await upgradeToPremium();
        setShowPurchaseModal(false);
        Alert.alert('Success', 'Welcome to Lovify Premium!');
    } catch (error) {
        Alert.alert('Error', 'Purchase failed.');
    } finally {
        setPurchasing(false);
    }
  };

  const menuItems = [
    { id: 'privacy', label: 'Privacy Policy', icon: 'lock-closed-outline', color: '#0A84FF', onPress: () => navigation.navigate('PrivacyPolicy') },
  ];

  const renderMenuItem = (item) => (
    <TouchableOpacity 
      key={item.id}
      onPress={item.onPress}
      activeOpacity={0.7}
      style={styles.menuItemWrapper}
    >
      <BlurView intensity={20} tint="dark" style={styles.menuItemBlur}>
        <View style={[styles.menuIconCircle, { backgroundColor: item.color + '20' }]}>
          <Ionicons name={item.icon} size={20} color={item.color} />
        </View>
        <Text style={styles.menuItemText}>{item.label}</Text>
        <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.3)" />
      </BlurView>
    </TouchableOpacity>
  );

  if (!userData) return null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <LinearGradient 
        colors={['#0f0f0f', '#000000', '#1a0b12']} 
        style={StyleSheet.absoluteFill} 
      />
      
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.content} 
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section Background Blurred Image */}
        <View style={styles.headerBgWrapper} pointerEvents="none">
          {userData?.photo || (userData?.photos && userData?.photos[0]) ? (
            <Image 
              source={{ uri: userData?.photo || userData?.photos[0] }} 
              style={styles.headerBgImage} 
              blurRadius={Platform.OS === 'ios' ? 60 : 30}
            />
          ) : null}
          <LinearGradient
            colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.8)', '#000000']}
            style={StyleSheet.absoluteFill}
            locations={[0, 0.5, 0.8, 1]}
          />
          <LinearGradient
            colors={getHeaderGlowColor()}
            style={styles.headerBgGlow}
          />
        </View>

        {/* Header Section */}
        <View style={styles.headerSection}>
          <TouchableOpacity 
            onPress={logout}
            activeOpacity={0.7}
            style={styles.topRightButton}
          >
            <BlurView intensity={15} tint="light" style={styles.editButtonBlur}>
              <Ionicons name="log-out-outline" size={22} color="#fff" />
            </BlurView>
          </TouchableOpacity>

          <View style={styles.avatarContainer}>
            {[ripple1, ripple2, ripple3].map((anim, idx) => (
              <Animated.View
                key={idx}
                style={[
                  styles.avatarGlow,
                  {
                    transform: [{
                      scale: anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 2.2]
                      })
                    }],
                    opacity: anim.interpolate({
                      inputRange: [0, 0.2, 1],
                      outputRange: [0, 0.4, 0]
                    })
                  }
                ]}
              >
                <LinearGradient
                  colors={getGenderColor()}
                  style={StyleSheet.absoluteFill}
                />
              </Animated.View>
            ))}
            <LinearGradient
              colors={getAvatarBorderColor()}
              style={styles.avatarInner}
            >
              {userData.photo || (userData.photos && userData.photos[0]) ? (
                <Image 
                  source={{ uri: userData.photo || (userData.photos && userData.photos[0]) }} 
                  style={styles.avatarMain} 
                />
              ) : (
                <View style={[styles.avatarMain, styles.placeholderAvatar]}>
                  <Ionicons name="person" size={50} color="rgba(255,255,255,0.2)" />
                </View>
              )}
            </LinearGradient>
            <View style={styles.onlineBadge} />
          </View>

          <View style={styles.headerInfo}>
              <BlurView intensity={10} tint="light" style={styles.nameBadgeWrapper}>
                <Text style={styles.profileName}>{userData.name}, {userData.age}</Text>
              </BlurView>
              
              <TouchableOpacity 
                onPress={() => navigation.navigate('EditProfile')}
                activeOpacity={0.7}
                style={styles.editButtonWrapper}
              >
                <BlurView intensity={15} tint="light" style={styles.editButtonBlur}>
                  <Ionicons name="pencil" size={20} color="#fff" />
                </BlurView>
              </TouchableOpacity>
            </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsContainer}>
          <BlurView intensity={15} tint="dark" style={styles.statCard}>
            <Ionicons name="heart" size={20} color="#FF2D55" />
            <Text style={styles.statValue}>{likesCount}</Text>
            <Text style={styles.statLabel}>Likes</Text>
          </BlurView>
          <BlurView intensity={15} tint="dark" style={styles.statCard}>
            <Ionicons name="flame" size={20} color="#FF9500" />
            <Text style={styles.statValue}>{matchesCount}</Text>
            <Text style={styles.statLabel}>Matches</Text>
          </BlurView>
          <BlurView intensity={15} tint="dark" style={styles.statCard}>
            <Ionicons name="star" size={20} color="#FFD60A" />
            <Text style={styles.statValue}>{userData.isPremium ? 'Gold' : 'Free'}</Text>
            <Text style={styles.statLabel}>Status</Text>
          </BlurView>
        </View>

        {/* Premium Section */}
        <View style={styles.premiumSection}>
          {userData?.isPremium ? (
              <BlurView intensity={50} tint="light" style={styles.activePremiumCard}>
                <LinearGradient
                  colors={['rgba(255, 215, 0, 0.2)', 'rgba(255, 215, 0, 0.05)']}
                  style={styles.activePremiumGradient}
                >
                <View style={styles.activeHeader}>
                  <View style={styles.goldCircle}>
                    <Ionicons name="diamond" size={24} color="#FFD700" />
                  </View>
                  <View>
                    <Text style={styles.activePremiumTitle}>Lovify Premium Active</Text>
                    <Text style={styles.activePremiumDesc}>All features unlocked</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={handleCancelSubscription} style={styles.manageBtn}>
                  <Text style={styles.manageBtnText}>Manage Subscription</Text>
                  <Ionicons name="chevron-forward" size={16} color="#FFD700" />
                </TouchableOpacity>
              </LinearGradient>
            </BlurView>
          ) : (
            <BlurView intensity={40} tint="dark" style={styles.premiumCard}>
              <LinearGradient
                colors={['rgba(255, 215, 0, 0.05)', 'transparent']}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.premiumHeader}>
                <View>
                  <Text style={styles.premiumTitle}>Lovify Gold</Text>
                  <Text style={styles.premiumSubtitle}>Get all premium features</Text>
                </View>
                <LinearGradient
                  colors={['#FFD700', '#FFA500']}
                  style={styles.proBadge}
                >
                  <Text style={styles.proText}>PRO</Text>
                </LinearGradient>
              </View>

              <View style={styles.perksContainer}>
                <PerkItem icon="heart-circle" text="See who likes you" />
                <PerkItem icon="flash" text="Unlimited Likes" />
                <PerkItem icon="star" text="5 Super Likes a week" />
              </View>

              <TouchableOpacity 
                activeOpacity={0.8} 
                onPress={handlePurchase}
                style={styles.upgradeButton}
              >
                <LinearGradient
                  colors={['#FFD700', '#FFA500']}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
                <Text style={styles.upgradeButtonText}>Upgrade Now</Text>
              </TouchableOpacity>
            </BlurView>
          )}
          </View>

          {/* Banner Ad Section */}
          {!userData?.isPremium && (
            <View style={styles.adContainer}>
              <ChatsBanner />
            </View>
          )}

          {/* Menu Section */}
        <View style={styles.menuSection}>
          <Text style={styles.menuTitle}>Account Settings</Text>
          {menuItems.map(renderMenuItem)}
        </View>
      </ScrollView>

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
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    marginBottom: Platform.OS === 'ios' ? 105 : 83,
  },
  content: {
    paddingBottom: 0,
    paddingTop: 60, // Reduced to start closer to top like Edit screen
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  // Header Section
  headerSection: {
    alignItems: 'center',
    marginBottom: 30,
    zIndex: 2,
    position: 'relative',
    width: '100%',
  },
  topRightButton: {
    position: 'absolute',
    right: 15,
    top: -10,
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
    zIndex: 10,
  },
  headerBgWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 480, // Increased to cover stats grid
    alignItems: 'center',
    zIndex: 1,
    overflow: 'hidden',
  },
  headerBgImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.45,
  },
  headerBgGlow: {
    width: width * 1.5,
    height: 480, // Matches wrapper height
    borderRadius: width,
    position: 'absolute',
    top: -80,
    opacity: 0.6,
  },
  avatarContainer: {
    width: 130,
    height: 130,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarGlow: {
    position: 'absolute',
    width: 120, // Match avatarInner width
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
  },
  avatarInner: {
    width: 120,
    height: 120,
    borderRadius: 60,
    padding: 3, // Thinner border for a cleaner look
    overflow: 'hidden',
  },
  avatarMain: {
    width: '100%',
    height: '100%',
    borderRadius: 56,
  },
  placeholderAvatar: {
    backgroundColor: '#1c1c1e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#32D74B',
    borderWidth: 3,
    borderColor: '#000',
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    gap: 10,
  },
  nameBadgeWrapper: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  editButtonWrapper: {
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  editButtonBlur: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  profileName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  // Stats Grid
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 25,
    zIndex: 5,
  },
  statCard: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    marginTop: 6,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginTop: 2,
  },

  // Premium Section
  premiumSection: {
    paddingHorizontal: 20,
    marginBottom: 25,
    zIndex: 10,
  },
  premiumCard: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 215, 0, 0.4)',
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 215, 0, 0.03)', // Subtle gold tint
  },
  premiumHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  premiumTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -0.5,
  },
  premiumSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  proBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  proText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 12,
  },
  perksContainer: {
    marginBottom: 20,
    gap: 10,
  },
  perkItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  perkIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  perkText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  upgradeButton: {
    width: '100%',
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  upgradeButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '800',
  },
  activePremiumCard: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  activePremiumGradient: {
    padding: 20,
  },
  activeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 15,
  },
  goldCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activePremiumTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFD700',
  },
  activePremiumDesc: {
    fontSize: 13,
    color: 'rgba(255,215,0,0.6)',
  },
  manageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,215,0,0.1)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 15,
  },
  manageBtnText: {
    color: '#FFD700',
    fontWeight: '700',
    fontSize: 14,
  },
  upgradeCard: {
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#FF2D55',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  upgradeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  upgradeInfo: {
    flex: 1,
  },
  upgradeTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -0.5,
  },
  upgradeDesc: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  upgradeBadge: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  upgradeBadgeText: {
    color: '#FF2D55',
    fontWeight: '800',
    fontSize: 14,
  },

  // Ad Container
  adContainer: {
    marginHorizontal: 20,
    marginBottom: 25,
    borderRadius: 15,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50, // Reduced to match standard banner
  },

  // Menu Section
  menuSection: {
    paddingHorizontal: 20,
    marginBottom: 5,
  },
  menuTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 15,
    marginLeft: 5,
  },
  menuItemWrapper: {
    marginBottom: 5,
    borderRadius: 20,
    overflow: 'hidden',
  },
  menuItemBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingRight: 16,
  },
  menuIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },

  // Logout
  logoutRow: {
    marginHorizontal: 20,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,69,58,0.2)',
  },
  logoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  logoutText: {
    color: '#FF453A',
    fontSize: 16,
    fontWeight: '700',
  },
});
