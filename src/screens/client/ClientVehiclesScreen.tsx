import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import {
  Text,
  Card,
  Title,
  Paragraph,
  Button,
  Divider,
  Avatar,
  ActivityIndicator,
  FAB,
} from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ClientsStackParamList } from '../../navigation/ClientsNavigator';
import { useClientRepository, VehicleSummary } from '../../hooks/useClientRepository';
import { spacing, shadows } from '../../utils/theme';
import { format } from 'date-fns';

// Define types for the screen
type ClientVehiclesScreenNavigationProp = StackNavigationProp<
  ClientsStackParamList,
  'ClientVehicles'
>;
type ClientVehiclesScreenRouteProp = RouteProp<ClientsStackParamList, 'ClientVehicles'>;

// Vehicle data with client info
interface VehicleWithClient extends VehicleSummary {
  clientName: string;
}

const ClientVehiclesScreen: React.FC = () => {
  const navigation = useNavigation<ClientVehiclesScreenNavigationProp>();
  const route = useRoute<ClientVehiclesScreenRouteProp>();
  const { clientId } = route.params;
  const clientRepository = useClientRepository();

  const [vehicles, setVehicles] = useState<VehicleWithClient[]>([]);
  const [clientName, setClientName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load vehicles data
  const loadVehicles = async () => {
    try {
      setError(null);

      // Get client details for the name
      const client = await clientRepository.getById(clientId);

      if (!client) {
        setError('Client not found');
        setIsLoading(false);
        setRefreshing(false);
        return;
      }

      setClientName(`${client.firstName} ${client.lastName}`);

      // Get all vehicles for this client
      const vehicleData = await clientRepository.getClientVehicles(clientId);

      // Map to include client name
      const vehiclesWithClient: VehicleWithClient[] = vehicleData.map((vehicle) => ({
        ...vehicle,
        clientName: `${client.firstName} ${client.lastName}`,
      }));

      setVehicles(vehiclesWithClient);
    } catch (err) {
      console.error('Error loading vehicles:', err);
      setError('Failed to load vehicles');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Load data on initial render
  useEffect(() => {
    loadVehicles();
  }, [clientId]);

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    loadVehicles();
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

  // Handle add vehicle
  const handleAddVehicle = () => {
    navigation.getParent()?.navigate('Vehicles', {
      screen: 'AddEditVehicle',
      params: { clientId },
    });
  };

  // Render vehicle item
  const renderVehicleItem = ({ item }: { item: VehicleWithClient }) => (
    <Card style={styles.vehicleCard}>
      <TouchableOpacity
        onPress={() => {
          navigation.getParent()?.navigate('Vehicles', {
            screen: 'VehicleDetails',
            params: { vehicleId: item.id },
          });
        }}
      >
        <Card.Content>
          <View style={styles.vehicleHeader}>
            <Avatar.Icon size={40} icon="car" style={styles.vehicleIcon} />
            <View style={styles.vehicleInfo}>
              <Title style={styles.vehicleTitle}>
                {item.year} {item.make} {item.model}
              </Title>
              {item.licensePlate && (
                <Text style={styles.vehicleSubtitle}>License: {item.licensePlate}</Text>
              )}
            </View>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.vehicleDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Last Service:</Text>
              <Text style={styles.detailValue}>{formatDate(item.lastService)}</Text>
            </View>
          </View>

          <View style={styles.actionsContainer}>
            <Button
              mode="outlined"
              icon="car-wrench"
              onPress={() => {
                // Navigate to add job for this vehicle
                navigation.getParent()?.navigate('Jobs', {
                  screen: 'AddEditJob',
                  params: { vehicleId: item.id, clientId },
                });
              }}
              style={styles.actionButton}
            >
              New Job
            </Button>

            <Button
              mode="outlined"
              icon="information-outline"
              onPress={() => {
                navigation.getParent()?.navigate('Vehicles', {
                  screen: 'VehicleDetails',
                  params: { vehicleId: item.id },
                });
              }}
              style={styles.actionButton}
            >
              Details
            </Button>
          </View>
        </Card.Content>
      </TouchableOpacity>
    </Card>
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

  return (
    <View style={styles.container}>
      {/* Header section with client info */}
      <Card style={styles.headerCard}>
        <Card.Content>
          <Text style={styles.headerTitle}>{clientName}'s Vehicles</Text>
          <Text style={styles.headerSubtitle}>
            {vehicles.length} {vehicles.length === 1 ? 'vehicle' : 'vehicles'}
          </Text>
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
        data={vehicles}
        keyExtractor={(item) => item.id}
        renderItem={renderVehicleItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No vehicles found for this client</Text>
            <Button mode="contained" onPress={handleAddVehicle} style={styles.emptyButton}>
              Add Vehicle
            </Button>
          </View>
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      />

      <FAB style={styles.fab} icon="plus" onPress={handleAddVehicle} label="Add Vehicle" />
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
  headerSubtitle: {
    color: '#666',
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.md * 2 + 56, // Extra space for FAB
  },
  vehicleCard: {
    marginBottom: spacing.md,
    ...shadows.small,
  },
  vehicleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vehicleIcon: {
    backgroundColor: '#1976D2',
    marginRight: spacing.md,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleTitle: {
    fontSize: 16,
  },
  vehicleSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  divider: {
    marginVertical: spacing.md,
  },
  vehicleDetails: {
    marginBottom: spacing.md,
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
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  emptyButton: {
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
  },
  fab: {
    position: 'absolute',
    margin: spacing.md,
    right: 0,
    bottom: 0,
  },
});

export default ClientVehiclesScreen;
