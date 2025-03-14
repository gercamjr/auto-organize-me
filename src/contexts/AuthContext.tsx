import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

// Define user type
interface User {
  id: string;
  name: string;
  // Add more user properties as needed
}

// Define context type
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (pin: string) => Promise<boolean>;
  logout: () => Promise<void>;
  setUpPin: (pin: string) => Promise<boolean>;
  hasPin: boolean;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => false,
  logout: async () => {},
  setUpPin: async () => false,
  hasPin: false,
});

// Define provider props
interface AuthProviderProps {
  children: ReactNode;
}

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Provider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasPin, setHasPin] = useState(false);

  // Check if a PIN has been set
  useEffect(() => {
    const checkPin = async () => {
      try {
        const storedPin = await AsyncStorage.getItem('@auth_pin');
        const storedUser = await AsyncStorage.getItem('@auth_user');

        setHasPin(!!storedPin);

        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Error checking auth state:', error);
        setIsLoading(false);
      }
    };

    checkPin();
  }, []);

  // Hash the PIN for secure storage
  const hashPin = async (pin: string): Promise<string> => {
    const digest = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, pin);
    return digest;
  };

  // Set up a new PIN
  const setUpPin = async (pin: string): Promise<boolean> => {
    try {
      const hashedPin = await hashPin(pin);
      await AsyncStorage.setItem('@auth_pin', hashedPin);

      // Create a default user profile
      const defaultUser: User = {
        id: '1',
        name: 'Mechanic',
      };

      await AsyncStorage.setItem('@auth_user', JSON.stringify(defaultUser));
      setUser(defaultUser);
      setHasPin(true);

      return true;
    } catch (error) {
      console.error('Error setting up PIN:', error);
      return false;
    }
  };

  // Login with PIN
  const login = async (pin: string): Promise<boolean> => {
    try {
      const storedPin = await AsyncStorage.getItem('@auth_pin');

      if (!storedPin) {
        return false;
      }

      const hashedPin = await hashPin(pin);

      if (hashedPin === storedPin) {
        const storedUser = await AsyncStorage.getItem('@auth_user');

        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }

        return true;
      }

      return false;
    } catch (error) {
      console.error('Error during login:', error);
      return false;
    }
  };

  // Logout
  const logout = async (): Promise<void> => {
    try {
      // We don't clear the PIN, just the user session
      setUser(null);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  // Determine if the user is authenticated
  const isAuthenticated = !!user;

  // Context value to be provided
  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    setUpPin,
    hasPin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
