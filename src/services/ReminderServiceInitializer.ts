import * as Notifications from 'expo-notifications';
import BackgroundReminderService from './BackgroundReminderService';
import { NotificationPermissionsStatus } from 'expo-notifications';

/**
 * Initializes the reminder service and background tasks when the app starts
 */
class ReminderServiceInitializer {
  /**
   * Initialize everything needed for reminders to work
   */
  static async initialize(): Promise<boolean> {
    try {
      // First request notification permissions
      await this.requestNotificationPermissions();

      // Then check if background task is registered, register if not
      const taskStatus = await BackgroundReminderService.isTaskRegistered();

      if (!taskStatus.isRegistered) {
        await BackgroundReminderService.registerBackgroundTask();
      }

      // Run the task once manually to schedule immediate notifications
      await BackgroundReminderService.runTaskManually();

      return true;
    } catch (error) {
      console.error('Error initializing reminder service:', error);
      return false;
    }
  }

  /**
   * Request notification permissions
   */
  static async requestNotificationPermissions(): Promise<boolean> {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus: NotificationPermissionsStatus['status'] = existingStatus;

    // Only ask if permissions have not already been determined
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    // Configure notification handler
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    return finalStatus === 'granted';
  }
}

export default ReminderServiceInitializer;
