import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Image, TouchableOpacity, Dimensions, StatusBar, ActivityIndicator, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../services/firebase';
import { useAuth } from '../services/AuthContext';
import { GlassInput } from '../components/GlassInput';
import { GlassChip } from '../components/GlassChip';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');
const GRID_SPACING = 10;
const PHOTO_SIZE = (width - 60) / 3;

const INTERESTS_LIST = [
  { label: "Music", icon: "musical-notes-outline" },
  { label: "Food", icon: "restaurant-outline" },
  { label: "Travel", icon: "airplane-outline" },
  { label: "Gym", icon: "barbell-outline" },
  { label: "Movies", icon: "videocam-outline" },
  { label: "Dance", icon: "disc-outline" },
  { label: "Bars", icon: "wine-outline" },
  { label: "Club", icon: "beer-outline" },
  { label: "Anime", icon: "tv-outline" },
  { label: "Beaches", icon: "water-outline" },
  { label: "Mountais", icon: "trail-sign-outline" },
  { label: "Reading", icon: "book-outline" }
];

const GENDER_OPTIONS = [
  { label: 'Male', icon: 'male-outline' },
  { label: 'Female', icon: 'female-outline' },
  { label: 'Other', icon: 'male-female-outline' }
];

const INTERESTED_IN_OPTIONS = [
  { label: 'Men', icon: 'male-outline' },
  { label: 'Women', icon: 'female-outline' },
  { label: 'Both', icon: 'people-outline' }
];

const LOOKING_FOR_OPTIONS = [
  { label: "Long time partner", icon: "heart-outline" },
  { label: "Short time partner", icon: "hourglass-outline" },
  { label: "No commitment", icon: "happy-outline" },
  { label: "Still figuring it out", icon: "help-circle-outline" },
  { label: "Hook up type", icon: "flame-outline" },
  { label: "Chill type", icon: "cafe-outline" }
];

const RELIGION_OPTIONS = [
  { label: 'Hindu', icon: 'rose-outline' },
  { label: 'Christian', icon: 'book-outline' },
  { label: 'Muslim', icon: 'moon-outline' },
  { label: 'Sikh', icon: 'flame-outline' }
];

