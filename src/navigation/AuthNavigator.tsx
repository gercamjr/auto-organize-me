import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';

// Import screens (we'll create placeholders for now)
import LoginScreen from '../screens/auth/LoginScreen';
import SetupPinScreen from '../screens/auth/SetupPinScreen';

// Define the auth stack parameter list
export type AuthStackParamList = {
  Login: undefined;
  SetupPin: undefined;
};

const Stack = createStackNavigator<AuthStackParamList>();

/**
 * Auth navigator containing login and registration screens
 */
export const AuthNavigator: React.FC = () => {
  const { hasPin } = useAuth();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: 'white' },
      }}
      initialRouteName={hasPin ? 'Login' : 'SetupPin'}
    >
      {hasPin ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : (
        <Stack.Screen name="SetupPin" component={SetupPinScreen} />
      )}
    </Stack.Navigator>
  );
};
