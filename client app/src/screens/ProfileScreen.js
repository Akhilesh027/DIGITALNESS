import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ProfileScreen = ({ navigation }) => {
  const [client, setClient] = useState(null);
  const [customer, setCustomer] = useState(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const clientData = await AsyncStorage.getItem("clientData");
    const customerData = await AsyncStorage.getItem("customerData");

    if (clientData) setClient(JSON.parse(clientData));
    if (customerData) setCustomer(JSON.parse(customerData));
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.multiRemove([
            "clientToken",
            "clientData",
            "customerData",
          ]);
          navigation.replace("Login");
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(client?.name || customer?.name || "D").charAt(0).toUpperCase()}
          </Text>
        </View>

        <Text style={styles.name}>{client?.name || customer?.name || "Client"}</Text>
        <Text style={styles.email}>{client?.email || customer?.email || "-"}</Text>

        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>
            {(client?.status || "active").toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Client Details</Text>

        <InfoRow label="Name" value={client?.name || customer?.name} />
        <InfoRow label="Email" value={client?.email || customer?.email} />
        <InfoRow
          label="Phone"
          value={
            client?.phone ||
            customer?.phone ||
            customer?.contactNumbers?.[0] ||
            "-"
          }
        />
        <InfoRow
          label="Business Type"
          value={client?.businessType || customer?.businessType || "-"}
        />
        <InfoRow label="Branch" value={client?.branchId || customer?.branchId || "-"} />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Company / Project Details</Text>

        <InfoRow label="Company Name" value={customer?.name || client?.name || "-"} />
        <InfoRow label="City" value={customer?.city || "-"} />
        <InfoRow label="Address" value={customer?.address || "-"} />
        <InfoRow label="Package" value={customer?.package || "-"} />
      </View>

      <View style={styles.supportCard}>
        <Text style={styles.supportTitle}>Digitalness Support</Text>
        <Text style={styles.supportText}>
          For project updates, corrections, approvals, invoices, or support,
          contact the Digitalness team.
        </Text>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const InfoRow = ({ label, value }) => {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || "-"}</Text>
    </View>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  content: {
    padding: 18,
    paddingBottom: 120,
  },

  headerCard: {
    backgroundColor: "#111827",
    borderRadius: 28,
    padding: 24,
    alignItems: "center",
    marginBottom: 18,
  },

  avatar: {
    width: 82,
    height: 82,
    borderRadius: 28,
    backgroundColor: "#FBBF24",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },

  avatarText: {
    fontSize: 36,
    fontWeight: "900",
    color: "#111827",
  },

  name: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "900",
  },

  email: {
    color: "#CBD5E1",
    fontSize: 13,
    marginTop: 6,
  },

  statusBadge: {
    backgroundColor: "#16A34A",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 14,
  },

  statusText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#111827",
    marginBottom: 12,
  },

  infoRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },

  infoLabel: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "800",
    marginBottom: 4,
  },

  infoValue: {
    fontSize: 15,
    color: "#111827",
    fontWeight: "800",
  },

  supportCard: {
    backgroundColor: "#FEF3C7",
    borderRadius: 22,
    padding: 18,
    marginBottom: 16,
  },

  supportTitle: {
    fontSize: 18,
    color: "#111827",
    fontWeight: "900",
    marginBottom: 8,
  },

  supportText: {
    color: "#444",
    fontSize: 13,
    lineHeight: 21,
  },

  logoutButton: {
    backgroundColor: "#DC2626",
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: "center",
  },

  logoutText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },
});