export default function EditProfileScreen({ navigation }) {
  const { user, userData, refreshUserData } = useAuth();
  const [loading, setLoading] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [bio, setBio] = useState('');
  const [job, setJob] = useState('');
  const [photos, setPhotos] = useState([]);
  const [interests, setInterests] = useState([]);
  const [gender, setGender] = useState('');
  const [interestedIn, setInterestedIn] = useState('');
  const [lookingFor, setLookingFor] = useState('');
  const [religion, setReligion] = useState('');

  useEffect(() => {
    if (userData) {
      setName(userData.name || '');
      setAge(userData.age ? userData.age.toString() : '');
      setBio(userData.bio || '');
      setJob(userData.job || '');
      setPhotos(userData.photos || []);
      setInterests(userData.interests || []);
      setGender(userData.gender || '');
      setInterestedIn(userData.interestedIn || '');
      setLookingFor(userData.lookingFor || '');
      setReligion(userData.religion || '');
    }
  }, [userData]);

  const pickImage = async () => {
    if (photos.length >= 6) { Alert.alert('Limit reached', 'Max 6 photos allowed.'); return; }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.6,
    });
    if (!result.canceled) setPhotos([...photos, result.assets[0].uri]);
  };

  const removePhoto = (index) => {
    const newPhotos = [...photos];
    newPhotos.splice(index, 1);
    setPhotos(newPhotos);
  };

  const toggleInterest = (interest) => {
    if (interests.includes(interest)) setInterests(interests.filter(i => i !== interest));
    else setInterests([...interests, interest]);
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

  const handleSave = async () => {
    const missing = [];
    if (!name) missing.push('Name');
    if (!age) missing.push('Age');
    if (photos.length < 1) missing.push('At least 1 Photo');
    if (!gender) missing.push('Gender (I am a...)');
    if (!interestedIn) missing.push('Interested In');
    if (!lookingFor) missing.push('Looking For');
    if (!religion) missing.push('Religion');
    if (interests.length === 0) missing.push('At least 1 Interest');

    if (missing.length > 0) {
      Alert.alert('Incomplete Profile', 'Please complete the following sections:\n\n' + missing.join('\n'));
      return;
    }
    
    setLoading(true);
    try {
      const photoUrls = await Promise.all(photos.map((photo, index) => uploadImage(photo, index)));
      const updateData = {
        id: user.uid,
        name,
        age: parseInt(age),
        bio,
        job,
        photos: photoUrls,
        interests,
        gender,
        interestedIn,
        lookingFor,
        religion,
        updatedAt: serverTimestamp(),
        ...(userData ? {} : { createdAt: serverTimestamp() }),
      };
      await setDoc(doc(db, 'users', user.uid), updateData, { merge: true });
      await refreshUserData();
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Update failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderGridOption = (option, selectedValue, onSelect) => (
    <TouchableOpacity 
      key={option.label} 
      style={[styles.gridOption, selectedValue === option.label && styles.gridOptionSelected]} 
      onPress={() => onSelect(option.label)}
    >
      <Ionicons 
        name={option.icon} 
        size={24} 
        color={selectedValue === option.label ? '#FF2D55' : 'rgba(255, 45, 85, 0.5)'} 
        style={{ marginBottom: 5 }} 
      />
      <Text style={[styles.gridOptionText, selectedValue === option.label && styles.gridOptionTextSelected]}>
        {option.label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#1a080e', '#000000']} style={StyleSheet.absoluteFill} />
      
      {/* Absolute Header matching AppHeader style */}
      <BlurView intensity={30} tint="dark" style={styles.headerContainer}>
        <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Edit Profile</Text>
            <TouchableOpacity onPress={handleSave} disabled={loading}>
                {loading ? <ActivityIndicator size="small" color="#FF2D55" /> : <Text style={styles.saveText}>Save</Text>}
            </TouchableOpacity>
        </View>
      </BlurView>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Photos Section */}
          <Text style={styles.sectionTitle}>Profile Photos ({photos.length}/6)</Text>
          <View style={styles.photosGrid}>
            {Array(6).fill(0).map((_, index) => (
              <TouchableOpacity key={index} style={styles.photoBox} onPress={() => !photos[index] && pickImage()}>
                {photos[index] ? (
                  <View style={styles.fullSize}>
                    <Image source={{ uri: photos[index] }} style={styles.photo} />
                    <TouchableOpacity style={styles.removeBtn} onPress={() => removePhoto(index)}>
                      <Ionicons name="close-circle" size={20} color="#FF2D55" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.addPlaceholder}>
                    <Ionicons name="add" size={24} color="rgba(255,255,255,0.2)" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Basic Info Group */}
          <Text style={styles.sectionTitle}>Basic Info</Text>
          <BlurView intensity={10} tint="dark" style={styles.glassGroup}>
              <View style={styles.row}>
                  <Text style={styles.rowLabel}>Name</Text>
                  <GlassInput 
                      value={name} 
                      onChangeText={setName} 
                      containerStyle={styles.rowInput} 
                      style={styles.alignRight} 
                      placeholder="Enter Name" 
                      placeholderTextColor="rgba(255,255,255,0.3)"
                  />
              </View>
              <View style={styles.divider} />
              <View style={styles.row}>
                  <Text style={styles.rowLabel}>Job Title</Text>
                  <GlassInput 
                      value={job} 
                      onChangeText={setJob} 
                      containerStyle={styles.rowInput} 
                      style={styles.alignRight} 
                      placeholder="Enter Job" 
                      placeholderTextColor="rgba(255,255,255,0.3)"
                  />
              </View>
              <View style={styles.divider} />
              <View style={styles.row}>
                  <Text style={styles.rowLabel}>Age</Text>
                  <GlassInput 
                      value={age} 
                      onChangeText={setAge} 
                      keyboardType="numeric" 
                      containerStyle={styles.rowInput} 
                      style={styles.alignRight} 
                      placeholder="Age" 
                      placeholderTextColor="rgba(255,255,255,0.3)"
                  />
              </View>
          </BlurView>

          {/* Bio Section */}
          <Text style={styles.sectionTitle}>About Me</Text>
          <BlurView intensity={10} tint="dark" style={styles.glassGroup}>
              <GlassInput 
                  placeholder="Tell them About your self" 
                  value={bio} 
                  onChangeText={setBio} 
                  multiline 
                  containerStyle={{borderWidth: 0, backgroundColor: 'transparent'}}
                  style={styles.bioInput} 
              />
          </BlurView>

          {/* Gender Section */}
          <Text style={styles.sectionTitle}>I am a</Text>
          <View style={styles.gridContainer}>
            {GENDER_OPTIONS.map(opt => renderGridOption(opt, gender, setGender))}
          </View>

          {/* Interested In Section */}
          <Text style={styles.sectionTitle}>Interested In</Text>
          <View style={styles.gridContainer}>
            {INTERESTED_IN_OPTIONS.map(opt => renderGridOption(opt, interestedIn, setInterestedIn))}
          </View>

          {/* Looking For Section */}
          <Text style={styles.sectionTitle}>Looking For</Text>
          <View style={styles.gridContainer}>
            {LOOKING_FOR_OPTIONS.map(opt => renderGridOption(opt, lookingFor, setLookingFor))}
          </View>

          {/* Religion Section */}
          <Text style={styles.sectionTitle}>Religion</Text>
          <View style={styles.gridContainer}>
            {RELIGION_OPTIONS.map(opt => renderGridOption(opt, religion, setReligion))}
          </View>

          {/* Interests Section */}
          <Text style={styles.sectionTitle}>Interests</Text>
          <View style={styles.interestsContainer}>
              {INTERESTS_LIST.map((item) => (
                  <GlassChip 
                    key={item.label} 
                    label={item.label} 
                    icon={item.icon}
                    selected={interests.includes(item.label)} 
                    onPress={() => toggleInterest(item.label)} 
                    style={{ width: '48%', marginRight: 0, marginBottom: 0 }}
                  />
              ))}
          </View>

          <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    paddingTop: Platform.OS === 'android' ? 40 : 50, // Adjusted for status bar
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
  saveText: { color: '#FF2D55', fontSize: 17, fontWeight: '800' },
  scrollContent: { 
    paddingHorizontal: 20,
    paddingTop: 110, // Push content down below header
    paddingBottom: 40,
  },
  sectionTitle: { color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 25, marginBottom: 10, marginLeft: 5 },
  
  // Photos Grid
  photosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: GRID_SPACING, justifyContent: 'center' },
  photoBox: { width: PHOTO_SIZE, height: PHOTO_SIZE * 1.3, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' },
  fullSize: { flex: 1 },
  photo: { width: '100%', height: '100%', resizeMode: 'cover' },
  addPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  removeBtn: { position: 'absolute', top: 5, right: 5 },

  // Glass Grouping Styles
  glassGroup: { borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.02)', paddingVertical: 5 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, height: 50 },
  rowLabel: { color: '#fff', fontSize: 16, fontWeight: '500' },
  rowInput: { flex: 1, backgroundColor: 'transparent', borderWidth: 0, height: '100%', justifyContent: 'center' },
  alignRight: { textAlign: 'right', color: '#FF2D55', fontWeight: '700', paddingBottom: 0 ,paddingRight: 15 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginLeft: 15 },
  bioInput: { height: 80, textAlignVertical: 'top', color: '#fff', paddingHorizontal: 15, paddingTop: 10 },
  
  // Grid Styles
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' },
  gridOption: { width: '48%', backgroundColor: 'rgba(255,255,255,0.05)', padding: 15, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  gridOptionSelected: { backgroundColor: 'rgba(255, 45, 85, 0.3)', borderColor: '#FF2D55' },
  gridOptionText: { color: 'rgba(255,255,255,0.7)', fontSize: 13, textAlign: 'center', marginTop: 4 },
  gridOptionTextSelected: { color: '#fff', fontWeight: 'bold' },

  interestsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', paddingHorizontal: 10 },
});
