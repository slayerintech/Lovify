import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Image, TouchableOpacity, Dimensions, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../services/firebase';
import { useAuth } from '../services/AuthContext';
import { GlassButton } from '../components/GlassButton';
import { GlassInput } from '../components/GlassInput';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur'; // Make sure this is installed

const { width } = Dimensions.get('window');
const GRID_SPACING = 10;
const PADDING = 25;
// Perfect 3-column calculation
const PHOTO_SIZE = (width - (PADDING * 2) - (GRID_SPACING * 2)) / 3;

const INTERESTS_OPTIONS = ["Music", "Travel", "Gym", "Movies", "Cooking", "Gaming", "Art", "Coding", "Yoga"];

export default function CreateProfileScreen() {
  const { user, userData, refreshUserData } = useAuth();
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [interestedIn, setInterestedIn] = useState('');
  const [bio, setBio] = useState('');
  const [job, setJob] = useState('');
  const [photos, setPhotos] = useState([]);
  const [interests, setInterests] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (userData) {
      setName(userData.name || '');
      setAge(userData.age ? userData.age.toString() : '');
      setGender(userData.gender || '');
      setInterestedIn(userData.interestedIn || '');
      setBio(userData.bio || '');
      setPhotos(userData.photos || []);
      setJob(userData.job || '');
      setInterests(userData.interests || []);
    }
  }, [userData]);

  const toggleInterest = (interest) => {
    if (interests.includes(interest)) {
      setInterests(interests.filter(i => i !== interest));
    } else {
      setInterests([...interests, interest]);
    }
  };

  const pickImage = async () => {
    if (photos.length >= 6) {
      Alert.alert('Limit reached', 'Max 6 photos allowed.');
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Grant access to photos to continue.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.6,
    });

    if (!result.canceled) {
      setPhotos([...photos, result.assets[0].uri]);
    }
  };

  const uploadImage = async (uri, index) => {
    if (uri.startsWith('http')) return uri;
    const response = await fetch(uri);
    const blob = await response.blob();
    const filename = `${user?.uid}/photo_${index}_${Date.now()}.jpg`;
    const storageRef = ref(storage, filename);
    await uploadBytes(storageRef, blob);
    return await getDownloadURL(storageRef);
  };

  const saveProfile = async () => {
    if (!name || !age || !gender || !interestedIn || photos.length === 0) {
      Alert.alert('Incomplete', 'Please fill all required fields.');
      return;
    }

    setUploading(true);
    try {
      const photoUrls = await Promise.all(photos.map((photo, index) => uploadImage(photo, index)));
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        id: user.uid,
        name,
        age: parseInt(age),
        gender: gender.toLowerCase(),
        interestedIn: interestedIn.toLowerCase(),
        bio,
        job,
        interests,
        photos: photoUrls,
        updatedAt: serverTimestamp(),
        ...(userData ? {} : { createdAt: serverTimestamp() }),
      }, { merge: true });

      await refreshUserData();
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1a0b12', '#000']} style={StyleSheet.absoluteFill} />
      
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{userData ? 'Edit Profile' : 'New Account'}</Text>
        
        {/* Symmetric Photo Grid */}
        <Text style={styles.label}>Profile Photos ({photos.length}/6)</Text>
        <View style={styles.photoGrid}>
          {Array(6).fill(0).map((_, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.photoBox} 
              onPress={() => !photos[index] && pickImage()}
              activeOpacity={0.7}
            >
              {photos[index] ? (
                <View style={styles.fullSize}>
                  <Image source={{ uri: photos[index] }} style={styles.photo} />
                  <TouchableOpacity 
                    style={styles.removeBtn} 
                    onPress={() => setPhotos(photos.filter((_, i) => i !== index))}
                  >
                    <View style={styles.closeIconWrapper}>
                      <Ionicons name="close" size={14} color="#fff" />
                    </View>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.addPlaceholder}>
                  <Ionicons name="add" size={28} color="rgba(255,255,255,0.2)" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Personal Details</Text>
          <GlassInput value={name} onChangeText={setName} placeholder="Full Name" />
          <GlassInput value={age} onChangeText={setAge} placeholder="Age" keyboardType="number-pad" />
          <GlassInput value={job} onChangeText={setJob} placeholder="Job Title / Company" />
        </View>

        <Text style={styles.label}>Gender</Text>
        <View style={styles.pillRow}>
          {['Male', 'Female'].map(g => (
            <TouchableOpacity 
              key={g} 
              style={[styles.pill, gender.toLowerCase() === g.toLowerCase() && styles.pillActive]}
              onPress={() => setGender(g)}
            >
              <Text style={[styles.pillText, gender.toLowerCase() === g.toLowerCase() && styles.pillTextActive]}>{g}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Interested In</Text>
        <View style={styles.pillRow}>
          {['Male', 'Female', 'Both'].map(i => (
            <TouchableOpacity 
              key={i} 
              style={[styles.pill, interestedIn.toLowerCase() === i.toLowerCase() && styles.pillActive]}
              onPress={() => setInterestedIn(i)}
            >
              <Text style={[styles.pillText, interestedIn.toLowerCase() === i.toLowerCase() && styles.pillTextActive]}>{i}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Interests</Text>
        <View style={styles.interestsGrid}>
          {INTERESTS_OPTIONS.map(item => (
            <TouchableOpacity 
              key={item} 
              style={[styles.interestTag, interests.includes(item) && styles.interestTagActive]}
              onPress={() => toggleInterest(item)}
            >
              <Text style={[styles.tagText, interests.includes(item) && styles.tagTextActive]}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Bio</Text>
        <GlassInput 
          value={bio} 
          onChangeText={setBio} 
          placeholder="Tell us something interesting..." 
          multiline 
          style={styles.bioInput}
        />

        <View style={styles.footer}>
          <GlassButton 
            title={uploading ? "Saving..." : "Done"} 
            onPress={saveProfile} 
            disabled={uploading}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  content: { paddingHorizontal: PADDING, paddingTop: 60, paddingBottom: 100 },
  title: { fontSize: 34, fontWeight: '900', color: '#fff', marginBottom: 25, letterSpacing: -1 },
  label: { color: '#8E8E93', fontWeight: '800', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 15, marginTop: 25 },
  
  photoGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'flex-start',
    marginLeft: -GRID_SPACING / 2,
    marginRight: -GRID_SPACING / 2,
  },
  photoBox: { 
    width: PHOTO_SIZE, 
    height: PHOTO_SIZE * 1.35, 
    margin: GRID_SPACING / 2, 
    borderRadius: 16, 
    backgroundColor: 'rgba(255,255,255,0.04)', 
    borderWidth: 1, 
    borderColor: 'rgba(255,255,255,0.08)', 
    overflow: 'hidden' 
  },
  fullSize: { flex: 1 },
  photo: { width: '100%', height: '100%', resizeMode: 'cover' },
  addPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  removeBtn: { 
    position: 'absolute', 
    top: 6, 
    right: 6,
    zIndex: 10,
  },
  closeIconWrapper: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FF2D55', // Solid pink for the remove button
  },

  inputGroup: { gap: 12 },

  pillRow: { flexDirection: 'row', gap: 10 },
  pill: { paddingVertical: 12, paddingHorizontal: 22, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  pillActive: { backgroundColor: '#FF2D55', borderColor: '#FF2D55' },
  pillText: { color: '#8E8E93', fontWeight: '700', fontSize: 14 },
  pillTextActive: { color: '#fff' },

  interestsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  interestTag: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  interestTagActive: { borderColor: '#FF2D55', backgroundColor: 'rgba(255,45,85,0.15)' },
  tagText: { color: '#8E8E93', fontSize: 13, fontWeight: '600' },
  tagTextActive: { color: '#FF2D55' },

  bioInput: { height: 100, textAlignVertical: 'top', paddingTop: 15 },
  footer: { marginTop: 40 },
});