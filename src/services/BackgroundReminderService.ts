import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import * as SQLite from 'expo-sqlite';
import ReminderService from './ReminderService';
import { addDays, isAfter, isBefore } from 'date-fns';

// Define types for appointment data
interface AppointmentWithDetails {
  id: string;
  clientId: string;
  vehicleId: string;
  scheduledDate: string;
  duration: number;
  status: 'scheduled' | 'confirmed' | 'completed' | 'canceled' | 'no-show';
  isHomeVisit: boolean;
  locationAddress?: string;
  reminderSent: boolean;
  clientName: string;
  phoneNumber?: string;
  email?: string;
  vehicleInfo: string;
}

// Define background task name
const BACKGROUND_REMINDER_TASK = 'background-reminder-task';

// SQLite database connection helper
const getDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
  try {
    return await SQLite.openDatabaseAsync('auto_organize_me.db');
  } catch (err) {
    console.error('Error opening database:', err);
    throw err;
  }
};

// Helper function to query database
const executeQuery = async <T>(
  db: SQLite.SQLiteDatabase,
  query: string,
  params: (string | number | null)[] = []
): Promise<T[]> => {
  try {
    return await db.getAllAsync<T>(query, ...params);
  } catch (err) {
    console.error('Error executing query:', err);
    throw err;
  }
};

// Register the task
TaskManager.defineTask(
  BACKGROUND_REMINDER_TASK,
  async (): Promise<BackgroundFetch.BackgroundFetchResult> => {
    try {
      // Open database connection
      const db = await getDatabase();

      // Query upcoming appointments
      const now = new Date().toISOString();
      const upcomingAppointments = await executeQuery<AppointmentWithDetails>(
        db,
        `
      SELECT 
        a.id, a.clientId, a.vehicleId, a.scheduledDate, a.duration, a.status, a.isHomeVisit, 
        a.locationAddress, a.reminderSent,
        c.firstName || ' ' || c.lastName as clientName,
        c.phoneNumber, c.email,
        v.year || ' ' || v.make || ' ' || v.model as vehicleInfo
      FROM appointments a
      JOIN clients c ON a.clientId = c.id
      JOIN vehicles v ON a.vehicleId = v.id
      WHERE a.scheduledDate >= ? AND a.status NOT IN ('completed', 'canceled', 'no-show')
      ORDER BY a.scheduledDate ASC
      `,
        [now]
      );

      // Process appointments for local notifications
      await ReminderService.scheduleAppointmentReminders(upcomingAppointments);

      // Find appointments that need reminders sent
      const tomorrow = addDays(new Date(), 1);
      const tomorrowStart = new Date(
        tomorrow.getFullYear(),
        tomorrow.getMonth(),
        tomorrow.getDate()
      );
      const tomorrowEnd = new Date(tomorrowStart);
      tomorrowEnd.setHours(23, 59, 59, 999);

      const tomorrowAppointments = upcomingAppointments.filter((appointment) => {
        const appointmentDate = new Date(appointment.scheduledDate);
        return (
          isAfter(appointmentDate, tomorrowStart) &&
          isBefore(appointmentDate, tomorrowEnd) &&
          !appointment.reminderSent
        );
      });

      let remindersSent = 0;

      // Send reminders for tomorrow's appointments
      for (const appointment of tomorrowAppointments) {
        let reminderSent = false;

        // Send SMS if phone number available
        if (appointment.phoneNumber) {
          const smsSent = await ReminderService.sendSMSReminder(
            appointment,
            appointment.phoneNumber
          );
          if (smsSent) {
            reminderSent = true;
            await ReminderService.logReminderActivity(
              `Background SMS reminder sent to ${appointment.clientName} (${appointment.phoneNumber}) for appointment ID ${appointment.id}`
            );
          }
        }

        // Send email if email available
        if (appointment.email) {
          const emailSent = await ReminderService.sendEmailReminder(appointment, appointment.email);
          if (emailSent) {
            reminderSent = true;
            await ReminderService.logReminderActivity(
              `Background email reminder sent to ${appointment.clientName} (${appointment.email}) for appointment ID ${appointment.id}`
            );
          }
        }

        // Mark appointment as having had reminders sent
        if (reminderSent) {
          await db.runAsync(
            `UPDATE appointments SET reminderSent = 1, updatedAt = ? WHERE id = ?`,
            [new Date().toISOString(), appointment.id]
          );
          remindersSent++;
        }
      }

      // Also handle overdue appointments if needed
      const overdueAppointments = await executeQuery<{ id: string; status: string }>(
        db,
        `
      SELECT id, status 
      FROM appointments
      WHERE scheduledDate < ? AND status = 'scheduled'
      `,
        [now]
      );

      // Mark overdue appointments
      if (overdueAppointments.length > 0) {
        for (const appointment of overdueAppointments) {
          await db.runAsync(
            `UPDATE appointments SET status = 'no-show', updatedAt = ? WHERE id = ?`,
            [new Date().toISOString(), appointment.id]
          );
        }
      }

      // Close database connection
      db.closeAsync();

      if (remindersSent > 0 || upcomingAppointments.length > 0 || overdueAppointments.length > 0) {
        // If we sent reminders or scheduled notifications, or updated statuses
        return BackgroundFetch.BackgroundFetchResult.NewData;
      } else {
        // If no reminders were needed, consider the task completed but no new data
        return BackgroundFetch.BackgroundFetchResult.NoData;
      }
    } catch (error) {
      console.error('Error in background reminder task:', error);
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }
  }
);

