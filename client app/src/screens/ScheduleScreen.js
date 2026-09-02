import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ScheduleScreen = () => {
  const [selectedDate, setSelectedDate] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [markedDates, setMarkedDates] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [staffId, setStaffId] = useState(null);

  // Load staffId from AsyncStorage on mount
  useEffect(() => {
    AsyncStorage.getItem('staffId')
      .then((id) => {
        if (id) setStaffId(id);
        else setError('Staff ID not found');
      })
      .catch(() => setError('Failed to load staff ID'));
  }, []);

  // Fetch all appointments for staffId
  useEffect(() => {
    const fetchAppointments = async () => {
      if (!staffId) return;
      setLoading(true);
      try {
        const response = await fetch(`https://beauty-backend-ci9o.onrender.com/api/bookings/assigned/${staffId}`);
        if (!response.ok) throw new Error('Failed to fetch appointments');
        const data = await response.json();

        // Prepare markedDates object for calendar dots
        const marks = {};
        data.forEach((item) => {
          const dateStr = item.orderDate.slice(0, 10);
          if (marks[dateStr]) {
            // If date already marked, increment dots or keep same mark
            marks[dateStr] = { ...marks[dateStr], marked: true, dotColor: '#50cebb' };
          } else {
            marks[dateStr] = { marked: true, dotColor: '#50cebb' };
          }
        });

        // Highlight selectedDate in marks
        if (selectedDate) {
          marks[selectedDate] = { ...(marks[selectedDate] || {}), selected: true, selectedColor: '#FF69B4' };
        }

        setMarkedDates(marks);

        // Filter appointments for selectedDate, or today if none selected
        const filterDate = selectedDate || new Date().toISOString().slice(0, 10);

        const filtered = data.filter((item) => item.orderDate.slice(0, 10) === filterDate);

        // Map data for UI
        const mapped = filtered.map((item) => {
          const dateObj = new Date(item.orderDate);
          const hours = dateObj.getHours();
          const minutes = String(dateObj.getMinutes()).padStart(2, '0');
          const ampm = hours >= 12 ? 'PM' : 'AM';
          const displayHours = hours % 12 === 0 ? 12 : hours % 12;
          const time = `${displayHours}:${minutes} ${ampm}`;

          return {
            id: item._id,
            time,
            service: 'Service details not provided', // Update if available from item.cart
            customer: item.address?.fullName || 'Unknown',
          };
        });

        setAppointments(mapped);
        setError(null);
      } catch (e) {
        setError(e.message);
        setAppointments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [staffId, selectedDate]);

  const onDayPress = (day) => {
    setSelectedDate(day.dateString);
  };

  const renderAppointment = ({ item }) => (
    <View style={styles.scheduleItem}>
      <Text style={styles.scheduleTime}>{item.time}</Text>
      <View style={styles.scheduleDetails}>
        <Text style={styles.scheduleService}>{item.service}</Text>
        <Text style={styles.scheduleCustomer}>{item.customer}</Text>
      </View>
      <TouchableOpacity style={styles.scheduleAction}>
        <Icon name="ellipsis-vertical" size={16} color="#666" />
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#FF69B4" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
        <Text style={{ color: 'red', textAlign: 'center', marginBottom: 10 }}>{error}</Text>
        <TouchableOpacity onPress={() => setSelectedDate(selectedDate)} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Calendar
        onDayPress={onDayPress}
        markedDates={markedDates}
        theme={{
          selectedDayBackgroundColor: '#FF69B4',
          todayTextColor: '#FF69B4',
          arrowColor: '#FF69B4',
        }}
      />
      <View style={styles.scheduleListContainer}>
        <Text style={styles.scheduleTitle}>
          Appointments for {selectedDate || new Date().toISOString().slice(0, 10)}
        </Text>
        {appointments.length === 0 ? (
          <Text style={{ textAlign: 'center', marginTop: 20 }}>No appointments found</Text>
        ) : (
          <FlatList
            data={appointments}
            renderItem={renderAppointment}
            keyExtractor={(item) => item.id}
          />
        )}
      </View>
    </View>
  );
};

export default ScheduleScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  scheduleListContainer: { flex: 1, padding: 15, backgroundColor: '#fff' },
  scheduleTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  scheduleTime: { fontSize: 14, fontWeight: '600', color: '#333', width: 70 },
  scheduleDetails: { flex: 1, marginLeft: 10 },
  scheduleService: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 4 },
  scheduleCustomer: { fontSize: 14, color: '#666' },
  scheduleAction: { padding: 5 },
  primaryButton: {
    backgroundColor: '#FF69B4',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
