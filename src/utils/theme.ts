import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import {
  DefaultTheme as NavigationDefaultTheme,
  DarkTheme as NavigationDarkTheme,
} from '@react-navigation/native';

// Define custom colors
const customColors = {
  primary: '#1976D2', // Blue
  primaryDark: '#0D47A1',
  primaryLight: '#64B5F6',
  secondary: '#FF9800', // Orange - good for mechanics
  secondaryDark: '#F57C00',
  secondaryLight: '#FFB74D',
  error: '#D32F2F',
  warning: '#FFA000',
  info: '#2196F3',
  success: '#388E3C',
  background: '#F5F5F5',
  surface: '#FFFFFF',
  textPrimary: '#212121',
  textSecondary: '#757575',
  disabled: '#BDBDBD',
  placeholder: '#9E9E9E',
  backdrop: 'rgba(0,0,0,0.5)',
};

// Custom dark colors
const customDarkColors = {
  primary: '#42A5F5', // Lighter blue for dark theme
  primaryDark: '#1976D2',
  primaryLight: '#90CAF9',
  secondary: '#FFB74D', // Lighter orange for dark theme
  secondaryDark: '#FF9800',
  secondaryLight: '#FFCC80',
  error: '#EF5350',
  warning: '#FFB300',
  info: '#42A5F5',
  success: '#66BB6A',
  background: '#121212',
  surface: '#1E1E1E',
  textPrimary: '#FFFFFF',
  textSecondary: '#B0B0B0',
  disabled: '#757575',
  placeholder: '#9E9E9E',
  backdrop: 'rgba(0,0,0,0.7)',
};

// Light theme
export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: customColors.primary,
    primaryContainer: customColors.primaryLight,
    secondary: customColors.secondary,
    secondaryContainer: customColors.secondaryLight,
    background: customColors.background,
    surface: customColors.surface,
    error: customColors.error,
    onPrimary: 'white',
    onSecondary: 'white',
    onBackground: customColors.textPrimary,
    onSurface: customColors.textPrimary,
    disabled: customColors.disabled,
    placeholder: customColors.placeholder,
    backdrop: customColors.backdrop,
  },
};

// Dark theme
export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: customDarkColors.primary,
    primaryContainer: customDarkColors.primaryDark,
    secondary: customDarkColors.secondary,
    secondaryContainer: customDarkColors.secondaryDark,
    background: customDarkColors.background,
    surface: customDarkColors.surface,
    error: customDarkColors.error,
    onPrimary: 'white',
    onSecondary: 'black',
    onBackground: customDarkColors.textPrimary,
    onSurface: customDarkColors.textPrimary,
    disabled: customDarkColors.disabled,
    placeholder: customDarkColors.placeholder,
    backdrop: customDarkColors.backdrop,
  },
};

// Combined themes for React Navigation
export const combinedLightTheme = {
  ...NavigationDefaultTheme,
  ...lightTheme,
  colors: {
    ...NavigationDefaultTheme.colors,
    ...lightTheme.colors,
  },
};

export const combinedDarkTheme = {
  ...NavigationDarkTheme,
  ...darkTheme,
  colors: {
    ...NavigationDarkTheme.colors,
    ...darkTheme.colors,
  },
};

// Default to light theme for now (we can add theme switching later)
export const theme = lightTheme;

// Custom fonts and typography can be added here
export const typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    light: 'System',
    thin: 'System',
  },
  fontSize: {
    small: 12,
    medium: 14,
    large: 16,
    xlarge: 18,
    xxlarge: 20,
    heading: 24,
    subheading: 20,
  },
};

// Spacing constants for consistent UI
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Border radius
export const borderRadius = {
  small: 4,
  medium: 8,
  large: 12,
  xlarge: 16,
  round: 999,
};

// Shadows for elevation
export const shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
};
