import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import {
  TextInput,
  Button,
  Divider,
  Text,
  ActivityIndicator,
  Checkbox,
  HelperText,
  Menu,
  Switch,
} from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { VehiclesStackParamList } from '../../navigation/VehiclesNavigator';
import vehicleRepository, { VehicleInput } from '../../database/repositories/VehicleRepository';
import clientRepository from '../../database/repositories/ClientRepository';
import { spacing, shadows } from '../../utils/theme';

// Define types for the screen
type AddEditVehicleScreenNavigationProp = StackNavigationProp<
  VehiclesStackParamList,
  'AddEditVehicle'
>;
type AddEditVehicleScreenRouteProp = RouteProp<VehiclesStackParamList, 'AddEditVehicle'>;

// Client dropdown type
interface ClientOption {
  id: string;
  name: string;
}

// Fuel type options
const FUEL_TYPES = ['Gasoline', 'Diesel', 'Electric', 'Hybrid', 'Other'];

// Transmission types
const TRANSMISSION_TYPES = ['Automatic', 'Manual', 'CVT', 'DCT', 'Other'];

const AddEditVehicleScreen: React.FC = () => {
  const navigation = useNavigation<AddEditVehicleScreenNavigationProp>();
  const route = useRoute<AddEditVehicleScreenRouteProp>();
  const { vehicleId, clientId: preSelectedClientId } = route.params || {};
  const isEditMode = !!vehicleId;

  // Form state
  const [formData, setFormData] = useState<VehicleInput>({
    clientId: preSelectedClientId || '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    color: '',
    licensePlate: '',
    vin: '',
    engineType: '',
    engineDisplacement: '',
    engineHorsepower: undefined,
    engineFuelType: '',
    engineCylinderCount: undefined,
    engineTurboCharged: false,
    transmission: '',
    transmissionSpeeds: undefined,
    transmissionManufacturer: '',
    transmissionFluidType: '',
    mileage: undefined,
    notes: '',
  });

  // UI state
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loadingClients, setLoadingClients] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dropdown state
  const [clientMenuVisible, setClientMenuVisible] = useState(false);
  const [fuelTypeMenuVisible, setFuelTypeMenuVisible] = useState(false);
  const [transmissionMenuVisible, setTransmissionMenuVisible] = useState(false);

  // Selected client name for display
  const [selectedClientName, setSelectedClientName] = useState<string>('Select a client');

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

  // Load vehicle data if in edit mode
  useEffect(() => {
    const loadVehicle = async () => {
      if (!isEditMode) return;

      try {
        setIsLoading(true);
        const vehicle = await vehicleRepository.getById(vehicleId);

        if (vehicle) {
          // Set form data from vehicle
          setFormData({
            clientId: vehicle.clientId,
            make: vehicle.make,
            model: vehicle.model,
            year: vehicle.year,
            color: vehicle.color || '',
            licensePlate: vehicle.licensePlate || '',
            vin: vehicle.vin || '',
            engineType: vehicle.engineType,
            engineDisplacement: vehicle.engineDisplacement || '',
            engineHorsepower: vehicle.engineHorsepower,
            engineFuelType: vehicle.engineFuelType || '',
            engineCylinderCount: vehicle.engineCylinderCount,
            engineTurboCharged: vehicle.engineTurboCharged || false,
            transmission: vehicle.transmission,
            transmissionSpeeds: vehicle.transmissionSpeeds,
            transmissionManufacturer: vehicle.transmissionManufacturer || '',
            transmissionFluidType: vehicle.transmissionFluidType || '',
            mileage: vehicle.mileage,
            notes: vehicle.notes || '',
          });

          // Get client name for display
          const clientInfo = await clientRepository.getById(vehicle.clientId);
          if (clientInfo) {
            setSelectedClientName(`${clientInfo.firstName} ${clientInfo.lastName}`);
          }
        } else {
          setError('Vehicle not found');
        }
      } catch (err) {
        console.error('Error loading vehicle:', err);
        setError('Failed to load vehicle details');
      } finally {
        setIsLoading(false);
      }
    };

    loadVehicle();
  }, [vehicleId, isEditMode]);

  // Handle form field changes
  const handleChange = (field: keyof VehicleInput, value: any) => {
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
    }));
    setSelectedClientName(name);
    setClientMenuVisible(false);
  };

  // Handle fuel type selection
  const handleFuelTypeSelect = (type: string) => {
    setFormData((prev) => ({
      ...prev,
      engineFuelType: type,
    }));
    setFuelTypeMenuVisible(false);
  };

  // Handle transmission type selection
  const handleTransmissionSelect = (type: string) => {
    setFormData((prev) => ({
      ...prev,
      transmission: type,
    }));
    setTransmissionMenuVisible(false);
  };

  // Validate form
  const validateForm = (): boolean => {
    if (!formData.clientId) {
      Alert.alert('Error', 'Please select a client');
      return false;
    }

    if (!formData.make.trim()) {
      Alert.alert('Error', 'Make is required');
      return false;
    }

    if (!formData.model.trim()) {
      Alert.alert('Error', 'Model is required');
      return false;
    }

    if (!formData.year || formData.year < 1900 || formData.year > 2100) {
      Alert.alert('Error', 'Please enter a valid year');
      return false;
    }

    if (!formData.engineType.trim()) {
      Alert.alert('Error', 'Engine type is required');
      return false;
    }

    if (!formData.transmission.trim()) {
      Alert.alert('Error', 'Transmission type is required');
      return false;
    }

    return true;
  };

  // Save vehicle
  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setIsSaving(true);
      setError(null);

      if (isEditMode) {
        await vehicleRepository.update(vehicleId, formData);
      } else {
        await vehicleRepository.create(formData);
      }

      // Navigate back on success
      navigation.goBack();
    } catch (err) {
      console.error('Error saving vehicle:', err);
      setError(`Failed to ${isEditMode ? 'update' : 'create'} vehicle. Please try again.`);
    } finally {
      setIsSaving(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading vehicle data...</Text>
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
            Client Information
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

          <Text variant="titleLarge" style={[styles.sectionTitle, styles.sectionTitleSpacing]}>
            Vehicle Information
          </Text>
          <Divider style={styles.divider} />

          <TextInput
            label="Make *"
            value={formData.make}
            onChangeText={(value) => handleChange('make', value)}
            style={styles.input}
            mode="outlined"
          />

          <TextInput
            label="Model *"
            value={formData.model}
            onChangeText={(value) => handleChange('model', value)}
            style={styles.input}
            mode="outlined"
          />

          <TextInput
            label="Year *"
            value={formData.year?.toString() || ''}
            onChangeText={(value) => handleChange('year', parseInt(value) || '')}
            style={styles.input}
            mode="outlined"
            keyboardType="number-pad"
          />

          <TextInput
            label="Color"
            value={formData.color}
            onChangeText={(value) => handleChange('color', value)}
            style={styles.input}
            mode="outlined"
          />

          <TextInput
            label="License Plate"
            value={formData.licensePlate}
            onChangeText={(value) => handleChange('licensePlate', value)}
            style={styles.input}
            mode="outlined"
            autoCapitalize="characters"
          />

          <TextInput
            label="VIN"
            value={formData.vin}
            onChangeText={(value) => handleChange('vin', value)}
            style={styles.input}
            mode="outlined"
            autoCapitalize="characters"
          />

          <TextInput
            label="Mileage"
            value={formData.mileage?.toString() || ''}
            onChangeText={(value) => handleChange('mileage', parseInt(value) || '')}
            style={styles.input}
            mode="outlined"
            keyboardType="number-pad"
          />

          <Text variant="titleLarge" style={[styles.sectionTitle, styles.sectionTitleSpacing]}>
            Engine Details
          </Text>
          <Divider style={styles.divider} />

          <TextInput
            label="Engine Type *"
            value={formData.engineType}
            onChangeText={(value) => handleChange('engineType', value)}
            style={styles.input}
            mode="outlined"
            placeholder="e.g. V6, Inline 4, etc."
          />

          <TextInput
            label="Displacement"
            value={formData.engineDisplacement}
            onChangeText={(value) => handleChange('engineDisplacement', value)}
            style={styles.input}
            mode="outlined"
            placeholder="e.g. 2.0L, 5.7L, etc."
          />

          <TextInput
            label="Horsepower"
            value={formData.engineHorsepower?.toString() || ''}
            onChangeText={(value) => handleChange('engineHorsepower', parseInt(value) || '')}
            style={styles.input}
            mode="outlined"
            keyboardType="number-pad"
          />

          {/* Fuel Type Selector */}
          <Menu
            visible={fuelTypeMenuVisible}
            onDismiss={() => setFuelTypeMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => setFuelTypeMenuVisible(true)}
                style={styles.dropdownButton}
              >
                {formData.engineFuelType || 'Select Fuel Type'}
              </Button>
            }
            style={styles.dropdown}
          >
            {FUEL_TYPES.map((type) => (
              <Menu.Item key={type} onPress={() => handleFuelTypeSelect(type)} title={type} />
            ))}
          </Menu>

          <TextInput
            label="Cylinder Count"
            value={formData.engineCylinderCount?.toString() || ''}
            onChangeText={(value) => handleChange('engineCylinderCount', parseInt(value) || '')}
            style={styles.input}
            mode="outlined"
            keyboardType="number-pad"
          />

          <View style={styles.switchContainer}>
            <Text>Turbo Charged</Text>
            <Switch
              value={formData.engineTurboCharged || false}
              onValueChange={(value) => handleChange('engineTurboCharged', value)}
            />
          </View>

          <Text variant="titleLarge" style={[styles.sectionTitle, styles.sectionTitleSpacing]}>
            Transmission Details
          </Text>
          <Divider style={styles.divider} />

          {/* Transmission Type Selector */}
          <Menu
            visible={transmissionMenuVisible}
            onDismiss={() => setTransmissionMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => setTransmissionMenuVisible(true)}
                style={styles.dropdownButton}
              >
                {formData.transmission || 'Select Transmission Type *'}
              </Button>
            }
            style={styles.dropdown}
          >
            {TRANSMISSION_TYPES.map((type) => (
              <Menu.Item key={type} onPress={() => handleTransmissionSelect(type)} title={type} />
            ))}
          </Menu>
          {!formData.transmission && (
            <HelperText type="error">Transmission type is required</HelperText>
          )}

          <TextInput
            label="Speeds"
            value={formData.transmissionSpeeds?.toString() || ''}
            onChangeText={(value) => handleChange('transmissionSpeeds', parseInt(value) || '')}
            style={styles.input}
            mode="outlined"
            keyboardType="number-pad"
          />

          <TextInput
            label="Manufacturer"
            value={formData.transmissionManufacturer}
            onChangeText={(value) => handleChange('transmissionManufacturer', value)}
            style={styles.input}
            mode="outlined"
          />

          <TextInput
            label="Fluid Type"
            value={formData.transmissionFluidType}
            onChangeText={(value) => handleChange('transmissionFluidType', value)}
            style={styles.input}
            mode="outlined"
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
              {isEditMode ? 'Update Vehicle' : 'Create Vehicle'}
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

export default AddEditVehicleScreen;
