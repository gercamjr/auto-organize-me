import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import AppLoading from 'expo-app-loading';

// Import database service to initialize on app startup
import { initDatabase } from './src/database/database';

// Import navigation
import { RootNavigator } from './src/navigation/RootNavigator';

// Import theme
import { theme } from './src/utils/theme';

// Import context providers
import { AuthProvider } from './src/contexts/AuthContext';
import { DatabaseProvider } from './src/contexts/DatabaseContext';

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [dbInitError, setDbInitError] = useState<Error | null>(null);

  // Initialize the database when the app starts
  useEffect(() => {
    const prepareApp = async () => {
      try {
        // Initialize database
        await initDatabase();
        setIsReady(true);
      } catch (error) {
        console.error('Failed to initialize the app:', error);
        setDbInitError(error instanceof Error ? error : new Error('Unknown error'));
        setIsReady(true);
      }
    };

    prepareApp();
  }, []);

  if (!isReady) {
    return <AppLoading />;
  }

  // Handle database initialization error
  if (dbInitError) {
    // In a real app, you'd want to show a more user-friendly error screen
    console.error('Database initialization error:', dbInitError);
    // Continue anyway, the DatabaseProvider might handle reconnection
  }

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <NavigationContainer>
          <AuthProvider>
            <DatabaseProvider>
              <StatusBar style="auto" />
              <RootNavigator />
            </DatabaseProvider>
          </AuthProvider>
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
