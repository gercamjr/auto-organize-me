import { AppointmentListItem } from '../hooks/useAppointmentRepository';
import * as Notifications from 'expo-notifications';
import { isToday, isTomorrow, parse, addHours } from 'date-fns';
import * as ExpoFileSystem from 'expo-file-system';
import { FileSystem } from 'react-native-file-access';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class ReminderService {
  // Initialize the service
  static async initialize() {
    // Request permissions
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      console.warn('Notification permissions not granted');
      return false;
    }

    return true;
  }

  // Schedule appointment reminders
  static async scheduleAppointmentReminders(appointments: AppointmentListItem[]) {
    // Cancel existing reminders first
    await Notifications.cancelAllScheduledNotificationsAsync();

    // Filter to only upcoming appointments
    const now = new Date();
    const upcomingAppointments = appointments.filter((appointment) => {
      const appointmentDate = parse(appointment.scheduledDate);
      return (
        appointmentDate > now && !['canceled', 'no-show', 'completed'].includes(appointment.status)
      );
    });

    // Schedule notifications for each upcoming appointment
    for (const appointment of upcomingAppointments) {
      await this.scheduleAppointmentReminder(appointment);
    }

    return upcomingAppointments.length;
  }

  // Schedule a reminder for a single appointment
  static async scheduleAppointmentReminder(appointment: AppointmentListItem) {
    const appointmentDate = parse(appointment.scheduledDate);

    // Create notification for day before
    if (!isToday(appointmentDate) && !isTomorrow(appointmentDate)) {
      const dayBeforeDate = new Date(appointmentDate);
      dayBeforeDate.setDate(dayBeforeDate.getDate() - 1);
      dayBeforeDate.setHours(9, 0, 0); // 9:00 AM the day before

      if (dayBeforeDate > new Date()) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Appointment Tomorrow',
            body: `You have an appointment with ${appointment.clientName} tomorrow at ${new Date(appointment.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
            data: { appointmentId: appointment.id },
          },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: dayBeforeDate },
        });
      }
    }

    // Create notification for same day (2 hours before)
    const twoHoursBefore = addHours(appointmentDate, -2);

    if (twoHoursBefore > new Date()) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Upcoming Appointment',
          body: `Reminder: Appointment with ${appointment.clientName} in 2 hours`,
          data: { appointmentId: appointment.id },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: twoHoursBefore },
      });
    }

    return true;
  }

  // Send a reminder SMS (simulated)
  static async sendSMSReminder(
    appointment: AppointmentListItem,
    phoneNumber: string
  ): Promise<boolean> {
    // In a real app, this would integrate with an SMS API
    // For now, we'll just log it and simulate successful sending
    console.log(
      `SIMULATED SMS to ${phoneNumber}: Reminder for your appointment on ${new Date(appointment.scheduledDate).toLocaleDateString()} at ${new Date(appointment.scheduledDate).toLocaleTimeString()}`
    );

    // Simulate sending success
    return true;
  }

  // Send a reminder email (simulated)
  static async sendEmailReminder(
    appointment: AppointmentListItem,
    email: string
  ): Promise<boolean> {
    // In a real app, this would integrate with an email API
    // For now, we'll just log it and simulate successful sending
    console.log(
      `SIMULATED EMAIL to ${email}: Reminder for your appointment on ${new Date(appointment.scheduledDate).toLocaleDateString()} at ${new Date(appointment.scheduledDate).toLocaleTimeString()}`
    );

    // Simulate sending success
    return true;
  }

  // Log reminder activity to a file for debugging/auditing
  static async logReminderActivity(message: string) {
    try {
      const logDir = `${ExpoFileSystem.documentDirectory}logs/`;
      const dirInfo = await ExpoFileSystem.getInfoAsync(logDir);

      // Create log directory if it doesn't exist
      if (!dirInfo.exists) {
        await ExpoFileSystem.makeDirectoryAsync(logDir, { intermediates: true });
      }

      // Get today's date in YYYY-MM-DD format for log filename
      const today = new Date().toISOString().split('T')[0];
      const logFile = `${logDir}reminders-${today}.log`;

      // Get timestamp
      const timestamp = new Date().toISOString();
      const logEntry = `[${timestamp}] ${message}\n`;

      // Append to log file
      await FileSystem.appendFile(logFile, logEntry, 'utf8');

      return true;
    } catch (error) {
      console.error('Error logging reminder activity:', error);
      return false;
    }
  }
}

export default ReminderService;
