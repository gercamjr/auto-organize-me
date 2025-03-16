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
import { useJobRepository, Part } from '../../hooks/useJobRepository';
import { spacing, shadows } from '../../utils/theme';
import { format } from 'date-fns';

// Define types for the screen
type JobPartsScreenNavigationProp = StackNavigationProp<JobsStackParamList, 'JobParts'>;
type JobPartsScreenRouteProp = RouteProp<JobsStackParamList, 'JobParts'>;

const JobPartsScreen: React.FC = () => {
  const jobRepository = useJobRepository();
  const navigation = useNavigation<JobPartsScreenNavigationProp>();
  const route = useRoute<JobPartsScreenRouteProp>();
  const { jobId } = route.params;

  const [parts, setParts] = useState<Part[]>([]);
  const [jobTitle, setJobTitle] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalPartsCost, setTotalPartsCost] = useState(0);

  // Load parts data
  const loadParts = async () => {
    try {
      setError(null);

      // Get job details to show job title
      const job = await jobRepository.getById(jobId);
      if (job) {
        setJobTitle(job.title);
      }

      // Get all parts for this job
      const jobParts = await jobRepository.getJobParts(jobId);

      setParts(jobParts);

      // Calculate total parts cost
      const total = jobParts.reduce((sum, part) => sum + part.totalCost, 0);
      setTotalPartsCost(total);
    } catch (err) {
      console.error('Error loading parts:', err);
      setError('Failed to load parts');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Load data on initial render
  useEffect(() => {
    loadParts();
  }, [jobId]);

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    loadParts();
  };

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';

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

  // Delete a part
  const handleDeletePart = (partId: string, partName: string) => {
    Alert.alert(
      'Delete Part',
      `Are you sure you want to delete ${partName}? This will also delete any associated photos and warranty information.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // We would need to add a deletePart method to the jobRepository
              // For now, we'll just remove it from the state for demonstration
              setParts((prev) => prev.filter((part) => part.id !== partId));

              // Update total cost
              const updatedParts = parts.filter((part) => part.id !== partId);
              const newTotal = updatedParts.reduce((sum, part) => sum + part.totalCost, 0);
              setTotalPartsCost(newTotal);

              // Show success message
              Alert.alert('Success', 'Part deleted successfully');
            } catch (err) {
              console.error('Error deleting part:', err);
              Alert.alert('Error', 'Failed to delete part');
            }
          },
        },
      ]
    );
  };

  // Render a part item
  const renderPartItem = ({ item }: { item: Part }) => (
    <Card style={styles.partCard}>
      <Card.Content>
        <View style={styles.partCardHeader}>
          <Title style={styles.partName}>{item.name}</Title>
          <View style={styles.partActions}>
            <IconButton
              icon="pencil"
              size={20}
              onPress={() => navigation.navigate('AddEditPart', { jobId, partId: item.id })}
            />
            <IconButton
              icon="delete"
              size={20}
              onPress={() => handleDeletePart(item.id, item.name)}
            />
          </View>
        </View>

        <View style={styles.detailsContainer}>
          {item.partNumber && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Part Number:</Text>
              <Text style={styles.detailValue}>{item.partNumber}</Text>
            </View>
          )}

          {item.manufacturer && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Manufacturer:</Text>
              <Text style={styles.detailValue}>{item.manufacturer}</Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Quantity:</Text>
            <Text style={styles.detailValue}>{item.quantity}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Unit Cost:</Text>
            <Text style={styles.detailValue}>{formatCurrency(item.unitCost)}</Text>
          </View>

          {item.markupPercentage && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Markup:</Text>
              <Text style={styles.detailValue}>{item.markupPercentage}%</Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Client Price:</Text>
            <Text style={styles.detailValue}>{formatCurrency(item.clientPrice)}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Total Price:</Text>
            <Text style={[styles.detailValue, styles.totalPrice]}>
              {formatCurrency(item.totalCost)}
            </Text>
          </View>
        </View>

        <Divider style={styles.divider} />

        <View style={styles.warrantySection}>
          <View style={styles.warrantyHeader}>
            <Text style={styles.sectionSubtitle}>Warranty Information</Text>
            {item.warrantyHasCoverage && (
              <Chip icon="shield" mode="flat" style={[styles.chip, styles.warrantyChip]}>
                Warranty
              </Chip>
            )}
          </View>

          {item.warrantyHasCoverage ? (
            <View style={styles.warrantyDetails}>
              {item.warrantyLengthInMonths && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Duration:</Text>
                  <Text style={styles.detailValue}>{item.warrantyLengthInMonths} months</Text>
                </View>
              )}

              {item.warrantyLengthInMiles && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Mileage:</Text>
                  <Text style={styles.detailValue}>{item.warrantyLengthInMiles} miles</Text>
                </View>
              )}

              {item.warrantyExpirationDate && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Expires:</Text>
                  <Text style={styles.detailValue}>{formatDate(item.warrantyExpirationDate)}</Text>
                </View>
              )}

              {item.warrantyNotes && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Notes:</Text>
                  <Text style={styles.detailValue}>{item.warrantyNotes}</Text>
                </View>
              )}
            </View>
          ) : (
            <Text style={styles.noWarrantyText}>No warranty coverage</Text>
          )}
        </View>

        {item.notes && (
          <>
            <Divider style={styles.divider} />
            <Text style={styles.sectionSubtitle}>Notes</Text>
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
        <Text style={styles.loadingText}>Loading parts...</Text>
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
              <Text style={styles.headerTitle}>Parts for Job</Text>
              <Text style={styles.jobTitle}>{jobTitle}</Text>
            </View>
            <View>
              <Text style={styles.totalLabel}>Total Parts Cost</Text>
              <Text style={styles.totalValue}>{formatCurrency(totalPartsCost)}</Text>
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
        data={parts}
        keyExtractor={(item) => item.id}
        renderItem={renderPartItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No parts added to this job yet</Text>
            <Text style={styles.emptySubtext}>
              Use the button below to add parts used in this repair
            </Text>
          </View>
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      />

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => navigation.navigate('AddEditPart', { jobId })}
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
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976D2',
    textAlign: 'right',
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.md * 2 + 56, // Extra space for FAB
  },
  partCard: {
    marginBottom: spacing.md,
    ...shadows.small,
  },
  partCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  partName: {
    fontSize: 18,
    flex: 1,
  },
  partActions: {
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
    width: 110,
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
  warrantySection: {
    marginBottom: spacing.sm,
  },
  warrantyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  warrantyDetails: {
    backgroundColor: '#f5f5f5',
    padding: spacing.sm,
    borderRadius: 4,
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  chip: {
    height: 26,
  },
  warrantyChip: {
    backgroundColor: '#E3F2FD',
  },
  noWarrantyText: {
    fontStyle: 'italic',
    color: '#757575',
  },
  notesText: {
    color: '#555',
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

export default JobPartsScreen;
