import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';

// Import navigators
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';

// Define the root stack parameter list
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

/**
 * Root navigator that controls authentication flow
 */
export const RootNavigator: React.FC = () => {
  const { isLoading, isAuthenticated } = useAuth();

  // Show loading screen while checking auth state
  if (isLoading) {
    return null; // Or a custom loading component
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        // Auth screens when not logged in
        <Stack.Screen name="Auth" component={AuthNavigator} />
      ) : (
        // Main app screens when logged in
        <Stack.Screen name="Main" component={MainNavigator} />
      )}
    </Stack.Navigator>
  );
};
