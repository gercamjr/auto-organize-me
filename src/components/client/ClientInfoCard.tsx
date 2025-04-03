import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Avatar, Text } from 'react-native-paper';
import { spacing, shadows } from '../../utils/theme';

interface ClientInfoCardProps {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email?: string;
  onPress: () => void;
}

const ClientInfoCard: React.FC<ClientInfoCardProps> = ({
  firstName,
  lastName,
  phoneNumber,
  email,
  onPress,
}) => {
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  return (
    <TouchableOpacity onPress={onPress}>
      <Card style={styles.card}>
        <Card.Content style={styles.cardContent}>
          <Avatar.Text size={50} label={initials} style={styles.avatar} />
          <View style={styles.clientInfo}>
            <Text variant="titleMedium">{`${firstName} ${lastName}`}</Text>
            <Text variant="bodyMedium">{phoneNumber}</Text>
            {email && <Text variant="bodySmall">{email}</Text>}
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.sm,
    ...shadows.small,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    marginRight: spacing.md,
  },
  clientInfo: {
    flex: 1,
  },
});

export default ClientInfoCard;
