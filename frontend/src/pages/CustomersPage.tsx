import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Briefcase,
  Building2,
  Calendar,
  ChevronRight,
  ClipboardList,
  Download,
  Edit3,
  Eye,
  FileText,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  MapPin,
  MessageSquare,
  Package,
  Phone,
  Plus,
  RefreshCcw,
  Search,
  ShieldCheck,
  UploadCloud,
  User,
  WalletCards,
  Sparkles,
  Share2,
  CheckCircle2,
  Globe,
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import { getCustomerReadiness, getContextPreview, updateCustomer } from "../api/customerApi";
import { authHeaders, jsonHeaders, getToken } from "@/api/auth";

const API_URL = import.meta.env.VITE_API_URL || "https://server.digitalness.co.in/api";

const DIGITALNESS_DETAILS = {
  companyName: "Digitalness",
  tagline: "Designed and Developed by Digitalness",
  email: "info@digitalness.co.in",
  phone: "+91 96039 60381",
  website: "https://digitalness.co.in",
  address: "Hyderabad, Telangana, India",
};


const requirementOptions = [
  "Digital Marketing",
  "Website Design",
  "App Development",
  "Model Video",
  "Promotion Video",
  "CRM",
  "SEO",
  "Other",
];

interface Employee {
  _id: string;
  id?: string;
  name: string;
  fullName?: string;
  username?: string;
  email?: string;
  phone?: string;
  role: string;
  department: string;
  branchId?: string;
  status?: string;
}

interface ClientLogin {
  _id: string;
  name?: string;
  email: string;
  phone?: string;
  businessType?: string;
  branchId?: string;
  status?: string;
  customerId?: string;
}

interface CustomerDocument {
  name?: string;
  fileName?: string;
  url?: string;
  fileUrl?: string;
  type?: string;
  fileType?: string;
  size?: number;
  uploadedAt?: string;
}

interface ActivityLog {
  title?: string;
  message?: string;
  type?: string;
  createdBy?: any;
  createdAt?: string;
}

interface CommunicationLog {
  type?: string;
  subject?: string;
  message?: string;
  createdBy?: any;
  createdAt?: string;
}

interface ReportContent {
  reportTitle?: string;
  reportType?: string;
  reportSummary?: string;
  servicesSummary?: string;
  projectSummary?: string;
  paymentSummary?: string;
  workSummary?: string;
  notesForReport?: string;
  companyDetails?: typeof DIGITALNESS_DETAILS;
}

interface Customer {
  _id: string;
  name: string;
  companyName?: string;
  panNumber?: string;
  gstNumber?: string;
  businessType: string;
  contactNumbers?: string[];
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  branchId?: string;
  branch?: string;
  assignedTo?: Employee | string | null;
  assignedManager?: Employee | string | null;
  userId?: ClientLogin | string | null;
  requirements?: string[];
  package?: string;
  notes?: string;
  documents?: CustomerDocument[];
  supportingDocuments?: CustomerDocument[];
  activityLogs?: ActivityLog[];
  communications?: CommunicationLog[];
  reportContent?: ReportContent;
  totalPaid?: number;
  totalPending?: number;
  status?: "Active" | "Inactive" | string;
  createdAt?: string;
  updatedAt?: string;
}

interface Work {
  _id: string;
  title: string;
  workType?: string;
  type?: string;
  description?: string;
  status?: string;
  priority?: string;
  assignedTo?: any;
  dueDate?: string;
  customer?: string | { _id?: string; id?: string };
  customerId?: string;
  createdAt?: string;
  updates?: any[];
}

interface Branch {
  _id?: string;
  id?: string;
  branchId?: string;
  name: string;
  city?: string;
}

type CustomerFormState = {
  name: string;
  companyName: string;
  panNumber: string;
  gstNumber: string;
  businessType: string;
  contactNumber: string;
  email: string;
  address: string;
  city: string;
  state: string;
  branchId: string;
  assignedDepartment: string;
  assignedRole: string;
  assignedTo: string;
  assignedManager: string;
  package: string;
  notes: string;
  status: string;
  requirements: string[];
};

const emptyCustomer: CustomerFormState = {
  name: "",
  companyName: "",
  panNumber: "",
  gstNumber: "",
  businessType: "",
  contactNumber: "",
  email: "",
  address: "",
  city: "",
  state: "",
  branchId: "",
  assignedDepartment: "",
  assignedRole: "",
  assignedTo: "",
  assignedManager: "",
  package: "",
  notes: "",
  status: "Active",
  requirements: [],
};

const statusVariant: Record<string, any> = {
  Pending: "secondary",
  "Not Started": "secondary",
  "In Progress": "default",
  Review: "outline",
  Completed: "default",
  Revision: "destructive",
  Failed: "destructive",
};

const priorityVariant: Record<string, any> = {
  Low: "secondary",
  Medium: "outline",
  High: "destructive",
  Urgent: "destructive",
};

const fallbackBranches: Branch[] = [
  { branchId: "BR001", id: "BR001", name: "Hyderabad" },
  { branchId: "BR002", id: "BR002", name: "Bangalore" },
  { branchId: "BR003", id: "BR003", name: "Chennai" },
];

const normalizeStatus = (status?: string) => String(status || "").toLowerCase();
const getBranchValue = (branch: Branch) => branch.branchId || branch.id || branch._id || "";
const getBranchLabel = (branch: Branch) => branch.name || branch.city || branch.branchId || branch.id || branch._id || "Branch";

const normalizePhoneForWhatsApp = (phone?: string) => {
  const cleaned = String(phone || "").replace(/\D/g, "");
  if (!cleaned) return "";
  if (cleaned.startsWith("91") && cleaned.length === 12) return cleaned;
  if (cleaned.length === 10) return `91${cleaned}`;
  return cleaned;
};

