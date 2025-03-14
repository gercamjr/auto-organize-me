import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { SQLiteDatabase, SQLiteProvider } from 'expo-sqlite';

// Import navigation
import { RootNavigator } from './src/navigation/RootNavigator';

// Import theme
import { theme } from './src/utils/theme';

// Import context providers
import { AuthProvider } from './src/contexts/AuthContext';

// Database migration function
async function migrateDatabase(db: SQLiteDatabase) {
  try {
    // Create tables if they don't exist
    await db.execAsync(`
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

    console.log('Database migration completed successfully');
  } catch (error) {
    console.error('Database migration failed:', error);
    throw error;
  }
}

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <NavigationContainer>
          <SQLiteProvider databaseName="auto_organize_me.db" onInit={migrateDatabase}>
            <AuthProvider>
              <StatusBar style="auto" />
              <RootNavigator />
            </AuthProvider>
          </SQLiteProvider>
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
