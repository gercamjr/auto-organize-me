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
import { JobsStackParamList } from '../../navigation/JobsNavigator';
import {
  useJobRepository,
  Job,
  Part,
  LaborEntry,
  DiagnosticItem,
  JobPhoto,
} from '../../hooks/useJobRepository';
import { spacing, shadows } from '../../utils/theme';
import { format } from 'date-fns';

// Define types for the screen
type JobDetailsScreenNavigationProp = StackNavigationProp<JobsStackParamList, 'JobDetails'>;
type JobDetailsScreenRouteProp = RouteProp<JobsStackParamList, 'JobDetails'>;

// Job data with related details
interface JobWithDetails extends Job {
  clientName: string;
  vehicleInfo: string;
  parts: Part[];
  laborEntries: LaborEntry[];
  diagnosticItems: DiagnosticItem[];
  photos: JobPhoto[];
}

const JobDetailsScreen: React.FC = () => {
  const navigation = useNavigation<JobDetailsScreenNavigationProp>();
  const route = useRoute<JobDetailsScreenRouteProp>();
  const { jobId } = route.params;
  const jobRepository = useJobRepository();

  const [job, setJob] = useState<JobWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load job data
  const loadJobData = async () => {
    try {
      setError(null);

      // Get basic job data
      const jobData = await jobRepository.getById(jobId);

      if (!jobData) {
        setError('Job not found');
        setIsLoading(false);
        setRefreshing(false);
        return;
      }

      // Get client and vehicle info
      const jobWithClientVehicle = await jobRepository.getJobWithDetails(jobId);

      if (!jobWithClientVehicle) {
        setError('Failed to load job details');
        setIsLoading(false);
        setRefreshing(false);
        return;
      }

      // Get parts, labor, diagnostics, and photos
      const parts = await jobRepository.getJobParts(jobId);
      const laborEntries = await jobRepository.getJobLaborEntries(jobId);
      const diagnosticItems = await jobRepository.getJobDiagnosticItems(jobId);
      const photos = await jobRepository.getJobPhotos(jobId);

      // Combine data
      const jobWithDetails: JobWithDetails = {
        ...jobData,
        clientName: jobWithClientVehicle.clientName,
        vehicleInfo: jobWithClientVehicle.vehicleInfo,
        parts,
        laborEntries,
        diagnosticItems,
        photos,
      };

      setJob(jobWithDetails);
    } catch (err) {
      console.error('Error loading job details:', err);
      setError('Failed to load job details');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Load data on initial render
  useEffect(() => {
    loadJobData();
  }, [jobId]);

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    loadJobData();
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

  // Handle delete job
  const handleDeleteJob = () => {
    Alert.alert(
      'Delete Job',
      `Are you sure you want to delete this job? This will also delete all associated parts, labor entries, diagnostic items, and photos.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await jobRepository.deleteJob(jobId);
              if (success) {
                navigation.goBack();
              } else {
                Alert.alert('Error', 'Failed to delete job. Please try again.');
              }
            } catch (err) {
              console.error('Error deleting job:', err);
              Alert.alert('Error', 'Failed to delete job. Please try again.');
            }
          },
        },
      ]
    );
  };

  // Handle edit job
  const handleEditJob = () => {
    navigation.navigate('AddEditJob', { jobId });
  };

  // Handle clicking on parts
  const handleViewParts = () => {
    navigation.navigate('JobParts', { jobId });
  };

  // Handle clicking on labor
  const handleViewLabor = () => {
    navigation.navigate('JobLabor', { jobId });
  };

  // Handle clicking on diagnostics
  const handleViewDiagnostics = () => {
    navigation.navigate('JobDiagnostics', { jobId });
  };

  // Handle clicking on photos
  const handleViewPhotos = () => {
    navigation.navigate('JobPhotos', { jobId });
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading job details...</Text>
      </View>
    );
  }

  // Error state
  if (error || !job) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'Job not found'}</Text>
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
        {/* Job Info Card */}
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.jobTitle}>{job.title}</Title>

            <View style={styles.statusChip}>
              <View
                style={[styles.statusIndicator, { backgroundColor: getStatusColor(job.status) }]}
              />
              <Text style={styles.statusText}>{job.status.replace('-', ' ')}</Text>
            </View>

            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Client:</Text>
                <Text style={styles.infoValue}>{job.clientName}</Text>
              </View>

              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Vehicle:</Text>
                <Text style={styles.infoValue}>{job.vehicleInfo}</Text>
              </View>

              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Job Type:</Text>
                <Text style={styles.infoValue}>{job.jobType.replace('-', ' ')}</Text>
              </View>

              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Home Visit:</Text>
                <Text style={styles.infoValue}>{job.isHomeVisit ? 'Yes' : 'No'}</Text>
              </View>

              {job.isHomeVisit && job.locationAddress && (
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Location:</Text>
                  <Text style={styles.infoValue}>{job.locationAddress}</Text>
                </View>
              )}

              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Scheduled:</Text>
                <Text style={styles.infoValue}>{formatDate(job.scheduledDate)}</Text>
              </View>

              {job.startDate && (
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Started:</Text>
                  <Text style={styles.infoValue}>{formatDate(job.startDate)}</Text>
                </View>
              )}

              {job.completionDate && (
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Completed:</Text>
                  <Text style={styles.infoValue}>{formatDate(job.completionDate)}</Text>
                </View>
              )}
            </View>

            <Divider style={styles.divider} />
            <Text style={styles.sectionTitle}>Description</Text>
            <Paragraph style={styles.description}>{job.description}</Paragraph>

            {job.notes && (
              <>
                <Divider style={styles.divider} />
                <Text style={styles.sectionTitle}>Notes</Text>
                <Paragraph style={styles.notes}>{job.notes}</Paragraph>
              </>
            )}

            <Divider style={styles.divider} />
            <Text style={styles.sectionTitle}>Financial Details</Text>

            <View style={styles.financialDetails}>
              {job.estimateProvided && (
                <View style={styles.financialItem}>
                  <Text style={styles.financialLabel}>Estimate:</Text>
                  <Text style={styles.financialValue}>
                    {job.estimateAmount ? formatCurrency(job.estimateAmount) : 'N/A'}
                    {job.estimateAccepted !== undefined && (
                      <Text style={{ color: job.estimateAccepted ? '#4CAF50' : '#F44336' }}>
                        {' '}
                        {job.estimateAccepted ? '(Accepted)' : '(Not Accepted)'}
                      </Text>
                    )}
                  </Text>
                </View>
              )}

              <View style={styles.financialItem}>
                <Text style={styles.financialLabel}>Parts:</Text>
                <Text style={styles.financialValue}>
                  {formatCurrency(job.parts.reduce((sum, part) => sum + part.totalCost, 0))}
                </Text>
              </View>

              <View style={styles.financialItem}>
                <Text style={styles.financialLabel}>Labor:</Text>
                <Text style={styles.financialValue}>
                  {formatCurrency(
                    job.laborEntries.reduce((sum, entry) => sum + entry.totalCost, 0)
                  )}
                </Text>
              </View>

              <View style={styles.financialItem}>
                <Text style={[styles.financialLabel, styles.totalLabel]}>Total:</Text>
                <Text style={[styles.financialValue, styles.totalValue]}>
                  {formatCurrency(job.totalCost)}
                </Text>
              </View>

              {job.paymentStatus && (
                <View style={styles.financialItem}>
                  <Text style={styles.financialLabel}>Payment:</Text>
                  <Text
                    style={[
                      styles.financialValue,
                      {
                        color:
                          job.paymentStatus === 'paid'
                            ? '#4CAF50'
                            : job.paymentStatus === 'partial'
                              ? '#FF9800'
                              : '#F44336',
                      },
                    ]}
                  >
                    {job.paymentStatus.charAt(0).toUpperCase() + job.paymentStatus.slice(1)}
                    {job.paymentMethod && ` (${job.paymentMethod})`}
                  </Text>
                </View>
              )}

              {job.invoiceNumber && (
                <View style={styles.financialItem}>
                  <Text style={styles.financialLabel}>Invoice:</Text>
                  <Text style={styles.financialValue}>#{job.invoiceNumber}</Text>
                </View>
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsContainer}>
              <Button
                mode="contained"
                icon="pencil"
                style={styles.actionButton}
                onPress={handleEditJob}
              >
                Edit
              </Button>
              <Button
                mode="outlined"
                icon="delete"
                style={styles.actionButton}
                onPress={handleDeleteJob}
              >
                Delete
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* Parts, Labor, Diagnostics, and Photos Section */}
        <View style={styles.sectionsGrid}>
          {/* Parts Section */}
          <Card style={styles.sectionCard}>
            <TouchableOpacity onPress={handleViewParts}>
              <Card.Content>
                <View style={styles.sectionHeader}>
                  <IconButton icon="cog" size={24} />
                  <View style={styles.sectionHeaderText}>
                    <Text style={styles.sectionCardTitle}>Parts</Text>
                    <Text style={styles.sectionCardCount}>
                      {job.parts.length} {job.parts.length === 1 ? 'part' : 'parts'}
                    </Text>
                  </View>
                  <IconButton icon="chevron-right" size={24} />
                </View>
              </Card.Content>
            </TouchableOpacity>
          </Card>

          {/* Labor Section */}
          <Card style={styles.sectionCard}>
            <TouchableOpacity onPress={handleViewLabor}>
              <Card.Content>
                <View style={styles.sectionHeader}>
                  <IconButton icon="account-wrench" size={24} />
                  <View style={styles.sectionHeaderText}>
                    <Text style={styles.sectionCardTitle}>Labor</Text>
                    <Text style={styles.sectionCardCount}>
                      {job.laborEntries.length}{' '}
                      {job.laborEntries.length === 1 ? 'entry' : 'entries'}
                    </Text>
                  </View>
                  <IconButton icon="chevron-right" size={24} />
                </View>
              </Card.Content>
            </TouchableOpacity>
          </Card>

          {/* Diagnostics Section */}
          <Card style={styles.sectionCard}>
            <TouchableOpacity onPress={handleViewDiagnostics}>
              <Card.Content>
                <View style={styles.sectionHeader}>
                  <IconButton icon="clipboard-list" size={24} />
                  <View style={styles.sectionHeaderText}>
                    <Text style={styles.sectionCardTitle}>Diagnostics</Text>
                    <Text style={styles.sectionCardCount}>
                      {job.diagnosticItems.length}{' '}
                      {job.diagnosticItems.length === 1 ? 'item' : 'items'}
                    </Text>
                  </View>
                  <IconButton icon="chevron-right" size={24} />
                </View>
              </Card.Content>
            </TouchableOpacity>
          </Card>

          {/* Photos Section */}
          <Card style={styles.sectionCard}>
            <TouchableOpacity onPress={handleViewPhotos}>
              <Card.Content>
                <View style={styles.sectionHeader}>
                  <IconButton icon="camera" size={24} />
                  <View style={styles.sectionHeaderText}>
                    <Text style={styles.sectionCardTitle}>Photos</Text>
                    <Text style={styles.sectionCardCount}>
                      {job.photos.length} {job.photos.length === 1 ? 'photo' : 'photos'}
                    </Text>
                  </View>
                  <IconButton icon="chevron-right" size={24} />
                </View>
              </Card.Content>
            </TouchableOpacity>
          </Card>
        </View>

        {/* Photo Preview */}
        {job.photos.length > 0 && (
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.cardHeader}>
                <Text style={styles.sectionTitle}>Photos</Text>
                <Button mode="text" onPress={handleViewPhotos}>
                  View All
                </Button>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.photosContainer}
              >
                {job.photos.slice(0, 5).map((photo) => (
                  <TouchableOpacity
                    key={photo.id}
                    onPress={handleViewPhotos}
                    style={styles.photoWrapper}
                  >
                    <Image source={{ uri: photo.photoUri }} style={styles.photo} />
                    <View style={styles.photoTypeTag}>
                      <Text style={styles.photoTypeText}>
                        {photo.photoType.charAt(0).toUpperCase() + photo.photoType.slice(1)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}

                {job.photos.length > 5 && (
                  <TouchableOpacity onPress={handleViewPhotos} style={styles.morePhotosButton}>
                    <Text style={styles.morePhotosText}>+{job.photos.length - 5}</Text>
                    <Text style={styles.morePhotosSubtext}>more</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            </Card.Content>
          </Card>
        )}
      </ScrollView>
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
  },
  card: {
    marginBottom: spacing.md,
    ...shadows.small,
  },
  jobTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.xs,
  },
  statusText: {
    fontSize: 14,
    textTransform: 'capitalize',
  },
  infoGrid: {
    marginBottom: spacing.md,
  },
  infoItem: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  infoLabel: {
    width: 100,
    fontWeight: 'bold',
    color: '#555',
  },
  infoValue: {
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
  description: {
    color: '#333',
  },
  notes: {
    color: '#555',
    fontStyle: 'italic',
  },
  financialDetails: {
    marginTop: spacing.sm,
  },
  financialItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  financialLabel: {
    fontWeight: 'bold',
    color: '#555',
  },
  financialValue: {
    textAlign: 'right',
  },
  totalLabel: {
    fontSize: 16,
    color: '#333',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
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
  sectionsGrid: {
    marginBottom: spacing.md,
  },
  sectionCard: {
    marginBottom: spacing.sm,
    ...shadows.small,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionHeaderText: {
    flex: 1,
  },
  sectionCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionCardCount: {
    fontSize: 14,
    color: '#666',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  photosContainer: {
    paddingVertical: spacing.sm,
  },
  photoWrapper: {
    marginRight: spacing.sm,
    position: 'relative',
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 4,
  },
  photoTypeTag: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 4,
  },
  photoTypeText: {
    color: 'white',
    fontSize: 12,
    textAlign: 'center',
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

export default JobDetailsScreen;
