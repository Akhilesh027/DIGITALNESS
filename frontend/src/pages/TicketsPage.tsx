import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, LifeBuoy, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { Badge } from '@/components/ui/badge';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { toast } from 'sonner';

import { authHeaders, jsonHeaders, getToken } from '@/api/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const priorityColor: Record<string, string> = {
  Low: 'bg-muted text-muted-foreground',
  Medium: 'bg-info/15 text-info',
  High: 'bg-warning/15 text-warning',
  Urgent: 'bg-destructive/15 text-destructive',
};

const statusColor: Record<string, string> = {
  Open: 'bg-info/15 text-info',
  'In Progress': 'bg-warning/15 text-warning',
  Resolved: 'bg-success/15 text-success',
  Closed: 'bg-muted text-muted-foreground',
};

export default function TicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({
    customer: '',
    subject: '',
    description: '',
    category: 'Question',
    priority: 'Medium',
    assignedTo: '',
  });

  useEffect(() => {
    fetchTickets();
    fetchCustomers();
    fetchEmployees();
  }, []);

  // ================= FETCH TICKETS =================
  const fetchTickets = async () => {
    try {
      const res = await fetch(`${API_URL}/tickets`, {
        headers: authHeaders(),
      });

      const data = await res.json();

      console.log('Tickets:', data);

      if (Array.isArray(data)) {
        setTickets(data);
      } else {
        setTickets(data.tickets || []);
      }
    } catch (error) {
      console.log(error);
    }
  };

  // ================= FETCH CUSTOMERS =================
  const fetchCustomers = async () => {
    try {
      const res = await fetch(`${API_URL}/customers`, {
        headers: authHeaders(),
      });

      const data = await res.json();

      console.log('Customers API:', data);

      // HANDLE ALL POSSIBLE API RESPONSES
      if (Array.isArray(data)) {
        setCustomers(data);
      } else if (Array.isArray(data.customers)) {
        setCustomers(data.customers);
      } else if (Array.isArray(data.data)) {
        setCustomers(data.data);
      } else {
        setCustomers([]);
      }
    } catch (error) {
      console.log(error);
      setCustomers([]);
    }
  };

  // ================= FETCH EMPLOYEES =================
  const fetchEmployees = async () => {
    try {
      const res = await fetch(`${API_URL}/users`, {
        headers: authHeaders(),
      });

      const data = await res.json();

      console.log('Employees:', data);

      if (Array.isArray(data)) {
        setEmployees(data);
      } else {
        setEmployees(data.users || []);
      }
    } catch (error) {
      console.log(error);
    }
  };

  // ================= CREATE TICKET =================
  const handleSave = async () => {
    if (!form.customer || !form.subject) {
      toast.error('Customer & Subject Required');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/tickets`, {
        method: 'POST',

        headers: jsonHeaders(),

        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || 'Failed');
        return;
      }

      toast.success('Ticket Created');

      setOpen(false);

      setForm({
        customer: '',
        subject: '',
        description: '',
        category: 'Question',
        priority: 'Medium',
        assignedTo: '',
      });

      fetchTickets();
    } catch (error) {
      console.log(error);
      toast.error('Failed');
    }
  };

  // ================= UPDATE STATUS =================
  const updateStatus = async (id: string, status: string) => {
    try {
      await fetch(`${API_URL}/tickets/${id}`, {
        method: 'PUT',

        headers: jsonHeaders(),

        body: JSON.stringify({ status }),
      });

      toast.success('Status Updated');

      fetchTickets();
    } catch (error) {
      console.log(error);
    }
  };

  // ================= DELETE =================
  const deleteTicket = async (id: string) => {
    try {
      await fetch(`${API_URL}/tickets/${id}`, {
        method: 'DELETE',

        headers: authHeaders(),
      });

      toast.success('Deleted');

      fetchTickets();
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-heading font-bold flex items-center gap-2">
            <LifeBuoy className="w-6 h-6" />
            Support Tickets
          </h1>

          <p className="text-muted-foreground">
            Customer issues and requests
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="gradient">
              <Plus className="w-4 h-4 mr-2" />
              New Ticket
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Ticket</DialogTitle>
            </DialogHeader>

            <div className="space-y-3">
              {/* CUSTOMER */}
              <div>
                <Label>Customer</Label>

                <Select
                  value={form.customer}
                  onValueChange={(v) =>
                    setForm({
                      ...form,
                      customer: v,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Customer" />
                  </SelectTrigger>

                  <SelectContent>
                    {customers.length > 0 ? (
                      customers.map((c) => (
                        <SelectItem key={c._id} value={c._id}>
                          {c.name}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-sm text-muted-foreground">
                        No Customers Found
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* SUBJECT */}
              <div>
                <Label>Subject</Label>

                <Input
                  value={form.subject}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      subject: e.target.value,
                    })
                  }
                />
              </div>

              {/* DESCRIPTION */}
              <div>
                <Label>Description</Label>

                <Textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      description: e.target.value,
                    })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* PRIORITY */}
                <div>
                  <Label>Priority</Label>

                  <Select
                    value={form.priority}
                    onValueChange={(v) =>
                      setForm({
                        ...form,
                        priority: v,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent>
                      {['Low', 'Medium', 'High', 'Urgent'].map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* CATEGORY */}
                <div>
                  <Label>Category</Label>

                  <Select
                    value={form.category}
                    onValueChange={(v) =>
                      setForm({
                        ...form,
                        category: v,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent>
                      {[
                        'Bug',
                        'Feature Request',
                        'Question',
                        'Complaint',
                        'Other',
                      ].map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* ASSIGN */}
              <div>
                <Label>Assign To</Label>

                <Select
                  value={form.assignedTo}
                  onValueChange={(v) =>
                    setForm({
                      ...form,
                      assignedTo: v,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Employee" />
                  </SelectTrigger>

                  <SelectContent>
                    {employees.map((e) => (
                      <SelectItem key={e._id} value={e._id}>
                        {e.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleSave}>
                Create Ticket
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>

      {/* TABLE */}
      <div className="bg-card rounded-xl border border-border shadow-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assigned</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {tickets.map((t) => (
              <TableRow key={t._id}>
                <TableCell>
                  {t.ticketId}
                </TableCell>

                <TableCell>
                  {t.customer?.name || 'N/A'}
                </TableCell>

                <TableCell className="font-medium">
                  {t.subject}
                </TableCell>

                <TableCell>
                  <Badge variant="outline">
                    {t.category}
                  </Badge>
                </TableCell>

                <TableCell>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${priorityColor[t.priority]}`}
                  >
                    {t.priority}
                  </span>
                </TableCell>

                <TableCell>
                  <Select
                    value={t.status}
                    onValueChange={(v) =>
                      updateStatus(t._id, v)
                    }
                  >
                    <SelectTrigger
                      className={`h-8 w-[130px] ${statusColor[t.status]}`}
                    >
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent>
                      {[
                        'Open',
                        'In Progress',
                        'Resolved',
                        'Closed',
                      ].map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>

                <TableCell>
                  {t.assignedTo?.name || '—'}
                </TableCell>

                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteTicket(t._id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}

            {tickets.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center py-8"
                >
                  No Tickets
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}