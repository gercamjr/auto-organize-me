import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';

// Import screens and navigators
//import DashboardScreen from '../screens/dashboard/DashboardScreen';
import ClientsNavigator from './ClientsNavigator';
import VehiclesNavigator from './VehiclesNavigator';
import JobsNavigator from './JobsNavigator';
import InvoicesNavigator from './InvoicesNavigator';
import AppointmentsNavigator from './AppointmentsNavigator';
//import SettingsScreen from '../screens/settings/SettingsScreen';

// Define the main tab parameter list
export type MainTabParamList = {
  Dashboard: undefined;
  Clients: undefined;
  Vehicles: undefined;
  Jobs: undefined;
  Invoices: undefined;
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
        tabBarIcon: ({ color, size }) => {
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
            case 'Invoices':
              iconName = 'file-document';
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

          return (
            <MaterialCommunityIcons
              name={iconName as keyof typeof MaterialCommunityIcons.glyphMap}
              size={size}
              color={color}
            />
          );
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
      <Tab.Screen name="Jobs" component={JobsNavigator} />
      <Tab.Screen name="Invoices" component={InvoicesNavigator} />
      <Tab.Screen name="Appointments" component={AppointmentsNavigator} />
      {/* <Tab.Screen name="Settings" component={SettingsScreen} /> */}
    </Tab.Navigator>
  );
};
