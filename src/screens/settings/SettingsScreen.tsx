import React from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { List, Card, Title, Paragraph, Divider } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { SettingsStackParamList } from '../../navigation/SettingsNavigator';
import { spacing, shadows } from '../../utils/theme';
import * as Application from 'expo-application';
import Constants from 'expo-constants';

type SettingsScreenNavigationProp = StackNavigationProp<SettingsStackParamList, 'Settings'>;

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<SettingsScreenNavigationProp>();

  // Get app version
  const appVersion = Constants.expoConfig?.version || 'Unknown';
  const buildNumber = Application.nativeBuildVersion || 'Unknown';

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Title>App Settings</Title>
          <Paragraph>Configure your Auto Organize Me application</Paragraph>

          <Divider style={styles.divider} />

          <List.Item
            title="Reminder Settings"
            description="Configure client reminders and notifications"
            left={(props) => <List.Icon {...props} icon="bell" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => navigation.navigate('ReminderSettings')}
          />

          {/* Additional settings options would go here */}
          <List.Item
            title="App Preferences"
            description="Customize the app's appearance and behavior"
            left={(props) => <List.Icon {...props} icon="cog" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {
              // Not implemented yet - would navigate to preferences screen
            }}
          />

          <List.Item
            title="Data Management"
            description="Backup, restore, and export your data"
            left={(props) => <List.Icon {...props} icon="database" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {
              // Not implemented yet - would navigate to data management screen
            }}
          />
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title>About</Title>

          <List.Item
            title="Version"
            description={`${appVersion} (Build ${buildNumber})`}
            left={(props) => <List.Icon {...props} icon="information" />}
          />

          <List.Item
            title="Contact Support"
            description="Get help with using Auto Organize Me"
            left={(props) => <List.Icon {...props} icon="email" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {
              // Not implemented yet - would open email/support link
            }}
          />

          <List.Item
            title="Privacy Policy"
            description="View our privacy policy"
            left={(props) => <List.Icon {...props} icon="shield-account" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {
              // Not implemented yet - would navigate to privacy policy
            }}
          />

          <List.Item
            title="Terms of Service"
            description="View our terms of service"
            left={(props) => <List.Icon {...props} icon="file-document" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {
              // Not implemented yet - would navigate to terms of service
            }}
          />
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
});

export default SettingsScreen;
