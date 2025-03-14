import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Text, Searchbar, FAB, Divider, ActivityIndicator, Card, Avatar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ClientsStackParamList } from '../../navigation/ClientsNavigator';
import { useClientRepository, Client } from '../../hooks/useClientRepository';
import { spacing, shadows } from '../../utils/theme';

// Define the navigation prop type
type ClientListScreenNavigationProp = StackNavigationProp<ClientsStackParamList, 'ClientList'>;

const ClientListScreen: React.FC = () => {
  const navigation = useNavigation<ClientListScreenNavigationProp>();
  const clientRepository = useClientRepository();

  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load clients from database
  const loadClients = async () => {
    try {
      setError(null);

      const result = await clientRepository.getAll();

      setClients(result);
      setFilteredClients(result);
    } catch (err) {
      console.error('Error loading clients:', err);
      setError('Failed to load clients. Please try again.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Initial data loading
  useEffect(() => {
    loadClients();
  }, []);

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);

    if (!query.trim()) {
      setFilteredClients(clients);
      return;
    }

    const lowercaseQuery = query.toLowerCase();
    const filtered = clients.filter(
      (client) =>
        client.firstName.toLowerCase().includes(lowercaseQuery) ||
        client.lastName.toLowerCase().includes(lowercaseQuery) ||
        client.phoneNumber.toLowerCase().includes(lowercaseQuery) ||
        (client.email && client.email.toLowerCase().includes(lowercaseQuery))
    );

    setFilteredClients(filtered);
  };

  // Handle pull-to-refresh
  const handleRefresh = () => {
    setRefreshing(true);
    loadClients();
  };

  // Navigate to client details
  const handleClientPress = (clientId: string) => {
    navigation.navigate('ClientDetails', { clientId });
  };

  // Render each client item
  const renderItem = ({ item }: { item: Client }) => {
    // Get initials for the avatar
    const initials = `${item.firstName.charAt(0)}${item.lastName.charAt(0)}`.toUpperCase();

    return (
      <TouchableOpacity onPress={() => handleClientPress(item.id)}>
        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <Avatar.Text size={50} label={initials} style={styles.avatar} />
            <View style={styles.clientInfo}>
              <Text variant="titleMedium">{`${item.firstName} ${item.lastName}`}</Text>
              <Text variant="bodyMedium">{item.phoneNumber}</Text>
              {item.email && <Text variant="bodySmall">{item.email}</Text>}
            </View>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  };

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text variant="titleLarge">No Clients Found</Text>
      <Text variant="bodyMedium" style={styles.emptyText}>
        {searchQuery ? 'Try different search terms' : 'Add your first client to get started'}
      </Text>
    </View>
  );

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading clients...</Text>
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
            loadClients();
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
        placeholder="Search clients..."
        onChangeText={handleSearch}
        value={searchQuery}
        style={styles.searchBar}
      />

      <FlatList
        data={filteredClients}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      />

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() => navigation.navigate('AddEditClient', {})}
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
  },
  card: {
    marginBottom: spacing.sm,
    ...shadows.small,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    marginRight: spacing.md,
  },
  clientInfo: {
    flex: 1,
  },
  separator: {
    height: spacing.sm,
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

export default ClientListScreen;
