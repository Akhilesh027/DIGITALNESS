import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BookingsScreen = () => {
  const [selectedTab, setSelectedTab] = useState("upcoming");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [staffId, setStaffId] = useState(null);
  const [actionLoadingIds, setActionLoadingIds] = useState(new Set()); // To prevent multiple actions on same item

  // Load staffId once
  useEffect(() => {
    const getStaffId = async () => {
      try {
        const id = await AsyncStorage.getItem("staffId");
        if (id) setStaffId(id);
        else setError("Staff ID not found");
      } catch {
        setError("Failed to load staff ID");
      }
    };
    getStaffId();
  }, []);

  // Fetch bookings from backend
  const fetchBookings = useCallback(async () => {
    if (!staffId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `https://beauty-backend-ci9o.onrender.com/api/bookings/assigned/${staffId}?status=${selectedTab}`
      );
      if (!response.ok) throw new Error("Error fetching bookings");
      const data = await response.json();
      setBookings(data);
    } catch (e) {
      setError(e.message);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [staffId, selectedTab]);

  // Call fetchBookings on tab or staffId change
  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Update booking status for accept/reject/start service
  const updateBookingStatus = async (bookingId, action) => {
    if (actionLoadingIds.has(bookingId)) return; // Prevent multiple clicks
    setActionLoadingIds((prev) => new Set(prev).add(bookingId));
    try {
      const url = `https://beauty-backend-ci9o.onrender.com/api/bookings/${bookingId}/${action}`;
      const response = await fetch(url, { method: "POST" });
      if (!response.ok) throw new Error(`Failed to ${action} booking`);
      const data = await response.json();
      Alert.alert("Success", data.message);
      await fetchBookings();
    } catch (e) {
      Alert.alert("Error", e.message);
    } finally {
      setActionLoadingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(bookingId);
        return newSet;
      });
    }
  };

  // Render booking item with status badge and action buttons
  const renderBookingItem = ({ item }) => {
    const orderDate = new Date(item.orderDate);
    const formattedDate = orderDate.toLocaleDateString();
    const formattedTime = orderDate.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const fullAddress = `${item.address?.street?.trim() || ""}, ${
      item.address?.city || ""
    }, ${item.address?.state || ""}, ${item.address?.zipCode || ""}`;

    const status = item.status || "pending";
    let statusColor = "#FF9800"; // Pending = orange
    if (status === "confirmed" || status === "accepted")
      statusColor = "#4CAF50"; // Confirmed = green
    else if (status === "rejected") statusColor = "#f44336"; // Rejected = red

    const isLoadingAction = actionLoadingIds.has(item._id);

    return (
      <View style={styles.bookingCard}>
        <View style={styles.bookingHeader}>
          <Text style={styles.bookingCustomer}>
            {item.address?.fullName || "Unknown"}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </View>
        </View>
        <Text style={styles.bookingDate}>
          {formattedDate} • {formattedTime}
        </Text>
        <Text style={styles.bookingService}>
          {/* TODO: Replace with real service info */}
          Service details not available
        </Text>
        <View style={styles.bookingAddress}>
          <Icon name="location-outline" size={14} color="#666" />
          <Text style={styles.bookingAddressText}>{fullAddress}</Text>
        </View>
        <View style={styles.bookingActions}>
          {selectedTab === "pending" && (
            <>
              <TouchableOpacity
                style={[
                  styles.acceptButton,
                  isLoadingAction && { opacity: 0.6 },
                ]}
                onPress={() => updateBookingStatus(item._id, "accept")}
                disabled={isLoadingAction}
              >
                <Text style={styles.acceptButtonText}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.rejectButton,
                  isLoadingAction && { opacity: 0.6 },
                ]}
                onPress={() => updateBookingStatus(item._id, "reject")}
                disabled={isLoadingAction}
              >
                <Text style={styles.rejectButtonText}>Reject</Text>
              </TouchableOpacity>
            </>
          )}

          {selectedTab === "upcoming" && status === "pending" && (
            <TouchableOpacity
              style={[styles.trackButton, isLoadingAction && { opacity: 0.6 }]}
              onPress={() => updateBookingStatus(item._id, "accept")}
              disabled={isLoadingAction}
            >
              <Text style={styles.trackButtonText}>Start Service</Text>
            </TouchableOpacity>
          )}

          {selectedTab === "upcoming" && status === "confirmed" && (
            <>
              <TouchableOpacity
                style={[
                  styles.acceptButton,
                  isLoadingAction && { opacity: 0.6 },
                ]}
                onPress={() => updateBookingStatus(item._id, "complete")}
                disabled={isLoadingAction}
              >
                <Text style={styles.acceptButtonText}>Complete</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.rejectButton,
                  isLoadingAction && { opacity: 0.6 },
                ]}
                onPress={() => updateBookingStatus(item._id, "not_completed")}
                disabled={isLoadingAction}
              >
                <Text style={styles.rejectButtonText}>Not Completed</Text>
              </TouchableOpacity>
            </>
          )}

          {selectedTab === "completed" && (
            <TouchableOpacity
              style={styles.invoiceButton}
              onPress={() => Alert.alert("Invoice", "View Invoice clicked")}
            >
              <Text style={styles.invoiceButtonText}>View Invoice</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabContainer}>
        {["upcoming", "pending", "completed"].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, selectedTab === tab && styles.activeTab]}
            onPress={() => setSelectedTab(tab)}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === tab && styles.activeTabText,
              ]}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Loading */}
      {loading && (
        <ActivityIndicator
          size="large"
          color="#FF69B4"
          style={{ marginTop: 20 }}
        />
      )}

      {/* Error */}
      {error && (
        <Text style={{ textAlign: "center", color: "red", marginTop: 20 }}>
          {error}
        </Text>
      )}

      {/* Booking List */}
      {!loading && !error && (
        <FlatList
          data={bookings}
          renderItem={renderBookingItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.bookingsList}
          ListEmptyComponent={
            <Text style={{ textAlign: "center", marginTop: 20 }}>
              No bookings found
            </Text>
          }
        />
      )}
    </View>
  );
};

export default BookingsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  tab: {
    flex: 1,
    padding: 15,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#FF69B4",
  },
  tabText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },
  activeTabText: {
    color: "#FF69B4",
  },
  bookingsList: {
    padding: 15,
  },
  bookingCard: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  bookingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  bookingCustomer: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  bookingDate: {
    fontSize: 12,
    color: "#666",
  },
  bookingService: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  bookingAddress: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  bookingAddressText: {
    fontSize: 13,
    color: "#666",
    marginLeft: 5,
  },
  bookingActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  acceptButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#4CAF50",
    marginRight: 8,
  },
  acceptButtonText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "600",
  },
  rejectButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#f44336",
    marginRight: 8,
  },
  rejectButtonText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "600",
  },
  trackButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#2196F3",
  },
  trackButtonText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "600",
  },
  invoiceButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#FF69B4",
  },
  invoiceButtonText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "600",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  statusText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "600",
  },
});
