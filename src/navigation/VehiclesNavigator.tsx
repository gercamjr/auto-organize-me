import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { IconButton } from 'react-native-paper';
import { useTheme } from 'react-native-paper';

// Import screens (we'll create these next)
import VehicleListScreen from '../screens/vehicle/VehicleListScreen';
import VehicleDetailsScreen from '../screens/vehicle/VehicleDetailsScreen';
import AddEditVehicleScreen from '../screens/vehicle/AddEditVehicleScreen';
import VehiclePhotosScreen from '../screens/vehicle/VehiclePhotosScreen';

// Define the vehicles stack parameter list
export type VehiclesStackParamList = {
  VehicleList: undefined;
  VehicleDetails: { vehicleId: string };
  AddEditVehicle: { vehicleId?: string; clientId?: string }; // Optional IDs for editing or pre-selecting client
  VehiclePhotos: { vehicleId: string };
};

const Stack = createStackNavigator<VehiclesStackParamList>();

/**
 * Vehicles navigator containing all vehicle-related screens
 */
const VehiclesNavigator: React.FC = () => {
  const theme = useTheme();

  return (
    <Stack.Navigator
      initialRouteName="VehicleList"
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
        name="VehicleList"
        component={VehicleListScreen}
        options={({ navigation }) => ({
          title: 'Vehicles',
          headerRight: () => (
            <IconButton
              icon="plus"
              iconColor={theme.colors.onPrimary}
              size={24}
              onPress={() => navigation.navigate('AddEditVehicle', {})}
            />
          ),
        })}
      />
      <Stack.Screen
        name="VehicleDetails"
        component={VehicleDetailsScreen}
        options={({ navigation, route }) => ({
          title: 'Vehicle Details',
          headerRight: () => (
            <IconButton
              icon="pencil"
              iconColor={theme.colors.onPrimary}
              size={24}
              onPress={() => {
                // Access the params from navigation state
                const vehicleId = route.params?.vehicleId;

                if (vehicleId) {
                  navigation.navigate('AddEditVehicle', { vehicleId });
                }
              }}
            />
          ),
        })}
      />
      <Stack.Screen
        name="AddEditVehicle"
        component={AddEditVehicleScreen}
        options={({ route }) => ({
          title: route.params?.vehicleId ? 'Edit Vehicle' : 'Add Vehicle',
        })}
      />
      <Stack.Screen
        name="VehiclePhotos"
        component={VehiclePhotosScreen}
        options={{
          title: 'Vehicle Photos',
        }}
      />
    </Stack.Navigator>
  );
};

export default VehiclesNavigator;
