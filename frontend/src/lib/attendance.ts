export type ClockRecord = {
  _id: string; employee?: { _id: string; name: string; role?: string } | string;
  dayKey: string; date: string; mode?: string; isOpen?: boolean; revision: number;
  loginTime?: string; logoutTime?: string; totalHours: number; breakMinutes?: number;
  breaks?: { startedAt: string; endedAt?: string }[]; correctedBreakMinutes?: number | null;
  clockState: string; status: string;
  legacySnapshot?: Record<string, unknown>;
  events?: { action: string; at: string; actor?: { name: string } | string; reason?: string; before?: any; after?: any }[];
};
export type AttendanceCorrection = {
  _id: string; dayKey: string; employee?: { _id: string; name: string; role?: string } | string;
  proposedIn: string; proposedOut: string; breakMinutes: number; reason: string;
  status: string; reviewNote?: string; reviewedAt?: string; before?: any; after?: any; reviewedBy?: string;
};
export const attendanceDay = (date = new Date()) => date.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
export const attendanceTime = (value?: string) => value ? new Date(value).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';
export const hoursLabel = (hours = 0) => { const minutes = Math.max(0, Math.round(hours * 60)); return `${Math.floor(minutes / 60)}h ${minutes % 60}m`; };
export const istInput = (value?: string) => {
  if (!value) return '';
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(value)).map(part => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
};
export function liveHours(record: ClockRecord, now: number) {
  if (!record.isOpen || !record.loginTime) return record.totalHours || 0;
  const end = now;
  const breakMs = record.correctedBreakMinutes != null ? record.correctedBreakMinutes * 60000 : (record.breaks || []).reduce((sum, entry) => sum + Math.max(0, new Date(entry.endedAt || end).getTime() - new Date(entry.startedAt).getTime()), 0);
  return Math.max(0, (end - new Date(record.loginTime).getTime() - breakMs) / 3600000);
}
