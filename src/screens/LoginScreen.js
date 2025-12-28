import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform, TouchableOpacity, ScrollView } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { GoogleAuthProvider, signInWithCredential, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebase';
import { GlassButton } from '../components/GlassButton';
import { GlassInput } from '../components/GlassInput';
import { COLORS } from '../styles/theme';
import { makeRedirectUri } from 'expo-auth-session';

export default function LoginScreen() {
  const [isSignup, setIsSignup] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

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

  const handleEmailAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
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
      } else if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
         message = 'Invalid email or password';
      }
      Alert.alert('Authentication Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
          <Text style={styles.title}>Lovify</Text>
          <Text style={styles.subtitle}>{isSignup ? 'Create Account' : 'Welcome Back'}</Text>

          <View style={styles.form}>
            <GlassInput
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <GlassInput
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            
            <GlassButton 
              title={loading ? "Please wait..." : (isSignup ? "Sign Up" : "Login")}
              onPress={handleEmailAuth}
              disabled={loading}
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
              style={{ marginTop: 10, backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
            />
            {isDev && (
              <Text style={{color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: 20, fontSize: 10}}>
                Redirect URI: {redirectUri}
              </Text>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 10,
    textShadowColor: 'rgba(255, 75, 139, 0.5)',
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
});
