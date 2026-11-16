import { useEffect, useRef, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { authHeaders } from '@/api/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const API_URL = import.meta.env.VITE_API_URL || 'https://server.digitalness.co.in/api';
const types = ['daily', 'weekly', 'monthly', 'project', 'payment'] as const;
type ReportType = typeof types[number];
type Report = { type: string; customer: { name: string }; period: { fromDate: string; toDate: string }; summary: Record<string, number>; columns: string[]; rows: string[][] };
const localDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const defaults = (type: string) => {
  const end = new Date(), start = new Date(end);
  if (type === 'weekly') start.setDate(start.getDate() - 6);
  if (type !== 'daily' && type !== 'weekly') start.setDate(1);
  return { fromDate: localDate(start), toDate: localDate(end) };
};
const title = (type: string) => `${type[0].toUpperCase()}${type.slice(1)} Client Report`;

export function normalize(payload: any, type: string, name: string, period: Report['period']): Report {
  if (payload.report) {
    const report = payload.report;
    return { ...report, columns: ['Date', 'Task / employee', 'Status / approval', 'Hours', 'Completed / pending', 'Blockers / next steps'], rows: report.rows.map((row: any) => [String(row.date).slice(0, 10), `${row.task}\n${row.employee}`, `${row.status}\n${row.approval}`, String(row.hours), `${row.completed}\nPending: ${row.pending || 'None recorded'}`, `${row.blockers || 'None recorded'}\nNext: ${row.next || 'None recorded'}`]) };
  }
  const data = payload.data;
  if (type === 'project' && Array.isArray(data)) return { type, customer: { name }, period, summary: { projects: data.length }, columns: ['Work', 'Status', 'Due date', 'Progress'], rows: data.map(row => [row.title, row.status, row.dueDate?.slice(0, 10) || '-', `${row.progress || 0}%`]) };
  if (type === 'payment' && data && Array.isArray(data.payments)) return { type, customer: { name }, period, summary: { totalInvoiced: data.totalInvoiced, totalPaid: data.totalPaid, totalPending: data.totalPending }, columns: ['Date', 'Amount', 'Method'], rows: data.payments.map((row: any) => [(row.date || row.createdAt || '').slice(0, 10), String(row.amount ?? row.paidAmount ?? 0), row.method || row.paymentMethod || '-']) };
  throw new Error('The server returned an invalid report. Please retry.');
}

export function createClientReportPDF(report: Report) {
  const doc = new jsPDF({ orientation: 'landscape' });
  doc.setFontSize(18);
  doc.text(title(report.type), 14, 18);
  autoTable(doc, { startY: 25, theme: 'plain', body: [['Client', report.customer.name], ['Period', report.type === 'project' || report.type === 'payment' ? 'All recorded history' : `${report.period.fromDate} to ${report.period.toDate}`], ...Object.entries(report.summary).map(([key, value]) => [key.replace(/([A-Z])/g, ' $1'), String(value)])] });
  autoTable(doc, { startY: (doc as any).lastAutoTable.finalY + 8, head: [report.columns], body: report.rows.length ? report.rows : [['No activity recorded for this period.']], styles: { fontSize: 9, overflow: 'linebreak' }, margin: { bottom: 18 } });
  return doc;
}

export default function ClientReports({ customerId, customerName = 'Client', initialType = 'daily' }: { customerId: string; customerName?: string; initialType?: string }) {
  const [type, setType] = useState<ReportType>(types.includes(initialType as ReportType) ? initialType as ReportType : 'daily');
  const [period, setPeriod] = useState(() => defaults(initialType));
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const request = useRef(0);
  const invalidate = () => { request.current++; setReport(null); setError(''); setLoading(false); };
  useEffect(() => { invalidate(); return () => { request.current++; }; }, [customerId]);
  const generate = async () => {
    const id = ++request.current;
    setReport(null); setError('');
    if (!customerId) { setLoading(false); setError('Select a client first.'); return; }
    if (!period.fromDate || !period.toDate || period.fromDate > period.toDate) { setLoading(false); setError('Choose a valid From and To date.'); return; }
    setLoading(true);
    try {
      const endpoint = type === 'project' ? 'projects' : type === 'payment' ? 'payments' : type;
      const response = await fetch(`${API_URL}/reports/customer/${customerId}/${endpoint}?${new URLSearchParams(period)}`, { headers: authHeaders() });
      const payload = await response.json();
      if (!response.ok || payload.success === false) throw new Error(payload.message || 'Report generation failed. Please retry.');
      const result = normalize(payload, type, customerName, period);
      if (id === request.current) setReport(result);
    } catch (err) {
      if (id === request.current) setError(err instanceof Error ? err.message : 'Report generation failed. Please retry.');
    } finally { if (id === request.current) setLoading(false); }
  };
  const print = () => {
    if (!report) return;
    const doc = createClientReportPDF(report);
    doc.autoPrint();
    const url = URL.createObjectURL(doc.output('blob'));
    const tab = window.open(url, '_blank');
    if (!tab) { URL.revokeObjectURL(url); setError('Allow popups to print, or download the PDF.'); return; }
    window.setTimeout(() => URL.revokeObjectURL(url), 60000);
  };
  return <section className="space-y-4 rounded-2xl border bg-card p-4" aria-label="Client reports">
    <h2 className="text-lg font-semibold">Client Reports</h2>
    {!customerId && <p className="text-sm text-muted-foreground">Select a customer in the filters to generate a client report.</p>}
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">{types.map(value => <Button key={value} variant={type === value ? 'default' : 'outline'} aria-pressed={type === value} onClick={() => { invalidate(); setType(value); setPeriod(defaults(value)); }}>{value[0].toUpperCase() + value.slice(1)} Report</Button>)}</div>
    <div className="grid gap-3 sm:grid-cols-3">
      <label className="text-sm">Report Type<select className="mt-1 block h-10 w-full rounded-md border bg-background px-3" value={type} onChange={event => { invalidate(); setType(event.target.value as ReportType); setPeriod(defaults(event.target.value)); }}>{types.map(value => <option key={value} value={value}>{title(value)}</option>)}</select></label>
      {(['fromDate', 'toDate'] as const).map(key => <label key={key} className="text-sm">{key === 'fromDate' ? 'From' : 'To'}<Input className="mt-1" type="date" disabled={type === 'project' || type === 'payment'} value={period[key]} onChange={event => { invalidate(); setPeriod({ ...period, [key]: event.target.value }); }} /></label>)}
    </div>
    {(type === 'project' || type === 'payment') && <p className="text-sm text-muted-foreground">Project and payment reports include all recorded history for the selected client.</p>}
    <div className="flex flex-wrap gap-2"><Button disabled={loading || !customerId} onClick={generate}>{loading ? 'Generating…' : error ? 'Retry Report' : 'Generate Preview'}</Button><Button variant="outline" disabled={!report} onClick={() => report && createClientReportPDF(report).save(`${report.type}-${customerId}-${report.period.fromDate}-${report.period.toDate}.pdf`)}>Download PDF</Button><Button variant="outline" disabled={!report} onClick={print}>Print</Button></div>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {report && <div className="space-y-3" aria-live="polite"><h3 className="font-semibold">{title(report.type)}</h3><p>{report.customer.name} · {report.type === 'project' || report.type === 'payment' ? 'All recorded history' : `${report.period.fromDate} to ${report.period.toDate}`}</p><dl className="flex flex-wrap gap-4">{Object.entries(report.summary).map(([key, value]) => <div key={key}><dt className="text-sm text-muted-foreground">{key.replace(/([A-Z])/g, ' $1')}</dt><dd className="font-semibold">{value}</dd></div>)}</dl>{report.rows.length === 0 ? <p>No activity recorded for this period.</p> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr>{report.columns.map(column => <th className="p-2 text-left" key={column}>{column}</th>)}</tr></thead><tbody>{report.rows.map((row, index) => <tr className="border-t" key={index}>{row.map((cell, column) => <td className="whitespace-pre-line p-2 align-top" key={column}>{cell}</td>)}</tr>)}</tbody></table></div>}</div>}
  </section>;
}
