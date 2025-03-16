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
  Checkbox,
  RadioButton,
  List,
  Chip,
} from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import DateTimePicker from '@react-native-community/datetimepicker';
import { spacing, shadows } from '../../utils/theme';
import { useInvoiceRepository, InvoiceInput } from '../../hooks/useInvoiceRepository';
import { useJobRepository } from '../../hooks/useJobRepository';
import { format, addDays } from 'date-fns';

// Define types for the screen
type GenerateInvoiceScreenNavigationProp = StackNavigationProp<any, 'GenerateInvoice'>;
type GenerateInvoiceScreenRouteProp = RouteProp<any, 'GenerateInvoice'>;

const TAX_RATES = [
  { label: 'No Tax (0%)', value: 0 },
  { label: '5%', value: 5 },
  { label: '7%', value: 7 },
  { label: '8%', value: 8 },
  { label: '10%', value: 10 },
];

const DEFAULT_TERMS = `1. Payment is due within 30 days of the invoice date.
2. Late payments are subject to a 1.5% monthly interest charge.
3. All parts have a 90-day warranty unless otherwise specified.
4. Labor is guaranteed for 30 days or 1,000 miles, whichever comes first.`;

const GenerateInvoiceScreen: React.FC = () => {
  const invoiceRepository = useInvoiceRepository();
  const jobRepository = useJobRepository();
  const navigation = useNavigation<GenerateInvoiceScreenNavigationProp>();
  const route = useRoute<GenerateInvoiceScreenRouteProp>();
  const { jobId } = route.params || {};

  // Form state
  const [formData, setFormData] = useState<InvoiceInput>({
    jobId: jobId,
    invoiceNumber: '',
    issuedDate: new Date().toISOString(),
    dueDate: addDays(new Date(), 30).toISOString(),
    status: 'draft',
    subtotal: 0,
    taxRate: 0,
    taxAmount: 0,
    discountAmount: 0,
    totalAmount: 0,
    notes: '',
    termsAndConditions: DEFAULT_TERMS,
  });

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobDetails, setJobDetails] = useState<any>(null);
  const [parts, setParts] = useState<any[]>([]);
  const [labor, setLabor] = useState<any[]>([]);
  const [showIssuedDatePicker, setShowIssuedDatePicker] = useState(false);
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);
  const [selectedTaxRateIndex, setSelectedTaxRateIndex] = useState(0);
  const [includeAllParts, setIncludeAllParts] = useState(true);
  const [includeAllLabor, setIncludeAllLabor] = useState(true);
  const [selectedParts, setSelectedParts] = useState<string[]>([]);
  const [selectedLabor, setSelectedLabor] = useState<string[]>([]);

  // Load job data
  useEffect(() => {
    if (!jobId) {
      setError('No job selected');
      setIsLoading(false);
      return;
    }

    const loadJobData = async () => {
      try {
        // Check if an invoice already exists for this job
        const existingInvoice = await invoiceRepository.getByJobId(jobId);
        if (existingInvoice) {
          Alert.alert(
            'Invoice Exists',
            'An invoice already exists for this job. Would you like to view it?',
            [
              { text: 'No', style: 'cancel' },
              {
                text: 'Yes',
                onPress: () => {
                  navigation.navigate('InvoiceDetails', { invoiceId: existingInvoice.id });
                },
              },
            ]
          );
          navigation.goBack();
          return;
        }

        // Get job details
        const job = await jobRepository.getJobWithDetails(jobId);
        if (!job) {
          setError('Job not found');
          setIsLoading(false);
          return;
        }
        setJobDetails(job);

        // Get parts and labor
        const jobParts = await jobRepository.getJobParts(jobId);
        const jobLabor = await jobRepository.getJobLaborEntries(jobId);
        setParts(jobParts);
        setLabor(jobLabor);

        // Initialize selected parts and labor
        setSelectedParts(jobParts.map((part) => part.id));
        setSelectedLabor(jobLabor.map((item) => item.id));

        // Calculate subtotal from parts and labor
        const partsTotal = jobParts.reduce((sum, part) => sum + part.totalCost, 0);
        const laborTotal = jobLabor.reduce((sum, item) => sum + item.totalCost, 0);
        const subtotal = partsTotal + laborTotal;

        // Generate invoice number
        const newInvoiceNumber = await invoiceRepository.generateInvoiceNumber();

        // Update form data
        setFormData((prev) => ({
          ...prev,
          invoiceNumber: newInvoiceNumber,
          subtotal,
          totalAmount: subtotal, // Initially no tax or discount
          jobId,
        }));

        setIsLoading(false);
      } catch (err) {
        console.error('Error loading job data:', err);
        setError('Failed to load job data');
        setIsLoading(false);
      }
    };

    loadJobData();
  }, [jobId]);

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

  // Handle updating parts selection
  const handleTogglePart = (partId: string) => {
    setSelectedParts((prev) => {
      const newSelection = prev.includes(partId)
        ? prev.filter((id) => id !== partId)
        : [...prev, partId];

      // Update subtotal
      updateSubtotal(newSelection, selectedLabor);

      // Update includeAllParts state
      if (newSelection.length === 0) {
        setIncludeAllParts(false);
      } else if (newSelection.length === parts.length) {
        setIncludeAllParts(true);
      } else {
        setIncludeAllParts(false);
      }

      return newSelection;
    });
  };

  // Handle updating labor selection
  const handleToggleLabor = (laborId: string) => {
    setSelectedLabor((prev) => {
      const newSelection = prev.includes(laborId)
        ? prev.filter((id) => id !== laborId)
        : [...prev, laborId];

      // Update subtotal
      updateSubtotal(selectedParts, newSelection);

      // Update includeAllLabor state
      if (newSelection.length === 0) {
        setIncludeAllLabor(false);
      } else if (newSelection.length === labor.length) {
        setIncludeAllLabor(true);
      } else {
        setIncludeAllLabor(false);
      }

      return newSelection;
    });
  };

  // Handle include all parts toggle
  const handleIncludeAllParts = (value: boolean) => {
    setIncludeAllParts(value);

    if (value) {
      // Select all parts
      const allPartIds = parts.map((part) => part.id);
      setSelectedParts(allPartIds);
      updateSubtotal(allPartIds, selectedLabor);
    } else {
      // Deselect all parts
      setSelectedParts([]);
      updateSubtotal([], selectedLabor);
    }
  };

  // Handle include all labor toggle
  const handleIncludeAllLabor = (value: boolean) => {
    setIncludeAllLabor(value);

    if (value) {
      // Select all labor entries
      const allLaborIds = labor.map((item) => item.id);
      setSelectedLabor(allLaborIds);
      updateSubtotal(selectedParts, allLaborIds);
    } else {
      // Deselect all labor entries
      setSelectedLabor([]);
      updateSubtotal(selectedParts, []);
    }
  };

  // Update subtotal based on selected parts and labor
  const updateSubtotal = (partIds: string[], laborIds: string[]) => {
    const selectedPartsTotal = parts
      .filter((part) => partIds.includes(part.id))
      .reduce((sum, part) => sum + part.totalCost, 0);

    const selectedLaborTotal = labor
      .filter((item) => laborIds.includes(item.id))
      .reduce((sum, item) => sum + item.totalCost, 0);

    const newSubtotal = selectedPartsTotal + selectedLaborTotal;

    // Update form data with new subtotal and recalculate totals
    const taxAmount = (newSubtotal * formData.taxRate) / 100;
    const roundedTaxAmount = Math.round(taxAmount * 100) / 100;
    const newTotal = newSubtotal + roundedTaxAmount - formData.discountAmount;

    setFormData((prev) => ({
      ...prev,
      subtotal: newSubtotal,
      taxAmount: roundedTaxAmount,
      totalAmount: newTotal,
    }));
  };

  // Helper function to find parts by their IDs
  const getPartsByIds = (partIds: string[]) => {
    return parts.filter((part) => partIds.includes(part.id));
  };

  // Helper function to find labor entries by their IDs
  const getLaborByIds = (laborIds: string[]) => {
    return labor.filter((laborItem) => laborIds.includes(laborItem.id));
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  // Validate form
  const validateForm = (): boolean => {
    if (!formData.jobId) {
      Alert.alert('Error', 'No job selected');
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
      Alert.alert(
        'Error',
        'Subtotal must be greater than 0. Please select at least one part or labor item.'
      );
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

      // Create the invoice
      await invoiceRepository.create({
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
      console.error('Error saving invoice:', err);
      setError('Failed to save invoice. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading job data...</Text>
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
            Invoice Information
          </Text>
          <Divider style={styles.divider} />

          {/* Job Information */}
          <View style={styles.jobInfoContainer}>
            <Text style={styles.jobTitle}>{jobDetails?.title}</Text>
            <Text style={styles.jobSubtitle}>
              Client: {jobDetails?.clientName} | Vehicle: {jobDetails?.vehicleInfo}
            </Text>
          </View>

          <TextInput
            label="Invoice Number *"
            value={formData.invoiceNumber}
            onChangeText={(value) => handleChange('invoiceNumber', value)}
            style={styles.input}
            mode="outlined"
            disabled // Auto-generated
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

          {/* Items Section */}
          <Text variant="titleLarge" style={[styles.sectionTitle, styles.sectionTitleSpacing]}>
            Invoice Items
          </Text>
          <Divider style={styles.divider} />

          {/* Parts Section */}
          <View style={styles.itemsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionSubtitle}>Parts</Text>
              <View style={styles.switchContainer}>
                <Text>Include All</Text>
                <Switch value={includeAllParts} onValueChange={handleIncludeAllParts} />
              </View>
            </View>

            {parts.length === 0 && (
              <Text style={styles.emptyText}>No parts found for this job</Text>
            )}

            {parts.length > 0 && (
              <View style={styles.itemsList}>
                {parts.map((part) => (
                  <View key={part.id} style={styles.itemRow}>
                    <Checkbox
                      status={selectedParts.includes(part.id) ? 'checked' : 'unchecked'}
                      onPress={() => handleTogglePart(part.id)}
                    />
                    <View style={styles.itemDetails}>
                      <Text style={styles.itemName}>{part.name}</Text>
                      <Text style={styles.itemQuantity}>
                        Qty: {part.quantity} × {formatCurrency(part.clientPrice)}
                      </Text>
                    </View>
                    <Text style={styles.itemTotal}>{formatCurrency(part.totalCost)}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Labor Section */}
          <View style={styles.itemsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionSubtitle}>Labor</Text>
              <View style={styles.switchContainer}>
                <Text>Include All</Text>
                <Switch value={includeAllLabor} onValueChange={handleIncludeAllLabor} />
              </View>
            </View>

            {labor.length === 0 && (
              <Text style={styles.emptyText}>No labor entries found for this job</Text>
            )}

            {labor.length > 0 && (
              <View style={styles.itemsList}>
                {labor.map((item) => (
                  <View key={item.id} style={styles.itemRow}>
                    <Checkbox
                      status={selectedLabor.includes(item.id) ? 'checked' : 'unchecked'}
                      onPress={() => handleToggleLabor(item.id)}
                    />
                    <View style={styles.itemDetails}>
                      <Text style={styles.itemName}>{item.description}</Text>
                      <Text style={styles.itemQuantity}>
                        {item.hours} hours × {formatCurrency(item.rate)}/hr
                      </Text>
                    </View>
                    <Text style={styles.itemTotal}>{formatCurrency(item.totalCost)}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Totals Section */}
          <Text variant="titleLarge" style={[styles.sectionTitle, styles.sectionTitleSpacing]}>
            Totals
          </Text>
          <Divider style={styles.divider} />

          <View style={styles.totalsSection}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal:</Text>
              <Text style={styles.totalValue}>{formatCurrency(formData.subtotal)}</Text>
            </View>

            {/* Tax Rate */}
            <Text style={styles.subsectionTitle}>Tax Rate</Text>
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

            {formData.taxRate > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Tax ({formData.taxRate}%):</Text>
                <Text style={styles.totalValue}>{formatCurrency(formData.taxAmount)}</Text>
              </View>
            )}

            {/* Discount */}
            <TextInput
              label="Discount Amount ($)"
              value={formData.discountAmount.toString()}
              onChangeText={(value) => handleChange('discountAmount', parseFloat(value) || 0)}
              style={styles.input}
              mode="outlined"
              keyboardType="numeric"
            />

            {formData.discountAmount > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Discount:</Text>
                <Text style={styles.totalValue}>-{formatCurrency(formData.discountAmount)}</Text>
              </View>
            )}

            <View style={[styles.totalRow, styles.grandTotal]}>
              <Text style={styles.grandTotalLabel}>Total:</Text>
              <Text style={styles.grandTotalValue}>{formatCurrency(formData.totalAmount)}</Text>
            </View>
          </View>

          {/* Notes Section */}
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
            numberOfLines={3}
            placeholder="Optional notes to appear on the invoice"
          />

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
              Save as Draft
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
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  divider: {
    marginBottom: spacing.md,
  },
  input: {
    marginBottom: spacing.md,
  },
  jobInfoContainer: {
    marginBottom: spacing.md,
    padding: spacing.sm,
    backgroundColor: '#f8f8f8',
    borderRadius: 4,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  jobSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  dateButton: {
    marginBottom: spacing.md,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  itemsSection: {
    marginBottom: spacing.md,
  },
  itemsList: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  itemDetails: {
    flex: 1,
    marginLeft: spacing.xs,
  },
  itemName: {
    fontWeight: 'bold',
  },
  itemQuantity: {
    fontSize: 12,
    color: '#666',
  },
  itemTotal: {
    fontWeight: 'bold',
    marginLeft: spacing.md,
  },
  emptyText: {
    fontStyle: 'italic',
    color: '#666',
    textAlign: 'center',
    padding: spacing.md,
  },
  totalsSection: {
    marginTop: spacing.sm,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  totalLabel: {
    fontSize: 14,
  },
  totalValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  grandTotal: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  grandTotalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  grandTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976D2',
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
    backgroundColor: '#ffebee',
    padding: spacing.md,
    borderRadius: 4,
    marginBottom: spacing.md,
  },
  errorText: {
    color: '#d32f2f',
  },
});

export default GenerateInvoiceScreen;
