import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Wallet, TrendingUp, TrendingDown, CreditCard, PiggyBank, Users, Plus,
  Calendar, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useCRMStore } from '@/store/crmStore';
import { financialRecords as initialFinRecords, salaryRecords, dashboardStats, FinancialRecord } from '@/data/dummyData';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

export default function AccountsPage() {
  const { employees, financialRecords, addFinancialRecord } = useCRMStore();
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const { toast } = useToast();

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

  const totalIncome = financialRecords.filter((r) => r.type === 'Income').reduce((sum, r) => sum + r.amount, 0);
  const totalExpenses = financialRecords.filter((r) => r.type === 'Expense').reduce((sum, r) => sum + r.amount, 0);
  const totalSalaryPaid = salaryRecords.filter((s) => s.status === 'Paid').reduce((sum, s) => sum + s.amount, 0);
  const totalSalaryPending = salaryRecords.filter((s) => s.status === 'Pending').reduce((sum, s) => sum + s.amount, 0);
  const profit = totalIncome - totalExpenses;

  const incomeByCategory = financialRecords.filter((r) => r.type === 'Income').reduce((acc, r) => {
    acc[r.category] = (acc[r.category] || 0) + r.amount;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(incomeByCategory).map(([category, amount]) => ({ category, amount }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Accounts & Finance</h1>
          <p className="text-muted-foreground">Manage income, expenses, and salary payments</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowExpenseModal(true)}>
            <Plus className="w-4 h-4 mr-2" /> Add Expense
          </Button>
          <Button variant="gradient" onClick={() => setShowIncomeModal(true)}>
            <Plus className="w-4 h-4 mr-2" /> Add Income
          </Button>
        </div>
      </motion.div>

      {/* Financial Summary Cards */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl gradient-primary text-primary-foreground shadow-card">
          <div className="flex items-center justify-between mb-3"><Wallet className="w-6 h-6" /><ArrowUpRight className="w-5 h-5 text-success" /></div>
          <p className="text-sm text-primary-foreground/80">Total Income</p>
          <p className="text-2xl font-heading font-bold">{formatCurrency(totalIncome)}</p>
        </div>
        <div className="p-5 rounded-xl bg-destructive/10 border border-destructive/30">
          <div className="flex items-center justify-between mb-3"><CreditCard className="w-6 h-6 text-destructive" /><ArrowDownRight className="w-5 h-5 text-destructive" /></div>
          <p className="text-sm text-muted-foreground">Total Expenses</p>
          <p className="text-2xl font-heading font-bold text-destructive">{formatCurrency(totalExpenses)}</p>
        </div>
        <div className={`p-5 rounded-xl ${profit >= 0 ? 'bg-success/10 border-success/30' : 'bg-destructive/10 border-destructive/30'} border`}>
          <div className="flex items-center justify-between mb-3">
            <TrendingUp className={`w-6 h-6 ${profit >= 0 ? 'text-success' : 'text-destructive'}`} />
            {profit >= 0 ? <ArrowUpRight className="w-5 h-5 text-success" /> : <ArrowDownRight className="w-5 h-5 text-destructive" />}
          </div>
          <p className="text-sm text-muted-foreground">Net Profit/Loss</p>
          <p className={`text-2xl font-heading font-bold ${profit >= 0 ? 'text-success' : 'text-destructive'}`}>{formatCurrency(profit)}</p>
        </div>
        <div className="p-5 rounded-xl bg-card border border-border shadow-card">
          <div className="flex items-center justify-between mb-3"><PiggyBank className="w-6 h-6 text-accent" /><span className="text-xs text-muted-foreground">This Month</span></div>
          <p className="text-sm text-muted-foreground">Total Salary</p>
          <p className="text-2xl font-heading font-bold text-foreground">{formatCurrency(totalSalaryPaid + totalSalaryPending)}</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income by Category Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-card rounded-xl border border-border shadow-card p-6">
          <h3 className="text-lg font-heading font-semibold text-foreground mb-6">Income by Category</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 20%, 88%)" vertical={false} />
                <XAxis dataKey="category" axisLine={false} tickLine={false} tick={{ fill: 'hsl(215, 15%, 45%)', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'hsl(215, 15%, 45%)', fontSize: 11 }}
                  tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(0, 0%, 100%)', border: '1px solid hsl(210, 20%, 88%)', borderRadius: '8px' }}
                  formatter={(value: number) => [formatCurrency(value), 'Amount']} />
                <Bar dataKey="amount" fill="hsl(168, 75%, 40%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Salary Status */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-card rounded-xl border border-border shadow-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-heading font-semibold text-foreground">Salary Status - November 2024</h3>
            <Badge variant="warning">{salaryRecords.filter((s) => s.status === 'Pending').length} pending</Badge>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-lg bg-success/10 border border-success/30">
              <p className="text-sm text-muted-foreground">Paid</p>
              <p className="text-xl font-heading font-bold text-success">{formatCurrency(totalSalaryPaid)}</p>
            </div>
            <div className="p-4 rounded-lg bg-warning/10 border border-warning/30">
              <p className="text-sm text-muted-foreground">Pending</p>
              <p className="text-xl font-heading font-bold text-warning">{formatCurrency(totalSalaryPending)}</p>
            </div>
          </div>
          <div className="space-y-3">
            {salaryRecords.slice(0, 4).map((record) => {
              const emp = employees.find((e) => e.id === record.employeeId);
              return (
                <div key={record.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                      {emp?.name.charAt(0) || '?'}
                    </div>
                    <div><p className="font-medium text-sm">{emp?.name || 'Unknown'}</p><p className="text-xs text-muted-foreground">{emp?.role}</p></div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">{formatCurrency(record.amount)}</p>
                    <Badge variant={record.status === 'Paid' ? 'success' : 'warning'} className="text-xs">{record.status}</Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Recent Transactions */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="bg-card rounded-xl border border-border shadow-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-heading font-semibold text-foreground">Recent Transactions</h3>
          <Button variant="ghost" size="sm">View All</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border">
              <tr>
                <th className="text-left py-3 text-sm font-medium text-muted-foreground">Type</th>
                <th className="text-left py-3 text-sm font-medium text-muted-foreground">Category</th>
                <th className="text-left py-3 text-sm font-medium text-muted-foreground">Description</th>
                <th className="text-left py-3 text-sm font-medium text-muted-foreground">Date</th>
                <th className="text-right py-3 text-sm font-medium text-muted-foreground">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {financialRecords.slice(0, 6).map((record, index) => (
                <motion.tr key={record.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }} className="hover:bg-muted/30 transition-colors">
                  <td className="py-3"><Badge variant={record.type === 'Income' ? 'success' : 'destructive'}>{record.type}</Badge></td>
                  <td className="py-3 text-sm text-muted-foreground">{record.category}</td>
                  <td className="py-3 text-sm font-medium">{record.description}</td>
                  <td className="py-3 text-sm text-muted-foreground">
                    {new Date(record.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className={`py-3 text-sm font-semibold text-right ${record.type === 'Income' ? 'text-success' : 'text-destructive'}`}>
                    {record.type === 'Income' ? '+' : '-'}{formatCurrency(record.amount)}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Add Income Modal */}
      <AddFinancialModal open={showIncomeModal} onClose={() => setShowIncomeModal(false)} type="Income" onAdd={addFinancialRecord} />
      {/* Add Expense Modal */}
      <AddFinancialModal open={showExpenseModal} onClose={() => setShowExpenseModal(false)} type="Expense" onAdd={addFinancialRecord} />
    </div>
  );
}

function AddFinancialModal({ open, onClose, type, onAdd }: {
  open: boolean; onClose: () => void; type: 'Income' | 'Expense'; onAdd: (record: FinancialRecord) => void;
}) {
  const { toast } = useToast();
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(0);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const incomeCategories = ['Digital Marketing', 'Website', 'App Development', 'Video Production', 'SEO', 'Consulting', 'Other'];
  const expenseCategories = ['Salary', 'Rent', 'Software', 'Marketing', 'Travel', 'Utilities', 'Equipment', 'Other'];
  const categories = type === 'Income' ? incomeCategories : expenseCategories;

  const handleSubmit = () => {
    if (!category || !description || amount <= 0) {
      toast({ title: 'Error', description: 'Please fill all fields', variant: 'destructive' });
      return;
    }
    onAdd({
      id: `FIN${Date.now()}`,
      type,
      category,
      description,
      amount,
      date,
    });
    toast({ title: `${type} Added`, description: `₹${amount.toLocaleString('en-IN')} recorded as ${type.toLowerCase()}` });
    onClose();
    setCategory('');
    setDescription('');
    setAmount(0);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Add {type}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Category *</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Description *</label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder={`${type} description`} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Amount (₹) *</label>
              <Input type="number" value={amount || ''} onChange={(e) => setAmount(parseInt(e.target.value) || 0)} placeholder="Amount" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Date</label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button variant="gradient" onClick={handleSubmit} className="flex-1">Add {type}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}