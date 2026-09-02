import { authHeaders } from "./auth";
const api = "http://localhost:5000/api"; // or use import.meta.env.VITE_API_URL
export const getEmployeeCommunications = async (employeeId: string) => {
  const res = await fetch(
    `${api}/employees/${employeeId}/communications`,
    { headers: authHeaders() }
  );
  if (!res.ok) throw new Error("Failed to fetch employee communications");
  return res.json();
};

export const createEmployeeCommunication = async (payload: {
  employeeId: string;
  channel: string;
  direction: string;
  subject: string;
  message: string;
}) => {
  const res = await fetch(
    `${import.meta.env.VITE_API_URL}/employees/${payload.employeeId}/communications`,
    {
      method: "POST",
      headers: { ...authHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );
  if (!res.ok) throw new Error("Failed to create employee communication");
  return res.json();
};