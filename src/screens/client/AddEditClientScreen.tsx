import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { TextInput, Button, Divider, Text, ActivityIndicator } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ClientsStackParamList } from '../../navigation/ClientsNavigator';
import { useClientRepository, ClientInput } from '../../hooks/useClientRepository';
import { spacing, shadows } from '../../utils/theme';

// Define navigation props
type AddEditClientScreenNavigationProp = StackNavigationProp<
  ClientsStackParamList,
  'AddEditClient'
>;
type AddEditClientScreenRouteProp = RouteProp<ClientsStackParamList, 'AddEditClient'>;

const AddEditClientScreen: React.FC = () => {
  const clientRepository = useClientRepository();
  const navigation = useNavigation<AddEditClientScreenNavigationProp>();
  const route = useRoute<AddEditClientScreenRouteProp>();
  const { clientId } = route.params;
  const isEditMode = !!clientId;

  // Form state
  const [formData, setFormData] = useState<ClientInput>({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    email: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    notes: '',
  });

  // Loading and error states
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load client data if in edit mode
  useEffect(() => {
    const loadClient = async () => {
      if (!isEditMode) return;

      try {
        setIsLoading(true);
        const client = await clientRepository.getById(clientId);

        if (client) {
          setFormData({
            firstName: client.firstName,
            lastName: client.lastName,
            phoneNumber: client.phoneNumber,
            email: client.email || '',
            street: client.street || '',
            city: client.city || '',
            state: client.state || '',
            zipCode: client.zipCode || '',
            notes: client.notes || '',
          });
        } else {
          setError('Client not found');
        }
      } catch (err) {
        console.error('Error loading client:', err);
        setError('Failed to load client details');
      } finally {
        setIsLoading(false);
      }
    };

    loadClient();
  }, [clientId, isEditMode]);

  // Handle form field changes
  const handleChange = (field: keyof ClientInput, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Validate form
  const validateForm = (): boolean => {
    if (!formData.firstName.trim()) {
      Alert.alert('Error', 'First name is required');
      return false;
    }

    if (!formData.lastName.trim()) {
      Alert.alert('Error', 'Last name is required');
      return false;
    }

    if (!formData.phoneNumber.trim()) {
      Alert.alert('Error', 'Phone number is required');
      return false;
    }

    // Optionally add more validation (email format, phone format, etc.)
    return true;
  };

  // Save client
  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setIsSaving(true);
      setError(null);

      if (isEditMode) {
        await clientRepository.update(clientId, formData);
      } else {
        await clientRepository.create(formData);
      }

      // Navigate back on success
      navigation.goBack();
    } catch (err) {
      console.error('Error saving client:', err);
      setError(`Failed to ${isEditMode ? 'update' : 'create'} client. Please try again.`);
    } finally {
      setIsSaving(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading client data...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.formCard}>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Personal Information
          </Text>
          <Divider style={styles.divider} />

          <TextInput
            label="First Name *"
            value={formData.firstName}
            onChangeText={(value) => handleChange('firstName', value)}
            style={styles.input}
            mode="outlined"
          />

          <TextInput
            label="Last Name *"
            value={formData.lastName}
            onChangeText={(value) => handleChange('lastName', value)}
            style={styles.input}
            mode="outlined"
          />

          <TextInput
            label="Phone Number *"
            value={formData.phoneNumber}
            onChangeText={(value) => handleChange('phoneNumber', value)}
            style={styles.input}
            mode="outlined"
            keyboardType="phone-pad"
          />

          <TextInput
            label="Email"
            value={formData.email}
            onChangeText={(value) => handleChange('email', value)}
            style={styles.input}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text variant="titleLarge" style={[styles.sectionTitle, styles.sectionTitleSpacing]}>
            Address
          </Text>
          <Divider style={styles.divider} />

          <TextInput
            label="Street"
            value={formData.street}
            onChangeText={(value) => handleChange('street', value)}
            style={styles.input}
            mode="outlined"
          />

          <View style={styles.row}>
            <TextInput
              label="City"
              value={formData.city}
              onChangeText={(value) => handleChange('city', value)}
              style={[styles.input, styles.rowInput]}
              mode="outlined"
            />

            <TextInput
              label="State"
              value={formData.state}
              onChangeText={(value) => handleChange('state', value)}
              style={[styles.input, styles.stateInput]}
              mode="outlined"
            />
          </View>

          <TextInput
            label="Zip Code"
            value={formData.zipCode}
            onChangeText={(value) => handleChange('zipCode', value)}
            style={styles.input}
            mode="outlined"
            keyboardType="number-pad"
          />

          <Text variant="titleLarge" style={[styles.sectionTitle, styles.sectionTitleSpacing]}>
            Additional Information
          </Text>
          <Divider style={styles.divider} />

          <TextInput
            label="Notes"
            value={formData.notes}
            onChangeText={(value) => handleChange('notes', value)}
            style={styles.input}
            mode="outlined"
            multiline
            numberOfLines={4}
          />

          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={handleSave}
              style={styles.saveButton}
              loading={isSaving}
              disabled={isSaving}
            >
              {isEditMode ? 'Update Client' : 'Create Client'}
            </Button>
            <Button
              mode="outlined"
              onPress={() => navigation.goBack()}
              style={styles.cancelButton}
              disabled={isSaving}
            >
              Cancel
            </Button>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: spacing.md,
  },
  formCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: spacing.md,
    ...shadows.medium,
  },
  sectionTitle: {
    marginBottom: spacing.xs,
  },
  sectionTitleSpacing: {
    marginTop: spacing.lg,
  },
  divider: {
    marginBottom: spacing.md,
  },
  input: {
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rowInput: {
    flex: 2,
    marginRight: spacing.sm,
  },
  stateInput: {
    flex: 1,
  },
  buttonContainer: {
    marginTop: spacing.lg,
  },
  saveButton: {
    marginBottom: spacing.md,
  },
  cancelButton: {
    marginBottom: spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: spacing.md,
    borderRadius: 4,
    marginBottom: spacing.md,
  },
  errorText: {
    color: '#d32f2f',
  },
});

export default AddEditClientScreen;
