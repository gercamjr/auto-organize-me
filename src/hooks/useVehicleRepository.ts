import { useSQLiteContext } from 'expo-sqlite';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

// Vehicle model
export interface Vehicle {
  id: string;
  clientId: string;
  make: string;
  model: string;
  year: number;
  color?: string;
  licensePlate?: string;
  vin?: string;
  engineType: string;
  engineDisplacement?: string;
  engineHorsepower?: number;
  engineFuelType?: string;
  engineCylinderCount?: number;
  engineTurboCharged?: boolean;
  transmission: string;
  transmissionSpeeds?: number;
  transmissionManufacturer?: string;
  transmissionFluidType?: string;
  mileage?: number;
  notes?: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

// Vehicle input for creating/updating
export interface VehicleInput {
  clientId: string;
  make: string;
  model: string;
  year: number;
  color?: string;
  licensePlate?: string;
  vin?: string;
  engineType: string;
  engineDisplacement?: string;
  engineHorsepower?: number;
  engineFuelType?: string;
  engineCylinderCount?: number;
  engineTurboCharged?: boolean;
  transmission: string;
  transmissionSpeeds?: number;
  transmissionManufacturer?: string;
  transmissionFluidType?: string;
  mileage?: number;
  notes?: string;
}

// Vehicle list item (for displaying in lists)
export interface VehicleListItem {
  id: string;
  make: string;
  model: string;
  year: number;
  licensePlate?: string;
  clientId: string;
  clientName: string;
  photoUri?: string;
  lastServiceDate?: string;
}

// Vehicle photo model
export interface VehiclePhoto {
  id: string;
  vehicleId: string;
  photoUri: string;
  description?: string;
  createdAt: string;
}

/**
 * Hook for vehicle-related database operations
 */
export function useVehicleRepository() {
  const db = useSQLiteContext();

  /**
   * Get all vehicles
   */
  const getAll = async (): Promise<VehicleListItem[]> => {
    return db.getAllAsync<VehicleListItem>(`
      SELECT 
        v.id, v.make, v.model, v.year, v.licensePlate, v.clientId,
        c.firstName || ' ' || c.lastName as clientName,
        (
          SELECT photoUri FROM vehicle_photos 
          WHERE vehicleId = v.id 
          ORDER BY createdAt DESC LIMIT 1
        ) as photoUri,
        (
          SELECT MAX(completionDate) 
          FROM jobs 
          WHERE vehicleId = v.id AND status = 'completed'
        ) as lastServiceDate
      FROM vehicles v
      JOIN clients c ON v.clientId = c.id
      ORDER BY v.make, v.model
    `);
  };

  /**
   * Get all vehicles for a specific client
   */
  const getByClientId = async (clientId: string): Promise<VehicleListItem[]> => {
    return db.getAllAsync<VehicleListItem>(
      `
      SELECT 
        v.id, v.make, v.model, v.year, v.licensePlate, v.clientId,
        c.firstName || ' ' || c.lastName as clientName,
        (
          SELECT photoUri FROM vehicle_photos 
          WHERE vehicleId = v.id 
          ORDER BY createdAt DESC LIMIT 1
        ) as photoUri,
        (
          SELECT MAX(completionDate) 
          FROM jobs 
          WHERE vehicleId = v.id AND status = 'completed'
        ) as lastServiceDate
      FROM vehicles v
      JOIN clients c ON v.clientId = c.id
      WHERE v.clientId = ?
      ORDER BY v.make, v.model
    `,
      clientId
    );
  };

  /**
   * Get a vehicle by ID
   */
  const getById = async (id: string): Promise<Vehicle | null> => {
    const vehicle = await db.getFirstAsync<Vehicle>(
      `
      SELECT * FROM vehicles 
      WHERE id = ?
    `,
      id
    );

    return vehicle || null;
  };

  /**
   * Get a vehicle with client details
   */
  const getVehicleWithClient = async (id: string): Promise<VehicleListItem | null> => {
    const vehicle = await db.getFirstAsync<VehicleListItem>(
      `
      SELECT 
        v.id, v.make, v.model, v.year, v.licensePlate, v.clientId,
        c.firstName || ' ' || c.lastName as clientName,
        (
          SELECT photoUri FROM vehicle_photos 
          WHERE vehicleId = v.id 
          ORDER BY createdAt DESC LIMIT 1
        ) as photoUri,
        (
          SELECT MAX(completionDate) 
          FROM jobs 
          WHERE vehicleId = v.id AND status = 'completed'
        ) as lastServiceDate
      FROM vehicles v
      JOIN clients c ON v.clientId = c.id
      WHERE v.id = ?
    `,
      id
    );

    return vehicle || null;
  };

  /**
   * Get all photos for a vehicle
   */
  const getVehiclePhotos = async (vehicleId: string): Promise<VehiclePhoto[]> => {
    return db.getAllAsync<VehiclePhoto>(
      `
      SELECT * FROM vehicle_photos
      WHERE vehicleId = ?
      ORDER BY createdAt DESC
    `,
      vehicleId
    );
  };

  /**
   * Add a photo to a vehicle
   */
  const addVehiclePhoto = async (
    vehicleId: string,
    photoUri: string,
    description?: string
  ): Promise<VehiclePhoto> => {
    const now = new Date().toISOString();
    const id = uuidv4();

    const photo: VehiclePhoto = {
      id,
      vehicleId,
      photoUri,
      description,
      createdAt: now,
    };

    await db.runAsync(
      `
      INSERT INTO vehicle_photos (id, vehicleId, photoUri, description, createdAt)
      VALUES (?, ?, ?, ?, ?)
    `,
      photo.id,
      photo.vehicleId,
      photo.photoUri,
      photo.description || null,
      photo.createdAt
    );

    return photo;
  };

  /**
   * Delete a vehicle photo
   */
  const deleteVehiclePhoto = async (photoId: string): Promise<boolean> => {
    try {
      await db.runAsync('DELETE FROM vehicle_photos WHERE id = ?', photoId);
      return true;
    } catch (error) {
      console.error('Error deleting vehicle photo:', error);
      return false;
    }
  };

  /**
   * Search vehicles by make, model, or license plate
   */
  const search = async (searchTerm: string): Promise<VehicleListItem[]> => {
    const term = `%${searchTerm}%`;

    return db.getAllAsync<VehicleListItem>(
      `
      SELECT 
        v.id, v.make, v.model, v.year, v.licensePlate, v.clientId,
        c.firstName || ' ' || c.lastName as clientName,
        (
          SELECT photoUri FROM vehicle_photos 
          WHERE vehicleId = v.id 
          ORDER BY createdAt DESC LIMIT 1
        ) as photoUri,
        (
          SELECT MAX(completionDate) 
          FROM jobs 
          WHERE vehicleId = v.id AND status = 'completed'
        ) as lastServiceDate
      FROM vehicles v
      JOIN clients c ON v.clientId = c.id
      WHERE 
        v.make LIKE ? OR 
        v.model LIKE ? OR 
        v.licensePlate LIKE ? OR
        (c.firstName || ' ' || c.lastName) LIKE ?
      ORDER BY v.make, v.model
    `,
      term,
      term,
      term,
      term
    );
  };

  /**
   * Create a new vehicle
   */
  const create = async (input: VehicleInput): Promise<Vehicle> => {
    const now = new Date().toISOString();
    const id = uuidv4();

    const vehicle: Vehicle = {
      id,
      clientId: input.clientId,
      make: input.make,
      model: input.model,
      year: input.year,
      color: input.color,
      licensePlate: input.licensePlate,
      vin: input.vin,
      engineType: input.engineType,
      engineDisplacement: input.engineDisplacement,
      engineHorsepower: input.engineHorsepower,
      engineFuelType: input.engineFuelType,
      engineCylinderCount: input.engineCylinderCount,
      engineTurboCharged: input.engineTurboCharged,
      transmission: input.transmission,
      transmissionSpeeds: input.transmissionSpeeds,
      transmissionManufacturer: input.transmissionManufacturer,
      transmissionFluidType: input.transmissionFluidType,
      mileage: input.mileage,
      notes: input.notes,
      createdAt: now,
      updatedAt: now,
    };

    try {
      await db.withTransactionAsync(async () => {
        await db.runAsync(
          `
          INSERT INTO vehicles (
            id, clientId, make, model, year, color, licensePlate, vin,
            engineType, engineDisplacement, engineHorsepower, engineFuelType,
            engineCylinderCount, engineTurboCharged, transmission, transmissionSpeeds,
            transmissionManufacturer, transmissionFluidType, mileage, notes,
            createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
          vehicle.id,
          vehicle.clientId,
          vehicle.make,
          vehicle.model,
          vehicle.year,
          vehicle.color || null,
          vehicle.licensePlate || null,
          vehicle.vin || null,
          vehicle.engineType,
          vehicle.engineDisplacement || null,
          vehicle.engineHorsepower || null,
          vehicle.engineFuelType || null,
          vehicle.engineCylinderCount || null,
          vehicle.engineTurboCharged ? 1 : 0,
          vehicle.transmission,
          vehicle.transmissionSpeeds || null,
          vehicle.transmissionManufacturer || null,
          vehicle.transmissionFluidType || null,
          vehicle.mileage || null,
          vehicle.notes || null,
          vehicle.createdAt,
          vehicle.updatedAt
        );
      });

      return vehicle;
    } catch (error) {
      console.error('Error creating vehicle:', error);
      throw error;
    }
  };

  /**
   * Update an existing vehicle
   */
  const update = async (id: string, input: VehicleInput): Promise<Vehicle> => {
    // First check if vehicle exists
    const existingVehicle = await getById(id);
    if (!existingVehicle) {
      throw new Error(`Vehicle with ID ${id} not found`);
    }

    const now = new Date().toISOString();

    try {
      await db.withTransactionAsync(async () => {
        await db.runAsync(
          `
          UPDATE vehicles 
          SET 
            clientId = ?, 
            make = ?, 
            model = ?, 
            year = ?, 
            color = ?, 
            licensePlate = ?, 
            vin = ?,
            engineType = ?, 
            engineDisplacement = ?, 
            engineHorsepower = ?, 
            engineFuelType = ?,
            engineCylinderCount = ?, 
            engineTurboCharged = ?, 
            transmission = ?, 
            transmissionSpeeds = ?,
            transmissionManufacturer = ?, 
            transmissionFluidType = ?, 
            mileage = ?, 
            notes = ?,
            updatedAt = ?
          WHERE id = ?
        `,
          input.clientId,
          input.make,
          input.model,
          input.year,
          input.color || null,
          input.licensePlate || null,
          input.vin || null,
          input.engineType,
          input.engineDisplacement || null,
          input.engineHorsepower || null,
          input.engineFuelType || null,
          input.engineCylinderCount || null,
          input.engineTurboCharged ? 1 : 0,
          input.transmission,
          input.transmissionSpeeds || null,
          input.transmissionManufacturer || null,
          input.transmissionFluidType || null,
          input.mileage || null,
          input.notes || null,
          now,
          id
        );
      });

      // Return the updated vehicle
      const updatedVehicle = await getById(id);
      if (!updatedVehicle) {
        throw new Error('Failed to retrieve updated vehicle');
      }

      return updatedVehicle;
    } catch (error) {
      console.error('Error updating vehicle:', error);
      throw error;
    }
  };

  /**
   * Delete a vehicle by ID
   */
  const deleteVehicle = async (id: string): Promise<boolean> => {
    try {
      await db.withTransactionAsync(async () => {
        // Delete related photos first
        await db.runAsync('DELETE FROM vehicle_photos WHERE vehicleId = ?', id);

        // Then delete the vehicle
        await db.runAsync('DELETE FROM vehicles WHERE id = ?', id);
      });

      return true;
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      return false;
    }
  };

  /**
   * Get count of vehicles
   */
  const getCount = async (): Promise<number> => {
    const result = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM vehicles'
    );
    return result?.count || 0;
  };

  /**
   * Get count of vehicles for a specific client
   */
  const getCountByClient = async (clientId: string): Promise<number> => {
    const result = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM vehicles WHERE clientId = ?',
      clientId
    );
    return result?.count || 0;
  };

  return {
    getAll,
    getByClientId,
    getById,
    getVehicleWithClient,
    getVehiclePhotos,
    addVehiclePhoto,
    deleteVehiclePhoto,
    search,
    create,
    update,
    delete: deleteVehicle,
    getCount,
    getCountByClient,
  };
}
