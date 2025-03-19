import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import ReminderService from './ReminderService';
import { addDays, parse } from 'date-fns';

// Define background task name
const BACKGROUND_REMINDER_TASK = 'background-reminder-task';

// Register the task
TaskManager.defineTask(BACKGROUND_REMINDER_TASK, async () => {
  try {
    // This is a simple implementation. In a production app, you'd want to:
    // 1. Use a more robust dependency injection pattern
    // 2. Handle database connections more carefully
    // 3. Implement more sophisticated error handling and retry logic

    // Since hooks can't be used directly in background tasks, we need to create
    // instances of the repositories. This is a simplified approach.
    const appointmentRepository = {
      getUpcoming: async () => {
        // Implementation would depend on how your database is accessed
        // For demo purposes, we'll return an empty array
        return [];
      },
      markReminderSent: async (id: string) => {
        // Implementation would depend on how your database is accessed
        return true;
      },
      getAppointmentWithDetails: async (id: string) => {
        // Implementation would depend on how your database is accessed
        return null;
      },
    };

    const clientRepository = {
      getById: async (id: string) => {
        // Implementation would depend on how your database is accessed
        return null;
      },
    };

    // Get all upcoming appointments
    const appointments = await appointmentRepository.getUpcoming();

    // Schedule local notifications
    await ReminderService.scheduleAppointmentReminders(appointments);

    // Process SMS/email reminders for appointments the next day
    const tomorrow = addDays(new Date(), 1);
    const tomorrowAppointments = appointments.filter((appointment) => {
      const appointmentDate = parse(appointment.scheduledDate);
      const appointmentDateOnly = new Date(
        appointmentDate.getFullYear(),
        appointmentDate.getMonth(),
        appointmentDate.getDate()
      );
      const tomorrowDateOnly = new Date(
        tomorrow.getFullYear(),
        tomorrow.getMonth(),
        tomorrow.getDate()
      );

      return (
        appointmentDateOnly.getTime() === tomorrowDateOnly.getTime() &&
        appointment.status !== 'canceled' &&
        !appointment.reminderSent
      );
    });

    let remindersSent = 0;

    // Send reminders for tomorrow's appointments if they haven't already been sent
    for (const appointment of tomorrowAppointments) {
      // Get client details to send reminders
      const client = await clientRepository.getById(appointment.clientId);

      if (client) {
        let reminderSent = false;

        // Send SMS if phone number available
        if (client.phoneNumber) {
          const smsSent = await ReminderService.sendSMSReminder(appointment, client.phoneNumber);
          if (smsSent) {
            reminderSent = true;
            await ReminderService.logReminderActivity(
              `Background SMS reminder sent to ${client.firstName} ${client.lastName} (${client.phoneNumber}) for appointment ID ${appointment.id}`
            );
          }
        }

        // Send email if email available
        if (client.email) {
          const emailSent = await ReminderService.sendEmailReminder(appointment, client.email);
          if (emailSent) {
            reminderSent = true;
            await ReminderService.logReminderActivity(
              `Background email reminder sent to ${client.firstName} ${client.lastName} (${client.email}) for appointment ID ${appointment.id}`
            );
          }
        }

        // Mark appointment as having had reminders sent
        if (reminderSent) {
          await appointmentRepository.markReminderSent(appointment.id);
          remindersSent++;
        }
      }
    }

    if (remindersSent > 0 || appointments.length > 0) {
      // If we sent reminders or scheduled notifications, consider the task successful
      return BackgroundFetch.BackgroundFetchResult.NewData;
    } else {
      // If no reminders were needed, consider the task completed but no new data
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }
  } catch (error) {
    console.error('Error in background reminder task:', error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

class BackgroundReminderService {
  // Register background fetch task
  static async registerBackgroundTask() {
    try {
      await BackgroundFetch.registerTaskAsync(BACKGROUND_REMINDER_TASK, {
        minimumInterval: 60 * 60, // 1 hour (in seconds)
        stopOnTerminate: false,
        startOnBoot: true,
      });

      console.log('Background reminder task registered');
      return true;
    } catch (error) {
      console.error('Error registering background reminder task:', error);
      return false;
    }
  }

  // Unregister the task
  static async unregisterBackgroundTask() {
    try {
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_REMINDER_TASK);
      console.log('Background reminder task unregistered');
      return true;
    } catch (error) {
      console.error('Error unregistering background reminder task:', error);
      return false;
    }
  }

  // Check if task is registered
  static async isTaskRegistered() {
    const status = await BackgroundFetch.getStatusAsync();
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_REMINDER_TASK);

    return {
      status,
      isRegistered,
    };
  }
}

export default BackgroundReminderService;
