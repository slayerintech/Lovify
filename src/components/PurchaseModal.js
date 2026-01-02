import React, { useEffect, useRef, useState } from 'react';
import { 
  View, Text, StyleSheet, Modal, TouchableOpacity, 
  Platform, ActivityIndicator, Animated, PanResponder, Dimensions, Alert, ScrollView
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import RevenueCatService from '../services/revenueCat';
import { useAuth } from '../services/AuthContext';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

// Calculate card width to fit 3 items with padding/margins
// Screen Width - (Horizontal Padding * 2) - (Gap * 2) / 3
const CARD_GAP = 8;
const PADDING = 12;
const CARD_WIDTH = (SCREEN_WIDTH - (PADDING * 2) - (CARD_GAP * 2)) / 3;

const PLANS = [
  { id: 'monthly', name: 'Monthly', price: '₹149', priceValue: 149, subtitle: 'Standard' },
  { id: 'yearly', name: 'Yearly', price: '₹999', priceValue: 999, subtitle: 'Best Value', save: 'Save 45%' },
  { id: 'lifetime', name: 'Lifetime', price: '₹2459', priceValue: 2459, subtitle: 'One-time', save: 'Best Choice' },
];

export const PurchaseModal = ({ visible, onClose, onPurchase, processing }) => {
  const panY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const [isVisible, setIsVisible] = useState(visible);
  const [selectedPlan, setSelectedPlan] = useState(PLANS[1]); // Default to Yearly
  const [availablePackages, setAvailablePackages] = useState({}); // Map of identifier -> package
  const [allPackages, setAllPackages] = useState([]); // Store all fetched packages for debug
  const { restorePurchases } = useAuth();

  useEffect(() => {
    if (visible) {
      setIsVisible(true);
      fetchOffering(); 
      Animated.spring(panY, {
        toValue: 0,
        damping: 20,
        stiffness: 90,
        useNativeDriver: true,
      }).start();
    } else {
        if (!visible && isVisible) {
             handleClose();
        }
    }
  }, [visible]);

  
  const fetchOffering = async () => {
    try {
      const packages = await RevenueCatService.getOfferings();
      setAllPackages(packages);
      console.log("Fetched packages:", packages.map(p => ({ id: p.identifier, type: p.packageType })));
      const packageMap = {};
      
      // Map packages by packageType (MONTHLY, ANNUAL, LIFETIME) or identifier
      packages.forEach(pkg => {
        const type = pkg.packageType; // "MONTHLY", "ANNUAL", "LIFETIME", "WEEKLY", etc.
        const id = pkg.identifier.toLowerCase();
        
        if (type === 'MONTHLY' || id.includes('month')) packageMap['monthly'] = pkg;
        if (type === 'ANNUAL' || id.includes('year') || id.includes('annual')) packageMap['yearly'] = pkg;
        if (type === 'LIFETIME' || id.includes('life')) packageMap['lifetime'] = pkg;
      });
      
      setAvailablePackages(packageMap);
    } catch (e) {
      console.log("Error fetching offerings:", e);
    }
  };
  

  const handleRealPurchase = async () => {
    // Check if we have a real RevenueCat package for this plan
    const realPackage = availablePackages[selectedPlan.id];
    
    try {
        if (realPackage) {
            await RevenueCatService.purchasePackage(realPackage);
            onPurchase(); 
        } else {
             console.log("No matching package found for", selectedPlan.id);
             const availableIds = allPackages.map(p => p.identifier).join(', ');
             Alert.alert(
                "Purchase Failed",
                `This subscription plan is not currently available.\n\nDebug Info (Send to Dev):\nSelected: ${selectedPlan.id}\nAvailable: ${availableIds || 'None'}`,
                [{ text: "OK" }]
             );
        }
    } catch (e) {
        if (!e.userCancelled) {
             // console.log("Purchase failed:", e);
             Alert.alert(
                "Purchase Failed",
                `We couldn't process the payment. \n\nError: ${e.message || 'Unknown error'}`,
                [
                    { text: "OK" }
                ]
            );
        }
    }
  };

  const handleRestore = async () => {
    try {
        const success = await restorePurchases();
        if (success) {
            Alert.alert("Success", "Your purchases have been restored.");
            onClose();
        } else {
            Alert.alert("No Subscription Found", "We couldn't find a subscription to restore.");
        }
    } catch (e) {
        Alert.alert("Error", "Failed to restore purchases.");
    }
  };

  const handleClose = () => {
    Animated.timing(panY, {
      toValue: SCREEN_HEIGHT,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setIsVisible(false);
      onClose();
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
          return gestureState.dy > 0; 
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          panY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          handleClose();
        } else {
          Animated.spring(panY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  return (
    <Modal visible={isVisible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={handleClose} activeOpacity={1} />
        
        <Animated.View 
            style={[styles.modalContainer, { transform: [{ translateY: panY }] }]}
            {...panResponder.panHandlers}
        >
          <View style={styles.blurContainer}>
             <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />
              <LinearGradient
                colors={['rgba(255, 45, 85, 0.2)', 'rgba(14, 3, 7, 0.8)']}
                style={StyleSheet.absoluteFill}
              />
             
             {/* Drag Indicator */}
             <View style={styles.line} />
             
             {/* Close Button - Absolute Position */}
             <TouchableOpacity onPress={handleClose} style={styles.closeButtonAbs}>
                <Ionicons name="close-circle" size={30} color="rgba(255,255,255,0.5)" />
             </TouchableOpacity>

             {/* Gradient Glow Borders */}
             <LinearGradient
               colors={['rgba(192, 180, 227, 0.3)', 'transparent']}
               style={styles.topBorder}
             />

            <View style={styles.innerContent}>
              
              {/* Content */}
              <View style={styles.content}>
                <View style={styles.iconContainer}>
                  <LinearGradient
                    colors={['#FF2D55', '#FFA500']}
                    style={styles.iconGradient}
                  >
                    <Ionicons name="diamond" size={40} color="#FFF" />
                  </LinearGradient>
                </View>
                
                <Text style={styles.title}>Lovify Premium</Text>
                <Text style={styles.subtitle}>Unlock all features and find love faster.</Text>

                {/* Features List */}
                <View style={styles.featuresContainer}>
                  <FeatureRow icon="infinite" text="Unlimited Swipes" />
                  <FeatureRow icon="eye" text="See Who Likes You" />
                  <FeatureRow icon="flash" text="1 Free Boost per Month" />
                  <FeatureRow icon="location" text="Passport to Any Location" />
                </View>

                {/* Plans List */}
                <View style={styles.plansContainer}>
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 4 }}
                  >
                    {PLANS.map((plan, index) => {
                      const isSelected = selectedPlan.id === plan.id;
                      return (
                        <TouchableOpacity 
                          key={plan.id}
                          activeOpacity={0.8}
                          onPress={() => setSelectedPlan(plan)}
                          style={[
                            styles.planCard, 
                            isSelected && styles.selectedPlanCard,
                            { marginRight: index === PLANS.length - 1 ? 0 : CARD_GAP }
                          ]}
                        >
                          {plan.save && (
                            <View style={styles.saveBadge}>
                              <Text style={styles.saveText}>{plan.save}</Text>
                            </View>
                          )}
                          <Text style={styles.planDuration}>{plan.name}</Text>
                          <Text style={styles.planPrice}>{plan.price}</Text>
                          <Text style={styles.planSubtitle}>{plan.subtitle}</Text>
                          {isSelected && (
                             <View style={styles.selectedCheck}>
                                <Ionicons name="checkmark-circle" size={20} color="#FF2D55" />
                             </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* Purchase Button */}
                <TouchableOpacity 
                  activeOpacity={0.9} 
                  onPress={handleRealPurchase}
                  disabled={processing}
                  style={styles.purchaseButtonWrapper}
                >
                  <LinearGradient
                    colors={['#FF2D55', '#FF0055']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.purchaseButton}
                  >
                    {processing ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <>
                        <Ionicons name="card" size={20} color="#FFF" style={{ marginRight: 8 }} />
                        <Text style={styles.purchaseButtonText}>
                            Pay {selectedPlan.price}
                        </Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
                
                <TouchableOpacity onPress={handleRestore} style={{ marginTop: 10 }}>
                    <Text style={styles.restoreText}>Restore Purchases</Text>
                </TouchableOpacity>
                
                <Text style={styles.termsText}>
                  Subscription automatically renews unless auto-renew is turned off at least 24-hours before the end of the current period.
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const FeatureRow = ({ icon, text }) => (
  <View style={styles.featureRow}>
    <Ionicons name="checkmark-circle" size={22} color="#32D74B" style={{ marginRight: 12 }} />
    <Text style={styles.featureText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    width: '100%',
    backgroundColor: 'transparent',
  },
  blurContainer: {
    width: '100%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  innerContent: {
    paddingHorizontal: 12,
    paddingTop: 20, // Reduced top padding
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  line: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 5,
    borderRadius: 2,
    zIndex: 10,
  },
  topBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    zIndex: 3,
  },
  closeButtonAbs: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 20,
    padding: 4,
  },
  content: {
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 12, // Reduced
    shadowColor: '#FF2D55',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  iconGradient: {
    width: 64, // Slightly smaller
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24, // Slightly smaller
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: '#8E8E93',
    marginBottom: 20, // Reduced
    textAlign: 'center',
  },
  featuresContainer: {
    width: '100%',
    marginBottom: 24, // Reduced
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16, // Reduced
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureText: {
    fontSize: 15,
    color: '#FFF',
    fontWeight: '500',
  },
  plansContainer: {
    marginVertical: 20,
    height: 180,
  },
  planCard: {
    width: CARD_WIDTH,
    height: 170,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    padding: 8, // Reduced padding to fit content in narrower card
    borderWidth: 2,
    borderColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedPlanCard: {
    backgroundColor: 'rgba(255, 45, 85, 0.15)',
    borderColor: '#FF2D55',
  },
  planDuration: {
    color: '#FFF',
    fontSize: 13, // Slightly smaller
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 8,
  },
  planPrice: {
    color: '#FFF',
    fontSize: 16, // Slightly smaller to fit
    fontWeight: 'bold',
    marginBottom: 4,
  },
  planSubtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    textAlign: 'center',
  },
  saveBadge: {
    position: 'absolute',
    top: 8, // Moved down from -10 to be inside the card
    right: 8, // Positioned at top-right
    backgroundColor: '#FF2D55',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    zIndex: 10,
  },
  saveText: {
    color: '#FFF',
    fontSize: 9, // Slightly smaller font
    fontWeight: 'bold',
  },
  selectedCheck: {
    position: 'absolute',
    bottom: 8, // Moved to bottom-right instead of top-right
    right: 8,
  },
  purchaseButtonWrapper: {
    width: '100%',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    marginBottom: 12,
  },
  purchaseButton: {
    paddingVertical: 16,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  purchaseButtonText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '600',
  },
  restoreText: {
      color: '#007AFF',
      fontSize: 14,
      fontWeight: '600',
      textAlign: 'center',
      marginBottom: 10,
  },
  termsText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    lineHeight: 16,
  },
});
