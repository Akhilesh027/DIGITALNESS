import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Building2,
  Pencil,
  Trash2,
  Plus,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

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

const API_URL = 'https://server.digitalness.co.in/api';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  branchId?: string;
}

interface Branch {
  _id: string;
  branchId: string;
  name: string;
  city: string;
  managerId?: User | null;
  status: 'Active' | 'Inactive';
}

interface BranchForm {
  branchId: string;
  name: string;
  city: string;
  managerId: string;
  status: 'Active' | 'Inactive';
}

const emptyForm: BranchForm = {
  branchId: '',
  name: '',
  city: '',
  managerId: '',
  status: 'Active',
};

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [open, setOpen] = useState(false);

  const [editing, setEditing] = useState<Branch | null>(null);

  const [form, setForm] = useState<BranchForm>(emptyForm);

  const token = localStorage.getItem('token');

  const authHeaders = {
    Authorization: `Bearer ${token}`,
  };

  const jsonHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  useEffect(() => {
    fetchBranches();
    fetchEmployees();
  }, []);

  // FETCH BRANCHES
  const fetchBranches = async () => {
    try {
      const res = await fetch(`${API_URL}/branches`, {
        headers: authHeaders,
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message);
        return;
      }

      setBranches(data.branches || data);
    } catch (error) {
      toast.error('Failed to fetch branches');
    }
  };

  // FETCH USERS
  const fetchEmployees = async () => {
    try {
      const res = await fetch(`${API_URL}/users`, {
        headers: authHeaders,
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message);
        return;
      }

      setEmployees(data.users || data);
    } catch (error) {
      toast.error('Failed to fetch employees');
    }
  };

  const managers = employees.filter(
    (emp) =>
      emp.role === 'Operational Manager' ||
      emp.department === 'Management'
  );

  // CREATE / UPDATE
  const handleSave = async () => {
    try {
      if (!form.branchId || !form.name || !form.city) {
        toast.error('All fields required');
        return;
      }

      const url = editing
        ? `${API_URL}/branches/${editing._id}`
        : `${API_URL}/branches`;

      const method = editing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: jsonHeaders,
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message);
        return;
      }

      toast.success(
        editing
          ? 'Branch updated'
          : 'Branch created'
      );

      setOpen(false);
      setEditing(null);
      setForm(emptyForm);

      fetchBranches();
    } catch (error) {
      toast.error('Failed');
    }
  };

  // EDIT
  const openEdit = (branch: Branch) => {
    setEditing(branch);

    setForm({
      branchId: branch.branchId,
      name: branch.name,
      city: branch.city,
      managerId: branch.managerId?._id || '',
      status: branch.status,
    });

    setOpen(true);
  };

  // DELETE
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(
        `${API_URL}/branches/${id}`,
        {
          method: 'DELETE',
          headers: authHeaders,
        }
      );

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message);
        return;
      }

      toast.success('Branch deleted');

      fetchBranches();
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="w-6 h-6" />
            Branches
          </h1>

          <p className="text-muted-foreground">
            Manage company branches
          </p>
        </div>

        <Dialog
          open={open}
          onOpenChange={(value) => {
            setOpen(value);

            if (!value) {
              setEditing(null);
              setForm(emptyForm);
            }
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Branch
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editing
                  ? 'Edit Branch'
                  : 'Create Branch'}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3">
              <div>
                <Label>Branch ID</Label>

                <Input
                  value={form.branchId}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      branchId: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <Label>Branch Name</Label>

                <Input
                  value={form.name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      name: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <Label>City</Label>

                <Input
                  value={form.city}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      city: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <Label>Manager</Label>

                <Select
                  value={form.managerId}
                  onValueChange={(v) =>
                    setForm({
                      ...form,
                      managerId: v,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select manager" />
                  </SelectTrigger>

                  <SelectContent>
                    {managers.map((manager) => (
                      <SelectItem
                        key={manager._id}
                        value={manager._id}
                      >
                        {manager.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Status</Label>

                <Select
                  value={form.status}
                  onValueChange={(v) =>
                    setForm({
                      ...form,
                      status:
                        v as 'Active' | 'Inactive',
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="Active">
                      Active
                    </SelectItem>

                    <SelectItem value="Inactive">
                      Inactive
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleSave}>
                {editing ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>

      <div className="bg-card rounded-xl border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Branch ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Manager</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {branches.map((branch) => (
              <TableRow key={branch._id}>
                <TableCell>
                  {branch.branchId}
                </TableCell>

                <TableCell>
                  {branch.name}
                </TableCell>

                <TableCell>
                  {branch.city}
                </TableCell>

                <TableCell>
                  {branch.managerId?.name || '—'}
                </TableCell>

                <TableCell>
                  <Badge
                    variant={
                      branch.status === 'Active'
                        ? 'default'
                        : 'secondary'
                    }
                  >
                    {branch.status}
                  </Badge>
                </TableCell>

                <TableCell className="space-x-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() =>
                      openEdit(branch)
                    }
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>

                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() =>
                      handleDelete(branch._id)
                    }
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}

            {branches.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-10"
                >
                  No branches found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}