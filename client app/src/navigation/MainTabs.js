import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  FlatList,
  StatusBar,
  Alert,
  Modal,
  RefreshControl
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Ionicons';
import { Calendar } from 'react-native-calendars';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Authentication Screen
const LoginScreen = ({ navigation }) => {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);

  const handleSendOtp = () => {
    if (phone.length === 10) {
      setIsOtpSent(true);
      Alert.alert('OTP Sent', 'OTP has been sent to your mobile number');
    } else {
      Alert.alert('Error', 'Please enter a valid 10-digit mobile number');
    }
  };

  const handleVerifyOtp = () => {
    if (otp === '1234') { // Simple mock verification
      navigation.replace('Main');
    } else {
      Alert.alert('Error', 'Invalid OTP. Please try again.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.authContainer}>
      <Image 
        source={{ uri: 'https://placehold.co/150x150/FF69B4/FFFFFF/png?text=HN' }} 
        style={styles.logo} 
      />
      <Text style={styles.appTitle}>Hello Nature Vendor</Text>
      <Text style={styles.appSubtitle}>Manage your appointments and earnings</Text>
      
      <View style={styles.authForm}>
        <Text style={styles.inputLabel}>Mobile Number</Text>
        <View style={styles.inputContainer}>
          <Text style={styles.countryCode}>+91</Text>
          <TextInput
            style={styles.phoneInput}
            placeholder="Enter your mobile number"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            maxLength={10}
          />
        </View>
        
        {isOtpSent && (
          <>
            <Text style={styles.inputLabel}>Enter OTP</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter OTP"
              keyboardType="number-pad"
              value={otp}
              onChangeText={setOtp}
              maxLength={4}
            />
          </>
        )}
        
        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={isOtpSent ? handleVerifyOtp : handleSendOtp}
        >
          <Text style={styles.primaryButtonText}>
            {isOtpSent ? 'Verify & Login' : 'Send OTP'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Use Email Instead</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.termsText}>
        By continuing, you agree to our Terms of Service and Privacy Policy
      </Text>
    </ScrollView>
  );
};

// Dashboard Screen
const DashboardScreen = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    todayAppointments: 8,
    completed: 5,
    pending: 3,
    totalEarnings: 12500,
    rating: 4.7
  });

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      Alert.alert('Refreshed', 'Data has been updated');
    }, 1500);
  };

  const upcomingAppointments = [
    { id: '1', customer: 'Priya Sharma', service: 'Hair Cut & Styling', time: '10:30 AM', status: 'confirmed' },
    { id: '2', customer: 'Rahul Verma', service: 'Facial & Cleanup', time: '12:00 PM', status: 'confirmed' },
    { id: '3', customer: 'Anjali Patel', service: 'Manicure & Pedicure', time: '2:30 PM', status: 'confirmed' },
    { id: '4', customer: 'Sanjay Mehta', service: 'Massage Therapy', time: '4:00 PM', status: 'pending' },
  ];

  const renderAppointmentItem = ({ item }) => (
    <View style={styles.appointmentCard}>
      <View style={styles.appointmentHeader}>
        <Text style={styles.customerName}>{item.customer}</Text>
        <View style={[styles.statusBadge, 
          { backgroundColor: item.status === 'confirmed' ? '#4CAF50' : '#FF9800' }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      <Text style={styles.serviceText}>{item.service}</Text>
      <View style={styles.appointmentFooter}>
        <Text style={styles.timeText}><Icon name="time-outline" size={14} /> {item.time}</Text>
        <TouchableOpacity style={styles.detailsButton}>
          <Text style={styles.detailsButtonText}>View Details</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeText}>Hello, Sunita!</Text>
        <Text style={styles.subWelcomeText}>Here's your schedule for today</Text>
      </View>
      
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.todayAppointments}</Text>
          <Text style={styles.statLabel}>Today's Appointments</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.completed}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>₹{stats.totalEarnings}</Text>
          <Text style={styles.statLabel}>Earnings</Text>
        </View>
      </View>
      
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Appointments</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Bookings')}>
            <Text style={styles.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>
        
        <FlatList
          data={upcomingAppointments}
          renderItem={renderAppointmentItem}
          keyExtractor={item => item.id}
          scrollEnabled={false}
        />
      </View>
      
      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Schedule')}>
            <Icon name="calendar" size={24} color="#fff" />
            <Text style={styles.actionButtonText}>My Schedule</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate('Earnings')}>
            <Icon name="wallet" size={24} color="#fff" />
            <Text style={styles.actionButtonText}>Earnings</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

// Bookings Screen
const BookingsScreen = () => {
  const [selectedTab, setSelectedTab] = useState('upcoming');
  const [bookings, setBookings] = useState({
    upcoming: [
      { id: '1', customer: 'Priya Sharma', service: 'Hair Cut & Styling', date: 'Today', time: '10:30 AM', address: 'Sector 15, Noida' },
      { id: '2', customer: 'Rahul Verma', service: 'Facial & Cleanup', date: 'Today', time: '12:00 PM', address: 'Sector 18, Noida' },
      { id: '3', customer: 'Anjali Patel', service: 'Manicure & Pedicure', date: 'Today', time: '2:30 PM', address: 'Sector 62, Noida' },
    ],
    pending: [
      { id: '4', customer: 'Sanjay Mehta', service: 'Massage Therapy', date: 'Today', time: '4:00 PM', address: 'Sector 128, Noida' },
    ],
    completed: [
      { id: '5', customer: 'Neha Singh', service: 'Hair Color', date: 'Yesterday', time: '11:00 AM', address: 'Sector 50, Noida' },
      { id: '6', customer: 'Vikram Roy', service: 'Beard Styling', date: 'Yesterday', time: '3:00 PM', address: 'Sector 76, Noida' },
    ]
  });

  const renderBookingItem = ({ item }) => (
    <View style={styles.bookingCard}>
      <View style={styles.bookingHeader}>
        <Text style={styles.bookingCustomer}>{item.customer}</Text>
        <Text style={styles.bookingDate}>{item.date} • {item.time}</Text>
      </View>
      <Text style={styles.bookingService}>{item.service}</Text>
      <View style={styles.bookingAddress}>
        <Icon name="location-outline" size={14} color="#666" />
        <Text style={styles.bookingAddressText}>{item.address}</Text>
      </View>
      <View style={styles.bookingActions}>
        {selectedTab === 'pending' && (
          <>
            <TouchableOpacity style={styles.acceptButton}>
              <Text style={styles.acceptButtonText}>Accept</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.rejectButton}>
              <Text style={styles.rejectButtonText}>Reject</Text>
            </TouchableOpacity>
          </>
        )}
        {selectedTab === 'upcoming' && (
          <TouchableOpacity style={styles.trackButton}>
            <Text style={styles.trackButtonText}>Start Service</Text>
          </TouchableOpacity>
        )}
        {selectedTab === 'completed' && (
          <TouchableOpacity style={styles.invoiceButton}>
            <Text style={styles.invoiceButtonText}>View Invoice</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, selectedTab === 'upcoming' && styles.activeTab]}
          onPress={() => setSelectedTab('upcoming')}
        >
          <Text style={[styles.tabText, selectedTab === 'upcoming' && styles.activeTabText]}>
            Upcoming
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, selectedTab === 'pending' && styles.activeTab]}
          onPress={() => setSelectedTab('pending')}
        >
          <Text style={[styles.tabText, selectedTab === 'pending' && styles.activeTabText]}>
            Pending
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, selectedTab === 'completed' && styles.activeTab]}
          onPress={() => setSelectedTab('completed')}
        >
          <Text style={[styles.tabText, selectedTab === 'completed' && styles.activeTabText]}>
            Completed
          </Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={bookings[selectedTab]}
        renderItem={renderBookingItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.bookingsList}
      />
    </View>
  );
};

