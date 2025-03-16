import React, { useState, useEffect } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import {
  Text,
  Button,
  Divider,
  TextInput,
  ActivityIndicator,
  RadioButton,
  HelperText,
  Card,
  Title,
} from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import DateTimePicker from '@react-native-community/datetimepicker';
import { spacing, shadows } from '../../utils/theme';
import { useInvoiceRepository, PaymentInput } from '../../hooks/useInvoiceRepository';
import { format } from 'date-fns';

// Define types for the screen
type RecordPaymentScreenNavigationProp = StackNavigationProp<any, 'RecordPayment'>;
type RecordPaymentScreenRouteProp = RouteProp<any, 'RecordPayment'>;

// Payment method options
const PAYMENT_METHODS = [
  'Cash',
  'Credit Card',
  'Debit Card',
  'Check',
  'Bank Transfer',
  'PayPal',
  'Venmo',
  'Other',
];

const RecordPaymentScreen: React.FC = () => {
  const invoiceRepository = useInvoiceRepository();
  const navigation = useNavigation<RecordPaymentScreenNavigationProp>();
  const route = useRoute<RecordPaymentScreenRouteProp>();
  const { invoiceId, remainingBalance } = route.params || {};

  // Form state
  const [formData, setFormData] = useState<PaymentInput>({
    invoiceId,
    amount: remainingBalance || 0,
    paymentMethod: 'Cash',
    paymentDate: new Date().toISOString(),
    notes: '',
  });

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [invoice, setInvoice] = useState<any>(null);

  // Load invoice data
  useEffect(() => {
    const loadInvoiceData = async () => {
      try {
        setIsLoading(true);
        const invoiceData = await invoiceRepository.getInvoiceWithDetails(invoiceId);
        setInvoice(invoiceData);
      } catch (err) {
        console.error('Error loading invoice:', err);
        setError('Failed to load invoice details');
      } finally {
        setIsLoading(false);
      }
    };

    if (invoiceId) {
      loadInvoiceData();
    } else {
      setError('No invoice selected');
    }
  }, [invoiceId]);

  // Handle form field changes
  const handleChange = (field: keyof PaymentInput, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle date change
  const handleDateChange = (date?: Date) => {
    if (date) {
      handleChange('paymentDate', date.toISOString());
    }
    setShowDatePicker(false);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MM/dd/yyyy');
    } catch (err) {
      return '';
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  // Validate form
  const validateForm = (): boolean => {
    if (!formData.invoiceId) {
      Alert.alert('Error', 'Invoice ID is missing');
      return false;
    }

    if (formData.amount <= 0) {
      Alert.alert('Error', 'Payment amount must be greater than 0');
      return false;
    }

    if (!formData.paymentMethod) {
      Alert.alert('Error', 'Please select a payment method');
      return false;
    }

    if (!formData.paymentDate) {
      Alert.alert('Error', 'Payment date is required');
      return false;
    }

    if (formData.amount > (remainingBalance || 0)) {
      Alert.alert(
        'Warning',
        'The payment amount exceeds the remaining balance. Do you want to continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue', onPress: () => savePayment() },
        ]
      );
      return false; // Return false to prevent double execution
    }

    return true;
  };

  // Save payment
  const savePayment = async () => {
    try {
      setIsLoading(true);
      setError(null);

      await invoiceRepository.addPayment(formData);

      // Show success message
      Alert.alert('Success', 'Payment recorded successfully', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (err) {
      console.error('Error recording payment:', err);
      setError('Failed to record payment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle save button press
  const handleSave = () => {
    if (validateForm()) {
      savePayment();
    }
  };

  // Loading state
  if (isLoading && !invoice) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading invoice details...</Text>
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

        {invoice && (
          <Card style={styles.invoiceCard}>
            <Card.Content>
              <Title style={styles.invoiceTitle}>Invoice #{invoice.invoiceNumber}</Title>
              <Divider style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Client:</Text>
                <Text style={styles.infoValue}>{invoice.clientName}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Job:</Text>
                <Text style={styles.infoValue}>{invoice.jobTitle}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Total:</Text>
                <Text style={styles.infoValue}>{formatCurrency(invoice.totalAmount)}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Balance Due:</Text>
                <Text style={styles.balanceValue}>{formatCurrency(remainingBalance || 0)}</Text>
              </View>
            </Card.Content>
          </Card>
        )}

        <View style={styles.formCard}>
          <Text variant="titleLarge" style={styles.formTitle}>
            Record Payment
          </Text>
          <Divider style={styles.divider} />

          <TextInput
            label="Payment Amount *"
            value={formData.amount.toString()}
            onChangeText={(value) => handleChange('amount', parseFloat(value) || 0)}
            style={styles.input}
            mode="outlined"
            keyboardType="numeric"
            right={<TextInput.Affix text="USD" />}
          />

          <Text style={styles.sectionLabel}>Payment Method *</Text>
          <RadioButton.Group
            onValueChange={(value) => handleChange('paymentMethod', value)}
            value={formData.paymentMethod}
          >
            <View style={styles.radioButtonsContainer}>
              {PAYMENT_METHODS.map((method) => (
                <View key={method} style={styles.radioButtonRow}>
                  <RadioButton value={method} />
                  <Text>{method}</Text>
                </View>
              ))}
            </View>
          </RadioButton.Group>

          <Button mode="outlined" onPress={() => setShowDatePicker(true)} style={styles.dateButton}>
            {formData.paymentDate
              ? `Payment Date: ${formatDate(formData.paymentDate)}`
              : 'Select Payment Date'}
          </Button>
          {showDatePicker && (
            <DateTimePicker
              value={formData.paymentDate ? new Date(formData.paymentDate) : new Date()}
              mode="date"
              display="default"
              onChange={(_, date) => handleDateChange(date)}
            />
          )}

          <TextInput
            label="Notes"
            value={formData.notes || ''}
            onChangeText={(value) => handleChange('notes', value)}
            style={styles.input}
            mode="outlined"
            multiline
            numberOfLines={3}
            placeholder="Optional payment notes"
          />

          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={handleSave}
              style={styles.saveButton}
              loading={isLoading}
              disabled={isLoading}
            >
              Record Payment
            </Button>
            <Button
              mode="outlined"
              onPress={() => navigation.goBack()}
              style={styles.cancelButton}
              disabled={isLoading}
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
  invoiceCard: {
    marginBottom: spacing.md,
    ...shadows.small,
  },
  invoiceTitle: {
    fontSize: 18,
    marginBottom: spacing.sm,
  },
  divider: {
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  infoLabel: {
    width: 100,
    fontWeight: 'bold',
    color: '#555',
  },
  infoValue: {
    flex: 1,
  },
  balanceValue: {
    fontWeight: 'bold',
    color: '#F44336',
  },
  formCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: spacing.md,
    ...shadows.medium,
  },
  formTitle: {
    marginBottom: spacing.xs,
  },
  input: {
    marginBottom: spacing.md,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  radioButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md,
  },
  radioButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    marginBottom: spacing.xs,
  },
  dateButton: {
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
});

export default RecordPaymentScreen;
