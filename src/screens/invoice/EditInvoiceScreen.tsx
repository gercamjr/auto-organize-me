import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import {
  TextInput,
  Button,
  Divider,
  Text,
  ActivityIndicator,
  RadioButton,
  HelperText,
} from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import DateTimePicker from '@react-native-community/datetimepicker';
import { spacing, shadows } from '../../utils/theme';
import { useInvoiceRepository, InvoiceInput } from '../../hooks/useInvoiceRepository';
import { format } from 'date-fns';

// Define types for the screen
type EditInvoiceScreenNavigationProp = StackNavigationProp<any, 'EditInvoice'>;
type EditInvoiceScreenRouteProp = RouteProp<any, 'EditInvoice'>;

const TAX_RATES = [
  { label: 'No Tax (0%)', value: 0 },
  { label: '5%', value: 5 },
  { label: '7%', value: 7 },
  { label: '8%', value: 8 },
  { label: '10%', value: 10 },
];

const EditInvoiceScreen: React.FC = () => {
  const invoiceRepository = useInvoiceRepository();
  const navigation = useNavigation<EditInvoiceScreenNavigationProp>();
  const route = useRoute<EditInvoiceScreenRouteProp>();
  const { invoiceId } = route.params || {};

  // Form state
  const [formData, setFormData] = useState<InvoiceInput>({
    jobId: '',
    invoiceNumber: '',
    issuedDate: new Date().toISOString(),
    dueDate: new Date().toISOString(),
    status: 'draft',
    subtotal: 0,
    taxRate: 0,
    taxAmount: 0,
    discountAmount: 0,
    totalAmount: 0,
    notes: '',
    termsAndConditions: '',
  });

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invoice, setInvoice] = useState<any>(null);
  const [showIssuedDatePicker, setShowIssuedDatePicker] = useState(false);
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);
  const [selectedTaxRateIndex, setSelectedTaxRateIndex] = useState(0);

  // Load invoice data
  useEffect(() => {
    if (!invoiceId) {
      setError('No invoice selected');
      setIsLoading(false);
      return;
    }

    const loadInvoiceData = async () => {
      try {
        // Get invoice details
        const invoiceData = await invoiceRepository.getById(invoiceId);
        if (!invoiceData) {
          setError('Invoice not found');
          setIsLoading(false);
          return;
        }

        // Can only edit draft invoices
        if (invoiceData.status !== 'draft') {
          Alert.alert(
            'Cannot Edit',
            'Only draft invoices can be edited. This invoice has already been issued.',
            [
              {
                text: 'OK',
                onPress: () => navigation.goBack(),
              },
            ]
          );
          return;
        }

        // Find tax rate index
        const taxRateIndex = TAX_RATES.findIndex((rate) => rate.value === invoiceData.taxRate);
        setSelectedTaxRateIndex(taxRateIndex >= 0 ? taxRateIndex : 0);

        // Set form data
        setFormData({
          jobId: invoiceData.jobId,
          invoiceNumber: invoiceData.invoiceNumber,
          issuedDate: invoiceData.issuedDate,
          dueDate: invoiceData.dueDate,
          status: invoiceData.status,
          subtotal: invoiceData.subtotal,
          taxRate: invoiceData.taxRate,
          taxAmount: invoiceData.taxAmount,
          discountAmount: invoiceData.discountAmount,
          totalAmount: invoiceData.totalAmount,
          notes: invoiceData.notes || '',
          termsAndConditions: invoiceData.termsAndConditions || '',
        });

        setInvoice(invoiceData);
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading invoice:', err);
        setError('Failed to load invoice details');
        setIsLoading(false);
      }
    };

    loadInvoiceData();
  }, [invoiceId]);

  // Handle form field changes
  const handleChange = (field: keyof InvoiceInput, value: any) => {
    setFormData((prev) => {
      const updatedData = {
        ...prev,
        [field]: value,
      };

      // Recalculate totals if necessary
      if (field === 'subtotal' || field === 'taxRate' || field === 'discountAmount') {
        const taxAmount = (updatedData.subtotal * updatedData.taxRate) / 100;
        updatedData.taxAmount = Math.round(taxAmount * 100) / 100;
        updatedData.totalAmount =
          updatedData.subtotal + updatedData.taxAmount - updatedData.discountAmount;
      }

      return updatedData;
    });
  };

  // Handle date changes
  const handleDateChange = (field: 'issuedDate' | 'dueDate', date?: Date) => {
    if (date) {
      handleChange(field, date.toISOString());
    }

    // Hide the date picker
    switch (field) {
      case 'issuedDate':
        setShowIssuedDatePicker(false);
        break;
      case 'dueDate':
        setShowDueDatePicker(false);
        break;
    }
  };

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';

    try {
      return format(new Date(dateString), 'MM/dd/yyyy');
    } catch (err) {
      return '';
    }
  };

  // Handle tax rate selection
  const handleTaxRateChange = (index: number) => {
    setSelectedTaxRateIndex(index);
    handleChange('taxRate', TAX_RATES[index].value);
  };

  // Validate form
  const validateForm = (): boolean => {
    if (!formData.jobId) {
      Alert.alert('Error', 'Job ID is missing');
      return false;
    }

    if (!formData.invoiceNumber.trim()) {
      Alert.alert('Error', 'Invoice number is required');
      return false;
    }

    if (!formData.issuedDate) {
      Alert.alert('Error', 'Issue date is required');
      return false;
    }

    if (!formData.dueDate) {
      Alert.alert('Error', 'Due date is required');
      return false;
    }

    if (formData.subtotal <= 0) {
      Alert.alert('Error', 'Subtotal must be greater than 0');
      return false;
    }

    if (formData.discountAmount < 0) {
      Alert.alert('Error', 'Discount amount cannot be negative');
      return false;
    }

    if (formData.discountAmount > formData.subtotal) {
      Alert.alert('Error', 'Discount amount cannot be greater than subtotal');
      return false;
    }

    return true;
  };

  // Save invoice
  const handleSave = async (asDraft: boolean = true) => {
    if (!validateForm()) return;

    try {
      setIsSaving(true);
      setError(null);

      // Set status based on whether saving as draft or issuing
      const status = asDraft ? 'draft' : 'issued';

      // Update the invoice
      await invoiceRepository.update(invoiceId, {
        ...formData,
        status,
      });

      // Show success message and navigate back
      Alert.alert('Success', `Invoice ${asDraft ? 'saved as draft' : 'issued'} successfully`, [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (err) {
      console.error('Error updating invoice:', err);
      setError('Failed to update invoice. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading invoice details...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <Button mode="contained" onPress={() => navigation.goBack()}>
          Go Back
        </Button>
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
        <View style={styles.formCard}>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Edit Invoice
          </Text>
          <Divider style={styles.divider} />

          <TextInput
            label="Invoice Number"
            value={formData.invoiceNumber}
            onChangeText={(value) => handleChange('invoiceNumber', value)}
            style={styles.input}
            mode="outlined"
            disabled // Usually not edited
          />

          {/* Issue Date Picker */}
          <Button
            mode="outlined"
            onPress={() => setShowIssuedDatePicker(true)}
            style={styles.dateButton}
          >
            {formData.issuedDate
              ? `Issue Date: ${formatDate(formData.issuedDate)}`
              : 'Set Issue Date'}
          </Button>
          {showIssuedDatePicker && (
            <DateTimePicker
              value={formData.issuedDate ? new Date(formData.issuedDate) : new Date()}
              mode="date"
              display="default"
              onChange={(_, date) => handleDateChange('issuedDate', date)}
            />
          )}

          {/* Due Date Picker */}
          <Button
            mode="outlined"
            onPress={() => setShowDueDatePicker(true)}
            style={styles.dateButton}
          >
            {formData.dueDate ? `Due Date: ${formatDate(formData.dueDate)}` : 'Set Due Date'}
          </Button>
          {showDueDatePicker && (
            <DateTimePicker
              value={formData.dueDate ? new Date(formData.dueDate) : new Date()}
              mode="date"
              display="default"
              onChange={(_, date) => handleDateChange('dueDate', date)}
            />
          )}

          {/* Tax Rate */}
          <Text style={styles.sectionSubtitle}>Tax Rate</Text>
          <RadioButton.Group
            onValueChange={(value) => handleTaxRateChange(parseInt(value))}
            value={selectedTaxRateIndex.toString()}
          >
            <View style={styles.radioGroup}>
              {TAX_RATES.map((rate, index) => (
                <View key={index} style={styles.radioButton}>
                  <RadioButton value={index.toString()} />
                  <Text>{rate.label}</Text>
                </View>
              ))}
            </View>
          </RadioButton.Group>

          {/* Discount */}
          <TextInput
            label="Discount Amount ($)"
            value={formData.discountAmount.toString()}
            onChangeText={(value) => handleChange('discountAmount', parseFloat(value) || 0)}
            style={styles.input}
            mode="outlined"
            keyboardType="numeric"
          />

          {/* Summary */}
          <View style={styles.summarySection}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal:</Text>
              <Text style={styles.summaryValue}>${formData.subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax ({formData.taxRate}%):</Text>
              <Text style={styles.summaryValue}>${formData.taxAmount.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Discount:</Text>
              <Text style={styles.summaryValue}>-${formData.discountAmount.toFixed(2)}</Text>
            </View>
            <Divider style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total:</Text>
              <Text style={styles.totalValue}>${formData.totalAmount.toFixed(2)}</Text>
            </View>
          </View>

          {/* Notes */}
          <TextInput
            label="Notes"
            value={formData.notes}
            onChangeText={(value) => handleChange('notes', value)}
            style={styles.input}
            mode="outlined"
            multiline
            numberOfLines={3}
          />

          {/* Terms and Conditions */}
          <TextInput
            label="Terms and Conditions"
            value={formData.termsAndConditions}
            onChangeText={(value) => handleChange('termsAndConditions', value)}
            style={styles.input}
            mode="outlined"
            multiline
            numberOfLines={6}
          />

          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={() => handleSave(false)} // Issue invoice
              style={styles.saveButton}
              loading={isSaving}
              disabled={isSaving}
            >
              Issue Invoice
            </Button>
            <Button
              mode="outlined"
              onPress={() => handleSave(true)} // Save as draft
              style={styles.draftButton}
              disabled={isSaving}
            >
              Save Draft
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
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  divider: {
    marginBottom: spacing.md,
  },
  input: {
    marginBottom: spacing.md,
  },
  dateButton: {
    marginBottom: spacing.md,
  },
  radioGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    marginBottom: spacing.xs,
  },
  summarySection: {
    marginVertical: spacing.md,
    padding: spacing.md,
    backgroundColor: '#f9f9f9',
    borderRadius: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  summaryDivider: {
    marginVertical: spacing.xs,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2',
  },
  buttonContainer: {
    marginTop: spacing.lg,
  },
  saveButton: {
    marginBottom: spacing.md,
  },
  draftButton: {
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  errorText: {
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: spacing.md,
  },
});

export default EditInvoiceScreen;
