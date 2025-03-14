import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, Headline, HelperText } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { spacing } from '../../utils/theme';

/**
 * Screen for logging in with PIN
 */
const LoginScreen: React.FC = () => {
  const { login } = useAuth();
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);

  // Handle login
  const handleLogin = async () => {
    // Reset error state
    setError(null);

    // Validate PIN
    if (pin.length < 4) {
      setError('PIN must be at least 4 digits');
      return;
    }

    try {
      setLoading(true);
      const success = await login(pin);

      if (!success) {
        // Increment attempts and set error
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);

        if (newAttempts >= 5) {
          setError('Too many failed attempts. Please try again later.');
          // In a real app, you might want to implement a timeout here
        } else {
          setError('Invalid PIN. Please try again.');
        }

        // Clear PIN field
        setPin('');
      }
    } catch (err) {
      console.error('Error during login:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <Image
          source={require('../../../assets/icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <Headline style={styles.title}>Auto Organize Me</Headline>

        <Text style={styles.subtitle}>Enter your PIN to continue</Text>

        <View style={styles.form}>
          <TextInput
            label="PIN"
            value={pin}
            onChangeText={setPin}
            style={styles.input}
            keyboardType="number-pad"
            maxLength={6}
            secureTextEntry
            mode="outlined"
            error={!!error}
            autoFocus
          />

          {error && <HelperText type="error">{error}</HelperText>}

          <Button
            mode="contained"
            onPress={handleLogin}
            style={styles.button}
            loading={loading}
            disabled={loading || pin.length < 4 || attempts >= 5}
          >
            Log In
          </Button>
        </View>

        <Text style={styles.infoText}>Enter the PIN you created to secure your app.</Text>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: spacing.xl,
    textAlign: 'center',
    color: '#666',
  },
  form: {
    width: '100%',
    maxWidth: 300,
  },
  input: {
    marginBottom: spacing.md,
  },
  button: {
    marginTop: spacing.md,
  },
  infoText: {
    marginTop: spacing.xl,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
});

export default LoginScreen;
