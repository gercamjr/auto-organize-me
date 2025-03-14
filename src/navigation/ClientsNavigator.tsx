import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { IconButton } from 'react-native-paper';
import { useTheme } from 'react-native-paper';

// Import screens (we'll create placeholders for now)
import ClientListScreen from '../screens/client/ClientListScreen';
import ClientDetailsScreen from '../screens/client/ClientDetailsScreen';
import AddEditClientScreen from '../screens/client/AddEditClientScreen';
import ClientVehiclesScreen from '../screens/client/ClientVehiclesScreen';

// Define the clients stack parameter list
export type ClientsStackParamList = {
  ClientList: undefined;
  ClientDetails: { clientId: string };
  AddEditClient: { clientId?: string }; // Optional ID for editing
  ClientVehicles: { clientId: string };
};

const Stack = createStackNavigator<ClientsStackParamList>();

/**
 * Clients navigator containing all client-related screens
 */
const ClientsNavigator: React.FC = () => {
  const theme = useTheme();

  return (
    <Stack.Navigator
      initialRouteName="ClientList"
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: theme.colors.onPrimary,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="ClientList"
        component={ClientListScreen}
        options={({ navigation }) => ({
          title: 'Clients',
          headerRight: () => (
            <IconButton
              icon="plus"
              iconColor={theme.colors.onPrimary}
              size={24}
              onPress={() => navigation.navigate('AddEditClient', {})}
            />
          ),
        })}
      />
      <Stack.Screen
        name="ClientDetails"
        component={ClientDetailsScreen}
        options={({ navigation }) => ({
          title: 'Client Details',
          headerRight: () => (
            <IconButton
              icon="pencil"
              iconColor={theme.colors.onPrimary}
              size={24}
              onPress={() => {
                // Access the params from navigation state
                const clientId = navigation
                  .getState()
                  .routes.find((route) => route.name === 'ClientDetails')?.params?.clientId;

                if (clientId) {
                  navigation.navigate('AddEditClient', { clientId });
                }
              }}
            />
          ),
        })}
      />
      <Stack.Screen
        name="AddEditClient"
        component={AddEditClientScreen}
        options={({ route }) => ({
          title: route.params.clientId ? 'Edit Client' : 'Add Client',
        })}
      />
      <Stack.Screen
        name="ClientVehicles"
        component={ClientVehiclesScreen}
        options={{
          title: 'Client Vehicles',
        }}
      />
    </Stack.Navigator>
  );
};

export default ClientsNavigator;
