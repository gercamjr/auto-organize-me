import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import {
  TextInput,
  Button,
  Divider,
  Text,
  ActivityIndicator,
  Switch,
  HelperText,
  Menu,
} from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { JobsStackParamList } from '../../navigation/JobsNavigator';
import { useJobRepository } from '../../hooks/useJobRepository';
import { spacing, shadows } from '../../utils/theme';
import DateTimePicker from '@react-native-community/datetimepicker';

// Define types for the screen
type AddEditPartScreenNavigationProp = StackNavigationProp<JobsStackParamList, 'AddEditPart'>;
type AddEditPartScreenRouteProp = RouteProp<JobsStackParamList, 'AddEditPart'>;

// Part input for creating/updating
interface PartInput {
  name: string;
  partNumber?: string;
  manufacturer?: string;
  quantity: number;
  unitCost: number;
  markupPercentage?: number;
  clientPrice: number;
  totalCost: number;
  supplier?: string;
  warrantyHasCoverage: boolean;
  warrantyLengthInMonths?: number;
  warrantyLengthInMiles?: number;
  warrantyExpirationDate?: string;
  warrantyNotes?: string;
  replacedPartCondition?: string;
  isClientSupplied?: boolean;
  notes?: string;
}

const AddEditPartScreen: React.FC = () => {
  const jobRepository = useJobRepository();
  const navigation = useNavigation<AddEditPartScreenNavigationProp>();
  const route = useRoute<AddEditPartScreenRouteProp>();
  const { jobId, partId } = route.params;
  const isEditMode = !!partId;

  // Form state
  const [formData, setFormData] = useState<PartInput>({
    name: '',
    partNumber: '',
    manufacturer: '',
    quantity: 1,
    unitCost: 0,
    markupPercentage: 30, // Default markup
    clientPrice: 0,
    totalCost: 0,
    supplier: '',
    warrantyHasCoverage: false,
    warrantyLengthInMonths: undefined,
    warrantyLengthInMiles: undefined,
    warrantyExpirationDate: undefined,
    warrantyNotes: '',
    replacedPartCondition: '',
    isClientSupplied: false,
    notes: '',
  });

  // UI state
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showExpirationDatePicker, setShowExpirationDatePicker] = useState(false);

  // Dropdown state
  const [partConditionMenuVisible, setPartConditionMenuVisible] = useState(false);

  // Part conditions for dropdown
  const PART_CONDITIONS = ['Like New', 'Good', 'Fair', 'Poor', 'Very Poor', 'Not Salvageable'];

  // Load part data if in edit mode
  useEffect(() => {
    const loadPart = async () => {
      if (!isEditMode) return;

      try {
        setIsLoading(true);
        // Get all parts for this job
        const jobParts = await jobRepository.getJobParts(jobId);
        // Find the specific part
        const part = jobParts.find((p) => p.id === partId);

        if (part) {
          // Set form data from part
          setFormData({
            name: part.name,
            partNumber: part.partNumber,
            manufacturer: part.manufacturer,
            quantity: part.quantity,
            unitCost: part.unitCost,
            markupPercentage: part.markupPercentage,
            clientPrice: part.clientPrice,
            totalCost: part.totalCost,
            supplier: part.supplier,
            warrantyHasCoverage: part.warrantyHasCoverage,
            warrantyLengthInMonths: part.warrantyLengthInMonths,
            warrantyLengthInMiles: part.warrantyLengthInMiles,
            warrantyExpirationDate: part.warrantyExpirationDate,
            warrantyNotes: part.warrantyNotes,
            replacedPartCondition: part.replacedPartCondition,
            isClientSupplied: part.isClientSupplied,
            notes: part.notes,
          });
        } else {
          setError('Part not found');
        }
      } catch (err) {
        console.error('Error loading part:', err);
        setError('Failed to load part details');
      } finally {
        setIsLoading(false);
      }
    };

    loadPart();
  }, [partId, isEditMode, jobId]);

  // Handle form field changes
  const handleChange = (field: keyof PartInput, value: any) => {
    setFormData((prev) => {
      const updatedData = {
        ...prev,
        [field]: value,
      };

      // Recalculate prices if relevant fields change
      if (
        field === 'unitCost' ||
        field === 'quantity' ||
        field === 'markupPercentage' ||
        field === 'isClientSupplied'
      ) {
        // If client supplied, no markup
        if (updatedData.isClientSupplied) {
          updatedData.clientPrice = updatedData.unitCost;
          updatedData.totalCost = updatedData.unitCost * updatedData.quantity;
        } else {
          // Apply markup
          const markup = updatedData.markupPercentage ? updatedData.markupPercentage / 100 : 0;
          updatedData.clientPrice = updatedData.unitCost * (1 + markup);
          updatedData.totalCost = updatedData.clientPrice * updatedData.quantity;
        }
      }

      return updatedData;
    });
  };

  // Handle part condition selection
  const handlePartConditionSelect = (condition: string) => {
    handleChange('replacedPartCondition', condition);
    setPartConditionMenuVisible(false);
  };

  // Handle date changes
  const handleDateChange = (date?: Date) => {
    if (date) {
      handleChange('warrantyExpirationDate', date.toISOString());
    }
    setShowExpirationDatePicker(false);
  };

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';

    try {
      return new Date(dateString).toLocaleDateString();
    } catch (err) {
      return '';
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Part name is required');
      return false;
    }

    if (formData.quantity <= 0) {
      Alert.alert('Error', 'Quantity must be greater than 0');
      return false;
    }

    if (formData.unitCost < 0) {
      Alert.alert('Error', 'Unit cost cannot be negative');
      return false;
    }

    return true;
  };

  // Save part
  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setIsSaving(true);
      setError(null);

      // This would be implemented in the job repository
      // For now, we'll just show a success message
      Alert.alert('Success', `Part ${isEditMode ? 'updated' : 'added'} successfully`, [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (err) {
      console.error('Error saving part:', err);
      setError(`Failed to ${isEditMode ? 'update' : 'add'} part. Please try again.`);
    } finally {
      setIsSaving(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading part data...</Text>
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
            Part Information
          </Text>
          <Divider style={styles.divider} />

          <TextInput
            label="Part Name *"
            value={formData.name}
            onChangeText={(value) => handleChange('name', value)}
            style={styles.input}
            mode="outlined"
          />

          <TextInput
            label="Part Number"
            value={formData.partNumber}
            onChangeText={(value) => handleChange('partNumber', value)}
            style={styles.input}
            mode="outlined"
          />

          <TextInput
            label="Manufacturer"
            value={formData.manufacturer}
            onChangeText={(value) => handleChange('manufacturer', value)}
            style={styles.input}
            mode="outlined"
          />

          <TextInput
            label="Supplier"
            value={formData.supplier}
            onChangeText={(value) => handleChange('supplier', value)}
            style={styles.input}
            mode="outlined"
          />

          <View style={styles.switchContainer}>
            <Text>Client Supplied Part</Text>
            <Switch
              value={formData.isClientSupplied || false}
              onValueChange={(value) => handleChange('isClientSupplied', value)}
            />
          </View>

          <Text variant="titleLarge" style={[styles.sectionTitle, styles.sectionTitleSpacing]}>
            Pricing
          </Text>
          <Divider style={styles.divider} />

          <TextInput
            label="Quantity *"
            value={formData.quantity.toString()}
            onChangeText={(value) => handleChange('quantity', parseInt(value) || 0)}
            style={styles.input}
            mode="outlined"
            keyboardType="numeric"
          />

          <TextInput
            label="Unit Cost ($) *"
            value={formData.unitCost.toString()}
            onChangeText={(value) => handleChange('unitCost', parseFloat(value) || 0)}
            style={styles.input}
            mode="outlined"
            keyboardType="numeric"
          />

          {!formData.isClientSupplied && (
            <TextInput
              label="Markup Percentage (%)"
              value={formData.markupPercentage?.toString() || '0'}
              onChangeText={(value) => handleChange('markupPercentage', parseFloat(value) || 0)}
              style={styles.input}
              mode="outlined"
              keyboardType="numeric"
            />
          )}

          <TextInput
            label="Client Price ($)"
            value={formData.clientPrice.toFixed(2)}
            onChangeText={(value) => handleChange('clientPrice', parseFloat(value) || 0)}
            style={styles.input}
            mode="outlined"
            keyboardType="numeric"
            disabled={!formData.isClientSupplied} // Auto-calculated if not client supplied
          />

          <TextInput
            label="Total Cost ($)"
            value={formData.totalCost.toFixed(2)}
            style={styles.input}
            mode="outlined"
            keyboardType="numeric"
            disabled // Auto-calculated
          />

          <Text variant="titleLarge" style={[styles.sectionTitle, styles.sectionTitleSpacing]}>
            Warranty Information
          </Text>
          <Divider style={styles.divider} />

          <View style={styles.switchContainer}>
            <Text>Has Warranty</Text>
            <Switch
              value={formData.warrantyHasCoverage}
              onValueChange={(value) => handleChange('warrantyHasCoverage', value)}
            />
          </View>

          {formData.warrantyHasCoverage && (
            <>
              <TextInput
                label="Warranty Duration (months)"
                value={formData.warrantyLengthInMonths?.toString() || ''}
                onChangeText={(value) =>
                  handleChange('warrantyLengthInMonths', parseInt(value) || undefined)
                }
                style={styles.input}
                mode="outlined"
                keyboardType="numeric"
              />

              <TextInput
                label="Warranty Mileage"
                value={formData.warrantyLengthInMiles?.toString() || ''}
                onChangeText={(value) =>
                  handleChange('warrantyLengthInMiles', parseInt(value) || undefined)
                }
                style={styles.input}
                mode="outlined"
                keyboardType="numeric"
              />

              <Button
                mode="outlined"
                onPress={() => setShowExpirationDatePicker(true)}
                style={styles.dateButton}
              >
                {formData.warrantyExpirationDate
                  ? `Expiration Date: ${formatDate(formData.warrantyExpirationDate)}`
                  : 'Set Expiration Date'}
              </Button>
              {showExpirationDatePicker && (
                <DateTimePicker
                  value={
                    formData.warrantyExpirationDate
                      ? new Date(formData.warrantyExpirationDate)
                      : new Date()
                  }
                  mode="date"
                  display="default"
                  onChange={(_, date) => handleDateChange(date)}
                />
              )}

              <TextInput
                label="Warranty Notes"
                value={formData.warrantyNotes}
                onChangeText={(value) => handleChange('warrantyNotes', value)}
                style={styles.input}
                mode="outlined"
                multiline
                numberOfLines={2}
              />
            </>
          )}

          <Text variant="titleLarge" style={[styles.sectionTitle, styles.sectionTitleSpacing]}>
            Additional Information
          </Text>
          <Divider style={styles.divider} />

          <Menu
            visible={partConditionMenuVisible}
            onDismiss={() => setPartConditionMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => setPartConditionMenuVisible(true)}
                style={styles.dropdownButton}
              >
                {formData.replacedPartCondition || 'Replaced Part Condition'}
              </Button>
            }
            style={styles.dropdown}
          >
            {PART_CONDITIONS.map((condition) => (
              <Menu.Item
                key={condition}
                onPress={() => handlePartConditionSelect(condition)}
                title={condition}
              />
            ))}
          </Menu>

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
              {isEditMode ? 'Update Part' : 'Add Part'}
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
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  dateButton: {
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

export default AddEditPartScreen;
