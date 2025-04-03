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
import { AppointmentsStackParamList } from '../../navigation/AppointmentsNavigator';
import { useAppointmentRepository, AppointmentInput } from '../../hooks/useAppointmentRepository';
import { useClientRepository } from '../../hooks/useClientRepository';
import { useVehicleRepository } from '../../hooks/useVehicleRepository';
import { spacing, shadows } from '../../utils/theme';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { format } from 'date-fns';

// Define types for the screen
type AddEditAppointmentScreenNavigationProp = StackNavigationProp<
  AppointmentsStackParamList,
  'AddEditAppointment'
>;
type AddEditAppointmentScreenRouteProp = RouteProp<
  AppointmentsStackParamList,
  'AddEditAppointment'
>;

// Duration options in minutes
const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120, 180, 240];

// Status options
const STATUS_OPTIONS = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'canceled', label: 'Canceled' },
  { value: 'no-show', label: 'No Show' },
];

const AddEditAppointmentScreen: React.FC = () => {
  const appointmentRepository = useAppointmentRepository();
  const clientRepository = useClientRepository();
  const vehicleRepository = useVehicleRepository();

  const navigation = useNavigation<AddEditAppointmentScreenNavigationProp>();
  const route = useRoute<AddEditAppointmentScreenRouteProp>();
  const {
    appointmentId,
    clientId: preSelectedClientId,
    vehicleId: preSelectedVehicleId,
    initialDate,
  } = route.params || {};
  const isEditMode = !!appointmentId;

  // Prepare default date (use initialDate if provided, otherwise use current date)
  const getDefaultDate = () => {
    if (initialDate) {
      return new Date(initialDate);
    }

    const now = new Date();
    // Round to the nearest 15 minutes
    now.setMinutes(Math.ceil(now.getMinutes() / 15) * 15);
    now.setSeconds(0);
    now.setMilliseconds(0);
    return now;
  };

  // Form state
  const [formData, setFormData] = useState<AppointmentInput>({
    clientId: preSelectedClientId || '',
    vehicleId: preSelectedVehicleId || '',
    scheduledDate: getDefaultDate().toISOString(),
    duration: 60, // Default to 1 hour
    status: 'scheduled',
    isHomeVisit: false,
    locationAddress: '',
    locationNotes: '',
    notes: '',
  });

  // UI state
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [vehicles, setVehicles] = useState<{ id: string; info: string; clientId: string }[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<
    { id: string; info: string; clientId: string }[]
  >([]);
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSaving, setIsSaving] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);

  // Dropdown/menu state
  const [clientMenuVisible, setClientMenuVisible] = useState(false);
  const [vehicleMenuVisible, setVehicleMenuVisible] = useState(false);
  const [durationMenuVisible, setDurationMenuVisible] = useState(false);
  const [statusMenuVisible, setStatusMenuVisible] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

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
      }
    };

    loadClients();
  }, [preSelectedClientId, clientRepository]);

  // Load all vehicles for dropdown
  useEffect(() => {
    const loadVehicles = async () => {
      try {
        const vehicleList = await vehicleRepository.getAll();
        const options = vehicleList.map((vehicle) => ({
          id: vehicle.id,
          info: `${vehicle.year} ${vehicle.make} ${vehicle.model} - ${vehicle.clientName}`,
          clientId: vehicle.clientId,
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
      }
    };

    loadVehicles();
  }, [preSelectedVehicleId, vehicleRepository]);

  // Filter vehicles based on selected client
  useEffect(() => {
    if (formData.clientId) {
      const clientVehicles = vehicles.filter((vehicle) => vehicle.clientId === formData.clientId);
      setFilteredVehicles(clientVehicles);
    } else {
      setFilteredVehicles(vehicles);
    }
  }, [formData.clientId, vehicles]);

  // Load appointment data if in edit mode
  useEffect(() => {
    const loadAppointment = async () => {
      if (!isEditMode) return;

      try {
        setIsLoading(true);
        const appointment = await appointmentRepository.getById(appointmentId);

        if (appointment) {
          // Set form data from appointment
          setFormData({
            clientId: appointment.clientId,
            vehicleId: appointment.vehicleId,
            scheduledDate: appointment.scheduledDate,
            duration: appointment.duration,
            status: appointment.status,
            isHomeVisit: appointment.isHomeVisit,
            locationAddress: appointment.locationAddress || '',
            locationNotes: appointment.locationNotes || '',
            notes: appointment.notes || '',
          });

          // Get client name for display
          const appointmentWithDetails =
            await appointmentRepository.getAppointmentWithDetails(appointmentId);
          if (appointmentWithDetails) {
            setSelectedClientName(appointmentWithDetails.clientName);
            setSelectedVehicleName(appointmentWithDetails.vehicleInfo);
          }
        } else {
          setError('Appointment not found');
        }
      } catch (err) {
        console.error('Error loading appointment:', err);
        setError('Failed to load appointment details');
      } finally {
        setIsLoading(false);
      }
    };

    loadAppointment();
  }, [appointmentId, isEditMode, appointmentRepository]);

  // Handle form field changes
  const handleChange = (field: keyof AppointmentInput, value: string | boolean | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear availability error when date or duration is changed
    if (field === 'scheduledDate' || field === 'duration') {
      setAvailabilityError(null);
    }
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

    // Also clear vehicle selection UI if client changes
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

  // Handle duration selection
  const handleDurationSelect = (minutes: number) => {
    handleChange('duration', minutes);
    setDurationMenuVisible(false);
  };

  // Handle status selection
  const handleStatusSelect = (status: string) => {
    handleChange(
      'status',
      status as 'scheduled' | 'confirmed' | 'completed' | 'canceled' | 'no-show'
    );
    setStatusMenuVisible(false);
  };

  // Handle date changes
  const handleDateChange = (event: unknown, selectedDate?: Date) => {
    if (selectedDate) {
      // Keep the time part from the existing date
      const currentDate = new Date(formData.scheduledDate);
      selectedDate.setHours(currentDate.getHours());
      selectedDate.setMinutes(currentDate.getMinutes());

      handleChange('scheduledDate', selectedDate.toISOString());
    }
    setShowDatePicker(false);
  };

  // Handle time changes
  const handleTimeChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (selectedDate) {
      // Keep the date part from the existing date but update the time
      const currentDate = new Date(formData.scheduledDate);
      currentDate.setHours(selectedDate.getHours());
      currentDate.setMinutes(selectedDate.getMinutes());

      handleChange('scheduledDate', currentDate.toISOString());
    }
    setShowTimePicker(false);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'EEEE, MMMM d, yyyy');
    } catch (err) {
      console.error('Error formatting date:', err);
      return 'Invalid date';
    }
  };

  // Format time for display
  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'h:mm a');
    } catch (err) {
      console.error('Error formatting time:', err);
      return 'Invalid time';
    }
  };

  // Check appointment time availability
  const checkAvailability = async (): Promise<boolean> => {
    setIsCheckingAvailability(true);
    setAvailabilityError(null);

    try {
      const isAvailable = await appointmentRepository.checkAvailability(
        formData.scheduledDate,
        formData.duration,
        isEditMode ? appointmentId : undefined
      );

      if (!isAvailable) {
        setAvailabilityError(
          'This time slot conflicts with another appointment. Please choose a different time.'
        );
        return false;
      }

      return true;
    } catch (err: unknown) {
      console.error('Error checking availability:', err);
      setAvailabilityError('Failed to check time slot availability. Please try again.');
      return false;
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  // Validate form
  const validateForm = async (): Promise<boolean> => {
    // Check required fields
    if (!formData.clientId) {
      Alert.alert('Error', 'Please select a client');
      return false;
    }

    if (!formData.vehicleId) {
      Alert.alert('Error', 'Please select a vehicle');
      return false;
    }

    if (!formData.scheduledDate) {
      Alert.alert('Error', 'Scheduled date and time are required');
      return false;
    }

    if (formData.isHomeVisit && !formData.locationAddress) {
      Alert.alert('Error', 'Location address is required for home visits');
      return false;
    }

    // Check availability
    const isAvailable = await checkAvailability();
    return isAvailable;
  };

  // Save appointment
  const handleSave = async (): Promise<void> => {
    const isValid = await validateForm();
    if (!isValid) return;

    try {
      setIsSaving(true);
      setError(null);

      if (isEditMode) {
        await appointmentRepository.update(appointmentId, formData);
        Alert.alert('Success', 'Appointment updated successfully', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      } else {
        await appointmentRepository.create(formData);
        Alert.alert('Success', 'Appointment created successfully', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      }
    } catch (err: unknown) {
      console.error('Error saving appointment:', err);
      setError(`Failed to ${isEditMode ? 'update' : 'create'} appointment. Please try again.`);
    } finally {
      setIsSaving(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading appointment details...</Text>
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
            {isEditMode ? 'Edit Appointment' : 'New Appointment'}
          </Text>
          <Divider style={styles.divider} />

          {/* Client Selection */}
          <Menu
            visible={clientMenuVisible}
            onDismiss={() => setClientMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => setClientMenuVisible(true)}
                style={styles.dropdownButton}
              >
                {selectedClientName}
              </Button>
            }
          >
            {clients.map((client) => (
              <Menu.Item
                key={client.id}
                onPress={() => handleClientSelect(client.id, client.name)}
                title={client.name}
              />
            ))}
          </Menu>
          <HelperText type="error" visible={!formData.clientId}>
            Client is required
          </HelperText>

          {/* Vehicle Selection */}
          <Menu
            visible={vehicleMenuVisible}
            onDismiss={() => setVehicleMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => setVehicleMenuVisible(true)}
                style={styles.dropdownButton}
              >
                {selectedVehicleName}
              </Button>
            }
          >
            {filteredVehicles.map((vehicle) => (
              <Menu.Item
                key={vehicle.id}
                onPress={() => handleVehicleSelect(vehicle.id, vehicle.info)}
                title={vehicle.info}
              />
            ))}
          </Menu>
          <HelperText type="error" visible={!formData.vehicleId}>
            Vehicle is required
          </HelperText>

          {/* Date and Time Selection */}
          <Button mode="outlined" onPress={() => setShowDatePicker(true)} style={styles.dateButton}>
            {formatDate(formData.scheduledDate)}
          </Button>
          {showDatePicker && (
            <DateTimePicker
              value={new Date(formData.scheduledDate)}
              mode="date"
              display="default"
              onChange={handleDateChange}
            />
          )}
          <Button mode="outlined" onPress={() => setShowTimePicker(true)} style={styles.timeButton}>
            {formatTime(formData.scheduledDate)}
          </Button>
          {showTimePicker && (
            <DateTimePicker
              value={new Date(formData.scheduledDate)}
              mode="time"
              display="default"
              onChange={handleTimeChange}
            />
          )}

          {/* Duration Selection */}
          <Menu
            visible={durationMenuVisible}
            onDismiss={() => setDurationMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => setDurationMenuVisible(true)}
                style={styles.dropdownButton}
              >
                {`${formData.duration} minutes`}
              </Button>
            }
          >
            {DURATION_OPTIONS.map((duration) => (
              <Menu.Item
                key={duration}
                onPress={() => handleDurationSelect(duration)}
                title={`${duration} minutes`}
              />
            ))}
          </Menu>

          {/* Status Selection */}
          <Menu
            visible={statusMenuVisible}
            onDismiss={() => setStatusMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => setStatusMenuVisible(true)}
                style={styles.dropdownButton}
              >
                {STATUS_OPTIONS.find((status) => status.value === formData.status)?.label}
              </Button>
            }
          >
            {STATUS_OPTIONS.map((status) => (
              <Menu.Item
                key={status.value}
                onPress={() => handleStatusSelect(status.value)}
                title={status.label}
              />
            ))}
          </Menu>

          {/* Home Visit Switch */}
          <View style={styles.switchContainer}>
            <Text>Home Visit</Text>
            <Switch
              value={formData.isHomeVisit}
              onValueChange={(value) => handleChange('isHomeVisit', value)}
            />
          </View>

          {/* Location Address */}
          {formData.isHomeVisit && (
            <TextInput
              label="Location Address"
              value={formData.locationAddress}
              onChangeText={(text) => handleChange('locationAddress', text)}
              style={styles.textInput}
            />
          )}

          {/* Notes */}
          <TextInput
            label="Notes"
            value={formData.notes}
            onChangeText={(text) => handleChange('notes', text)}
            multiline
            style={styles.textInput}
          />

          {/* Availability Error */}
          {availabilityError && (
            <HelperText type="error" visible>
              {availabilityError}
            </HelperText>
          )}

          {/* Save Button */}
          <Button
            mode="contained"
            onPress={handleSave}
            loading={isSaving}
            disabled={isSaving}
            style={styles.saveButton}
          >
            {isEditMode ? 'Update Appointment' : 'Create Appointment'}
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: spacing.md,
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: spacing.sm,
    padding: spacing.md,
    ...shadows.medium,
  },
  sectionTitle: {
    marginBottom: spacing.sm,
  },
  divider: {
    marginVertical: spacing.sm,
  },
  dropdownButton: {
    marginVertical: spacing.sm,
  },
  dateButton: {
    marginVertical: spacing.sm,
  },
  timeButton: {
    marginVertical: spacing.sm,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: spacing.sm,
  },
  textInput: {
    marginVertical: spacing.sm,
  },
  saveButton: {
    marginTop: spacing.md,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.sm,
  },
  errorContainer: {
    marginBottom: spacing.md,
  },
  errorText: {
    color: 'red',
  },
});

export default AddEditAppointmentScreen;
