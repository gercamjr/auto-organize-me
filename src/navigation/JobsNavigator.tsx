import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { IconButton } from 'react-native-paper';
import { useTheme } from 'react-native-paper';

// Import screens (we'll create these next)
import JobListScreen from '../screens/job/JobListScreen';
import JobDetailsScreen from '../screens/job/JobDetailsScreen';
import AddEditJobScreen from '../screens/job/AddEditJobScreen';
import JobPartsScreen from '../screens/job/JobPartsScreen';
import AddEditPartScreen from '../screens/job/AddEditPartScreen';
import JobLaborScreen from '../screens/job/JobLaborScreen';
import AddEditLaborScreen from '../screens/job/AddEditLaborScreen';
import JobDiagnosticsScreen from '../screens/job/JobDiagnosticsScreen';
import AddEditDiagnosticScreen from '../screens/job/AddEditDiagnosticScreen';
import JobPhotosScreen from '../screens/job/JobPhotosScreen';
import JobHistoryScreen from '@/screens/job/JobHistoryScreen';

// Define the jobs stack parameter list
export type JobsStackParamList = {
  JobList: undefined;
  JobDetails: { jobId: string };
  AddEditJob: {
    jobId?: string;
    clientId?: string;
    vehicleId?: string;
  };
  JobParts: { jobId: string };
  AddEditPart: {
    jobId: string;
    partId?: string;
  };
  JobLabor: { jobId: string };
  AddEditLabor: {
    jobId: string;
    laborId?: string;
  };
  JobDiagnostics: { jobId: string };
  AddEditDiagnostic: {
    jobId: string;
    diagnosticId?: string;
  };
  JobPhotos: { jobId: string };
  JobHistory: { vehicleId: string };
};

const Stack = createStackNavigator<JobsStackParamList>();

/**
 * Jobs navigator containing all job-related screens
 */
const JobsNavigator: React.FC = () => {
  const theme = useTheme();

  return (
    <Stack.Navigator
      initialRouteName="JobList"
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: theme.colors.onPrimary,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen
        name="JobList"
        component={JobListScreen}
        options={({ navigation }) => ({
          title: 'Jobs',
          headerRight: () => (
            <IconButton
              icon="plus"
              iconColor={theme.colors.onPrimary}
              size={24}
              onPress={() => navigation.navigate('AddEditJob', {})}
            />
          ),
        })}
      />
      <Stack.Screen
        name="JobDetails"
        component={JobDetailsScreen}
        options={({ navigation, route }) => ({
          title: 'Job Details',
          headerRight: () => (
            <IconButton
              icon="pencil"
              iconColor={theme.colors.onPrimary}
              size={24}
              onPress={() => {
                const jobId = route.params?.jobId;
                if (jobId) {
                  navigation.navigate('AddEditJob', { jobId });
                }
              }}
            />
          ),
        })}
      />
      <Stack.Screen
        name="AddEditJob"
        component={AddEditJobScreen}
        options={({ route }) => ({
          title: route.params?.jobId ? 'Edit Job' : 'Add Job',
        })}
      />
      <Stack.Screen
        name="JobParts"
        component={JobPartsScreen}
        options={({ navigation, route }) => ({
          title: 'Parts',
          headerRight: () => (
            <IconButton
              icon="plus"
              iconColor={theme.colors.onPrimary}
              size={24}
              onPress={() => {
                const jobId = route.params?.jobId;
                if (jobId) {
                  navigation.navigate('AddEditPart', { jobId });
                }
              }}
            />
          ),
        })}
      />
      <Stack.Screen
        name="AddEditPart"
        component={AddEditPartScreen}
        options={({ route }) => ({
          title: route.params?.partId ? 'Edit Part' : 'Add Part',
        })}
      />
      <Stack.Screen
        name="JobLabor"
        component={JobLaborScreen}
        options={({ navigation, route }) => ({
          title: 'Labor',
          headerRight: () => (
            <IconButton
              icon="plus"
              iconColor={theme.colors.onPrimary}
              size={24}
              onPress={() => {
                const jobId = route.params?.jobId;
                if (jobId) {
                  navigation.navigate('AddEditLabor', { jobId });
                }
              }}
            />
          ),
        })}
      />
      <Stack.Screen
        name="AddEditLabor"
        component={AddEditLaborScreen}
        options={({ route }) => ({
          title: route.params?.laborId ? 'Edit Labor' : 'Add Labor',
        })}
      />
      <Stack.Screen
        name="JobDiagnostics"
        component={JobDiagnosticsScreen}
        options={({ navigation, route }) => ({
          title: 'Diagnostics',
          headerRight: () => (
            <IconButton
              icon="plus"
              iconColor={theme.colors.onPrimary}
              size={24}
              onPress={() => {
                const jobId = route.params?.jobId;
                if (jobId) {
                  navigation.navigate('AddEditDiagnostic', { jobId });
                }
              }}
            />
          ),
        })}
      />
      <Stack.Screen
        name="AddEditDiagnostic"
        component={AddEditDiagnosticScreen}
        options={({ route }) => ({
          title: route.params?.diagnosticId ? 'Edit Diagnostic' : 'Add Diagnostic',
        })}
      />
      <Stack.Screen
        name="JobPhotos"
        component={JobPhotosScreen}
        options={{
          title: 'Job Photos',
        }}
      />
      <Stack.Screen
        name="JobHistory"
        component={JobHistoryScreen}
        options={{ title: 'Service History' }}
      />
    </Stack.Navigator>
  );
};

export default JobsNavigator;
