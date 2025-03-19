import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native';
import { Text, Card, FAB, Divider, ActivityIndicator, IconButton, Chip } from 'react-native-paper';
import { Calendar, DateData } from 'react-native-calendars';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AppointmentsStackParamList } from '../../navigation/AppointmentsNavigator';
import {
  useAppointmentRepository,
  AppointmentListItem,
} from '../../hooks/useAppointmentRepository';
import { spacing, shadows } from '../../utils/theme';
import { format, parse, isToday, isEqual, startOfDay } from 'date-fns';

// Define the navigation prop type
type AppointmentCalendarScreenNavigationProp = StackNavigationProp<
  AppointmentsStackParamList,
  'AppointmentCalendar'
>;

const AppointmentCalendarScreen: React.FC = () => {
  const navigation = useNavigation<AppointmentCalendarScreenNavigationProp>();
  const appointmentRepository = useAppointmentRepository();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [markedDates, setMarkedDates] = useState<{
    [date: string]: {
      dots: { key: string; color: string }[];
      selected?: boolean;
      selectedColor?: string;
    };
  }>({});
  const [appointments, setAppointments] = useState<AppointmentListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingSelectedDay, setLoadingSelectedDay] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [error, setError] = useState<string | null>(null);

  // Load all appointments and mark calendar dates
  const loadAppointments = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);

      // Get all appointments
      const allAppointments = await appointmentRepository.getAll();

      // Create marked dates object for calendar
      const marked: {
        [date: string]: {
          dots: { key: string; color: string }[];
          selected?: boolean;
          selectedColor?: string;
        };
      } = {};

      allAppointments.forEach((appointment) => {
        const date = parse(appointment.scheduledDate);
        const dateStr = format(date, 'yyyy-MM-dd');

        let dotColor = '#2196F3'; // Default blue

        // Set dot color based on appointment status
        switch (appointment.status) {
          case 'scheduled':
            dotColor = '#2196F3'; // Blue
            break;
          case 'confirmed':
            dotColor = '#4CAF50'; // Green
            break;
          case 'completed':
            dotColor = '#009688'; // Teal
            break;
          case 'canceled':
            dotColor = '#F44336'; // Red
            break;
          case 'no-show':
            dotColor = '#9C27B0'; // Purple
            break;
        }

        // If date already marked, add another dot
        if (marked[dateStr]) {
          marked[dateStr].dots.push({
            key: appointment.id,
            color: dotColor,
          });
        } else {
          // First appointment for this date
          marked[dateStr] = {
            dots: [
              {
                key: appointment.id,
                color: dotColor,
              },
            ],
          };
        }
      });

      // Mark today's date
      const today = format(new Date(), 'yyyy-MM-dd');
      if (marked[today]) {
        marked[today].selected = true;
        marked[today].selectedColor = 'rgba(33, 150, 243, 0.2)'; // Light blue
      } else {
        marked[today] = {
          selected: true,
          selectedColor: 'rgba(33, 150, 243, 0.2)', // Light blue
          dots: [],
        };
      }

      setMarkedDates(marked);

      // Load appointments for today
      await loadAppointmentsForDate(new Date());
    } catch (err) {
      console.error('Error loading appointments:', err);
      setError('Failed to load appointments. Please try again.');
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load appointments for a specific date
  const loadAppointmentsForDate = async (date: Date) => {
    try {
      setLoadingSelectedDay(true);

      // Convert Date object to yyyy-MM-dd format
      const dateStr = format(date, 'yyyy-MM-dd');

      // Get appointments for this date
      const appointmentsForDate = await appointmentRepository.getByDate(date);

      // Sort by time
      appointmentsForDate.sort((a, b) => {
        return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
      });

      setAppointments(appointmentsForDate);

      // Update marked dates to highlight the selected date
      const newMarkedDates = { ...markedDates };

      // Remove previous selection
      Object.keys(newMarkedDates).forEach((key) => {
        if (newMarkedDates[key].selected && !isEqual(parse(key), startOfDay(new Date()))) {
          newMarkedDates[key] = {
            ...newMarkedDates[key],
            selected: false,
          };
        }
      });

      // Mark new selection
      if (newMarkedDates[dateStr]) {
        newMarkedDates[dateStr] = {
          ...newMarkedDates[dateStr],
          selected: true,
          selectedColor: 'rgba(33, 150, 243, 0.2)', // Light blue
        };
      } else {
        newMarkedDates[dateStr] = {
          selected: true,
          selectedColor: 'rgba(33, 150, 243, 0.2)', // Light blue
          dots: [],
        };
      }

      setMarkedDates(newMarkedDates);
    } catch (err) {
      console.error('Error loading appointments for date:', err);
      Alert.alert('Error', 'Failed to load appointments for this date.');
    } finally {
      setLoadingSelectedDay(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  // Handle date selection
  const handleDateSelect = (date: DateData) => {
    const selectedDate = new Date(date.timestamp);
    setSelectedDate(selectedDate);
    loadAppointmentsForDate(selectedDate);
  };

  // Format time
  const formatTime = (dateString: string) => {
    try {
      const date = parse(dateString);
      return format(date, 'h:mm a');
    } catch (err: unknown) {
      console.error('Error formatting time:', err);
      return 'Invalid time';
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return '#2196F3'; // Blue
      case 'confirmed':
        return '#4CAF50'; // Green
      case 'completed':
        return '#009688'; // Teal
      case 'canceled':
        return '#F44336'; // Red
      case 'no-show':
        return '#9C27B0'; // Purple
      default:
        return '#757575'; // Grey
    }
  };

  // Format duration
  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
      return `${hours} hr`;
    }

    return `${hours} hr ${remainingMinutes} min`;
  };

  // Navigate to appointment details
  const handleAppointmentPress = (appointmentId: string) => {
    navigation.navigate('AppointmentDetails', { appointmentId });
  };

  // Render appointment item
  const renderAppointmentItem = ({ item }: { item: AppointmentListItem }) => {
    return (
      <TouchableOpacity onPress={() => handleAppointmentPress(item.id)}>
        <Card style={styles.appointmentCard}>
          <Card.Content>
            <View style={styles.appointmentHeader}>
              <Text style={styles.timeText}>{formatTime(item.scheduledDate)}</Text>
              <View style={styles.statusContainer}>
                <View
                  style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]}
                />
                <Text style={styles.statusText}>{item.status}</Text>
              </View>
            </View>

            <Divider style={styles.divider} />

            <View style={styles.appointmentContent}>
              <View style={styles.clientInfo}>
                <Text style={styles.clientName}>{item.clientName}</Text>
                <Text style={styles.vehicleInfo}>{item.vehicleInfo}</Text>

                <View style={styles.appointmentMeta}>
                  <Text style={styles.durationText}>{formatDuration(item.duration)}</Text>

                  {item.isHomeVisit && (
                    <Chip icon="home" style={styles.homeVisitChip} textStyle={styles.chipText}>
                      Home
                    </Chip>
                  )}
                </View>
              </View>

              <IconButton
                icon="chevron-right"
                size={24}
                onPress={() => handleAppointmentPress(item.id)}
              />
            </View>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  };

  // Render empty list message
  const renderEmptyList = () => {
    if (loadingSelectedDay) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="small" />
          <Text style={styles.emptyText}>Loading appointments...</Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No appointments for this day</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() =>
            navigation.navigate('AddEditAppointment', { initialDate: selectedDate.toISOString() })
          }
        >
          <Text style={styles.addButtonText}>+ Add Appointment</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading calendar...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Calendar
        markingType="multi-dot"
        markedDates={markedDates}
        onDayPress={handleDateSelect}
        theme={{
          todayTextColor: '#1976D2',
          arrowColor: '#1976D2',
          dotColor: '#1976D2',
          selectedDayBackgroundColor: '#1976D2',
        }}
        style={styles.calendar}
      />

      <View style={styles.appointmentsContainer}>
        <View style={styles.dateHeader}>
          <Text style={styles.dateTitle}>
            {isToday(selectedDate) ? 'Today' : format(selectedDate, 'EEEE, MMMM d, yyyy')}
          </Text>
          <Text style={styles.appointmentCount}>{appointments.length} appointments</Text>
        </View>

        <FlatList
          data={appointments}
          keyExtractor={(item) => item.id}
          renderItem={renderAppointmentItem}
          ListEmptyComponent={renderEmptyList}
          contentContainerStyle={styles.listContent}
        />
      </View>

      <FAB
        style={styles.fab}
        icon="plus"
        onPress={() =>
          navigation.navigate('AddEditAppointment', { initialDate: selectedDate.toISOString() })
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  calendar: {
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: spacing.sm,
  },
  appointmentsContainer: {
    flex: 1,
    padding: spacing.md,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  dateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  appointmentCount: {
    color: '#666',
  },
  listContent: {
    flexGrow: 1,
  },
  appointmentCard: {
    marginBottom: spacing.md,
    ...shadows.small,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#666',
    textTransform: 'capitalize',
  },
  divider: {
    marginVertical: spacing.sm,
  },
  appointmentContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  vehicleInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: spacing.xs,
  },
  appointmentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  durationText: {
    fontSize: 12,
    color: '#666',
    marginRight: spacing.sm,
  },
  homeVisitChip: {
    height: 24,
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
  },
  chipText: {
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: spacing.md,
  },
  addButton: {
    padding: spacing.sm,
  },
  addButtonText: {
    color: '#1976D2',
    fontWeight: 'bold',
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
});

export default AppointmentCalendarScreen;
