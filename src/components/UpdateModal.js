import React from 'react';
import { 
  View, Text, StyleSheet, Modal, TouchableOpacity, 
  Platform, Linking, Dimensions, Animated 
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export const UpdateModal = ({ visible, forced, latestVersion, releaseNotes, storeUrl, onClose }) => {
  const handleUpdate = () => {
    Linking.openURL(storeUrl).catch(err => {
      console.error("Failed to open Play Store:", err);
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => !forced && onClose()}>
      <View style={styles.overlay}>
        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
        
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={['#1a1a1a', '#000000']}
            style={styles.gradient}
          >
            <View style={styles.headerIcon}>
              <LinearGradient
                colors={['#FF2D55', '#FF375F']}
                style={styles.iconCircle}
              >
                <Ionicons name="rocket-outline" size={32} color="#fff" />
              </LinearGradient>
            </View>

            <Text style={styles.title}>Update Available!</Text>
            <Text style={styles.versionText}>New Version: v{latestVersion}</Text>
            
            <View style={styles.notesContainer}>
              <Text style={styles.notesLabel}>What's New:</Text>
              <Text style={styles.notesText}>{releaseNotes}</Text>
            </View>

            <TouchableOpacity 
              activeOpacity={0.9} 
              onPress={handleUpdate}
              style={styles.updateButtonWrapper}
            >
              <LinearGradient
                colors={['#FF4D67', '#FF0055']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.updateButton}
              >
                <Text style={styles.updateButtonText}>Update Now</Text>
              </LinearGradient>
            </TouchableOpacity>

            {!forced && (
              <TouchableOpacity 
                onPress={onClose} 
                style={styles.laterButton}
              >
                <Text style={styles.laterText}>Maybe Later</Text>
              </TouchableOpacity>
            )}
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '90%',
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  gradient: {
    padding: 25,
    alignItems: 'center',
  },
  headerIcon: {
    marginBottom: 20,
    marginTop: 10,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF2D55',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 5,
  },
  versionText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '700',
    marginBottom: 20,
    letterSpacing: 0.5,
  },
  notesContainer: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 15,
    borderRadius: 15,
    marginBottom: 25,
  },
  notesLabel: {
    fontSize: 12,
    color: '#FF2D55',
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 8,
    letterSpacing: 1,
  },
  notesText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 20,
  },
  updateButtonWrapper: {
    width: '100%',
    marginBottom: 10,
  },
  updateButton: {
    paddingVertical: 15,
    borderRadius: 15,
    alignItems: 'center',
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  laterButton: {
    paddingVertical: 10,
  },
  laterText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    fontWeight: '600',
  },
});
