import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import {
  TextInput,
  Button,
  Divider,
  Text,
  ActivityIndicator,
  HelperText,
  Menu,
  Switch,
  RadioButton,
} from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { JobsStackParamList } from '../../navigation/JobsNavigator';
import { useJobRepository, JobInput } from '../../hooks/useJobRepository';
import { useClientRepository } from '../../hooks/useClientRepository';
import { useVehicleRepository } from '../../hooks/useVehicleRepository';
import DateTimePicker from '@react-native-community/datetimepicker';
import { spacing, shadows } from '../../utils/theme';

// Define types for the screen
type AddEditJobScreenNavigationProp = StackNavigationProp<JobsStackParamList, 'AddEditJob'>;
type AddEditJobScreenRouteProp = RouteProp<JobsStackParamList, 'AddEditJob'>;

// Client and vehicle dropdown types
interface ClientOption {
  id: string;
  name: string;
}

interface VehicleOption {
  id: string;
  info: string;
}

// Job type and status options
const JOB_TYPES = ['repair', 'maintenance', 'diagnosis', 'estimate', 'other'];
const JOB_STATUSES = ['scheduled', 'in-progress', 'completed', 'invoiced', 'paid', 'canceled'];
const PAYMENT_STATUSES = ['unpaid', 'partial', 'paid'];

