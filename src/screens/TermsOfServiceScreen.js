import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

export default function TermsOfServiceScreen() {
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
          <Text style={styles.headerTitle}>Terms of Service</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <BlurView intensity={15} tint="dark" style={styles.policyCard}>
            <Text style={styles.lastUpdated}>Effective Date: 2026-01-01</Text>
            
            <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
            <Text style={styles.policyText}>
              By accessing or using Lovify, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the app.
            </Text>

            <Text style={styles.sectionTitle}>2. Subscription Terms</Text>
            <Text style={styles.policyText}>
              Lovify offers premium subscription plans (Gold). 
              {"\n"}• Subscriptions are billed on a recurring basis (Monthly or Yearly) as selected by you.
              {"\n"}• Payment will be charged to your Google Play account at confirmation of purchase.
              {"\n"}• Subscriptions automatically renew unless auto-renew is turned off at least 24 hours before the end of the current period.
              {"\n"}• You can manage or cancel your subscription in your Google Play Account Settings.
            </Text>

            <Text style={styles.sectionTitle}>3. Free Usage</Text>
            <Text style={styles.policyText}>
              Basic usage of Lovify is free. Premium features like unlimited swipes, seeing who liked you, and ad-free experience require an active subscription.
            </Text>

            <Text style={styles.sectionTitle}>4. User Conduct</Text>
            <Text style={styles.policyText}>
              You are responsible for your interactions with other users. We reserve the right to terminate accounts that violate our community guidelines or engage in harassment.
            </Text>

            <Text style={styles.sectionTitle}>5. Termination</Text>
            <Text style={styles.policyText}>
              We reserve the right to terminate or suspend your access to Lovify at any time, without prior notice, for conduct that we believe violates these Terms or is harmful to other users or us.
            </Text>

            <Text style={styles.sectionTitle}>6. Contact Us</Text>
            <Text style={styles.policyText}>
              If you have any questions regarding these Terms, please contact us at: support@lovify.com
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
  policyText: {
    fontSize: 14,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 10,
  },
});
