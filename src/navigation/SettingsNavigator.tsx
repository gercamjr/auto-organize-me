import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useTheme } from 'react-native-paper';

// Import screens
import SettingsScreen from '../screens/settings/SettingsScreen';
import ReminderSettingsScreen from '../screens/settings/ReminderSettingsScreen';

// Define the settings stack parameter list
export type SettingsStackParamList = {
  Settings: undefined;
  ReminderSettings: undefined;
};

const Stack = createStackNavigator<SettingsStackParamList>();

/**
 * Settings navigator containing all settings-related screens
 */
const SettingsNavigator: React.FC = () => {
  const theme = useTheme();

  return (
    <Stack.Navigator
      initialRouteName="Settings"
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
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Settings',
        }}
      />
      <Stack.Screen
        name="ReminderSettings"
        component={ReminderSettingsScreen}
        options={{
          title: 'Reminder Settings',
        }}
      />
    </Stack.Navigator>
  );
};

export default SettingsNavigator;
