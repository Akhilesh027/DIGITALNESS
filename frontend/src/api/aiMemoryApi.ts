const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const getToken = () => localStorage.getItem("token");

export const getAIMemories = async (customerId?: string, type?: string) => {
  const queryParams = new URLSearchParams();
  if (customerId) queryParams.append("customerId", customerId);
  if (type) queryParams.append("type", type);

  const res = await fetch(`${API_URL}/ai-memory?${queryParams.toString()}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });

  if (!res.ok) throw new Error("Failed to fetch AI memories");
  const data = await res.json();
  return data.memories || [];
};

export const createAIMemory = async (payload: any) => {
  const res = await fetch(`${API_URL}/ai-memory`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Failed to create AI memory");
  }

  return await res.json();
};

export const deleteAIMemory = async (id: string) => {
  const res = await fetch(`${API_URL}/ai-memory/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${getToken()}` },
  });

  if (!res.ok) throw new Error("Failed to delete AI memory");
  return await res.json();
};
