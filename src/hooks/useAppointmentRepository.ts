import { useSQLiteContext } from 'expo-sqlite';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

// Appointment model
export interface Appointment {
  id: string;
  clientId: string;
  vehicleId: string;
  scheduledDate: string; // ISO date string
  duration: number; // In minutes
  status: 'scheduled' | 'confirmed' | 'completed' | 'canceled' | 'no-show';
  isHomeVisit: boolean;
  locationAddress?: string;
  locationNotes?: string;
  notes?: string;
  reminderSent: boolean;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

// Appointment input for creating/updating
export interface AppointmentInput {
  clientId: string;
  vehicleId: string;
  scheduledDate: string;
  duration: number;
  status: 'scheduled' | 'confirmed' | 'completed' | 'canceled' | 'no-show';
  isHomeVisit: boolean;
  locationAddress?: string;
  locationNotes?: string;
  notes?: string;
  reminderSent?: boolean;
}

// Appointment list item (for displaying in lists)
export interface AppointmentListItem {
  id: string;
  clientId: string;
  clientName: string;
  vehicleId: string;
  vehicleInfo: string;
  scheduledDate: string;
  duration: number;
  status: 'scheduled' | 'confirmed' | 'completed' | 'canceled' | 'no-show';
  isHomeVisit: boolean;
  locationAddress?: string;
  reminderSent: boolean;
}

/**
 * Hook for appointment-related database operations
 */
export function useAppointmentRepository() {
  const db = useSQLiteContext();

  /**
   * Get all appointments
   */
  const getAll = async (): Promise<AppointmentListItem[]> => {
    return db.getAllAsync<AppointmentListItem>(`
      SELECT 
        a.id, a.clientId, a.vehicleId, a.scheduledDate, a.duration, a.status, a.isHomeVisit, a.locationAddress,
        c.firstName || ' ' || c.lastName as clientName,
        v.year || ' ' || v.make || ' ' || v.model as vehicleInfo
      FROM appointments a
      JOIN clients c ON a.clientId = c.id
      JOIN vehicles v ON a.vehicleId = v.id
      ORDER BY a.scheduledDate ASC
    `);
  };

  /**
   * Get appointments for a specific day
   */
  const getByDate = async (date: Date): Promise<AppointmentListItem[]> => {
    // Format the date as ISO string and extract just the date part
    const dateStr = date.toISOString().split('T')[0];

    return db.getAllAsync<AppointmentListItem>(
      `
      SELECT 
        a.id, a.clientId, a.vehicleId, a.scheduledDate, a.duration, a.status, a.isHomeVisit, a.locationAddress,
        c.firstName || ' ' || c.lastName as clientName,
        v.year || ' ' || v.make || ' ' || v.model as vehicleInfo
      FROM appointments a
      JOIN clients c ON a.clientId = c.id
      JOIN vehicles v ON a.vehicleId = v.id
      WHERE date(a.scheduledDate) = date(?)
      ORDER BY a.scheduledDate ASC
    `,
      dateStr
    );
  };

  /**
   * Get appointments for a specific week
   */
  const getByWeek = async (date: Date): Promise<AppointmentListItem[]> => {
    // Get the start of the week (Sunday)
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());

    // Get the end of the week (Saturday)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    // Format dates
    const startDateStr = startOfWeek.toISOString();
    const endDateStr = endOfWeek.toISOString();

    return db.getAllAsync<AppointmentListItem>(
      `
      SELECT 
        a.id, a.clientId, a.vehicleId, a.scheduledDate, a.duration, a.status, a.isHomeVisit, a.locationAddress,
        c.firstName || ' ' || c.lastName as clientName,
        v.year || ' ' || v.make || ' ' || v.model as vehicleInfo
      FROM appointments a
      JOIN clients c ON a.clientId = c.id
      JOIN vehicles v ON a.vehicleId = v.id
      WHERE a.scheduledDate >= ? AND a.scheduledDate <= ?
      ORDER BY a.scheduledDate ASC
    `,
      startDateStr,
      endDateStr
    );
  };

  /**
   * Get appointments for a specific client
   */
  const getByClientId = async (clientId: string): Promise<AppointmentListItem[]> => {
    return db.getAllAsync<AppointmentListItem>(
      `
      SELECT 
        a.id, a.clientId, a.vehicleId, a.scheduledDate, a.duration, a.status, a.isHomeVisit, a.locationAddress,
        c.firstName || ' ' || c.lastName as clientName,
        v.year || ' ' || v.make || ' ' || v.model as vehicleInfo
      FROM appointments a
      JOIN clients c ON a.clientId = c.id
      JOIN vehicles v ON a.vehicleId = v.id
      WHERE a.clientId = ?
      ORDER BY a.scheduledDate ASC
    `,
      clientId
    );
  };

