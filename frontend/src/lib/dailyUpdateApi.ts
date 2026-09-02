import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  withCredentials: true,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

export type WorkStatus =
  | "Pending"
  | "Not Started"
  | "In Progress"
  | "Review"
  | "Completed"
  | "Revision"
  | "Failed"
  | "Blocked"
  | "On Hold";

export interface DailyUpdate {
  _id?: string;
  employee?: any;
  work?: string;
  taskId?: string;
  date: string;
  projectName: string;
  clientName?: string;
  workCategory?: string;
  taskTitle: string;
  startTime?: string;
  endTime?: string;
  totalHours?: number;
  currentStatus: WorkStatus;
  progressPercentage: number;
  workCompleted: string;
  pendingWork?: string;
  blockers?: string;
  tomorrowPlan?: string;
  referencesLinks?: string;
  attachments?: string[];
  approvalStatus?: "Pending" | "Approved" | "Changes Requested";
  managerComment?: string;
  revisionReason?: string;
  reviewedAt?: string;
  submittedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AssignedWork {
  _id?: string;
  id?: string;
  title: string;
  workType?: string;
  type?: string;
  category?: string;
  customer?: {
    _id?: string;
    name?: string;
    businessName?: string;
    companyName?: string;
    email?: string;
    phone?: string;
  };
  customerName?: string;
  clientName?: string;
  priority?: "Low" | "Medium" | "High" | "Urgent";
  dueDate?: string;
  status?: string;
  progress?: number;
  progressPercentage?: number;
  completedPercentage?: number;
  parentWorkId?: {
    _id?: string;
    title?: string;
    workType?: string;
  };
}

export interface CurrentUser {
  _id: string;
  name: string;
  email?: string;
  role: string;
  branchId?: string;
}

export const getErrorMessage = (error: any): string => {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || error.message || "Something went wrong";
  }

  return "Unexpected error";
};

export const getCurrentUser = (): CurrentUser | null => {
  try {
    const userStr = localStorage.getItem("user");
    if (!userStr) return null;
    return JSON.parse(userStr);
  } catch {
    localStorage.removeItem("user");
    return null;
  }
};

const normalizeStatus = (status?: string): WorkStatus => {
  if (!status) return "In Progress";

  const map: Record<string, WorkStatus> = {
    "In Review": "Review",
    "Rework Required": "Revision",
    Approved: "Completed",
  };

  return map[status] || (status as WorkStatus);
};

const normalizeAssignedWork = (work: any): AssignedWork => ({
  ...work,
  id: work._id || work.id,
  title: work.title || work.taskTitle || "Untitled Task",
  workType: work.workType || work.type || work.category || "General",
  customerName:
    work.customer?.name ||
    work.customer?.businessName ||
    work.customer?.companyName ||
    work.customerName ||
    work.clientName ||
    "",
  progress:
    Number(
      work.progress ||
      work.progressPercentage ||
      work.completedPercentage ||
      0
    ) || 0,
  parentWorkId: work.parentWorkId || null,
});

export const getMyUpdates = async (): Promise<DailyUpdate[]> => {
  try {
    const res = await apiClient.get("/daily-updates/my");
    return res.data?.data || res.data?.updates || res.data || [];
  } catch (error) {
    console.error("Failed to fetch my updates:", error);
    return [];
  }
};

export const submitUpdate = async (
  data: Partial<DailyUpdate>,
  files?: File[]
): Promise<DailyUpdate> => {
  const formData = new FormData();

  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;

    if (key === "taskId" || key === "work") {
      formData.append("work", String(value));
      formData.append("taskId", String(value));
      return;
    }

    if (key === "currentStatus") {
      formData.append("currentStatus", normalizeStatus(String(value)));
      return;
    }

    formData.append(key, String(value));
  });

  files?.forEach((file) => {
    formData.append("attachments", file);
  });

  const res = await apiClient.post("/daily-updates", formData);

  return res.data?.data || res.data;
};

export const getMyAssignedWorks = async (
  employeeId: string
): Promise<AssignedWork[]> => {
  try {
    const res = await apiClient.get(`/works/employee/${employeeId}`);

    const works = res.data?.data || res.data?.works || res.data || [];

    if (!Array.isArray(works)) return [];

    return works.map(normalizeAssignedWork);
  } catch (error) {
    console.error("Failed to fetch assigned works:", error);
    return [];
  }
};

export const getAllUpdates = async (params?: {
  employeeId?: string;
  status?: string;
  fromDate?: string;
  toDate?: string;
}): Promise<DailyUpdate[]> => {
  try {
    const res = await apiClient.get("/daily-updates", { params });
    return res.data?.data || res.data?.updates || res.data || [];
  } catch (error) {
    console.error("Failed to fetch all updates:", error);
    return [];
  }
};

export const reviewDailyUpdate = async (
  id: string,
  payload: {
    approvalStatus: "Pending" | "Approved" | "Changes Requested";
    managerComment?: string;
    revisionReason?: string;
  }
): Promise<DailyUpdate> => {
  const res = await apiClient.put(`/daily-updates/${id}/review`, payload);
  return res.data?.data || res.data;
};

export const deleteDailyUpdate = async (id: string): Promise<void> => {
  await apiClient.delete(`/daily-updates/${id}`);
};

export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.replace("/login");
};