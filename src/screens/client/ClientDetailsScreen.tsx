import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
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
} from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ClientsStackParamList } from '../../navigation/ClientsNavigator';
import { spacing, shadows } from '../../utils/theme';
import { format } from 'date-fns';
import { useClientRepository } from '@/hooks/useClientRepository';
import { useJobRepository } from '@/hooks/useJobRepository';
import { useAppointmentRepository } from '@/hooks/useAppointmentRepository';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

// Define types for the screen
type ClientDetailsScreenNavigationProp = StackNavigationProp<
  ClientsStackParamList,
  'ClientDetails'
>;
type ClientDetailsScreenRouteProp = RouteProp<ClientsStackParamList, 'ClientDetails'>;

// Interface for client data with vehicles
interface ClientWithVehicles {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email?: string;
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  vehicles: VehicleSummary[];
  jobCount: number;
  appointmentCount: number;
}

// Interface for vehicle summary data
interface VehicleSummary {
  id: string;
  make: string;
  model: string;
  year: number;
  licensePlate?: string;
  lastService?: string;
}

// Interface for job summary data
interface JobSummary {
  id: string;
  title: string;
  status: string;
  scheduledDate?: string;
  totalCost: number;
  vehicleSummary?: string; // Add vehicle summary
}

// Interface for appointment summary data
interface AppointmentSummary {
  id: string;
  scheduledDate: string;
  duration: number;
  status: string;
}

