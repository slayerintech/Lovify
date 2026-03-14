import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

export default function PrivacyPolicyScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#0f0f0f', '#000000', '#1a0b12']} style={StyleSheet.absoluteFill} />
      
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <BlurView intensity={20} tint="light" style={styles.backButtonBlur}>
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </BlurView>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Privacy Policy</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <BlurView intensity={15} tint="dark" style={styles.policyCard}>
            <Text style={styles.lastUpdated}>Effective Date: 2026-01-01</Text>
            
            <Text style={styles.sectionTitle}>1. Information We Collect</Text>
            <Text style={styles.policyText}>
              We collect information that identifies, relates to, describes, references, is capable of being associated with, or could reasonably be linked, directly or indirectly, with a particular consumer or device.
            </Text>

            <Text style={styles.subSectionTitle}>a. Personal Data</Text>
            <Text style={styles.policyText}>
              Personally identifiable information, such as your name, email address, and profile image, that you voluntarily give to us when you register with the App.
            </Text>

            <Text style={styles.subSectionTitle}>b. Derivative Data</Text>
            <Text style={styles.policyText}>
              Information our servers automatically collect when you access the App, such as liking and disliking profiles, matches, and interactions.
            </Text>

            <Text style={styles.sectionTitle}>2. Use of Your Information</Text>
            <Text style={styles.policyText}>
              We may use information collected about you via the App to:
              {"\n"}• Create and manage your account.
              {"\n"}• Facilitate matchmaking.
              {"\n"}• Enable user-to-user communications.
              {"\n"}• Process payments via RevenueCat.
              {"\n"}• Serve relevant ads via AdMob.
            </Text>

            <Text style={styles.sectionTitle}>3. Disclosure of Your Information</Text>
            <Text style={styles.policyText}>
              We may share your information with third-party service providers that perform services for us, including payment processing and data analysis.
            </Text>

            <Text style={styles.sectionTitle}>4. Third-Party Tools</Text>
            <Text style={styles.policyText}>
              We use the following third-party tools:
              {"\n"}• Google AdMob (Advertising)
              {"\n"}• Firebase (Database & Auth)
              {"\n"}• RevenueCat (Subscriptions)
            </Text>

            <Text style={styles.sectionTitle}>5. Security</Text>
            <Text style={styles.policyText}>
              We use administrative, technical, and physical security measures to help protect your personal information.
            </Text>

            <Text style={styles.sectionTitle}>6. Contact Us</Text>
            <Text style={styles.policyText}>
              If you have questions about this Privacy Policy, please contact us at: support@lovify.com
            </Text>
          </BlurView>
          
          <View style={{ height: 50 }} />
        </ScrollView>
      </SafeAreaView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  backButtonBlur: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  scrollContent: {
    padding: 20,
  },
  policyCard: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  lastUpdated: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginBottom: 20,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FF2D55',
    marginTop: 20,
    marginBottom: 10,
  },
  subSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    marginTop: 15,
    marginBottom: 5,
  },
  policyText: {
    fontSize: 14,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 10,
  },
});