class BackgroundReminderService {
  // Register background fetch task
  static async registerBackgroundTask(): Promise<boolean> {
    try {
      // First check if it's already registered
      const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_REMINDER_TASK);

      if (isRegistered) {
        // If it's already registered, we might want to update it
        await BackgroundFetch.unregisterTaskAsync(BACKGROUND_REMINDER_TASK);
      }

      await BackgroundFetch.registerTaskAsync(BACKGROUND_REMINDER_TASK, {
        minimumInterval: 60 * 60, // 1 hour (in seconds)
        stopOnTerminate: false, // Continue running after app has been closed
        startOnBoot: true, // Start the task when the device reboots
      });

      console.log('Background reminder task registered');
      return true;
    } catch (error) {
      console.error('Error registering background reminder task:', error);
      return false;
    }
  }

  // Unregister the task
  static async unregisterBackgroundTask(): Promise<boolean> {
    try {
      const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_REMINDER_TASK);

      if (isRegistered) {
        await BackgroundFetch.unregisterTaskAsync(BACKGROUND_REMINDER_TASK);
        console.log('Background reminder task unregistered');
      }
      return true;
    } catch (error) {
      console.error('Error unregistering background reminder task:', error);
      return false;
    }
  }

  // Check if task is registered
  static async isTaskRegistered(): Promise<{
    status: BackgroundFetch.BackgroundFetchStatus | null;
    isRegistered: boolean;
  }> {
    try {
      const status = await BackgroundFetch.getStatusAsync();
      const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_REMINDER_TASK);

      return {
        status,
        isRegistered,
      };
    } catch (error) {
      console.error('Error checking task registration:', error);
      return {
        status: null,
        isRegistered: false,
      };
    }
  }

  // Run the task manually (useful for testing)
  static async runTaskManually(): Promise<BackgroundFetch.BackgroundFetchResult | null> {
    try {
      const task = await TaskManager.getTaskAsync(BACKGROUND_REMINDER_TASK);
      if (task) {
        const result = await task.taskExecutor();
        return result as BackgroundFetch.BackgroundFetchResult;
      }
      return null;
    } catch (error) {
      console.error('Error running task manually:', error);
      return null;
    }
  }
}

export default BackgroundReminderService;
