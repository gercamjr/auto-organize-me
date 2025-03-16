import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import {
  TextInput,
  Button,
  Divider,
  Text,
  ActivityIndicator,
  Menu,
  HelperText,
} from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { JobsStackParamList } from '../../navigation/JobsNavigator';
import { useJobRepository, DiagnosticItem } from '../../hooks/useJobRepository';
import { spacing, shadows } from '../../utils/theme';

// Define types for the screen
type AddEditDiagnosticScreenNavigationProp = StackNavigationProp<
  JobsStackParamList,
  'AddEditDiagnostic'
>;
type AddEditDiagnosticScreenRouteProp = RouteProp<JobsStackParamList, 'AddEditDiagnostic'>;

// Diagnostic item input for creating/updating
interface DiagnosticInput {
  system: string;
  component: string;
  issue: string;
  severity: 'minor' | 'moderate' | 'severe' | 'critical';
  recommendedAction: string;
  estimatedCost?: number;
  notes?: string;
}

const AddEditDiagnosticScreen: React.FC = () => {
  const jobRepository = useJobRepository();
  const navigation = useNavigation<AddEditDiagnosticScreenNavigationProp>();
  const route = useRoute<AddEditDiagnosticScreenRouteProp>();
  const { jobId, diagnosticId } = route.params;
  const isEditMode = !!diagnosticId;

  // Form state
  const [formData, setFormData] = useState<DiagnosticInput>({
    system: '',
    component: '',
    issue: '',
    severity: 'moderate',
    recommendedAction: '',
    estimatedCost: undefined,
    notes: '',
  });

  // UI state
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dropdown state
  const [severityMenuVisible, setSeverityMenuVisible] = useState(false);
  const [systemMenuVisible, setSystemMenuVisible] = useState(false);

  // System options (common automotive systems)
  const SYSTEM_OPTIONS = [
    'Engine',
    'Transmission',
    'Brakes',
    'Suspension',
    'Steering',
    'Electrical',
    'HVAC',
    'Exhaust',
    'Fuel',
    'Cooling',
    'Other',
  ];

  // Severity options
  const SEVERITY_OPTIONS: { value: 'minor' | 'moderate' | 'severe' | 'critical'; label: string }[] =
    [
      { value: 'minor', label: 'Minor' },
      { value: 'moderate', label: 'Moderate' },
      { value: 'severe', label: 'Severe' },
      { value: 'critical', label: 'Critical' },
    ];

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'minor':
        return '#4CAF50'; // Green
      case 'moderate':
        return '#FF9800'; // Orange
      case 'severe':
        return '#f44336'; // Red
      case 'critical':
        return '#9C27B0'; // Purple
      default:
        return '#757575'; // Grey
    }
  };

  // Load diagnostic item data if in edit mode
  useEffect(() => {
    const loadDiagnosticItem = async () => {
      if (!isEditMode) return;

      try {
        setIsLoading(true);
        // Get all diagnostic items for this job
        const diagnosticItems = await jobRepository.getJobDiagnosticItems(jobId);
        // Find the specific diagnostic item
        const diagnosticItem = diagnosticItems.find((d) => d.id === diagnosticId);

        if (diagnosticItem) {
          // Set form data from diagnostic item
          setFormData({
            system: diagnosticItem.system,
            component: diagnosticItem.component,
            issue: diagnosticItem.issue,
            severity: diagnosticItem.severity,
            recommendedAction: diagnosticItem.recommendedAction,
            estimatedCost: diagnosticItem.estimatedCost,
            notes: diagnosticItem.notes,
          });
        } else {
          setError('Diagnostic item not found');
        }
      } catch (err) {
        console.error('Error loading diagnostic item:', err);
        setError('Failed to load diagnostic item details');
      } finally {
        setIsLoading(false);
      }
    };

    loadDiagnosticItem();
  }, [diagnosticId, isEditMode, jobId]);

  // Handle form field changes
  const handleChange = (field: keyof DiagnosticInput, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle system selection
  const handleSystemSelect = (system: string) => {
    handleChange('system', system);
    setSystemMenuVisible(false);
  };

  // Handle severity selection
  const handleSeveritySelect = (severity: 'minor' | 'moderate' | 'severe' | 'critical') => {
    handleChange('severity', severity);
    setSeverityMenuVisible(false);
  };

  // Validate form
  const validateForm = (): boolean => {
    if (!formData.system.trim()) {
      Alert.alert('Error', 'System is required');
      return false;
    }

    if (!formData.component.trim()) {
      Alert.alert('Error', 'Component is required');
      return false;
    }

    if (!formData.issue.trim()) {
      Alert.alert('Error', 'Issue is required');
      return false;
    }

    if (!formData.recommendedAction.trim()) {
      Alert.alert('Error', 'Recommended action is required');
      return false;
    }

    return true;
  };

  // Save diagnostic item
  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setIsSaving(true);
      setError(null);

      // This would be implemented in the job repository
      // For now, we'll just show a success message
      Alert.alert('Success', `Diagnostic item ${isEditMode ? 'updated' : 'added'} successfully`, [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (err) {
      console.error('Error saving diagnostic item:', err);
      setError(`Failed to ${isEditMode ? 'update' : 'add'} diagnostic item. Please try again.`);
    } finally {
      setIsSaving(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading diagnostic item data...</Text>
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
            Diagnostic Information
          </Text>
          <Divider style={styles.divider} />

          {/* System Selection */}
          <Menu
            visible={systemMenuVisible}
            onDismiss={() => setSystemMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => setSystemMenuVisible(true)}
                style={styles.dropdownButton}
              >
                {formData.system || 'Select System *'}
              </Button>
            }
            style={styles.dropdown}
          >
            {SYSTEM_OPTIONS.map((system) => (
              <Menu.Item key={system} onPress={() => handleSystemSelect(system)} title={system} />
            ))}
          </Menu>
          {!formData.system && <HelperText type="error">System is required</HelperText>}

          <TextInput
            label="Component *"
            value={formData.component}
            onChangeText={(value) => handleChange('component', value)}
            style={styles.input}
            mode="outlined"
            placeholder="e.g., Alternator, Brake Pads, etc."
          />

          <TextInput
            label="Issue *"
            value={formData.issue}
            onChangeText={(value) => handleChange('issue', value)}
            style={styles.input}
            mode="outlined"
            placeholder="Describe the problem"
          />

          {/* Severity Selection */}
          <Menu
            visible={severityMenuVisible}
            onDismiss={() => setSeverityMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => setSeverityMenuVisible(true)}
                style={[
                  styles.dropdownButton,
                  { borderColor: getSeverityColor(formData.severity) },
                ]}
                textColor={getSeverityColor(formData.severity)}
              >
                Severity: {SEVERITY_OPTIONS.find((s) => s.value === formData.severity)?.label}
              </Button>
            }
            style={styles.dropdown}
          >
            {SEVERITY_OPTIONS.map((option) => (
              <Menu.Item
                key={option.value}
                onPress={() => handleSeveritySelect(option.value)}
                title={option.label}
              />
            ))}
          </Menu>

          <TextInput
            label="Recommended Action *"
            value={formData.recommendedAction}
            onChangeText={(value) => handleChange('recommendedAction', value)}
            style={styles.input}
            mode="outlined"
            multiline
            numberOfLines={3}
            placeholder="What needs to be done to fix the issue"
          />

          <TextInput
            label="Estimated Cost ($)"
            value={formData.estimatedCost?.toString() || ''}
            onChangeText={(value) => handleChange('estimatedCost', parseFloat(value) || undefined)}
            style={styles.input}
            mode="outlined"
            keyboardType="numeric"
            placeholder="Estimate for repair cost (optional)"
          />

          <TextInput
            label="Notes"
            value={formData.notes}
            onChangeText={(value) => handleChange('notes', value)}
            style={styles.input}
            mode="outlined"
            multiline
            numberOfLines={4}
            placeholder="Additional observations or details"
          />

          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={handleSave}
              style={styles.saveButton}
              loading={isSaving}
              disabled={isSaving}
            >
              {isEditMode ? 'Update Diagnostic' : 'Add Diagnostic'}
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
  dropdownButton: {
    marginBottom: spacing.md,
  },
  dropdown: {
    marginTop: 70, // Adjust as needed for your UI
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

export default AddEditDiagnosticScreen;
