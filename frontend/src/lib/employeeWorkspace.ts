import { authHeaders } from '@/api/auth';

export type AssignedWork = {
  _id: string; title: string; description?: string; workType: string; clientName?: string;
  status: string; approvalStatus?: string; priority: string; dueDate?: string; updatedAt: string;
  parentWorkId?: string; deliverables?: number; completedDeliverables?: number;
  assignedTo?: { _id: string; name?: string; role?: string }[];
  createdBy?: { _id: string; name?: string; role?: string };
  customer?: Record<string, unknown>;
  estimatedHours?: number; timeSpent?: number; progressNote?: string; managerReviewNote?: string;
  blockedBy?: { isBlocked: boolean; type?: string; note?: string };
  updates?: { message: string; files?: string[]; timeSpent?: number; byName?: string; createdAt?: string }[];
  attachments?: { fileName: string; fileUrl: string }[];
  comments?: { message: string; createdByName?: string; createdAt?: string }[];
  timeline?: { title: string; description?: string; createdAt?: string }[];
};
export type WorkReview = { _id: string; status: string; adminRemark?: string; reviewMessage?: string; reviewedAt?: string };
export const apiBase = import.meta.env.VITE_API_URL || 'https://server.digitalness.co.in/api';
export const finished = (item: AssignedWork) => item.status === 'Completed';
export const closed = (item: AssignedWork) => ['Approved', 'Completed', 'Failed'].includes(item.status);
export const businessDate = (date = new Date()) => date.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
export const dueDay = (value?: string) => value ? businessDate(new Date(value)) : '';
export const displayDate = (value?: string) => value ? new Date(value).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric' }) : 'No due date';
export function fileUrl(value: string) {
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith('/uploads/') && !value.includes('..')) return `${apiBase.replace(/\/api\/?$/, '')}${value}`;
  return undefined;
}
export async function uploadWorkUpdate(id: string, form: FormData) {
  const response = await fetch(`${apiBase}/service-workspace/my-work/${id}/updates`, { method: 'POST', headers: authHeaders(), body: form });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Unable to save update');
  return data;
}
