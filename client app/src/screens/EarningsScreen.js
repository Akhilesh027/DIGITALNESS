import React, { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

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

export default EarningsScreen;

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
