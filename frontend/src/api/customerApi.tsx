import { authHeaders, jsonHeaders } from './auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const getCustomers = async () => {
  const res = await fetch(`${API_URL}/customers`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch customers');
  const data = await res.json();
  return Array.isArray(data) ? data : data.customers || data.data || [];
};

export const updateCustomer = async (id: string, payload: any) => {
  const res = await fetch(`${API_URL}/customers/${id}`, {
    method: 'PUT',
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to update customer');
  return await res.json();
};

export const getCustomerReadiness = async (id: string) => {
  const res = await fetch(`${API_URL}/customers/${id}/readiness`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch customer readiness');
  const data = await res.json();
  return data.data;
};

export const getContextPreview = async (id: string, agentType = 'Parent', locationId?: string) => {
  const queryParams = new URLSearchParams();
  if (agentType) queryParams.append('agentType', agentType);
  if (locationId) queryParams.append('locationId', locationId);

  const res = await fetch(`${API_URL}/customers/${id}/context-preview?${queryParams.toString()}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to fetch context preview');
  const data = await res.json();
  return data.data;
};