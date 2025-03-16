import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import {
  Text,
  Searchbar,
  FAB,
  Card,
  Divider,
  ActivityIndicator,
  Chip,
  IconButton,
  Button,
  SegmentedButtons,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AppointmentsStackParamList } from '../../navigation/AppointmentsNavigator';
import {
  useAppointmentRepository,
  AppointmentListItem,
} from '../../hooks/useAppointmentRepository';
import { spacing, shadows } from '../../utils/theme';
import { format, isToday, isTomorrow, addDays, isAfter, isBefore, parseISO } from 'date-fns';

// Define the navigation prop type
type AppointmentListScreenNavigationProp = StackNavigationProp<
  AppointmentsStackParamList,
  'AppointmentList'
>;

// Filter type
type FilterType = 'all' | 'today' | 'upcoming' | 'past';

const AppointmentListScreen: React.FC = () => {
  const navigation = useNavigation<AppointmentListScreenNavigationProp>();
  const appointmentRepository = useAppointmentRepository();

  const [appointments, setAppointments] = useState<AppointmentListItem[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<AppointmentListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterValue, setFilterValue] = useState<FilterType>('upcoming');

  // Load appointments from database
  const loadAppointments = async () => {
    try {
      setError(null);

      const result = await appointmentRepository.getAll();
      setAppointments(result);

      // Apply initial filter
      applyFilter(result, filterValue);
    } catch (err) {
      console.error('Error loading appointments:', err);
      setError('Failed to load appointments. Please try again.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Initial data loading
  useEffect(() => {
    loadAppointments();
  }, []);

  // Filter appointments based on type
  const applyFilter = (appointmentList: AppointmentListItem[], filter: FilterType) => {
    const now = new Date();
    let filtered: AppointmentListItem[];

    switch (filter) {
      case 'today':
        filtered = appointmentList.filter((appointment) =>
          isToday(parseISO(appointment.scheduledDate))
        );
        break;
      case 'upcoming':
        filtered = appointmentList.filter(
          (appointment) =>
            isAfter(parseISO(appointment.scheduledDate), now) &&
            appointment.status !== 'canceled' &&
            appointment.status !== 'no-show'
        );
        break;
      case 'past':
        filtered = appointmentList.filter(
          (appointment) =>
            isBefore(parseISO(appointment.scheduledDate), now) ||
            appointment.status === 'completed' ||
            appointment.status === 'canceled' ||
            appointment.status === 'no-show'
        );
        break;
      case 'all':
      default:
        filtered = [...appointmentList];
        break;
    }

    // Then apply search if there's a query
    if (searchQuery.trim()) {
      const lowercaseQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (appointment) =>
          appointment.clientName.toLowerCase().includes(lowercaseQuery) ||
          appointment.vehicleInfo.toLowerCase().includes(lowercaseQuery)
      );
    }

    // Sort by scheduled date
    filtered.sort((a, b) => {
      const dateA = new Date(a.scheduledDate);
      const dateB = new Date(b.scheduledDate);
      return dateA.getTime() - dateB.getTime();
    });

    setFilteredAppointments(filtered);
  };

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    applyFilter(appointments, filterValue);
  };

  // Handle filter change
  const handleFilterChange = (value: FilterType) => {
    setFilterValue(value);
    applyFilter(appointments, value);
  };

  // Handle pull-to-refresh
  const handleRefresh = () => {
    setRefreshing(true);
    loadAppointments();
  };

  // Navigate to appointment details
  const handleAppointmentPress = (appointmentId: string) => {
    navigation.navigate('AppointmentDetails', { appointmentId });
  };

  // Handle delete appointment
  const handleDeleteAppointment = (appointmentId: string, clientName: string) => {
    Alert.alert(
      'Delete Appointment',
      `Are you sure you want to delete the appointment with ${clientName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await appointmentRepository.delete(appointmentId);
              if (success) {
                // Remove from state
                const updatedAppointments = appointments.filter((a) => a.id !== appointmentId);
                setAppointments(updatedAppointments);
                applyFilter(updatedAppointments, filterValue);
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

  // Format date and time for display
  const formatDateTime = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      return format(date, 'MMM d, yyyy h:mm a');
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
        return format(date, 'MMM d, yyyy');
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

  // Format duration
  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
      return `${hours} hr`;
    }

    return `${hours} hr ${remainingMinutes} min`;
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

  // Render each appointment item
  const renderItem = ({ item }: { item: AppointmentListItem }) => {
    const isHomeVisitIcon = item.isHomeVisit ? 'home' : 'store';

    return (
      <TouchableOpacity onPress={() => handleAppointmentPress(item.id)}>
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <View style={styles.appointmentInfo}>
                <Text variant="titleMedium" style={styles.clientName}>
                  {item.clientName}
                </Text>
                <Text variant="bodyMedium" style={styles.vehicleInfo}>
                  {item.vehicleInfo}
                </Text>
              </View>

              <View style={styles.dateTimeContainer}>
                <Text style={styles.dateText}>{formatRelativeDate(item.scheduledDate)}</Text>
                <Text style={styles.timeText}>{formatTime(item.scheduledDate)}</Text>
              </View>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.detailsRow}>
              <View style={styles.statusContainer}>
                <View
                  style={[styles.statusIndicator, { backgroundColor: getStatusColor(item.status) }]}
                />
                <Text style={styles.statusText}>{item.status.replace('-', ' ')}</Text>
              </View>

              <Chip icon={isHomeVisitIcon} style={styles.chip}>
                {item.isHomeVisit ? 'Home Visit' : 'In Shop'}
              </Chip>

              <Text style={styles.durationText}>{formatDuration(item.duration)}</Text>
            </View>

            <View style={styles.actionsRow}>
              <Button
                mode="text"
                icon="pencil"
                onPress={() =>
                  navigation.navigate('AddEditAppointment', { appointmentId: item.id })
                }
                compact
              >
                Edit
              </Button>

              <Button
                mode="text"
                icon="delete"
                textColor="#F44336"
                onPress={() => handleDeleteAppointment(item.id, item.clientName)}
                compact
              >
                Delete
              </Button>
            </View>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  };

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text variant="titleLarge">No Appointments Found</Text>
      <Text variant="bodyMedium" style={styles.emptyText}>
        {searchQuery
          ? 'Try different search terms'
          : 'Schedule your first appointment to get started'}
      </Text>
    </View>
  );

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading appointments...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text variant="titleMedium" style={styles.errorText}>
          {error}
        </Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            setError(null);
            setIsLoading(true);
            loadAppointments();
          }}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Main content
  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Search appointments..."
        onChangeText={handleSearch}
        value={searchQuery}
        style={styles.searchBar}
      />

      <SegmentedButtons
        value={filterValue}
        onValueChange={(value) => handleFilterChange(value as FilterType)}
        buttons={[
          { value: 'today', label: 'Today' },
          { value: 'upcoming', label: 'Upcoming' },
          { value: 'past', label: 'Past' },
          { value: 'all', label: 'All' },
        ]}
        style={styles.filterButtons}
      />

      <FlatList
        data={filteredAppointments}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      />

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => navigation.navigate('AddEditAppointment', {})}
      />
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchBar: {
    margin: spacing.md,
    elevation: 2,
  },
  filterButtons: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  listContent: {
    flexGrow: 1,
    padding: spacing.md,
    paddingBottom: spacing.md * 2 + 56, // Extra space for FAB
  },
  card: {
    marginBottom: spacing.md,
    ...shadows.small,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  appointmentInfo: {
    flex: 1,
  },
  clientName: {
    fontWeight: 'bold',
  },
  vehicleInfo: {
    color: '#666',
  },
  dateTimeContainer: {
    alignItems: 'flex-end',
  },
  dateText: {
    fontWeight: 'bold',
    color: '#1976D2',
  },
  timeText: {
    color: '#666',
  },
  divider: {
    marginVertical: spacing.sm,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 5,
  },
  statusText: {
    fontSize: 12,
    textTransform: 'capitalize',
  },
  chip: {
    height: 26,
  },
  durationText: {
    fontSize: 12,
    color: '#666',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
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
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  retryButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 4,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: spacing.xl,
  },
  emptyText: {
    marginTop: spacing.sm,
    textAlign: 'center',
    color: '#757575',
    paddingHorizontal: spacing.lg,
  },
});

export default AppointmentListScreen;
