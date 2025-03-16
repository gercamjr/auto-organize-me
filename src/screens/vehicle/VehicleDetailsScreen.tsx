import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Image,
} from 'react-native';
import {
  Text,
  Card,
  Title,
  Paragraph,
  Button,
  Divider,
  IconButton,
  ActivityIndicator,
  FAB,
  Chip,
} from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { VehiclesStackParamList } from '../../navigation/VehiclesNavigator';
import { useVehicleRepository, Vehicle, VehiclePhoto } from '../../hooks/useVehicleRepository';
import { spacing, shadows } from '../../utils/theme';
import { format } from 'date-fns';
import { JobListItem, useJobRepository } from '@/hooks/useJobRepository';

// Define types for the screen
type VehicleDetailsScreenNavigationProp = StackNavigationProp<
  VehiclesStackParamList,
  'VehicleDetails'
>;
type VehicleDetailsScreenRouteProp = RouteProp<VehiclesStackParamList, 'VehicleDetails'>;

// Vehicle data with client and photos
interface VehicleWithDetails extends Vehicle {
  clientName: string;
  photos: VehiclePhoto[];
  jobCount: number;
  lastServiceDate?: string;
  recentJobs?: JobListItem[];
}

const VehicleDetailsScreen: React.FC = () => {
  const vehicleRepository = useVehicleRepository();
  const jobRepository = useJobRepository();

  const navigation = useNavigation<VehicleDetailsScreenNavigationProp>();
  const route = useRoute<VehicleDetailsScreenRouteProp>();
  const { vehicleId } = route.params;

  const [vehicle, setVehicle] = useState<VehicleWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load vehicle data
  const loadVehicleData = async () => {
    try {
      setError(null);

      // Get basic vehicle data
      const vehicleData = await vehicleRepository.getById(vehicleId);

      if (!vehicleData) {
        setError('Vehicle not found');
        setIsLoading(false);
        setRefreshing(false);
        return;
      }

      // Get client info
      const vehicleWithClient = await vehicleRepository.getVehicleWithClient(vehicleId);

      if (!vehicleWithClient) {
        setError('Failed to load vehicle details');
        setIsLoading(false);
        setRefreshing(false);
        return;
      }

      // Get vehicle photos
      const photos = await vehicleRepository.getVehiclePhotos(vehicleId);
      const recentJobs = await jobRepository.getByVehicleId(vehicleId);
      // Get job count and last service date from jobs table
      const jobCount = recentJobs.length;

      // Combine data
      const vehicleWithDetails: VehicleWithDetails = {
        ...vehicleData,
        clientName: vehicleWithClient.clientName,
        photos: photos,
        jobCount: jobCount,
        lastServiceDate: vehicleWithClient.lastServiceDate,
      };

      if (recentJobs) {
        const recentServiceHistory = recentJobs.slice(0, 3);
        vehicleWithDetails.recentJobs = recentServiceHistory;
      }

      setVehicle(vehicleWithDetails);
    } catch (err) {
      console.error('Error loading vehicle details:', err);
      setError('Failed to load vehicle details');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Load data on initial render
  useEffect(() => {
    loadVehicleData();
  }, [vehicleId]);

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    loadVehicleData();
  };

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';

    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (err) {
      return 'Invalid date';
    }
  };

  // Handle delete vehicle
  const handleDeleteVehicle = () => {
    Alert.alert(
      'Delete Vehicle',
      `Are you sure you want to delete this vehicle? This will also delete all associated jobs and photos.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await vehicleRepository.delete(vehicleId);
              if (success) {
                navigation.goBack();
              } else {
                Alert.alert('Error', 'Failed to delete vehicle. Please try again.');
              }
            } catch (err) {
              console.error('Error deleting vehicle:', err);
              Alert.alert('Error', 'Failed to delete vehicle. Please try again.');
            }
          },
        },
      ]
    );
  };

  // Handle edit vehicle
  const handleEditVehicle = () => {
    navigation.navigate('AddEditVehicle', { vehicleId });
  };

  // Handle adding a photo
  const handleAddPhoto = () => {
    navigation.navigate('VehiclePhotos', { vehicleId });
  };

  // Handle creating a new job
  const handleAddJob = () => {
    if (!vehicle) return;

    navigation.getParent()?.navigate('Jobs', {
      screen: 'AddEditJob',
      params: { vehicleId, clientId: vehicle.clientId },
    });
  };

  // Handle viewing client details
  const handleViewClient = () => {
    if (!vehicle) return;

    navigation.getParent()?.navigate('Clients', {
      screen: 'ClientDetails',
      params: { clientId: vehicle.clientId },
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading vehicle details...</Text>
      </View>
    );
  }

  // Error state
  if (error || !vehicle) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'Vehicle not found'}</Text>
        <Button mode="contained" onPress={handleRefresh}>
          Retry
        </Button>
      </View>
    );
  }

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return '#2196F3'; // Blue
      case 'in-progress':
        return '#FF9800'; // Orange
      case 'completed':
        return '#4CAF50'; // Green
      case 'invoiced':
        return '#9C27B0'; // Purple
      case 'paid':
        return '#009688'; // Teal
      case 'canceled':
        return '#F44336'; // Red
      default:
        return '#757575'; // Grey
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Vehicle Info Card */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.vehicleTitle}>
              {vehicle.year} {vehicle.make} {vehicle.model}
            </Title>

            <TouchableOpacity onPress={handleViewClient}>
              <Text style={styles.ownerText}>Owner: {vehicle.clientName}</Text>
            </TouchableOpacity>

            {/* Basic Info Section */}
            <Divider style={styles.divider} />
            <Text style={styles.sectionTitle}>Basic Information</Text>

            <View style={styles.infoGrid}>
              {vehicle.licensePlate && (
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>License Plate:</Text>
                  <Text style={styles.infoValue}>{vehicle.licensePlate}</Text>
                </View>
              )}

              {vehicle.vin && (
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>VIN:</Text>
                  <Text style={styles.infoValue}>{vehicle.vin}</Text>
                </View>
              )}

              {vehicle.color && (
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Color:</Text>
                  <Text style={styles.infoValue}>{vehicle.color}</Text>
                </View>
              )}

              {vehicle.mileage && (
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Mileage:</Text>
                  <Text style={styles.infoValue}>{vehicle.mileage.toLocaleString()} mi</Text>
                </View>
              )}

              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Last Service:</Text>
                <Text style={styles.infoValue}>{formatDate(vehicle.lastServiceDate)}</Text>
              </View>
            </View>

            {/* Engine Section */}
            <Divider style={styles.divider} />
            <Text style={styles.sectionTitle}>Engine Information</Text>

            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Engine Type:</Text>
                <Text style={styles.infoValue}>{vehicle.engineType}</Text>
              </View>

              {vehicle.engineDisplacement && (
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Displacement:</Text>
                  <Text style={styles.infoValue}>{vehicle.engineDisplacement}</Text>
                </View>
              )}

              {vehicle.engineHorsepower !== undefined && (
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Horsepower:</Text>
                  <Text style={styles.infoValue}>{vehicle.engineHorsepower} hp</Text>
                </View>
              )}

              {vehicle.engineFuelType && (
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Fuel Type:</Text>
                  <Text style={styles.infoValue}>{vehicle.engineFuelType}</Text>
                </View>
              )}

              {vehicle.engineCylinderCount !== undefined && (
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Cylinders:</Text>
                  <Text style={styles.infoValue}>{vehicle.engineCylinderCount}</Text>
                </View>
              )}

              {vehicle.engineTurboCharged !== undefined && (
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Turbo Charged:</Text>
                  <Text style={styles.infoValue}>{vehicle.engineTurboCharged ? 'Yes' : 'No'}</Text>
                </View>
              )}
            </View>

            {/* Transmission Section */}
            <Divider style={styles.divider} />
            <Text style={styles.sectionTitle}>Transmission Information</Text>

            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Transmission:</Text>
                <Text style={styles.infoValue}>{vehicle.transmission}</Text>
              </View>

              {vehicle.transmissionSpeeds !== undefined && (
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Speeds:</Text>
                  <Text style={styles.infoValue}>{vehicle.transmissionSpeeds}</Text>
                </View>
              )}

              {vehicle.transmissionManufacturer && (
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Manufacturer:</Text>
                  <Text style={styles.infoValue}>{vehicle.transmissionManufacturer}</Text>
                </View>
              )}

              {vehicle.transmissionFluidType && (
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Fluid Type:</Text>
                  <Text style={styles.infoValue}>{vehicle.transmissionFluidType}</Text>
                </View>
              )}
            </View>

            {/* Notes Section */}
            {vehicle.notes && (
              <>
                <Divider style={styles.divider} />
                <Text style={styles.sectionTitle}>Notes</Text>
                <Paragraph style={styles.notes}>{vehicle.notes}</Paragraph>
              </>
            )}

            {/* Action Buttons */}
            <View style={styles.actionsContainer}>
              <Button
                mode="contained"
                icon="pencil"
                style={styles.actionButton}
                onPress={handleEditVehicle}
              >
                Edit
              </Button>
              <Button
                mode="outlined"
                icon="delete"
                style={styles.actionButton}
                onPress={handleDeleteVehicle}
              >
                Delete
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* Photos Card */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <Text style={styles.sectionTitle}>Photos</Text>
              <Button mode="text" onPress={handleAddPhoto}>
                View All
              </Button>
            </View>

            {vehicle.photos.length === 0 ? (
              <View style={styles.emptyPhotosContainer}>
                <Text style={styles.emptyText}>No photos added yet</Text>
                <Button
                  mode="contained"
                  icon="camera"
                  onPress={handleAddPhoto}
                  style={styles.addButton}
                >
                  Add Photos
                </Button>
              </View>
            ) : (
              <>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.photosContainer}
                >
                  {vehicle.photos.slice(0, 5).map((photo) => (
                    <TouchableOpacity
                      key={photo.id}
                      onPress={() => navigation.navigate('VehiclePhotos', { vehicleId })}
                      style={styles.photoWrapper}
                    >
                      <Image source={{ uri: photo.photoUri }} style={styles.photo} />
                    </TouchableOpacity>
                  ))}

                  {vehicle.photos.length > 5 && (
                    <TouchableOpacity
                      onPress={() => navigation.navigate('VehiclePhotos', { vehicleId })}
                      style={styles.morePhotosButton}
                    >
                      <Text style={styles.morePhotosText}>+{vehicle.photos.length - 5}</Text>
                      <Text style={styles.morePhotosSubtext}>more</Text>
                    </TouchableOpacity>
                  )}
                </ScrollView>

                <Button
                  mode="contained"
                  icon="camera"
                  onPress={handleAddPhoto}
                  style={styles.addButton}
                >
                  Add More Photos
                </Button>
              </>
            )}
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <Text style={styles.sectionTitle}>Service History</Text>
              <Button
                mode="text"
                onPress={() => {
                  navigation
                    .getParent()
                    ?.navigate('Jobs', { screen: 'JobHistory', params: { vehicleId } });
                }}
                disabled={vehicle.jobCount === 0}
              >
                View All
              </Button>
            </View>
            {!vehicle.recentJobs || vehicle.recentJobs.length === 0 ? (
              <Paragraph style={styles.emptyText}>No service history yet</Paragraph>
            ) : (
              <>
                {vehicle.recentJobs.map((job, index) => (
                  <View key={job.id}>
                    {index > 0 && <Divider style={styles.itemDivider} />}
                    <TouchableOpacity
                      style={styles.jobItem}
                      onPress={() => {
                        navigation
                          .getParent()
                          ?.navigate('Jobs', { screen: 'JobDetails', params: { jobId: job.id } });
                      }}
                    >
                      <View style={styles.jobDetails}>
                        <Text style={styles.jobTitle}>{job.title}</Text>
                        <View style={styles.jobStatusRow}>
                          <View
                            style={[
                              styles.statusIndicator,
                              { backgroundColor: getStatusColor(job.status) },
                            ]}
                          />
                          <Text style={styles.jobSubInfo}>
                            {job.status.charAt(0).toUpperCase() +
                              job.status.slice(1).replace('-', ' ')}
                          </Text>
                          <Text style={styles.jobDate}>
                            {formatDate(job.completionDate || job.scheduledDate)}
                          </Text>
                        </View>
                        <Text style={styles.jobCost}>{formatCurrency(job.totalCost)}</Text>
                      </View>
                      <IconButton icon="chevron-right" size={24} />
                    </TouchableOpacity>
                  </View>
                ))}
                <Button
                  mode="outlined"
                  icon="wrench"
                  style={styles.addButton}
                  onPress={handleAddJob}
                >
                  New Service Record
                </Button>
              </>
            )}
          </Card.Content>
        </Card>
      </ScrollView>

      <FAB style={styles.fab} icon="wrench" label="New Job" onPress={handleAddJob} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl * 2, // Extra space for FAB
  },
  card: {
    marginBottom: spacing.md,
    ...shadows.small,
  },
  vehicleTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  ownerText: {
    fontSize: 16,
    color: '#1976D2',
    marginBottom: spacing.md,
  },
  divider: {
    marginVertical: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  infoGrid: {
    marginTop: spacing.xs,
  },
  infoItem: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  infoLabel: {
    width: 120,
    fontWeight: 'bold',
    color: '#555',
  },
  infoValue: {
    flex: 1,
  },
  notes: {
    color: '#555',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  emptyPhotosContainer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  photosContainer: {
    paddingVertical: spacing.sm,
  },
  photoWrapper: {
    marginRight: spacing.sm,
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 4,
  },
  morePhotosButton: {
    width: 120,
    height: 120,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  morePhotosText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  morePhotosSubtext: {
    fontSize: 14,
  },
  addButton: {
    marginTop: spacing.md,
  },
  emptyText: {
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: spacing.md,
  },
  fab: {
    position: 'absolute',
    margin: spacing.md,
    right: 0,
    bottom: 0,
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
    color: 'red',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  jobItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  jobDetails: {
    flex: 1,
  },
  jobTitle: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  jobStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  jobSubInfo: {
    color: '#666',
    fontSize: 14,
    marginRight: spacing.md,
  },
  jobDate: {
    color: '#666',
    fontSize: 14,
  },
  jobCost: {
    marginTop: spacing.xs,
    fontWeight: 'bold',
  },
  itemDivider: {
    marginVertical: spacing.xs,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
});

export default VehicleDetailsScreen;
