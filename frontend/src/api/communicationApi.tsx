import { authHeaders, jsonHeaders, getToken } from "./auth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Helper to handle responses
export const handleResponse = async (res: Response) => {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Request failed");
  }
  return data;
};

// ========== Customer Communications ==========
export const getCustomerCommunications = async (customerId: string) => {
  const res = await fetch(`${API_URL}/communications/customers/${customerId}/communications`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const data = await handleResponse(res);
  return data.data; // backend returns { success: true, data: [...] }
};

export const createCustomerCommunication = async (payload: {
  customerId: string;
  channel: string;
  direction: string;
  subject: string;
  message: string;
}) => {
  const res = await fetch(`${API_URL}/communications/customers/${payload.customerId}/communications`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({
      channel: payload.channel,
      direction: payload.direction,
      subject: payload.subject,
      message: payload.message,
      // customerId is taken from URL, not from body
    }),
  });
  const data = await handleResponse(res);
  return data.data;
};

// ========== Employee Communications ==========
export const getEmployeeCommunications = async (employeeId: string) => {
  const res = await fetch(`${API_URL}/communications/employees/${employeeId}/communications`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const data = await handleResponse(res);
  return data.data;
};

export const createEmployeeCommunication = async (payload: {
  employeeId: string;
  channel: string;
  direction: string;
  subject: string;
  message: string;
}) => {
  const res = await fetch(`${API_URL}/communications/employees/${payload.employeeId}/communications`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({
      channel: payload.channel,
      direction: payload.direction,
      subject: payload.subject,
      message: payload.message,
      // employeeId is taken from URL, not from body
    }),
  });
  const data = await handleResponse(res);
  return data.data;
};