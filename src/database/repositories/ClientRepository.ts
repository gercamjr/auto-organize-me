import * as SQLite from 'expo-sqlite';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '../database';

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
 * Repository for client-related database operations
 */
export class ClientRepository {
  private db: SQLite.SQLiteDatabase;

  constructor() {
    this.db = getDatabase();
  }

  /**
   * Get all clients
   */
  async getAll(): Promise<Client[]> {
    return this.db.getAllAsync<Client>(`
        SELECT * FROM clients 
        ORDER BY lastName, firstName
      `);
  }

  /**
   * Get a client by ID
   */
  async getById(id: string): Promise<Client | null> {
    const client = await this.db.getFirstAsync<Client>(
      `
        SELECT * FROM clients 
        WHERE id = ?
      `,
      id
    );

    return client || null;
  }

  /**
   * Search clients by name or phone
   */
  async search(searchTerm: string): Promise<Client[]> {
    const term = `%${searchTerm}%`;

    return this.db.getAllAsync<Client>(
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
  }

  /**
   * Create a new client
   */
  async create(input: ClientInput): Promise<Client> {
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

    // Using the new async API for writing data
    await this.db.runAsync(
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
  }

  /**
   * Update an existing client
   */
  async update(id: string, input: ClientInput): Promise<Client> {
    // First check if client exists
    const existingClient = await this.getById(id);
    if (!existingClient) {
      throw new Error(`Client with ID ${id} not found`);
    }

    const now = new Date().toISOString();

    // Using transactions for safety
    await this.db.withTransactionAsync(async () => {
      await this.db.runAsync(
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
    const updatedClient = await this.getById(id);
    if (!updatedClient) {
      throw new Error('Failed to retrieve updated client');
    }

    return updatedClient;
  }

  /**
   * Delete a client by ID
   */
  async delete(id: string): Promise<boolean> {
    // Use withTransactionAsync to ensure data integrity
    let success = false;
    await this.db.withTransactionAsync(async () => {
      const result = await this.db.runAsync('DELETE FROM clients WHERE id = ?', id);
      success = result.changes > 0;
    });
    return success;
  }

  /**
   * Get count of clients
   */
  async getCount(): Promise<number> {
    const result = await this.db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM clients'
    );
    return result?.count || 0;
  }
}

// Create a singleton instance
const clientRepository = new ClientRepository();
export default clientRepository;
