import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText, Plus, Search, Download, Send, Eye, Filter,
  IndianRupee, Clock, CheckCircle, AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useInvoiceStore } from '@/store/invoiceStore';
import { useCRMStore } from '@/store/crmStore';
import { Invoice } from '@/data/invoiceData';
import { generateInvoicePDF } from '@/utils/pdfGenerator';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

export default function InvoicesPage() {
  const { invoices, updateInvoice } = useInvoiceStore();
  const { customers } = useCRMStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { toast } = useToast();

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch = inv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
  const totalPending = invoices.reduce((sum, inv) => sum + (inv.total - inv.paidAmount), 0);
  const overdueCount = invoices.filter((inv) => inv.status === 'Overdue').length;
  const paidCount = invoices.filter((inv) => inv.status === 'Paid').length;

  const handleDownloadPDF = (invoice: Invoice) => {
    const doc = generateInvoicePDF(invoice);
    doc.save(`${invoice.invoiceNumber}.pdf`);
    toast({ title: 'Invoice Downloaded', description: `${invoice.invoiceNumber} saved as PDF` });
  };

  const handleSendInvoice = (invoice: Invoice) => {
    if (invoice.status === 'Draft') {
      updateInvoice(invoice.id, { status: 'Sent' });
    }
    toast({ title: 'Invoice Sent', description: `${invoice.invoiceNumber} sent to ${invoice.customerName}` });
  };

  const getStatusBadge = (status: Invoice['status']) => {
    const variants: Record<string, any> = {
      Draft: 'secondary',
      Sent: 'info',
      Paid: 'completed',
      Overdue: 'failed',
      'Partially Paid': 'warning',
    };
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Invoices</h1>
          <p className="text-muted-foreground">Create, manage, and track invoices</p>
        </div>
        <Button variant="gradient" onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Invoice
        </Button>
      </motion.div>

      {/* Summary Cards */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl gradient-primary text-primary-foreground shadow-card">
          <div className="flex items-center gap-2 mb-1">
            <IndianRupee className="w-5 h-5" />
            <span className="text-sm opacity-80">Total Revenue</span>
          </div>
          <p className="text-2xl font-heading font-bold">{formatCurrency(totalRevenue)}</p>
        </div>
        <div className="p-5 rounded-xl bg-warning/10 border border-warning/30">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-5 h-5 text-warning" />
            <span className="text-sm text-muted-foreground">Pending</span>
          </div>
          <p className="text-2xl font-heading font-bold text-warning">{formatCurrency(totalPending)}</p>
        </div>
        <div className="p-5 rounded-xl bg-destructive/10 border border-destructive/30">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            <span className="text-sm text-muted-foreground">Overdue</span>
          </div>
          <p className="text-2xl font-heading font-bold text-destructive">{overdueCount}</p>
        </div>
        <div className="p-5 rounded-xl bg-success/10 border border-success/30">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-5 h-5 text-success" />
            <span className="text-sm text-muted-foreground">Paid</span>
          </div>
          <p className="text-2xl font-heading font-bold text-success">{paidCount}</p>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search invoices..." value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Draft">Draft</SelectItem>
            <SelectItem value="Sent">Sent</SelectItem>
            <SelectItem value="Paid">Paid</SelectItem>
            <SelectItem value="Overdue">Overdue</SelectItem>
            <SelectItem value="Partially Paid">Partially Paid</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Invoice Table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
        className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Invoice #</th>
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Customer</th>
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Date</th>
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground">Due Date</th>
                <th className="text-right p-4 text-sm font-semibold text-muted-foreground">Amount</th>
                <th className="text-right p-4 text-sm font-semibold text-muted-foreground">Paid</th>
                <th className="text-center p-4 text-sm font-semibold text-muted-foreground">Status</th>
                <th className="text-center p-4 text-sm font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                  <td className="p-4 font-medium text-sm">{invoice.invoiceNumber}</td>
                  <td className="p-4 text-sm">{invoice.customerName}</td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {new Date(invoice.createdDate).toLocaleDateString('en-IN')}
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {new Date(invoice.dueDate).toLocaleDateString('en-IN')}
                  </td>
                  <td className="p-4 text-sm text-right font-semibold">{formatCurrency(invoice.total)}</td>
                  <td className="p-4 text-sm text-right font-semibold text-success">{formatCurrency(invoice.paidAmount)}</td>
                  <td className="p-4 text-center">{getStatusBadge(invoice.status)}</td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8"
                        onClick={() => setSelectedInvoice(invoice)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8"
                        onClick={() => handleDownloadPDF(invoice)}>
                        <Download className="w-4 h-4" />
                      </Button>
                      {(invoice.status === 'Draft' || invoice.status === 'Overdue') && (
                        <Button variant="ghost" size="icon" className="h-8 w-8"
                          onClick={() => handleSendInvoice(invoice)}>
                          <Send className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Invoice Detail Modal */}
      <Dialog open={!!selectedInvoice} onOpenChange={() => setSelectedInvoice(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Invoice {selectedInvoice?.invoiceNumber}
            </DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-6">
              {/* Invoice Header */}
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-heading font-bold text-primary">Digitalness</h2>
                  <p className="text-sm text-muted-foreground">Digital Marketing & IT Solutions</p>
                  <p className="text-sm text-muted-foreground">Hyderabad, Telangana</p>
                </div>
                <div className="text-right">
                  {getStatusBadge(selectedInvoice.status)}
                  <p className="text-sm text-muted-foreground mt-2">
                    Date: {new Date(selectedInvoice.createdDate).toLocaleDateString('en-IN')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Due: {new Date(selectedInvoice.dueDate).toLocaleDateString('en-IN')}
                  </p>
                </div>
              </div>

              {/* Bill To */}
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm font-medium text-muted-foreground">Bill To</p>
                <p className="font-semibold text-lg">{selectedInvoice.customerName}</p>
              </div>

              {/* Items */}
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-3 text-sm font-semibold">#</th>
                      <th className="text-left p-3 text-sm font-semibold">Description</th>
                      <th className="text-center p-3 text-sm font-semibold">Qty</th>
                      <th className="text-right p-3 text-sm font-semibold">Rate</th>
                      <th className="text-right p-3 text-sm font-semibold">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedInvoice.items.map((item, idx) => (
                      <tr key={item.id} className="border-t border-border">
                        <td className="p-3 text-sm">{idx + 1}</td>
                        <td className="p-3 text-sm">{item.description}</td>
                        <td className="p-3 text-sm text-center">{item.quantity}</td>
                        <td className="p-3 text-sm text-right">{formatCurrency(item.rate)}</td>
                        <td className="p-3 text-sm text-right font-medium">{formatCurrency(item.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary */}
              <div className="flex justify-end">
                <div className="w-64 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(selectedInvoice.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax (18% GST)</span>
                    <span>{formatCurrency(selectedInvoice.tax)}</span>
                  </div>
                  {selectedInvoice.discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Discount</span>
                      <span className="text-success">-{formatCurrency(selectedInvoice.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg border-t border-border pt-2">
                    <span>Total</span>
                    <span>{formatCurrency(selectedInvoice.total)}</span>
                  </div>
                  {selectedInvoice.paidAmount > 0 && (
                    <div className="flex justify-between text-sm text-success">
                      <span>Paid</span>
                      <span>{formatCurrency(selectedInvoice.paidAmount)}</span>
                    </div>
                  )}
                  {selectedInvoice.total - selectedInvoice.paidAmount > 0 && (
                    <div className="flex justify-between font-semibold text-destructive">
                      <span>Balance Due</span>
                      <span>{formatCurrency(selectedInvoice.total - selectedInvoice.paidAmount)}</span>
                    </div>
                  )}
                </div>
              </div>

              {selectedInvoice.notes && (
                <div className="p-3 rounded-lg bg-muted/30 text-sm">
                  <span className="font-medium">Notes: </span>{selectedInvoice.notes}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-border">
                <Button variant="gradient" onClick={() => handleDownloadPDF(selectedInvoice)} className="flex-1">
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
                <Button variant="outline-primary" onClick={() => handleSendInvoice(selectedInvoice)} className="flex-1">
                  <Send className="w-4 h-4 mr-2" />
                  Send to Client
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Invoice Modal */}
      <CreateInvoiceModal open={showCreateModal} onClose={() => setShowCreateModal(false)} customers={customers} />
    </div>
  );
}

function CreateInvoiceModal({ open, onClose, customers }: { open: boolean; onClose: () => void; customers: any[] }) {
  const { addInvoice } = useInvoiceStore();
  const { toast } = useToast();
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [items, setItems] = useState([{ description: '', quantity: 1, rate: 0 }]);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState('');

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.rate, 0);
  const tax = Math.round(subtotal * 0.18);
  const total = subtotal + tax - discount;

  const handleAddItem = () => setItems([...items, { description: '', quantity: 1, rate: 0 }]);

  const handleRemoveItem = (idx: number) => {
    if (items.length > 1) setItems(items.filter((_, i) => i !== idx));
  };

  const handleItemChange = (idx: number, field: string, value: any) => {
    setItems(items.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const handleCreate = () => {
    const customer = customers.find((c) => c.id === selectedCustomer);
    if (!customer || items.some((i) => !i.description || i.rate <= 0)) {
      toast({ title: 'Error', description: 'Please fill all fields', variant: 'destructive' });
      return;
    }

    const invoice: any = {
      id: `INV${Date.now()}`,
      invoiceNumber: `KN21-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`,
      customerId: customer.id,
      customerName: customer.name,
      items: items.map((item, i) => ({
        id: `ITEM${Date.now()}${i}`,
        ...item,
        amount: item.quantity * item.rate,
      })),
      subtotal,
      tax,
      discount,
      total,
      status: 'Draft',
      createdDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      paidAmount: 0,
      notes,
    };

    addInvoice(invoice);
    toast({ title: 'Invoice Created', description: `Invoice ${invoice.invoiceNumber} created successfully` });
    onClose();
    setSelectedCustomer('');
    setItems([{ description: '', quantity: 1, rate: 0 }]);
    setDiscount(0);
    setNotes('');
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Invoice</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
            <SelectTrigger><SelectValue placeholder="Select Customer" /></SelectTrigger>
            <SelectContent>
              {customers.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="space-y-3">
            <p className="text-sm font-semibold">Line Items</p>
            {items.map((item, idx) => (
              <div key={idx} className="flex gap-2 items-end">
                <div className="flex-1">
                  <Input placeholder="Description" value={item.description}
                    onChange={(e) => handleItemChange(idx, 'description', e.target.value)} />
                </div>
                <div className="w-20">
                  <Input type="number" placeholder="Qty" value={item.quantity}
                    onChange={(e) => handleItemChange(idx, 'quantity', parseInt(e.target.value) || 0)} />
                </div>
                <div className="w-28">
                  <Input type="number" placeholder="Rate ₹" value={item.rate || ''}
                    onChange={(e) => handleItemChange(idx, 'rate', parseInt(e.target.value) || 0)} />
                </div>
                <p className="w-24 text-right text-sm font-medium py-2">
                  {formatCurrency(item.quantity * item.rate)}
                </p>
                <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive"
                  onClick={() => handleRemoveItem(idx)}>✕</Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={handleAddItem}>
              <Plus className="w-3 h-3 mr-1" /> Add Item
            </Button>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm text-muted-foreground">Discount (₹)</label>
              <Input type="number" value={discount || ''} onChange={(e) => setDiscount(parseInt(e.target.value) || 0)} />
            </div>
            <div className="flex-1">
              <label className="text-sm text-muted-foreground">Notes</label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" />
            </div>
          </div>

          <div className="p-4 rounded-lg bg-muted/50 space-y-1 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
            <div className="flex justify-between"><span>GST (18%)</span><span>{formatCurrency(tax)}</span></div>
            {discount > 0 && <div className="flex justify-between"><span>Discount</span><span className="text-success">-{formatCurrency(discount)}</span></div>}
            <div className="flex justify-between font-bold text-lg border-t border-border pt-2">
              <span>Total</span><span>{formatCurrency(total)}</span>
            </div>
          </div>

          <Button variant="gradient" className="w-full" onClick={handleCreate}>
            Create Invoice
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
