import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Image } from 'react-native';
import { Text, Searchbar, FAB, Divider, ActivityIndicator, Card, Chip } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { VehiclesStackParamList } from '../../navigation/VehiclesNavigator';
import vehicleRepository, { VehicleListItem } from '../../database/repositories/VehicleRepository';
import { spacing, shadows } from '../../utils/theme';
import { format } from 'date-fns';

// Define the navigation prop type
type VehicleListScreenNavigationProp = StackNavigationProp<VehiclesStackParamList, 'VehicleList'>;

const VehicleListScreen: React.FC = () => {
  const navigation = useNavigation<VehicleListScreenNavigationProp>();

  const [vehicles, setVehicles] = useState<VehicleListItem[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<VehicleListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load vehicles from database
  const loadVehicles = async () => {
    try {
      setError(null);

      const result = await vehicleRepository.getAll();

      setVehicles(result);
      setFilteredVehicles(result);
    } catch (err) {
      console.error('Error loading vehicles:', err);
      setError('Failed to load vehicles. Please try again.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Initial data loading
  useEffect(() => {
    loadVehicles();
  }, []);

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);

    if (!query.trim()) {
      setFilteredVehicles(vehicles);
      return;
    }

    const lowercaseQuery = query.toLowerCase();
    const filtered = vehicles.filter(
      (vehicle) =>
        vehicle.make.toLowerCase().includes(lowercaseQuery) ||
        vehicle.model.toLowerCase().includes(lowercaseQuery) ||
        vehicle.clientName.toLowerCase().includes(lowercaseQuery) ||
        (vehicle.licensePlate && vehicle.licensePlate.toLowerCase().includes(lowercaseQuery)) ||
        vehicle.year.toString().includes(lowercaseQuery)
    );

    setFilteredVehicles(filtered);
  };

  // Handle pull-to-refresh
  const handleRefresh = () => {
    setRefreshing(true);
    loadVehicles();
  };

  // Navigate to vehicle details
  const handleVehiclePress = (vehicleId: string) => {
    navigation.navigate('VehicleDetails', { vehicleId });
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

  // Render each vehicle item
  const renderItem = ({ item }: { item: VehicleListItem }) => {
    return (
      <TouchableOpacity onPress={() => handleVehiclePress(item.id)}>
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <View style={styles.vehicleInfo}>
                <Text variant="titleMedium" style={styles.vehicleTitle}>
                  {item.year} {item.make} {item.model}
                </Text>
                <Text variant="bodyMedium" style={styles.clientName}>
                  Owner: {item.clientName}
                </Text>
              </View>

              {item.photoUri && (
                <Image source={{ uri: item.photoUri }} style={styles.vehicleImage} />
              )}
            </View>

            <Divider style={styles.divider} />

            <View style={styles.detailsRow}>
              {item.licensePlate && (
                <Chip icon="card-account-details" style={styles.chip}>
                  {item.licensePlate}
                </Chip>
              )}

              <Chip icon="calendar" style={styles.chip}>
                Last Service: {formatDate(item.lastServiceDate)}
              </Chip>
            </View>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  };

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text variant="titleLarge">No Vehicles Found</Text>
      <Text variant="bodyMedium" style={styles.emptyText}>
        {searchQuery ? 'Try different search terms' : 'Add your first vehicle to get started'}
      </Text>
    </View>
  );

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading vehicles...</Text>
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
            loadVehicles();
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
        placeholder="Search vehicles..."
        onChangeText={handleSearch}
        value={searchQuery}
        style={styles.searchBar}
      />

      <FlatList
        data={filteredVehicles}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      />

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => navigation.navigate('AddEditVehicle', {})}
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
  vehicleInfo: {
    flex: 1,
  },
  vehicleTitle: {
    fontWeight: 'bold',
  },
  clientName: {
    color: '#666',
  },
  vehicleImage: {
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
    flexWrap: 'wrap',
  },
  chip: {
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
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

export default VehicleListScreen;
