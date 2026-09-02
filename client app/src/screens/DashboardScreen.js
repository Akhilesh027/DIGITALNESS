import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE_URL = "http://localhost:5000/api";

const DashboardScreen = () => {
  const [client, setClient] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [works, setWorks] = useState([]);
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

  const fetchDashboard = async () => {
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
          console.log("Fetch failed:", error.message);
        }
      }

      setWorks(finalWorks);
    } catch (error) {
      console.log("Dashboard error:", error.message);
      setWorks([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboard();
  };

  const allItems = useMemo(() => {
    const items = [];

    works.forEach((work) => {
      items.push({
        ...work,
        itemType: work.parentWorkId ? "Task" : "Work",
      });

      const children = [
        ...(Array.isArray(work.tasks) ? work.tasks : []),
        ...(Array.isArray(work.taskList) ? work.taskList : []),
        ...(Array.isArray(work.subTasks) ? work.subTasks : []),
        ...(Array.isArray(work.subtasks) ? work.subtasks : []),
        ...(Array.isArray(work.children) ? work.children : []),
      ];

      children.forEach((task) => {
        items.push({
          ...task,
          itemType: "Task",
          parentTitle: work.title,
        });
      });
    });

    return items;
  }, [works]);

  const stats = useMemo(() => {
    const total = allItems.length;
    const worksCount = allItems.filter((i) => i.itemType === "Work").length;
    const tasksCount = allItems.filter((i) => i.itemType === "Task").length;
    const completed = allItems.filter((i) => i.status === "Completed").length;
    const progress = allItems.filter((i) => i.status === "In Progress").length;
    const review = allItems.filter((i) => i.status === "Review").length;
    const revision = allItems.filter((i) => i.status === "Revision").length;
    const failed = allItems.filter((i) => i.status === "Failed").length;
    const pending = allItems.filter(
      (i) => i.status === "Pending" || i.status === "Not Started" || !i.status
    ).length;

    const completionPercent = total ? Math.round((completed / total) * 100) : 0;
    const activePercent = total ? Math.round(((progress + review) / total) * 100) : 0;

    return {
      total,
      worksCount,
      tasksCount,
      completed,
      progress,
      review,
      revision,
      failed,
      pending,
      completionPercent,
      activePercent,
    };
  }, [allItems]);

  const statusBars = [
    { label: "Completed", value: stats.completed, color: "#16A34A" },
    { label: "In Progress", value: stats.progress, color: "#D97706" },
    { label: "Review", value: stats.review, color: "#2563EB" },
    { label: "Pending", value: stats.pending, color: "#64748B" },
    { label: "Revision", value: stats.revision, color: "#7C3AED" },
    { label: "Failed", value: stats.failed, color: "#DC2626" },
  ];

  const priorityBars = useMemo(() => {
    const priorities = ["Urgent", "High", "Medium", "Low"];

    return priorities.map((priority) => ({
      label: priority,
      value: allItems.filter((item) => item.priority === priority).length,
      color:
        priority === "Urgent"
          ? "#DC2626"
          : priority === "High"
            ? "#EA580C"
            : priority === "Medium"
              ? "#D97706"
              : "#16A34A",
    }));
  }, [allItems]);

  const latestItems = allItems.slice(0, 6);

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#111827" />
        <Text style={styles.loaderText}>Loading client dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.heroCard}>
        <View style={styles.heroTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.welcomeText}>Welcome back 👋</Text>
            <Text style={styles.clientName}>
              {client?.name || customer?.name || "Client"}
            </Text>
            <Text style={styles.businessType}>
              {customer?.businessType || client?.businessType || "Digitalness Client"}
            </Text>
          </View>

          <View style={styles.logoBox}>
            <Text style={styles.logoText}>D</Text>
          </View>
        </View>

        <Text style={styles.heroDescription}>
          Your complete Digitalness CRM client portal to track project progress,
          assigned tasks, deliverables, reviews, approvals, and support updates.
        </Text>

        <View style={styles.progressBox}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Overall Completion</Text>
            <Text style={styles.progressPercent}>{stats.completionPercent}%</Text>
          </View>

          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${stats.completionPercent}%` },
              ]}
            />
          </View>

          <Text style={styles.progressNote}>
            {stats.completed} of {stats.total} total items completed
          </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Project Overview</Text>

      <View style={styles.statsGrid}>
        <StatCard title="Total Items" value={stats.total} color="#111827" />
        <StatCard title="Works" value={stats.worksCount} color="#7C3AED" />
        <StatCard title="Tasks" value={stats.tasksCount} color="#2563EB" />
        <StatCard title="Completed" value={stats.completed} color="#16A34A" />
        <StatCard title="In Progress" value={stats.progress} color="#D97706" />
        <StatCard title="Review" value={stats.review} color="#2563EB" />
      </View>

      <View style={styles.insightCard}>
        <Text style={styles.insightTitle}>Client Progress Insight</Text>

        <View style={styles.insightRow}>
          <View style={styles.insightItem}>
            <Text style={styles.insightValue}>{stats.activePercent}%</Text>
            <Text style={styles.insightLabel}>Currently Active</Text>
          </View>

          <View style={styles.insightItem}>
            <Text style={styles.insightValue}>{stats.pending}</Text>
            <Text style={styles.insightLabel}>Pending Items</Text>
          </View>

          <View style={styles.insightItem}>
            <Text style={styles.insightValue}>{stats.review}</Text>
            <Text style={styles.insightLabel}>Under Review</Text>
          </View>
        </View>

        <Text style={styles.insightText}>
          Digitalness team is actively monitoring your project tasks. Items under
          review are usually waiting for approval, correction, or final confirmation.
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Status Bar Graph</Text>

      <View style={styles.chartCard}>
        {statusBars.map((bar) => (
          <BarRow
            key={bar.label}
            label={bar.label}
            value={bar.value}
            max={stats.total || 1}
            color={bar.color}
          />
        ))}
      </View>

      <Text style={styles.sectionTitle}>Priority Analysis</Text>

      <View style={styles.chartCard}>
        {priorityBars.map((bar) => (
          <BarRow
            key={bar.label}
            label={bar.label}
            value={bar.value}
            max={stats.total || 1}
            color={bar.color}
          />
        ))}
      </View>

      <Text style={styles.sectionTitle}>Recent Works & Tasks</Text>

      {latestItems.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>No works or tasks available yet.</Text>
        </View>
      ) : (
        latestItems.map((item, index) => (
          <View key={item._id || item.id || index} style={styles.workCard}>
            <View style={styles.workHeader}>
              <View style={{ flex: 1 }}>
                <View style={styles.typeBadge}>
                  <Text style={styles.typeBadgeText}>{item.itemType || "Work"}</Text>
                </View>

                <Text style={styles.workTitle}>
                  {item.title || item.taskName || item.name || "Untitled Work"}
                </Text>

                <Text style={styles.workType}>
                  {item.workType || item.type || "CRM Work"}
                </Text>

                {!!item.parentTitle && (
                  <Text style={styles.parentText}>Parent: {item.parentTitle}</Text>
                )}
              </View>

              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(item.status) },
                ]}
              >
                <Text style={styles.statusText}>{item.status || "Pending"}</Text>
              </View>
            </View>

            {!!item.description && (
              <Text style={styles.description}>{item.description}</Text>
            )}

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Priority: {item.priority || "Medium"}</Text>
              <Text style={styles.footerText}>
                Due: {formatDate(item.dueDate || item.deadline)}
              </Text>
            </View>
          </View>
        ))
      )}

      <TouchableOpacity style={styles.supportCard}>
        <Text style={styles.supportTitle}>Need Support?</Text>
        <Text style={styles.supportText}>
          Contact the Digitalness support team for project updates, revisions,
          approvals, pending deliverables, or technical assistance.
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const StatCard = ({ title, value, color }) => (
  <View style={styles.statCard}>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statTitle}>{title}</Text>
  </View>
);

const BarRow = ({ label, value, max, color }) => {
  const percent = max ? Math.round((value / max) * 100) : 0;

  return (
    <View style={styles.barRow}>
      <View style={styles.barTop}>
        <Text style={styles.barLabel}>{label}</Text>
        <Text style={styles.barValue}>
          {value} / {percent}%
        </Text>
      </View>

      <View style={styles.barTrack}>
        <View
          style={[
            styles.barFill,
            {
              width: `${percent}%`,
              backgroundColor: color,
            },
          ]}
        />
      </View>
    </View>
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

export default DashboardScreen;

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
    marginBottom: 20,
  },

  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  welcomeText: {
    color: "#CBD5E1",
    fontSize: 14,
  },

  clientName: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "900",
    marginTop: 4,
  },

  businessType: {
    color: "#FBBF24",
    fontSize: 13,
    marginTop: 5,
    fontWeight: "800",
  },

  logoBox: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: "#FBBF24",
    alignItems: "center",
    justifyContent: "center",
  },

  logoText: {
    color: "#111827",
    fontSize: 28,
    fontWeight: "900",
  },

  heroDescription: {
    color: "#CBD5E1",
    marginTop: 18,
    lineHeight: 22,
    fontSize: 13,
  },

  progressBox: {
    backgroundColor: "#1F2937",
    padding: 16,
    borderRadius: 20,
    marginTop: 18,
  },

  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  progressTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },

  progressPercent: {
    color: "#FBBF24",
    fontSize: 16,
    fontWeight: "900",
  },

  progressTrack: {
    height: 12,
    backgroundColor: "#374151",
    borderRadius: 20,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    backgroundColor: "#FBBF24",
    borderRadius: 20,
  },

  progressNote: {
    color: "#CBD5E1",
    fontSize: 12,
    marginTop: 8,
    fontWeight: "700",
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#111827",
    marginBottom: 14,
  },

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  statCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  statValue: {
    fontSize: 30,
    fontWeight: "900",
  },

  statTitle: {
    color: "#64748B",
    fontSize: 12,
    marginTop: 6,
    fontWeight: "700",
  },

  insightCard: {
    backgroundColor: "#FEF3C7",
    borderRadius: 24,
    padding: 18,
    marginBottom: 20,
  },

  insightTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#111827",
    marginBottom: 14,
  },

  insightRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },

  insightItem: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 12,
  },

  insightValue: {
    fontSize: 22,
    fontWeight: "900",
    color: "#111827",
  },

  insightLabel: {
    fontSize: 10,
    color: "#64748B",
    fontWeight: "800",
    marginTop: 4,
  },

  insightText: {
    fontSize: 13,
    color: "#444",
    lineHeight: 21,
    fontWeight: "600",
  },

  chartCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  barRow: {
    marginBottom: 16,
  },

  barTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 7,
  },

  barLabel: {
    fontSize: 13,
    color: "#111827",
    fontWeight: "900",
  },

  barValue: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "800",
  },

  barTrack: {
    height: 12,
    backgroundColor: "#E5E7EB",
    borderRadius: 20,
    overflow: "hidden",
  },

  barFill: {
    height: "100%",
    borderRadius: 20,
  },

  workCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  workHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },

  typeBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },

  typeBadgeText: {
    fontSize: 10,
    color: "#92400E",
    fontWeight: "900",
  },

  workTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#111827",
  },

  workType: {
    color: "#64748B",
    marginTop: 4,
    fontSize: 12,
    fontWeight: "700",
  },

  parentText: {
    marginTop: 4,
    color: "#D97706",
    fontSize: 11,
    fontWeight: "800",
  },

  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },

  statusText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "900",
  },

  description: {
    marginTop: 12,
    color: "#475569",
    lineHeight: 20,
    fontSize: 13,
  },

  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
  },

  footerText: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "700",
  },

  supportCard: {
    backgroundColor: "#111827",
    padding: 20,
    borderRadius: 22,
    marginTop: 6,
  },

  supportTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#FBBF24",
    marginBottom: 8,
  },

  supportText: {
    color: "#CBD5E1",
    lineHeight: 22,
    fontSize: 13,
  },

  emptyBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 30,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  emptyText: {
    color: "#64748B",
    fontWeight: "700",
  },
});