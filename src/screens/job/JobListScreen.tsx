import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Image } from 'react-native';
import { Text, Searchbar, FAB, Divider, ActivityIndicator, Card } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { JobsStackParamList } from '../../navigation/JobsNavigator';
import { useJobRepository, JobListItem } from '../../hooks/useJobRepository';
import { spacing, shadows } from '../../utils/theme';
import { format } from 'date-fns';

// Define the navigation prop type
type JobListScreenNavigationProp = StackNavigationProp<JobsStackParamList, 'JobList'>;

const JobListScreen: React.FC = () => {
  const navigation = useNavigation<JobListScreenNavigationProp>();
  const jobRepository = useJobRepository();

  const [jobs, setJobs] = useState<JobListItem[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<JobListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load jobs from database
  const loadJobs = async () => {
    try {
      setError(null);

      const result = await jobRepository.getAll();

      setJobs(result);
      setFilteredJobs(result);
    } catch (err) {
      console.error('Error loading jobs:', err);
      setError('Failed to load jobs. Please try again.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Initial data loading
  useEffect(() => {
    loadJobs();
  }, []);

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);

    if (!query.trim()) {
      setFilteredJobs(jobs);
      return;
    }

    const lowercaseQuery = query.toLowerCase();
    const filtered = jobs.filter(
      (job) =>
        job.title.toLowerCase().includes(lowercaseQuery) ||
        job.clientName.toLowerCase().includes(lowercaseQuery) ||
        job.vehicleInfo.toLowerCase().includes(lowercaseQuery)
    );

    setFilteredJobs(filtered);
  };

  // Handle pull-to-refresh
  const handleRefresh = () => {
    setRefreshing(true);
    loadJobs();
  };

  // Navigate to job details
  const handleJobPress = (jobId: string) => {
    navigation.navigate('JobDetails', { jobId });
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

  // Render each job item
  const renderItem = ({ item }: { item: JobListItem }) => {
    return (
      <TouchableOpacity onPress={() => handleJobPress(item.id)}>
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <View style={styles.jobInfo}>
                <Text variant="titleMedium" style={styles.jobTitle}>
                  {item.title}
                </Text>
                <Text variant="bodyMedium" style={styles.clientName}>
                  Client: {item.clientName}
                </Text>
                <Text variant="bodyMedium" style={styles.vehicleInfo}>
                  Vehicle: {item.vehicleInfo}
                </Text>
              </View>

              {item.photoUri && <Image source={{ uri: item.photoUri }} style={styles.jobImage} />}
            </View>

            <Divider style={styles.divider} />

            <View style={styles.detailsRow}>
              <View style={styles.statusContainer}>
                <View
                  style={[styles.statusIndicator, { backgroundColor: getStatusColor(item.status) }]}
                />
                <Text style={styles.statusText}>{item.status.replace('-', ' ')}</Text>
              </View>

              <Text style={styles.dateText}>
                {item.scheduledDate ? formatDate(item.scheduledDate) : 'Not scheduled'}
              </Text>

              <Text style={styles.costText}>{formatCurrency(item.totalCost)}</Text>
            </View>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  };

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text variant="titleLarge">No Jobs Found</Text>
      <Text variant="bodyMedium" style={styles.emptyText}>
        {searchQuery ? 'Try different search terms' : 'Add your first job to get started'}
      </Text>
    </View>
  );

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading jobs...</Text>
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
            loadJobs();
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
        placeholder="Search jobs..."
        onChangeText={handleSearch}
        value={searchQuery}
        style={styles.searchBar}
      />

      <FlatList
        data={filteredJobs}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      />

      <FAB style={styles.fab} icon="plus" onPress={() => navigation.navigate('AddEditJob', {})} />
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
    alignItems: 'center',
  },
  jobInfo: {
    flex: 1,
  },
  jobTitle: {
    fontWeight: 'bold',
  },
  clientName: {
    color: '#666',
  },
  vehicleInfo: {
    color: '#666',
  },
  jobImage: {
    width: 60,
    height: 60,
    borderRadius: 4,
    marginLeft: spacing.md,
  },
  divider: {
    marginVertical: spacing.md,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  dateText: {
    fontSize: 12,
    color: '#666',
  },
  costText: {
    fontSize: 14,
    fontWeight: 'bold',
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

export default JobListScreen;
