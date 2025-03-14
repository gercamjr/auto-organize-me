import { useSQLiteContext } from 'expo-sqlite';
import { v4 as uuidv4 } from 'uuid';

// Client model
export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email?: string;
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  notes?: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

// Vehicle summary for client details
export interface VehicleSummary {
  id: string;
  make: string;
  model: string;
  year: number;
  licensePlate?: string;
  lastService?: string;
}

// Client input for creating/updating
export interface ClientInput {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email?: string;
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  notes?: string;
}

/**
 * Hook for client-related database operations
 */
export function useClientRepository() {
  const db = useSQLiteContext();

  /**
   * Get all clients
   */
  const getAll = async (): Promise<Client[]> => {
    return db.getAllAsync<Client>(`
      SELECT * FROM clients 
      ORDER BY lastName, firstName
    `);
  };

  /**
   * Get a client by ID
   */
  const getById = async (id: string): Promise<Client | null> => {
    const client = await db.getFirstAsync<Client>(
      `
      SELECT * FROM clients 
      WHERE id = ?
    `,
      id
    );

    return client || null;
  };

  /**
   * Search clients by name or phone
   */
  const search = async (searchTerm: string): Promise<Client[]> => {
    const term = `%${searchTerm}%`;

    return db.getAllAsync<Client>(
      `
      SELECT * FROM clients 
      WHERE 
        firstName LIKE ? OR 
        lastName LIKE ? OR 
        phoneNumber LIKE ? OR 
        email LIKE ?
      ORDER BY lastName, firstName
    `,
      term,
      term,
      term,
      term
    );
  };

  /**
   * Create a new client
   */
  const create = async (input: ClientInput): Promise<Client> => {
    const now = new Date().toISOString();
    const id = uuidv4();

    const client: Client = {
      id,
      firstName: input.firstName,
      lastName: input.lastName,
      phoneNumber: input.phoneNumber,
      email: input.email,
      street: input.street,
      city: input.city,
      state: input.state,
      zipCode: input.zipCode,
      notes: input.notes,
      createdAt: now,
      updatedAt: now,
    };

    await db.runAsync(
      `
      INSERT INTO clients (
        id, firstName, lastName, phoneNumber, email, 
        street, city, state, zipCode, notes, 
        createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      client.id,
      client.firstName,
      client.lastName,
      client.phoneNumber,
      client.email || null,
      client.street || null,
      client.city || null,
      client.state || null,
      client.zipCode || null,
      client.notes || null,
      client.createdAt,
      client.updatedAt
    );

    return client;
  };

  /**
   * Update an existing client
   */
  const update = async (id: string, input: ClientInput): Promise<Client> => {
    // First check if client exists
    const existingClient = await getById(id);
    if (!existingClient) {
      throw new Error(`Client with ID ${id} not found`);
    }

    const now = new Date().toISOString();

    // Using transactions for safety
    await db.withTransactionAsync(async () => {
      await db.runAsync(
        `
        UPDATE clients 
        SET 
          firstName = ?, 
          lastName = ?, 
          phoneNumber = ?, 
          email = ?, 
          street = ?, 
          city = ?, 
          state = ?, 
          zipCode = ?, 
          notes = ?,
          updatedAt = ?
        WHERE id = ?
      `,
        input.firstName,
        input.lastName,
        input.phoneNumber,
        input.email || null,
        input.street || null,
        input.city || null,
        input.state || null,
        input.zipCode || null,
        input.notes || null,
        now,
        id
      );
    });

    // Return the updated client
    const updatedClient = await getById(id);
    if (!updatedClient) {
      throw new Error('Failed to retrieve updated client');
    }

    return updatedClient;
  };

  /**
   * Delete a client by ID
   */
  const deleteClient = async (id: string): Promise<boolean> => {
    try {
      await db.withTransactionAsync(async () => {
        await db.runAsync('DELETE FROM clients WHERE id = ?', id);
      });
      return true;
    } catch (error) {
      console.error('Error deleting client:', error);
      return false;
    }
  };

  /**
   * Get count of clients
   */
  const getCount = async (): Promise<number> => {
    const result = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM clients'
    );
    return result?.count || 0;
  };

  /**
   * Get all vehicles belonging to a client
   */
  const getClientVehicles = async (clientId: string): Promise<VehicleSummary[]> => {
    return db.getAllAsync<VehicleSummary>(
      `
      SELECT 
        id, make, model, year, licensePlate,
        (
          SELECT MAX(completionDate) 
          FROM jobs 
          WHERE vehicleId = vehicles.id AND status = 'completed'
        ) as lastService
      FROM vehicles 
      WHERE clientId = ?
      ORDER BY make, model
    `,
      clientId
    );
  };

  /**
   * Get the count of jobs for a client
   */
  const getClientJobCount = async (clientId: string): Promise<number> => {
    const result = await db.getFirstAsync<{ count: number }>(
      `
      SELECT COUNT(*) as count 
      FROM jobs 
      WHERE clientId = ?
    `,
      clientId
    );

    return result?.count || 0;
  };

  /**
   * Get the count of appointments for a client
   */
  const getClientAppointmentCount = async (clientId: string): Promise<number> => {
    const result = await db.getFirstAsync<{ count: number }>(
      `
      SELECT COUNT(*) as count 
      FROM appointments 
      WHERE clientId = ?
    `,
      clientId
    );

    return result?.count || 0;
  };

  return {
    getAll,
    getById,
    search,
    create,
    update,
    delete: deleteClient,
    getCount,
    getClientVehicles,
    getClientJobCount,
    getClientAppointmentCount,
  };
}
