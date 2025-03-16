// src/screens/job/JobHistoryScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import {
  Text,
  Card,
  Button,
  Divider,
  ActivityIndicator,
  IconButton,
  FAB,
  Chip,
} from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { JobsStackParamList } from '../../navigation/JobsNavigator';
import { useJobRepository, JobListItem } from '../../hooks/useJobRepository';
import { useVehicleRepository } from '../../hooks/useVehicleRepository';
import { spacing, shadows } from '../../utils/theme';
import { format } from 'date-fns';

// Define types for the screen
type JobHistoryScreenNavigationProp = StackNavigationProp<JobsStackParamList, 'JobHistory'>;
type JobHistoryScreenRouteProp = RouteProp<JobsStackParamList, 'JobHistory'>;

const JobHistoryScreen: React.FC = () => {
  const jobRepository = useJobRepository();
  const vehicleRepository = useVehicleRepository();
  const navigation = useNavigation<JobHistoryScreenNavigationProp>();
  const route = useRoute<JobHistoryScreenRouteProp>();
  const { vehicleId } = route.params;

  const [jobs, setJobs] = useState<JobListItem[]>([]);
  const [vehicleInfo, setVehicleInfo] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load jobs data
  const loadJobs = async () => {
    try {
      setError(null);

      // Get vehicle info
      const vehicle = await vehicleRepository.getVehicleWithClient(vehicleId);
      if (vehicle) {
        setVehicleInfo(`${vehicle.year} ${vehicle.make} ${vehicle.model}`);
      }

      // Get all jobs for this vehicle
      const vehicleJobs = await jobRepository.getByVehicleId(vehicleId);
      setJobs(vehicleJobs);
    } catch (err) {
      console.error('Error loading job history:', err);
      setError('Failed to load service history');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Load data on initial render
  useEffect(() => {
    loadJobs();
  }, [vehicleId]);

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    loadJobs();
  };

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not scheduled';

    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (err) {
      return 'Invalid date';
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

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

  // Render each job item
  const renderItem = ({ item }: { item: JobListItem }) => (
    <TouchableOpacity onPress={() => navigation.navigate('JobDetails', { jobId: item.id })}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.jobHeader}>
            <View style={styles.jobInfo}>
              <Text style={styles.jobTitle}>{item.title}</Text>
              <View style={styles.statusContainer}>
                <View
                  style={[styles.statusIndicator, { backgroundColor: getStatusColor(item.status) }]}
                />
                <Text style={styles.statusText}>{item.status.replace('-', ' ')}</Text>
              </View>
            </View>
            <Text style={styles.costText}>{formatCurrency(item.totalCost)}</Text>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.dateRow}>
            {item.completionDate ? (
              <Text style={styles.dateText}>Completed: {formatDate(item.completionDate)}</Text>
            ) : item.scheduledDate ? (
              <Text style={styles.dateText}>Scheduled: {formatDate(item.scheduledDate)}</Text>
            ) : (
              <Text style={styles.dateText}>No date specified</Text>
            )}
            <IconButton
              icon="chevron-right"
              size={20}
              onPress={() => navigation.navigate('JobDetails', { jobId: item.id })}
            />
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading service history...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with vehicle info */}
      <Card style={styles.headerCard}>
        <Card.Content>
          <Text style={styles.headerTitle}>Service History</Text>
          <Text style={styles.vehicleInfo}>{vehicleInfo}</Text>
        </Card.Content>
      </Card>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Button mode="contained" onPress={handleRefresh}>
            Retry
          </Button>
        </View>
      )}

      <FlatList
        data={jobs}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No service history for this vehicle</Text>
            <Button
              mode="contained"
              onPress={() => {
                navigation.navigate('AddEditJob', { vehicleId });
              }}
              style={styles.emptyButton}
            >
              Add Service Record
            </Button>
          </View>
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      />

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => navigation.navigate('AddEditJob', { vehicleId })}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerCard: {
    margin: spacing.md,
    ...shadows.small,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  vehicleInfo: {
    color: '#666',
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.md * 2 + 56, // Extra space for FAB
  },
  card: {
    marginBottom: spacing.md,
    ...shadows.small,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  jobInfo: {
    flex: 1,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
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
    fontSize: 14,
    textTransform: 'capitalize',
  },
  costText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  divider: {
    marginVertical: spacing.sm,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 14,
    color: '#666',
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
    margin: spacing.md,
    padding: spacing.md,
    backgroundColor: '#ffebee',
    borderRadius: 4,
    alignItems: 'center',
  },
  errorText: {
    color: '#d32f2f',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyButton: {
    marginTop: spacing.md,
  },
});

export default JobHistoryScreen;
