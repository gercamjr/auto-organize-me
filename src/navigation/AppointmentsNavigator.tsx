import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { IconButton } from 'react-native-paper';
import { useTheme } from 'react-native-paper';

// Import screens (we'll create these next)
import AppointmentListScreen from '../screens/appointment/AppointmentListScreen';
import AppointmentDetailsScreen from '../screens/appointment/AppointmentDetailsScreen';
import AddEditAppointmentScreen from '../screens/appointment/AddEditAppointmentScreen';
import AppointmentCalendarScreen from '../screens/appointment/AppointmentCalendarScreen';

// Define the appointments stack parameter list
export type AppointmentsStackParamList = {
  AppointmentList: undefined;
  AppointmentCalendar: undefined;
  AppointmentDetails: { appointmentId: string };
  AddEditAppointment: {
    appointmentId?: string;
    clientId?: string;
    vehicleId?: string;
    initialDate?: string;
  };
};

const Stack = createStackNavigator<AppointmentsStackParamList>();

/**
 * Appointments navigator containing all appointment-related screens
 */
const AppointmentsNavigator: React.FC = () => {
  const theme = useTheme();

  return (
    <Stack.Navigator
      initialRouteName="AppointmentList"
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
        name="AppointmentList"
        component={AppointmentListScreen}
        options={({ navigation }) => ({
          title: 'Appointments',
          headerRight: () => (
            <IconButton
              icon="calendar"
              iconColor={theme.colors.onPrimary}
              size={24}
              onPress={() => navigation.navigate('AppointmentCalendar')}
            />
          ),
        })}
      />
      <Stack.Screen
        name="AppointmentCalendar"
        component={AppointmentCalendarScreen}
        options={({ navigation }) => ({
          title: 'Appointment Calendar',
          headerRight: () => (
            <IconButton
              icon="plus"
              iconColor={theme.colors.onPrimary}
              size={24}
              onPress={() => navigation.navigate('AddEditAppointment', {})}
            />
          ),
        })}
      />
      <Stack.Screen
        name="AppointmentDetails"
        component={AppointmentDetailsScreen}
        options={({ navigation, route }) => ({
          title: 'Appointment Details',
          headerRight: () => (
            <IconButton
              icon="pencil"
              iconColor={theme.colors.onPrimary}
              size={24}
              onPress={() => {
                const appointmentId = route.params?.appointmentId;
                if (appointmentId) {
                  navigation.navigate('AddEditAppointment', { appointmentId });
                }
              }}
            />
          ),
        })}
      />
      <Stack.Screen
        name="AddEditAppointment"
        component={AddEditAppointmentScreen}
        options={({ route }) => ({
          title: route.params?.appointmentId ? 'Edit Appointment' : 'New Appointment',
        })}
      />
    </Stack.Navigator>
  );
};

export default AppointmentsNavigator;
