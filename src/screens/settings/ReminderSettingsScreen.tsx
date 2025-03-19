import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Switch,
  Button,
  Divider,
  Text,
  ActivityIndicator,
  List,
} from 'react-native-paper';
import { spacing, shadows } from '../../utils/theme';
import useBackgroundReminders from '../../hooks/useBackgroundReminders';
import { useReminders } from '../../hooks/useReminders';

const ReminderSettingsScreen: React.FC = () => {
  const {
    isRegistered,
    status,
    isInitializing,
    toggleTaskRegistration,
    runTaskManually,
    checkTaskStatus,
  } = useBackgroundReminders();

  const {
    isInitialized: isReminderServiceInitialized,
    isProcessingReminders,
    lastProcessed,
    processReminders,
  } = useReminders();

  const [processing, setProcessing] = useState(false);

  // Manually process reminders
  const handleProcessReminders = async () => {
    if (isProcessingReminders) return;

    setProcessing(true);
    try {
      const result = await processReminders();

      if (result) {
        Alert.alert(
          'Reminders Processed',
          `Scheduled notifications: ${result.scheduledNotifications}\nReminders sent: ${result.remindersSent}`
        );
      } else {
        Alert.alert('Error', 'Failed to process reminders');
      }
    } catch (error) {
      console.error('Error processing reminders:', error);
      Alert.alert('Error', 'An error occurred while processing reminders');
    } finally {
      setProcessing(false);
    }
  };

  // Handle enabling/disabling background task
  const handleToggleBackgroundTask = async () => {
    if (isInitializing) return;

    const success = await toggleTaskRegistration();

    if (success) {
      Alert.alert(
        isRegistered ? 'Disabled' : 'Enabled',
        isRegistered
          ? 'Background reminders have been disabled'
          : 'Background reminders have been enabled'
      );
    } else {
      Alert.alert('Error', `Failed to ${isRegistered ? 'disable' : 'enable'} background reminders`);
    }

    await checkTaskStatus();
  };

  // Handle manual background task execution
  const handleManualRun = async () => {
    if (!isRegistered) {
      Alert.alert(
        'Not Registered',
        'The background task is not registered. Please enable it first.'
      );
      return;
    }

    await runTaskManually();
  };

  const getStatusText = () => {
    if (status === null) return 'Unknown';

    // BackgroundFetch.Status values
    switch (status) {
      case 1:
        return 'Denied';
      case 2:
        return 'Restricted';
      case 3:
        return 'Available';
      default:
        return `Status ${status}`;
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title>Reminder Settings</Title>
          <Paragraph>
            Configure how and when the app sends appointment reminders to clients.
          </Paragraph>

          <Divider style={styles.divider} />

          <List.Item
            title="Automatic Reminders"
            description="Enable background tasks to automatically send reminders"
            left={(props) => <List.Icon {...props} icon="bell-outline" />}
            right={() =>
              isInitializing ? (
                <ActivityIndicator size="small" />
              ) : (
                <Switch
                  value={isRegistered}
                  onValueChange={handleToggleBackgroundTask}
                  disabled={isInitializing}
                />
              )
            }
          />

          <List.Item
            title="Background Task Status"
            description={getStatusText()}
            left={(props) => <List.Icon {...props} icon="information-outline" />}
          />

          {lastProcessed && (
            <List.Item
              title="Last Processed"
              description={new Date(lastProcessed).toLocaleString()}
              left={(props) => <List.Icon {...props} icon="clock-outline" />}
            />
          )}

          <Divider style={styles.divider} />

          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              When enabled, the app will automatically check for upcoming appointments and send
              reminders to clients. This happens in the background, even when the app is not open.
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={handleProcessReminders}
              loading={processing || isProcessingReminders}
              disabled={processing || isProcessingReminders || !isReminderServiceInitialized}
              style={styles.button}
            >
              Process Reminders Now
            </Button>

            <Button
              mode="outlined"
              onPress={handleManualRun}
              disabled={!isRegistered || isInitializing}
              style={styles.button}
            >
              Run Background Task
            </Button>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>About Reminders</Title>
          <Paragraph>
            Auto Organize Me sends two types of reminders to help keep your clients informed:
          </Paragraph>

          <List.Item
            title="In-App Notifications"
            description="Reminders for you about upcoming appointments"
            left={(props) => <List.Icon {...props} icon="bell" />}
          />

          <List.Item
            title="Client SMS Reminders"
            description="Text messages to clients about their appointments"
            left={(props) => <List.Icon {...props} icon="message-text" />}
          />

          <List.Item
            title="Client Email Reminders"
            description="Email notifications to clients about their appointments"
            left={(props) => <List.Icon {...props} icon="email" />}
          />

          <Divider style={styles.divider} />

          <Text style={styles.infoText}>
            Reminders are typically sent a day before scheduled appointments. You can also manually
            send reminders from the appointment details screen if needed.
          </Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: spacing.md,
  },
  card: {
    marginBottom: spacing.md,
    ...shadows.medium,
  },
  divider: {
    marginVertical: spacing.md,
  },
  infoContainer: {
    marginBottom: spacing.md,
  },
  infoText: {
    color: '#666',
  },
  buttonContainer: {
    marginTop: spacing.md,
  },
  button: {
    marginBottom: spacing.sm,
  },
});

export default ReminderSettingsScreen;
