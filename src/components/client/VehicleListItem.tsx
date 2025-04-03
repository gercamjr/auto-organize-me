import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { spacing } from '../../utils/theme';

interface VehicleListItemProps {
  year: number;
  make: string;
  model: string;
  licensePlate?: string;
  lastService?: string;
  onPress: () => void;
}

const VehicleListItem: React.FC<VehicleListItemProps> = ({
  year,
  make,
  model,
  licensePlate,
  lastService,
  onPress,
}) => (
  <TouchableOpacity style={styles.container} onPress={onPress}>
    <View style={styles.details}>
      <Text style={styles.name}>{`${year} ${make} ${model}`}</Text>
      {licensePlate && <Text style={styles.subInfo}>License: {licensePlate}</Text>}
      {lastService && <Text style={styles.subInfo}>Last Service: {lastService}</Text>}
    </View>
    <IconButton icon="chevron-right" size={24} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  details: {
    flex: 1,
  },
  name: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  subInfo: {
    color: '#666',
    fontSize: 14,
  },
});

export default VehicleListItem;
