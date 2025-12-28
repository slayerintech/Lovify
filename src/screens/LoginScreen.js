import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { LinearGradient } from 'expo-linear-gradient';
import { auth } from '../services/firebase';
import { GlassButton } from '../components/GlassButton';
import { COLORS, GRADIENTS } from '../styles/theme';
import { makeRedirectUri } from 'expo-auth-session';

export default function LoginScreen() {
  WebBrowser.maybeCompleteAuthSession();
  const isDev = __DEV__;
  const ANDROID_CLIENT_ID = '1014322922040-jbp96d1498fc785e6uhmjpj0qq163lac.apps.googleusercontent.com'; // add your Android client ID here for production builds
  const WEB_CLIENT_ID = '1014322922040-18vqb0a00c7he05s0hjfpr4d1iagta2l.apps.googleusercontent.com';
  const redirectUri = isDev ? makeRedirectUri({ useProxy: true }) : makeRedirectUri({ scheme: 'lovify' });

  // Only initialize the Google auth hook when safe:
  // - In development (Expo Go) we use proxy and webClientId
  // - In production we require androidClientId; otherwise show a setup message
  const shouldInitGoogle =
    isDev || (!!ANDROID_CLIENT_ID && ANDROID_CLIENT_ID.length > 0);

  const [request, response, promptAsync] = shouldInitGoogle
    ? Google.useAuthRequest({
        expoClientId: WEB_CLIENT_ID,
        androidClientId: ANDROID_CLIENT_ID || undefined,
        webClientId: WEB_CLIENT_ID,
        scopes: ['profile', 'email'],
        redirectUri,
      })
    : [null, null, async () => ({ type: 'error' })];

  const onGoogle = async () => {
    try {
      if (!shouldInitGoogle) {
        Alert.alert('Setup required', 'Android client ID is missing for production build.');
        return;
      }
      const result = await promptAsync({ useProxy: isDev, redirectUri });
      if (result?.type === 'success') {
        const idToken = result.authentication?.idToken;
        const accessToken = result.authentication?.accessToken;
        const credential = GoogleAuthProvider.credential(idToken, accessToken);
        await signInWithCredential(auth, credential);
      }
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  return (
    <LinearGradient colors={GRADIENTS.dark} style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <Text style={styles.title}>Lovify</Text>
        <Text style={styles.subtitle}>Find your perfect match</Text>

        <View style={styles.form}>
          <GlassButton 
            title="Continue with Google" 
            onPress={onGoogle}
            style={{ marginTop: 10 }}
          />
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
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
    marginBottom: 50,
  },
  form: {
    width: '100%',
  },
  label: {
    color: COLORS.text,
    marginBottom: 10,
    marginLeft: 5,
  },
});
