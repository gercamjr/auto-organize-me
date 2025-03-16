import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import {
  Text,
  Card,
  Title,
  Paragraph,
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
import { useJobRepository, LaborEntry } from '../../hooks/useJobRepository';
import { spacing, shadows } from '../../utils/theme';
import { format } from 'date-fns';

// Define types for the screen
type JobLaborScreenNavigationProp = StackNavigationProp<JobsStackParamList, 'JobLabor'>;
type JobLaborScreenRouteProp = RouteProp<JobsStackParamList, 'JobLabor'>;

const JobLaborScreen: React.FC = () => {
  const jobRepository = useJobRepository();
  const navigation = useNavigation<JobLaborScreenNavigationProp>();
  const route = useRoute<JobLaborScreenRouteProp>();
  const { jobId } = route.params;

  const [laborEntries, setLaborEntries] = useState<LaborEntry[]>([]);
  const [jobTitle, setJobTitle] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalLaborCost, setTotalLaborCost] = useState(0);
  const [totalLaborHours, setTotalLaborHours] = useState(0);

  // Load labor entries data
  const loadLaborEntries = async () => {
    try {
      setError(null);

      // Get job details to show job title
      const job = await jobRepository.getById(jobId);
      if (job) {
        setJobTitle(job.title);
      }

      // Get all labor entries for this job
      const entries = await jobRepository.getJobLaborEntries(jobId);

      setLaborEntries(entries);

      // Calculate total labor cost and hours
      const totalCost = entries.reduce((sum, entry) => sum + entry.totalCost, 0);
      const totalHours = entries.reduce((sum, entry) => sum + entry.hours, 0);

      setTotalLaborCost(totalCost);
      setTotalLaborHours(totalHours);
    } catch (err) {
      console.error('Error loading labor entries:', err);
      setError('Failed to load labor entries');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Load data on initial render
  useEffect(() => {
    loadLaborEntries();
  }, [jobId]);

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    loadLaborEntries();
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  // Delete a labor entry
  const handleDeleteLaborEntry = (entryId: string, description: string) => {
    Alert.alert('Delete Labor Entry', `Are you sure you want to delete "${description}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            // We would need to add a deleteLaborEntry method to the jobRepository
            // For now, we'll just remove it from the state for demonstration
            const updatedEntries = laborEntries.filter((entry) => entry.id !== entryId);
            setLaborEntries(updatedEntries);

            // Update totals
            const newTotalCost = updatedEntries.reduce((sum, entry) => sum + entry.totalCost, 0);
            const newTotalHours = updatedEntries.reduce((sum, entry) => sum + entry.hours, 0);

            setTotalLaborCost(newTotalCost);
            setTotalLaborHours(newTotalHours);

            // Show success message
            Alert.alert('Success', 'Labor entry deleted successfully');
          } catch (err) {
            console.error('Error deleting labor entry:', err);
            Alert.alert('Error', 'Failed to delete labor entry');
          }
        },
      },
    ]);
  };

  // Render a labor entry item
  const renderLaborEntryItem = ({ item }: { item: LaborEntry }) => (
    <Card style={styles.laborCard}>
      <Card.Content>
        <View style={styles.laborCardHeader}>
          <Title style={styles.laborTitle}>{item.description}</Title>
          <View style={styles.laborActions}>
            <IconButton
              icon="pencil"
              size={20}
              onPress={() => navigation.navigate('AddEditLabor', { jobId, laborId: item.id })}
            />
            <IconButton
              icon="delete"
              size={20}
              onPress={() => handleDeleteLaborEntry(item.id, item.description)}
            />
          </View>
        </View>

        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Hours:</Text>
            <Text style={styles.detailValue}>{item.hours.toFixed(1)}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Rate:</Text>
            <Text style={styles.detailValue}>{formatCurrency(item.rate)}/hr</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Total:</Text>
            <Text style={[styles.detailValue, styles.totalPrice]}>
              {formatCurrency(item.totalCost)}
            </Text>
          </View>

          {item.technician && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Technician:</Text>
              <Text style={styles.detailValue}>{item.technician}</Text>
            </View>
          )}
        </View>

        {item.notes && (
          <>
            <Divider style={styles.divider} />
            <Paragraph style={styles.notesText}>{item.notes}</Paragraph>
          </>
        )}
      </Card.Content>
    </Card>
  );

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading labor entries...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with job info */}
      <Card style={styles.headerCard}>
        <Card.Content>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.headerTitle}>Labor for Job</Text>
              <Text style={styles.jobTitle}>{jobTitle}</Text>
            </View>
            <View>
              <Text style={styles.totalLabel}>Total: {formatCurrency(totalLaborCost)}</Text>
              <Text style={styles.hoursLabel}>{totalLaborHours.toFixed(1)} hours</Text>
            </View>
          </View>
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
        data={laborEntries}
        keyExtractor={(item) => item.id}
        renderItem={renderLaborEntryItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No labor entries for this job yet</Text>
            <Text style={styles.emptySubtext}>Use the button below to add labor charges</Text>
          </View>
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      />

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => navigation.navigate('AddEditLabor', { jobId })}
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    color: '#666',
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976D2',
    textAlign: 'right',
  },
  hoursLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.md * 2 + 56, // Extra space for FAB
  },
  laborCard: {
    marginBottom: spacing.md,
    ...shadows.small,
  },
  laborCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  laborTitle: {
    fontSize: 18,
    flex: 1,
  },
  laborActions: {
    flexDirection: 'row',
  },
  detailsContainer: {
    marginTop: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  detailLabel: {
    width: 100,
    fontWeight: 'bold',
    color: '#555',
  },
  detailValue: {
    flex: 1,
  },
  totalPrice: {
    fontWeight: 'bold',
  },
  divider: {
    marginVertical: spacing.md,
  },
  notesText: {
    color: '#555',
    fontStyle: 'italic',
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
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
  },
});

export default JobLaborScreen;
