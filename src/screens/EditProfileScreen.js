import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, Switch, Image, Dimensions, SafeAreaView, StatusBar } from 'react-native';
import { useAuth } from '../services/AuthContext';
import { GlassBottomSheet } from '../components/GlassBottomSheet';
import { GlassButton } from '../components/GlassButton';
import { GlassInput } from '../components/GlassInput';
import { GlassChip } from '../components/GlassChip';
import { Ionicons } from '@expo/vector-icons';
import { doc, updateDoc } from 'firebase/firestore';
import { db, storage } from '../services/firebase';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { BlurView } from 'expo-blur';
import { COLORS } from '../styles/theme';

const { width } = Dimensions.get('window');
const PHOTO_SIZE = (width - 60) / 3;

const INTERESTS_LIST = ["Music", "Travel", "Gym", "Movies", "Cooking", "Gaming", "Art", "Coding", "Yoga", "Photography", "Hiking", "Reading"];

export default function EditProfileScreen({ navigation }) {
  const { userData, refreshUserData, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeSheet, setActiveSheet] = useState(null); // 'gender', 'interestedIn'

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
  const [location, setLocation] = useState('');
  const [qualities, setQualities] = useState([]);
  const [maxDistance, setMaxDistance] = useState('50');
  const [ageRange, setAgeRange] = useState({ min: '18', max: '35' });
  
  // App Experience
  const [showAge, setShowAge] = useState(true);
  const [showDistance, setShowDistance] = useState(true);

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
      setLocation(userData.location || '');
      setQualities(userData.qualities || []);
      setMaxDistance(userData.maxDistance ? userData.maxDistance.toString() : '50');
      setAgeRange(userData.ageRange || { min: '18', max: '35' });
      setShowAge(userData.showAge !== false);
      setShowDistance(userData.showDistance !== false);
    }
  }, [userData]);

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

  const removePhoto = (index) => {
    const newPhotos = [...photos];
    newPhotos.splice(index, 1);
    setPhotos(newPhotos);
  };

  const toggleInterest = (interest) => {
    if (interests.includes(interest)) {
      setInterests(interests.filter(i => i !== interest));
    } else {
      setInterests([...interests, interest]);
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

  const handleSave = async () => {
    if (!name || !age || photos.length === 0) {
      Alert.alert('Error', 'Name, Age and at least 1 photo are required.');
      return;
    }

    if (parseInt(age) < 18) {
        Alert.alert('Error', 'You must be 18+ to use this app.');
        return;
    }

    setLoading(true);
    try {
      const photoUrls = await Promise.all(photos.map((photo, index) => uploadImage(photo, index)));
      
      const updateData = {
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
        location,
        qualities,
        maxDistance: parseInt(maxDistance),
        ageRange,
        showAge,
        showDistance,
      };

      await updateDoc(doc(db, 'users', user.uid), updateData);
      await refreshUserData();
      Alert.alert('Success', 'Profile updated successfully!');
      navigation.goBack();
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const renderSheetContent = () => {
    if (activeSheet === 'gender') {
      const options = [
        { label: 'Male', icon: 'male-outline' },
        { label: 'Female', icon: 'female-outline' },
        { label: 'Other', icon: 'male-female-outline' }
      ];
      return (
        <View style={styles.sheetContent}>
          <Text style={styles.sheetTitle}>I am a...</Text>
          <View style={styles.gridContainer}>
            {options.map((opt) => (
              <TouchableOpacity 
                key={opt.label}
                style={[styles.gridOption, gender === opt.label && styles.gridOptionSelected]}
                onPress={() => {
                  setGender(opt.label);
                  setActiveSheet(null);
                }}
              >
                <Ionicons 
                    name={opt.icon} 
                    size={28} 
                    color={gender === opt.label ? '#FF2D55' : 'rgba(255, 45, 85, 0.5)'} 
                    style={{ marginBottom: 8 }}
                />
                <Text style={[styles.gridOptionText, gender === opt.label && styles.gridOptionTextSelected]}>
                    {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      );
    }
    if (activeSheet === 'interestedIn') {
        const options = [
            { label: 'Men', icon: 'male-outline' },
            { label: 'Women', icon: 'female-outline' },
            { label: 'Both', icon: 'people-outline' }
        ];
        return (
          <View style={styles.sheetContent}>
            <Text style={styles.sheetTitle}>Interested In...</Text>
            <View style={styles.gridContainer}>
                {options.map((opt) => (
                    <TouchableOpacity 
                        key={opt.label}
                        style={[styles.gridOption, interestedIn === opt.label && styles.gridOptionSelected]}
                        onPress={() => {
                            setInterestedIn(opt.label);
                            setActiveSheet(null);
                        }}
                    >
                        <Ionicons 
                            name={opt.icon} 
                            size={28} 
                            color={interestedIn === opt.label ? '#FF2D55' : 'rgba(255, 45, 85, 0.5)'} 
                            style={{ marginBottom: 8 }}
                        />
                        <Text style={[styles.gridOptionText, interestedIn === opt.label && styles.gridOptionTextSelected]}>
                            {opt.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
          </View>
        );
      }
    if (activeSheet === 'lookingFor') {
        const options = [
            { label: "Long time partner", icon: "heart-outline" },
            { label: "Short time partner", icon: "hourglass-outline" },
            { label: "No commitment", icon: "happy-outline" },
            { label: "Still figuring it out", icon: "help-circle-outline" },
            { label: "Hook up type", icon: "flame-outline" },
            { label: "Chill type", icon: "cafe-outline" }
        ];
        return (
            <View style={styles.sheetContent}>
                <Text style={styles.sheetTitle}>What are you looking for</Text>
                <View style={styles.gridContainer}>
                    {options.map((opt) => (
                        <TouchableOpacity 
                            key={opt.label}
                            style={[styles.gridOption, lookingFor === opt.label && styles.gridOptionSelected]}
                            onPress={() => {
                                setLookingFor(opt.label);
                                setActiveSheet(null);
                            }}
                        >
                            <Ionicons 
                                name={opt.icon} 
                                size={28} 
                                color={lookingFor === opt.label ? '#FF2D55' : 'rgba(255, 45, 85, 0.5)'} 
                                style={{ marginBottom: 8 }}
                            />
                            <Text style={[styles.gridOptionText, lookingFor === opt.label && styles.gridOptionTextSelected]}>
                                {opt.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        );
    }
    if (activeSheet === 'religion') {
        const options = [
            { label: 'Hindu', icon: 'rose-outline' },
            { label: 'Christian', icon: 'book-outline' },
            { label: 'Muslim', icon: 'moon-outline' },
            { label: 'Sikh', icon: 'flame-outline' }
        ];
        return (
          <View style={styles.sheetContent}>
            <Text style={styles.sheetTitle}>Religion</Text>
            <View style={styles.gridContainer}>
                {options.map((opt) => (
                    <TouchableOpacity 
                        key={opt.label}
                        style={[styles.gridOption, religion === opt.label && styles.gridOptionSelected]}
                        onPress={() => {
                            setReligion(opt.label);
                            setActiveSheet(null);
                        }}
                    >
                        <Ionicons 
                            name={opt.icon} 
                            size={28} 
                            color={religion === opt.label ? '#FF2D55' : 'rgba(255, 45, 85, 0.5)'} 
                            style={{ marginBottom: 8 }}
                        />
                        <Text style={[styles.gridOptionText, religion === opt.label && styles.gridOptionTextSelected]}>
                            {opt.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
          </View>
        );
      }
    if (activeSheet === 'qualities') {
        const options = [
            { label: 'Kindness', icon: 'heart-outline' },
            { label: 'Sarcasm', icon: 'chatbubble-ellipses-outline' },
            { label: 'Loyalty', icon: 'shield-checkmark-outline' },
            { label: 'Humor', icon: 'happy-outline' },
            { label: 'Ambition', icon: 'trending-up-outline' },
            { label: 'Patience', icon: 'hourglass-outline' },
            { label: 'Confidence', icon: 'flash-outline' },
            { label: 'Empathy', icon: 'people-outline' },
            { label: 'Adventure', icon: 'airplane-outline' }
        ];

        const toggleQuality = (quality) => {
            if (qualities.includes(quality)) {
                setQualities(qualities.filter(q => q !== quality));
            } else {
                if (qualities.length >= 3) {
                    Alert.alert('Limit Reached', 'You can only select up to 3 qualities.');
                    return;
                }
                setQualities([...qualities, quality]);
            }
        };

        return (
          <View style={styles.sheetContent}>
            <Text style={styles.sheetTitle}>Select Qualities (Max 3)</Text>
            <View style={styles.gridContainer}>
                {options.map((opt) => (
                    <TouchableOpacity 
                        key={opt.label}
                        style={[styles.gridOption, qualities.includes(opt.label) && styles.gridOptionSelected]}
                        onPress={() => toggleQuality(opt.label)}
                    >
                        <Ionicons 
                            name={opt.icon} 
                            size={28} 
                            color={qualities.includes(opt.label) ? '#FF2D55' : 'rgba(255, 45, 85, 0.5)'} 
                            style={{ marginBottom: 8 }}
                        />
                        <Text style={[styles.gridOptionText, qualities.includes(opt.label) && styles.gridOptionTextSelected]}>
                            {opt.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
          </View>
        );
      }
    return null;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                <Ionicons name="chevron-back" size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Edit Profile</Text>
            <TouchableOpacity onPress={handleSave} disabled={loading}>
                <Text style={[styles.saveText, loading && { opacity: 0.5 }]}>Save</Text>
            </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {/* Section 1: Photos */}
            <Text style={styles.sectionTitle}>Profile Photos</Text>
            <View style={styles.photosGrid}>
            {photos.map((photo, index) => (
                <View key={index} style={styles.photoWrapper}>
                <Image source={{ uri: photo }} style={styles.photo} />
                <TouchableOpacity style={styles.removeBtn} onPress={() => removePhoto(index)}>
                    <Ionicons name="close" size={12} color="#fff" />
                </TouchableOpacity>
                </View>
            ))}
            {photos.length < 6 && (
                <TouchableOpacity style={styles.addPhotoBtn} onPress={pickImage}>
                <Ionicons name="add" size={30} color="rgba(255,255,255,0.5)" />
                </TouchableOpacity>
            )}
            </View>

            {/* Section 2: Basic Info */}
            <Text style={styles.sectionTitle}>Basic Info</Text>
            <View style={styles.inputGroup}>
                <View style={styles.inputRow}>
                    <Text style={styles.inputLabel}>Name</Text>
                    <GlassInput 
                        placeholder="Name" 
                        value={name} 
                        onChangeText={setName} 
                        containerStyle={styles.inlineInput} 
                        style={{ textAlign: 'right' }}
                    />
                </View>
                <View style={styles.divider} />
                <View style={styles.inputRow}>
                    <Text style={styles.inputLabel}>Job Title</Text>
                    <GlassInput 
                        placeholder="Job" 
                        value={job} 
                        onChangeText={setJob} 
                        containerStyle={styles.inlineInput} 
                        style={{ textAlign: 'right' }}
                    />
                </View>
                <View style={styles.divider} />
                <View style={styles.inputRow}>
                    <Text style={styles.inputLabel}>Age</Text>
                    <GlassInput 
                        placeholder="Age" 
                        value={age} 
                        onChangeText={setAge} 
                        keyboardType="numeric" 
                        containerStyle={styles.inlineInput} 
                        style={{ textAlign: 'right' }}
                    />
                </View>
            </View>

            {/* Section 3: About Me */}
            <Text style={styles.sectionTitle}>About Me</Text>
            <GlassInput 
                placeholder="Write something about yourself..." 
                value={bio} 
                onChangeText={setBio} 
                multiline 
                numberOfLines={4} 
                style={{ height: 100, textAlignVertical: 'top', paddingTop: 10 }} 
            />

            {/* Section 4: Preferences (Clickable Rows) */}
            <Text style={styles.sectionTitle}>Preferences</Text>
            <View style={styles.inputGroup}>
                <TouchableOpacity style={styles.settingRow} onPress={() => setActiveSheet('gender')}>
                    <Text style={styles.settingLabel}>Gender</Text>
                    <View style={styles.settingValueContainer}>
                        <Text style={styles.settingValue}>{gender || 'Select'}</Text>
                        <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.3)" />
                    </View>
                </TouchableOpacity>
                <View style={styles.divider} />
                <TouchableOpacity style={styles.settingRow} onPress={() => setActiveSheet('interestedIn')}>
                    <Text style={styles.settingLabel}>Interested In</Text>
                    <View style={styles.settingValueContainer}>
                        <Text style={styles.settingValue}>{interestedIn || 'Select'}</Text>
                        <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.3)" />
                    </View>
                </TouchableOpacity>
                <View style={styles.divider} />
                <TouchableOpacity style={styles.settingRow} onPress={() => setActiveSheet('lookingFor')}>
                    <Text style={styles.settingLabel}>Looking For</Text>
                    <View style={styles.settingValueContainer}>
                        <Text style={styles.settingValue}>{lookingFor || 'Select'}</Text>
                        <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.3)" />
                    </View>
                </TouchableOpacity>
                <View style={styles.divider} />
                <TouchableOpacity style={styles.settingRow} onPress={() => setActiveSheet('religion')}>
                    <Text style={styles.settingLabel}>Religion</Text>
                    <View style={styles.settingValueContainer}>
                        <Text style={styles.settingValue}>{religion || 'Select'}</Text>
                        <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.3)" />
                    </View>
                </TouchableOpacity>
                <View style={styles.divider} />
                <TouchableOpacity style={styles.settingRow} onPress={() => setActiveSheet('qualities')}>
                    <Text style={styles.settingLabel}>My Qualities</Text>
                    <View style={styles.settingValueContainer}>
                        <Text style={[styles.settingValue, { maxWidth: 200, textAlign: 'right' }]} numberOfLines={1}>
                            {qualities.length > 0 ? qualities.join(', ') : 'Select (Max 3)'}
                        </Text>
                        <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.3)" />
                    </View>
                </TouchableOpacity>
            </View>

            {/* Section 5: Filters */}
            <Text style={styles.sectionTitle}>Discovery Settings</Text>
            <View style={styles.inputGroup}>
                 <View style={styles.settingRow}>
                    <Text style={styles.settingLabel}>Location</Text>
                    <GlassInput 
                        value={location} 
                        onChangeText={setLocation} 
                        placeholder="City, Country"
                        containerStyle={{ width: 160, height: 36, backgroundColor: 'transparent', borderWidth: 0 }}
                        style={{ textAlign: 'right', paddingRight: 5 }}
                    />
                </View>
                <View style={styles.divider} />
                 <View style={styles.settingRow}>
                    <Text style={styles.settingLabel}>Max Distance</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                         <GlassInput 
                            value={maxDistance} 
                            onChangeText={setMaxDistance} 
                            keyboardType="numeric" 
                            containerStyle={{ width: 60, height: 36, backgroundColor: 'transparent', borderWidth: 0 }}
                            style={{ textAlign: 'right', paddingRight: 5 }}
                        />
                        <Text style={{ color: 'rgba(255,255,255,0.5)' }}>km</Text>
                    </View>
                </View>
                <View style={styles.divider} />
                <View style={styles.settingRow}>
                    <Text style={styles.settingLabel}>Age Range</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        <GlassInput 
                            value={ageRange.min} 
                            onChangeText={(t) => setAgeRange({...ageRange, min: t})} 
                            keyboardType="numeric" 
                            containerStyle={{ width: 40, height: 36, backgroundColor: 'transparent', borderWidth: 0 }}
                            style={{ textAlign: 'center' }}
                        />
                        <Text style={{ color: 'rgba(255,255,255,0.5)' }}>-</Text>
                        <GlassInput 
                            value={ageRange.max} 
                            onChangeText={(t) => setAgeRange({...ageRange, max: t})} 
                            keyboardType="numeric" 
                            containerStyle={{ width: 40, height: 36, backgroundColor: 'transparent', borderWidth: 0 }}
                            style={{ textAlign: 'center' }}
                        />
                    </View>
                </View>
            </View>

            {/* Section 6: Interests */}
            <Text style={styles.sectionTitle}>Interests</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
            {INTERESTS_LIST.map((item) => (
                <GlassChip 
                key={item} 
                label={item} 
                selected={interests.includes(item)} 
                onPress={() => toggleInterest(item)} 
                />
            ))}
            </ScrollView>

             {/* Section 7: App Experience */}
             <Text style={styles.sectionTitle}>App Settings</Text>
             <View style={styles.inputGroup}>
                <View style={styles.settingRow}>
                    <Text style={styles.settingLabel}>Show Age</Text>
                    <Switch 
                        value={showAge} 
                        onValueChange={setShowAge} 
                        trackColor={{ false: '#767577', true: '#6e33b1' }}
                        thumbColor={showAge ? '#c0b4e3' : '#f4f3f4'}
                    />
                </View>
                <View style={styles.divider} />
                <View style={styles.settingRow}>
                    <Text style={styles.settingLabel}>Show Distance</Text>
                    <Switch 
                        value={showDistance} 
                        onValueChange={setShowDistance} 
                        trackColor={{ false: '#767577', true: '#6e33b1' }}
                        thumbColor={showDistance ? '#c0b4e3' : '#f4f3f4'}
                    />
                </View>
             </View>

            <View style={{ height: 40 }} /> 
        </ScrollView>
      </SafeAreaView>

      {/* Reusable Bottom Sheet */}
      <GlassBottomSheet visible={!!activeSheet} onClose={() => setActiveSheet(null)}>
        {renderSheetContent()}
      </GlassBottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background, // Solid background
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  saveText: {
    color: '#FF2D55',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    padding: 20,
    paddingTop: 10,
  },
  sectionTitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 25,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginLeft: 5,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  photoWrapper: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE * 1.2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  addPhotoBtn: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE * 1.2,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderStyle: 'dashed',
  },
  removeBtn: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 10,
    padding: 4,
  },
  inputGroup: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 15,
    overflow: 'hidden',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 5,
    paddingHorizontal: 15,
  },
  inputLabel: {
    color: '#fff',
    fontSize: 16,
    flex: 1,
  },
  inlineInput: {
    flex: 2,
    backgroundColor: 'transparent',
    borderWidth: 0,
    height: 40,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginLeft: 15,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 15,
  },
  settingLabel: {
    color: '#fff',
    fontSize: 16,
  },
  settingValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  settingValue: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 16,
  },
  chipsScroll: {
    flexDirection: 'row',
  },
  
  // Sheet Styles
  sheetContent: {
    padding: 20,
  },
  sheetTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  sheetOptionSelected: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  sheetOptionText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 16,
  },
  sheetOptionTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  gridOption: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  gridOptionSelected: {
    backgroundColor: 'rgba(110, 51, 177, 0.3)',
    borderColor: '#a88beb',
  },
  gridOptionText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    textAlign: 'center',
  },
  gridOptionTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
