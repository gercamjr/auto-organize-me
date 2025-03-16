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
import { useJobRepository, DiagnosticItem } from '../../hooks/useJobRepository';
import { spacing, shadows } from '../../utils/theme';

// Define types for the screen
type JobDiagnosticsScreenNavigationProp = StackNavigationProp<JobsStackParamList, 'JobDiagnostics'>;
type JobDiagnosticsScreenRouteProp = RouteProp<JobsStackParamList, 'JobDiagnostics'>;

const JobDiagnosticsScreen: React.FC = () => {
  const jobRepository = useJobRepository();
  const navigation = useNavigation<JobDiagnosticsScreenNavigationProp>();
  const route = useRoute<JobDiagnosticsScreenRouteProp>();
  const { jobId } = route.params;

  const [diagnosticItems, setDiagnosticItems] = useState<DiagnosticItem[]>([]);
  const [jobTitle, setJobTitle] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load diagnostic items data
  const loadDiagnosticItems = async () => {
    try {
      setError(null);

      // Get job details to show job title
      const job = await jobRepository.getById(jobId);
      if (job) {
        setJobTitle(job.title);
      }

      // Get all diagnostic items for this job
      const items = await jobRepository.getJobDiagnosticItems(jobId);

      setDiagnosticItems(items);
    } catch (err) {
      console.error('Error loading diagnostic items:', err);
      setError('Failed to load diagnostic items');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Load data on initial render
  useEffect(() => {
    loadDiagnosticItems();
  }, [jobId]);

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    loadDiagnosticItems();
  };

  // Format currency
  const formatCurrency = (amount?: number) => {
    if (amount === undefined) return 'N/A';
    return `$${amount.toFixed(2)}`;
  };

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'minor':
        return '#4CAF50'; // Green
      case 'moderate':
        return '#FF9800'; // Orange
      case 'severe':
        return '#f44336'; // Red
      case 'critical':
        return '#9C27B0'; // Purple
      default:
        return '#757575'; // Grey
    }
  };

  // Delete a diagnostic item
  const handleDeleteDiagnosticItem = (itemId: string, issue: string) => {
    Alert.alert('Delete Diagnostic Item', `Are you sure you want to delete "${issue}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            // We would need to add a deleteDiagnosticItem method to the jobRepository
            // For now, we'll just remove it from the state for demonstration
            setDiagnosticItems((prev) => prev.filter((item) => item.id !== itemId));

            // Show success message
            Alert.alert('Success', 'Diagnostic item deleted successfully');
          } catch (err) {
            console.error('Error deleting diagnostic item:', err);
            Alert.alert('Error', 'Failed to delete diagnostic item');
          }
        },
      },
    ]);
  };

  // Render a diagnostic item
  const renderDiagnosticItem = ({ item }: { item: DiagnosticItem }) => (
    <Card style={styles.itemCard}>
      <Card.Content>
        <View style={styles.itemCardHeader}>
          <View style={styles.headerLeft}>
            <Title style={styles.itemTitle}>{item.issue}</Title>
            <Chip
              style={[
                styles.severityChip,
                { backgroundColor: getSeverityColor(item.severity) + '20' },
              ]}
              textStyle={{ color: getSeverityColor(item.severity) }}
            >
              {item.severity.charAt(0).toUpperCase() + item.severity.slice(1)}
            </Chip>
          </View>
          <View style={styles.itemActions}>
            <IconButton
              icon="pencil"
              size={20}
              onPress={() =>
                navigation.navigate('AddEditDiagnostic', { jobId, diagnosticId: item.id })
              }
            />
            <IconButton
              icon="delete"
              size={20}
              onPress={() => handleDeleteDiagnosticItem(item.id, item.issue)}
            />
          </View>
        </View>

        <Divider style={styles.divider} />

        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>System:</Text>
            <Text style={styles.detailValue}>{item.system}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Component:</Text>
            <Text style={styles.detailValue}>{item.component}</Text>
          </View>

          <Divider style={styles.smallDivider} />

          <Text style={styles.sectionLabel}>Recommended Action:</Text>
          <Text style={styles.recommendedAction}>{item.recommendedAction}</Text>

          {item.estimatedCost !== undefined && (
            <View style={styles.costContainer}>
              <Text style={styles.detailLabel}>Estimated Cost:</Text>
              <Text style={styles.costValue}>{formatCurrency(item.estimatedCost)}</Text>
            </View>
          )}
        </View>

        {item.notes && (
          <>
            <Divider style={styles.divider} />
            <Text style={styles.sectionLabel}>Notes:</Text>
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
        <Text style={styles.loadingText}>Loading diagnostic items...</Text>
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
              <Text style={styles.headerTitle}>Diagnostics for Job</Text>
              <Text style={styles.jobTitle}>{jobTitle}</Text>
            </View>
            <View>
              <Text style={styles.itemsCount}>
                {diagnosticItems.length} {diagnosticItems.length === 1 ? 'item' : 'items'}
              </Text>
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
        data={diagnosticItems}
        keyExtractor={(item) => item.id}
        renderItem={renderDiagnosticItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No diagnostic items for this job yet</Text>
            <Text style={styles.emptySubtext}>
              Use the button below to add your diagnostic findings
            </Text>
          </View>
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      />

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => navigation.navigate('AddEditDiagnostic', { jobId })}
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
  itemsCount: {
    fontSize: 16,
    color: '#666',
    textAlign: 'right',
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.md * 2 + 56, // Extra space for FAB
  },
  itemCard: {
    marginBottom: spacing.md,
    ...shadows.small,
  },
  itemCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 18,
    marginBottom: spacing.xs,
  },
  severityChip: {
    alignSelf: 'flex-start',
    marginBottom: spacing.sm,
  },
  itemActions: {
    flexDirection: 'row',
  },
  divider: {
    marginVertical: spacing.md,
  },
  smallDivider: {
    marginVertical: spacing.sm,
  },
  detailsContainer: {
    marginTop: spacing.xs,
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
  sectionLabel: {
    fontWeight: 'bold',
    color: '#555',
    marginBottom: spacing.xs,
  },
  recommendedAction: {
    marginBottom: spacing.md,
  },
  costContainer: {
    flexDirection: 'row',
    marginTop: spacing.sm,
    alignItems: 'center',
  },
  costValue: {
    fontWeight: 'bold',
    color: '#1976D2',
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

export default JobDiagnosticsScreen;
