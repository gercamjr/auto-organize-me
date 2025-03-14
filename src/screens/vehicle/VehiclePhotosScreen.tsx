import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import {
  Text,
  FAB,
  ActivityIndicator,
  IconButton,
  Divider,
  Card,
  Button,
} from 'react-native-paper';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { VehiclesStackParamList } from '../../navigation/VehiclesNavigator';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useVehicleRepository, VehiclePhoto } from '../../hooks/useVehicleRepository';
import { spacing, shadows } from '../../utils/theme';
import { format } from 'date-fns';

// Define types for the screen
type VehiclePhotosScreenNavigationProp = StackNavigationProp<
  VehiclesStackParamList,
  'VehiclePhotos'
>;
type VehiclePhotosScreenRouteProp = RouteProp<VehiclesStackParamList, 'VehiclePhotos'>;

const VehiclePhotosScreen: React.FC = () => {
  const vehicleRepository = useVehicleRepository();
  const navigation = useNavigation<VehiclePhotosScreenNavigationProp>();
  const route = useRoute<VehiclePhotosScreenRouteProp>();
  const { vehicleId } = route.params;

  const [photos, setPhotos] = useState<VehiclePhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vehicleMakeModel, setVehicleMakeModel] = useState<string>('');

  // Load photos and vehicle info
  const loadPhotos = async () => {
    try {
      setError(null);

      // Get photos
      const vehiclePhotos = await vehicleRepository.getVehiclePhotos(vehicleId);
      setPhotos(vehiclePhotos);

      // Get vehicle info for the header
      const vehicle = await vehicleRepository.getVehicleWithClient(vehicleId);
      if (vehicle) {
        setVehicleMakeModel(`${vehicle.year} ${vehicle.make} ${vehicle.model}`);
      }
    } catch (err) {
      console.error('Error loading photos:', err);
      setError('Failed to load photos');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadPhotos();
  }, [vehicleId]);

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    loadPhotos();
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch (err) {
      return 'Unknown date';
    }
  };

  // Take a photo with the camera
  const takePhoto = async () => {
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera permission is required to take photos');
        return;
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        savePhoto(result.assets[0].uri);
      }
    } catch (err) {
      console.error('Error taking photo:', err);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  // Pick a photo from the library
  const pickPhoto = async () => {
    try {
      // Request media library permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Media library permission is required to pick photos');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        savePhoto(result.assets[0].uri);
      }
    } catch (err) {
      console.error('Error picking photo:', err);
      Alert.alert('Error', 'Failed to pick photo');
    }
  };

  // Save photo to app storage and database
  const savePhoto = async (uri: string) => {
    try {
      setUploading(true);

      // Create app documents directory if it doesn't exist
      const vehiclePhotosDir = `${FileSystem.documentDirectory}vehicle_photos/`;
      const dirInfo = await FileSystem.getInfoAsync(vehiclePhotosDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(vehiclePhotosDir, { intermediates: true });
      }

      // Generate a unique filename
      const filename = `vehicle_${vehicleId}_${new Date().getTime()}.jpg`;
      const newUri = `${vehiclePhotosDir}${filename}`;

      // Copy the photo to app storage
      await FileSystem.copyAsync({
        from: uri,
        to: newUri,
      });

      // Save to database
      const photo = await vehicleRepository.addVehiclePhoto(vehicleId, newUri);

      // Update the photos list
      setPhotos((prevPhotos) => [photo, ...prevPhotos]);

      setUploading(false);
    } catch (err) {
      console.error('Error saving photo:', err);
      Alert.alert('Error', 'Failed to save photo');
      setUploading(false);
    }
  };

  // Delete a photo
  const handleDeletePhoto = (photoId: string, photoUri: string) => {
    Alert.alert('Delete Photo', 'Are you sure you want to delete this photo?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            // Delete from database
            await vehicleRepository.deleteVehiclePhoto(photoId);

            // Delete the file
            await FileSystem.deleteAsync(photoUri, { idempotent: true });

            // Update state
            setPhotos((prevPhotos) => prevPhotos.filter((p) => p.id !== photoId));
          } catch (err) {
            console.error('Error deleting photo:', err);
            Alert.alert('Error', 'Failed to delete photo');
          }
        },
      },
    ]);
  };

  // Show photo options
  const showPhotoOptions = () => {
    Alert.alert('Add Photo', 'Choose an option', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Take Photo', onPress: takePhoto },
      { text: 'Choose from Library', onPress: pickPhoto },
    ]);
  };

  // Render a photo item
  const renderPhotoItem = ({ item }: { item: VehiclePhoto }) => (
    <Card style={styles.photoCard}>
      <Image source={{ uri: item.photoUri }} style={styles.photo} />
      <View style={styles.photoDetails}>
        <View style={styles.photoInfo}>
          <Text style={styles.photoDate}>{formatDate(item.createdAt)}</Text>
          {item.description && <Text style={styles.photoDescription}>{item.description}</Text>}
        </View>
        <IconButton
          icon="delete"
          size={20}
          onPress={() => handleDeletePhoto(item.id, item.photoUri)}
        />
      </View>
    </Card>
  );

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading photos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with vehicle info */}
      <Card style={styles.headerCard}>
        <Card.Content>
          <Text style={styles.headerTitle}>{vehicleMakeModel}</Text>
          <Text style={styles.headerSubtitle}>
            {photos.length} {photos.length === 1 ? 'photo' : 'photos'}
          </Text>
        </Card.Content>
      </Card>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Button mode="contained" onPress={handleRefresh}>
            Retry
          </Button>
        </View>
      )}

      <FlatList
        data={photos}
        keyExtractor={(item) => item.id}
        renderItem={renderPhotoItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No photos yet</Text>
            <Text style={styles.emptySubtext}>
              Add photos of this vehicle using the button below
            </Text>
          </View>
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      />

      <FAB
        style={styles.fab}
        icon="camera-plus"
        onPress={showPhotoOptions}
        loading={uploading}
        disabled={uploading}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerCard: {
    margin: spacing.md,
    ...shadows.small,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#666',
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.md * 2 + 56, // Extra space for FAB
  },
  photoCard: {
    marginBottom: spacing.md,
    ...shadows.small,
  },
  photo: {
    width: '100%',
    height: 250,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  photoDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.sm,
  },
  photoInfo: {
    flex: 1,
  },
  photoDate: {
    fontSize: 14,
    color: '#666',
  },
  photoDescription: {
    marginTop: 4,
  },
  fab: {
    position: 'absolute',
    margin: spacing.md,
    right: 0,
    bottom: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
  },
  errorContainer: {
    margin: spacing.md,
    padding: spacing.md,
    backgroundColor: '#ffebee',
    borderRadius: 4,
    alignItems: 'center',
  },
  errorText: {
    color: '#d32f2f',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: spacing.xl,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
});

export default VehiclePhotosScreen;
