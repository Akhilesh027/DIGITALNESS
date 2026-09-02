import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Plus,
  Filter,
  Phone,
  Mail,
  MapPin,
  Edit,
  Trash2,
  Eye,
  Building2,
  Loader2,
  UserRound,
  Shield,
  BriefcaseBusiness,
  IdCard,
  CalendarDays,
  IndianRupee,
  FileText,
  Award,
  Activity,
  Download,
  UploadCloud,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

type EmployeeStatus = "Active" | "Inactive";

interface EmployeeDocument {
  fileName: string;
  fileUrl: string;
  fileType?: string;
  uploadedAt?: string;
  isLocal?: boolean;
}

interface EmergencyContact {
  name: string;
  phone: string;
  relation: string;
}

interface BankDetails {
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  upiId: string;
}

interface Employee {
  _id: string;
  employeeId?: string;
  name: string;
  role: string;
  department: string;
  designation?: string;
  phone: string;
  alternatePhone?: string;
  email: string;
  address?: string;
  city?: string;
  state?: string;
  salary?: number;
  dateOfJoining?: string;
  dateOfBirth?: string;
  status: EmployeeStatus;
  branchId?: string;
  skills?: string[];
  documents?: EmployeeDocument[];
  emergencyContact?: EmergencyContact;
  bankDetails?: BankDetails;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface EmployeeForm {
  employeeId: string;
  name: string;
  role: string;
  department: string;
  designation: string;
  phone: string;
  alternatePhone: string;
  email: string;
  password: string;
  address: string;
  city: string;
  state: string;
  salary: number;
  dateOfJoining: string;
  dateOfBirth: string;
  status: EmployeeStatus;
  branchId: string;
  skillsText: string;
  notes: string;
  documents: EmployeeDocument[];
  emergencyContact: EmergencyContact;
  bankDetails: BankDetails;
}

interface Branch {
  id: string;
  _id?: string;
  name: string;
  branchId: string;
}

const emptyEmployee: EmployeeForm = {
  employeeId: "",
  name: "",
  role: "",
  department: "Sales",
  designation: "",
  phone: "",
  alternatePhone: "",
  email: "",
  password: "",
  address: "",
  city: "",
  state: "",
  salary: 0,
  dateOfJoining: new Date().toISOString().split("T")[0],
  dateOfBirth: "",
  status: "Active",
  branchId: "",
  skillsText: "",
  notes: "",
  documents: [],
  emergencyContact: {
    name: "",
    phone: "",
    relation: "",
  },
  bankDetails: {
    accountHolderName: "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    upiId: "",
  },
};

const departments = [
  "All",
  "Management",
  "Sales",
  "Creative",
  "Technical",
  "Marketing",
  "Support",
  "Operations",
  "HR",
  "Finance",
];

const roles = [
  "Admin",
  "Operational Manager",
  "Performance Marketer",
  "Content Writer",
  "Graphic Designer",
  "UI/UX",
  "Telecaller",
  "Frontend Dev",
  "Backend Dev",
  "BDE",
  "Support",
];

const designations = [
  "Founder",
  "Admin",
  "Operational Manager",
  "MERN Stack Developer",
  "Frontend Developer",
  "Backend Developer",
  "Performance Marketer",
  "SEO Executive",
  "Content Writer",
  "Graphic Designer",
  "UI/UX Designer",
  "Telecaller",
  "Business Development Executive",
  "Support Executive",
  "Intern",
];

const getToken = () =>
  localStorage.getItem("token") ||
  localStorage.getItem("authToken") ||
  localStorage.getItem("accessToken");

const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

const getArrayData = (data: any): any[] => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.users)) return data.users;
  if (Array.isArray(data?.employees)) return data.employees;
  if (Array.isArray(data?.branches)) return data.branches;
  return [];
};

const normalizeBranch = (branch: any): Branch => ({
  id: branch._id || branch.id || branch.branchId,
  _id: branch._id,
  branchId: branch.branchId || branch._id || branch.id,
  name: branch.name || branch.branchName || branch.branchId || "Unnamed Branch",
});

