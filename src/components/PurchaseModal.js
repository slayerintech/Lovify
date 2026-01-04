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
  const [errorMsg, setErrorMsg] = useState(null); // Store fetch error
  const { restorePurchases } = useAuth();

  useEffect(() => {
    if (visible) {
      setIsVisible(true);
      setErrorMsg(null); // Reset error
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
      
      if (packages.length === 0) {
          setErrorMsg("No products found. Check configuration.");
      }

    } catch (e) {
      console.log("Error fetching offerings:", e);
      setErrorMsg(e.message || "Failed to load products");
      // Alert.alert('Configuration Error', 'Failed to load subscription packages...');
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
                colors={['#1a1a1a', '#000000']}
                style={StyleSheet.absoluteFill}
              />
             
             {/* Drag Indicator & Header Area */}
             <View {...panResponder.panHandlers} style={styles.dragHandleArea}>
                 <View style={styles.line} />
                 <View style={styles.headerContainer}>
                    <Text style={styles.title}>Unlock Premium</Text>
                    <Text style={styles.subtitle}>Supercharge your dating life</Text>
                </View>
             </View>
             
             {/* Close Button - Absolute Position */}
             <TouchableOpacity onPress={handleClose} style={styles.closeButtonAbs}>
                <Ionicons name="close-circle" size={30} color="rgba(255,255,255,0.3)" />
             </TouchableOpacity>

            <ScrollView 
              style={styles.innerContent}
              contentContainerStyle={{ paddingBottom: Platform.OS === 'ios' ? 60 : 40 }}
              showsVerticalScrollIndicator={false}
            >
              
              {/* Content */}
              <View style={styles.content}>
                
                {/* Features Grid */}
                <View style={styles.featuresGrid}>
                  <FeatureItem icon="infinite" text="Unlimited Swipes" />
                  <FeatureItem icon="eye" text="See Who Likes You" />
                  <FeatureItem icon="chatbubbles" text="Chat with your match" />
                  <FeatureItem icon="ban" text="No Advertisement" />
                </View>

                {/* Error Message */}
                {errorMsg && (
                    <View style={styles.errorContainer}>
                        <Ionicons name="warning" size={20} color="#FF3B30" />
                        <Text style={styles.errorText}>
                            {errorMsg.includes('configuration') 
                                ? "Configuration Error: Google Play products not found." 
                                : "Error loading products: " + errorMsg}
                        </Text>
                    </View>
                )}

                {/* Plans List - Vertical */}
                <View style={styles.plansContainer}>
                    {PLANS.map((plan) => {
                      const isSelected = selectedPlan.id === plan.id;
                      // Dynamic Price Lookup
                      const realPackage = availablePackages[plan.id];
                      const displayPrice = realPackage?.product?.priceString || (errorMsg ? "N/A" : "Loading...");
                      
                      return (
                        <TouchableOpacity 
                          key={plan.id}
                          activeOpacity={0.8}
                          onPress={() => setSelectedPlan(plan)}
                          style={[
                            styles.planRow, 
                            isSelected && styles.selectedPlanRow
                          ]}
                        >
                          {/* Radio Button */}
                          <View style={[styles.radioButton, isSelected && styles.radioButtonSelected]}>
                              {isSelected && <View style={styles.radioButtonInner} />}
                          </View>

                          <View style={styles.planDetails}>
                              <View style={styles.planHeaderRow}>
                                  <Text style={styles.planName}>{plan.name}</Text>
                                  {plan.save && (
                                    <View style={styles.saveBadge}>
                                      <Text style={styles.saveText}>{plan.save}</Text>
                                    </View>
                                  )}
                              </View>
                              <Text style={styles.planPrice}>{displayPrice}</Text>
                          </View>
                          
                          <Text style={styles.planSubtitleRight}>{plan.subtitle}</Text>
                        </TouchableOpacity>
                      );
                    })}
                </View>

                {/* Purchase Button */}
                <TouchableOpacity 
                  activeOpacity={0.9} 
                  onPress={handleRealPurchase}
                  disabled={processing || !!errorMsg}
                  style={[styles.purchaseButtonWrapper, (!!errorMsg) && { opacity: 0.5 }]}
                >
                  <LinearGradient
                    colors={['#FF4D67', '#FF0055']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.purchaseButton}
                  >
                    {processing ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <Text style={styles.purchaseButtonText}>
                          Continue
                      </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
                
                <TouchableOpacity onPress={handleRestore} style={{ marginTop: 16 }}>
                    <Text style={styles.restoreText}>Restore Purchases</Text>
                </TouchableOpacity>
                
                <Text style={styles.termsText}>
                  Recurring billing, cancel anytime. By continuing you agree to our Terms.
                </Text>
              </View>
            </ScrollView>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const FeatureItem = ({ icon, text }) => (
  <View style={styles.featureItem}>
    <View style={styles.featureIconCircle}>
        <Ionicons name={icon} size={20} color="#FF2D55" />
    </View>
    <Text style={styles.featureText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    width: '100%',
    height: '85%', // Taller modal
    backgroundColor: 'transparent',
  },
  blurContainer: {
    flex: 1,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: 'hidden',
    backgroundColor: '#121212',
  },
  innerContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  dragHandleArea: {
    width: '100%',
    paddingBottom: 10,
    backgroundColor: 'transparent',
  },
  line: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 20,
    borderRadius: 2,
  },
  closeButtonAbs: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 20,
    padding: 8,
  },
  content: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  headerContainer: {
      alignItems: 'center',
      marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 30,
  },
  featureItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 12,
    borderRadius: 12,
  },
  featureIconCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: 'rgba(255, 45, 85, 0.1)',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
  },
  featureText: {
    fontSize: 13,
    color: '#FFF',
    fontWeight: '600',
    flex: 1,
  },
  errorContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
    width: '100%',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
    fontWeight: '600',
  },
  plansContainer: {
    width: '100%',
    marginBottom: 30,
  },
  planRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  selectedPlanRow: {
    backgroundColor: 'rgba(255, 45, 85, 0.1)',
    borderColor: '#FF2D55',
  },
  radioButton: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: 'rgba(255,255,255,0.3)',
      marginRight: 16,
      justifyContent: 'center',
      alignItems: 'center',
  },
  radioButtonSelected: {
      borderColor: '#FF2D55',
  },
  radioButtonInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: '#FF2D55',
  },
  planDetails: {
      flex: 1,
  },
  planHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
  },
  planName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    marginRight: 8,
  },
  planPrice: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 15,
    fontWeight: '500',
  },
  planSubtitleRight: {
      color: 'rgba(255,255,255,0.5)',
      fontSize: 13,
      fontWeight: '500',
  },
  saveBadge: {
    backgroundColor: '#FF2D55',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  saveText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  purchaseButtonWrapper: {
    width: '100%',
    shadowColor: '#FF2D55',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    marginBottom: 16,
  },
  purchaseButton: {
    paddingVertical: 18,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  purchaseButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  restoreText: {
      color: 'rgba(255,255,255,0.5)',
      fontSize: 14,
      fontWeight: '600',
  },
  termsText: {
    marginTop: 20,
    fontSize: 11,
    color: 'rgba(255,255,255,0.3)',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 20,
  },
});
