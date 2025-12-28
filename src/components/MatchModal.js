import React from 'react';
import { View, Text, StyleSheet, Image, Modal, TouchableOpacity } from 'react-native';
import { BlurView } from 'expo-blur';
import { COLORS } from '../styles/theme';

export const MatchModal = ({ visible, currentUser, matchedUser, onClose, onChat }) => {
  if (!matchedUser || !currentUser) return null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <BlurView intensity={95} tint="dark" style={styles.container}>
        <Text style={styles.title}>It's a Match!</Text>
        <Text style={styles.subtitle}>You and {matchedUser.name} have liked each other.</Text>

        <View style={styles.imagesContainer}>
          <Image source={{ uri: currentUser.photos[0] }} style={styles.image} />
          <Image source={{ uri: matchedUser.photos[0] }} style={styles.image} />
        </View>

        <TouchableOpacity style={styles.chatButton} onPress={onChat}>
          <Text style={styles.chatButtonText}>Send a Message</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.keepSwipingButton} onPress={onClose}>
          <Text style={styles.keepSwipingText}>Keep Swiping</Text>
        </TouchableOpacity>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 40,
    fontWeight: 'bold',
    color: COLORS.success,
    marginBottom: 10,
    fontStyle: 'italic',
  },
  subtitle: {
    fontSize: 18,
    color: COLORS.white,
    marginBottom: 40,
    textAlign: 'center',
  },
  imagesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 50,
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: COLORS.white,
    marginHorizontal: 10,
  },
  chatButton: {
    backgroundColor: COLORS.white,
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
    marginBottom: 15,
    width: '100%',
  },
  chatButtonText: {
    color: COLORS.primary,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  keepSwipingButton: {
    paddingVertical: 15,
    width: '100%',
  },
  keepSwipingText: {
    color: COLORS.white,
    fontSize: 18,
    textAlign: 'center',
  },
});
