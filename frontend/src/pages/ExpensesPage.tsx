import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useInvoiceStore } from '@/store/invoiceStore';
import { useCRMStore } from '@/store/crmStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Plus, IndianRupee, TrendingUp, TrendingDown, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = "https://server.digitalness.co.in/api/expenses";
const getAuthHeaders = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

const COLORS = ['hsl(var(--primary))', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4', '#64748b'];
const CATEGORIES = ['Software & Tools', 'Office Rent', 'Salaries & Payroll', 'Marketing & Ads', 'Utilities', 'Travel', 'Misc'];

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { invoices } = useInvoiceStore();
  const { customers } = useCRMStore();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    expenseDate: new Date().toISOString().split('T')[0],
    category: 'Marketing & Ads',
    amount: 0,
    description: '',
    paymentMethod: 'Bank Transfer',
    referenceNumber: '',
  });

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await axios.get(API_URL, getAuthHeaders());
      setExpenses(res.data.data || []);
    } catch (err: any) {
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const totalExp = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const totalRev = invoices.reduce((s, i) => s + (Number(i.paidAmount) || 0), 0);
  const profit = totalRev - totalExp;
  const margin = totalRev ? Math.round((profit / totalRev) * 100) : 0;

  const byCategory = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((e) => { map[e.category] = (map[e.category] || 0) + (Number(e.amount) || 0); });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [expenses]);

  const handleSubmit = async () => {
    if (!form.amount || !form.description) {
      toast.error('Amount and description required');
      return;
    }
    try {
      setSubmitting(true);
      await axios.post(API_URL, form, getAuthHeaders());
      toast.success('Expense record created in MongoDB');
      setOpen(false);
      setForm({ ...form, amount: 0, description: '', referenceNumber: '' });
      fetchExpenses();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save expense');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`${API_URL}/${id}`, getAuthHeaders());
      toast.success('Expense record deleted');
      fetchExpenses();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete expense');
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold">Agency Expenses & P&L</h1>
          <p className="text-muted-foreground">Real-time MongoDB expense tracking and operational margin analytics</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchExpenses}><RefreshCcw className="w-4 h-4 mr-1" />Refresh</Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Add Expense</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New Agency Expense</DialogTitle>
                <DialogDescription className="text-xs text-slate-500">Record a real operational expense to persist in MongoDB.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 pt-2">
                <Input type="date" value={form.expenseDate} onChange={(e) => setForm({ ...form, expenseDate: e.target.value })} />
                <Select value={form.category} onValueChange={(v: any) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
                <Input type="number" placeholder="Amount (₹)" value={form.amount || ''} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
                <Textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                <Input placeholder="Reference / Transaction ID" value={form.referenceNumber} onChange={(e) => setForm({ ...form, referenceNumber: e.target.value })} />
                <Button className="w-full bg-indigo-600" onClick={handleSubmit} disabled={submitting}>{submitting ? 'Saving...' : 'Save Expense Record'}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Revenue</p><p className="text-2xl font-bold flex items-center"><IndianRupee className="w-5 h-5" />{totalRev.toLocaleString('en-IN')}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Expenses</p><p className="text-2xl font-bold flex items-center text-rose-500"><IndianRupee className="w-5 h-5" />{totalExp.toLocaleString('en-IN')}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Profit</p><p className={`text-2xl font-bold flex items-center ${profit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{profit >= 0 ? <TrendingUp className="w-5 h-5 mr-1" /> : <TrendingDown className="w-5 h-5 mr-1" />}₹{profit.toLocaleString('en-IN')}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Margin</p><p className="text-2xl font-bold">{margin}%</p></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Spend by Category</CardTitle></CardHeader>
          <CardContent>
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={byCategory} dataKey="value" nameKey="name" outerRadius={90} label>
                    {byCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => `₹${v.toLocaleString('en-IN')}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Agency Expense Ledger (MongoDB Persisted)</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-6 text-xs text-slate-400">Loading Expenses...</div>
          ) : expenses.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 border border-dashed rounded-lg">No expenses recorded yet. Click Add Expense to record first transaction.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead><TableHead>Category</TableHead>
                  <TableHead>Description</TableHead><TableHead>Method</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((e) => (
                  <TableRow key={e._id}>
                    <TableCell>{new Date(e.expenseDate).toLocaleDateString()}</TableCell>
                    <TableCell><Badge variant="outline">{e.category}</Badge></TableCell>
                    <TableCell>{e.description}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{e.paymentMethod || 'Bank Transfer'}</TableCell>
                    <TableCell className="text-right font-medium">₹{Number(e.amount).toLocaleString('en-IN')}</TableCell>
                    <TableCell><Button variant="ghost" size="sm" onClick={() => handleDelete(e._id)}>×</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
