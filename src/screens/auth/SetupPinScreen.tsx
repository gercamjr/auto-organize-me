import React, { useState } from 'react';
import { View, StyleSheet, Image, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, TextInput, Button, Headline, HelperText } from 'react-native-paper';
import { useAuth } from '../../contexts/AuthContext';
import { spacing } from '../../utils/theme';

/**
 * Screen for setting up the initial PIN
 */
const SetupPinScreen: React.FC = () => {
  const { setUpPin } = useAuth();
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle PIN setup
  const handleSetupPin = async () => {
    // Reset error state
    setError(null);

    // Validate PINs
    if (pin.length < 4) {
      setError('PIN must be at least 4 digits');
      return;
    }

    if (pin !== confirmPin) {
      setError('PINs do not match');
      return;
    }

    try {
      setLoading(true);
      const success = await setUpPin(pin);

      if (!success) {
        setError('Failed to set PIN. Please try again.');
      }
    } catch (err) {
      console.error('Error setting up PIN:', err);
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

        <Headline style={styles.title}>Welcome to Auto Organize Me</Headline>

        <Text style={styles.subtitle}>Create a PIN to secure your data</Text>

        <View style={styles.form}>
          <TextInput
            label="Enter PIN"
            value={pin}
            onChangeText={setPin}
            style={styles.input}
            keyboardType="number-pad"
            maxLength={6}
            secureTextEntry
            mode="outlined"
            error={!!error}
          />

          <TextInput
            label="Confirm PIN"
            value={confirmPin}
            onChangeText={setConfirmPin}
            style={styles.input}
            keyboardType="number-pad"
            maxLength={6}
            secureTextEntry
            mode="outlined"
            error={!!error}
          />

          {error && <HelperText type="error">{error}</HelperText>}

          <Button
            mode="contained"
            onPress={handleSetupPin}
            style={styles.button}
            loading={loading}
            disabled={loading || pin.length < 4 || confirmPin.length < 4}
          >
            Create PIN
          </Button>
        </View>

        <Text style={styles.infoText}>
          This PIN will be used to secure your app. Make sure to remember it.
        </Text>
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

export default SetupPinScreen;
