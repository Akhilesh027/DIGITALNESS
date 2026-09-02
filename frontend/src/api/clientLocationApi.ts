const API_URL = import.meta.env.VITE_API_URL || "https://server.digitalness.co.in/api";

const getToken = () => localStorage.getItem("token");

export const getClientLocations = async (customerId?: string) => {
  const url = customerId
    ? `${API_URL}/client-locations?customerId=${customerId}`
    : `${API_URL}/client-locations`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });

  if (!res.ok) throw new Error("Failed to fetch client locations");
  const data = await res.json();
  return data.locations || [];
};

export const createClientLocation = async (payload: any) => {
  const res = await fetch(`${API_URL}/client-locations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Failed to create client location");
  }

  return await res.json();
};

export const updateClientLocation = async (id: string, payload: any) => {
  const res = await fetch(`${API_URL}/client-locations/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.message || "Failed to update client location");
  }

  return await res.json();
};

export const deleteClientLocation = async (id: string) => {
  const res = await fetch(`${API_URL}/client-locations/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${getToken()}` },
  });

  if (!res.ok) throw new Error("Failed to delete client location");
  return await res.json();
};
