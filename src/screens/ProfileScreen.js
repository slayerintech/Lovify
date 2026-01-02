import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, Alert, Dimensions, StatusBar, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../services/AuthContext';
import { GlassButton } from '../components/GlassButton';
import { AppHeader } from '../components/AppHeader';
import { PurchaseModal } from '../components/PurchaseModal';
import { COLORS } from '../styles/theme';
import { useNavigation } from '@react-navigation/native';
import { deleteUser } from 'firebase/auth';
import { doc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const PerkItem = ({ icon, text }) => (
  <View style={styles.perkItem}>
    <View style={styles.perkIconCircle}>
      <Ionicons name={icon} size={16} color="#FF2D55" />
    </View>
    <Text style={styles.perkText}>{text}</Text>
  </View>
);

export default function ProfileScreen() {
  const { userData, logout, upgradeToPremium, cancelPremium } = useAuth();
  const navigation = useNavigation();
  const [purchasing, setPurchasing] = React.useState(false);
  const [cancelling, setCancelling] = React.useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = React.useState(false);

  const handlePurchase = () => {
    if (userData?.isPremium) {
      // Logic handled by Remove Subscription button now
      return;
    }
    setShowPurchaseModal(true);
  };

  const handleCancelSubscription = () => {
    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel your Lovify Premium subscription? You will lose all exclusive features immediately.',
      [
        { text: 'Keep Subscription', style: 'cancel' },
        { 
          text: 'Remove Subscription', 
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              // Simulate delay
              await new Promise(resolve => setTimeout(resolve, 1500));
              await cancelPremium();
              Alert.alert('Subscription Cancelled', 'Your Premium subscription has been removed.');
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel subscription. Please try again.');
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
        Alert.alert('Error', 'Purchase failed. Please try again.');
    } finally {
        setPurchasing(false);
    }
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              const user = auth.currentUser;
              if (user) {
                // Delete user data from Firestore
                await deleteDoc(doc(db, 'users', user.uid));
                
                // Delete user from Authentication
                await deleteUser(user);
                
                // Navigation to login will happen automatically due to auth state change
              }
            } catch (error) {
              console.error('Error deleting account:', error);
              Alert.alert('Error', 'Failed to delete account. You may need to re-login and try again.');
            }
          }
        }
      ]
    );
  };

  if (!userData) return null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#000000', '#121212']} style={StyleSheet.absoluteFill} />
      
      {/* <SafeAreaView style={styles.safeArea}> */}
        
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          
          {/* New Horizontal Profile Header */}
          <View style={styles.profileSection}>
            <View style={styles.profileRow}>
              {/* Profile Picture */}
              <View style={styles.avatarContainer}>
                <Image source={{ uri: userData.photo || (userData.photos && userData.photos[0]) }} style={styles.avatar} />
                <View style={styles.onlineIndicator} />
              </View>

              {/* Name & Age */}
              <View style={styles.userInfo}>
                <Text style={styles.name}>{userData.name}, {userData.age}</Text>
                <Text style={styles.subtext}>Ready to find love</Text>
              </View>

              {/* Edit Button (Gradient Pill Style) */}
              <TouchableOpacity 
                onPress={() => navigation.navigate('EditProfile')}
                activeOpacity={0.8}
                style={styles.editBtnContainer}
              >
                <LinearGradient
                  colors={['#FF2D55', '#FF375F']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.editButtonGradient}
                >
                  <Ionicons name="create-outline" size={18} color="#fff" />
                  <Text style={styles.editButtonText}>Edit</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

          {/* Premium Card */}
          <View style={styles.premiumContainer}>
            <LinearGradient
              colors={['#1c1c1e', '#2c2c2e']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.premiumCard}
            >
              {/* Gold Border/Glow effect using a pseudo-element logic or nested views if needed, 
                  but here we'll use a border on the card itself */}
              
              <View style={styles.premiumHeader}>
                <View>
                  <Text style={styles.premiumTitle}>Lovify Premium</Text>
                  <Text style={styles.premiumSubtitle}>Unlock exclusive features</Text>
                </View>
                <LinearGradient 
                  colors={['#FFD700', '#FFA500']} 
                  start={{ x: 0, y: 0 }} 
                  end={{ x: 1, y: 1 }} 
                  style={styles.proBadge}
                >
                  <Ionicons name="diamond" size={12} color="#000" style={{ marginRight: 4 }} />
                  <Text style={styles.proText}>PRO</Text>
                </LinearGradient>
              </View>

              <View style={styles.perksContainer}>
                <PerkItem icon="infinite" text="Unlimited Swipes" />
                <PerkItem icon="eye" text="See Who Likes You" />
                <PerkItem icon="flash" text="1 Free Boost per month" />
                <PerkItem icon="ban" text="No Advertisements" />
              </View>

              <TouchableOpacity 
                key={userData?.isPremium ? 'premium-btn' : 'upgrade-btn'}
                activeOpacity={0.9} 
                onPress={userData?.isPremium ? handleCancelSubscription : handlePurchase} 
                disabled={purchasing || cancelling}
                style={{ width: '100%' }}
              >
                <LinearGradient
                  colors={userData?.isPremium ? ['#3a3a3c', '#2c2c2e'] : ['#FF2D55', '#FFA500']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.upgradeButton, userData?.isPremium && { borderWidth: 1, borderColor: '#FF453A' }]}
                >
                  <Text style={[styles.upgradeButtonText, userData?.isPremium && { color: '#FF453A' }]}>
                    {purchasing ? 'PROCESSING...' : 
                     cancelling ? 'REMOVING...' : 
                     (userData?.isPremium ? 'REMOVE SUBSCRIPTION' : 'UPGRADE NOW')}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </View>

          {/* Stats Section */}
          <View style={styles.statsContainer}>
            <BlurView intensity={20} tint="dark" style={styles.statCard}>
               <Ionicons name="transgender-outline" size={24} color="#FF2D55" />
               <Text style={styles.statValue}>{userData.gender}</Text>
               <Text style={styles.statLabel}>Gender</Text>
            </BlurView>

            <BlurView intensity={20} tint="dark" style={styles.statCard}>
               <Ionicons name="heart-half-outline" size={24} color="#5856D6" />
               <Text style={styles.statValue}>{userData.interestedIn}</Text>
               <Text style={styles.statLabel}>Interested In</Text>
            </BlurView>
          </View>

          {/* Settings & Logout */}
          <View style={styles.actionSection}>
            <Text style={styles.menuTitle}>Logout</Text>
            
            <TouchableOpacity onPress={logout} activeOpacity={0.9} style={{ marginBottom: 15 }}>
               <LinearGradient 
                  colors={['#2c2c2e', '#3a3a3c']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.upgradeButton, { flexDirection: 'row', gap: 10, justifyContent: 'center' }]}
               >
                  <Ionicons name="log-out-outline" size={22} color="#fff" />
                  <Text style={[styles.upgradeButtonText, { color: '#fff' }]}>LOGOUT</Text>
               </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleDeleteAccount} activeOpacity={0.9}>
               <LinearGradient 
                  colors={['#FF3B30', '#FF0000']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.upgradeButton, { flexDirection: 'row', gap: 10, justifyContent: 'center' }]}
               >
                  <Ionicons name="trash-outline" size={22} color="#fff" />
                  <Text style={[styles.upgradeButtonText, { color: '#fff' }]}>DELETE ACCOUNT</Text>
               </LinearGradient>
            </TouchableOpacity>
          </View>

        </ScrollView>
        <AppHeader style={styles.header} />
      {/* </SafeAreaView> */}

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
  content: {
    paddingBottom: 80,
    paddingTop: 80,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  // Profile Section Styles
  profileSection: {
    paddingHorizontal: 20,
    marginBottom: 25,
    marginTop: 10,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#333',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#32D74B',
    borderWidth: 2,
    borderColor: '#000',
  },
  userInfo: {
    flex: 1,
    marginLeft: 15,
    justifyContent: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  subtext: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  editBtnContainer: {
    shadowColor: '#FF2D55',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  editButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 6,
  },
  editButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },

  // Premium Card Styles
  premiumContainer: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  premiumCard: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)', // Goldish border
    position: 'relative',
    overflow: 'hidden',
  },
  premiumHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  premiumTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -1,
  },
  premiumSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  proText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  perksContainer: {
    marginBottom: 20,
    gap: 12,
  },
  perkItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  perkIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  perkText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  upgradeButton: {
    width: '100%',
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  upgradeButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // Stats Styles
  statsContainer: {
    flexDirection: 'row',
    gap: 15,
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  statCard: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginTop: 6,
    textTransform: 'capitalize',
  },
  statLabel: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginTop: 2,
  },

  // Action Section
  actionSection: {
    width: '100%',
    paddingHorizontal: 25,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 15,
    marginLeft: 5,
  },
  button: {
    width: '100%',
    height: 56,
    marginBottom: 15,
  },
  devButton: {
    backgroundColor: 'rgba(50, 215, 75, 0.05)',
    borderColor: 'rgba(50, 215, 75, 0.2)',
  },
  logoutRow: {
    marginTop: 10,
    borderRadius: 20,
    overflow: 'hidden',
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
