import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import * as SQLite from 'expo-sqlite';
import { getDatabase } from '../database/database';

// Define the context type
interface DatabaseContextType {
  db: SQLite.SQLiteDatabase | null;
  isLoading: boolean;
  error: Error | null;
}

// Create the context with a default value
const DatabaseContext = createContext<DatabaseContextType>({
  db: null,
  isLoading: true,
  error: null,
});

// Provider props interface
interface DatabaseProviderProps {
  children: ReactNode;
}

// Custom hook to use the database context
export const useDatabase = () => useContext(DatabaseContext);

// Provider component
export const DatabaseProvider: React.FC<DatabaseProviderProps> = ({ children }) => {
  const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Initialize the database connection
  useEffect(() => {
    const setupDb = async () => {
      try {
        // Get the database instance (this will wait for initialization if needed)
        const database = await getDatabase();
        setDb(database);
        setError(null);
      } catch (err) {
        console.error('Failed to initialize DatabaseContext:', err);
        setError(err instanceof Error ? err : new Error('Failed to initialize database'));
      } finally {
        setIsLoading(false);
      }
    };

    setupDb();
  }, []);

  // Value to be provided to consumers
  const value: DatabaseContextType = {
    db,
    isLoading,
    error,
  };

  return <DatabaseContext.Provider value={value}>{children}</DatabaseContext.Provider>;
};
