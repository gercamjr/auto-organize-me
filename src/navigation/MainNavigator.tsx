import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';

// Import screens (we'll create placeholders for now)
//import DashboardScreen from '../screens/dashboard/DashboardScreen';
import ClientsNavigator from './ClientsNavigator';
import VehiclesNavigator from './VehiclesNavigator';
//import JobsNavigator from './JobsNavigator';
//import AppointmentsNavigator from './AppointmentsNavigator';
//import SettingsScreen from '../screens/settings/SettingsScreen';

// Define the main tab parameter list
export type MainTabParamList = {
  Dashboard: undefined;
  Clients: undefined;
  Vehicles: undefined;
  Jobs: undefined;
  Appointments: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

/**
 * Main navigator containing the primary tab navigation
 */
export const MainNavigator: React.FC = () => {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          // Define icons for each tab
          switch (route.name) {
            case 'Dashboard':
              iconName = 'view-dashboard';
              break;
            case 'Clients':
              iconName = 'account-group';
              break;
            case 'Vehicles':
              iconName = 'car';
              break;
            case 'Jobs':
              iconName = 'wrench';
              break;
            case 'Appointments':
              iconName = 'calendar';
              break;
            case 'Settings':
              iconName = 'cog';
              break;
            default:
              iconName = 'help-circle';
          }

          return <MaterialCommunityIcons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceDisabled,
        tabBarLabelStyle: {
          fontSize: 12,
        },
        tabBarStyle: {
          height: 60,
          paddingBottom: 5,
        },
        headerShown: false,
      })}
    >
      {/* <Tab.Screen name="Dashboard" component={DashboardScreen} /> */}
      <Tab.Screen name="Clients" component={ClientsNavigator} />
      <Tab.Screen name="Vehicles" component={VehiclesNavigator} />
      {/* <Tab.Screen name="Jobs" component={JobsNavigator} />
      <Tab.Screen name="Appointments" component={AppointmentsNavigator} />
      <Tab.Screen name="Settings" component={SettingsScreen} /> */}
    </Tab.Navigator>
  );
};
