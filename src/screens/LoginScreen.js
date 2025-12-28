import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform, TouchableOpacity, ScrollView, ImageBackground } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { GoogleAuthProvider, signInWithCredential, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';
import { GlassButton } from '../components/GlassButton';
import { GlassInput } from '../components/GlassInput';
import { COLORS } from '../styles/theme';
import { makeRedirectUri } from 'expo-auth-session';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [confirmPasswordError, setConfirmPasswordError] = useState(false);
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  WebBrowser.maybeCompleteAuthSession();
  const isDev = __DEV__;
  const ANDROID_CLIENT_ID = '1014322922040-jbp96d1498fc785e6uhmjpj0qq163lac.apps.googleusercontent.com'; // add your Android client ID here for production builds
  const WEB_CLIENT_ID = '1014322922040-18vqb0a00c7he05s0hjfpr4d1iagta2l.apps.googleusercontent.com';
  
  const redirectUri = makeRedirectUri({
    useProxy: isDev,
    scheme: isDev ? undefined : 'lovify'
  });

  useEffect(() => {
    console.log('generated redirect uri:', redirectUri);
  }, [redirectUri]);

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential).catch(error => {
        Alert.alert('Login Error', error.message);
      });
    }
  }, [response]);

  // In Expo Go, we use the Web Client ID for the Android Client ID prop to satisfy the library requirement
  // and ensure the request uses a Client ID that supports the redirect URI.
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: isDev ? WEB_CLIENT_ID : ANDROID_CLIENT_ID,
    webClientId: WEB_CLIENT_ID,
    scopes: ['profile', 'email'],
    redirectUri
  });

  const onGoogle = async () => {
    try {
      if (ANDROID_CLIENT_ID === 'your-android-client-id') {
         Alert.alert('Configuration Error', 'Please set your Android Client ID in LoginScreen.js');
         return;
      }
      
      console.log('Redirect URI:', redirectUri); // For debugging
      
      const result = await promptAsync();
      
      if (result?.type !== 'success') {
        if (result?.type === 'error') {
           Alert.alert('Google Sign-In Error', result.error?.message || 'Something went wrong');
        }
        return;
      }
      // The useEffect will handle the success case
    } catch (err) {
      console.error(err);
      Alert.alert('Error', err.message);
    }
  };

  const validateEmail = (email) => {
    // RFC 5322 compliant regex
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
  };

  const validatePassword = (password) => {
    // Min 8 chars, at least 1 uppercase, 1 lowercase, 1 number, 1 special character
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return re.test(password);
  };

  const handleEmailChange = (text) => {
    setEmail(text);
    if (text.length > 0) {
      setEmailError(!validateEmail(text));
    } else {
      setEmailError(false);
    }
  };

  const handlePasswordChange = (text) => {
    setPassword(text);
    if (isSignup && text.length > 0) {
      setPasswordError(!validatePassword(text));
    } else {
      setPasswordError(false);
    }
  };

  const handleConfirmPasswordChange = (text) => {
    setConfirmPassword(text);
    if (isSignup && text.length > 0) {
      setConfirmPasswordError(text !== password);
    } else {
      setConfirmPasswordError(false);
    }
  };

  const handleEmailAuth = async () => {
    // Basic empty check
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      setEmailError(!email);
      setPasswordError(!password);
      return;
    }

    // Email validation
    if (!validateEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      setEmailError(true);
      return;
    }

    // Signup specific validations
    if (isSignup) {
      // Password strength check
      if (!validatePassword(password)) {
        Alert.alert(
          'Weak Password', 
          'Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character (@$!%*?&)'
        );
        setPasswordError(true);
        return;
      }

      if (!confirmPassword) {
        Alert.alert('Error', 'Please confirm your password');
        setConfirmPasswordError(true);
        return;
      }

      if (password !== confirmPassword) {
        Alert.alert('Error', 'Passwords do not match');
        setConfirmPasswordError(true);
        return;
      }
    }

    setLoading(true);
    try {
      if (isSignup) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error) {
      let message = error.message;
      if (error.code === 'auth/email-already-in-use') {
        message = 'That email address is already in use!';
      } else if (error.code === 'auth/invalid-email') {
        message = 'That email address is invalid!';
      } else if (error.code === 'auth/weak-password') {
        message = 'Password should be at least 6 characters';
      } else if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
         message = 'Invalid email or password';
      }
      Alert.alert('Authentication Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground 
      source={require('../../assets/backgroundImage.jpeg')} 
      style={styles.container} 
      resizeMode="cover"
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
          <Text style={styles.title}>Lovify</Text>
          {/* <Text style={styles.subtitle}>{isSignup ? 'Create Account' : 'Welcome Back'}</Text> */}

          <View style={styles.form}>
            <GlassInput
              placeholder="Email"
              value={email}
              onChangeText={handleEmailChange}
              keyboardType="email-address"
              autoCapitalize="none"
              error={emailError}
            />
            <GlassInput
              placeholder="Password"
              value={password}
              onChangeText={handlePasswordChange}
              secureTextEntry={!showPassword}
              error={passwordError}
              rightIcon={showPassword ? "eye-off" : "eye"}
              onRightIconPress={() => setShowPassword(!showPassword)}
            />
            
            {isSignup && (
              <GlassInput
                placeholder="Confirm Password"
                value={confirmPassword}
                onChangeText={handleConfirmPasswordChange}
                secureTextEntry={!showConfirmPassword}
                error={confirmPasswordError}
                rightIcon={showConfirmPassword ? "eye-off" : "eye"}
                onRightIconPress={() => setShowConfirmPassword(!showConfirmPassword)}
              />
            )}
            
            <GlassButton 
              title={loading ? "Please wait..." : (isSignup ? "Sign Up" : "Login")}
              onPress={handleEmailAuth}
              disabled={loading}
              tint="dark"
              style={styles.tabLikeButton}
              textStyle={styles.tabLikeButtonText}
            />

            <TouchableOpacity onPress={() => setIsSignup(!isSignup)} style={styles.switchButton}>
              <Text style={styles.switchText}>
                {isSignup ? "Already have an account? Login" : "Don't have an account? Sign Up"}
              </Text>
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <GlassButton 
              title="Continue with Google" 
              onPress={onGoogle}
              tint="dark"
              style={[styles.tabLikeButton, { marginTop: 10 }]}
              textStyle={styles.tabLikeButtonText}
              icon={<Ionicons name="logo-google" size={24} color="white" />}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 30,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  subtitle: {
    fontSize: 18,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 30,
  },
  form: {
    width: '100%',
  },
  switchButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  switchText: {
    color: COLORS.text,
    fontSize: 14,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  dividerText: {
    color: COLORS.textSecondary,
    paddingHorizontal: 10,
    fontSize: 12,
  },
  tabLikeButton: {
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    overflow: 'hidden',
  },
  tabLikeButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
});
