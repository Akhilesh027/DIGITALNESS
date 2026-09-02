import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  IndianRupee, Clock, CheckCircle, AlertTriangle, Bell, Send,
  Search, Filter, CreditCard, Building2, MessageSquare, Phone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useInvoiceStore } from '@/store/invoiceStore';
import { useCRMStore } from '@/store/crmStore';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

export default function PaymentsPage() {
  const { invoices, paymentRecords, paymentReminders, addPaymentReminder, addPaymentRecord, updateInvoice } = useInvoiceStore();
  const { customers } = useCRMStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showRecordPayment, setShowRecordPayment] = useState(false);
  const { toast } = useToast();

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

  const totalReceived = paymentRecords.filter((p) => p.status === 'Completed').reduce((s, p) => s + p.amount, 0);
  const totalOutstanding = invoices.reduce((s, inv) => s + Math.max(0, inv.total - inv.paidAmount), 0);
  const overdueInvoices = invoices.filter((inv) => inv.status === 'Overdue');
  const recentPayments = [...paymentRecords].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Outstanding per customer
  const customerOutstanding = customers.map((c) => {
    const custInvoices = invoices.filter((inv) => inv.customerId === c.id);
    const outstanding = custInvoices.reduce((s, inv) => s + Math.max(0, inv.total - inv.paidAmount), 0);
    const lastPayment = paymentRecords.filter((p) => p.customerId === c.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    const reminders = paymentReminders.filter((r) => r.customerId === c.id);
    return { ...c, outstanding, lastPayment, reminders, invoiceCount: custInvoices.length };
  }).filter((c) => c.outstanding > 0);

  const handleSendReminder = (customerId: string, invoiceId: string, type: 'WhatsApp' | 'Email' | 'Call') => {
    addPaymentReminder({
      id: `REM${Date.now()}`,
      customerId,
      invoiceId,
      sentDate: new Date().toISOString().split('T')[0],
      type,
      status: 'Sent',
    });
    toast({ title: 'Reminder Sent', description: `${type} reminder sent successfully` });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Payments & Dues</h1>
          <p className="text-muted-foreground">Track payments, outstanding dues, and send reminders</p>
        </div>
        <Button variant="gradient" onClick={() => setShowRecordPayment(true)}>
          <CreditCard className="w-4 h-4 mr-2" /> Record Payment
        </Button>
      </motion.div>

      {/* Summary */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl gradient-primary text-primary-foreground shadow-card">
          <div className="flex items-center gap-2 mb-1"><IndianRupee className="w-5 h-5" /><span className="text-sm opacity-80">Total Received</span></div>
          <p className="text-2xl font-heading font-bold">{formatCurrency(totalReceived)}</p>
        </div>
        <div className="p-5 rounded-xl bg-warning/10 border border-warning/30">
          <div className="flex items-center gap-2 mb-1"><Clock className="w-5 h-5 text-warning" /><span className="text-sm text-muted-foreground">Outstanding</span></div>
          <p className="text-2xl font-heading font-bold text-warning">{formatCurrency(totalOutstanding)}</p>
        </div>
        <div className="p-5 rounded-xl bg-destructive/10 border border-destructive/30">
          <div className="flex items-center gap-2 mb-1"><AlertTriangle className="w-5 h-5 text-destructive" /><span className="text-sm text-muted-foreground">Overdue Invoices</span></div>
          <p className="text-2xl font-heading font-bold text-destructive">{overdueInvoices.length}</p>
        </div>
        <div className="p-5 rounded-xl bg-success/10 border border-success/30">
          <div className="flex items-center gap-2 mb-1"><CheckCircle className="w-5 h-5 text-success" /><span className="text-sm text-muted-foreground">Payments This Month</span></div>
          <p className="text-2xl font-heading font-bold text-success">{paymentRecords.filter((p) => p.date >= '2024-12-01').length}</p>
        </div>
      </motion.div>

      {/* Outstanding Dues by Customer */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <h2 className="text-lg font-heading font-bold mb-3">Outstanding Dues</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customerOutstanding.map((cust) => (
            <div key={cust.id} className="p-4 rounded-xl bg-card border border-border shadow-card">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold">
                  {cust.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{cust.name}</p>
                  <p className="text-xs text-muted-foreground">{cust.businessType}</p>
                </div>
                <p className="text-lg font-bold text-warning">{formatCurrency(cust.outstanding)}</p>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                <span>{cust.invoiceCount} invoice(s)</span>
                {cust.lastPayment && (
                  <span>Last paid: {new Date(cust.lastPayment.date).toLocaleDateString('en-IN')}</span>
                )}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1 text-xs"
                  onClick={() => handleSendReminder(cust.id, overdueInvoices.find((i) => i.customerId === cust.id)?.id || '', 'WhatsApp')}>
                  <MessageSquare className="w-3 h-3 mr-1" /> WhatsApp
                </Button>
                <Button size="sm" variant="outline" className="flex-1 text-xs"
                  onClick={() => handleSendReminder(cust.id, overdueInvoices.find((i) => i.customerId === cust.id)?.id || '', 'Email')}>
                  <Send className="w-3 h-3 mr-1" /> Email
                </Button>
                <Button size="sm" variant="outline" className="flex-1 text-xs"
                  onClick={() => handleSendReminder(cust.id, overdueInvoices.find((i) => i.customerId === cust.id)?.id || '', 'Call')}>
                  <Phone className="w-3 h-3 mr-1" /> Call
                </Button>
              </div>
              {cust.reminders.length > 0 && (
                <div className="mt-2 pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-1">Reminders ({cust.reminders.length})</p>
                  {cust.reminders.slice(0, 2).map((r) => (
                    <div key={r.id} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1">
                        <Bell className="w-3 h-3" /> {r.type}
                      </span>
                      <span className="text-muted-foreground">{new Date(r.sentDate).toLocaleDateString('en-IN')}</span>
                      <Badge variant={r.status === 'Acknowledged' ? 'completed' : r.status === 'Sent' ? 'info' : 'pending'} className="text-xs">
                        {r.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {customerOutstanding.length === 0 && (
            <div className="col-span-full text-center py-8 text-muted-foreground">
              <CheckCircle className="w-12 h-12 mx-auto mb-2 text-success" />
              <p>No outstanding dues! All payments are up to date.</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Recent Payments */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <h2 className="text-lg font-heading font-bold mb-3">Recent Payments</h2>
        <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left p-3 text-sm font-semibold text-muted-foreground">Customer</th>
                  <th className="text-left p-3 text-sm font-semibold text-muted-foreground">Date</th>
                  <th className="text-left p-3 text-sm font-semibold text-muted-foreground">Method</th>
                  <th className="text-left p-3 text-sm font-semibold text-muted-foreground">Reference</th>
                  <th className="text-right p-3 text-sm font-semibold text-muted-foreground">Amount</th>
                  <th className="text-center p-3 text-sm font-semibold text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentPayments.slice(0, 10).map((payment) => {
                  const customer = customers.find((c) => c.id === payment.customerId);
                  return (
                    <tr key={payment.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                      <td className="p-3 text-sm font-medium">{customer?.name || payment.customerId}</td>
                      <td className="p-3 text-sm text-muted-foreground">{new Date(payment.date).toLocaleDateString('en-IN')}</td>
                      <td className="p-3 text-sm"><Badge variant="secondary">{payment.method}</Badge></td>
                      <td className="p-3 text-sm text-muted-foreground">{payment.reference || '—'}</td>
                      <td className="p-3 text-sm text-right font-semibold text-success">{formatCurrency(payment.amount)}</td>
                      <td className="p-3 text-center">
                        <Badge variant={payment.status === 'Completed' ? 'completed' : payment.status === 'Pending' ? 'pending' : 'failed'}>
                          {payment.status}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>

      {/* Record Payment Modal */}
      <RecordPaymentModal open={showRecordPayment} onClose={() => setShowRecordPayment(false)} />
    </div>
  );
}

function RecordPaymentModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { invoices, addPaymentRecord, updateInvoice } = useInvoiceStore();
  const { customers } = useCRMStore();
  const { toast } = useToast();
  const [customerId, setCustomerId] = useState('');
  const [amount, setAmount] = useState(0);
  const [method, setMethod] = useState('UPI');
  const [reference, setReference] = useState('');

  const handleRecord = () => {
    if (!customerId || amount <= 0) {
      toast({ title: 'Error', description: 'Fill all required fields', variant: 'destructive' });
      return;
    }
    addPaymentRecord({
      id: `PAY${Date.now()}`,
      customerId,
      amount,
      date: new Date().toISOString().split('T')[0],
      method: method as any,
      reference,
      status: 'Completed',
    });

    // Update first unpaid invoice
    const unpaidInvoice = invoices.find((inv) => inv.customerId === customerId && inv.paidAmount < inv.total);
    if (unpaidInvoice) {
      const newPaid = unpaidInvoice.paidAmount + amount;
      updateInvoice(unpaidInvoice.id, {
        paidAmount: Math.min(newPaid, unpaidInvoice.total),
        status: newPaid >= unpaidInvoice.total ? 'Paid' : 'Partially Paid',
      });
    }

    toast({ title: 'Payment Recorded', description: `₹${amount.toLocaleString('en-IN')} received` });
    onClose();
    setCustomerId('');
    setAmount(0);
    setReference('');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <Select value={customerId} onValueChange={setCustomerId}>
            <SelectTrigger><SelectValue placeholder="Select Customer" /></SelectTrigger>
            <SelectContent>
              {customers.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
            </SelectContent>
          </Select>
          <Input type="number" placeholder="Amount ₹" value={amount || ''} onChange={(e) => setAmount(parseInt(e.target.value) || 0)} />
          <Select value={method} onValueChange={setMethod}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="UPI">UPI</SelectItem>
              <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
              <SelectItem value="Cash">Cash</SelectItem>
              <SelectItem value="Cheque">Cheque</SelectItem>
              <SelectItem value="Card">Card</SelectItem>
            </SelectContent>
          </Select>
          <Input placeholder="Reference / Transaction ID" value={reference} onChange={(e) => setReference(e.target.value)} />
          <Button variant="gradient" className="w-full" onClick={handleRecord}>Record Payment</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
