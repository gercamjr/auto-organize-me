import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import {
  Text,
  Card,
  Button,
  Divider,
  ActivityIndicator,
  Chip,
  IconButton,
  Menu,
  FAB,
} from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AppointmentsStackParamList } from '../../navigation/AppointmentsNavigator';
import { useAppointmentRepository, Appointment } from '../../hooks/useAppointmentRepository';
import { spacing, shadows } from '../../utils/theme';
import { format, parseISO, isToday, isTomorrow, addMinutes } from 'date-fns';
import * as Linking from 'expo-linking';

// Define types for the screen
type AppointmentDetailsScreenNavigationProp = StackNavigationProp<
  AppointmentsStackParamList,
  'AppointmentDetails'
>;
type AppointmentDetailsScreenRouteProp = RouteProp<
  AppointmentsStackParamList,
  'AppointmentDetails'
>;

// Appointment with client and vehicle info
interface AppointmentWithDetails extends Appointment {
  clientName: string;
  vehicleInfo: string;
}

const AppointmentDetailsScreen: React.FC = () => {
  const navigation = useNavigation<AppointmentDetailsScreenNavigationProp>();
  const route = useRoute<AppointmentDetailsScreenRouteProp>();
  const { appointmentId } = route.params;
  const appointmentRepository = useAppointmentRepository();

  const [appointment, setAppointment] = useState<AppointmentWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusMenuVisible, setStatusMenuVisible] = useState(false);

  // Load appointment data
  const loadAppointment = async () => {
    try {
      setError(null);
      setIsLoading(true);

      // Get appointment details
      const appointmentData = await appointmentRepository.getById(appointmentId);
      if (!appointmentData) {
        setError('Appointment not found');
        setIsLoading(false);
        return;
      }

      // Get client and vehicle info
      const detailedAppointment =
        await appointmentRepository.getAppointmentWithDetails(appointmentId);
      if (!detailedAppointment) {
        setError('Failed to load appointment details');
        setIsLoading(false);
        return;
      }

      // Combine data
      const appointmentWithDetails: AppointmentWithDetails = {
        ...appointmentData,
        clientName: detailedAppointment.clientName,
        vehicleInfo: detailedAppointment.vehicleInfo,
      };

      setAppointment(appointmentWithDetails);
    } catch (err) {
      console.error('Error loading appointment details:', err);
      setError('Failed to load appointment details');
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on initial render
  useEffect(() => {
    loadAppointment();
  }, [appointmentId]);

  // Format date for display
  const formatDateTime = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, 'EEEE, MMMM d, yyyy h:mm a');
    } catch (err) {
      return 'Invalid date';
    }
  };

  // Format relative date
  const formatRelativeDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);

      if (isToday(date)) {
        return 'Today';
      } else if (isTomorrow(date)) {
        return 'Tomorrow';
      } else {
        return format(date, 'EEEE, MMMM d, yyyy');
      }
    } catch (err) {
      return 'Invalid date';
    }
  };

  // Format time
  const formatTime = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, 'h:mm a');
    } catch (err) {
      return 'Invalid time';
    }
  };

  // Format end time
  const formatEndTime = (startDateString: string, durationMinutes: number) => {
    try {
      const startDate = parseISO(startDateString);
      const endDate = addMinutes(startDate, durationMinutes);
      return format(endDate, 'h:mm a');
    } catch (err) {
      return 'Invalid time';
    }
  };

  // Format duration
  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} minutes`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
      return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
    }

    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ${remainingMinutes} minutes`;
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return '#2196F3'; // Blue
      case 'confirmed':
        return '#4CAF50'; // Green
      case 'completed':
        return '#009688'; // Teal
      case 'canceled':
        return '#F44336'; // Red
      case 'no-show':
        return '#9C27B0'; // Purple
      default:
        return '#757575'; // Grey
    }
  };

  // Handle edit appointment
  const handleEditAppointment = () => {
    navigation.navigate('AddEditAppointment', { appointmentId });
  };

  // Handle delete appointment
  const handleDeleteAppointment = () => {
    if (!appointment) return;

    Alert.alert(
      'Delete Appointment',
      `Are you sure you want to delete this appointment with ${appointment.clientName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await appointmentRepository.delete(appointmentId);
              if (success) {
                navigation.goBack();
              } else {
                Alert.alert('Error', 'Failed to delete appointment. Please try again.');
              }
            } catch (err) {
              console.error('Error deleting appointment:', err);
              Alert.alert('Error', 'Failed to delete appointment. Please try again.');
            }
          },
        },
      ]
    );
  };

  // Handle status change
  const handleStatusChange = async (newStatus: string) => {
    if (!appointment) return;

    try {
      const updatedAppointment = await appointmentRepository.update(appointmentId, {
        ...appointment,
        status: newStatus as any,
      });

      setAppointment({
        ...updatedAppointment,
        clientName: appointment.clientName,
        vehicleInfo: appointment.vehicleInfo,
      });

      setStatusMenuVisible(false);
    } catch (err) {
      console.error('Error updating appointment status:', err);
      Alert.alert('Error', 'Failed to update appointment status. Please try again.');
    }
  };

  // Handle call client
  const handleCallClient = () => {
    if (!appointment) return;

    // Construct the tel URI
    const phoneNumber = appointment.clientName.split(' ')[0]; // Use client name as a placeholder
    Linking.openURL(`tel:${phoneNumber}`);
  };

  // Handle create job from appointment
  const handleCreateJob = () => {
    if (!appointment) return;

    // Navigate to add job screen with client and vehicle pre-selected
    navigation.getParent()?.navigate('Jobs', {
      screen: 'AddEditJob',
      params: {
        clientId: appointment.clientId,
        vehicleId: appointment.vehicleId,
      },
    });
  };

  // Handle navigation to client details
  const handleViewClient = () => {
    if (!appointment) return;

    navigation.getParent()?.navigate('Clients', {
      screen: 'ClientDetails',
      params: {
        clientId: appointment.clientId,
      },
    });
  };

  // Handle navigation to vehicle details
  const handleViewVehicle = () => {
    if (!appointment) return;

    navigation.getParent()?.navigate('Vehicles', {
      screen: 'VehicleDetails',
      params: {
        vehicleId: appointment.vehicleId,
      },
    });
  };

  // Handle send reminder
  const handleSendReminder = () => {
    if (!appointment) return;

    Alert.alert(
      'Send Reminder',
      'This would typically send an SMS or email reminder to the client. This feature is not implemented yet.',
      [{ text: 'OK' }]
    );
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

  // Error state
  if (error || !appointment) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'Appointment not found'}</Text>
        <Button mode="contained" onPress={loadAppointment}>
          Retry
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Status Card */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.statusHeader}>
              <Menu
                visible={statusMenuVisible}
                onDismiss={() => setStatusMenuVisible(false)}
                anchor={
                  <TouchableOpacity onPress={() => setStatusMenuVisible(true)}>
                    <View style={styles.statusChip}>
                      <View
                        style={[
                          styles.statusIndicator,
                          { backgroundColor: getStatusColor(appointment.status) },
                        ]}
                      />
                      <Text style={styles.statusText}>
                        {appointment.status.charAt(0).toUpperCase() +
                          appointment.status.slice(1).replace('-', ' ')}
                      </Text>
                      <IconButton icon="chevron-down" size={20} />
                    </View>
                  </TouchableOpacity>
                }
              >
                <Menu.Item
                  onPress={() => handleStatusChange('scheduled')}
                  title="Scheduled"
                  leadingIcon="calendar"
                />
                <Menu.Item
                  onPress={() => handleStatusChange('confirmed')}
                  title="Confirmed"
                  leadingIcon="check"
                />
                <Menu.Item
                  onPress={() => handleStatusChange('completed')}
                  title="Completed"
                  leadingIcon="check-all"
                />
                <Menu.Item
                  onPress={() => handleStatusChange('canceled')}
                  title="Canceled"
                  leadingIcon="close"
                />
                <Menu.Item
                  onPress={() => handleStatusChange('no-show')}
                  title="No Show"
                  leadingIcon="account-off"
                />
              </Menu>

              <View style={styles.dateDisplay}>
                <Text style={styles.relativeDate}>
                  {formatRelativeDate(appointment.scheduledDate)}
                </Text>
                <Text style={styles.dateTime}>
                  {formatTime(appointment.scheduledDate)} -{' '}
                  {formatEndTime(appointment.scheduledDate, appointment.duration)}
                </Text>
              </View>
            </View>

            <View style={styles.durationContainer}>
              <Text style={styles.durationLabel}>Duration:</Text>
              <Text style={styles.durationValue}>{formatDuration(appointment.duration)}</Text>
            </View>

            {appointment.isHomeVisit && (
              <Chip icon="home" style={styles.homeVisitChip}>
                Home Visit
              </Chip>
            )}
          </Card.Content>
        </Card>

        {/* Client and Vehicle Info Card */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Client & Vehicle</Text>
              <View style={styles.sectionActions}>
                <IconButton
                  icon="phone"
                  size={20}
                  mode="contained-tonal"
                  onPress={handleCallClient}
                  containerColor="#E3F2FD"
                />
                <IconButton
                  icon="message-text"
                  size={20}
                  mode="contained-tonal"
                  onPress={handleSendReminder}
                  containerColor="#E3F2FD"
                />
              </View>
            </View>

            <TouchableOpacity onPress={handleViewClient} style={styles.touchableSection}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Client:</Text>
                <Text style={styles.infoValue}>{appointment.clientName}</Text>
                <IconButton icon="chevron-right" size={20} />
              </View>
            </TouchableOpacity>

            <Divider style={styles.divider} />

            <TouchableOpacity onPress={handleViewVehicle} style={styles.touchableSection}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Vehicle:</Text>
                <Text style={styles.infoValue}>{appointment.vehicleInfo}</Text>
                <IconButton icon="chevron-right" size={20} />
              </View>
            </TouchableOpacity>
          </Card.Content>
        </Card>

        {/* Location Card */}
        {appointment.isHomeVisit && appointment.locationAddress && (
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Location</Text>

              <View style={styles.locationContainer}>
                <Text style={styles.address}>{appointment.locationAddress}</Text>

                {appointment.locationNotes && (
                  <View style={styles.notesContainer}>
                    <Text style={styles.notesLabel}>Notes:</Text>
                    <Text style={styles.notesText}>{appointment.locationNotes}</Text>
                  </View>
                )}

                <Button
                  mode="contained-tonal"
                  icon="map"
                  style={styles.mapButton}
                  onPress={() => {
                    if (appointment.locationAddress) {
                      Linking.openURL(
                        `https://maps.google.com/?q=${encodeURIComponent(appointment.locationAddress)}`
                      );
                    }
                  }}
                >
                  Open in Maps
                </Button>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Notes Card */}
        {appointment.notes && (
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Notes</Text>
              <Text style={styles.notesText}>{appointment.notes}</Text>
            </Card.Content>
          </Card>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <Button
            mode="contained"
            icon="calendar-edit"
            style={styles.actionButton}
            onPress={handleEditAppointment}
          >
            Edit
          </Button>
          <Button
            mode="outlined"
            icon="delete"
            style={styles.actionButton}
            onPress={handleDeleteAppointment}
          >
            Delete
          </Button>
        </View>
      </ScrollView>

      {/* FAB for creating a job */}
      <FAB style={styles.fab} icon="wrench" label="Create Job" onPress={handleCreateJob} />
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
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  dateDisplay: {
    alignItems: 'flex-end',
  },
  relativeDate: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976D2',
  },
  dateTime: {
    fontSize: 16,
    color: '#666',
  },
  durationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  durationLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: spacing.sm,
  },
  durationValue: {
    fontSize: 16,
  },
  homeVisitChip: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionActions: {
    flexDirection: 'row',
  },
  touchableSection: {
    marginVertical: spacing.xs,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoLabel: {
    width: 70,
    fontWeight: 'bold',
  },
  infoValue: {
    flex: 1,
    fontSize: 16,
  },
  divider: {
    marginVertical: spacing.sm,
  },
  locationContainer: {
    marginTop: spacing.sm,
  },
  address: {
    fontSize: 16,
    marginBottom: spacing.sm,
  },
  notesContainer: {
    marginVertical: spacing.sm,
  },
  notesLabel: {
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  notesText: {
    fontSize: 16,
    color: '#555',
  },
  mapButton: {
    marginTop: spacing.md,
    alignSelf: 'flex-start',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: spacing.md,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: spacing.xs,
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
});

export default AppointmentDetailsScreen;
