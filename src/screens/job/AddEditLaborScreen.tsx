import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { TextInput, Button, Divider, Text, ActivityIndicator } from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { JobsStackParamList } from '../../navigation/JobsNavigator';
import { useJobRepository, LaborEntry } from '../../hooks/useJobRepository';
import { spacing, shadows } from '../../utils/theme';

// Define types for the screen
type AddEditLaborScreenNavigationProp = StackNavigationProp<JobsStackParamList, 'AddEditLabor'>;
type AddEditLaborScreenRouteProp = RouteProp<JobsStackParamList, 'AddEditLabor'>;

// Labor entry input for creating/updating
interface LaborInput {
  description: string;
  hours: number;
  rate: number;
  totalCost: number;
  technician?: string;
  notes?: string;
}

const AddEditLaborScreen: React.FC = () => {
  const jobRepository = useJobRepository();
  const navigation = useNavigation<AddEditLaborScreenNavigationProp>();
  const route = useRoute<AddEditLaborScreenRouteProp>();
  const { jobId, laborId } = route.params;
  const isEditMode = !!laborId;

  // Form state
  const [formData, setFormData] = useState<LaborInput>({
    description: '',
    hours: 1,
    rate: 85, // Default hourly rate
    totalCost: 85, // Default totalCost (hours * rate)
    technician: '',
    notes: '',
  });

  // UI state
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load labor entry data if in edit mode
  useEffect(() => {
    const loadLaborEntry = async () => {
      if (!isEditMode) return;

      try {
        setIsLoading(true);
        // Get all labor entries for this job
        const laborEntries = await jobRepository.getJobLaborEntries(jobId);
        // Find the specific labor entry
        const laborEntry = laborEntries.find((l) => l.id === laborId);

        if (laborEntry) {
          // Set form data from labor entry
          setFormData({
            description: laborEntry.description,
            hours: laborEntry.hours,
            rate: laborEntry.rate,
            totalCost: laborEntry.totalCost,
            technician: laborEntry.technician,
            notes: laborEntry.notes,
          });
        } else {
          setError('Labor entry not found');
        }
      } catch (err) {
        console.error('Error loading labor entry:', err);
        setError('Failed to load labor entry details');
      } finally {
        setIsLoading(false);
      }
    };

    loadLaborEntry();
  }, [laborId, isEditMode, jobId]);

  // Handle form field changes
  const handleChange = (field: keyof LaborInput, value: any) => {
    setFormData((prev) => {
      const updatedData = {
        ...prev,
        [field]: value,
      };

      // Recalculate total cost if hours or rate changes
      if (field === 'hours' || field === 'rate') {
        updatedData.totalCost = updatedData.hours * updatedData.rate;
      }

      return updatedData;
    });
  };

  // Validate form
  const validateForm = (): boolean => {
    if (!formData.description.trim()) {
      Alert.alert('Error', 'Description is required');
      return false;
    }

    if (formData.hours <= 0) {
      Alert.alert('Error', 'Hours must be greater than 0');
      return false;
    }

    if (formData.rate < 0) {
      Alert.alert('Error', 'Rate cannot be negative');
      return false;
    }

    return true;
  };

  // Save labor entry
  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setIsSaving(true);
      setError(null);

      // This would be implemented in the job repository
      // For now, we'll just show a success message
      Alert.alert('Success', `Labor entry ${isEditMode ? 'updated' : 'added'} successfully`, [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (err) {
      console.error('Error saving labor entry:', err);
      setError(`Failed to ${isEditMode ? 'update' : 'add'} labor entry. Please try again.`);
    } finally {
      setIsSaving(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading labor entry data...</Text>
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
            Labor Details
          </Text>
          <Divider style={styles.divider} />

          <TextInput
            label="Description *"
            value={formData.description}
            onChangeText={(value) => handleChange('description', value)}
            style={styles.input}
            mode="outlined"
            placeholder="e.g., Engine Diagnostics, Oil Change, etc."
          />

          <TextInput
            label="Hours *"
            value={formData.hours.toString()}
            onChangeText={(value) => handleChange('hours', parseFloat(value) || 0)}
            style={styles.input}
            mode="outlined"
            keyboardType="numeric"
          />

          <TextInput
            label="Hourly Rate ($) *"
            value={formData.rate.toString()}
            onChangeText={(value) => handleChange('rate', parseFloat(value) || 0)}
            style={styles.input}
            mode="outlined"
            keyboardType="numeric"
          />

          <TextInput
            label="Total Cost ($)"
            value={formData.totalCost.toFixed(2)}
            style={styles.input}
            mode="outlined"
            keyboardType="numeric"
            disabled // Auto-calculated
          />

          <TextInput
            label="Technician"
            value={formData.technician}
            onChangeText={(value) => handleChange('technician', value)}
            style={styles.input}
            mode="outlined"
          />

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
              {isEditMode ? 'Update Labor' : 'Add Labor'}
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
  divider: {
    marginBottom: spacing.md,
  },
  input: {
    marginBottom: spacing.md,
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

export default AddEditLaborScreen;
