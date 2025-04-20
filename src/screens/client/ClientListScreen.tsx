import React, { useState, useCallback } from 'react';
import { View, FlatList, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useClientRepository, Client } from '../../hooks/useClientRepository';
import { Appbar, List, FAB } from 'react-native-paper';
import { ClientsStackParamList } from '@/navigation/ClientsNavigator';

type ClientListScreenProps = NativeStackScreenProps<ClientsStackParamList, 'ClientList'>;

const ClientListScreen = ({ navigation }: ClientListScreenProps) => {
  const clientRepository = useClientRepository();
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadClients = useCallback(async () => {
    setIsLoading(true);
    console.log('Fetching clients using repository...');
    try {
      const fetchedClients = await clientRepository.getAll();
      setClients(fetchedClients);
      console.log('Clients fetched successfully.');
    } catch (error) {
      console.error('Failed to fetch clients:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadClients();
    }, [])
  );

  const handleAddNewClient = () => {
    navigation.navigate('ClientDetails', { clientId: '' });
  };

  const renderClientItem = ({ item }: { item: Client }) => (
    console.log('Rendering client item:', item),
    (
      <List.Item
        title={`${item.firstName} ${item.lastName}`}
        description={item.phoneNumber || 'No phone number'}
        left={(props) => <List.Icon {...props} icon="account" />}
        onPress={() => navigation.navigate('ClientDetails', { clientId: item.id })}
      />
    )
  );

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="Clients" />
      </Appbar.Header>

      {isLoading && clients?.length === 0 ? (
        <ActivityIndicator animating={true} size="large" style={styles.loader} />
      ) : (
        <FlatList
          data={clients}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderClientItem}
          ListEmptyComponent={<Text style={styles.emptyText}>No clients found. Add one!</Text>}
          contentContainerStyle={clients?.length === 0 ? styles.emptyListContainer : {}}
        />
      )}

      <FAB style={styles.fab} icon="plus" onPress={handleAddNewClient} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loader: {
    marginTop: 20,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
  emptyListContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});

export default ClientListScreen;