const ClientDetailsScreen: React.FC = () => {
  const clientRepository = useClientRepository();
  const jobRepository = useJobRepository();
  const appointmentRepository = useAppointmentRepository();
  const navigation = useNavigation<ClientDetailsScreenNavigationProp>();
  const route = useRoute<ClientDetailsScreenRouteProp>();
  const { clientId } = route.params;

  const [client, setClient] = useState<ClientWithVehicles | null>(null);
  const [recentJobs, setRecentJobs] = useState<JobSummary[]>([]);
  const [appointments, setAppointments] = useState<AppointmentSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load client data
  const loadClientData = async () => {
    try {
      setError(null);

      // Get client details
      const clientData = await clientRepository.getById(clientId);

      if (!clientData) {
        setError('Client not found');
        setIsLoading(false);
        setRefreshing(false);
        return;
      }

      // Get client's vehicles
      const vehicleData = await clientRepository.getClientVehicles(clientId);

      // Get job count
      const jobCount = await clientRepository.getClientJobCount(clientId);

      // Get appointment count
      const appointmentCount = await clientRepository.getClientAppointmentCount(clientId);

      // Get recent jobs
      const jobs = await jobRepository.getByClientId(clientId);
      const jobSummaries = jobs
        .slice(0, 3) // Limit to the three most recent jobs
        .map((job) => ({
          id: job.id,
          title: job.title,
          status: job.status,
          scheduledDate: job.scheduledDate,
          totalCost: job.totalCost,
          vehicleSummary: job.vehicleInfo,
        }));
      setRecentJobs(jobSummaries);

      // Get appointments
      const appointmentData = await appointmentRepository.getByClientId(clientId);
      const appointmentSummaries = appointmentData.map((appointment) => ({
        id: appointment.id,
        scheduledDate: appointment.scheduledDate,
        duration: appointment.duration,
        status: appointment.status,
      }));
      setAppointments(appointmentSummaries);

      // Combine data
      const clientWithDetails: ClientWithVehicles = {
        ...clientData,
        vehicles: vehicleData,
        jobCount,
        appointmentCount,
      };

      setClient(clientWithDetails);
    } catch (err) {
      console.error('Error loading client details:', err);
      setError('Failed to load client details');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadClientData();
    }, [])
  );
  // // Load data on initial render
  // useEffect(() => {
  //   loadClientData();
  // }, [clientId]);

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    loadClientData();
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (err) {
      console.error('Error formatting date:', err);
      return 'Unknown';
    }
  };

  // Handle delete client
  const handleDeleteClient = () => {
    Alert.alert(
      'Delete Client',
      `Are you sure you want to delete ${client?.firstName} ${client?.lastName}? This will also delete all associated vehicles, jobs, and appointments.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await clientRepository.delete(clientId);
              navigation.goBack();
            } catch (err) {
              console.error('Error deleting client:', err);
              Alert.alert('Error', 'Failed to delete client. Please try again.');
            }
          },
        },
      ]
    );
  };

  // Handle edit client
  const handleEditClient = () => {
    navigation.navigate('AddEditClient', { clientId });
  };

  // Handle view vehicles
  const handleViewVehicles = () => {
    navigation.navigate('ClientVehicles', { clientId });
  };

  // Handle add vehicle
  const handleAddVehicle = () => {
    navigation.getParent()?.navigate('Vehicles', {
      screen: 'AddEditVehicle',
      params: { clientId },
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading client details...</Text>
      </View>
    );
  }

  // Error state
  if (error || !client) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'Client not found'}</Text>
        <Button mode="contained" onPress={handleRefresh}>
          Retry
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {/* Client Info Card */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.name}>{`${client.firstName} ${client.lastName}`}</Title>

            <View style={styles.detailsContainer}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Phone:</Text>
                <TouchableOpacity>
                  <Text style={styles.detailValue}>{client.phoneNumber}</Text>
                </TouchableOpacity>
              </View>

              {client.email && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Email:</Text>
                  <TouchableOpacity>
                    <Text style={styles.detailValue}>{client.email}</Text>
                  </TouchableOpacity>
                </View>
              )}

              {(client.street || client.city || client.state) && (
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Address:</Text>
                  <View>
                    {client.street && <Text style={styles.detailValue}>{client.street}</Text>}
                    {(client.city || client.state || client.zipCode) && (
                      <Text style={styles.detailValue}>
                        {[client.city, client.state, client.zipCode].filter(Boolean).join(', ')}
                      </Text>
                    )}
                  </View>
                </View>
              )}

              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Customer since:</Text>
                <Text style={styles.detailValue}>{formatDate(client.createdAt)}</Text>
              </View>
            </View>

            {client.notes && (
              <>
                <Divider style={styles.divider} />
                <Text style={styles.sectionTitle}>Notes</Text>
                <Paragraph style={styles.notes}>{client.notes}</Paragraph>
              </>
            )}

            <View style={styles.actionsContainer}>
              <Button
                mode="contained"
                icon="pencil"
                style={styles.actionButton}
                onPress={handleEditClient}
              >
                Edit
              </Button>
              <Button
                mode="outlined"
                icon="delete"
                style={styles.actionButton}
                onPress={handleDeleteClient}
              >
                Delete
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* Stats Card */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Summary</Title>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{client.vehicles.length}</Text>
                <Text style={styles.statLabel}>Vehicles</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{client.jobCount}</Text>
                <Text style={styles.statLabel}>Jobs</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{client.appointmentCount}</Text>
                <Text style={styles.statLabel}>Appointments</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Vehicles Card */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Title style={styles.sectionTitle}>Vehicles</Title>
              <Button
                mode="text"
                onPress={handleViewVehicles}
                disabled={client.vehicles.length === 0}
              >
                View All
              </Button>
            </View>

            {client.vehicles.length === 0 ? (
              <Paragraph style={styles.emptyText}>No vehicles added yet</Paragraph>
            ) : (
              <>
                {client.vehicles.slice(0, 3).map((vehicle, index) => (
                  <View key={vehicle.id}>
                    {index > 0 && <Divider style={styles.itemDivider} />}
                    <TouchableOpacity
                      style={styles.vehicleItem}
                      onPress={() => {
                        navigation.getParent()?.navigate('Vehicles', {
                          screen: 'VehicleDetails',
                          params: { vehicleId: vehicle.id },
                        });
                      }}
                    >
                      <View style={styles.vehicleDetails}>
                        <Text style={styles.vehicleName}>
                          {vehicle.year} {vehicle.make} {vehicle.model}
                        </Text>
                        {vehicle.licensePlate && (
                          <Text style={styles.vehicleSubInfo}>License: {vehicle.licensePlate}</Text>
                        )}
                        {vehicle.lastService && (
                          <Text style={styles.vehicleSubInfo}>
                            Last Service: {formatDate(vehicle.lastService)}
                          </Text>
                        )}
                      </View>
                      <IconButton icon="chevron-right" size={24} />
                    </TouchableOpacity>
                  </View>
                ))}

                {client.vehicles.length > 3 && (
                  <Button mode="text" onPress={handleViewVehicles} style={styles.viewAllButton}>
                    Show All {client.vehicles.length} Vehicles
                  </Button>
                )}
              </>
            )}

            <Button mode="contained" icon="car" style={styles.addButton} onPress={handleAddVehicle}>
              Add Vehicle
            </Button>
          </Card.Content>
        </Card>

        {/* Recent Jobs Card */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Title style={styles.sectionTitle}>Recent Jobs</Title>
              <Button
                mode="text"
                onPress={() =>
                  navigation
                    .getParent()
                    ?.navigate('Jobs', { screen: 'JobList', params: { clientId } })
                }
                disabled={recentJobs.length === 0}
              >
                View All
              </Button>
            </View>

            {recentJobs.length === 0 ? (
              <Paragraph style={styles.emptyText}>No jobs recorded yet</Paragraph>
            ) : (
              <>
                {recentJobs.map((job, index) => (
                  <View key={job.id}>
                    {index > 0 && <Divider style={styles.itemDivider} />}
                    <TouchableOpacity
                      style={styles.jobItem}
                      onPress={() =>
                        navigation.getParent()?.navigate('Jobs', {
                          screen: 'JobDetails',
                          params: { jobId: job.id },
                        })
                      }
                    >
                      <View style={styles.jobDetails}>
                        <Text style={styles.jobTitle}>{job.title}</Text>
                        <Text style={styles.jobDate}>{formatDate(job.scheduledDate || '')}</Text>
                        <Text style={styles.jobStatus}>Status: {job.status}</Text>
                        <Text style={styles.jobCost}>Cost: ${job.totalCost.toFixed(2)}</Text>
                        {job.vehicleSummary && (
                          <Text style={styles.jobVehicleSummary}>{job.vehicleSummary}</Text>
                        )}
                      </View>
                      <IconButton icon="chevron-right" size={24} />
                    </TouchableOpacity>
                  </View>
                ))}

                {recentJobs.length > 3 && (
                  <Button
                    mode="text"
                    onPress={() =>
                      navigation.getParent()?.navigate('Jobs', {
                        screen: 'JobList',
                        params: { clientId },
                      })
                    }
                  >
                    Show All {recentJobs.length} Jobs
                  </Button>
                )}
              </>
            )}

            <Button
              mode="contained"
              icon="wrench"
              style={styles.addButton}
              onPress={() =>
                navigation.getParent()?.navigate('Jobs', {
                  screen: 'AddEditJob',
                  params: { clientId },
                })
              }
            >
              Add Job
            </Button>
          </Card.Content>
        </Card>

        {/* Upcoming Appointments Card */}
        <Card style={[styles.card, styles.lastCard]}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Title style={styles.sectionTitle}>Upcoming Appointments</Title>
              <Button
                mode="text"
                onPress={() =>
                  navigation.getParent()?.navigate('Appointments', {
                    screen: 'AppointmentList',
                    params: { clientId },
                  })
                }
                disabled={appointments.length === 0}
              >
                View All
              </Button>
            </View>

            {appointments.length === 0 ? (
              <Paragraph style={styles.emptyText}>No appointments scheduled</Paragraph>
            ) : (
              <>
                {appointments.slice(0, 3).map((appointment, index) => (
                  <View key={appointment.id}>
                    {index > 0 && <Divider style={styles.itemDivider} />}
                    <TouchableOpacity
                      style={styles.appointmentItem}
                      onPress={() =>
                        navigation.getParent()?.navigate('Appointments', {
                          screen: 'AppointmentDetails',
                          params: { appointmentId: appointment.id },
                        })
                      }
                    >
                      <View style={styles.appointmentDetails}>
                        <Text style={styles.appointmentDate}>
                          {formatDate(appointment.scheduledDate)}
                        </Text>
                        <Text style={styles.appointmentStatus}>Status: {appointment.status}</Text>
                        <Text style={styles.appointmentDuration}>
                          Duration: {appointment.duration} mins
                        </Text>
                      </View>
                      <IconButton icon="chevron-right" size={24} />
                    </TouchableOpacity>
                  </View>
                ))}

                {appointments.length > 3 && (
                  <Button
                    mode="text"
                    onPress={() =>
                      navigation.getParent()?.navigate('Appointments', {
                        screen: 'AppointmentList',
                        params: { clientId },
                      })
                    }
                  >
                    Show All {appointments.length} Appointments
                  </Button>
                )}
              </>
            )}

            <Button
              mode="contained"
              icon="calendar-plus"
              style={styles.addButton}
              onPress={() =>
                navigation.getParent()?.navigate('Appointments', {
                  screen: 'AddEditAppointment',
                  params: { clientId },
                })
              }
            >
              Schedule Appointment
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>

      <FAB
        style={styles.fab}
        icon="phone"
        onPress={() => {
          // Handle calling client
        }}
      />
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
    paddingBottom: spacing.xl * 2,
  },
  card: {
    marginBottom: spacing.md,
    ...shadows.small,
  },
  lastCard: {
    marginBottom: 0,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  detailsContainer: {
    marginBottom: spacing.md,
  },
  detailItem: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  detailLabel: {
    width: 120,
    fontWeight: 'bold',
    color: '#555',
  },
  detailValue: {
    flex: 1,
  },
  divider: {
    marginVertical: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  notes: {
    color: '#555',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: spacing.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#666',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  vehicleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  vehicleDetails: {
    flex: 1,
  },
  vehicleName: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  vehicleSubInfo: {
    color: '#666',
    fontSize: 14,
  },
  itemDivider: {
    marginVertical: spacing.xs,
  },
  viewAllButton: {
    marginTop: spacing.sm,
  },
  addButton: {
    marginTop: spacing.md,
  },
  emptyText: {
    fontStyle: 'italic',
    color: '#666',
    textAlign: 'center',
    marginVertical: spacing.md,
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
  fab: {
    position: 'absolute',
    margin: spacing.md,
    right: 0,
    bottom: 0,
    backgroundColor: '#4CAF50',
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
  jobDate: {
    color: '#666',
    fontSize: 14,
  },
  jobStatus: {
    color: '#666',
    fontSize: 14,
  },
  jobCost: {
    color: '#666',
    fontSize: 14,
  },
  jobVehicleSummary: {
    color: '#666',
    fontSize: 14,
    fontStyle: 'italic',
  },
  appointmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  appointmentDetails: {
    flex: 1,
  },
  appointmentDate: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  appointmentStatus: {
    color: '#666',
    fontSize: 14,
  },
  appointmentDuration: {
    color: '#666',
    fontSize: 14,
  },
});

export default ClientDetailsScreen;
