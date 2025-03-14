import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

// Database name
const DATABASE_NAME = 'auto_organize_me.db';
let database: SQLite.SQLiteDatabase;

/**
 * Initialize the SQLite database
 */
export const initDatabase = async (): Promise<void> => {
  try {
    console.log('Initializing database...');

    // Open the database using the async API
    database = await SQLite.openDatabaseAsync(DATABASE_NAME);

    // Execute all migrations in a single operation for better performance
    await database.execAsync(`
      PRAGMA journal_mode = WAL;
      
      CREATE TABLE IF NOT EXISTS clients (
        id TEXT PRIMARY KEY NOT NULL,
        firstName TEXT NOT NULL,
        lastName TEXT NOT NULL,
        phoneNumber TEXT NOT NULL,
        email TEXT,
        street TEXT,
        city TEXT,
        state TEXT,
        zipCode TEXT,
        notes TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS vehicles (
        id TEXT PRIMARY KEY NOT NULL,
        clientId TEXT NOT NULL,
        make TEXT NOT NULL,
        model TEXT NOT NULL,
        year INTEGER NOT NULL,
        color TEXT,
        licensePlate TEXT,
        vin TEXT,
        engineType TEXT NOT NULL,
        engineDisplacement TEXT,
        engineHorsepower INTEGER,
        engineFuelType TEXT,
        engineCylinderCount INTEGER,
        engineTurboCharged INTEGER,
        transmission TEXT NOT NULL,
        transmissionSpeeds INTEGER,
        transmissionManufacturer TEXT,
        transmissionFluidType TEXT,
        mileage INTEGER,
        notes TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (clientId) REFERENCES clients (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS vehicle_photos (
        id TEXT PRIMARY KEY NOT NULL,
        vehicleId TEXT NOT NULL,
        photoUri TEXT NOT NULL,
        description TEXT,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (vehicleId) REFERENCES vehicles (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS jobs (
        id TEXT PRIMARY KEY NOT NULL,
        clientId TEXT NOT NULL,
        vehicleId TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        status TEXT NOT NULL,
        jobType TEXT NOT NULL,
        isHomeVisit INTEGER NOT NULL,
        locationAddress TEXT,
        locationNotes TEXT,
        scheduledDate TEXT,
        startDate TEXT,
        completionDate TEXT,
        estimateProvided INTEGER NOT NULL,
        estimateAccepted INTEGER,
        estimateAmount REAL,
        totalCost REAL NOT NULL,
        invoiceNumber TEXT,
        paymentStatus TEXT,
        paymentMethod TEXT,
        notes TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (clientId) REFERENCES clients (id) ON DELETE CASCADE,
        FOREIGN KEY (vehicleId) REFERENCES vehicles (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS parts (
        id TEXT PRIMARY KEY NOT NULL,
        jobId TEXT NOT NULL,
        name TEXT NOT NULL,
        partNumber TEXT,
        manufacturer TEXT,
        quantity INTEGER NOT NULL,
        unitCost REAL NOT NULL,
        markupPercentage REAL,
        clientPrice REAL NOT NULL,
        totalCost REAL NOT NULL,
        supplier TEXT,
        warrantyHasCoverage INTEGER NOT NULL,
        warrantyLengthInMonths INTEGER,
        warrantyLengthInMiles INTEGER,
        warrantyExpirationDate TEXT,
        warrantyNotes TEXT,
        replacedPartCondition TEXT,
        isClientSupplied INTEGER,
        notes TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (jobId) REFERENCES jobs (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS warranty_photos (
        id TEXT PRIMARY KEY NOT NULL,
        partId TEXT NOT NULL,
        photoUri TEXT NOT NULL,
        description TEXT,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (partId) REFERENCES parts (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS part_photos (
        id TEXT PRIMARY KEY NOT NULL,
        partId TEXT NOT NULL,
        photoUri TEXT NOT NULL,
        description TEXT,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (partId) REFERENCES parts (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS labor_entries (
        id TEXT PRIMARY KEY NOT NULL,
        jobId TEXT NOT NULL,
        description TEXT NOT NULL,
        hours REAL NOT NULL,
        rate REAL NOT NULL,
        totalCost REAL NOT NULL,
        technician TEXT,
        notes TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (jobId) REFERENCES jobs (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS diagnostic_items (
        id TEXT PRIMARY KEY NOT NULL,
        jobId TEXT NOT NULL,
        system TEXT NOT NULL,
        component TEXT NOT NULL,
        issue TEXT NOT NULL,
        severity TEXT NOT NULL,
        recommendedAction TEXT NOT NULL,
        estimatedCost REAL,
        notes TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (jobId) REFERENCES jobs (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS diagnostic_photos (
        id TEXT PRIMARY KEY NOT NULL,
        diagnosticItemId TEXT NOT NULL,
        photoUri TEXT NOT NULL,
        description TEXT,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (diagnosticItemId) REFERENCES diagnostic_items (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS job_photos (
        id TEXT PRIMARY KEY NOT NULL,
        jobId TEXT NOT NULL,
        photoUri TEXT NOT NULL,
        photoType TEXT NOT NULL,
        description TEXT,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (jobId) REFERENCES jobs (id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS appointments (
        id TEXT PRIMARY KEY NOT NULL,
        clientId TEXT NOT NULL,
        vehicleId TEXT NOT NULL,
        scheduledDate TEXT NOT NULL,
        duration INTEGER NOT NULL,
        status TEXT NOT NULL,
        isHomeVisit INTEGER NOT NULL,
        locationAddress TEXT,
        locationNotes TEXT,
        notes TEXT,
        reminderSent INTEGER NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (clientId) REFERENCES clients (id) ON DELETE CASCADE,
        FOREIGN KEY (vehicleId) REFERENCES vehicles (id) ON DELETE CASCADE
      );
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error during database initialization:', error);
    throw error;
  }
};

/**
 * Get the database instance
 */
export const getDatabase = (): SQLite.SQLiteDatabase => {
  if (!database) {
    console.warn('Database accessed before initialization. This should be handled properly.');
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return database;
};

/**
 * Close the database connection
 * Note: This is mostly for cleanup in tests
 */
export const closeDatabase = async (): Promise<void> => {
  if (database) {
    await database.closeAsync();
    database = undefined as any;
  }
};