const AddEditJobScreen: React.FC = () => {
  const navigation = useNavigation<AddEditJobScreenNavigationProp>();
  const route = useRoute<AddEditJobScreenRouteProp>();
  const {
    jobId,
    clientId: preSelectedClientId,
    vehicleId: preSelectedVehicleId,
  } = route.params || {};
  const isEditMode = !!jobId;

  const jobRepository = useJobRepository();
  const clientRepository = useClientRepository();
  const vehicleRepository = useVehicleRepository();

  // Form state
  const [formData, setFormData] = useState<JobInput>({
    clientId: preSelectedClientId || '',
    vehicleId: preSelectedVehicleId || '',
    title: '',
    description: '',
    status: 'scheduled',
    jobType: 'repair',
    isHomeVisit: false,
    locationAddress: '',
    locationNotes: '',
    scheduledDate: undefined,
    startDate: undefined,
    completionDate: undefined,
    estimateProvided: false,
    estimateAccepted: undefined,
    estimateAmount: undefined,
    totalCost: 0,
    invoiceNumber: '',
    paymentStatus: undefined,
    paymentMethod: '',
    notes: '',
  });

  // UI state
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [vehicles, setVehicles] = useState<VehicleOption[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<VehicleOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loadingClients, setLoadingClients] = useState(true);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dropdown state
  const [clientMenuVisible, setClientMenuVisible] = useState(false);
  const [vehicleMenuVisible, setVehicleMenuVisible] = useState(false);
  const [jobTypeMenuVisible, setJobTypeMenuVisible] = useState(false);
  const [statusMenuVisible, setStatusMenuVisible] = useState(false);
  const [paymentStatusMenuVisible, setPaymentStatusMenuVisible] = useState(false);

  // Date picker state
  const [showScheduledDatePicker, setShowScheduledDatePicker] = useState(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showCompletionDatePicker, setShowCompletionDatePicker] = useState(false);

  // Selected display names
  const [selectedClientName, setSelectedClientName] = useState<string>('Select a client');
  const [selectedVehicleName, setSelectedVehicleName] = useState<string>('Select a vehicle');

  // Load clients for dropdown
  useEffect(() => {
    const loadClients = async () => {
      try {
        const clientList = await clientRepository.getAll();
        const options = clientList.map((client) => ({
          id: client.id,
          name: `${client.firstName} ${client.lastName}`,
        }));
        setClients(options);

        // If preSelectedClientId is provided, set the selected client name
        if (preSelectedClientId) {
          const selectedClient = options.find((client) => client.id === preSelectedClientId);
          if (selectedClient) {
            setSelectedClientName(selectedClient.name);
          }
        }
      } catch (err) {
        console.error('Error loading clients:', err);
      } finally {
        setLoadingClients(false);
      }
    };

    loadClients();
  }, [preSelectedClientId]);

  // Load all vehicles for dropdown
  useEffect(() => {
    const loadVehicles = async () => {
      try {
        const vehicleList = await vehicleRepository.getAll();
        const options = vehicleList.map((vehicle) => ({
          id: vehicle.id,
          info: `${vehicle.year} ${vehicle.make} ${vehicle.model} - ${vehicle.clientName}`,
        }));
        setVehicles(options);
        setFilteredVehicles(options);

        // If preSelectedVehicleId is provided, set the selected vehicle name
        if (preSelectedVehicleId) {
          const selectedVehicle = options.find((vehicle) => vehicle.id === preSelectedVehicleId);
          if (selectedVehicle) {
            setSelectedVehicleName(selectedVehicle.info);
          }
        }
      } catch (err) {
        console.error('Error loading vehicles:', err);
      } finally {
        setLoadingVehicles(false);
      }
    };

    loadVehicles();
  }, [preSelectedVehicleId]);

  // Filter vehicles based on selected client
  useEffect(() => {
    if (formData.clientId) {
      const clientVehicles = vehicles.filter((vehicle) =>
        vehicle.info.includes(selectedClientName)
      );
      setFilteredVehicles(clientVehicles);
    } else {
      setFilteredVehicles(vehicles);
    }
  }, [formData.clientId, selectedClientName, vehicles]);

  // Load job data if in edit mode
  useEffect(() => {
    const loadJob = async () => {
      if (!isEditMode) return;

      try {
        setIsLoading(true);
        const job = await jobRepository.getById(jobId);

        if (job) {
          // Set form data from job
          setFormData({
            clientId: job.clientId,
            vehicleId: job.vehicleId,
            title: job.title,
            description: job.description,
            status: job.status,
            jobType: job.jobType,
            isHomeVisit: job.isHomeVisit,
            locationAddress: job.locationAddress || '',
            locationNotes: job.locationNotes || '',
            scheduledDate: job.scheduledDate,
            startDate: job.startDate,
            completionDate: job.completionDate,
            estimateProvided: job.estimateProvided,
            estimateAccepted: job.estimateAccepted,
            estimateAmount: job.estimateAmount,
            totalCost: job.totalCost,
            invoiceNumber: job.invoiceNumber || '',
            paymentStatus: job.paymentStatus,
            paymentMethod: job.paymentMethod || '',
            notes: job.notes || '',
          });

          // Get client name for display
          const jobWithDetails = await jobRepository.getJobWithDetails(jobId);
          if (jobWithDetails) {
            setSelectedClientName(jobWithDetails.clientName);
            setSelectedVehicleName(jobWithDetails.vehicleInfo);
          }
        } else {
          setError('Job not found');
        }
      } catch (err) {
        console.error('Error loading job:', err);
        setError('Failed to load job details');
      } finally {
        setIsLoading(false);
      }
    };

    loadJob();
  }, [jobId, isEditMode]);

  // Handle form field changes
  const handleChange = (field: keyof JobInput, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle client selection
  const handleClientSelect = (id: string, name: string) => {
    setFormData((prev) => ({
      ...prev,
      clientId: id,
      // Clear vehicle selection if client changes
      ...(prev.clientId !== id ? { vehicleId: '' } : {}),
    }));
    setSelectedClientName(name);
    setClientMenuVisible(false);

    // Also clear vehicle selection UI
    if (formData.clientId !== id) {
      setSelectedVehicleName('Select a vehicle');
    }
  };

  // Handle vehicle selection
  const handleVehicleSelect = (id: string, info: string) => {
    setFormData((prev) => ({
      ...prev,
      vehicleId: id,
    }));
    setSelectedVehicleName(info);
    setVehicleMenuVisible(false);
  };

  // Handle job type selection
  const handleJobTypeSelect = (type: string) => {
    setFormData((prev) => ({
      ...prev,
      jobType: type as any,
    }));
    setJobTypeMenuVisible(false);
  };

  // Handle status selection
  const handleStatusSelect = (status: string) => {
    setFormData((prev) => ({
      ...prev,
      status: status as any,
    }));
    setStatusMenuVisible(false);
  };

  // Handle payment status selection
  const handlePaymentStatusSelect = (status: string) => {
    setFormData((prev) => ({
      ...prev,
      paymentStatus: status as any,
    }));
    setPaymentStatusMenuVisible(false);
  };

  // Handle date changes
  const handleDateChange = (
    field: 'scheduledDate' | 'startDate' | 'completionDate',
    date?: Date
  ) => {
    if (date) {
      handleChange(field, date.toISOString());
    }

    // Hide the date picker
    switch (field) {
      case 'scheduledDate':
        setShowScheduledDatePicker(false);
        break;
      case 'startDate':
        setShowStartDatePicker(false);
        break;
      case 'completionDate':
        setShowCompletionDatePicker(false);
        break;
    }
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
    if (!formData.clientId) {
      Alert.alert('Error', 'Please select a client');
      return false;
    }

    if (!formData.vehicleId) {
      Alert.alert('Error', 'Please select a vehicle');
      return false;
    }

    if (!formData.title.trim()) {
      Alert.alert('Error', 'Title is required');
      return false;
    }

    if (!formData.description.trim()) {
      Alert.alert('Error', 'Description is required');
      return false;
    }

    if (formData.isHomeVisit && !formData.locationAddress) {
      Alert.alert('Error', 'Location address is required for home visits');
      return false;
    }

    if (formData.estimateProvided && formData.estimateAmount === undefined) {
      Alert.alert('Error', 'Estimate amount is required when estimate is provided');
      return false;
    }

    return true;
  };

  // Save job
  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setIsSaving(true);
      setError(null);

      if (isEditMode) {
        await jobRepository.update(jobId, formData);
      } else {
        await jobRepository.create(formData);
      }

      // Navigate back on success
      navigation.goBack();
    } catch (err) {
      console.error('Error saving job:', err);
      setError(`Failed to ${isEditMode ? 'update' : 'create'} job. Please try again.`);
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
            Client & Vehicle
          </Text>
          <Divider style={styles.divider} />

          {/* Client Selector */}
          <Menu
            visible={clientMenuVisible}
            onDismiss={() => setClientMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => setClientMenuVisible(true)}
                style={styles.dropdownButton}
                loading={loadingClients}
                disabled={loadingClients || isEditMode} // Disable in edit mode
              >
                {selectedClientName}
              </Button>
            }
            style={styles.dropdown}
          >
            {clients.map((client) => (
              <Menu.Item
                key={client.id}
                onPress={() => handleClientSelect(client.id, client.name)}
                title={client.name}
              />
            ))}
          </Menu>
          {!formData.clientId && <HelperText type="error">Client is required</HelperText>}

          {/* Vehicle Selector */}
          <Menu
            visible={vehicleMenuVisible}
            onDismiss={() => setVehicleMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => setVehicleMenuVisible(true)}
                style={styles.dropdownButton}
                loading={loadingVehicles}
                disabled={loadingVehicles || !formData.clientId || isEditMode} // Disable if no client selected or in edit mode
              >
                {selectedVehicleName}
              </Button>
            }
            style={styles.dropdown}
          >
            {filteredVehicles.map((vehicle) => (
              <Menu.Item
                key={vehicle.id}
                onPress={() => handleVehicleSelect(vehicle.id, vehicle.info)}
                title={vehicle.info}
              />
            ))}
          </Menu>
          {!formData.vehicleId && <HelperText type="error">Vehicle is required</HelperText>}

          <Text variant="titleLarge" style={[styles.sectionTitle, styles.sectionTitleSpacing]}>
            Job Details
          </Text>
          <Divider style={styles.divider} />

          <TextInput
            label="Title *"
            value={formData.title}
            onChangeText={(value) => handleChange('title', value)}
            style={styles.input}
            mode="outlined"
          />

          <TextInput
            label="Description *"
            value={formData.description}
            onChangeText={(value) => handleChange('description', value)}
            style={styles.input}
            mode="outlined"
            multiline
            numberOfLines={4}
          />

          {/* Job Type Selector */}
          <Menu
            visible={jobTypeMenuVisible}
            onDismiss={() => setJobTypeMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => setJobTypeMenuVisible(true)}
                style={styles.dropdownButton}
              >
                {`Job Type: ${formData.jobType}`}
              </Button>
            }
            style={styles.dropdown}
          >
            {JOB_TYPES.map((type) => (
              <Menu.Item key={type} onPress={() => handleJobTypeSelect(type)} title={type} />
            ))}
          </Menu>

          {/* Status Selector */}
          <Menu
            visible={statusMenuVisible}
            onDismiss={() => setStatusMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => setStatusMenuVisible(true)}
                style={styles.dropdownButton}
              >
                {`Status: ${formData.status}`}
              </Button>
            }
            style={styles.dropdown}
          >
            {JOB_STATUSES.map((status) => (
              <Menu.Item key={status} onPress={() => handleStatusSelect(status)} title={status} />
            ))}
          </Menu>

          {/* Home Visit Toggle */}
          <View style={styles.switchContainer}>
            <Text>Home Visit</Text>
            <Switch
              value={formData.isHomeVisit}
              onValueChange={(value) => handleChange('isHomeVisit', value)}
            />
          </View>

          {formData.isHomeVisit && (
            <>
              <TextInput
                label="Location Address *"
                value={formData.locationAddress}
                onChangeText={(value) => handleChange('locationAddress', value)}
                style={styles.input}
                mode="outlined"
              />

              <TextInput
                label="Location Notes"
                value={formData.locationNotes}
                onChangeText={(value) => handleChange('locationNotes', value)}
                style={styles.input}
                mode="outlined"
                multiline
              />
            </>
          )}

          <Text variant="titleLarge" style={[styles.sectionTitle, styles.sectionTitleSpacing]}>
            Dates
          </Text>
          <Divider style={styles.divider} />

          {/* Scheduled Date Picker */}
          <Button
            mode="outlined"
            onPress={() => setShowScheduledDatePicker(true)}
            style={styles.dateButton}
          >
            {formData.scheduledDate
              ? `Scheduled Date: ${formatDate(formData.scheduledDate)}`
              : 'Set Scheduled Date'}
          </Button>
          {showScheduledDatePicker && (
            <DateTimePicker
              value={formData.scheduledDate ? new Date(formData.scheduledDate) : new Date()}
              mode="date"
              display="default"
              onChange={(_, date) => handleDateChange('scheduledDate', date)}
            />
          )}

          {/* Start Date Picker */}
          <Button
            mode="outlined"
            onPress={() => setShowStartDatePicker(true)}
            style={styles.dateButton}
          >
            {formData.startDate
              ? `Start Date: ${formatDate(formData.startDate)}`
              : 'Set Start Date'}
          </Button>
          {showStartDatePicker && (
            <DateTimePicker
              value={formData.startDate ? new Date(formData.startDate) : new Date()}
              mode="date"
              display="default"
              onChange={(_, date) => handleDateChange('startDate', date)}
            />
          )}

          {/* Completion Date Picker */}
          <Button
            mode="outlined"
            onPress={() => setShowCompletionDatePicker(true)}
            style={styles.dateButton}
          >
            {formData.completionDate
              ? `Completion Date: ${formatDate(formData.completionDate)}`
              : 'Set Completion Date'}
          </Button>
          {showCompletionDatePicker && (
            <DateTimePicker
              value={formData.completionDate ? new Date(formData.completionDate) : new Date()}
              mode="date"
              display="default"
              onChange={(_, date) => handleDateChange('completionDate', date)}
            />
          )}

          <Text variant="titleLarge" style={[styles.sectionTitle, styles.sectionTitleSpacing]}>
            Financial Details
          </Text>
          <Divider style={styles.divider} />

          {/* Estimate Toggle */}
          <View style={styles.switchContainer}>
            <Text>Estimate Provided</Text>
            <Switch
              value={formData.estimateProvided}
              onValueChange={(value) => handleChange('estimateProvided', value)}
            />
          </View>

          {formData.estimateProvided && (
            <>
              <TextInput
                label="Estimate Amount ($) *"
                value={formData.estimateAmount?.toString() || ''}
                onChangeText={(value) => handleChange('estimateAmount', parseFloat(value) || 0)}
                style={styles.input}
                mode="outlined"
                keyboardType="numeric"
              />

              <View style={styles.radioContainer}>
                <Text>Estimate Accepted</Text>
                <View style={styles.radioGroup}>
                  <View style={styles.radioButton}>
                    <RadioButton
                      value="true"
                      status={formData.estimateAccepted === true ? 'checked' : 'unchecked'}
                      onPress={() => handleChange('estimateAccepted', true)}
                    />
                    <Text>Yes</Text>
                  </View>
                  <View style={styles.radioButton}>
                    <RadioButton
                      value="false"
                      status={formData.estimateAccepted === false ? 'checked' : 'unchecked'}
                      onPress={() => handleChange('estimateAccepted', false)}
                    />
                    <Text>No</Text>
                  </View>
                  <View style={styles.radioButton}>
                    <RadioButton
                      value="undefined"
                      status={formData.estimateAccepted === undefined ? 'checked' : 'unchecked'}
                      onPress={() => handleChange('estimateAccepted', undefined)}
                    />
                    <Text>N/A</Text>
                  </View>
                </View>
              </View>
            </>
          )}

          <TextInput
            label="Invoice Number"
            value={formData.invoiceNumber}
            onChangeText={(value) => handleChange('invoiceNumber', value)}
            style={styles.input}
            mode="outlined"
          />

          {/* Payment Status Selector */}
          <Menu
            visible={paymentStatusMenuVisible}
            onDismiss={() => setPaymentStatusMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => setPaymentStatusMenuVisible(true)}
                style={styles.dropdownButton}
              >
                {formData.paymentStatus
                  ? `Payment Status: ${formData.paymentStatus}`
                  : 'Set Payment Status'}
              </Button>
            }
            style={styles.dropdown}
          >
            {PAYMENT_STATUSES.map((status) => (
              <Menu.Item
                key={status}
                onPress={() => handlePaymentStatusSelect(status)}
                title={status}
              />
            ))}
          </Menu>

          {formData.paymentStatus && (
            <TextInput
              label="Payment Method"
              value={formData.paymentMethod}
              onChangeText={(value) => handleChange('paymentMethod', value)}
              style={styles.input}
              mode="outlined"
              placeholder="e.g. Cash, Credit Card, Check"
            />
          )}

          <TextInput
            label="Total Cost ($)"
            value={formData.totalCost.toString()}
            onChangeText={(value) => handleChange('totalCost', parseFloat(value) || 0)}
            style={styles.input}
            mode="outlined"
            keyboardType="numeric"
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
              {isEditMode ? 'Update Job' : 'Create Job'}
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
  dropdownButton: {
    marginBottom: spacing.md,
  },
  dropdown: {
    marginTop: 70, // Adjust as needed for your UI
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
  radioContainer: {
    marginBottom: spacing.md,
  },
  radioGroup: {
    flexDirection: 'row',
    marginTop: spacing.xs,
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.md,
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

export default AddEditJobScreen;
