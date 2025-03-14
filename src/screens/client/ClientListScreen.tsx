import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Text, Searchbar, FAB, Divider, ActivityIndicator, Card, Avatar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { ClientsStackParamList } from '../../navigation/ClientsNavigator';
import { useDatabase } from '../../contexts/DatabaseContext';
import { spacing, shadows } from '../../utils/theme';

// Define the navigation prop type
type ClientListScreenNavigationProp = StackNavigationProp<ClientsStackParamList, 'ClientList'>;

// Client interface
interface Client {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email?: string;
}

const ClientListScreen: React.FC = () => {
  const navigation = useNavigation<ClientListScreenNavigationProp>();
  const { db, isLoading: isDbLoading, error: dbError } = useDatabase();

  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load clients from database
  useEffect(() => {
    const loadClients = async () => {
      if (!db || isDbLoading) return;

      try {
        setIsLoading(true);

        // Using the new API for fetching data
        const result = await db.getAllAsync<Client>(
          'SELECT id, firstName, lastName, phoneNumber, email FROM clients ORDER BY lastName, firstName'
        );

        setClients(result);
        setFilteredClients(result);
        setError(null);
      } catch (err) {
        console.error('Error loading clients:', err);
        setError('Failed to load clients. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadClients();
  }, [db, isDbLoading]);

  // Handle database errors
  useEffect(() => {
    if (dbError) {
      setError(`Database error: ${dbError.message}`);
    }
  }, [dbError]);

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
        client.phoneNumber.includes(lowercaseQuery) ||
        (client.email && client.email.toLowerCase().includes(lowercaseQuery))
    );

    setFilteredClients(filtered);
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

  // Handle refresh
  const handleRefresh = async () => {
    if (!db) return;

    try {
      setIsLoading(true);
      const result = await db.getAllAsync<Client>(
        'SELECT id, firstName, lastName, phoneNumber, email FROM clients ORDER BY lastName, firstName'
      );
      setClients(result);
      setFilteredClients(result);
      setError(null);
    } catch (err) {
      console.error('Error refreshing clients:', err);
      setError('Failed to refresh clients. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (isLoading || isDbLoading) {
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
        <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
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
        refreshing={isLoading}
        onRefresh={handleRefresh}
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