const getIdFromRef = (value: any) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value._id || value.id || "";
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [works, setWorks] = useState<Work[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [newCust, setNewCust] = useState<CustomerFormState>(emptyCustomer);
  const [supportingDocs, setSupportingDocs] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [branchesLoading, setBranchesLoading] = useState(true);
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [clientLoginLoading, setClientLoginLoading] = useState(false);
  const [loginCustomer, setLoginCustomer] = useState<Customer | null>(null);
  const [clientEmail, setClientEmail] = useState("");
  const [clientPassword, setClientPassword] = useState("");
  const [needsPassword, setNeedsPassword] = useState(false);

  const { toast } = useToast();

  const getAuthConfig = () => ({ headers: authHeaders() });
  const getJsonConfig = () => ({ headers: jsonHeaders() });

  const getArrayData = (data: any): any[] => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data?.customers)) return data.customers;
    if (Array.isArray(data?.users)) return data.users;
    if (Array.isArray(data?.employees)) return data.employees;
    if (Array.isArray(data?.works)) return data.works;
    if (Array.isArray(data?.tasks)) return data.tasks;
    if (Array.isArray(data?.branches)) return data.branches;
    return [];
  };

  const safeJson = async (res: Response) => {
    const text = await res.text();
    try {
      return text ? JSON.parse(text) : {};
    } catch {
      return { message: text || "Invalid server response" };
    }
  };

  const fetchBranches = async () => {
    try {
      setBranchesLoading(true);
      const res = await fetch(`${API_URL}/branches`, getAuthConfig());
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.message || "Failed to fetch branches");
      const branchesData = getArrayData(data).map((branch: any) => ({
        _id: branch._id,
        id: branch.id || branch.branchId || branch._id,
        branchId: branch.branchId || branch.id,
        name: branch.name || branch.city || branch.branchId || "Branch",
        city: branch.city,
      }));
      setBranches(branchesData.length ? branchesData : fallbackBranches);
    } catch (error: any) {
      setBranches(fallbackBranches);
      toast({ title: "Branches fallback loaded", description: error.message || "Could not load branches from API", variant: "destructive" });
    } finally {
      setBranchesLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/customers`, getAuthConfig());
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.message || "Failed to fetch customers");
      setCustomers(getArrayData(data));
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Could not load customers", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch(`${API_URL}/users`, getAuthConfig());
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.message || "Failed to fetch employees");
      setEmployees(getArrayData(data));
    } catch (error) {
      console.log("Unable to fetch employees", error);
    }
  };

  const fetchWorks = async () => {
    try {
      const res = await fetch(`${API_URL}/works`, getAuthConfig());
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.message || "Failed to fetch works");
      setWorks(getArrayData(data));
    } catch (error) {
      console.log("Unable to fetch works", error);
    }
  };

  const refreshAll = async () => {
    await Promise.all([fetchBranches(), fetchCustomers(), fetchEmployees(), fetchWorks()]);
  };

  useEffect(() => {
    refreshAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getWorkCustomerId = (work: Work): string | null => {
    if (work.customerId) return work.customerId;
    if (!work.customer) return null;
    if (typeof work.customer === "string") return work.customer;
    return work.customer._id || work.customer.id || null;
  };

  const getCustomerWorks = (customerId: string) => works.filter((work) => getWorkCustomerId(work) === customerId);

  const getAssignedUsers = (assignedTo: any) => {
    if (!assignedTo) return [];
    const assignedArray = Array.isArray(assignedTo) ? assignedTo : [assignedTo];
    return assignedArray.filter(Boolean).map((user: any) => {
      if (typeof user === "object") {
        return { id: user._id || user.id, name: user.name || user.fullName || user.username || user.email || "Unassigned", email: user.email || "", role: user.role || user.department || "Employee" };
      }
      const found = employees.find((emp: any) => emp._id === user || emp.id === user);
      return { id: user, name: found?.name || found?.fullName || found?.username || found?.email || "Unassigned", email: found?.email || "", role: found?.role || found?.department || "Employee" };
    });
  };

  const branchName = (branchId?: string) => {
    if (!branchId) return "—";
    const found = branches.find((branch) => [branch.branchId, branch.id, branch._id].filter(Boolean).includes(branchId));
    return found ? getBranchLabel(found) : branchId;
  };

  const getAssignedName = (assignedTo?: Employee | string | null) => {
    if (!assignedTo) return "Unassigned";
    if (typeof assignedTo === "object") return assignedTo.name || assignedTo.fullName || assignedTo.username || assignedTo.email || "Unassigned";
    const found = employees.find((emp) => emp._id === assignedTo || emp.id === assignedTo);
    return found?.name || found?.fullName || found?.username || found?.email || "Unassigned";
  };

  const totalPaid = customers.reduce((sum, c) => sum + Number(c.totalPaid || 0), 0);
  const totalPending = customers.reduce((sum, c) => sum + Number(c.totalPending || 0), 0);
  const activeCustomers = customers.filter((c) => c.status !== "Inactive").length;
  const withLogin = customers.filter((c) => c.userId).length;

  const formatCurrency = (amount: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(amount || 0));

  const activeEmployees = employees.filter((emp) => {
    const status = normalizeStatus(emp.status || "active");
    return status === "active" || !emp.status;
  });

  const departments = [...new Set(activeEmployees.map((emp) => emp.department).filter(Boolean))];
  const rolesByDepartment = [...new Set(activeEmployees.filter((emp) => emp.department === newCust.assignedDepartment).map((emp) => emp.role).filter(Boolean))];
  const filteredEmployees = activeEmployees.filter((emp) => emp.department === newCust.assignedDepartment && emp.role === newCust.assignedRole && (!newCust.branchId || !emp.branchId || emp.branchId === newCust.branchId));

  const filteredCustomers = useMemo(() => {
    const search = searchQuery.trim().toLowerCase();
    if (!search) return customers;
    return customers.filter((customer) => {
      const customerWorks = getCustomerWorks(customer._id);
      const customerMatch =
        customer.name?.toLowerCase().includes(search) ||
        customer.companyName?.toLowerCase().includes(search) ||
        customer.panNumber?.toLowerCase().includes(search) ||
        customer.gstNumber?.toLowerCase().includes(search) ||
        customer.businessType?.toLowerCase().includes(search) ||
        customer.city?.toLowerCase().includes(search) ||
        customer.state?.toLowerCase().includes(search) ||
        customer.contactNumbers?.some((phone) => phone?.toLowerCase().includes(search)) ||
        customer.email?.toLowerCase().includes(search) ||
        customer.notes?.toLowerCase().includes(search) ||
        branchName(customer.branchId || customer.branch)?.toLowerCase().includes(search);
      const taskMatch = customerWorks.some((work) => {
        const assignedUsers = getAssignedUsers(work.assignedTo);
        return work.title?.toLowerCase().includes(search) || work.workType?.toLowerCase().includes(search) || work.type?.toLowerCase().includes(search) || work.status?.toLowerCase().includes(search) || assignedUsers.some((user) => user.name?.toLowerCase().includes(search));
      });
      return customerMatch || taskMatch;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customers, works, employees, branches, searchQuery]);

  const resetForm = () => {
    setNewCust(emptyCustomer);
    setSupportingDocs([]);
    setEditingCustomer(null);
  };

  const openAddCustomer = () => {
    resetForm();
    setShowCustomerModal(true);
  };

  const openEditCustomer = (customer: Customer) => {
    const assignedToId = getIdFromRef(customer.assignedTo);
    const assignedEmp = employees.find((emp) => emp._id === assignedToId || emp.id === assignedToId);
    setEditingCustomer(customer);
    setNewCust({
      name: customer.name || "",
      companyName: customer.companyName || "",
      panNumber: customer.panNumber || "",
      gstNumber: customer.gstNumber || "",
      businessType: customer.businessType || "",
      contactNumber: customer.contactNumbers?.[0] || "",
      email: customer.email || "",
      address: customer.address || "",
      city: customer.city || "",
      state: customer.state || "",
      branchId: customer.branchId || customer.branch || "",
      assignedDepartment: assignedEmp?.department || "",
      assignedRole: assignedEmp?.role || "",
      assignedTo: assignedToId,
      assignedManager: getIdFromRef(customer.assignedManager),
      package: customer.package || "",
      notes: customer.notes || "",
      status: customer.status || "Active",
      requirements: customer.requirements || [],
    });
    setSupportingDocs([]);
    setShowCustomerModal(true);
  };

  const closeCustomerModal = () => {
    if (savingCustomer) return;
    setShowCustomerModal(false);
    resetForm();
  };

  const handleSaveCustomer = async () => {
    if (!newCust.name.trim() || !newCust.contactNumber.trim() || !newCust.businessType.trim() || !newCust.branchId) {
      toast({ title: "Missing fields", description: "Name, contact number, business type and branch are required", variant: "destructive" });
      return;
    }

    try {
      setSavingCustomer(true);
      const existingDocs = editingCustomer?.supportingDocuments || editingCustomer?.documents || [];
      const uploadedDocs = supportingDocs.map((file) => ({ fileName: file.name, name: file.name, fileType: file.type, type: file.type, size: file.size, uploadedAt: new Date().toISOString() }));

      const payload = {
        name: newCust.name.trim(),
        companyName: newCust.companyName.trim(),
        panNumber: newCust.panNumber.trim().toUpperCase(),
        gstNumber: newCust.gstNumber.trim().toUpperCase(),
        businessType: newCust.businessType.trim(),
        contactNumbers: [newCust.contactNumber.trim()],
        email: newCust.email.trim(),
        address: newCust.address.trim(),
        city: newCust.city.trim(),
        state: newCust.state.trim(),
        branchId: newCust.branchId,
        assignedTo: newCust.assignedTo || null,
        assignedManager: newCust.assignedManager || newCust.assignedTo || null,
        requirements: newCust.requirements,
        package: newCust.package.trim(),
        notes: newCust.notes.trim(),
        supportingDocuments: [...existingDocs, ...uploadedDocs],
        documents: [...existingDocs, ...uploadedDocs],
        totalPaid: editingCustomer?.totalPaid || 0,
        totalPending: editingCustomer?.totalPending || 0,
        status: newCust.status || "Active",
      };

      const url = editingCustomer ? `${API_URL}/customers/${editingCustomer._id}` : `${API_URL}/customers`;
      const method = editingCustomer ? "PUT" : "POST";
      const res = await fetch(url, { method, ...getJsonConfig(), body: JSON.stringify(payload) });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.message || `Failed to ${editingCustomer ? "update" : "add"} customer`);

      toast({ title: editingCustomer ? "Customer Updated" : "Customer Added", description: `${newCust.name} saved successfully` });
      closeCustomerModal();
      await fetchCustomers();
      if (selectedCustomer?._id === editingCustomer?._id) setSelectedCustomer(data.data || null);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Could not save customer", variant: "destructive" });
    } finally {
      setSavingCustomer(false);
    }
  };

  const openClientLogin = (customer: Customer) => {
    setLoginCustomer(customer);
    setClientEmail(customer.email || (typeof customer.userId === "object" ? customer.userId?.email || "" : ""));
    setClientPassword("");
    setNeedsPassword(false);
  };

  const closeClientLogin = () => {
    if (clientLoginLoading) return;
    setLoginCustomer(null);
    setClientEmail("");
    setClientPassword("");
    setNeedsPassword(false);
  };

  const handleCreateClientLogin = async () => {
    if (!loginCustomer || !clientEmail.trim()) {
      toast({ title: "Email required", description: "Please enter client email", variant: "destructive" });
      return;
    }
    if (needsPassword && clientPassword.trim().length < 6) {
      toast({ title: "Password required", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    try {
      setClientLoginLoading(true);
      const res = await fetch(`${API_URL}/clients/create-login`, {
        method: "POST",
        ...getJsonConfig(),
        body: JSON.stringify({ customerId: loginCustomer._id, email: clientEmail.trim(), password: needsPassword ? clientPassword.trim() : undefined }),
      });
      const data = await safeJson(res);
      if (!res.ok) {
        if (data.needsPassword) {
          setNeedsPassword(true);
          toast({ title: "Password Required", description: "This client email is new. Create a password to continue." });
          return;
        }
        throw new Error(data.message || "Failed to create client login");
      }
      toast({ title: "Client Login Ready", description: data.message || "Login created/linked successfully" });
      closeClientLogin();
      await fetchCustomers();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Could not create client login", variant: "destructive" });
    } finally {
      setClientLoginLoading(false);
    }
  };


  const downloadAllCustomersReport = () => {
    const doc = new jsPDF("p", "mm", "a4");
    const generatedAt = new Date().toLocaleString("en-IN");
    const totalDocs = customers.reduce((sum, c) => sum + ((c.supportingDocuments || c.documents || []).length), 0);
    const totalWorks = customers.reduce((sum, c) => sum + getCustomerWorks(c._id).length, 0);

    doc.setFontSize(20);
    doc.text("Digitalness", 14, 16);
    doc.setFontSize(10);
    doc.text(DIGITALNESS_DETAILS.tagline, 14, 22);
    doc.text(`${DIGITALNESS_DETAILS.website} | ${DIGITALNESS_DETAILS.email} | ${DIGITALNESS_DETAILS.phone}`, 14, 28);
    doc.text(DIGITALNESS_DETAILS.address, 14, 34);

    doc.setFontSize(16);
    doc.text("All Customers Report", 14, 46);
    doc.setFontSize(10);
    doc.text(`Generated: ${generatedAt}`, 14, 52);

    autoTable(doc, {
      startY: 60,
      head: [["Summary", "Value"]],
      body: [
        ["Total Customers", String(customers.length)],
        ["Active Customers", String(activeCustomers)],
        ["Inactive Customers", String(customers.length - activeCustomers)],
        ["Client Logins", String(withLogin)],
        ["Total Works", String(totalWorks)],
        ["Total Documents", String(totalDocs)],
        ["Total Paid", formatCurrency(totalPaid)],
        ["Total Pending", formatCurrency(totalPending)],
      ],
    });

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [["Customer", "Company", "Phone", "Email", "Branch", "Status", "Paid", "Pending", "Works"]],
      body: customers.map((customer) => [
        customer.name || "—",
        customer.companyName || "—",
        customer.contactNumbers?.join(", ") || "—",
        customer.email || "—",
        branchName(customer.branchId || customer.branch),
        customer.status || "Active",
        formatCurrency(customer.totalPaid || 0),
        formatCurrency(customer.totalPending || 0),
        String(getCustomerWorks(customer._id).length),
      ]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fontStyle: "bold" },
    });

    customers.forEach((customer, index) => {
      if (index > 0 || ((doc as any).lastAutoTable?.finalY || 0) > 210) doc.addPage();
      const customerWorks = getCustomerWorks(customer._id);
      const docs = customer.supportingDocuments || customer.documents || [];
      const activities = customer.activityLogs || [];
      const communications = customer.communications || [];

      doc.setFontSize(15);
      doc.text(`Customer Details: ${customer.name}`, 14, 18);
      doc.setFontSize(9);
      doc.text(`Generated by ${DIGITALNESS_DETAILS.companyName} • ${generatedAt}`, 14, 24);

      autoTable(doc, {
        startY: 30,
        head: [["Field", "Details"]],
        body: [
          ["Customer Name", customer.name || "—"],
          ["Company Name", customer.companyName || "—"],
          ["Business Type", customer.businessType || "—"],
          ["PAN", customer.panNumber || "—"],
          ["GST", customer.gstNumber || "—"],
          ["Phone", customer.contactNumbers?.join(", ") || "—"],
          ["Email", customer.email || "—"],
          ["Address", [customer.address, customer.city, customer.state].filter(Boolean).join(", ") || "—"],
          ["Branch", branchName(customer.branchId || customer.branch)],
          ["Assigned To", getAssignedName(customer.assignedTo)],
          ["Package", customer.package || "—"],
          ["Services", customer.requirements?.join(", ") || "—"],
          ["Status", customer.status || "Active"],
          ["Paid", formatCurrency(customer.totalPaid || 0)],
          ["Pending", formatCurrency(customer.totalPending || 0)],
          ["Notes", customer.notes || "—"],
        ],
        styles: { fontSize: 8 },
      });

      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 8,
        head: [["Work", "Type", "Assigned", "Status", "Priority", "Due Date"]],
        body: customerWorks.length
          ? customerWorks.map((work: any) => [
            work.title || "—",
            work.workType || work.type || "General",
            getAssignedUsers(work.assignedTo).map((user: any) => `${user.name} (${user.role})`).join(", ") || "Unassigned",
            work.status || "Pending",
            work.priority || "Medium",
            work.dueDate ? new Date(work.dueDate).toLocaleDateString("en-IN") : "—",
          ])
          : [["No work history", "—", "—", "—", "—", "—"]],
        styles: { fontSize: 8 },
      });

      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 8,
        head: [["Documents", "Communications", "Activities"]],
        body: [[String(docs.length), String(communications.length), String(activities.length)]],
        styles: { fontSize: 8 },
      });
    });

    doc.save(`Digitalness_All_Customers_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const pageLoading = loading || branchesLoading;

  return (
    <div className="space-y-6 pb-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-foreground">Customers</h1>
          <p className="text-sm md:text-base text-muted-foreground">Manage client dashboard, documents, login credentials, communications, activities and work history.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={refreshAll} disabled={pageLoading}><RefreshCcw className={`w-4 h-4 mr-2 ${pageLoading ? "animate-spin" : ""}`} />Refresh</Button>
          <Button variant="outline" onClick={downloadAllCustomersReport} disabled={pageLoading || customers.length === 0}><Download className="w-4 h-4 mr-2" />All Customers Report</Button>
          <Button variant="gradient" onClick={openAddCustomer} disabled={pageLoading}>{pageLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}Add Customer</Button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <StatCard title="Total Customers" value={customers.length} icon={<User className="w-5 h-5" />} />
        <StatCard title="Active Customers" value={activeCustomers} icon={<ShieldCheck className="w-5 h-5" />} />
        <StatCard title="Client Logins" value={withLogin} icon={<KeyRound className="w-5 h-5" />} />
        <StatCard title="Total Paid" value={formatCurrency(totalPaid)} highlight />
        <StatCard title="Pending" value={formatCurrency(totalPending)} icon={<WalletCards className="w-5 h-5" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-3">
        <div className="relative w-full max-w-xl"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input placeholder="Search customer, PAN, GST, branch, tasks, employees..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} disabled={pageLoading} className="pl-10" /></div>
        <div className="rounded-lg border border-border bg-card px-4 py-2 text-sm text-muted-foreground">Showing <span className="font-semibold text-foreground">{filteredCustomers.length}</span> customers</div>
      </div>

      {pageLoading ? <CustomersLoadingSkeleton /> : filteredCustomers.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">No customers found</div>
      ) : (
        <motion.div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
          {filteredCustomers.map((customer, index) => {
            const customerWorks = getCustomerWorks(customer._id);
            const hasClientLogin = Boolean(customer.userId);
            const primaryPhone = customer.contactNumbers?.[0] || "—";
            const docsCount = (customer.supportingDocuments || customer.documents || []).length;
            return (
              <motion.div key={customer._id} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }} className="bg-card rounded-2xl border border-border shadow-card p-5 hover:shadow-card-hover transition-all group">
                <div className="flex items-start justify-between gap-3 mb-4">
                  {customer.brandProfile?.logoUrl ? (
                    <img src={customer.brandProfile.logoUrl} alt={customer.name} className="w-12 h-12 shrink-0 rounded-lg object-contain border border-border bg-white p-1" />
                  ) : (
                    <div className="w-12 h-12 shrink-0 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-lg">{customer.name?.charAt(0)?.toUpperCase() || "C"}</div>
                  )}
                  <div className="min-w-0"><h3 className="font-semibold text-foreground truncate">{customer.name}</h3><p className="text-sm text-muted-foreground truncate">{customer.companyName || customer.businessType || "Business"}</p></div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEditCustomer(customer)}><Edit3 className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedCustomer(customer)}><Eye className="w-4 h-4" /></Button>
                  </div>
                </div>

                <div className="space-y-2 mb-4 cursor-pointer" onClick={() => setSelectedCustomer(customer)}>
                  <InfoRow icon={<Phone className="w-4 h-4" />} text={primaryPhone} />
                  <InfoRow icon={<Mail className="w-4 h-4" />} text={customer.email || "No email"} />
                  <InfoRow icon={<MapPin className="w-4 h-4" />} text={[customer.city, customer.state].filter(Boolean).join(", ") || "—"} />
                  <InfoRow icon={<Building2 className="w-4 h-4" />} text={branchName(customer.branchId || customer.branch)} />
                  <InfoRow icon={<User className="w-4 h-4" />} text={getAssignedName(customer.assignedTo)} />
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <Badge variant={customer.status === "Inactive" ? "destructive" : "default"}>{customer.status || "Active"}</Badge>
                    <Badge variant="secondary">{customerWorks.length} Works</Badge>
                    <Badge variant="outline">{docsCount} Docs</Badge>
                    <Badge variant={hasClientLogin ? "default" : "outline"}>{hasClientLogin ? "Login Active" : "No Login"}</Badge>
                  </div>
                </div>

                <div className="pt-4 border-t border-border space-y-2">
                  {customerWorks.slice(0, 2).map((work) => <div key={work._id} className="rounded-lg bg-muted/40 p-2"><p className="text-sm font-medium line-clamp-1">{work.title}</p><p className="text-xs text-muted-foreground">{work.workType || work.type || "General"} • {work.status || "Pending"}</p></div>)}
                  {customerWorks.length > 2 && <p className="text-xs text-muted-foreground">+{customerWorks.length - 2} more works</p>}
                  {customerWorks.length === 0 && <p className="text-xs text-muted-foreground">No work history found</p>}
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <Button variant="outline" size="sm" onClick={() => window.location.href = `/customers/${customer._id}/onboarding`} className="text-indigo-600 border-indigo-200">
                      <Sparkles className="w-4 h-4 mr-1 text-indigo-600" /> Onboarding
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => openClientLogin(customer)}><KeyRound className="w-4 h-4 mr-1" />Login</Button>
                    <Button variant="outline" size="sm" onClick={() => openEditCustomer(customer)}><Edit3 className="w-4 h-4 mr-1" />Edit</Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      <CustomerProfileDialog customer={selectedCustomer} onClose={() => setSelectedCustomer(null)} onEdit={openEditCustomer} formatCurrency={formatCurrency} branchName={branchName} getAssignedName={getAssignedName} works={selectedCustomer ? getCustomerWorks(selectedCustomer._id) : []} getAssignedUsers={getAssignedUsers} openClientLogin={openClientLogin} />

      <CustomerFormDialog open={showCustomerModal} onClose={closeCustomerModal} editingCustomer={editingCustomer} newCust={newCust} setNewCust={setNewCust} supportingDocs={supportingDocs} setSupportingDocs={setSupportingDocs} branches={branches} branchesLoading={branchesLoading} savingCustomer={savingCustomer} departments={departments} rolesByDepartment={rolesByDepartment} filteredEmployees={filteredEmployees} handleSaveCustomer={handleSaveCustomer} />

      <Dialog open={!!loginCustomer} onOpenChange={closeClientLogin}>
        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader><DialogTitle>{loginCustomer?.userId ? "Manage Client Login" : "Create Client Login"}</DialogTitle></DialogHeader>
          {loginCustomer && <div className="space-y-4">
            <div className="rounded-lg bg-muted/50 p-3"><p className="font-semibold">{loginCustomer.name}</p><p className="text-sm text-muted-foreground">{loginCustomer.businessType} • {branchName(loginCustomer.branchId || loginCustomer.branch)}</p></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Login Status</p><p className="font-semibold">{loginCustomer.userId ? "Linked" : "Not Created"}</p></div>
              <div className="rounded-lg border p-3"><p className="text-xs text-muted-foreground">Email</p><p className="font-semibold truncate">{clientEmail || "Required"}</p></div>
            </div>
            <div><label className="text-sm font-medium mb-1 block">Client Email *</label><Input type="email" placeholder="client@example.com" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} disabled={clientLoginLoading} /></div>
            {needsPassword && <div><label className="text-sm font-medium mb-1 block">Create Password *</label><Input type="password" placeholder="Minimum 6 characters" value={clientPassword} onChange={(e) => setClientPassword(e.target.value)} disabled={clientLoginLoading} /><p className="text-xs text-muted-foreground mt-1">This email is not registered. Enter password to create new client login.</p></div>}
            <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground flex gap-2"><Lock className="w-4 h-4 shrink-0" />Use this section for customer password/email management. Backend password reset endpoint can be connected here later.</div>
            <div className="flex flex-col sm:flex-row gap-2"><Button variant="outline" className="flex-1" onClick={closeClientLogin} disabled={clientLoginLoading}>Cancel</Button><Button variant="gradient" className="flex-1" onClick={handleCreateClientLogin} disabled={clientLoginLoading}>{clientLoginLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}{clientLoginLoading ? "Processing..." : needsPassword ? "Create Login" : "Check / Link Login"}</Button></div>
          </div>}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CustomerFormDialog({ open, onClose, editingCustomer, newCust, setNewCust, supportingDocs, setSupportingDocs, branches, branchesLoading, savingCustomer, departments, rolesByDepartment, filteredEmployees, handleSaveCustomer }: any) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[96vw] max-w-5xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader><DialogTitle>{editingCustomer ? "Edit Customer / Add Missing Details" : "Add New Customer"}</DialogTitle></DialogHeader>
        <div className="space-y-6">
          <SectionTitle icon={<Building2 className="w-4 h-4" />} title="Basic & Business Information" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input placeholder="Customer Name *" value={newCust.name} onChange={(e) => setNewCust({ ...newCust, name: e.target.value })} />
            <Input placeholder="Company Name" value={newCust.companyName} onChange={(e) => setNewCust({ ...newCust, companyName: e.target.value })} />
            <Input placeholder="Business Type *" value={newCust.businessType} onChange={(e) => setNewCust({ ...newCust, businessType: e.target.value })} />
            <Select value={newCust.status} onValueChange={(value) => setNewCust({ ...newCust, status: value })}><SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="Active">Active</SelectItem><SelectItem value="Inactive">Inactive</SelectItem></SelectContent></Select>
            <Input placeholder="PAN Number" value={newCust.panNumber} onChange={(e) => setNewCust({ ...newCust, panNumber: e.target.value.toUpperCase() })} />
            <Input placeholder="GST Number" value={newCust.gstNumber} onChange={(e) => setNewCust({ ...newCust, gstNumber: e.target.value.toUpperCase() })} />
          </div>

          <SectionTitle icon={<Phone className="w-4 h-4" />} title="Contact & Address" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input placeholder="Contact Number *" value={newCust.contactNumber} onChange={(e) => setNewCust({ ...newCust, contactNumber: e.target.value })} />
            <Input type="email" placeholder="Email Address" value={newCust.email} onChange={(e) => setNewCust({ ...newCust, email: e.target.value })} />
            <Input placeholder="City" value={newCust.city} onChange={(e) => setNewCust({ ...newCust, city: e.target.value })} />
            <Input placeholder="State" value={newCust.state} onChange={(e) => setNewCust({ ...newCust, state: e.target.value })} />
            <Input className="md:col-span-2" placeholder="Full Address" value={newCust.address} onChange={(e) => setNewCust({ ...newCust, address: e.target.value })} />
          </div>

          <SectionTitle icon={<User className="w-4 h-4" />} title="Branch & Employee Assignment" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select value={newCust.branchId} disabled={branchesLoading || savingCustomer} onValueChange={(value) => setNewCust({ ...newCust, branchId: value, assignedDepartment: "", assignedRole: "", assignedTo: "" })}><SelectTrigger><SelectValue placeholder={branchesLoading ? "Loading branches..." : "Select Branch *"} /></SelectTrigger><SelectContent>{branches.map((branch: Branch) => { const value = getBranchValue(branch); return <SelectItem key={value} value={value}>{getBranchLabel(branch)}</SelectItem>; })}</SelectContent></Select>
            <Select value={newCust.assignedDepartment} onValueChange={(value) => setNewCust({ ...newCust, assignedDepartment: value, assignedRole: "", assignedTo: "" })}><SelectTrigger><SelectValue placeholder="Department" /></SelectTrigger><SelectContent>{departments.map((dept: string) => <SelectItem key={dept} value={dept}>{dept}</SelectItem>)}</SelectContent></Select>
            <Select value={newCust.assignedRole} disabled={!newCust.assignedDepartment} onValueChange={(value) => setNewCust({ ...newCust, assignedRole: value, assignedTo: "" })}><SelectTrigger><SelectValue placeholder="Role" /></SelectTrigger><SelectContent>{rolesByDepartment.map((role: string) => <SelectItem key={role} value={role}>{role}</SelectItem>)}</SelectContent></Select>
            <Select value={newCust.assignedTo} disabled={!newCust.assignedRole} onValueChange={(value) => setNewCust({ ...newCust, assignedTo: value })}><SelectTrigger><SelectValue placeholder="Employee" /></SelectTrigger><SelectContent>{filteredEmployees.length === 0 ? <div className="px-3 py-2 text-sm text-muted-foreground">No employee found</div> : filteredEmployees.map((emp: Employee) => <SelectItem key={emp._id} value={emp._id}>{emp.name}</SelectItem>)}</SelectContent></Select>
          </div>

          <SectionTitle icon={<Package className="w-4 h-4" />} title="Services, Package & Notes" />
          <Input placeholder="Package / Plan" value={newCust.package} onChange={(e) => setNewCust({ ...newCust, package: e.target.value })} />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {requirementOptions.map((req) => <div key={req} className="flex items-center gap-2 rounded-lg border p-2"><Checkbox id={`cust-${req}`} checked={newCust.requirements.includes(req)} onCheckedChange={(checked) => setNewCust({ ...newCust, requirements: checked ? [...newCust.requirements, req] : newCust.requirements.filter((item: string) => item !== req) })} /><label htmlFor={`cust-${req}`} className="text-sm cursor-pointer">{req}</label></div>)}
          </div>
          <textarea className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder="Internal notes / client requirements / communication summary" value={newCust.notes} onChange={(e) => setNewCust({ ...newCust, notes: e.target.value })} />

          <SectionTitle icon={<UploadCloud className="w-4 h-4" />} title="Supporting Documents" />
          <div className="rounded-xl border border-dashed border-border bg-muted/30 p-4">
            <Input type="file" multiple onChange={(e) => setSupportingDocs(Array.from(e.target.files || []))} />
            <p className="text-xs text-muted-foreground mt-2">Frontend stores file metadata now. For real uploads, connect backend multer/S3 and save fileUrl.</p>
            {supportingDocs.length > 0 && <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">{supportingDocs.map((file: File) => <div key={file.name} className="rounded-lg bg-background border p-2 text-sm flex items-center gap-2"><FileText className="w-4 h-4" /><span className="truncate">{file.name}</span></div>)}</div>}
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-2"><Button variant="outline" onClick={onClose} className="flex-1" disabled={savingCustomer}>Cancel</Button><Button variant="gradient" onClick={handleSaveCustomer} className="flex-1" disabled={savingCustomer}>{savingCustomer && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}{savingCustomer ? "Saving..." : editingCustomer ? "Update Customer" : "Save Customer"}</Button></div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CustomerProfileDialog({ customer, onClose, onEdit, formatCurrency, branchName, getAssignedName, works, getAssignedUsers, openClientLogin }: any) {
  if (!customer) return null;
  const primaryPhone = customer.contactNumbers?.[0] || "";
  const whatsappPhone = normalizePhoneForWhatsApp(primaryPhone);
  const documents = customer.supportingDocuments || customer.documents || [];
  const activities = customer.activityLogs || [];
  const completedWorks = works.filter((w: any) => w.status === "Completed").length;
  const activeWorks = works.filter((w: any) => w.status !== "Completed" && w.status !== "Failed").length;

  const downloadReport = () => {
    const doc = new jsPDF("p", "mm", "a4");
    const generatedAt = new Date().toLocaleString("en-IN");
    const communications = customer.communications || [];
    const reportContent = customer.reportContent || {};
    const company = reportContent.companyDetails || DIGITALNESS_DETAILS;

    doc.setFontSize(20);
    doc.text(company.companyName || DIGITALNESS_DETAILS.companyName, 14, 16);
    doc.setFontSize(10);
    doc.text(company.tagline || DIGITALNESS_DETAILS.tagline, 14, 22);
    doc.text(`${company.website || DIGITALNESS_DETAILS.website} | ${company.email || DIGITALNESS_DETAILS.email} | ${company.phone || DIGITALNESS_DETAILS.phone}`, 14, 28);
    doc.text(company.address || DIGITALNESS_DETAILS.address, 14, 34);

    doc.setFontSize(16);
    doc.text(reportContent.reportTitle || "Customer Full Profile Report", 14, 48);
    doc.setFontSize(10);
    doc.text(`Customer: ${customer.name || "—"}`, 14, 55);
    doc.text(`Generated: ${generatedAt}`, 14, 61);

    autoTable(doc, {
      startY: 70,
      head: [["Customer Details", "Value"]],
      body: [
        ["Customer Name", customer.name || "—"],
        ["Company Name", customer.companyName || "—"],
        ["Business Type", customer.businessType || "—"],
        ["PAN Number", customer.panNumber || "—"],
        ["GST Number", customer.gstNumber || "—"],
        ["Phone Number(s)", customer.contactNumbers?.join(", ") || "—"],
        ["Email", customer.email || "—"],
        ["Address", customer.address || "—"],
        ["City / State", [customer.city, customer.state].filter(Boolean).join(", ") || "—"],
        ["Branch", branchName(customer.branchId || customer.branch)],
        ["Assigned Employee", getAssignedName(customer.assignedTo)],
        ["Assigned Manager", getAssignedName(customer.assignedManager)],
        ["Package / Plan", customer.package || "—"],
        ["Customer Status", customer.status || "Active"],
        ["Client Login", customer.userId ? "Linked" : "Not Created"],
      ],
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 55 } },
    });

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 8,
      head: [["Report Summary", "Details"]],
      body: [
        ["Report Type", reportContent.reportType || "Full Report"],
        ["Overview", reportContent.reportSummary || "Complete customer profile including business details, services, documents, communications, work history and payment summary."],
        ["Services Summary", reportContent.servicesSummary || customer.requirements?.join(", ") || "—"],
        ["Project Summary", reportContent.projectSummary || `${works.length} work/project records connected with this customer.`],
        ["Work Summary", reportContent.workSummary || `${activeWorks} active work(s), ${completedWorks} completed work(s).`],
        ["Payment Summary", reportContent.paymentSummary || `Paid: ${formatCurrency(customer.totalPaid || 0)} | Pending: ${formatCurrency(customer.totalPending || 0)}`],
        ["Notes", reportContent.notesForReport || customer.notes || "—"],
      ],
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: { 0: { fontStyle: "bold", cellWidth: 55 } },
    });

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 8,
      head: [["Selected Services / Requirements"]],
      body: customer.requirements?.length ? customer.requirements.map((item: string) => [item]) : [["No services added"]],
      styles: { fontSize: 9 },
    });

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 8,
      head: [["Work", "Type", "Assigned", "Status", "Priority", "Due Date", "Updates"]],
      body: works.length
        ? works.map((work: any) => [
          work.title || "—",
          work.workType || work.type || "General",
          getAssignedUsers(work.assignedTo).map((user: any) => `${user.name} (${user.role})`).join(", ") || "Unassigned",
          work.status || "Pending",
          work.priority || "Medium",
          work.dueDate ? new Date(work.dueDate).toLocaleDateString("en-IN") : "No date",
          String(work.updates?.length || 0),
        ])
        : [["No work history found", "—", "—", "—", "—", "—", "—"]],
      styles: { fontSize: 8 },
    });

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 8,
      head: [["Document", "Type", "Uploaded At"]],
      body: documents.length
        ? documents.map((file: CustomerDocument, index: number) => [
          file.fileName || file.name || `Document ${index + 1}`,
          file.fileType || file.type || "File",
          file.uploadedAt ? new Date(file.uploadedAt).toLocaleDateString("en-IN") : "—",
        ])
        : [["No documents added", "—", "—"]],
      styles: { fontSize: 8 },
    });

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 8,
      head: [["Communication", "Subject", "Message", "Date"]],
      body: communications.length
        ? communications.map((item: CommunicationLog) => [item.type || "Note", item.subject || "—", item.message || "—", item.createdAt ? new Date(item.createdAt).toLocaleString("en-IN") : "—"])
        : [["No communication logs", "—", "—", "—"]],
      styles: { fontSize: 8 },
    });

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 8,
      head: [["Activity", "Message", "Type", "Date"]],
      body: activities.length
        ? activities.slice().reverse().map((item: ActivityLog) => [item.title || "Activity", item.message || "—", item.type || "system", item.createdAt ? new Date(item.createdAt).toLocaleString("en-IN") : "—"])
        : [["No activity logs", "—", "—", "—"]],
      styles: { fontSize: 8 },
    });

    doc.save(`${(customer.name || "Customer").replace(/\s+/g, "_")}_Full_Report.pdf`);
  };

  return (
    <Dialog open={!!customer} onOpenChange={onClose}>
      <DialogContent className="w-[96vw] max-w-6xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader><DialogTitle>Customer Dashboard</DialogTitle></DialogHeader>
        <div className="space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-border">
            <div className="flex items-center gap-4 min-w-0">
              {customer.brandProfile?.logoUrl ? (
                <img
                  src={customer.brandProfile.logoUrl}
                  alt={customer.name}
                  className="w-16 h-16 shrink-0 rounded-xl object-contain border border-border bg-white p-1"
                />
              ) : (
                <div className="w-16 h-16 shrink-0 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-2xl">
                  {customer.name?.charAt(0)?.toUpperCase() || "C"}
                </div>
              )}
              <div className="min-w-0">
                <h2 className="text-xl md:text-2xl font-heading font-bold truncate">{customer.name}</h2>
                <p className="text-muted-foreground text-sm truncate">{customer.companyName || customer.businessType || "Business"} • {customer.city || "—"}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant={customer.status === "Inactive" ? "destructive" : "default"}>{customer.status || "Active"}</Badge>
                  <Badge variant="outline" className="font-mono text-[10px]">ID: {customer._id}</Badge>
                  {customer.package && <Badge variant="outline"><Package className="w-3 h-3 mr-1" />{customer.package}</Badge>}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => window.location.href = `/customers/${customer._id}/onboarding`} className="text-indigo-600 border-indigo-200">
                <Sparkles className="w-4 h-4 mr-1 text-indigo-600" /> Onboarding Wizard
              </Button>
              <ContextPreviewButton customerId={customer._id} />
              <Button variant="outline" size="sm" onClick={() => primaryPhone && window.open(`tel:${primaryPhone}`)} disabled={!primaryPhone}><Phone className="w-4 h-4 mr-1" />Call</Button>
              <Button variant="success" size="sm" onClick={() => whatsappPhone && window.open(`https://wa.me/${whatsappPhone}`, "_blank")} disabled={!whatsappPhone}><MessageSquare className="w-4 h-4 mr-1" />WhatsApp</Button>
              <Button variant="outline" size="sm" onClick={() => openClientLogin(customer)}><KeyRound className="w-4 h-4 mr-1" />Login</Button>
              <Button variant="outline" size="sm" onClick={() => onEdit(customer)}><Edit3 className="w-4 h-4 mr-1" />Edit</Button>
              <Button variant="gradient" size="sm" onClick={downloadReport}><Download className="w-4 h-4 mr-1" />Report</Button>
            </div>
          </div>

          <AgentReadinessPanel customerId={customer._id} />

          <SocialIntegrationsPanel customer={customer} />

          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3"><ProfileStat label="Branch" value={branchName(customer.branchId || customer.branch)} /><ProfileStat label="Paid" value={formatCurrency(customer.totalPaid)} success /><ProfileStat label="Pending" value={formatCurrency(customer.totalPending)} warning /><ProfileStat label="Active Works" value={activeWorks} /><ProfileStat label="Completed" value={completedWorks} success /><ProfileStat label="Documents" value={documents.length} /></div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Panel title="Contact & Business" icon={<Building2 className="w-4 h-4" />}><InfoLine icon={<Phone className="w-4 h-4" />} text={customer.contactNumbers?.join(", ") || "—"} /><InfoLine icon={<Mail className="w-4 h-4" />} text={customer.email || "Not provided"} /><InfoLine icon={<MapPin className="w-4 h-4" />} text={[customer.address, customer.city, customer.state].filter(Boolean).join(", ") || "—"} /><InfoLine icon={<ShieldCheck className="w-4 h-4" />} text={`PAN: ${customer.panNumber || "—"}`} /><InfoLine icon={<FileText className="w-4 h-4" />} text={`GST: ${customer.gstNumber || "—"}`} /></Panel>
            <Panel title="Login & Communication" icon={<KeyRound className="w-4 h-4" />}><InfoLine icon={<Lock className="w-4 h-4" />} text={customer.userId ? "Client login linked" : "Client login not created"} /><InfoLine icon={<Mail className="w-4 h-4" />} text="Email management ready" /><InfoLine icon={<MessageSquare className="w-4 h-4" />} text="WhatsApp / call tracking ready" /><Button variant="outline" size="sm" className="w-full mt-2" onClick={() => openClientLogin(customer)}>Manage Login</Button></Panel>
            <Panel title="Notes" icon={<ClipboardList className="w-4 h-4" />}><p className="text-sm text-muted-foreground whitespace-pre-wrap">{customer.notes || "No notes added yet."}</p></Panel>
          </div>

          <Panel title="Selected Services" icon={<Package className="w-4 h-4" />}><div className="flex flex-wrap gap-2">{customer.requirements?.length ? customer.requirements.map((req: string) => <Badge key={req} variant="secondary">{req}</Badge>) : <p className="text-sm text-muted-foreground">No services added</p>}</div></Panel>

          <Panel title="Report Content" icon={<ClipboardList className="w-4 h-4" />}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <InfoLine icon={<FileText className="w-4 h-4" />} text={`Report Title: ${customer.reportContent?.reportTitle || "Customer Full Profile Report"}`} />
              <InfoLine icon={<FileText className="w-4 h-4" />} text={`Report Type: ${customer.reportContent?.reportType || "Full Report"}`} />
              <InfoLine icon={<Package className="w-4 h-4" />} text={customer.reportContent?.servicesSummary || customer.requirements?.join(", ") || "Services summary not added"} />
              <InfoLine icon={<Briefcase className="w-4 h-4" />} text={customer.reportContent?.workSummary || `${activeWorks} active work(s), ${completedWorks} completed work(s)`} />
            </div>
            <p className="text-sm text-muted-foreground mt-3 whitespace-pre-wrap">{customer.reportContent?.reportSummary || "This report includes customer profile, business information, Digitalness details, work history, documents, communications, activity timeline and payment summary."}</p>
          </Panel>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Panel title="Supporting Documents" icon={<FileText className="w-4 h-4" />}>{documents.length === 0 ? <EmptyMini text="No supporting documents added" /> : <div className="space-y-2">{documents.map((doc: CustomerDocument, idx: number) => <div key={idx} className="rounded-lg border bg-background p-3 flex items-center justify-between gap-3"><div className="flex items-center gap-2 min-w-0"><FileText className="w-4 h-4 text-muted-foreground" /><div className="min-w-0"><p className="text-sm font-medium truncate">{doc.fileName || doc.name || `Document ${idx + 1}`}</p><p className="text-xs text-muted-foreground">{doc.fileType || doc.type || "File"}</p></div></div>{(doc.fileUrl || doc.url) && <Button size="sm" variant="outline" onClick={() => window.open(doc.fileUrl || doc.url, "_blank")}>Open</Button>}</div>)}</div>}</Panel>
            <Panel title="Activity Timeline" icon={<Activity className="w-4 h-4" />}>{activities.length === 0 ? <EmptyMini text="No activity logs yet" /> : <div className="space-y-3">{activities.slice().reverse().map((act: ActivityLog, idx: number) => <div key={idx} className="relative pl-5"><span className="absolute left-0 top-1.5 w-2 h-2 rounded-full bg-primary" /><p className="text-sm font-medium">{act.title || "Activity"}</p><p className="text-xs text-muted-foreground">{act.message || "—"}</p><p className="text-[11px] text-muted-foreground mt-1">{act.createdAt ? new Date(act.createdAt).toLocaleString("en-IN") : "—"}</p></div>)}</div>}</Panel>
          </div>

          <Panel title="Communication History" icon={<MessageSquare className="w-4 h-4" />}>{(customer.communications || []).length === 0 ? <EmptyMini text="No communication logs added" /> : <div className="space-y-3">{customer.communications.slice().reverse().map((item: CommunicationLog, idx: number) => <div key={idx} className="rounded-lg border bg-background p-3"><div className="flex items-center justify-between gap-2"><p className="text-sm font-semibold">{item.subject || item.type || "Communication"}</p><Badge variant="secondary">{item.type || "Note"}</Badge></div><p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{item.message || "—"}</p><p className="text-[11px] text-muted-foreground mt-2">{item.createdAt ? new Date(item.createdAt).toLocaleString("en-IN") : "—"}</p></div>)}</div>}</Panel>

          <Panel title="Work History / Active & Inactive Deals" icon={<Briefcase className="w-4 h-4" />}>{works.length === 0 ? <EmptyMini text="No works/deals assigned for this customer" /> : <div className="space-y-3">{works.map((work: any) => { const assignedUsers = getAssignedUsers(work.assignedTo); return <div key={work._id} className="rounded-xl border border-border bg-background p-4"><div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3"><div className="min-w-0"><h5 className="font-semibold truncate">{work.title}</h5><p className="text-sm text-muted-foreground flex items-center gap-1 mt-1"><Briefcase className="w-3 h-3 shrink-0" />{work.workType || work.type || "General Work"}</p><p className="text-sm text-muted-foreground mt-1 line-clamp-2">{work.description || "No description"}</p></div><div className="flex flex-wrap gap-2"><Badge variant={statusVariant[work.status || "Pending"] || "secondary"}>{work.status || "Pending"}</Badge><Badge variant={priorityVariant[work.priority || "Medium"] || "outline"}>{work.priority || "Medium"}</Badge></div></div><div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4"><div className="rounded-lg bg-muted/40 p-3"><p className="text-xs text-muted-foreground mb-2">Assigned Employees</p>{assignedUsers.length === 0 ? <p className="text-sm font-medium">Unassigned</p> : assignedUsers.map((user: any) => <div key={user.id || user.name} className="flex items-center gap-2 mb-2 last:mb-0"><div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">{user.name?.charAt(0)?.toUpperCase() || "U"}</div><div className="min-w-0"><p className="text-sm font-medium truncate">{user.name}</p><p className="text-xs text-muted-foreground truncate">{user.role}</p></div></div>)}</div><div className="rounded-lg bg-muted/40 p-3"><p className="text-xs text-muted-foreground mb-2">Due Date</p><p className="text-sm font-medium flex items-center gap-1"><Calendar className="w-3 h-3" />{work.dueDate ? new Date(work.dueDate).toLocaleDateString("en-IN") : "No due date"}</p></div><div className="rounded-lg bg-muted/40 p-3"><p className="text-xs text-muted-foreground mb-2">Updates</p><p className="text-sm font-medium">{work.updates?.length || 0} Updates</p><p className="text-xs text-muted-foreground mt-1">Created: {work.createdAt ? new Date(work.createdAt).toLocaleDateString("en-IN") : "—"}</p></div></div></div>; })}</div>}</Panel>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StatCard({ title, value, icon, highlight }: { title: string; value: string | number; icon?: React.ReactNode; highlight?: boolean }) {
  return <div className={highlight ? "p-5 rounded-2xl gradient-primary text-primary-foreground shadow-card" : "p-5 rounded-2xl bg-card border border-border shadow-card"}><div className="flex items-center justify-between gap-3"><div><p className="text-2xl md:text-3xl font-heading font-bold">{value}</p><p className={highlight ? "text-sm text-primary-foreground/80" : "text-sm text-muted-foreground"}>{title}</p></div>{icon && <div className={highlight ? "text-primary-foreground/80" : "text-muted-foreground"}>{icon}</div>}</div></div>;
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) { return <div className="flex items-center gap-2 text-sm font-semibold text-foreground border-b pb-2">{icon}{title}</div>; }
function Panel({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) { return <div className="rounded-xl border border-border bg-card p-4"><h4 className="font-semibold mb-3 text-sm flex items-center gap-2">{icon}{title}</h4>{children}</div>; }
function EmptyMini({ text }: { text: string }) { return <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">{text}</div>; }
function InfoRow({ icon, text }: { icon: React.ReactNode; text: string }) { return <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0"><span className="shrink-0">{icon}</span><span className="truncate">{text}</span></div>; }
function InfoLine({ icon, text }: { icon: React.ReactNode; text: string }) { return <div className="flex items-start gap-2 text-sm min-w-0 mb-2 last:mb-0"><span className="text-muted-foreground mt-0.5 shrink-0">{icon}</span><span className="break-words">{text}</span></div>; }
function ProfileStat({ label, value, success, warning }: { label: string; value: string | number; success?: boolean; warning?: boolean }) { const className = success ? "p-3 rounded-lg bg-success/10 border border-success/30" : warning ? "p-3 rounded-lg bg-warning/10 border border-warning/30" : "p-3 rounded-lg bg-card border border-border"; const valueClassName = success ? "text-xl font-heading font-bold mt-1 text-success" : warning ? "text-xl font-heading font-bold mt-1 text-warning" : "text-xl font-heading font-bold mt-1"; return <div className={className}><p className="text-xs text-muted-foreground">{label}</p><p className={valueClassName}>{value}</p></div>; }
function AgentReadinessPanel({ customerId }: { customerId: string }) {
  const [readiness, setReadiness] = useState<any>(null);

  useEffect(() => {
    if (customerId) {
      getCustomerReadiness(customerId).then(setReadiness).catch(() => null);
    }
  }, [customerId]);

  if (!readiness) return null;

  const agentKeys = [
    { key: "social", label: "Social Agent" },
    { key: "creative", label: "Creative Agent" },
    { key: "ads", label: "Ads Agent" },
    { key: "gbp", label: "GBP Agent" },
    { key: "seo", label: "SEO Agent" },
    { key: "lead", label: "Lead Agent" },
    { key: "reporting", label: "Reporting Agent" },
  ];

  return (
    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-indigo-600" /> Client AI Readiness Breakdown
        </span>
        <Badge className={readiness.isAIReady ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}>
          Overall: {readiness.overallScore}% {readiness.isAIReady ? "✓ AI Ready" : "⚠️ Needs Profile Info"}
        </Badge>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-xs">
        {agentKeys.map(({ key, label }) => {
          const item = readiness.agents?.[key] || { score: 0, ready: false, missingRequired: [] };
          return (
            <div key={key} className="p-2.5 rounded-lg bg-white border border-slate-200 flex flex-col justify-between">
              <div>
                <span className="font-semibold text-slate-700 block truncate">{label}</span>
                <div className="flex items-center gap-1 mt-1">
                  <span
                    className={`font-bold text-sm ${item.ready
                        ? "text-emerald-600"
                        : item.score >= 50
                          ? "text-amber-600"
                          : "text-rose-600"
                      }`}
                  >
                    {item.score}%
                  </span>
                  <Badge className={`text-[9px] px-1 py-0 ${item.ready ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
                    {item.ready ? "READY" : "NEEDS DATA"}
                  </Badge>
                </div>
                {item.missingRequired?.length > 0 && (
                  <p className="text-[10px] text-rose-600 mt-1 line-clamp-1">
                    Missing: {item.missingRequired[0]}
                  </p>
                )}
              </div>

              {!item.ready && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-[10px] h-6 mt-2 border-slate-300 text-slate-700"
                  onClick={() => (window.location.href = `/customers/${customerId}/onboarding`)}
                >
                  Fill Profile
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ContextPreviewButton({ customerId }: { customerId: string }) {
  const [open, setOpen] = useState(false);
  const [agentType, setAgentType] = useState("Social");
  const [contextJson, setContextJson] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchPreview = async (selectedType: string) => {
    try {
      setLoading(true);
      const data = await getContextPreview(customerId, selectedType);
      setContextJson(data);
    } catch (err) {
      setContextJson({ error: "Failed to load context preview" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchPreview(agentType);
    }
  }, [open, agentType]);

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="text-purple-700 border-purple-200">
        <Sparkles className="w-4 h-4 mr-1 text-purple-600" /> AI Context Preview
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-purple-700">
              <Sparkles className="h-5 w-5" /> Sanitized AI Agent Prompt Context Preview
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="flex items-center justify-between gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="font-semibold text-slate-700">Target Agent Context:</span>
              <Select value={agentType} onValueChange={setAgentType}>
                <SelectTrigger className="w-[200px] h-8 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Parent", "Social", "Creative", "Ads", "GBP", "SEO", "Lead", "Reporting"].map((type) => (
                    <SelectItem key={type} value={type}>
                      {type} Agent
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <p className="text-slate-500 italic">
              * This is the exact sanitized JSON context payload that the {agentType} Agent will receive prior to generating plans. All passwords, salaries, and tokens are automatically stripped.
            </p>

            <div className="p-4 bg-slate-900 text-emerald-400 font-mono text-xs rounded-xl overflow-x-auto max-h-[400px]">
              {loading ? (
                <div className="text-slate-400 p-4 text-center">Building sanitized agent context...</div>
              ) : (
                <pre>{JSON.stringify(contextJson, null, 2)}</pre>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function SocialIntegrationsPanel({ customer }: { customer: any }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const initialIntegrations = customer.socialIntegrations || {};

  const [igAccountId, setIgAccountId] = useState(initialIntegrations.instagram?.accountId || "");
  const [igUsername, setIgUsername] = useState(initialIntegrations.instagram?.username || "");
  const [igAccessToken, setIgAccessToken] = useState(initialIntegrations.instagram?.accessToken || "");

  const [fbPageId, setFbPageId] = useState(initialIntegrations.facebook?.pageId || "");
  const [fbPageName, setFbPageName] = useState(initialIntegrations.facebook?.pageName || "");
  const [fbAccessToken, setFbAccessToken] = useState(initialIntegrations.facebook?.accessToken || "");

  const isIgConnected = Boolean(initialIntegrations.instagram?.accountId && initialIntegrations.instagram?.accessToken);
  const isFbConnected = Boolean(initialIntegrations.facebook?.pageId && initialIntegrations.facebook?.accessToken);

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = {
        socialIntegrations: {
          instagram: {
            accountId: igAccountId.trim(),
            username: igUsername.trim(),
            accessToken: igAccessToken.trim(),
            connected: Boolean(igAccountId.trim() && igAccessToken.trim()),
            connectedAt: Boolean(igAccountId.trim() && igAccessToken.trim()) ? new Date() : null,
          },
          facebook: {
            pageId: fbPageId.trim(),
            pageName: fbPageName.trim(),
            accessToken: fbAccessToken.trim(),
            connected: Boolean(fbPageId.trim() && fbAccessToken.trim()),
            connectedAt: Boolean(fbPageId.trim() && fbAccessToken.trim()) ? new Date() : null,
          },
        },
      };

      await updateCustomer(customer._id, payload);
      toast({
        title: "✓ Integrations Saved",
        description: "Social accounts and publishing tokens updated for this customer.",
      });
      setOpen(false);
    } catch (err: any) {
      toast({
        title: "Save Failed",
        description: err.message || "Failed to update social credentials",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 rounded-xl bg-slate-900 text-white border border-indigo-950 space-y-3 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Share2 className="h-4 w-4 text-indigo-400" />
          <span className="font-bold text-xs uppercase tracking-wider text-slate-100">
            Connected Social Accounts & Auto-Publish APIs
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              try {
                const res = await fetch(`${API_URL}/customers/seed-social-data`, {
                  method: "POST",
                  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                });
                const data = await res.json();
                if (data.success) {
                  toast({
                    title: "✓ Demo Data Seeded",
                    description: "Social credentials and 3 sample scheduled posts with poster visuals added!",
                  });
                  window.location.reload();
                } else {
                  toast({ title: "Seeding error", description: data.message, variant: "destructive" });
                }
              } catch (err: any) {
                toast({ title: "Seeding error", description: err.message, variant: "destructive" });
              }
            }}
            className="h-7 text-xs bg-emerald-700 hover:bg-emerald-800 text-white border-0"
          >
            <Sparkles className="h-3.5 w-3.5 mr-1" /> Seed Demo Data
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setOpen(true)}
            className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700 text-white border-0"
          >
            <Edit3 className="h-3.5 w-3.5 mr-1" /> Configure Credentials
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        {/* Instagram Status */}
        <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="font-bold text-slate-200 block">Instagram Professional API</span>
            <span className="text-[11px] text-slate-400">
              {isIgConnected
                ? `Account: ${initialIntegrations.instagram?.username || initialIntegrations.instagram?.accountId}`
                : "No credentials configured"}
            </span>
          </div>
          <Badge className={isIgConnected ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-400"}>
            {isIgConnected ? "✓ Connected" : "Not Configured"}
          </Badge>
        </div>

        {/* Facebook Status */}
        <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="font-bold text-slate-200 block">Facebook Page Graph API</span>
            <span className="text-[11px] text-slate-400">
              {isFbConnected
                ? `Page: ${initialIntegrations.facebook?.pageName || initialIntegrations.facebook?.pageId}`
                : "No credentials configured"}
            </span>
          </div>
          <Badge className={isFbConnected ? "bg-emerald-600 text-white" : "bg-slate-800 text-slate-400"}>
            {isFbConnected ? "✓ Connected" : "Not Configured"}
          </Badge>
        </div>
      </div>

      {/* Config Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg text-xs space-y-4 max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Share2 className="h-5 w-5 text-indigo-600" /> Configure Client Social Media Publishing APIs
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <p className="text-slate-500 text-xs">
              These credentials enable the CRM to automatically publish scheduled posts to this client's Instagram and Facebook pages.
            </p>

            {/* Instagram Section */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
              <span className="font-bold text-indigo-900 block text-xs uppercase">Instagram Business Settings</span>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-700">Instagram Account ID</label>
                <Input
                  placeholder="e.g. 17841400000000000"
                  value={igAccountId}
                  onChange={(e) => setIgAccountId(e.target.value)}
                  className="h-8 text-xs bg-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-700">Instagram Handle / Username</label>
                <Input
                  placeholder="e.g. @glownest_salon"
                  value={igUsername}
                  onChange={(e) => setIgUsername(e.target.value)}
                  className="h-8 text-xs bg-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-700">Instagram Access Token (Long-Lived)</label>
                <Input
                  type="password"
                  placeholder="Paste Meta User/Page token"
                  value={igAccessToken}
                  onChange={(e) => setIgAccessToken(e.target.value)}
                  className="h-8 text-xs bg-white font-mono"
                />
              </div>
            </div>

            {/* Facebook Section */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
              <span className="font-bold text-blue-900 block text-xs uppercase">Facebook Page Settings</span>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-700">Facebook Page ID</label>
                <Input
                  placeholder="e.g. 109876543210987"
                  value={fbPageId}
                  onChange={(e) => setFbPageId(e.target.value)}
                  className="h-8 text-xs bg-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-700">Facebook Page Name</label>
                <Input
                  placeholder="e.g. GlowNest Salon"
                  value={fbPageName}
                  onChange={(e) => setFbPageName(e.target.value)}
                  className="h-8 text-xs bg-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-slate-700">Page Access Token</label>
                <Input
                  type="password"
                  placeholder="Paste Meta Page token"
                  value={fbAccessToken}
                  onChange={(e) => setFbAccessToken(e.target.value)}
                  className="h-8 text-xs bg-white font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
              >
                {saving ? "Saving..." : "Save Credentials"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CustomersLoadingSkeleton() { return <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="bg-card rounded-2xl border border-border shadow-card p-5 overflow-hidden"><div className="flex items-start justify-between mb-4"><div className="flex items-center gap-3"><div className="w-12 h-12 rounded-full bg-muted animate-pulse" /><div className="space-y-2"><div className="h-4 w-32 bg-muted rounded animate-pulse" /><div className="h-3 w-24 bg-muted rounded animate-pulse" /></div></div><div className="w-5 h-5 bg-muted rounded animate-pulse" /></div><div className="space-y-3 mb-4">{Array.from({ length: 4 }).map((__, rowIndex) => <div key={rowIndex} className="flex items-center gap-2"><div className="w-4 h-4 bg-muted rounded animate-pulse" /><div className="h-3 flex-1 bg-muted rounded animate-pulse" /></div>)}</div><div className="pt-4 border-t border-border space-y-2"><div className="h-12 rounded-lg bg-muted/70 animate-pulse" /><div className="h-9 rounded-md bg-muted animate-pulse" /></div></div>)}</motion.div>; }
