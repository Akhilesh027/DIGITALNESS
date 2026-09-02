import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE_URL = "https://server.digitalness.co.in/api";

const FILTERS = [
  "All",
  "Pending",
  "Not Started",
  "In Progress",
  "Review",
  "Revision",
  "Completed",
];

const WorksScreen = () => {
  const [works, setWorks] = useState([]);
  const [activeFilter, setActiveFilter] = useState("All");
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

  const extractCustomerId = (client, customer) => {
    return (
      customer?._id ||
      customer?.id ||
      customer?.customerId?._id ||
      customer?.customerId ||
      client?.customerId?._id ||
      client?.customerId ||
      client?.customer?._id ||
      client?.customer ||
      client?.customerData?._id ||
      client?.customerData?.id
    );
  };

  const flattenWorks = (list) => {
    const items = [];

    list.forEach((work) => {
      items.push({
        ...work,
        itemType: work.parentWorkId ? "Task" : "Work",
      });

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
          itemType: "Task",
          parentTitle: work.title,
        });
      });
    });

    return items;
  };

  const fetchWorks = async () => {
    try {
      const clientData = await AsyncStorage.getItem("clientData");
      const customerData = await AsyncStorage.getItem("customerData");

      const parsedClient = safeJsonParse(clientData);
      const parsedCustomer = safeJsonParse(customerData);

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
          console.log("Works API failed:", error.message);
        }
      }

      setWorks(finalWorks);
    } catch (error) {
      console.log("Works fetch error:", error.message);
      setWorks([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWorks();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchWorks();
  };

  const allItems = useMemo(() => flattenWorks(works), [works]);

  const stats = useMemo(() => {
    const total = allItems.length;

    const worksCount = allItems.filter((item) => item.itemType === "Work").length;
    const tasksCount = allItems.filter((item) => item.itemType === "Task").length;
    const completed = allItems.filter((item) => item.status === "Completed").length;
    const progress = allItems.filter((item) => item.status === "In Progress").length;
    const review = allItems.filter((item) => item.status === "Review").length;
    const revision = allItems.filter((item) => item.status === "Revision").length;
    const pending = allItems.filter(
      (item) =>
        item.status === "Pending" ||
        item.status === "Not Started" ||
        !item.status
    ).length;

    const completedPercent = total ? Math.round((completed / total) * 100) : 0;
    const activePercent = total ? Math.round(((progress + review) / total) * 100) : 0;

    return {
      total,
      worksCount,
      tasksCount,
      completed,
      progress,
      review,
      revision,
      pending,
      completedPercent,
      activePercent,
    };
  }, [allItems]);

  const filteredWorks = useMemo(() => {
    if (activeFilter === "All") return allItems;

    return allItems.filter(
      (item) => (item.status || "Pending") === activeFilter
    );
  }, [allItems, activeFilter]);

  const statusBars = [
    { label: "Completed", value: stats.completed, color: "#16A34A" },
    { label: "In Progress", value: stats.progress, color: "#D97706" },
    { label: "Review", value: stats.review, color: "#2563EB" },
    { label: "Revision", value: stats.revision, color: "#7C3AED" },
    { label: "Pending", value: stats.pending, color: "#64748B" },
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

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#111827" />
        <Text style={styles.loaderText}>Loading works...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.filterWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
        >
          {FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterButton,
                activeFilter === filter && styles.activeFilterButton,
              ]}
              onPress={() => setActiveFilter(filter)}
            >
              <Text
                style={[
                  styles.filterText,
                  activeFilter === filter && styles.activeFilterText,
                ]}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Works & Tasks</Text>
          <Text style={styles.summaryText}>
            Track your project works, daily tasks, deliverables, deadlines,
            team assignment, review status, and completion progress.
          </Text>

          <View style={styles.progressBox}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>Overall Completion</Text>
              <Text style={styles.progressPercent}>{stats.completedPercent}%</Text>
            </View>

            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${stats.completedPercent}%` },
                ]}
              />
            </View>

            <Text style={styles.progressNote}>
              {stats.completed} of {stats.total} items completed
            </Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <StatCard label="Total Items" value={stats.total} color="#111827" />
          <StatCard label="Works" value={stats.worksCount} color="#7C3AED" />
          <StatCard label="Tasks" value={stats.tasksCount} color="#2563EB" />
          <StatCard label="Completed" value={stats.completed} color="#16A34A" />
          <StatCard label="Active" value={stats.progress + stats.review} color="#D97706" />
          <StatCard label="Pending" value={stats.pending} color="#64748B" />
        </View>

        <View style={styles.insightCard}>
          <Text style={styles.insightTitle}>Work Progress Insight</Text>

          <View style={styles.insightRow}>
            <InsightBox label="Completion" value={`${stats.completedPercent}%`} />
            <InsightBox label="Active Work" value={`${stats.activePercent}%`} />
            <InsightBox label="In Review" value={stats.review} />
          </View>

          <Text style={styles.insightText}>
            Items in Review are waiting for approval or final verification.
            Pending items are yet to be started by the assigned team.
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

        <Text style={styles.sectionTitle}>Priority Bar Graph</Text>

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

        <Text style={styles.sectionTitle}>
          {activeFilter === "All" ? "All Works & Tasks" : `${activeFilter} Items`}
        </Text>

        {filteredWorks.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>No works found</Text>
            <Text style={styles.emptyText}>
              There are no works or tasks available under this filter.
            </Text>
          </View>
        ) : (
          filteredWorks.map((work, index) => (
            <WorkCard key={work._id || work.id || index} work={work} />
          ))
        )}
      </ScrollView>
    </View>
  );
};

const StatCard = ({ label, value, color }) => (
  <View style={styles.statCard}>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const InsightBox = ({ label, value }) => (
  <View style={styles.insightBox}>
    <Text style={styles.insightValue}>{value}</Text>
    <Text style={styles.insightLabel}>{label}</Text>
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

const WorkCard = ({ work }) => {
  const assignedUsers = Array.isArray(work.assignedTo)
    ? work.assignedTo
    : work.assignedTo
      ? [work.assignedTo]
      : [];

  return (
    <View style={styles.workCard}>
      <View style={styles.workHeader}>
        <View style={{ flex: 1 }}>
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>{work.itemType || "Work"}</Text>
          </View>

          <Text style={styles.workTitle}>
            {work.title || work.taskName || work.name || "Untitled Work"}
          </Text>

          <Text style={styles.workType}>
            {work.workType || work.type || "CRM Work"}
          </Text>

          {!!work.parentTitle && (
            <Text style={styles.parentText}>Parent: {work.parentTitle}</Text>
          )}
        </View>

        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(work.status) },
          ]}
        >
          <Text style={styles.statusText}>{work.status || "Pending"}</Text>
        </View>
      </View>

      {!!work.description && (
        <Text style={styles.description}>{work.description}</Text>
      )}

      <View style={styles.detailsGrid}>
        <DetailItem label="Priority" value={work.priority || "Medium"} />
        <DetailItem
          label="Due Date"
          value={formatDate(work.dueDate || work.deadline)}
        />
        <DetailItem label="SLA Days" value={work.slaDays || "-"} />
        <DetailItem
          label="Deliverables"
          value={`${work.completedDeliverables || 0}/${work.deliverables || 0}`}
        />
      </View>

      <View style={styles.assignedBox}>
        <Text style={styles.assignedTitle}>Assigned Team</Text>

        {assignedUsers.length === 0 ? (
          <Text style={styles.assignedText}>Team not assigned</Text>
        ) : (
          assignedUsers.map((user, index) => (
            <Text key={user?._id || user?.id || index} style={styles.assignedText}>
              • {user?.name || user?.email || "Team Member"}
            </Text>
          ))
        )}
      </View>
    </View>
  );
};

const DetailItem = ({ label, value }) => (
  <View style={styles.detailItem}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

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

export default WorksScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  filterWrapper: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },

  filterContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },

  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    marginRight: 10,
  },

  activeFilterButton: {
    backgroundColor: "#111827",
  },

  filterText: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "800",
  },

  activeFilterText: {
    color: "#FBBF24",
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

  summaryCard: {
    backgroundColor: "#111827",
    borderRadius: 26,
    padding: 20,
    marginBottom: 16,
  },

  summaryTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 8,
  },

  summaryText: {
    color: "#CBD5E1",
    fontSize: 13,
    lineHeight: 21,
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

  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  statCard: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  statValue: {
    fontSize: 27,
    fontWeight: "900",
  },

  statLabel: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "800",
    marginTop: 4,
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
    marginBottom: 12,
  },

  insightRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },

  insightBox: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
  },

  insightValue: {
    fontSize: 20,
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
    color: "#444",
    fontSize: 13,
    lineHeight: 21,
    fontWeight: "600",
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#111827",
    marginBottom: 14,
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
    fontSize: 17,
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

  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 16,
  },

  detailItem: {
    width: "48%",
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
  },

  detailLabel: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "800",
  },

  detailValue: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "900",
    marginTop: 4,
  },

  assignedBox: {
    backgroundColor: "#FEF3C7",
    padding: 14,
    borderRadius: 18,
    marginTop: 6,
  },

  assignedTitle: {
    fontSize: 13,
    color: "#111827",
    fontWeight: "900",
    marginBottom: 6,
  },

  assignedText: {
    fontSize: 12,
    color: "#444",
    fontWeight: "700",
    marginBottom: 3,
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
  },
});