  /**
   * Get appointments for a specific vehicle
   */
  const getByVehicleId = async (vehicleId: string): Promise<AppointmentListItem[]> => {
    return db.getAllAsync<AppointmentListItem>(
      `
      SELECT 
        a.id, a.clientId, a.vehicleId, a.scheduledDate, a.duration, a.status, a.isHomeVisit, a.locationAddress,
        c.firstName || ' ' || c.lastName as clientName,
        v.year || ' ' || v.make || ' ' || v.model as vehicleInfo
      FROM appointments a
      JOIN clients c ON a.clientId = c.id
      JOIN vehicles v ON a.vehicleId = v.id
      WHERE a.vehicleId = ?
      ORDER BY a.scheduledDate ASC
    `,
      vehicleId
    );
  };

  /**
   * Get an appointment by ID
   */
  const getById = async (id: string): Promise<Appointment | null> => {
    const appointment = await db.getFirstAsync<Appointment>(
      `
      SELECT * FROM appointments 
      WHERE id = ?
    `,
      id
    );

    return appointment || null;
  };

  /**
   * Get an appointment with client and vehicle details
   */
  const getAppointmentWithDetails = async (id: string): Promise<AppointmentListItem | null> => {
    const appointment = await db.getFirstAsync<AppointmentListItem>(
      `
      SELECT 
        a.id, a.clientId, a.vehicleId, a.scheduledDate, a.duration, a.status, a.isHomeVisit, a.locationAddress,
        c.firstName || ' ' || c.lastName as clientName,
        v.year || ' ' || v.make || ' ' || v.model as vehicleInfo
      FROM appointments a
      JOIN clients c ON a.clientId = c.id
      JOIN vehicles v ON a.vehicleId = v.id
      WHERE a.id = ?
    `,
      id
    );

    return appointment || null;
  };

  /**
   * Get upcoming appointments
   */
  const getUpcoming = async (): Promise<AppointmentListItem[]> => {
    const now = new Date().toISOString();

    return db.getAllAsync<AppointmentListItem>(
      `
      SELECT 
        a.id, a.clientId, a.vehicleId, a.scheduledDate, a.duration, a.status, a.isHomeVisit, a.locationAddress,
        c.firstName || ' ' || c.lastName as clientName,
        v.year || ' ' || v.make || ' ' || v.model as vehicleInfo
      FROM appointments a
      JOIN clients c ON a.clientId = c.id
      JOIN vehicles v ON a.vehicleId = v.id
      WHERE a.scheduledDate >= ? AND a.status NOT IN ('completed', 'canceled', 'no-show')
      ORDER BY a.scheduledDate ASC
      LIMIT 10
    `,
      now
    );
  };

