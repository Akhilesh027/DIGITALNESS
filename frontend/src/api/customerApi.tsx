import { authHeaders, jsonHeaders } from './auth';

const API_URL = import.meta.env.VITE_API_URL || 'https://server.digitalness.co.in/api';

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

export const lockCustomerPortal = async (id: string, payload: any) => {
  const res = await fetch(`${API_URL}/customers/${id}/lock-portal`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to lock portal');
  return data;
};

export const unlockCustomerPortal = async (id: string) => {
  const res = await fetch(`${API_URL}/customers/${id}/unlock-portal`, {
    method: 'POST',
    headers: jsonHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to unlock portal');
  return data;
};

export const rechargeCustomerPlan = async (id: string, payload: any) => {
  const res = await fetch(`${API_URL}/customers/${id}/recharge`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to recharge service plan');
  return data;
};

export const getCustomerRechargeStatus = async (id: string) => {
  const res = await fetch(`${API_URL}/customers/${id}/recharge-status`, {
    headers: authHeaders(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch recharge status');
  return data.data;
};

export const sendRechargeDueAlert = async (id: string, payload: any) => {
  const res = await fetch(`${API_URL}/customers/${id}/send-recharge-alert`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to send recharge alert');
  return data;
};