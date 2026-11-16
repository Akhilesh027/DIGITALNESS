import { createContext, useContext, useEffect, useState } from 'react';
import { authHeaders, getCurrentUser } from '@/api/auth';
export const serviceNames = ['Google Ads', 'Meta Ads', 'Social Media'];
export const serviceActions = ['view', 'edit', 'approve', 'publish', 'export'];
export type ServiceGrant = { customerId: string; service: string; actions: string[] };
type Access = { mode: string; grants: ServiceGrant[]; customers: { _id: string; name: string; companyName?: string }[]; version: number };
const Context = createContext<{ access: Access | null; error: string; refresh: () => Promise<void> }>({ access: null, error: '', refresh: async () => { } });
export async function serviceRequest(path: string, options: RequestInit = {}) {
  const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://server.digitalness.co.in/api'}${path}`, { ...options, headers: { ...authHeaders(), 'Content-Type': 'application/json', ...options.headers } });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Request failed');
  return data;
}
export function ServiceAccessProvider({ children }: { children: React.ReactNode }) {
  const [access, setAccess] = useState<Access | null>(null);
  const [error, setError] = useState('');
  const refresh = async () => {
    if (getCurrentUser()?.role === 'Client') { setAccess({ mode: 'client', grants: [], customers: [], version: 0 }); setError(''); return; }
    try { const result = await serviceRequest('/service-access/me'); setAccess(result); setError(''); }
    catch (error) { setAccess(null); setError(error instanceof Error ? error.message : 'Unable to check access'); }
  };
  useEffect(() => { refresh(); const timer = window.setInterval(refresh, 30000); return () => window.clearInterval(timer); }, []);
  return <Context.Provider value={{ access, error, refresh }}>{children}</Context.Provider>;
}
export const useServiceAccess = () => useContext(Context);