  /**
   * Create a new appointment
   */
  const create = async (input: AppointmentInput): Promise<Appointment> => {
    const now = new Date().toISOString();
    const id = uuidv4();

    const appointment: Appointment = {
      id,
      clientId: input.clientId,
      vehicleId: input.vehicleId,
      scheduledDate: input.scheduledDate,
      duration: input.duration,
      status: input.status,
      isHomeVisit: input.isHomeVisit,
      locationAddress: input.locationAddress,
      locationNotes: input.locationNotes,
      notes: input.notes,
      reminderSent: input.reminderSent || false,
      createdAt: now,
      updatedAt: now,
    };

    try {
      await db.withTransactionAsync(async () => {
        await db.runAsync(
          `
          INSERT INTO appointments (
            id, clientId, vehicleId, scheduledDate, duration, status,
            isHomeVisit, locationAddress, locationNotes, notes, reminderSent,
            createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
          appointment.id,
          appointment.clientId,
          appointment.vehicleId,
          appointment.scheduledDate,
          appointment.duration,
          appointment.status,
          appointment.isHomeVisit ? 1 : 0,
          appointment.locationAddress || null,
          appointment.locationNotes || null,
          appointment.notes || null,
          appointment.reminderSent ? 1 : 0,
          appointment.createdAt,
          appointment.updatedAt
        );
      });

      return appointment;
    } catch (error) {
      console.error('Error creating appointment:', error);
      throw error;
    }
  };

  /**
   * Update an existing appointment
   */
  const update = async (id: string, input: AppointmentInput): Promise<Appointment> => {
    // First check if appointment exists
    const existingAppointment = await getById(id);
    if (!existingAppointment) {
      throw new Error(`Appointment with ID ${id} not found`);
    }

    const now = new Date().toISOString();

    try {
      await db.withTransactionAsync(async () => {
        await db.runAsync(
          `
          UPDATE appointments 
          SET 
            clientId = ?, 
            vehicleId = ?, 
            scheduledDate = ?, 
            duration = ?, 
            status = ?,
            isHomeVisit = ?, 
            locationAddress = ?, 
            locationNotes = ?, 
            notes = ?,
            reminderSent = ?,
            updatedAt = ?
          WHERE id = ?
        `,
          input.clientId,
          input.vehicleId,
          input.scheduledDate,
          input.duration,
          input.status,
          input.isHomeVisit ? 1 : 0,
          input.locationAddress || null,
          input.locationNotes || null,
          input.notes || null,
          input.reminderSent !== undefined
            ? input.reminderSent
              ? 1
              : 0
            : existingAppointment.reminderSent
              ? 1
              : 0,
          now,
          id
        );
      });

      // Return the updated appointment
      const updatedAppointment = await getById(id);
      if (!updatedAppointment) {
        throw new Error('Failed to retrieve updated appointment');
      }

      return updatedAppointment;
    } catch (error) {
      console.error('Error updating appointment:', error);
      throw error;
    }
  };

  /**
   * Delete an appointment by ID
   */
  const deleteAppointment = async (id: string): Promise<boolean> => {
    try {
      await db.withTransactionAsync(async () => {
        await db.runAsync('DELETE FROM appointments WHERE id = ?', id);
      });
      return true;
    } catch (error) {
      console.error('Error deleting appointment:', error);
      return false;
    }
  };

  /**
   * Mark appointment reminder as sent
   */
  const markReminderSent = async (id: string): Promise<boolean> => {
    try {
      await db.withTransactionAsync(async () => {
        await db.runAsync(
          `
          UPDATE appointments 
          SET reminderSent = 1
          WHERE id = ?
        `,
          id
        );
      });
      return true;
    } catch (error) {
      console.error('Error marking reminder as sent:', error);
      return false;
    }
  };

  /**
   * Get count of appointments
   */
  const getCount = async (): Promise<number> => {
    const result = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM appointments'
    );
    return result?.count || 0;
  };

  /**
   * Get count of upcoming appointments
   */
  const getUpcomingCount = async (): Promise<number> => {
    const now = new Date().toISOString();
    const result = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM appointments 
       WHERE scheduledDate >= ? AND status NOT IN ('completed', 'canceled', 'no-show')`,
      now
    );
    return result?.count || 0;
  };

  /**
   * Check for appointment conflicts
   * Returns true if the time slot is available
   */
  const checkAvailability = async (
    scheduledDate: string,
    duration: number,
    excludeAppointmentId?: string
  ): Promise<boolean> => {
    const date = new Date(scheduledDate);
    const endTime = new Date(date.getTime() + duration * 60000);

    const endTimeStr = endTime.toISOString();

    const query = excludeAppointmentId
      ? `
        SELECT COUNT(*) as count FROM appointments
        WHERE id != ? AND 
              status NOT IN ('canceled', 'no-show') AND
              ((scheduledDate <= ? AND datetime(scheduledDate, '+' || duration || ' minutes') > ?) OR
               (scheduledDate < ? AND datetime(scheduledDate, '+' || duration || ' minutes') >= ?))
      `
      : `
        SELECT COUNT(*) as count FROM appointments
        WHERE status NOT IN ('canceled', 'no-show') AND
              ((scheduledDate <= ? AND datetime(scheduledDate, '+' || duration || ' minutes') > ?) OR
               (scheduledDate < ? AND datetime(scheduledDate, '+' || duration || ' minutes') >= ?))
      `;

    const params = excludeAppointmentId
      ? [excludeAppointmentId, scheduledDate, scheduledDate, endTimeStr, endTimeStr]
      : [scheduledDate, scheduledDate, endTimeStr, endTimeStr];

    const result = await db.getFirstAsync<{ count: number }>(query, ...params);

    return (result?.count || 0) === 0;
  };

  return {
    getAll,
    getByDate,
    getByWeek,
    getByClientId,
    getByVehicleId,
    getById,
    getAppointmentWithDetails,
    getUpcoming,
    create,
    update,
    delete: deleteAppointment,
    markReminderSent,
    getCount,
    getUpcomingCount,
    checkAvailability,
  };
}
