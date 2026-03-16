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
import AdService from '../services/AdService';

const { width } = Dimensions.get('window');
const PHOTO_SIZE = width * 0.4; // Larger size for single photo

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
  const [photo, setPhoto] = useState(null);
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
      setPhoto(userData.photo || null);
      setInterests(userData.interests || []);
      setGender(userData.gender || '');
      setInterestedIn(userData.interestedIn || '');
      setLookingFor(userData.lookingFor || '');
      setReligion(userData.religion || '');
    }
  }, [userData]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.6,
    });
    if (!result.canceled) setPhoto(result.assets[0].uri);
  };

  const removePhoto = () => {
    setPhoto(null);
  };

  const toggleInterest = (interest) => {
    if (interests.includes(interest)) setInterests(interests.filter(i => i !== interest));
    else setInterests([...interests, interest]);
  };

  const uploadImage = async (uri) => {
    if (uri.startsWith('http')) return uri;
    const response = await fetch(uri);
    const blob = await response.blob();
    const filename = `${user?.uid}/profile_photo_${Date.now()}.jpg`;
    const storageRef = ref(storage, filename);
    await uploadBytes(storageRef, blob);
    return await getDownloadURL(storageRef);
  };

  const handleSave = async () => {
    const missing = [];
    if (!name) missing.push('Name');
    if (!age) missing.push('Age');
    if (!photo) missing.push('Profile Photo');
    
    // Bio validation: at least 20 characters, no empty spaces
    const cleanBio = bio.trim();
    if (!cleanBio || cleanBio.length < 20) {
      missing.push('Bio (at least 20 characters)');
    }

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
      const photoUrl = await uploadImage(photo);
      const updateData = {
        id: user.uid,
        name,
        age: parseInt(age),
        bio,
        job,
        photo: photoUrl,
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
      await AdService.showSaveProfileAd();
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Update failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderInterestItem = (item) => {
    const isSelected = interests.includes(item.label);
    const color = '#FF2D55'; // Vibrant pink/red
    
    return (
      <TouchableOpacity
        key={item.label}
        activeOpacity={0.8}
        onPress={() => toggleInterest(item.label)}
        style={{ 
          width: '48%', 
          marginBottom: 10,
        }}
      >
        <View style={[
          styles.interestCapsule, 
          isSelected && {
            borderColor: color + '99', 
            backgroundColor: color + '20',
            borderWidth: 1.5,
          }
        ]}>
          <BlurView intensity={isSelected ? 50 : 15} tint="dark" style={{ overflow: 'hidden', borderRadius: 18 }}>
            <LinearGradient
              colors={isSelected ? [color + '4D', color + '1A'] : ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.03)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ paddingHorizontal: 15, paddingVertical: 14 }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons 
                  name={isSelected ? item.icon.replace('-outline', '') : item.icon} 
                  size={20} 
                  color={isSelected ? '#fff' : 'rgba(255,255,255,0.4)'} 
                  style={{ marginRight: 8 }} 
                />
                <Text style={[
                  styles.interestText, 
                  isSelected && { color: '#fff', fontWeight: '800' }
                ]}>
                  {item.label}
                </Text>
              </View>
            </LinearGradient>
          </BlurView>
        </View>
      </TouchableOpacity>
    );
  };

  const renderGridOption = (option, selectedValue, onSelect, color = '#FF2D55', isFullWidth = false, index = 0) => {
    const isSelected = selectedValue === option.label;
    const isRightAligned = isFullWidth && index % 2 !== 0;
    
    return (
      <TouchableOpacity
        key={option.label}
        activeOpacity={0.8}
        onPress={() => onSelect(option.label)}
        style={{ 
          width: isFullWidth ? '100%' : '48%', 
          marginBottom: 6, // Reduced from 12 to 6
        }}
      >
        <View style={[
          styles.optionCapsule, 
          isSelected && {
            borderWidth: 1.5, 
            borderColor: color + '66', 
            backgroundColor: color + '1A' 
          },
          isFullWidth && { maxWidth: '85%', alignSelf: isRightAligned ? 'flex-end' : 'flex-start' }
        ]}>
          <BlurView intensity={isSelected ? 40 : 10} tint="dark" style={{ overflow: 'hidden', borderRadius: 20 }}>
            <LinearGradient
              colors={isSelected ? [color + '33', color + '0D'] : ['rgba(255,255,255,0.05)', 'rgba(255,255,255,0.02)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ paddingHorizontal: 15, paddingVertical: 12 }}
            >
              <View style={{flexDirection: isRightAligned ? 'row-reverse' : 'row', alignItems: 'center'}}>
                <Ionicons 
                  name={option.icon} 
                  size={24} 
                  color={isSelected ? color : 'rgba(255,255,255,0.4)'} 
                  style={isRightAligned ? { marginLeft: 12 } : { marginRight: 12 }} 
                />
                <Text style={[
                  styles.optionText, 
                  isSelected && { color: '#fff', fontWeight: '800' },
                  { textAlign: isRightAligned ? 'right' : 'left' }
                ]}>
                  {option.label}
                </Text>
              </View>
            </LinearGradient>
          </BlurView>
        </View>
      </TouchableOpacity>
    );
  };

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
          <Text style={styles.sectionTitle}>Profile Photo</Text>
          <View style={styles.photosGrid}>
              <TouchableOpacity style={styles.photoBox} onPress={() => !photo && pickImage()}>
                {photo ? (
                  <View style={styles.fullSize}>
                    <Image source={{ uri: photo }} style={styles.photo} />
                    <TouchableOpacity style={styles.editPhotoBtn} onPress={pickImage}>
                      <BlurView intensity={80} tint="dark" style={styles.editPhotoBlur}>
                        <Ionicons name="camera" size={20} color="#fff" />
                        <Text style={styles.editPhotoText}>Change</Text>
                      </BlurView>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.removeBtn} onPress={removePhoto}>
                      <Ionicons name="close-circle" size={24} color="#FF2D55" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.addPlaceholder}>
                    <Ionicons name="add" size={40} color="rgba(255,255,255,0.2)" />
                    <Text style={styles.addPhotoText}>Add Photo</Text>
                  </View>
                )}
              </TouchableOpacity>
          </View>

          {/* Basic Info Group */}
          <Text style={styles.sectionTitle}>Basic Info</Text>
          <BlurView intensity={10} tint="dark" style={styles.glassGroup}>
              <View style={styles.row}>
                  <View style={styles.rowLabelContainer}>
                    <View style={[styles.rowIconCircle, { backgroundColor: 'rgba(255, 45, 85, 0.1)' }]}>
                      <Ionicons name="person-outline" size={18} color="#FF2D55" />
                    </View>
                    <Text style={styles.rowLabel}>Name</Text>
                  </View>
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
                  <View style={styles.rowLabelContainer}>
                    <View style={[styles.rowIconCircle, { backgroundColor: 'rgba(10, 132, 255, 0.1)' }]}>
                      <Ionicons name="briefcase-outline" size={18} color="#0A84FF" />
                    </View>
                    <Text style={styles.rowLabel}>Job Title</Text>
                  </View>
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
                  <View style={styles.rowLabelContainer}>
                    <View style={[styles.rowIconCircle, { backgroundColor: 'rgba(50, 215, 75, 0.1)' }]}>
                      <Ionicons name="calendar-outline" size={18} color="#32D74B" />
                    </View>
                    <Text style={styles.rowLabel}>Age</Text>
                  </View>
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
              <View style={styles.bioHeader}>
                <View style={[styles.rowIconCircle, { backgroundColor: 'rgba(175, 82, 222, 0.1)' }]}>
                  <Ionicons name="chatbubble-ellipses-outline" size={18} color="#AF52DE" />
                </View>
                <Text style={styles.rowLabel}>Bio</Text>
              </View>
              <GlassInput 
                  placeholder="Tell them something interesting about yourself..." 
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
              {GENDER_OPTIONS.map(opt => renderGridOption(opt, gender, setGender, '#0A84FF'))}
            </View>

            {/* Interested In Section */}
            <Text style={styles.sectionTitle}>Interested In</Text>
            <View style={styles.gridContainer}>
              {INTERESTED_IN_OPTIONS.map(opt => renderGridOption(opt, interestedIn, setInterestedIn, '#AF52DE'))}
            </View>

            {/* Looking For Section */}
            <Text style={styles.sectionTitle}>Looking For</Text>
            <View style={[styles.gridContainer, { flexDirection: 'column' }]}>
              {LOOKING_FOR_OPTIONS.map((opt, idx) => renderGridOption(opt, lookingFor, setLookingFor, '#FF2D55', true, idx))}
            </View>

            {/* Religion Section */}
            <Text style={styles.sectionTitle}>Religion</Text>
            <View style={styles.gridContainer}>
              {RELIGION_OPTIONS.map(opt => renderGridOption(opt, religion, setReligion, '#32D74B'))}
            </View>

            {/* Interests Section */}
            <Text style={styles.sectionTitle}>Interests</Text>
            <View style={styles.interestsContainer}>
                {INTERESTS_LIST.map((item) => renderInterestItem(item))}
            </View>
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
    paddingBottom: 20,
  },
  sectionTitle: { color: 'rgba(255,255,255,0.4)', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 25, marginBottom: 10, marginLeft: 5 },
  
  // Photos Grid
  photosGrid: { flexDirection: 'row', justifyContent: 'center', marginBottom: 20 },
  photoBox: { width: PHOTO_SIZE, height: PHOTO_SIZE * 1.3, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' },
  fullSize: { flex: 1 },
  photo: { width: '100%', height: '100%', resizeMode: 'cover' },
  addPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  addPhotoText: { color: 'rgba(255,255,255,0.3)', marginTop: 10, fontSize: 14, fontWeight: '600' },
  removeBtn: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 12 },
  editPhotoBtn: { position: 'absolute', bottom: 10, alignSelf: 'center', width: '80%' },
  editPhotoBlur: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: 15, overflow: 'hidden' },
  editPhotoText: { color: '#fff', fontSize: 12, fontWeight: '700', marginLeft: 6 },

  // Glass Grouping Styles
  glassGroup: { borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.02)', paddingVertical: 5 },
  optionCapsule: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  optionText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 15,
    fontWeight: '600',
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 15, height: 60 },
  rowLabelContainer: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  rowIconCircle: { width: 32, height: 32, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  rowLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 16, fontWeight: '600' },
  rowInput: { flex: 1.5, backgroundColor: 'transparent', borderWidth: 0, height: '100%', justifyContent: 'center' },
  alignRight: { textAlign: 'right', color: '#fff', fontWeight: '700', paddingBottom: 0, paddingRight: 5 },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginLeft: 60 },
  bioHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingTop: 15, paddingBottom: 5 },
  bioInput: { minHeight: 100, textAlignVertical: 'top', color: '#fff', paddingHorizontal: 15, paddingTop: 10, fontSize: 15, lineHeight: 22 },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  interestCapsule: {
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    position: 'relative',
  },
  interestText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    fontWeight: '600',
  },
});
