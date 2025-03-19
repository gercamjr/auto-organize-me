import { useState, useEffect, useCallback } from 'react';
import BackgroundReminderService from '../services/BackgroundReminderService';
import { Alert, AppState, AppStateStatus } from 'react-native';
import * as BackgroundFetch from 'expo-background-fetch';

/**
 * Hook to manage background reminders at the application level
 */
export function useBackgroundReminders() {
  const [isRegistered, setIsRegistered] = useState<boolean>(false);
  const [status, setStatus] = useState<BackgroundFetch.BackgroundFetchStatus | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);

  // Get the current task status
  const checkTaskStatus = useCallback(async (): Promise<{
    status: BackgroundFetch.BackgroundFetchStatus | null;
    isRegistered: boolean;
  }> => {
    const result = await BackgroundReminderService.isTaskRegistered();
    setIsRegistered(result.isRegistered);
    setStatus(result.status);
    return result;
  }, []);

  // Register the background task
  const registerTask = useCallback(async (): Promise<boolean> => {
    setIsInitializing(true);
    try {
      const success = await BackgroundReminderService.registerBackgroundTask();
      if (success) {
        await checkTaskStatus();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error registering background task:', error);
      return false;
    } finally {
      setIsInitializing(false);
    }
  }, [checkTaskStatus]);

  // Unregister the background task
  const unregisterTask = useCallback(async (): Promise<boolean> => {
    setIsInitializing(true);
    try {
      const success = await BackgroundReminderService.unregisterBackgroundTask();
      if (success) {
        await checkTaskStatus();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error unregistering background task:', error);
      return false;
    } finally {
      setIsInitializing(false);
    }
  }, [checkTaskStatus]);

  // Run the task manually (for testing)
  const runTaskManually = useCallback(async (): Promise<boolean> => {
    try {
      const result = await BackgroundReminderService.runTaskManually();

      if (result === null) {
        Alert.alert('Error', 'Background task not registered or failed to run');
        return false;
      }

      Alert.alert(
        'Task Executed',
        `Task completed with result: ${
          result === BackgroundFetch.BackgroundFetchResult.NewData
            ? 'New Data'
            : result === BackgroundFetch.BackgroundFetchResult.NoData
              ? 'No Data'
              : 'Failed'
        }`
      );

      return true;
    } catch (error) {
      console.error('Error running task manually:', error);
      Alert.alert('Error', 'Failed to run background task');
      return false;
    }
  }, []);

  // Toggle task registration
  const toggleTaskRegistration = useCallback(async (): Promise<boolean> => {
    if (isRegistered) {
      return await unregisterTask();
    } else {
      return await registerTask();
    }
  }, [isRegistered, registerTask, unregisterTask]);

  // Initialize on first mount and check when app comes to foreground
  useEffect(() => {
    const initialize = async () => {
      setIsInitializing(true);
      await checkTaskStatus();
      setIsInitializing(false);
    };

    initialize();

    // Also check status when app comes to foreground
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        checkTaskStatus();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [checkTaskStatus]);

  return {
    isRegistered,
    status,
    isInitializing,
    registerTask,
    unregisterTask,
    toggleTaskRegistration,
    runTaskManually,
    checkTaskStatus,
  };
}

export default useBackgroundReminders;