// Schedule Screen
const ScheduleScreen = () => {
  const [selectedDate, setSelectedDate] = useState('');
  const [appointments, setAppointments] = useState([
    { id: '1', time: '10:00 AM', service: 'Hair Cut', customer: 'Priya S.' },
    { id: '2', time: '12:30 PM', service: 'Facial', customer: 'Rahul V.' },
    { id: '3', time: '3:00 PM', service: 'Manicure', customer: 'Anjali P.' },
    { id: '4', time: '5:30 PM', service: 'Massage', customer: 'Sanjay M.' },
  ]);

  const markedDates = {
    '2023-10-15': { marked: true, dotColor: '#50cebb' },
    '2023-10-16': { marked: true, dotColor: '#50cebb' },
    '2023-10-17': { marked: true, dotColor: '#50cebb' },
    '2023-10-20': { marked: true, dotColor: '#50cebb' },
    '2023-10-22': { marked: true, dotColor: '#50cebb', active: true },
    '2023-10-23': { marked: true, dotColor: '#50cebb' },
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

  return (
    <View style={styles.container}>
      <Calendar
        onDayPress={day => setSelectedDate(day.dateString)}
        markedDates={markedDates}
        theme={{
          selectedDayBackgroundColor: '#FF69B4',
          todayTextColor: '#FF69B4',
          arrowColor: '#FF69B4',
        }}
      />
      
      <View style={styles.scheduleListContainer}>
        <Text style={styles.scheduleTitle}>Appointments for {selectedDate || 'Today'}</Text>
        <FlatList
          data={appointments}
          renderItem={renderAppointment}
          keyExtractor={item => item.id}
        />
      </View>
    </View>
  );
};

// Earnings Screen
const EarningsScreen = () => {
  const [selectedRange, setSelectedRange] = useState('week');
  const [earnings, setEarnings] = useState({
    total: 12500,
    completedJobs: 18,
    pendingPayout: 3200,
    transactions: [
      { id: '1', date: '15 Oct 2023', service: 'Hair Cut', customer: 'Priya S.', amount: 600 },
      { id: '2', date: '15 Oct 2023', service: 'Facial', customer: 'Rahul V.', amount: 1200 },
      { id: '3', date: '14 Oct 2023', service: 'Manicure', customer: 'Anjali P.', amount: 800 },
      { id: '4', date: '14 Oct 2023', service: 'Massage', customer: 'Sanjay M.', amount: 1500 },
      { id: '5', date: '13 Oct 2023', service: 'Hair Color', customer: 'Neha S.', amount: 1800 },
    ]
  });

  const renderTransaction = ({ item }) => (
    <View style={styles.transactionItem}>
      <View style={styles.transactionInfo}>
        <Text style={styles.transactionService}>{item.service}</Text>
        <Text style={styles.transactionCustomer}>{item.customer} • {item.date}</Text>
      </View>
      <Text style={styles.transactionAmount}>₹{item.amount}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.earningsHeader}>
        <Text style={styles.earningsTitle}>Your Earnings</Text>
        <View style={styles.rangeSelector}>
          <TouchableOpacity 
            style={[styles.rangeButton, selectedRange === 'week' && styles.activeRangeButton]}
            onPress={() => setSelectedRange('week')}
          >
            <Text style={[styles.rangeButtonText, selectedRange === 'week' && styles.activeRangeButtonText]}>
              Week
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.rangeButton, selectedRange === 'month' && styles.activeRangeButton]}
            onPress={() => setSelectedRange('month')}
          >
            <Text style={[styles.rangeButtonText, selectedRange === 'month' && styles.activeRangeButtonText]}>
              Month
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.rangeButton, selectedRange === 'year' && styles.activeRangeButton]}
            onPress={() => setSelectedRange('year')}
          >
            <Text style={[styles.rangeButtonText, selectedRange === 'year' && styles.activeRangeButtonText]}>
              Year
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.earningsStats}>
        <View style={styles.earningsCard}>
          <Text style={styles.earningsAmount}>₹{earnings.total}</Text>
          <Text style={styles.earningsLabel}>Total Earnings</Text>
        </View>
        <View style={styles.earningsCard}>
          <Text style={styles.earningsAmount}>{earnings.completedJobs}</Text>
          <Text style={styles.earningsLabel}>Completed Jobs</Text>
        </View>
        <View style={styles.earningsCard}>
          <Text style={styles.earningsAmount}>₹{earnings.pendingPayout}</Text>
          <Text style={styles.earningsLabel}>Pending Payout</Text>
        </View>
      </View>
      
      <View style={styles.transactionsSection}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        <FlatList
          data={earnings.transactions}
          renderItem={renderTransaction}
          keyExtractor={item => item.id}
          scrollEnabled={false}
        />
        
        <TouchableOpacity style={styles.viewAllButton}>
          <Text style={styles.viewAllButtonText}>View All Transactions</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.payoutSection}>
        <Text style={styles.sectionTitle}>Next Payout</Text>
        <View style={styles.payoutCard}>
          <Text style={styles.payoutAmount}>₹3,200</Text>
          <Text style={styles.payoutDate}>Scheduled for: 25 Oct 2023</Text>
          <Text style={styles.payoutInfo}>Processed every Wednesday to your registered bank account</Text>
        </View>
      </View>
    </ScrollView>
  );
};

