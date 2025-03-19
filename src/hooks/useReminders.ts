import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { useAppointmentRepository } from './useAppointmentRepository';
import { useClientRepository } from './useClientRepository';
import ReminderService from '../services/ReminderService';
import { addDays, format, parse } from 'date-fns';

export function useReminders() {
  const appointmentRepository = useAppointmentRepository();
  const clientRepository = useClientRepository();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isProcessingReminders, setIsProcessingReminders] = useState(false);
  const [lastProcessed, setLastProcessed] = useState<Date | null>(null);

  // Initialize the reminder service
  useEffect(() => {
    const initializeReminders = async () => {
      const initialized = await ReminderService.initialize();
      setIsInitialized(initialized);
    };

    initializeReminders();
  }, []);

  // Process reminders for upcoming appointments
  const processReminders = useCallback(async () => {
    if (!isInitialized || isProcessingReminders) return;

    try {
      setIsProcessingReminders(true);

      // Get all upcoming appointments
      const appointments = await appointmentRepository.getUpcoming();

      // Schedule local notifications
      const scheduledCount = await ReminderService.scheduleAppointmentReminders(appointments);

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
                `SMS reminder sent to ${client.firstName} ${client.lastName} (${client.phoneNumber}) for appointment ID ${appointment.id}`
              );
            }
          }

          // Send email if email available
          if (client.email) {
            const emailSent = await ReminderService.sendEmailReminder(appointment, client.email);
            if (emailSent) {
              reminderSent = true;
              await ReminderService.logReminderActivity(
                `Email reminder sent to ${client.firstName} ${client.lastName} (${client.email}) for appointment ID ${appointment.id}`
              );
            }
          }

          // Mark appointment as having had reminders sent
          if (reminderSent) {
            await appointmentRepository.markReminderSent(appointment.id);
          }
        }
      }

      // Update last processed time
      setLastProcessed(new Date());

      return {
        scheduledNotifications: scheduledCount,
        remindersSent: tomorrowAppointments.length,
      };
    } catch (error) {
      console.error('Error processing reminders:', error);
      return {
        scheduledNotifications: 0,
        remindersSent: 0,
        error,
      };
    } finally {
      setIsProcessingReminders(false);
    }
  }, [isInitialized, isProcessingReminders, appointmentRepository, clientRepository]);

  // Send a manual reminder for a specific appointment
  const sendManualReminder = useCallback(
    async (appointmentId: string) => {
      if (!isInitialized) {
        Alert.alert('Error', 'Reminder system is not initialized');
        return false;
      }

      try {
        // Get appointment with details
        const appointment = await appointmentRepository.getAppointmentWithDetails(appointmentId);

        if (!appointment) {
          Alert.alert('Error', 'Appointment not found');
          return false;
        }

        // Get client details
        const client = await clientRepository.getById(appointment.clientId);

        if (!client) {
          Alert.alert('Error', 'Client not found');
          return false;
        }

        let reminderSent = false;

        // Send SMS if phone number available
        if (client.phoneNumber) {
          const smsSent = await ReminderService.sendSMSReminder(appointment, client.phoneNumber);
          if (smsSent) {
            reminderSent = true;
          }
        }

        // Send email if email available
        if (client.email) {
          const emailSent = await ReminderService.sendEmailReminder(appointment, client.email);
          if (emailSent) {
            reminderSent = true;
          }
        }

        // Mark appointment as having had reminders sent
        if (reminderSent) {
          await appointmentRepository.markReminderSent(appointmentId);
          await ReminderService.logReminderActivity(
            `Manual reminder sent for ${client.firstName} ${client.lastName} appointment ID ${appointmentId}`
          );

          Alert.alert(
            'Reminder Sent',
            `A reminder has been sent to ${client.firstName} ${client.lastName}`
          );

          return true;
        } else {
          Alert.alert(
            'Reminder Not Sent',
            'Client does not have phone number or email for sending reminders'
          );
          return false;
        }
      } catch (error) {
        console.error('Error sending manual reminder:', error);
        Alert.alert('Error', 'Failed to send reminder');
        return false;
      }
    },
    [isInitialized, appointmentRepository, clientRepository]
  );

  return {
    isInitialized,
    isProcessingReminders,
    lastProcessed,
    processReminders,
    sendManualReminder,
  };
}
