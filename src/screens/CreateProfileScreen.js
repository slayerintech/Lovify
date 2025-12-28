import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Image, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../services/firebase';
import { useAuth } from '../services/AuthContext';
import { GlassButton } from '../components/GlassButton';
import { GlassInput } from '../components/GlassInput';
import { COLORS, GRADIENTS } from '../styles/theme';
import { Ionicons } from '@expo/vector-icons';

export default function CreateProfileScreen() {
  const { user, userData, refreshUserData } = useAuth();
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [interestedIn, setInterestedIn] = useState('');
  const [bio, setBio] = useState('');
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (userData) {
      setName(userData.name || '');
      setAge(userData.age ? userData.age.toString() : '');
      setGender(userData.gender || '');
      setInterestedIn(userData.interestedIn || '');
      setBio(userData.bio || '');
      setPhotos(userData.photos || []);
    }
  }, [userData]);

  const pickImage = async () => {
    if (photos.length >= 6) {
      Alert.alert('Limit reached', 'You can only upload up to 6 photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.7,
    });

    if (!result.canceled) {
      setPhotos([...photos, result.assets[0].uri]);
    }
  };

  const uploadImage = async (uri, index) => {
    // If it's already a remote URL, don't re-upload
    if (uri.startsWith('http')) {
      return uri;
    }

    const response = await fetch(uri);
    const blob = await response.blob();
    const filename = `${user?.uid}/photo_${index}_${Date.now()}.jpg`;
    const storageRef = ref(storage, filename);
    await uploadBytes(storageRef, blob);
    return await getDownloadURL(storageRef);
  };

  const saveProfile = async () => {
    if (!name || !age || !gender || !interestedIn || photos.length === 0) {
      Alert.alert('Missing fields', 'Please fill in all fields and upload at least one photo.');
      return;
    }

    if (parseInt(age) < 18) {
      Alert.alert('Age restriction', 'You must be at least 18 years old.');
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
        photos: photoUrls,
        updatedAt: serverTimestamp(),
        // Keep createdAt if it exists, or set it if new? 
        // setDoc with merge: true might be better, but we are overwriting most fields.
        // Let's just add createdAt if it's a new profile
        ...(userData ? {} : { createdAt: serverTimestamp() }),
      }, { merge: true });

      await refreshUserData();
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setUploading(false);
    }
  };

  const SelectButton = ({ label, value, selected, onSelect }) => (
    <TouchableOpacity 
      onPress={() => onSelect(value)}
      style={[
        styles.selectButton, 
        selected === value && styles.selectButtonActive
      ]}
    >
      <Text style={[styles.selectText, selected === value && styles.selectTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={GRADIENTS.dark} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Create Profile</Text>
        
        <Text style={styles.label}>Photos</Text>
        <ScrollView horizontal style={styles.photosContainer}>
          {photos.map((uri, index) => (
            <View key={index} style={styles.photoWrapper}>
              <Image source={{ uri }} style={styles.photo} />
              <TouchableOpacity 
                style={styles.removePhoto}
                onPress={() => setPhotos(photos.filter((_, i) => i !== index))}
              >
                <Ionicons name="close-circle" size={24} color={COLORS.error} />
              </TouchableOpacity>
            </View>
          ))}
          {photos.length < 6 && (
            <TouchableOpacity style={styles.addPhoto} onPress={pickImage}>
              <Ionicons name="add" size={40} color={COLORS.textSecondary} />
            </TouchableOpacity>
          )}
        </ScrollView>

        <Text style={styles.label}>Name</Text>
        <GlassInput value={name} onChangeText={setName} placeholder="Your Name" />

        <Text style={styles.label}>Age</Text>
        <GlassInput value={age} onChangeText={setAge} placeholder="18" keyboardType="number-pad" />

        <Text style={styles.label}>Gender</Text>
        <View style={styles.row}>
          <SelectButton label="Male" value="male" selected={gender} onSelect={setGender} />
          <SelectButton label="Female" value="female" selected={gender} onSelect={setGender} />
        </View>

        <Text style={styles.label}>Interested In</Text>
        <View style={styles.row}>
          <SelectButton label="Male" value="male" selected={interestedIn} onSelect={setInterestedIn} />
          <SelectButton label="Female" value="female" selected={interestedIn} onSelect={setInterestedIn} />
          <SelectButton label="Both" value="both" selected={interestedIn} onSelect={setInterestedIn} />
        </View>

        <Text style={styles.label}>Bio</Text>
        <GlassInput 
          value={bio} 
          onChangeText={setBio} 
          placeholder="Tell us about yourself..." 
          multiline 
          numberOfLines={4}
          style={{ height: 100, textAlignVertical: 'top' }}
        />

        <GlassButton 
          title={uploading ? "Creating Profile..." : "Save Profile"} 
          onPress={saveProfile} 
          disabled={uploading}
          style={{ marginTop: 20 }}
        />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 30,
  },
  label: {
    color: COLORS.textSecondary,
    marginBottom: 10,
    marginLeft: 5,
    fontSize: 16,
  },
  photosContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  photoWrapper: {
    marginRight: 10,
    position: 'relative',
  },
  photo: {
    width: 100,
    height: 150,
    borderRadius: 10,
  },
  removePhoto: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: COLORS.background,
    borderRadius: 12,
  },
  addPhoto: {
    width: 100,
    height: 150,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderStyle: 'dashed',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  selectButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginRight: 10,
    marginBottom: 10,
  },
  selectButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  selectText: {
    color: COLORS.textSecondary,
  },
  selectTextActive: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
});