// Profile Screen
const ProfileScreen = ({ navigation }) => {
  const [profile, setProfile] = useState({
    name: 'Sunita Verma',
    phone: '+91 9876543210',
    email: 'sunita.verma@example.com',
    skills: ['Hair Styling', 'Facial', 'Manicure', 'Pedicure'],
    rating: 4.7,
    completedJobs: 125,
    memberSince: 'Jan 2022'
  });

  const [isLogoutModalVisible, setLogoutModalVisible] = useState(false);

  const menuItems = [
    { id: '1', icon: 'person-outline', title: 'Edit Profile', screen: 'EditProfile' },
    { id: '2', icon: 'document-text-outline', title: 'Documents & Certificates', screen: 'Documents' },
    { id: '3', icon: 'location-outline', title: 'Service Areas', screen: 'ServiceAreas' },
    { id: '4', icon: 'time-outline', title: 'Working Hours', screen: 'WorkingHours' },
    { id: '5', icon: 'card-outline', title: 'Bank Details', screen: 'BankDetails' },
    { id: '6', icon: 'help-circle-outline', title: 'Help & Support', screen: 'Support' },
    { id: '7', icon: 'shield-checkmark-outline', title: 'Privacy Policy', screen: 'Privacy' },
    { id: '8', icon: 'log-out-outline', title: 'Logout', action: () => setLogoutModalVisible(true) },
  ];

  const handleLogout = () => {
    setLogoutModalVisible(false);
    navigation.replace('Login');
  };

  const renderMenuItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.menuItem}
      onPress={() => item.action ? item.action() : navigation.navigate(item.screen)}
    >
      <Icon name={item.icon} size={20} color="#555" />
      <Text style={styles.menuItemText}>{item.title}</Text>
      <Icon name="chevron-forward" size={16} color="#999" />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileHeader}>
        <Image 
          source={{ uri: 'https://placehold.co/100x100/FF69B4/FFFFFF/png?text=SV' }} 
          style={styles.profileImage} 
        />
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{profile.name}</Text>
          <Text style={styles.profileContact}>{profile.phone} • {profile.email}</Text>
          <View style={styles.ratingContainer}>
            <Icon name="star" size={14} color="#FFD700" />
            <Text style={styles.ratingText}>{profile.rating} • {profile.completedJobs} jobs</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.skillsContainer}>
        {profile.skills.map((skill, index) => (
          <View key={index} style={styles.skillTag}>
            <Text style={styles.skillText}>{skill}</Text>
          </View>
        ))}
      </View>
      
      <View style={styles.menuContainer}>
        <FlatList
          data={menuItems}
          renderItem={renderMenuItem}
          keyExtractor={item => item.id}
          scrollEnabled={false}
        />
      </View>
      
      <Modal
        animationType="slide"
        transparent={true}
        visible={isLogoutModalVisible}
        onRequestClose={() => setLogoutModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Logout</Text>
            <Text style={styles.modalMessage}>Are you sure you want to logout?</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setLogoutModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.logoutButton]}
                onPress={handleLogout}
              >
                <Text style={styles.logoutButtonText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

// Tab Navigator
const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Bookings') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Schedule') {
            iconName = focused ? 'time' : 'time-outline';
          } else if (route.name === 'Earnings') {
            iconName = focused ? 'wallet' : 'wallet-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#FF69B4',
        tabBarInactiveTintColor: 'gray',
        headerStyle: {
          backgroundColor: '#FF69B4',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Bookings" component={BookingsScreen} />
      <Tab.Screen name="Schedule" component={ScheduleScreen} />
      <Tab.Screen name="Earnings" component={EarningsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

// Main App Navigator
const App = () => {
  return (
    <NavigationContainer>
      <StatusBar backgroundColor="#FF69B4" barStyle="light-content" />
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="Main" 
          component={TabNavigator} 
          options={{ headerShown: false }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

// Styles
const styles = StyleSheet.create({
  // Auth Styles
  authContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 15,
    borderRadius: 10,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF69B4',
    marginBottom: 5,
  },
  appSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  authForm: {
    width: '100%',
    maxWidth: 400,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
  },
  countryCode: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#f5f5f5',
    color: '#333',
    fontWeight: '600',
  },
  phoneInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    fontSize: 16,
  },
  primaryButton: {
    backgroundColor: '#FF69B4',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FF69B4',
    marginBottom: 30,
  },
  secondaryButtonText: {
    color: '#FF69B4',
    fontSize: 16,
    fontWeight: '600',
  },
  termsText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
  
  // Dashboard Styles
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  welcomeSection: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subWelcomeText: {
    fontSize: 14,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: '#fff',
    margin: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statCard: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF69B4',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 10,
    padding: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  seeAllText: {
    fontSize: 14,
    color: '#FF69B4',
    fontWeight: '600',
  },
  appointmentCard: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  appointmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  serviceText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  appointmentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 13,
    color: '#666',
  },
  detailsButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#eee',
  },
  detailsButtonText: {
    fontSize: 12,
    color: '#666',
  },
  quickActions: {
    padding: 15,
    backgroundColor: '#fff',
    marginTop: 10,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#FF69B4',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 5,
  },
  
  // Bookings Styles
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    padding: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#FF69B4',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#FF69B4',
  },
  bookingsList: {
    padding: 15,
  },
  bookingCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bookingCustomer: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  bookingDate: {
    fontSize: 12,
    color: '#666',
  },
  bookingService: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  bookingAddress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  bookingAddressText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 5,
  },
  bookingActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  acceptButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    marginRight: 8,
  },
  acceptButtonText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  rejectButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f44336',
    marginRight: 8,
  },
  rejectButtonText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  trackButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#2196F3',
  },
  trackButtonText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  invoiceButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#FF69B4',
  },
  invoiceButtonText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  
  // Schedule Styles
  scheduleListContainer: {
    flex: 1,
    padding: 15,
    backgroundColor: '#fff',
  },
  scheduleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  scheduleTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    width: 70,
  },
  scheduleDetails: {
    flex: 1,
    marginLeft: 10,
  },
  scheduleService: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  scheduleCustomer: {
    fontSize: 14,
    color: '#666',
  },
  scheduleAction: {
    padding: 5,
  },
  
  // Earnings Styles
  earningsHeader: {
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  earningsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  rangeSelector: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 4,
  },
  rangeButton: {
    flex: 1,
    padding: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeRangeButton: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  rangeButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  activeRangeButtonText: {
    color: '#FF69B4',
  },
  earningsStats: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#fff',
    marginTop: 10,
  },
  earningsCard: {
    flex: 1,
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginHorizontal: 5,
  },
  earningsAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF69B4',
    marginBottom: 5,
  },
  earningsLabel: {
    fontSize: 12,
    color: '#666',
  },
  transactionsSection: {
    padding: 15,
    backgroundColor: '#fff',
    marginTop: 10,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionService: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  transactionCustomer: {
    fontSize: 12,
    color: '#666',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  viewAllButton: {
    padding: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  viewAllButtonText: {
    fontSize: 14,
    color: '#FF69B4',
    fontWeight: '600',
  },
  payoutSection: {
    padding: 15,
    backgroundColor: '#fff',
    marginTop: 10,
    marginBottom: 20,
  },
  payoutCard: {
    padding: 15,
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  payoutAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: 5,
  },
  payoutDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  payoutInfo: {
    fontSize: 12,
    color: '#666',
  },
  
  // Profile Styles
  profileHeader: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 15,
  },
  profileInfo: {
    justifyContent: 'center',
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  profileContact: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  skillTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  skillText: {
    fontSize: 12,
    color: '#666',
  },
  menuContainer: {
    marginTop: 10,
    backgroundColor: '#fff',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 15,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#f44336',
  },
  logoutButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default App;