const formatDateInput = (value?: string) => {
  if (!value) return "";
  try {
    return new Date(value).toISOString().split("T")[0];
  } catch {
    return "";
  }
};

export default function EmployeesPage() {
  const { toast } = useToast();

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("All");
  const [selectedBranchFilter, setSelectedBranchFilter] = useState("All");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("All");

  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  const [formData, setFormData] = useState<EmployeeForm>(emptyEmployee);

  const [loading, setLoading] = useState(false);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const branchName = (branchId?: string) => {
    if (!branchId) return "—";

    const branch = branches.find(
      (b) => b.branchId === branchId || b.id === branchId || b._id === branchId
    );

    return branch?.name || branchId;
  };

  const formatSalary = (amount?: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount || 0);

  const fetchBranches = async () => {
    try {
      setBranchesLoading(true);

      const res = await fetch(`${API_URL}/branches`, {
        headers: getAuthHeaders(),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch branches");
      }

      setBranches(getArrayData(data).map(normalizeBranch));
    } catch (error: any) {
      toast({
        title: "Branch Error",
        description: error.message || "Could not load branches",
        variant: "destructive",
      });
      setBranches([]);
    } finally {
      setBranchesLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/users`, {
        headers: getAuthHeaders(),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to fetch users");
      }

      setEmployees(getArrayData(data));
    } catch (error: any) {
      toast({
        title: "Users Error",
        description: error.message || "Could not load users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedEmpData = employees.find((employee) => employee._id === selectedEmployee);

  const getStatusLabel = (status?: string) => {
    const clean = String(status || "Active").trim().toLowerCase();
    return clean === "inactive" ? "Inactive" : "Active";
  };

  const analytics = useMemo(() => {
    const active = employees.filter((emp) => getStatusLabel(emp.status) === "Active").length;
    const inactive = employees.filter((emp) => getStatusLabel(emp.status) === "Inactive").length;
    const managers = employees.filter((emp) =>
      ["Admin", "Operational Manager", "Branch Manager"].includes(emp.role)
    ).length;
    const totalSalary = employees.reduce(
      (sum, emp) => sum + Number(emp.salary || 0),
      0
    );

    return {
      total: employees.length,
      active,
      inactive,
      managers,
      totalSalary,
    };
  }, [employees]);

  const departmentStats = departments
    .filter((dept) => dept !== "All")
    .map((dept) => ({
      department: dept,
      count: employees.filter((emp) => emp.department === dept).length,
    }))
    .filter((dept) => dept.count > 0 || employees.length === 0);

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const query = searchQuery.toLowerCase();

      const matchesSearch =
        emp.name?.toLowerCase().includes(query) ||
        emp.employeeId?.toLowerCase().includes(query) ||
        emp.designation?.toLowerCase().includes(query) ||
        emp.role?.toLowerCase().includes(query) ||
        emp.email?.toLowerCase().includes(query) ||
        emp.phone?.toLowerCase().includes(query);

      const matchesDepartment =
        selectedDepartment === "All" || emp.department === selectedDepartment;

      const matchesBranch =
        selectedBranchFilter === "All" || emp.branchId === selectedBranchFilter;

      const matchesStatus =
        selectedStatusFilter === "All" || getStatusLabel(emp.status) === selectedStatusFilter;

      return matchesSearch && matchesDepartment && matchesBranch && matchesStatus;
    });
  }, [
    employees,
    searchQuery,
    selectedDepartment,
    selectedBranchFilter,
    selectedStatusFilter,
  ]);

  const validateForm = (isEdit: boolean) => {
    if (
      !formData.name.trim() ||
      !formData.role ||
      !formData.department ||
      !formData.designation.trim() ||
      !formData.phone.trim() ||
      !formData.email.trim() ||
      !formData.branchId
    ) {
      toast({
        title: "Missing Details",
        description:
          "Please fill name, role, department, designation, phone, email and branch.",
        variant: "destructive",
      });
      return false;
    }

    if (!isEdit && formData.password.trim().length < 6) {
      toast({
        title: "Invalid Password",
        description: "Password must be at least 6 characters.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const buildPayload = (isEdit: boolean) => {
    const payload: any = {
      employeeId: formData.employeeId.trim(),
      name: formData.name.trim(),
      role: formData.role,
      department: formData.department,
      designation: formData.designation.trim(),
      phone: formData.phone.trim(),
      alternatePhone: formData.alternatePhone.trim(),
      email: formData.email.trim().toLowerCase(),
      address: formData.address.trim(),
      city: formData.city.trim(),
      state: formData.state.trim(),
      salary: Number(formData.salary) || 0,
      dateOfJoining: formData.dateOfJoining,
      dateOfBirth: formData.dateOfBirth || null,
      status: formData.status,
      branchId: formData.branchId,
      skills: formData.skillsText
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean),
      notes: formData.notes.trim(),
      documents: formData.documents,
      emergencyContact: formData.emergencyContact,
      bankDetails: formData.bankDetails,
    };

    if (!isEdit) {
      payload.password = formData.password;
    }

    return payload;
  };

  const handleAddEmployee = async () => {
    if (!validateForm(false)) return;

    try {
      setSubmitting(true);

      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(buildPayload(false)),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to register user");
      }

      toast({
        title: "Employee Registered",
        description: `${formData.name} added successfully.`,
      });

      setShowAddModal(false);
      setFormData(emptyEmployee);
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Save Failed",
        description: error.message || "Could not save employee.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditEmployee = async () => {
    if (!editingEmployee) return;
    if (!validateForm(true)) return;

    try {
      setSubmitting(true);

      const res = await fetch(`${API_URL}/users/${editingEmployee._id}`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(buildPayload(true)),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to update employee");
      }

      toast({
        title: "Employee Updated",
        description: `${formData.name} updated successfully.`,
      });

      setShowEditModal(false);
      setEditingEmployee(null);
      setFormData(emptyEmployee);
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message || "Could not update employee.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete employee "${name}"?`)) return;

    try {
      setDeletingId(id);

      const res = await fetch(`${API_URL}/users/${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to delete employee");
      }

      toast({
        title: "Employee Deleted",
        description: `${name} removed successfully.`,
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Delete Failed",
        description: error.message || "Could not delete employee.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const openEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormData({
      employeeId: emp.employeeId || "",
      name: emp.name || "",
      role: emp.role || "",
      department: emp.department || "Sales",
      designation: emp.designation || emp.role || "",
      phone: emp.phone || "",
      alternatePhone: emp.alternatePhone || "",
      email: emp.email || "",
      password: "",
      address: emp.address || "",
      city: emp.city || "",
      state: emp.state || "",
      salary: emp.salary || 0,
      dateOfJoining:
        formatDateInput(emp.dateOfJoining) ||
        new Date().toISOString().split("T")[0],
      dateOfBirth: formatDateInput(emp.dateOfBirth),
      status: getStatusLabel(emp.status),
      branchId: emp.branchId || "",
      skillsText: Array.isArray(emp.skills) ? emp.skills.join(", ") : "",
      notes: emp.notes || "",
      documents: emp.documents || [],
      emergencyContact: {
        name: emp.emergencyContact?.name || "",
        phone: emp.emergencyContact?.phone || "",
        relation: emp.emergencyContact?.relation || "",
      },
      bankDetails: {
        accountHolderName: emp.bankDetails?.accountHolderName || "",
        bankName: emp.bankDetails?.bankName || "",
        accountNumber: emp.bankDetails?.accountNumber || "",
        ifscCode: emp.bankDetails?.ifscCode || "",
        upiId: emp.bankDetails?.upiId || "",
      },
    });
    setShowEditModal(true);
  };

  const closeModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setEditingEmployee(null);
    setFormData(emptyEmployee);
  };

  const fileToDocument = (file: File): Promise<EmployeeDocument> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        resolve({
          fileName: file.name,
          fileUrl: String(reader.result || ""),
          fileType: file.type || "file",
          uploadedAt: new Date().toISOString(),
          isLocal: true,
        });
      };

      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleDocumentUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    try {
      const docs = await Promise.all(Array.from(files).map(fileToDocument));
      setFormData((prev) => ({
        ...prev,
        documents: [...prev.documents, ...docs],
      }));

      toast({
        title: "Documents Added",
        description: `${docs.length} document(s) added.`,
      });
    } catch {
      toast({
        title: "Upload Failed",
        description: "Unable to read selected documents.",
        variant: "destructive",
      });
    }
  };

  const renderForm = (isEdit: boolean) => (
    <div className="space-y-5 max-h-[75vh] overflow-y-auto pr-1">
      <div className="rounded-2xl border border-border bg-muted/30 p-4">
        <div className="mb-3 flex items-center gap-2 font-semibold">
          <UserRound className="h-4 w-4" /> Basic Employee Details
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            value={formData.employeeId}
            onChange={(e) =>
              setFormData({ ...formData, employeeId: e.target.value })
            }
            placeholder="Employee ID e.g. DIGI-EMP-001"
          />

          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Full name *"
          />

          <Input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="Email *"
          />

          <Input
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="Phone *"
          />

          <Input
            value={formData.alternatePhone}
            onChange={(e) =>
              setFormData({ ...formData, alternatePhone: e.target.value })
            }
            placeholder="Alternate phone"
          />

          <Input
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) =>
              setFormData({ ...formData, dateOfBirth: e.target.value })
            }
            placeholder="Date of birth"
          />
        </div>

        {!isEdit && (
          <div className="mt-4">
            <Input
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              placeholder="Login password *"
            />
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-muted/30 p-4">
        <div className="mb-3 flex items-center gap-2 font-semibold">
          <Shield className="h-4 w-4" /> Role, Branch & Access
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            value={formData.role}
            onValueChange={(v) => setFormData({ ...formData, role: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select role *" />
            </SelectTrigger>
            <SelectContent>
              {roles.map((role) => (
                <SelectItem key={role} value={role}>
                  {role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={formData.department}
            onValueChange={(v) => setFormData({ ...formData, department: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Department *" />
            </SelectTrigger>
            <SelectContent>
              {departments
                .filter((department) => department !== "All")
                .map((department) => (
                  <SelectItem key={department} value={department}>
                    {department}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>

          <Select
            value={formData.designation}
            onValueChange={(v) => setFormData({ ...formData, designation: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Designation *" />
            </SelectTrigger>
            <SelectContent>
              {designations.map((designation) => (
                <SelectItem key={designation} value={designation}>
                  {designation}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {branchesLoading ? (
            <div className="px-3 py-2 border rounded-md bg-muted text-muted-foreground flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading branches...
            </div>
          ) : (
            <Select
              value={formData.branchId}
              onValueChange={(v) => setFormData({ ...formData, branchId: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select branch *" />
              </SelectTrigger>
              <SelectContent>
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.branchId}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select
            value={formData.status}
            onValueChange={(v) =>
              setFormData({ ...formData, status: v as EmployeeStatus })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-muted/30 p-4">
        <div className="mb-3 flex items-center gap-2 font-semibold">
          <BriefcaseBusiness className="h-4 w-4" /> Employment Details
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            type="number"
            value={formData.salary || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                salary: Number(e.target.value) || 0,
              })
            }
            placeholder="Monthly salary"
          />

          <Input
            type="date"
            value={formData.dateOfJoining}
            onChange={(e) =>
              setFormData({ ...formData, dateOfJoining: e.target.value })
            }
          />

          <Input
            value={formData.skillsText}
            onChange={(e) =>
              setFormData({ ...formData, skillsText: e.target.value })
            }
            placeholder="Skills e.g. React, Node, SEO"
            className="md:col-span-2"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-muted/30 p-4">
        <div className="mb-3 flex items-center gap-2 font-semibold">
          <MapPin className="h-4 w-4" /> Address
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            placeholder="City"
          />

          <Input
            value={formData.state}
            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            placeholder="State"
          />

          <Textarea
            value={formData.address}
            onChange={(e) =>
              setFormData({ ...formData, address: e.target.value })
            }
            placeholder="Full address"
            className="md:col-span-2"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-muted/30 p-4">
        <div className="mb-3 flex items-center gap-2 font-semibold">
          <Phone className="h-4 w-4" /> Emergency Contact
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            value={formData.emergencyContact.name}
            onChange={(e) =>
              setFormData({
                ...formData,
                emergencyContact: {
                  ...formData.emergencyContact,
                  name: e.target.value,
                },
              })
            }
            placeholder="Name"
          />

          <Input
            value={formData.emergencyContact.phone}
            onChange={(e) =>
              setFormData({
                ...formData,
                emergencyContact: {
                  ...formData.emergencyContact,
                  phone: e.target.value,
                },
              })
            }
            placeholder="Phone"
          />

          <Input
            value={formData.emergencyContact.relation}
            onChange={(e) =>
              setFormData({
                ...formData,
                emergencyContact: {
                  ...formData.emergencyContact,
                  relation: e.target.value,
                },
              })
            }
            placeholder="Relation"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-muted/30 p-4">
        <div className="mb-3 flex items-center gap-2 font-semibold">
          <IndianRupee className="h-4 w-4" /> Bank / Payment Details
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            value={formData.bankDetails.accountHolderName}
            onChange={(e) =>
              setFormData({
                ...formData,
                bankDetails: {
                  ...formData.bankDetails,
                  accountHolderName: e.target.value,
                },
              })
            }
            placeholder="Account holder name"
          />

          <Input
            value={formData.bankDetails.bankName}
            onChange={(e) =>
              setFormData({
                ...formData,
                bankDetails: {
                  ...formData.bankDetails,
                  bankName: e.target.value,
                },
              })
            }
            placeholder="Bank name"
          />

          <Input
            value={formData.bankDetails.accountNumber}
            onChange={(e) =>
              setFormData({
                ...formData,
                bankDetails: {
                  ...formData.bankDetails,
                  accountNumber: e.target.value,
                },
              })
            }
            placeholder="Account number"
          />

          <Input
            value={formData.bankDetails.ifscCode}
            onChange={(e) =>
              setFormData({
                ...formData,
                bankDetails: {
                  ...formData.bankDetails,
                  ifscCode: e.target.value.toUpperCase(),
                },
              })
            }
            placeholder="IFSC code"
          />

          <Input
            value={formData.bankDetails.upiId}
            onChange={(e) =>
              setFormData({
                ...formData,
                bankDetails: {
                  ...formData.bankDetails,
                  upiId: e.target.value,
                },
              })
            }
            placeholder="UPI ID"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-4">
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <FileText className="h-4 w-4" /> Employee Documents
          </div>

          <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border bg-background px-3 py-2 text-sm font-medium hover:bg-muted">
            <UploadCloud className="h-4 w-4" />
            Upload Documents
            <input
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                handleDocumentUpload(e.target.files);
                e.currentTarget.value = "";
              }}
            />
          </label>
        </div>

        <div className="space-y-2">
          {formData.documents.length === 0 && (
            <div className="rounded-xl border border-dashed p-4 text-center text-sm text-muted-foreground">
              No documents added
            </div>
          )}

          {formData.documents.map((document, index) => (
            <div
              key={index}
              className="grid grid-cols-1 gap-2 rounded-xl border bg-background p-3 md:grid-cols-[1fr_1fr_auto]"
            >
              <Input
                value={document.fileName}
                onChange={(e) => {
                  const next = [...formData.documents];
                  next[index] = { ...next[index], fileName: e.target.value };
                  setFormData({ ...formData, documents: next });
                }}
                placeholder="Document name"
              />

              <Input
                value={
                  document.fileUrl?.startsWith("data:")
                    ? "Uploaded document ready"
                    : document.fileUrl
                }
                disabled={document.fileUrl?.startsWith("data:")}
                onChange={(e) => {
                  const next = [...formData.documents];
                  next[index] = {
                    ...next[index],
                    fileUrl: e.target.value,
                    isLocal: false,
                  };
                  setFormData({ ...formData, documents: next });
                }}
                placeholder="Document URL"
              />

              <div className="flex gap-2">
                {document.fileUrl && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => window.open(document.fileUrl, "_blank")}
                  >
                    Open
                  </Button>
                )}

                <Button
                  type="button"
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      documents: formData.documents.filter((_, i) => i !== index),
                    })
                  }
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() =>
            setFormData({
              ...formData,
              documents: [
                ...formData.documents,
                { fileName: "", fileUrl: "", fileType: "" },
              ],
            })
          }
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Document Link
        </Button>
      </div>

      <div>
        <label className="text-sm font-medium mb-1 block">Internal Notes</label>
        <Textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="HR notes, performance notes, responsibilities"
        />
      </div>

      <div className="flex flex-col-reverse gap-2 pt-4 sm:flex-row">
        <Button
          variant="outline"
          disabled={submitting}
          onClick={closeModals}
          className="flex-1"
        >
          Cancel
        </Button>

        <Button
          variant="gradient"
          disabled={submitting || branches.length === 0}
          onClick={isEdit ? handleEditEmployee : handleAddEmployee}
          className="flex-1"
        >
          {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {submitting
            ? isEdit
              ? "Updating..."
              : "Saving..."
            : isEdit
              ? "Update Employee"
              : "Register Employee"}
        </Button>
      </div>
    </div>
  );

  const StatCard = ({ title, value, icon: Icon, className }: any) => (
    <div className={`rounded-2xl border bg-card p-4 shadow-card ${className || ""}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-2xl font-heading font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{title}</p>
        </div>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">
            Employees
          </h1>
          <p className="text-muted-foreground">
            Manage employees, roles, branch access, documents and internal profile details
          </p>
        </div>

        <Button
          variant="gradient"
          onClick={() => {
            setFormData(emptyEmployee);
            setShowAddModal(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Register Employee
        </Button>
      </motion.div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard title="Total Employees" value={analytics.total} icon={UserRound} />
        <StatCard title="Active" value={analytics.active} icon={Activity} />
        <StatCard title="Inactive" value={analytics.inactive} icon={Shield} />
        <StatCard title="Managers/Admins" value={analytics.managers} icon={Award} />
        <StatCard
          title="Monthly Payroll"
          value={formatSalary(analytics.totalSalary)}
          icon={IndianRupee}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-6">
        {departmentStats.map((dept) => (
          <button
            key={dept.department}
            onClick={() => setSelectedDepartment(dept.department)}
            className={`rounded-xl border p-4 text-left transition-all ${selectedDepartment === dept.department
                ? "bg-primary text-primary-foreground border-primary shadow-md"
                : "bg-card border-border hover:border-primary/50"
              }`}
          >
            <p className="text-2xl font-heading font-bold">{dept.count}</p>
            <p
              className={`text-sm ${selectedDepartment === dept.department
                  ? "text-primary-foreground/80"
                  : "text-muted-foreground"
                }`}
            >
              {dept.department}
            </p>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4 xl:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, employee ID, role, email, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select
          value={selectedBranchFilter}
          onValueChange={setSelectedBranchFilter}
        >
          <SelectTrigger className="w-full xl:w-[190px]">
            <SelectValue placeholder="Branch" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Branches</SelectItem>
            {branches.map((branch) => (
              <SelectItem key={branch.id} value={branch.branchId}>
                {branch.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={selectedStatusFilter}
          onValueChange={setSelectedStatusFilter}
        >
          <SelectTrigger className="w-full xl:w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          onClick={() => {
            setSelectedDepartment("All");
            setSelectedBranchFilter("All");
            setSelectedStatusFilter("All");
            setSearchQuery("");
          }}
        >
          <Filter className="w-4 h-4 mr-2" />
          Reset
        </Button>
      </div>

      {loading || branchesLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="rounded-2xl border bg-card py-16 text-center text-muted-foreground">
          No employees found
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
        >
          {filteredEmployees.map((employee, index) => (
            <motion.div
              key={employee._id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04 }}
              className="group rounded-2xl border border-border bg-card p-5 shadow-card transition-all hover:shadow-card-hover"
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-accent/20 text-lg font-bold text-primary">
                    {employee.name?.charAt(0) || "E"}
                  </div>

                  <div>
                    <h3 className="font-semibold text-foreground">
                      {employee.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {employee.designation || employee.role}
                    </p>
                  </div>
                </div>

                <Badge
                  variant={getStatusLabel(employee.status) === "Active" ? "success" : "secondary"}
                >
                  {getStatusLabel(employee.status)}
                </Badge>
              </div>

              <div className="mb-4 flex flex-wrap gap-2">
                {employee.employeeId && (
                  <Badge variant="outline">
                    <IdCard className="mr-1 h-3 w-3" />
                    {employee.employeeId}
                  </Badge>
                )}
                <Badge variant="secondary">{employee.role}</Badge>
                <Badge variant="secondary">{employee.department}</Badge>
              </div>

              <div className="mb-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Building2 className="w-4 h-4" />
                  <span>{branchName(employee.branchId)}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  <span>{employee.phone || "N/A"}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  <span className="truncate">{employee.email || "N/A"}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarDays className="w-4 h-4" />
                  <span>
                    Joined:{" "}
                    {employee.dateOfJoining
                      ? new Date(employee.dateOfJoining).toLocaleDateString("en-IN")
                      : "N/A"}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-border pt-4">
                <div>
                  <p className="text-xs text-muted-foreground">Monthly Salary</p>
                  <p className="font-semibold text-foreground">
                    {formatSalary(employee.salary)}
                  </p>
                </div>

                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedEmployee(employee._id)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditModal(employee)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    disabled={deletingId === employee._id}
                    onClick={() => handleDelete(employee._id, employee.name)}
                    className="text-destructive hover:text-destructive"
                  >
                    {deletingId === employee._id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      <Dialog open={!!selectedEmployee} onOpenChange={() => setSelectedEmployee(null)}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Employee Profile</DialogTitle>
          </DialogHeader>

          {selectedEmpData && (
            <div className="space-y-6">
              <div className="rounded-2xl border bg-muted/30 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-accent/20 text-2xl font-bold text-primary">
                    {selectedEmpData.name?.charAt(0) || "E"}
                  </div>

                  <div className="flex-1">
                    <h2 className="text-xl font-heading font-bold">
                      {selectedEmpData.name}
                    </h2>
                    <p className="text-muted-foreground">
                      {selectedEmpData.designation || selectedEmpData.role} •{" "}
                      {selectedEmpData.department}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge
                        variant={
                          getStatusLabel(selectedEmpData.status) === "Active"
                            ? "success"
                            : "secondary"
                        }
                      >
                        {getStatusLabel(selectedEmpData.status)}
                      </Badge>
                      <Badge variant="outline">
                        {selectedEmpData.employeeId || "No Employee ID"}
                      </Badge>
                      <Badge variant="secondary">
                        {branchName(selectedEmpData.branchId)}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl bg-muted/50 p-4">
                  <p className="text-sm text-muted-foreground">Role</p>
                  <p className="text-lg font-bold">{selectedEmpData.role}</p>
                </div>

                <div className="rounded-xl bg-muted/50 p-4">
                  <p className="text-sm text-muted-foreground">Monthly Salary</p>
                  <p className="text-lg font-bold">
                    {formatSalary(selectedEmpData.salary)}
                  </p>
                </div>

                <div className="rounded-xl bg-muted/50 p-4">
                  <p className="text-sm text-muted-foreground">Joined On</p>
                  <p className="text-lg font-bold">
                    {selectedEmpData.dateOfJoining
                      ? new Date(selectedEmpData.dateOfJoining).toLocaleDateString(
                        "en-IN"
                      )
                      : "N/A"}
                  </p>
                </div>

                <div className="rounded-xl bg-muted/50 p-4">
                  <p className="text-sm text-muted-foreground">Documents</p>
                  <p className="text-lg font-bold">
                    {selectedEmpData.documents?.length || 0}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border p-4">
                  <h4 className="mb-3 font-semibold">Contact Information</h4>
                  <div className="space-y-2 text-sm">
                    <p className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      {selectedEmpData.phone || "N/A"}
                    </p>
                    <p className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      {selectedEmpData.email || "N/A"}
                    </p>
                    <p className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      {[selectedEmpData.address, selectedEmpData.city, selectedEmpData.state]
                        .filter(Boolean)
                        .join(", ") || "N/A"}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border p-4">
                  <h4 className="mb-3 font-semibold">Emergency Contact</h4>
                  <div className="space-y-2 text-sm">
                    <p>
                      <b>Name:</b> {selectedEmpData.emergencyContact?.name || "N/A"}
                    </p>
                    <p>
                      <b>Phone:</b>{" "}
                      {selectedEmpData.emergencyContact?.phone || "N/A"}
                    </p>
                    <p>
                      <b>Relation:</b>{" "}
                      {selectedEmpData.emergencyContact?.relation || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border p-4">
                  <h4 className="mb-3 font-semibold">Employment Information</h4>
                  <div className="space-y-2 text-sm">
                    <p><b>Employee ID:</b> {selectedEmpData.employeeId || "N/A"}</p>
                    <p><b>Designation:</b> {selectedEmpData.designation || "N/A"}</p>
                    <p><b>Department:</b> {selectedEmpData.department || "N/A"}</p>
                    <p><b>Branch:</b> {branchName(selectedEmpData.branchId)}</p>
                    <p><b>Status:</b> {getStatusLabel(selectedEmpData.status)}</p>
                  </div>
                </div>

                <div className="rounded-2xl border p-4">
                  <h4 className="mb-3 font-semibold">Bank / Payment Details</h4>
                  <div className="space-y-2 text-sm">
                    <p><b>Account Holder:</b> {selectedEmpData.bankDetails?.accountHolderName || "N/A"}</p>
                    <p><b>Bank:</b> {selectedEmpData.bankDetails?.bankName || "N/A"}</p>
                    <p><b>Account No:</b> {selectedEmpData.bankDetails?.accountNumber || "N/A"}</p>
                    <p><b>IFSC:</b> {selectedEmpData.bankDetails?.ifscCode || "N/A"}</p>
                    <p><b>UPI:</b> {selectedEmpData.bankDetails?.upiId || "N/A"}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border p-4">
                <h4 className="mb-3 font-semibold">Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {(selectedEmpData.skills || []).length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No skills added
                    </p>
                  )}
                  {(selectedEmpData.skills || []).map((skill) => (
                    <Badge key={skill} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border p-4">
                <h4 className="mb-3 font-semibold">Documents</h4>
                <div className="space-y-2">
                  {(selectedEmpData.documents || []).length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No documents uploaded
                    </p>
                  )}

                  {(selectedEmpData.documents || []).map((document, index) => (
                    <div
                      key={index}
                      className="flex flex-col gap-2 rounded-xl bg-muted/40 p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-medium">
                          {document.fileName || "Document"}
                        </p>
                        <p className="text-xs text-muted-foreground break-all">
                          {document.fileUrl}
                        </p>
                      </div>

                      {document.fileUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(document.fileUrl, "_blank")}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Open
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {selectedEmpData.notes && (
                <div className="rounded-2xl border p-4">
                  <h4 className="mb-3 font-semibold">Internal Notes</h4>
                  <p className="whitespace-pre-line text-sm text-muted-foreground">
                    {selectedEmpData.notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="w-[95vw] max-w-5xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Register New Employee</DialogTitle>
          </DialogHeader>
          {renderForm(false)}
        </DialogContent>
      </Dialog>

      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="w-[95vw] max-w-5xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
          </DialogHeader>
          {renderForm(true)}
        </DialogContent>
      </Dialog>
    </div>
  );
}
