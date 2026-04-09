import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { getFirst, run } from '../database/database';

const AuthScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const normalizedEmail = email.trim().toLowerCase();

  const validateInputs = () => {
    if (!normalizedEmail || !password.trim()) {
      Alert.alert('Validation error', 'Please enter both email and password.');
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      Alert.alert('Validation error', 'Please enter a valid email address.');
      return false;
    }

    if (!isLogin && password.length < 6) {
      Alert.alert('Validation error', 'Password must contain at least 6 characters.');
      return false;
    }

    return true;
  };

  const navigateToHome = (userId, userEmail) => {
    navigation.replace('Home', { userId, userEmail });
  };

  const handleAuth = async () => {
    if (!validateInputs()) {
      return;
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        const user = await getFirst(
          'SELECT id, email FROM users WHERE email = ? AND password = ?',
          normalizedEmail,
          password
        );

        if (!user) {
          Alert.alert('Login failed', 'Incorrect email or password.');
          return;
        }

        navigateToHome(user.id, user.email);
        return;
      }

      const existingUser = await getFirst(
        'SELECT id FROM users WHERE email = ?',
        normalizedEmail
      );

      if (existingUser) {
        Alert.alert('Registration failed', 'An account with this email already exists.');
        return;
      }

      const result = await run(
        'INSERT INTO users (email, password, createdAt) VALUES (?, ?, ?)',
        normalizedEmail,
        password,
        new Date().toISOString()
      );

      navigateToHome(result.lastInsertRowId, normalizedEmail);
    } catch (error) {
      console.error('Authentication error:', error);
      Alert.alert('Error', 'Unable to complete the request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.heroCard}>
          <Text style={styles.eyebrow}>Food Journal Tracker</Text>
          <Text style={styles.title}>{isLogin ? 'Sign in' : 'Create account'}</Text>
          <Text style={styles.subtitle}>
            Save meals, photos, and daily notes in one personal journal.
          </Text>
        </View>

        <View style={styles.formCard}>
          <TextInput
            placeholder="Email"
            placeholderTextColor="#7a8797"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TextInput
            placeholder="Password"
            placeholderTextColor="#7a8797"
            value={password}
            onChangeText={setPassword}
            style={styles.input}
            secureTextEntry
            autoCapitalize="none"
          />

          {isLoading ? (
            <ActivityIndicator size="large" color="#1f6feb" />
          ) : (
            <TouchableOpacity style={styles.primaryButton} onPress={handleAuth}>
              <Text style={styles.primaryButtonText}>
                {isLogin ? 'Log in' : 'Register'}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.secondaryButton} onPress={() => setIsLogin((value) => !value)}>
            <Text style={styles.secondaryButtonText}>
              {isLogin ? 'Need an account? Register' : 'Already have an account? Log in'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f4efe6',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#f4efe6',
  },
  heroCard: {
    backgroundColor: '#183153',
    borderRadius: 24,
    padding: 24,
    marginBottom: 18,
  },
  eyebrow: {
    color: '#f2c66d',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  title: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 10,
  },
  subtitle: {
    color: '#d7dfeb',
    fontSize: 15,
    lineHeight: 22,
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#10233d',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  input: {
    height: 52,
    borderColor: '#d6dce5',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    marginBottom: 14,
    backgroundColor: '#f9fbfd',
    color: '#1d2a3a',
    fontSize: 16,
  },
  primaryButton: {
    backgroundColor: '#1f6feb',
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    marginTop: 18,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#183153',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default AuthScreen;
