import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, Alert, Dimensions, StatusBar, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../services/AuthContext';
import { GlassButton } from '../components/GlassButton';
import { AppHeader } from '../components/AppHeader';
import { PurchaseModal } from '../components/PurchaseModal';
import { COLORS } from '../styles/theme';
import { useNavigation } from '@react-navigation/native';
import { deleteUser } from 'firebase/auth';
import { doc, deleteDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function ProfileScreen() {
  const { user, userData, logout, upgradeToPremium, cancelPremium } = useAuth();
  const navigation = useNavigation();
  const [purchasing, setPurchasing] = React.useState(false);
  const [cancelling, setCancelling] = React.useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = React.useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [matchesCount, setMatchesCount] = useState(0);

  useEffect(() => {
    if (!user) return;

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
    { id: 'edit', label: 'Edit Profile', icon: 'create-outline', color: '#FF2D55', onPress: () => navigation.navigate('EditProfile') },
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
      <StatusBar barStyle="light-content" />
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
            colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.6)', '#000000']}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            colors={userData?.isPremium ? ['rgba(255, 215, 0, 0.12)', 'transparent'] : ['rgba(255, 45, 85, 0.12)', 'transparent']}
            style={styles.headerBgGlow}
          />
        </View>

        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={userData?.isPremium ? ['#FFD700', '#FFA500'] : ['#FF2D55', '#FF375F']}
              style={styles.avatarGlow}
            />
            <View style={styles.avatarInner}>
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
            </View>
              <View style={styles.onlineBadge} />
            </View>

          <View style={styles.headerInfo}>
            <BlurView intensity={10} tint="light" style={styles.nameBadgeWrapper}>
              <Text style={styles.profileName}>{userData.name}, {userData.age}</Text>
            </BlurView>
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
            <BlurView intensity={30} tint="light" style={styles.activePremiumCard}>
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
            <TouchableOpacity 
              activeOpacity={0.9} 
              onPress={handlePurchase}
              style={styles.upgradeCard}
            >
              <LinearGradient
                colors={['#FF2D55', '#AF52DE']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.upgradeGradient}
              >
                <View style={styles.upgradeInfo}>
                  <Text style={styles.upgradeTitle}>Get Lovify Gold</Text>
                  <Text style={styles.upgradeDesc}>See who likes you & more!</Text>
                </View>
                <View style={styles.upgradeBadge}>
                  <Text style={styles.upgradeBadgeText}>Upgrade</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>

        {/* Menu Section */}
        <View style={styles.menuSection}>
          <Text style={styles.menuTitle}>Account Settings</Text>
          {menuItems.map(renderMenuItem)}
        </View>

        {/* Logout Button */}
        <TouchableOpacity 
          onPress={logout} 
          activeOpacity={0.8} 
          style={styles.logoutRow}
        >
          <LinearGradient
            colors={['rgba(255,69,58,0.1)', 'rgba(255,69,58,0.05)']}
            style={styles.logoutGradient}
          >
            <Ionicons name="log-out-outline" size={20} color="#FF453A" />
            <Text style={styles.logoutText}>Logout from Lovify</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>
      <AppHeader style={styles.header} />

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
    paddingBottom: 20,
    paddingTop: 120, // Increased to clear AppHeader initially
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
  },
  headerBgWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 330,
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
    height: 330,
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
    width: 140,
    height: 140,
    borderRadius: 70,
    opacity: 0.5,
  },
  avatarInner: {
    width: 120,
    height: 120,
    borderRadius: 60,
    padding: 4,
    backgroundColor: '#000',
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
    alignItems: 'center',
    marginTop: 10,
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

  // Menu Section
  menuSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
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
    marginBottom: 12,
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
