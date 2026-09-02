import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Linking,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE_URL = "http://localhost:5000/api";

const TeamScreen = () => {
  const [works, setWorks] = useState([]);
  const [client, setClient] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const safeJsonParse = (value) => {
    try {
      if (!value || value === "null" || value === "undefined") return null;
      return JSON.parse(value);
    } catch {
      return null;
    }
  };

  const getHeaders = async () => {
    const token = await AsyncStorage.getItem("clientToken");

    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  const extractCustomerId = (parsedClient, parsedCustomer) => {
    return (
      parsedCustomer?._id ||
      parsedCustomer?.id ||
      parsedCustomer?.customerId?._id ||
      parsedCustomer?.customerId ||
      parsedClient?.customerId?._id ||
      parsedClient?.customerId ||
      parsedClient?.customer?._id ||
      parsedClient?.customer ||
      parsedClient?.customerData?._id ||
      parsedClient?.customerData?.id
    );
  };

  const normalizeWorks = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.works)) return data.works;
    if (Array.isArray(data?.work)) return data.work;
    if (Array.isArray(data?.tasks)) return data.tasks;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.results)) return data.results;
    if (Array.isArray(data?.customer?.works)) return data.customer.works;
    if (Array.isArray(data?.customer?.tasks)) return data.customer.tasks;
    return [];
  };

  const fetchTeamData = async () => {
    try {
      const clientData = await AsyncStorage.getItem("clientData");
      const customerData = await AsyncStorage.getItem("customerData");

      const parsedClient = safeJsonParse(clientData);
      const parsedCustomer = safeJsonParse(customerData);

      setClient(parsedClient);
      setCustomer(parsedCustomer);

      const customerId = extractCustomerId(parsedClient, parsedCustomer);

      if (!customerId) {
        setWorks([]);
        return;
      }

      const headers = await getHeaders();

      const urls = [
        `${API_BASE_URL}/works/customer/${customerId}`,
        `${API_BASE_URL}/works?customer=${customerId}`,
        `${API_BASE_URL}/customers/${customerId}`,
      ];

      let finalWorks = [];

      for (const url of urls) {
        try {
          const response = await fetch(url, { headers });
          const data = await response.json();

          if (response.ok) {
            finalWorks = normalizeWorks(data);
            if (finalWorks.length > 0) break;
          }
        } catch (error) {
          console.log("Team API failed:", error.message);
        }
      }

      setWorks(finalWorks);
    } catch (error) {
      console.log("Team fetch error:", error.message);
      setWorks([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTeamData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTeamData();
  };

  const allItems = useMemo(() => {
    const items = [];

    works.forEach((work) => {
      items.push(work);

      const childTasks = [
        ...(Array.isArray(work.tasks) ? work.tasks : []),
        ...(Array.isArray(work.taskList) ? work.taskList : []),
        ...(Array.isArray(work.subTasks) ? work.subTasks : []),
        ...(Array.isArray(work.subtasks) ? work.subtasks : []),
        ...(Array.isArray(work.children) ? work.children : []),
      ];

      childTasks.forEach((task) => {
        items.push({
          ...task,
          parentTitle: work.title,
        });
      });
    });

    return items;
  }, [works]);

  const teamMembers = useMemo(() => {
    const map = {};

    allItems.forEach((work) => {
      const assignedUsers = Array.isArray(work.assignedTo)
        ? work.assignedTo
        : work.assignedTo
          ? [work.assignedTo]
          : [];

      assignedUsers.forEach((user) => {
        if (!user) return;

        const id =
          user._id ||
          user.id ||
          user.email ||
          user.name ||
          String(user);

        if (!map[id]) {
          map[id] = {
            id,
            name: user.name || user.email || "Team Member",
            email: user.email || "",
            phone: user.phone || "",
            role: user.role || "Employee",
            department: user.department || "Digitalness Team",
            works: [],
          };
        }

        map[id].works.push({
          title: work.title || work.taskName || work.name,
          status: work.status,
          dueDate: work.dueDate || work.deadline,
          parentTitle: work.parentTitle,
        });
      });
    });

    return Object.values(map);
  }, [allItems]);

  const openMail = (email) => {
    if (!email) return;
    Linking.openURL(`mailto:${email}`);
  };

  const openPhone = (phone) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`);
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#111827" />
        <Text style={styles.loaderText}>Loading team...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>Your Digitalness Team</Text>
        <Text style={styles.heroText}>
          View team members assigned to your works and tasks, including their
          roles, departments, and current responsibilities.
        </Text>

        <View style={styles.heroStats}>
          <View style={styles.heroStatItem}>
            <Text style={styles.heroStatValue}>{teamMembers.length}</Text>
            <Text style={styles.heroStatLabel}>Team Members</Text>
          </View>

          <View style={styles.heroStatItem}>
            <Text style={styles.heroStatValue}>{allItems.length}</Text>
            <Text style={styles.heroStatLabel}>Works & Tasks</Text>
          </View>
        </View>
      </View>

      <View style={styles.clientCard}>
        <Text style={styles.clientLabel}>Client</Text>

        <Text style={styles.clientName}>
          {client?.name || customer?.name || "Client"}
        </Text>

        <Text style={styles.clientInfo}>
          {customer?.businessType ||
            client?.businessType ||
            "Digitalness CRM Client"}
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Assigned Team Members</Text>

      {teamMembers.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>No team assigned yet</Text>
          <Text style={styles.emptyText}>
            Team members will appear here once Digitalness assigns work to your
            project.
          </Text>
        </View>
      ) : (
        teamMembers.map((member) => (
          <View key={member.id} style={styles.teamCard}>
            <View style={styles.teamHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {member.name?.charAt(0)?.toUpperCase() || "D"}
                </Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.memberName}>{member.name}</Text>
                <Text style={styles.memberRole}>{member.role}</Text>
                <Text style={styles.memberDept}>{member.department}</Text>
              </View>
            </View>

            <View style={styles.contactRow}>
              <TouchableOpacity
                style={[
                  styles.contactButton,
                  !member.email && styles.disabledButton,
                ]}
                onPress={() => openMail(member.email)}
                disabled={!member.email}
              >
                <Text style={styles.contactButtonText}>Email</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.contactButton,
                  !member.phone && styles.disabledButton,
                ]}
                onPress={() => openPhone(member.phone)}
                disabled={!member.phone}
              >
                <Text style={styles.contactButtonText}>Call</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.workSummaryBox}>
              <Text style={styles.workSummaryTitle}>Assigned Works & Tasks</Text>

              {member.works.slice(0, 4).map((work, index) => (
                <View key={index} style={styles.workMiniCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.workMiniTitle}>
                      {work.title || "Untitled Work"}
                    </Text>

                    {!!work.parentTitle && (
                      <Text style={styles.parentText}>
                        Parent: {work.parentTitle}
                      </Text>
                    )}

                    <Text style={styles.workMiniDue}>
                      Due: {formatDate(work.dueDate)}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(work.status) },
                    ]}
                  >
                    <Text style={styles.statusText}>
                      {work.status || "Pending"}
                    </Text>
                  </View>
                </View>
              ))}

              {member.works.length > 4 && (
                <Text style={styles.moreText}>
                  +{member.works.length - 4} more works
                </Text>
              )}
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
};

const formatDate = (date) => {
  if (!date) return "-";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getStatusColor = (status) => {
  switch (status) {
    case "Completed":
      return "#16A34A";
    case "In Progress":
      return "#D97706";
    case "Review":
      return "#2563EB";
    case "Revision":
      return "#7C3AED";
    case "Failed":
      return "#DC2626";
    default:
      return "#64748B";
  }
};

export default TeamScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  content: {
    padding: 18,
    paddingBottom: 120,
  },

  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
  },

  loaderText: {
    marginTop: 12,
    color: "#64748B",
    fontWeight: "700",
  },

  heroCard: {
    backgroundColor: "#111827",
    borderRadius: 28,
    padding: 22,
    marginBottom: 16,
  },

  heroTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 8,
  },

  heroText: {
    color: "#CBD5E1",
    fontSize: 13,
    lineHeight: 22,
  },

  heroStats: {
    flexDirection: "row",
    marginTop: 18,
    gap: 12,
  },

  heroStatItem: {
    flex: 1,
    backgroundColor: "#1F2937",
    borderRadius: 18,
    padding: 14,
  },

  heroStatValue: {
    color: "#FBBF24",
    fontSize: 24,
    fontWeight: "900",
  },

  heroStatLabel: {
    color: "#CBD5E1",
    fontSize: 11,
    marginTop: 4,
    fontWeight: "700",
  },

  clientCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  clientLabel: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "800",
  },

  clientName: {
    fontSize: 20,
    color: "#111827",
    fontWeight: "900",
    marginTop: 4,
  },

  clientInfo: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 4,
    fontWeight: "700",
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#111827",
    marginBottom: 14,
  },

  teamCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  teamHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },

  avatar: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
  },

  avatarText: {
    color: "#D97706",
    fontSize: 24,
    fontWeight: "900",
  },

  memberName: {
    fontSize: 17,
    fontWeight: "900",
    color: "#111827",
  },

  memberRole: {
    fontSize: 13,
    color: "#D97706",
    fontWeight: "800",
    marginTop: 3,
  },

  memberDept: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "700",
    marginTop: 2,
  },

  contactRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },

  contactButton: {
    flex: 1,
    backgroundColor: "#111827",
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
  },

  disabledButton: {
    opacity: 0.45,
  },

  contactButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "900",
  },

  workSummaryBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 18,
    padding: 14,
    marginTop: 16,
  },

  workSummaryTitle: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "900",
    marginBottom: 10,
  },

  workMiniCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  workMiniTitle: {
    fontSize: 13,
    color: "#111827",
    fontWeight: "900",
  },

  parentText: {
    fontSize: 11,
    color: "#D97706",
    marginTop: 3,
    fontWeight: "800",
  },

  workMiniDue: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 3,
    fontWeight: "700",
  },

  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 16,
  },

  statusText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
  },

  moreText: {
    fontSize: 12,
    color: "#D97706",
    fontWeight: "900",
    marginTop: 4,
  },

  emptyBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 30,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  emptyTitle: {
    fontSize: 18,
    color: "#111827",
    fontWeight: "900",
    marginBottom: 6,
  },

  emptyText: {
    color: "#64748B",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },
});