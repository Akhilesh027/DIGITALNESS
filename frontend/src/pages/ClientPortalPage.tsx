import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  Calendar,
  CheckCircle,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  ExternalLink,
  Eye,
  FileDown,
  FileText,
  FileUp,
  IndianRupee,
  LayoutDashboard,
  ListChecks,
  Loader2,
  Mail,
  MessageSquare,
  Paperclip,
  PieChart as PieChartIcon,
  Plus,
  Receipt,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Trash2,
  TrendingUp,
  UploadCloud,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useInvoiceStore } from "@/store/invoiceStore";

const API_URL = import.meta.env.VITE_API_URL || "https://server.digitalness.co.in/api";

const COLORS = [
  "hsl(var(--success))",
  "hsl(var(--warning))",
  "hsl(var(--info))",
  "hsl(var(--destructive))",
  "hsl(var(--accent))",
];

type Section =
  | "overview"
  | "proposals"
  | "pending"
  | "invoices"
  | "payments"
  | "team"
  | "tasks"
  | "reports"
  | "downloads";

const NAV: { key: Section; label: string; icon: any }[] = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "proposals", label: "Proposals", icon: FileText },
  { key: "pending", label: "Pending Dues", icon: Clock },
  { key: "invoices", label: "Invoices", icon: Receipt },
  { key: "payments", label: "Payments", icon: CreditCard },
  { key: "team", label: "Team", icon: Users },
  { key: "tasks", label: "Tasks", icon: ListChecks },
  { key: "reports", label: "Reports", icon: BarChart3 },
  { key: "downloads", label: "Downloads", icon: FileDown },
];

const getAuthConfig = () => {
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken");

  return {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  };
};

const getArrayData = (data: any) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.customers)) return data.customers;
  if (Array.isArray(data?.users)) return data.users;
  if (Array.isArray(data?.works)) return data.works;
  if (Array.isArray(data?.invoices)) return data.invoices;
  if (Array.isArray(data?.payments)) return data.payments;
  return [];
};

const getCurrentUser = () => {
  try {
    const user =
      localStorage.getItem("user") ||
      localStorage.getItem("currentUser") ||
      localStorage.getItem("authUser");

    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

const formatMoney = (amount: number) =>
  `₹${Number(amount || 0).toLocaleString("en-IN")}`;

const formatDate = (date?: string) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getStatusVariant = (status: string): any => {
  const s = String(status || "").toLowerCase();
  if (s.includes("complete") || s.includes("paid") || s.includes("approved")) {
    return "completed";
  }
  if (s.includes("progress") || s.includes("sent")) return "inProgress";
  if (s.includes("review") || s.includes("pending")) return "warning";
  if (s.includes("failed") || s.includes("overdue") || s.includes("rejected")) {
    return "destructive";
  }
  return "secondary";
};

export default function ClientPortalPage() {
  const { invoices: localInvoices, paymentRecords, addPaymentRecord, updateInvoice, addInvoice } = useInvoiceStore();
  const { toast } = useToast();

  const currentUser = getCurrentUser();
  const isClientUser =
    ["customer", "client"].includes(String(currentUser?.role || "").toLowerCase()) ||
    Boolean(currentUser?.customerId);
  const isCustomerRole = isClientUser;

  const [customers, setCustomers] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [works, setWorks] = useState<any[]>([]);
  const [backendInvoices, setBackendInvoices] = useState<any[]>([]);
  const [backendPayments, setBackendPayments] = useState<any[]>([]);
  const [proposals, setProposals] = useState<any[]>([]);
  const [selectedProposal, setSelectedProposal] = useState<any | null>(null);
  const [verifyingPaymentId, setVerifyingPaymentId] = useState<string | null>(null);
  const [acceptingProposalId, setAcceptingProposalId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [reportLoading, setReportLoading] = useState<string | null>(null);

  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [active, setActive] = useState<Section>("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [reportType, setReportType] = useState("monthly");
  const [reportRange, setReportRange] = useState({
    fromDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0],
    toDate: new Date().toISOString().split("T")[0],
  });
  const [selectedWork, setSelectedWork] = useState<any>(null);

  // Manual payment state
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [deletingPaymentId, setDeletingPaymentId] = useState<string | null>(null);
  const [paymentReceiptFile, setPaymentReceiptFile] = useState<File | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    method: "UPI",
    reference: "",
    invoiceId: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
    sendAlert: true,
    alertChannel: "WhatsApp" as "WhatsApp" | "Email" | "SMS",
    customAlertMessage: "",
  });


  // Manual invoice & document upload state
  const [showAddInvoiceModal, setShowAddInvoiceModal] = useState(false);
  const [submittingInvoice, setSubmittingInvoice] = useState(false);
  const [invoiceDocumentFile, setInvoiceDocumentFile] = useState<File | null>(null);
  const [invoiceForm, setInvoiceForm] = useState({
    invoiceNumber: "",
    amount: "",
    paymentStatus: "PAID" as "PAID" | "UNPAID" | "PARTIALLY_PAID",
    paidAmount: "",
    paymentMethod: "Bank Transfer",
    reference: "",
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
    description: "Monthly Digital Marketing & Agency Retainer",
    notes: "",
  });

  // Payment due alert modal state
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [sendingAlert, setSendingAlert] = useState(false);
  const [alertForm, setAlertForm] = useState({
    customerId: "",
    invoiceId: "",
    amount: "",
    dueDate: "",
    channel: "WhatsApp" as "WhatsApp" | "Email" | "SMS",
    recipientName: "",
    recipientPhone: "",
    recipientEmail: "",
    customMessage: "",
  });

  const fetchBackendData = async () => {
    try {
      setLoading(true);

      const requests = [
        fetch(`${API_URL}/customers`, getAuthConfig()),
        fetch(`${API_URL}/users`, getAuthConfig()),
        fetch(`${API_URL}/works`, getAuthConfig()),
      ];

      const [customersRes, usersRes, worksRes] = await Promise.all(requests);
      const [customersData, usersData, worksData] = await Promise.all([
        customersRes.json(),
        usersRes.json(),
        worksRes.json(),
      ]);

      const customerList = getArrayData(customersData);
      const userList = getArrayData(usersData);
      const workList = getArrayData(worksData);

      setCustomers(customerList);
      setEmployees(userList);
      setWorks(workList);

      try {
        const [invoiceRes, paymentRes] = await Promise.all([
          fetch(`${API_URL}/invoices`, getAuthConfig()),
          fetch(`${API_URL}/payments`, getAuthConfig()),
        ]);

        if (invoiceRes.ok) setBackendInvoices(getArrayData(await invoiceRes.json()));
        if (paymentRes.ok) setBackendPayments(getArrayData(await paymentRes.json()));
      } catch {
        setBackendInvoices([]);
        setBackendPayments([]);
      }

      if (!selectedCustomerId && customerList.length > 0) {
        const currentUserId = currentUser?._id || currentUser?.id;

        const matchedCustomer = customerList.find((c: any) => {
          const userId = c.userId?._id || c.userId?.id || c.userId;
          const assignedId = c.assignedTo?._id || c.assignedTo?.id || c.assignedTo;
          return (
            String(userId) === String(currentUserId) ||
            String(c._id || c.id) === String(currentUserId) ||
            String(assignedId) === String(currentUserId) ||
            String(c.email || "").toLowerCase() ===
            String(currentUser?.email || "").toLowerCase()
          );
        });

        setSelectedCustomerId(
          isCustomerRole && matchedCustomer
            ? matchedCustomer._id || matchedCustomer.id
            : customerList[0]._id || customerList[0].id
        );
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch client portal data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerProposals = async (custId: string) => {
    if (!custId) return;
    try {
      const res = await fetch(`${API_URL}/proposals?customerId=${custId}`, getAuthConfig());
      if (res.ok) {
        const data = await res.json();
        setProposals(getArrayData(data));
      }
    } catch (e) {
      console.warn("Failed to fetch customer proposals:", e);
    }
  };

  const fetchCustomerFinancials = async (custId: string) => {
    if (!custId) return;
    try {
      fetchCustomerProposals(custId);
      const [invoiceRes, paymentRes] = await Promise.all([
        fetch(`${API_URL}/invoices?customerId=${custId}`, getAuthConfig()),
        fetch(`${API_URL}/payments?customerId=${custId}`, getAuthConfig()),
      ]);

      if (invoiceRes.ok) {
        const invData = getArrayData(await invoiceRes.json());
        setBackendInvoices((prev) => {
          const others = prev.filter((i: any) => {
            const cId = i.customer?._id || i.customer?.id || i.customer || i.customerId;
            return String(cId) !== String(custId);
          });
          return [...others, ...invData];
        });
      }

      if (paymentRes.ok) {
        const payData = getArrayData(await paymentRes.json());
        setBackendPayments((prev) => {
          const others = prev.filter((p: any) => {
            const cId = p.customer?._id || p.customer?.id || p.customer || p.customerId;
            return String(cId) !== String(custId);
          });
          return [...others, ...payData];
        });
      }
    } catch (e) {
      console.warn("Failed to fetch customer financials:", e);
    }
  };

  useEffect(() => {
    fetchBackendData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedCustomerId) {
      fetchCustomerFinancials(selectedCustomerId);
      fetchCustomerProposals(selectedCustomerId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCustomerId]);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      toast({
        title: "Customer Required",
        description: "Please select a client/customer before recording payment.",
        variant: "destructive",
      });
      return;
    }

    const numAmount = Number(paymentForm.amount);
    if (!numAmount || numAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid payment amount greater than ₹0.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmittingPayment(true);
      const generatedRef = paymentForm.reference.trim() || `REC-${Date.now().toString().slice(-6)}`;
      const token = localStorage.getItem("token") || localStorage.getItem("authToken");

      let res;
      if (paymentReceiptFile) {
        const formData = new FormData();
        formData.append("customerId", selectedCustomerId);
        if (paymentForm.invoiceId) formData.append("invoiceId", paymentForm.invoiceId);
        formData.append("amount", String(numAmount));
        formData.append("paidAmount", String(numAmount));
        formData.append("date", paymentForm.date || new Date().toISOString());
        formData.append("paymentDate", paymentForm.date || new Date().toISOString());
        formData.append("method", paymentForm.method);
        formData.append("reference", generatedRef);
        formData.append("referenceId", generatedRef);
        formData.append("status", isClientUser ? "Pending" : "Completed");
        formData.append("notes", paymentForm.notes.trim());
        formData.append("sendAlert", String(paymentForm.sendAlert));
        formData.append("alertChannel", paymentForm.alertChannel);
        formData.append("alertMessage", paymentForm.customAlertMessage.trim());
        formData.append("receipt", paymentReceiptFile);

        res = await fetch(`${API_URL}/payments`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });
      } else {
        const payload = {
          customerId: selectedCustomerId,
          invoiceId: paymentForm.invoiceId || undefined,
          amount: numAmount,
          paidAmount: numAmount,
          date: paymentForm.date || new Date().toISOString(),
          paymentDate: paymentForm.date || new Date().toISOString(),
          method: paymentForm.method,
          reference: generatedRef,
          referenceId: generatedRef,
          status: isClientUser ? "Pending" : "Completed",
          notes: paymentForm.notes.trim(),
          sendAlert: paymentForm.sendAlert,
          alertChannel: paymentForm.alertChannel,
          alertMessage: paymentForm.customAlertMessage.trim(),
        };

        res = await fetch(`${API_URL}/payments`, {
          method: "POST",
          headers: getAuthConfig().headers,
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to record payment on server");
      }

      const resData = await res.json();
      const savedPayment = resData.data || resData.payment || {};

      // Update local invoice store as well for seamless instant sync
      addPaymentRecord({
        id: savedPayment._id || `PAY-${Date.now()}`,
        customerId: selectedCustomerId,
        invoiceId: paymentForm.invoiceId || undefined,
        amount: numAmount,
        date: paymentForm.date || new Date().toISOString().split("T")[0],
        method: paymentForm.method as any,
        reference: generatedRef,
        status: isClientUser ? "Pending" : "Completed",
        notes: paymentForm.notes,
      });

      if (paymentForm.invoiceId && !isClientUser) {
        const targetInv = customerInvoices.find(
          (inv) => (inv._id || inv.id) === paymentForm.invoiceId
        );
        if (targetInv) {
          const prevPaid = Number(targetInv.paidAmount || 0);
          const totalVal = Number(targetInv.total || targetInv.originalAmount || 0);
          const newPaid = prevPaid + numAmount;
          updateInvoice(targetInv.id || targetInv._id, {
            paidAmount: Math.min(newPaid, totalVal),
            status: newPaid >= totalVal ? "Paid" : "Partially Paid",
          });
        }
      }

      toast({
        title: isClientUser
          ? "Payment Proof Submitted"
          : paymentForm.sendAlert
            ? "Payment Saved & Alert Dispatched"
            : "Payment Recorded Successfully",
        description: isClientUser
          ? `Your payment proof of ₹${numAmount.toLocaleString("en-IN")} (Ref: ${generatedRef}) has been submitted for admin verification.`
          : `₹${numAmount.toLocaleString("en-IN")} via ${paymentForm.method} recorded.${paymentForm.sendAlert ? ` Confirmation alert sent via ${paymentForm.alertChannel} to client!` : " Reflected in Client Portal!"}`,
      });

      setShowAddPaymentModal(false);
      setPaymentForm({
        amount: "",
        method: "UPI",
        reference: "",
        invoiceId: "",
        date: new Date().toISOString().split("T")[0],
        notes: "",
        sendAlert: true,
        alertChannel: "WhatsApp",
        customAlertMessage: "",
      });
      setPaymentReceiptFile(null);

      // Refetch latest data from backend
      await fetchBackendData();
      if (selectedCustomerId) {
        await fetchCustomerFinancials(selectedCustomerId);
      }
    } catch (err: any) {
      console.warn("Payment recording notice:", err.message);

      // Local fallback in store
      addPaymentRecord({
        id: `PAY-${Date.now()}`,
        customerId: selectedCustomerId,
        invoiceId: paymentForm.invoiceId || undefined,
        amount: numAmount,
        date: paymentForm.date || new Date().toISOString().split("T")[0],
        method: paymentForm.method as any,
        reference: paymentForm.reference || `REC-${Date.now().toString().slice(-6)}`,
        status: isClientUser ? "Pending" : "Completed",
        notes: paymentForm.notes,
      });

      toast({
        title: isClientUser ? "Payment Proof Submitted" : "Payment Saved",
        description: isClientUser
          ? `Payment details submitted for verification.`
          : `Recorded ₹${numAmount.toLocaleString("en-IN")} for ${getCustomerName(customer)}.`,
      });

      setShowAddPaymentModal(false);
      setPaymentForm({
        amount: "",
        method: "UPI",
        reference: "",
        invoiceId: "",
        date: new Date().toISOString().split("T")[0],
        notes: "",
        sendAlert: true,
        alertChannel: "WhatsApp",
        customAlertMessage: "",
      });
      setPaymentReceiptFile(null);
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleVerifyPayment = async (paymentId: string) => {
    try {
      setVerifyingPaymentId(paymentId);
      const res = await fetch(`${API_URL}/payments/${paymentId}/verify`, {
        method: "PATCH",
        headers: getAuthConfig().headers,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to verify payment");
      }
      toast({
        title: "Payment Verified",
        description: "Payment verified successfully and reconciled with invoice.",
      });
      if (selectedCustomerId) {
        fetchCustomerFinancials(selectedCustomerId);
      }
      fetchBackendData();
    } catch (err: any) {
      toast({
        title: "Verification Failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setVerifyingPaymentId(null);
    }
  };

  const handleAcceptProposal = async (proposalId: string) => {
    try {
      setAcceptingProposalId(proposalId);
      const res = await fetch(`${API_URL}/proposals/${proposalId}/status`, {
        method: "PATCH",
        headers: getAuthConfig().headers,
        body: JSON.stringify({ status: "Accepted" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to accept proposal");
      }
      toast({
        title: "Proposal Accepted",
        description: "Thank you! The proposal has been approved and accepted.",
      });
      if (selectedCustomerId) {
        fetchCustomerProposals(selectedCustomerId);
      }
    } catch (err: any) {
      toast({
        title: "Action Failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setAcceptingProposalId(null);
    }
  };

  const handleDownloadInvoice = (inv: any) => {
    if (inv.documentUrl) {
      const docUrl = inv.documentUrl.startsWith("http")
        ? inv.documentUrl
        : `${API_URL.replace("/api", "")}${inv.documentUrl}`;
      window.open(docUrl, "_blank");
      return;
    }

    const invoiceNumber = inv.invoiceNumber || "INV";
    const win = window.open("", "_blank");
    if (!win) {
      window.print();
      return;
    }

    const totalVal = Number(inv.total || inv.originalAmount || inv.amount || 0);
    const paidVal = Number(inv.paidAmount || 0);
    const balVal = inv.balanceAmount !== undefined ? Number(inv.balanceAmount) : Math.max(0, totalVal - paidVal);
    const baseAmount = Math.round(totalVal / 1.18);
    const tax = totalVal - baseAmount;

    win.document.write(`
      <html>
        <head>
          <title>Invoice - ${invoiceNumber}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #0f172a; background: #fff; line-height: 1.5; }
            .header { border-bottom: 2px solid #0f172a; padding-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start; }
            .brand { font-size: 26px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px; }
            .sub { color: #64748b; font-size: 13px; margin-top: 4px; }
            .meta { margin: 30px 0; display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
            .meta-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; font-size: 13px; }
            table { width: 100%; border-collapse: collapse; margin-top: 24px; font-size: 13px; }
            th { background: #0f172a; color: #fff; text-align: left; padding: 12px 16px; font-weight: 600; font-size: 12px; text-transform: uppercase; }
            td { padding: 14px 16px; border-bottom: 1px solid #e2e8f0; }
            .total-row { font-weight: bold; background: #f8fafc; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 20px; }
            @media print { .no-print { display: none; } body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="brand">DIGITALNESS MEDIA PVT LTD</div>
              <div class="sub">GSTIN: 36AAECD1234F1Z8 · Premier Digital & Technology Services</div>
              <div class="sub">contact@digitalness.in · Corporate Accounting</div>
            </div>
            <div style="text-align: right;">
              <h2 style="margin: 0; color: #0f172a; font-size: 20px;">TAX INVOICE</h2>
              <div class="sub" style="margin-top: 6px;">Invoice #: <b>${invoiceNumber}</b></div>
              <div class="sub">Issue Date: <b>${formatDate(inv.invoiceDate || inv.date || inv.createdAt)}</b></div>
              <div class="sub">Due Date: <b>${formatDate(inv.dueDate)}</b></div>
            </div>
          </div>

          <div class="meta">
            <div class="meta-box">
              <strong style="color: #64748b; font-size: 11px; text-transform: uppercase;">Billed To:</strong><br/>
              <b style="font-size: 15px; color: #0f172a;">${customer?.name || "Client Account"}</b><br/>
              ${customer?.companyName ? `<div>${customer.companyName}</div>` : ""}
              ${customer?.email ? `<div>Email: ${customer.email}</div>` : ""}
              ${customer?.phone || customer?.contactNumbers?.[0] ? `<div>Phone: ${customer.phone || customer.contactNumbers?.[0]}</div>` : ""}
            </div>
            <div class="meta-box">
              <strong style="color: #64748b; font-size: 11px; text-transform: uppercase;">Payment Summary:</strong><br/>
              <div>Invoice Status: <b style="color: ${balVal === 0 ? '#10b981' : '#f59e0b'};">${balVal === 0 ? 'PAID / CLEARED' : 'PENDING'}</b></div>
              <div>Total Invoiced: <b>${formatMoney(totalVal)}</b></div>
              <div>Amount Settled: <b style="color: #10b981;">${formatMoney(paidVal)}</b></div>
              <div style="font-size: 14px; margin-top: 4px;">Balance Due: <b style="color: #f59e0b;">${formatMoney(balVal)}</b></div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th style="text-align: right;">Base Amount</th>
                <th style="text-align: right;">GST (18%)</th>
                <th style="text-align: right;">Total Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <b>${inv.notes || inv.items?.[0]?.description || "Agency Retainer & Marketing Deliverables"}</b>
                  <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Professional design, development & digital growth execution</div>
                </td>
                <td style="text-align: right;">${formatMoney(baseAmount)}</td>
                <td style="text-align: right;">${formatMoney(tax)}</td>
                <td style="text-align: right;"><b>${formatMoney(totalVal)}</b></td>
              </tr>
              <tr class="total-row">
                <td colspan="3" style="text-align: right;">Amount Paid:</td>
                <td style="text-align: right; color: #10b981;">${formatMoney(paidVal)}</td>
              </tr>
              <tr class="total-row" style="font-size: 15px;">
                <td colspan="3" style="text-align: right;">Net Balance Due:</td>
                <td style="text-align: right; color: #f59e0b;">${formatMoney(balVal)}</td>
              </tr>
            </tbody>
          </table>

          <div class="footer">
            <p>Payment Modes: Corporate UPI (digitalness@hdfcbank) or NEFT/RTGS to HDFC Bank A/C: 50200084930219 (IFSC: HDFC0001755).</p>
            <p>This is a computer-generated tax invoice verified by Digitalness CRM Financial Ledger.</p>
          </div>
          <button class="no-print" onclick="window.print()" style="margin-top: 24px; padding: 10px 24px; background: #0f172a; color: #fff; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 14px;">
            Print / Save as PDF
          </button>
        </body>
      </html>
    `);
    win.document.close();
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      toast({
        title: "Customer Required",
        description: "Please select a customer first.",
        variant: "destructive",
      });
      return;
    }

    const numAmount = Number(invoiceForm.amount);
    if (!numAmount || numAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid invoice amount greater than ₹0.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmittingInvoice(true);
      const token = localStorage.getItem("token") || localStorage.getItem("authToken");
      const invNumber = invoiceForm.invoiceNumber.trim() || `INV-${Date.now().toString().slice(-6)}`;

      const isPaid = invoiceForm.paymentStatus === "PAID";
      const isPartial = invoiceForm.paymentStatus === "PARTIALLY_PAID";
      const resolvedPaidAmt = isPaid
        ? numAmount
        : isPartial
          ? Number(invoiceForm.paidAmount || 0)
          : 0;

      let res;
      if (invoiceDocumentFile) {
        const formData = new FormData();
        formData.append("customerId", selectedCustomerId);
        formData.append("invoiceNumber", invNumber);
        formData.append("amount", String(numAmount));
        formData.append("paidAmount", String(resolvedPaidAmt));
        formData.append("paymentStatus", invoiceForm.paymentStatus);
        formData.append("paymentMethod", invoiceForm.paymentMethod);
        formData.append("reference", invoiceForm.reference.trim());
        formData.append("dueDate", invoiceForm.dueDate || new Date(Date.now() + 7 * 86400000).toISOString());
        formData.append("notes", invoiceForm.notes.trim());
        formData.append(
          "items",
          JSON.stringify([
            {
              description: invoiceForm.description.trim() || "Agency Marketing & Retainer Services",
              quantity: 1,
              unitPrice: numAmount,
              total: numAmount,
            },
          ])
        );
        formData.append("document", invoiceDocumentFile);

        res = await fetch(`${API_URL}/invoices`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });
      } else {
        const payload = {
          customerId: selectedCustomerId,
          invoiceNumber: invNumber,
          amount: numAmount,
          paidAmount: resolvedPaidAmt,
          paymentStatus: invoiceForm.paymentStatus,
          paymentMethod: invoiceForm.paymentMethod,
          reference: invoiceForm.reference.trim(),
          dueDate: invoiceForm.dueDate || new Date(Date.now() + 7 * 86400000).toISOString(),
          notes: invoiceForm.notes.trim(),
          items: [
            {
              description: invoiceForm.description.trim() || "Agency Marketing & Retainer Services",
              quantity: 1,
              unitPrice: numAmount,
              total: numAmount,
            },
          ],
        };

        res = await fetch(`${API_URL}/invoices`, {
          method: "POST",
          headers: getAuthConfig().headers,
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to create invoice");
      }

      const resData = await res.json().catch(() => ({}));
      const createdInv = resData.data || {};

      addInvoice({
        id: createdInv._id || `INV-${Date.now()}`,
        invoiceNumber: invNumber,
        customerId: selectedCustomerId,
        customerName: getCustomerName(customer),
        items: [
          {
            id: `ITEM-${Date.now()}`,
            description: invoiceForm.description || "Agency Retainer & Marketing Services",
            quantity: 1,
            rate: numAmount,
            amount: numAmount,
          },
        ],
        subtotal: numAmount,
        tax: 0,
        discount: 0,
        total: numAmount,
        status: isPaid ? "Paid" : "Sent",
        createdDate: new Date().toISOString().split("T")[0],
        dueDate: invoiceForm.dueDate,
        paidAmount: resolvedPaidAmt,
        notes: invoiceForm.notes,
      });

      if (isPaid) {
        addPaymentRecord({
          id: `PAY-${Date.now()}`,
          customerId: selectedCustomerId,
          invoiceId: createdInv._id || undefined,
          amount: numAmount,
          date: new Date().toISOString().split("T")[0],
          method: (invoiceForm.paymentMethod as any) || "Bank Transfer",
          reference: invoiceForm.reference || `REC-${Date.now().toString().slice(-6)}`,
          status: "Completed",
          notes: `Settled on invoice creation (${invNumber})`,
        });
      }

      toast({
        title: isPaid ? "Invoice Created (Marked Paid)" : "Invoice Created",
        description: `Invoice ${invNumber} for ₹${numAmount.toLocaleString("en-IN")} recorded as ${isPaid ? "Paid & Cleared" : invoiceForm.paymentStatus}.`,
      });

      setShowAddInvoiceModal(false);
      setInvoiceForm({
        invoiceNumber: "",
        amount: "",
        paymentStatus: "PAID",
        paidAmount: "",
        paymentMethod: "Bank Transfer",
        reference: "",
        dueDate: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
        description: "Monthly Digital Marketing & Agency Retainer",
        notes: "",
      });
      setInvoiceDocumentFile(null);

      await fetchBackendData();
      if (selectedCustomerId) {
        await fetchCustomerFinancials(selectedCustomerId);
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to create invoice.",
        variant: "destructive",
      });
    } finally {
      setSubmittingInvoice(false);
    }
  };

  const handleOpenAlertModal = (targetInvoice?: any) => {
    if (targetInvoice) {
      const totalVal = Number(targetInvoice.total || targetInvoice.originalAmount || targetInvoice.amount || 0);
      const paidVal = Number(targetInvoice.paidAmount || 0);
      const balVal = targetInvoice.balanceAmount !== undefined ? Number(targetInvoice.balanceAmount) : Math.max(0, totalVal - paidVal);
      const isPaid =
        targetInvoice.paymentStatus === "PAID" ||
        targetInvoice.paymentStatus === "Paid" ||
        targetInvoice.status === "Paid" ||
        balVal === 0 ||
        (paidVal > 0 && paidVal >= totalVal);

      if (isPaid) {
        toast({
          title: "Invoice Already Settled",
          description: `Invoice ${targetInvoice.invoiceNumber || ""} is already fully paid. No alert is needed.`,
        });
        return;
      }
    } else if (overview.pendingAmount <= 0) {
      toast({
        title: "No Pending Dues",
        description: `${getCustomerName(customer)} has no outstanding balance due.`,
      });
      return;
    }

    const custName = getCustomerName(customer);
    const phone = Array.isArray(customer?.contactNumbers)
      ? customer.contactNumbers[0]
      : customer?.phone || customer?.contactNumber || "";
    const email = customer?.email || "";

    const defaultAmount = targetInvoice
      ? Number(targetInvoice.balanceAmount || targetInvoice.total || targetInvoice.originalAmount || 0)
      : overview.pendingAmount || 0;

    const defaultDueDate = targetInvoice?.dueDate
      ? new Date(targetInvoice.dueDate).toISOString().split("T")[0]
      : new Date(Date.now() + 3 * 86400000).toISOString().split("T")[0];

    const invNum = targetInvoice?.invoiceNumber || (targetInvoice ? `INV-${String(targetInvoice._id || targetInvoice.id).slice(-4)}` : "");

    const templateMsg = `Dear ${custName},\n\nThis is a friendly reminder from Digitalness Media that a payment of ₹${defaultAmount.toLocaleString("en-IN")}${invNum ? ` for Invoice ${invNum}` : ""} is due on ${formatDate(defaultDueDate)}.\n\nKindly complete the settlement via Corporate UPI (digitalness@hdfcbank) or Bank Transfer (HDFC Bank Ltd, Account: 50200084930219, IFSC: HDFC0001755).\n\nIf you have already paid, please disregard this notice. Thank you! - Digitalness Team`;

    setAlertForm({
      customerId: selectedCustomerId,
      invoiceId: targetInvoice?._id || targetInvoice?.id || "",
      amount: String(defaultAmount),
      dueDate: defaultDueDate,
      channel: "WhatsApp",
      recipientName: custName,
      recipientPhone: phone,
      recipientEmail: email,
      customMessage: templateMsg,
    });

    setShowAlertModal(true);
  };


  const handleSendDueAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      toast({
        title: "Customer Required",
        description: "Please select a customer first.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSendingAlert(true);
      const res = await fetch(`${API_URL}/invoices/send-alert`, {
        method: "POST",
        headers: getAuthConfig().headers,
        body: JSON.stringify({
          customerId: selectedCustomerId,
          invoiceId: alertForm.invoiceId || undefined,
          dueAmount: Number(alertForm.amount),
          dueDate: alertForm.dueDate,
          channel: alertForm.channel,
          recipientName: alertForm.recipientName,
          recipientPhone: alertForm.recipientPhone,
          recipientEmail: alertForm.recipientEmail,
          customMessage: alertForm.customMessage,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to dispatch payment due alert");
      }

      toast({
        title: "Payment Alert Sent",
        description: `Dispatched payment due alert via ${alertForm.channel} to ${alertForm.recipientName}!`,
      });

      setShowAlertModal(false);
      await fetchBackendData();
    } catch (err: any) {
      toast({
        title: "Alert Notice",
        description: err.message || "Alert dispatched.",
      });
      setShowAlertModal(false);
    } finally {
      setSendingAlert(false);
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm("Are you sure you want to delete this payment record? Balances will be recalculated.")) {
      return;
    }

    try {
      setDeletingPaymentId(paymentId);
      const res = await fetch(`${API_URL}/payments/${paymentId}`, {
        method: "DELETE",
        headers: getAuthConfig().headers,
      });

      if (res.ok) {
        toast({ title: "Payment Removed", description: "Payment record was deleted and balances synced." });
        await fetchBackendData();
        if (selectedCustomerId) {
          await fetchCustomerFinancials(selectedCustomerId);
        }
      } else {
        toast({ title: "Error", description: "Failed to delete payment record.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Could not reach server.", variant: "destructive" });
    } finally {
      setDeletingPaymentId(null);
    }
  };

  const [markingInvoicePaidId, setMarkingInvoicePaidId] = useState<string | null>(null);

  const handleMarkInvoicePaid = async (inv: any) => {
    const invId = inv._id || inv.id;
    if (!invId) return;

    try {
      setMarkingInvoicePaidId(invId);
      const res = await fetch(`${API_URL}/invoices/${invId}/mark-paid`, {
        method: "PATCH",
        headers: getAuthConfig().headers,
        body: JSON.stringify({ method: "Bank Transfer" }),
      });

      if (res.ok) {
        toast({
          title: "Invoice Settled & Cleared",
          description: `Invoice ${inv.invoiceNumber || ""} is now marked as Paid with ₹0 balance.`,
        });
        updateInvoice(invId, {
          paidAmount: Number(inv.total || inv.originalAmount || inv.amount || 0),
          status: "Paid",
        });
        await fetchBackendData();
        if (selectedCustomerId) {
          await fetchCustomerFinancials(selectedCustomerId);
        }
      } else {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to mark invoice as paid on server");
      }
    } catch (err: any) {
      updateInvoice(invId, {
        paidAmount: Number(inv.total || inv.originalAmount || inv.amount || 0),
        status: "Paid",
      });
      toast({
        title: "Invoice Settled (Local Mode)",
        description: `Invoice marked as Paid with ₹0 balance.`,
      });
      await fetchBackendData();
    } finally {
      setMarkingInvoicePaidId(null);
    }
  };

  const getCustomerId = (customer: any) => customer?._id || customer?.id;

  const getCustomerName = (customer: any) =>
    customer?.name || customer?.customerName || customer?.clientName || customer?.companyName || "Unnamed Customer";

  const getWorkCustomerId = (work: any) =>
    work?.customer?._id || work?.customer?.id || work?.customer || work?.customerId;

  const getAssignedUsers = (assignedTo: any) => {
    if (!assignedTo) return [];
    const assignedArray = Array.isArray(assignedTo) ? assignedTo : [assignedTo];

    return assignedArray.map((user: any) => {
      if (typeof user === "object") {
        return {
          id: user._id || user.id,
          name: user.name || user.fullName || user.username || user.email || "Unassigned",
          role: user.role || user.designation || user.department || "Employee",
          email: user.email || "",
        };
      }

      const found = employees.find(
        (emp: any) => String(emp._id || emp.id) === String(user)
      );

      return {
        id: user,
        name: found?.name || found?.fullName || found?.username || found?.email || "Unassigned",
        role: found?.role || found?.designation || found?.department || "Employee",
        email: found?.email || "",
      };
    });
  };

  const customer = customers.find(
    (c) => String(getCustomerId(c)) === String(selectedCustomerId)
  );

  const allInvoices = backendInvoices.length > 0 ? backendInvoices : localInvoices || [];
  const allPayments = backendPayments.length > 0 ? backendPayments : paymentRecords || [];

  const customerWorks = useMemo(() => {
    return works
      .filter((work) => String(getWorkCustomerId(work)) === String(selectedCustomerId))
      .map((work) => {
        const deliverables = Number(work.deliverables || 1);
        const completedDeliverables = Number(work.completedDeliverables || 0);
        const progress = deliverables
          ? Math.min(Math.round((completedDeliverables / deliverables) * 100), 100)
          : Number(work.progressPercentage || work.progress || 0);

        return {
          id: work._id || work.id,
          title: work.title || "Untitled Work",
          category: work.workType || work.type || "General",
          status: work.status || "Pending",
          priority: work.priority || "Medium",
          dueDate: work.dueDate || work.deadline || "",
          completedDate: work.status === "Completed" ? work.updatedAt || work.completedDate : null,
          progress,
          deliverables,
          completedDeliverables,
          description: work.description || "",
          assignedUsers: getAssignedUsers(work.assignedTo),
          attachments: Array.isArray(work.attachments) ? work.attachments : [],
          updates: Array.isArray(work.updates) ? work.updates : [],
          comments: Array.isArray(work.comments) ? work.comments : [],
        };
      });
  }, [works, selectedCustomerId, employees]);

  const customerInvoices = useMemo(() => {
    return allInvoices.filter((invoice: any) => {
      const invoiceCustomerId =
        invoice.customer?._id || invoice.customer?.id || invoice.customer || invoice.customerId;
      return String(invoiceCustomerId) === String(selectedCustomerId);
    });
  }, [allInvoices, selectedCustomerId]);

  const customerPayments = useMemo(() => {
    return allPayments.filter((payment: any) => {
      const paymentCustomerId =
        payment.customer?._id || payment.customer?.id || payment.customer || payment.customerId;
      return String(paymentCustomerId) === String(selectedCustomerId);
    });
  }, [allPayments, selectedCustomerId]);

  const pendingInvoices = useMemo(() => {
    return customerInvoices.filter((inv: any) => {
      const totalVal = Number(inv.total || inv.originalAmount || inv.amount || 0);
      const paidVal = Number(inv.paidAmount || 0);
      const balVal = inv.balanceAmount !== undefined ? Number(inv.balanceAmount) : Math.max(0, totalVal - paidVal);
      const isPaid =
        inv.paymentStatus === "PAID" ||
        inv.paymentStatus === "Paid" ||
        inv.status === "Paid" ||
        balVal === 0 ||
        (paidVal > 0 && paidVal >= totalVal);
      return !isPaid && balVal > 0;
    });
  }, [customerInvoices]);

  const pendingPayments = useMemo(() => {
    return customerPayments.filter((p: any) => {
      const s = String(p.status || "").toLowerCase();
      return s.includes("pending");
    });
  }, [customerPayments]);

  const filteredWorks = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return customerWorks.filter(
      (work) =>
        work.title.toLowerCase().includes(q) ||
        work.category.toLowerCase().includes(q) ||
        work.status.toLowerCase().includes(q)
    );
  }, [customerWorks, searchQuery]);

  const uniqueTeam = useMemo(() => {
    const map = new Map<string, any>();
    customerWorks.forEach((work) => {
      work.assignedUsers.forEach((user: any) => {
        if (user.id && !map.has(String(user.id))) map.set(String(user.id), user);
      });
    });
    return Array.from(map.values());
  }, [customerWorks]);

  const overview = useMemo(() => {
    const total = customerWorks.length;
    const completed = customerWorks.filter((w) => w.status === "Completed").length;
    const inProgress = customerWorks.filter((w) => w.status === "In Progress").length;
    const review = customerWorks.filter((w) => w.status === "Review").length;
    const pending = customerWorks.filter((w) => ["Pending", "Not Started"].includes(w.status)).length;
    const overdue = customerWorks.filter(
      (w) => w.dueDate && new Date(w.dueDate) < new Date() && w.status !== "Completed"
    ).length;
    const avgProgress = total
      ? Math.round(
        customerWorks.reduce((acc: number, curr: any) => acc + Number(curr.progress || 0), 0) / total
      )
      : 0;
    const paymentsTotal = customerPayments.reduce((sum: number, p: any) => sum + Number(p.amount || p.paidAmount || 0), 0);
    const invoicesPaidTotal = customerInvoices.reduce((sum: number, inv: any) => {
      const totalVal = Number(inv.total || inv.originalAmount || inv.amount || 0);
      const paidVal = Number(inv.paidAmount || 0);
      const balVal = inv.balanceAmount !== undefined ? Number(inv.balanceAmount) : Math.max(0, totalVal - paidVal);
      const isPaid =
        inv.paymentStatus === "PAID" ||
        inv.paymentStatus === "Paid" ||
        inv.status === "Paid" ||
        balVal === 0 ||
        (paidVal > 0 && paidVal >= totalVal);
      return sum + (isPaid ? Math.max(paidVal, totalVal) : paidVal);
    }, 0);
    const paid = Math.max(paymentsTotal, invoicesPaidTotal);
    const invoiceTotal = customerInvoices.reduce((sum: number, inv: any) => sum + Number(inv.total || inv.amount || inv.grandTotal || inv.originalAmount || 0), 0);
    const pendingAmount = customerInvoices.reduce((sum: number, inv: any) => {
      const totalVal = Number(inv.total || inv.originalAmount || inv.amount || 0);
      const paidVal = Number(inv.paidAmount || 0);
      const balVal = inv.balanceAmount !== undefined ? Number(inv.balanceAmount) : Math.max(0, totalVal - paidVal);
      const isPaid =
        inv.paymentStatus === "PAID" ||
        inv.paymentStatus === "Paid" ||
        inv.status === "Paid" ||
        inv.status === "PAID" ||
        balVal === 0 ||
        (paidVal > 0 && paidVal >= totalVal);
      if (isPaid) return sum;
      return sum + balVal;
    }, 0);

    return {
      total,
      completed,
      inProgress,
      review,
      pending,
      overdue,
      avgProgress,
      paid,
      invoiceTotal,
      pendingAmount,
      teamCount: uniqueTeam.length,
    };
  }, [customerWorks, customerInvoices, customerPayments, uniqueTeam]);


  const statusChartData = useMemo(
    () => [
      { name: "Completed", value: overview.completed },
      { name: "In Progress", value: overview.inProgress },
      { name: "Review", value: overview.review },
      { name: "Pending", value: overview.pending },
      { name: "Overdue", value: overview.overdue },
    ].filter((item) => item.value > 0),
    [overview]
  );

  const progressChartData = useMemo(() => {
    return customerWorks.map((work) => ({
      name: work.title.length > 14 ? `${work.title.slice(0, 14)}...` : work.title,
      progress: work.progress,
    }));
  }, [customerWorks]);

  const reportSummary = useMemo(
    () => ({
      client: getCustomerName(customer),
      company: customer?.companyName || customer?.businessName || "-",
      email: customer?.email || "-",
      phone: Array.isArray(customer?.contactNumbers)
        ? customer.contactNumbers.join(", ")
        : customer?.phone || customer?.contactNumber || "-",
      businessType: customer?.businessType || "-",
      branch: customer?.branchId || "-",
      generatedOn: new Date().toLocaleString("en-IN"),
      range: `${formatDate(reportRange.fromDate)} - ${formatDate(reportRange.toDate)}`,
      totalWorks: overview.total,
      completedWorks: overview.completed,
      avgProgress: overview.avgProgress,
      teamCount: overview.teamCount,
      paid: overview.paid,
      pendingAmount: overview.pendingAmount,
    }),
    [customer, overview, reportRange]
  );

  const callReportApi = async (endpoint: string, label: string) => {
    try {
      if (!selectedCustomerId) return;
      setReportLoading(label);

      const res = await fetch(endpoint, getAuthConfig());

      if (!res.ok) {
        throw new Error("Report API not available yet");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${label}-${getCustomerName(customer)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast({ title: "Report Downloaded", description: `${label} downloaded successfully` });
    } catch {
      printClientReport(label);
    } finally {
      setReportLoading(null);
    }
  };

  const printClientReport = (label: string) => {
    const rows = customerWorks
      .map(
        (work) => `
          <tr>
            <td>${work.title}</td>
            <td>${work.category}</td>
            <td>${work.status}</td>
            <td>${work.progress}%</td>
            <td>${work.assignedUsers.map((u: any) => u.name).join(", ") || "-"}</td>
            <td>${formatDate(work.dueDate)}</td>
          </tr>`
      )
      .join("");

    const win = window.open("", "_blank");
    if (!win) return;

    win.document.write(`
      <html>
        <head>
          <title>${label}</title>
          <style>
            body{font-family:Arial,sans-serif;margin:0;padding:32px;color:#111827;background:#fff}
            .header{border-bottom:3px solid #06053A;padding-bottom:18px;margin-bottom:24px}
            .brand{font-size:28px;font-weight:800;color:#06053A;margin:0}
            .sub{color:#6b7280;margin:4px 0 0}
            .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin:20px 0}
            .card{border:1px solid #e5e7eb;border-radius:12px;padding:14px;background:#f9fafb}
            .card b{font-size:20px;color:#06053A}
            table{width:100%;border-collapse:collapse;margin-top:18px;font-size:13px}
            th{background:#06053A;color:white;text-align:left;padding:10px;border:1px solid #06053A}
            td{padding:10px;border:1px solid #e5e7eb;vertical-align:top}
            .section{margin-top:24px}
            .footer{margin-top:32px;font-size:12px;color:#6b7280;border-top:1px solid #e5e7eb;padding-top:12px}
            @media print{body{padding:20px}.no-print{display:none}}
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="brand">Digitalness Industries LLP</h1>
            <p class="sub">Professional Client Work Report</p>
          </div>

          <h2>${label}</h2>
          <p><b>Client:</b> ${reportSummary.client}</p>
          <p><b>Company:</b> ${reportSummary.company}</p>
          <p><b>Email:</b> ${reportSummary.email}</p>
          <p><b>Phone:</b> ${reportSummary.phone}</p>
          <p><b>Business Type:</b> ${reportSummary.businessType}</p>
          <p><b>Branch:</b> ${reportSummary.branch}</p>
          <p><b>Date Range:</b> ${reportSummary.range}</p>

          <div class="grid">
            <div class="card"><b>${reportSummary.totalWorks}</b><br/>Total Works</div>
            <div class="card"><b>${reportSummary.completedWorks}</b><br/>Completed</div>
            <div class="card"><b>${reportSummary.avgProgress}%</b><br/>Avg Progress</div>
            <div class="card"><b>${formatMoney(reportSummary.pendingAmount)}</b><br/>Pending Amount</div>
          </div>

          <div class="section">
            <h3>Project / Work Progress</h3>
            <table>
              <thead>
                <tr>
                  <th>Work</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Progress</th>
                  <th>Assigned Team</th>
                  <th>Due Date</th>
                </tr>
              </thead>
              <tbody>${rows || `<tr><td colspan="6">No works found</td></tr>`}</tbody>
            </table>
          </div>

          <div class="footer">
            Generated on ${reportSummary.generatedOn} · Digitalness CRM
          </div>
          <button class="no-print" onclick="window.print()" style="margin-top:20px;padding:10px 16px;background:#06053A;color:white;border:0;border-radius:8px">Print / Save PDF</button>
        </body>
      </html>
    `);
    win.document.close();
  };

  const downloadReport = (type: "daily" | "weekly" | "monthly" | "project" | "payment") => {
    const params = new URLSearchParams({
      fromDate: reportRange.fromDate,
      toDate: reportRange.toDate,
    });

    const endpoints: Record<string, string> = {
      daily: `${API_URL}/reports/customer/${selectedCustomerId}/daily?${params}`,
      weekly: `${API_URL}/reports/customer/${selectedCustomerId}/weekly?${params}`,
      monthly: `${API_URL}/reports/customer/${selectedCustomerId}/monthly?${params}`,
      project: `${API_URL}/reports/customer/${selectedCustomerId}/projects?${params}`,
      payment: `${API_URL}/reports/customer/${selectedCustomerId}/payments?${params}`,
    };

    const labels: Record<string, string> = {
      daily: "Daily Client Report",
      weekly: "Weekly Client Report",
      monthly: "Monthly Client Report",
      project: "Project Progress Report",
      payment: "Payment Report",
    };

    callReportApi(endpoints[type], labels[type]);
  };

  const StatCard = ({ title, value, icon: Icon, className }: any) => (
    <div className={cn("rounded-2xl border bg-card p-4 shadow-sm", className)}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-sm text-muted-foreground">{title}</p>
        </div>
        <div className="rounded-xl bg-muted p-3">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
      </div>
    </div>
  );

  const WorkCard = ({ work }: { work: any }) => (
    <div className="rounded-2xl border bg-card p-4 shadow-sm transition hover:shadow-md">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="font-semibold text-foreground">{work.title}</h3>
          <p className="text-sm text-muted-foreground">{work.category}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant={getStatusVariant(work.status)}>{work.status}</Badge>
          <Badge variant="outline">{work.priority}</Badge>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Progress</span>
          <span>{work.progress}%</span>
        </div>
        <Progress value={work.progress} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
        <div>
          <p className="text-muted-foreground">Due Date</p>
          <p className="font-medium">{formatDate(work.dueDate)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Deliverables</p>
          <p className="font-medium">
            {work.completedDeliverables}/{work.deliverables}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Team</p>
          <p className="font-medium">{work.assignedUsers.length} member(s)</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {work.assignedUsers.slice(0, 3).map((user: any) => (
          <Badge key={user.id} variant="secondary">
            {user.name}
          </Badge>
        ))}
      </div>

      <Button className="mt-4 w-full" variant="outline" onClick={() => setSelectedWork(work)}>
        View Details
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/30 p-3 sm:p-5 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border bg-card p-5 shadow-sm lg:p-6"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <p className="text-sm font-medium text-primary">Client Portal</p>
              </div>
              <h1 className="mt-2 text-2xl font-bold text-foreground lg:text-3xl">
                {getCustomerName(customer)} Dashboard
              </h1>
              <p className="mt-1 text-muted-foreground">
                Track projects, team, reports, invoices, payments and downloads in one place.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {isClientUser ? (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>Verified Client Desk · {getCustomerName(customer)}</span>
                </div>
              ) : (
                <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                  <SelectTrigger className="w-full sm:w-[280px]">
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={getCustomerId(c)} value={getCustomerId(c)}>
                        {getCustomerName(c)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Button variant="outline" onClick={fetchBackendData} disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                Refresh
              </Button>
            </div>
          </div>

          <div className="mt-5 flex gap-2 overflow-x-auto pb-1 sm:flex-wrap no-scrollbar">
            {NAV.map((item) => {
              const Icon = item.icon;
              const count =
                item.key === "pending"
                  ? pendingInvoices.length
                  : item.key === "proposals"
                    ? proposals.length
                    : item.key === "invoices"
                      ? customerInvoices.length
                      : item.key === "payments"
                        ? customerPayments.length
                        : null;

              return (
                <Button
                  key={item.key}
                  variant={active === item.key ? "default" : "outline"}
                  className="justify-start shrink-0 text-xs sm:text-sm h-9 sm:h-10 relative"
                  onClick={() => setActive(item.key)}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  <span>{item.label}</span>
                  {count !== null && count > 0 && (
                    <span
                      className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${item.key === "pending"
                          ? "bg-amber-500 text-slate-950 font-black"
                          : active === item.key
                            ? "bg-white/20 text-white"
                            : "bg-muted text-muted-foreground"
                        }`}
                    >
                      {count}
                    </span>
                  )}
                </Button>
              );
            })}
          </div>

        </motion.div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <StatCard title="Total Projects" value={overview.total} icon={FileText} />
          <StatCard title="Completed" value={overview.completed} icon={CheckCircle} className="border-success/30 bg-success/10" />
          <StatCard title="In Progress" value={overview.inProgress} icon={Clock} className="border-info/30 bg-info/10" />
          <StatCard title="Avg Progress" value={`${overview.avgProgress}%`} icon={TrendingUp} />
          <StatCard title="Team Members" value={overview.teamCount} icon={Users} />
          <StatCard title="Pending Amount" value={formatMoney(overview.pendingAmount)} icon={IndianRupee} className="border-warning/30 bg-warning/10" />
        </div>

        {active === "overview" && (
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            <div className="rounded-3xl border bg-card p-5 shadow-sm">
              <h2 className="text-lg font-semibold">Project Status Overview</h2>
              <div className="mt-4 h-[300px]">
                {statusChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={statusChartData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label>
                        {statusChartData.map((_, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">No project data</div>
                )}
              </div>
            </div>

            <div className="rounded-3xl border bg-card p-5 shadow-sm">
              <h2 className="text-lg font-semibold">Progress by Project</h2>
              <div className="mt-4 h-[300px]">
                {progressChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={progressChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="progress" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-muted-foreground">No progress data</div>
                )}
              </div>
            </div>
          </div>
        )}

        {active === "team" && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {uniqueTeam.map((member: any) => (
              <div key={member.id} className="rounded-2xl border bg-card p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                    {member.name?.charAt(0) || "U"}
                  </div>
                  <div>
                    <h3 className="font-semibold">{member.name}</h3>
                    <p className="text-sm text-muted-foreground">{member.role}</p>
                  </div>
                </div>
                {member.email && <p className="mt-3 text-sm text-muted-foreground">{member.email}</p>}
              </div>
            ))}
            {uniqueTeam.length === 0 && <EmptyState title="No team assigned yet" />}
          </div>
        )}

        {active === "tasks" && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects, work type or status..."
                className="pl-10"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {filteredWorks.map((work) => <WorkCard key={work.id} work={work} />)}
              {filteredWorks.length === 0 && <EmptyState title="No works found" />}
            </div>
          </div>
        )}

        {active === "proposals" && (
          <div className="space-y-6">
            <div className="rounded-3xl border bg-card p-5 shadow-sm lg:p-6 space-y-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-bold tracking-tight text-foreground">
                      Client Proposals & Agreements
                    </h2>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Review agency project proposals, scope of work, investment schedules, and approved deliverables.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="px-3 py-1 text-xs font-semibold">
                    {proposals.length} Total Proposal{proposals.length !== 1 ? "s" : ""}
                  </Badge>
                </div>
              </div>

              {/* Proposals Stats */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <StatCard
                  title="Total Proposals"
                  value={proposals.length}
                  icon={FileText}
                />
                <StatCard
                  title="Approved / Accepted"
                  value={proposals.filter((p: any) => ["Approved", "Accepted"].includes(p.status)).length}
                  icon={CheckCircle2}
                  className="border-success/30 bg-success/10 text-success"
                />
                <StatCard
                  title="Total Proposal Value"
                  value={formatMoney(proposals.reduce((sum: number, p: any) => sum + Number(p.grandTotal || p.proposalValue || 0), 0))}
                  icon={IndianRupee}
                  className="border-primary/20 bg-primary/5"
                />
              </div>

              {/* Proposals List */}
              {proposals.length === 0 ? (
                <div className="rounded-2xl border border-dashed p-10 text-center space-y-3">
                  <FileText className="mx-auto h-10 w-10 text-muted-foreground/60" />
                  <p className="font-semibold text-foreground">No proposals found</p>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    When project proposals are drafted or issued in the CRM for {getCustomerName(customer)}, they will securely appear here.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border">
                  <table className="w-full text-left text-sm min-w-[700px]">
                    <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th className="p-3.5 font-semibold">Proposal #</th>
                        <th className="p-3.5 font-semibold">Title / Subject</th>
                        <th className="p-3.5 font-semibold">Timeline</th>
                        <th className="p-3.5 font-semibold">Value</th>
                        <th className="p-3.5 font-semibold text-center">Status</th>
                        <th className="p-3.5 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {proposals.map((prop: any, idx: number) => {
                        const val = Number(prop.grandTotal || prop.proposalValue || 0);
                        const isAccepted = ["Approved", "Accepted"].includes(prop.status);
                        return (
                          <tr key={prop._id || idx} className="hover:bg-muted/30 transition-colors">
                            <td className="p-3.5 font-bold font-mono text-xs text-primary">
                              {prop.proposalNumber || `PR-${idx + 1}`}
                            </td>
                            <td className="p-3.5">
                              <div className="font-semibold text-foreground text-xs sm:text-sm">
                                {prop.title || prop.dealId?.dealName || "Agency Service Proposal"}
                              </div>
                              <div className="text-[11px] text-muted-foreground line-clamp-1 max-w-xs mt-0.5">
                                {prop.scopeOfWork || prop.deliverables || "Marketing & digital execution deliverables"}
                              </div>
                            </td>
                            <td className="p-3.5 text-xs text-muted-foreground">
                              {prop.timeline || "Ongoing"}
                            </td>
                            <td className="p-3.5 font-bold text-foreground text-xs sm:text-sm">
                              {formatMoney(val)}
                            </td>
                            <td className="p-3.5 text-center">
                              <Badge
                                variant={
                                  isAccepted
                                    ? "completed"
                                    : prop.status === "Declined" || prop.status === "Rejected"
                                      ? "destructive"
                                      : "secondary"
                                }
                                className="text-[11px]"
                              >
                                {prop.status || "Draft"}
                              </Badge>
                            </td>
                            <td className="p-3.5 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedProposal(prop)}
                                  className="h-8 text-xs gap-1"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                  <span>View Details</span>
                                </Button>
                                {prop.status === "Sent" && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleAcceptProposal(prop._id)}
                                    disabled={acceptingProposalId === prop._id}
                                    className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1"
                                  >
                                    {acceptingProposalId === prop._id ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <CheckCircle2 className="h-3.5 w-3.5" />
                                    )}
                                    <span>Accept</span>
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {active === "pending" && (
          <div className="space-y-6">
            <div className="rounded-3xl border bg-card p-5 shadow-sm lg:p-6 space-y-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-amber-500" />
                    <h2 className="text-xl font-bold tracking-tight text-foreground">
                      Pending Invoices & Unsettled Dues
                    </h2>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Invoices awaiting settlement or payment proof verification. Settle dues or submit UTR reference below.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => {
                      setPaymentForm({
                        amount: String(overview.pendingAmount || ""),
                        method: "UPI",
                        reference: "",
                        invoiceId: pendingInvoices[0]?._id || "",
                        date: new Date().toISOString().split("T")[0],
                        notes: "",
                        sendAlert: true,
                        alertChannel: "WhatsApp",
                        customAlertMessage: "",
                      });
                      setShowAddPaymentModal(true);
                    }}
                    className="gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold shadow-sm"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Submit Manual Payment Proof</span>
                  </Button>
                </div>
              </div>

              {/* Pending Balance KPI Cards */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <StatCard
                  title="Total Balance Due"
                  value={formatMoney(overview.pendingAmount)}
                  icon={Clock}
                  className="border-warning/30 bg-warning/10 text-warning"
                />
                <StatCard
                  title="Unsettled Invoices"
                  value={`${pendingInvoices.length} Pending`}
                  icon={Receipt}
                  className="border-muted bg-card"
                />
                <StatCard
                  title="Payments Awaiting Review"
                  value={`${pendingPayments.length} Submitted`}
                  icon={CreditCard}
                  className="border-info/30 bg-info/10 text-info"
                />
              </div>

              {/* Pending Invoices List */}
              <div className="space-y-3">
                <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span>Outstanding Invoices Awaiting Settlement</span>
                </h3>

                {pendingInvoices.length === 0 ? (
                  <div className="rounded-2xl border border-dashed p-10 text-center space-y-2 bg-emerald-500/5 border-emerald-500/20">
                    <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" />
                    <p className="font-bold text-foreground">All Invoices Cleared!</p>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                      There are no pending payments or outstanding dues for this account. All invoices have been marked as fully paid.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border">
                    <table className="w-full text-left text-sm min-w-[720px]">
                      <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                        <tr>
                          <th className="p-3.5 font-semibold">Invoice #</th>
                          <th className="p-3.5 font-semibold">Issue Date</th>
                          <th className="p-3.5 font-semibold">Due Date</th>
                          <th className="p-3.5 font-semibold">Total Amount</th>
                          <th className="p-3.5 font-semibold text-amber-600 dark:text-amber-400">Balance Due</th>
                          <th className="p-3.5 font-semibold text-center">Status</th>
                          <th className="p-3.5 font-semibold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {pendingInvoices.map((inv: any) => {
                          const totalVal = Number(inv.total || inv.originalAmount || inv.amount || 0);
                          const paidVal = Number(inv.paidAmount || 0);
                          const balVal = inv.balanceAmount !== undefined ? Number(inv.balanceAmount) : Math.max(0, totalVal - paidVal);
                          const isOverdue = inv.dueDate && new Date(inv.dueDate) < new Date();

                          return (
                            <tr key={inv._id || inv.id} className="hover:bg-muted/30 transition-colors">
                              <td className="p-3.5 font-bold font-mono text-xs text-foreground">
                                <div className="flex items-center gap-1.5">
                                  <Receipt className="h-4 w-4 text-amber-500" />
                                  <span>{inv.invoiceNumber}</span>
                                </div>
                              </td>
                              <td className="p-3.5 text-xs text-muted-foreground">
                                {formatDate(inv.invoiceDate || inv.date || inv.createdAt)}
                              </td>
                              <td className="p-3.5 text-xs font-semibold">
                                {inv.dueDate ? (
                                  <span className={isOverdue ? "text-destructive font-bold flex items-center gap-1" : "text-muted-foreground"}>
                                    {isOverdue && <AlertTriangle className="h-3 w-3" />}
                                    {formatDate(inv.dueDate)}
                                  </span>
                                ) : (
                                  "-"
                                )}
                              </td>
                              <td className="p-3.5 font-medium text-xs text-muted-foreground">
                                {formatMoney(totalVal)}
                              </td>
                              <td className="p-3.5 font-bold text-amber-600 dark:text-amber-400 text-sm">
                                {formatMoney(balVal)}
                              </td>
                              <td className="p-3.5 text-center">
                                <Badge variant="warning" className="text-[11px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                                  {isOverdue ? "Overdue" : inv.paymentStatus || "Pending"}
                                </Badge>
                              </td>
                              <td className="p-3.5 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      setPaymentForm({
                                        amount: String(balVal),
                                        method: "UPI",
                                        reference: "",
                                        invoiceId: inv._id || inv.id,
                                        date: new Date().toISOString().split("T")[0],
                                        notes: `Settlement for invoice ${inv.invoiceNumber}`,
                                        sendAlert: true,
                                        alertChannel: "WhatsApp",
                                        customAlertMessage: "",
                                      });
                                      setShowAddPaymentModal(true);
                                    }}
                                    className="h-8 text-xs bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold"
                                  >
                                    Pay Now / Proof
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDownloadInvoice(inv)}
                                    className="h-8 text-xs gap-1"
                                    title="Download invoice document"
                                  >
                                    <Download className="h-3.5 w-3.5" />
                                    <span className="hidden sm:inline">PDF</span>
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Pending Submitted Payments Section */}
              {pendingPayments.length > 0 && (
                <div className="space-y-3 pt-4 border-t">
                  <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
                    <Clock className="h-4 w-4 text-sky-500" />
                    <span>Submitted Payments Awaiting Admin Verification</span>
                  </h3>
                  <div className="overflow-x-auto rounded-xl border">
                    <table className="w-full text-left text-sm min-w-[620px]">
                      <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                        <tr>
                          <th className="p-3.5 font-semibold">UTR / Reference</th>
                          <th className="p-3.5 font-semibold">Date</th>
                          <th className="p-3.5 font-semibold">Method</th>
                          <th className="p-3.5 font-semibold">Amount</th>
                          <th className="p-3.5 font-semibold text-center">Status</th>
                          <th className="p-3.5 font-semibold text-right">Verification Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {pendingPayments.map((payment: any, pIdx: number) => (
                          <tr key={payment._id || pIdx} className="hover:bg-muted/30 transition-colors">
                            <td className="p-3.5 font-mono text-xs font-bold text-foreground">
                              {payment.reference || payment.referenceId || `TXN-${pIdx + 1}`}
                            </td>
                            <td className="p-3.5 text-xs text-muted-foreground">
                              {formatDate(payment.date || payment.paymentDate || payment.createdAt)}
                            </td>
                            <td className="p-3.5 text-xs text-muted-foreground">
                              {payment.method || "UPI"}
                            </td>
                            <td className="p-3.5 font-bold text-foreground">
                              {formatMoney(payment.amount || payment.paidAmount)}
                            </td>
                            <td className="p-3.5 text-center">
                              <Badge variant="warning" className="text-[11px] bg-amber-500/10 text-amber-600 border border-amber-500/30">
                                Awaiting Admin Review
                              </Badge>
                            </td>
                            <td className="p-3.5 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {payment.receiptUrl && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const fullUrl = payment.receiptUrl.startsWith("http")
                                        ? payment.receiptUrl
                                        : `${API_URL.replace("/api", "")}${payment.receiptUrl}`;
                                      window.open(fullUrl, "_blank");
                                    }}
                                    className="h-8 text-xs gap-1 text-primary border-primary/30"
                                  >
                                    <Paperclip className="h-3.5 w-3.5" />
                                    <span>Proof</span>
                                  </Button>
                                )}
                                {!isClientUser && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleVerifyPayment(payment._id || payment.id)}
                                    disabled={verifyingPaymentId === (payment._id || payment.id)}
                                    className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1"
                                  >
                                    {verifyingPaymentId === (payment._id || payment.id) ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <CheckCircle2 className="h-3.5 w-3.5" />
                                    )}
                                    <span>Verify & Approve</span>
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {active === "payments" && (
          <div className="space-y-6">
            <div className="rounded-3xl border bg-card p-5 shadow-sm lg:p-6 space-y-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-bold tracking-tight text-foreground">
                      Client Payments & Transaction Ledger
                    </h2>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Record manual receipts, track verified transactions, and sync instantly with the Client Web Portal.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {overview.pendingAmount > 0 && (
                    <Button
                      variant="outline"
                      onClick={() => handleOpenAlertModal()}
                      className="gap-2 text-warning hover:text-warning border-warning/30 bg-warning/5"
                    >
                      <Bell className="h-4 w-4" />
                      Send Due Alert
                    </Button>
                  )}
                  <Button
                    onClick={() => setShowAddPaymentModal(true)}
                    className="gap-2 shadow-sm font-semibold"
                  >
                    <Plus className="h-4 w-4" />
                    Record Manual Payment
                  </Button>
                </div>

              </div>

              {/* Financial Summary KPI Cards */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  title="Total Invoiced"
                  value={formatMoney(overview.invoiceTotal)}
                  icon={Receipt}
                  className="border-primary/20 bg-primary/5"
                />
                <StatCard
                  title="Settled & Paid"
                  value={formatMoney(overview.paid)}
                  icon={CheckCircle2}
                  className="border-success/30 bg-success/10 text-success"
                />
                <StatCard
                  title="Pending Balance Due"
                  value={formatMoney(overview.pendingAmount)}
                  icon={Clock}
                  className="border-warning/30 bg-warning/10 text-warning"
                />
                <StatCard
                  title="Total Transactions"
                  value={`${customerPayments.length} Payments`}
                  icon={CreditCard}
                  className="border-muted bg-card"
                />
              </div>

              {/* Payments List Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b pb-3">
                  <h3 className="font-semibold text-foreground">Verified Payment Receipts</h3>
                  <span className="text-xs text-muted-foreground">
                    {customerPayments.length} Recorded Payment(s)
                  </span>
                </div>

                {customerPayments.length === 0 ? (
                  <div className="rounded-2xl border border-dashed p-10 text-center space-y-3">
                    <CreditCard className="mx-auto h-10 w-10 text-muted-foreground/60" />
                    <div className="space-y-1">
                      <p className="font-semibold text-foreground">No payments recorded yet</p>
                      <p className="text-xs text-muted-foreground">
                        Click "Record Manual Payment" above to add payment details for {getCustomerName(customer)}.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAddPaymentModal(true)}
                      className="mt-2"
                    >
                      <Plus className="mr-1 h-3.5 w-3.5" />
                      Record First Payment
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border">
                    <table className="w-full text-left text-sm min-w-[620px]">
                      <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">

                        <tr>
                          <th className="p-3.5 font-semibold">Reference / Txn ID</th>
                          <th className="p-3.5 font-semibold">Date</th>
                          <th className="p-3.5 font-semibold">Method</th>
                          <th className="p-3.5 font-semibold">Invoice / Purpose</th>
                          <th className="p-3.5 font-semibold text-right">Amount</th>
                          <th className="p-3.5 font-semibold text-center">Status</th>
                          <th className="p-3.5 font-semibold text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {customerPayments.map((payment: any, index: number) => {
                          const payAmount = Number(payment.amount || payment.paidAmount || 0);
                          const payRef =
                            payment.reference ||
                            payment.referenceId ||
                            payment.title ||
                            `REC-${index + 1}`;
                          const linkedInvoice =
                            payment.invoice?.invoiceNumber ||
                            payment.invoiceNumber ||
                            (payment.invoiceId ? `INV-${String(payment.invoiceId).slice(-4)}` : null);

                          return (
                            <tr
                              key={payment._id || payment.id || index}
                              className="hover:bg-muted/30 transition-colors"
                            >
                              <td className="p-3.5 font-medium font-mono text-xs text-foreground">
                                {payRef}
                              </td>
                              <td className="p-3.5 text-muted-foreground text-xs">
                                {formatDate(payment.date || payment.paymentDate || payment.createdAt)}
                              </td>
                              <td className="p-3.5">
                                <Badge variant="secondary" className="text-xs font-normal">
                                  {payment.method || "Bank Transfer / UPI"}
                                </Badge>
                              </td>
                              <td className="p-3.5 text-xs text-muted-foreground max-w-xs truncate">
                                {linkedInvoice ? (
                                  <Badge variant="outline" className="text-primary font-mono text-[11px]">
                                    {linkedInvoice}
                                  </Badge>
                                ) : (
                                  payment.notes || "Agency Retainer / Service Settlement"
                                )}
                              </td>
                              <td className="p-3.5 text-right font-bold text-success">
                                {formatMoney(payAmount)}
                              </td>
                              <td className="p-3.5 text-center">
                                {String(payment.status || "").toLowerCase().includes("pending") ? (
                                  <Badge variant="warning" className="text-[11px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                                    Pending Verification
                                  </Badge>
                                ) : (
                                  <Badge variant="completed" className="text-[11px]">
                                    {payment.status || "Completed"}
                                  </Badge>
                                )}
                              </td>
                              <td className="p-3.5 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {payment.receiptUrl && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-8 gap-1 text-xs text-primary border-primary/30 hover:bg-primary/10"
                                      onClick={() => {
                                        const fullUrl = payment.receiptUrl.startsWith("http")
                                          ? payment.receiptUrl
                                          : `${API_URL.replace("/api", "")}${payment.receiptUrl}`;
                                        window.open(fullUrl, "_blank");
                                      }}
                                      title="Open and inspect payment receipt proof"
                                    >
                                      <Paperclip className="h-3.5 w-3.5" />
                                      <span className="hidden sm:inline">Receipt</span>
                                    </Button>
                                  )}
                                  {String(payment.status || "").toLowerCase().includes("pending") && !isClientUser && (
                                    <Button
                                      size="sm"
                                      onClick={() => handleVerifyPayment(payment._id || payment.id)}
                                      disabled={verifyingPaymentId === (payment._id || payment.id)}
                                      className="h-8 gap-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                                      title="Verify and approve this payment"
                                    >
                                      {verifyingPaymentId === (payment._id || payment.id) ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                      ) : (
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                      )}
                                      <span>Verify & Approve</span>
                                    </Button>
                                  )}
                                  {payment._id && !isClientUser && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                      onClick={() => handleDeletePayment(payment._id)}
                                      disabled={deletingPaymentId === payment._id}
                                      title="Delete payment entry"
                                    >
                                      {deletingPaymentId === payment._id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <Trash2 className="h-4 w-4" />
                                      )}
                                    </Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {active === "invoices" && (
          <div className="space-y-6">
            <div className="rounded-3xl border bg-card p-5 shadow-sm lg:p-6 space-y-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Receipt className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-bold tracking-tight text-foreground">
                      Client Invoices & Billing Documents
                    </h2>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Create invoices, attach and upload official tax documents/PDFs, and dispatch payment due alerts directly to clients.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {overview.pendingAmount > 0 && (
                    <Button
                      variant="outline"
                      onClick={() => handleOpenAlertModal()}
                      className="gap-2 text-warning hover:text-warning border-warning/30 bg-warning/5"
                    >
                      <Bell className="h-4 w-4" />
                      Send Payment Due Alert
                    </Button>
                  )}
                  <Button
                    onClick={() => setShowAddInvoiceModal(true)}
                    className="gap-2 shadow-sm font-semibold"
                  >
                    <Plus className="h-4 w-4" />
                    Create & Upload Invoice
                  </Button>
                </div>
              </div>

              {/* Financial Invoicing Stats */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <StatCard
                  title="Total Billed"
                  value={formatMoney(overview.invoiceTotal)}
                  icon={Receipt}
                  className="border-primary/20 bg-primary/5"
                />
                <StatCard
                  title="Total Settled"
                  value={formatMoney(overview.paid)}
                  icon={CheckCircle2}
                  className="border-success/30 bg-success/10 text-success"
                />
                <StatCard
                  title="Outstanding Due"
                  value={formatMoney(overview.pendingAmount)}
                  icon={Clock}
                  className="border-warning/30 bg-warning/10 text-warning"
                />
              </div>

              {/* Invoices List Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b pb-3">
                  <h3 className="font-semibold text-foreground">Issued Invoices & Uploaded Files</h3>
                  <span className="text-xs text-muted-foreground">
                    {customerInvoices.length} Invoice(s)
                  </span>
                </div>

                {customerInvoices.length === 0 ? (
                  <div className="rounded-2xl border border-dashed p-10 text-center space-y-3">
                    <Receipt className="mx-auto h-10 w-10 text-muted-foreground/60" />
                    <div className="space-y-1">
                      <p className="font-semibold text-foreground">No invoices generated yet</p>
                      <p className="text-xs text-muted-foreground">
                        Click "Create & Upload Invoice" to issue an invoice with an attached document for {getCustomerName(customer)}.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAddInvoiceModal(true)}
                      className="mt-2"
                    >
                      <Plus className="mr-1 h-3.5 w-3.5" />
                      Create First Invoice
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border">
                    <table className="w-full text-left text-sm min-w-[760px]">
                      <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">

                        <tr>
                          <th className="p-3.5 font-semibold">Invoice #</th>
                          <th className="p-3.5 font-semibold">Issue Date</th>
                          <th className="p-3.5 font-semibold">Due Date</th>
                          <th className="p-3.5 font-semibold">Description</th>
                          <th className="p-3.5 font-semibold">Total Amount</th>
                          <th className="p-3.5 font-semibold">Status</th>
                          <th className="p-3.5 font-semibold">Invoice Document</th>
                          <th className="p-3.5 font-semibold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {customerInvoices.map((inv: any, index: number) => {
                          const totalVal = Number(inv.total || inv.originalAmount || inv.amount || 0);
                          const paidVal = Number(inv.paidAmount || 0);
                          const balVal = inv.balanceAmount !== undefined ? Number(inv.balanceAmount) : Math.max(0, totalVal - paidVal);
                          const isPaid =
                            inv.paymentStatus === "PAID" ||
                            inv.paymentStatus === "Paid" ||
                            inv.status === "Paid" ||
                            balVal === 0 ||
                            (paidVal > 0 && paidVal >= totalVal);
                          const docUrl = inv.documentUrl || "";
                          const docName = inv.documentName || "Invoice_Document.pdf";
                          const fullDocUrl = docUrl
                            ? docUrl.startsWith("http")
                              ? docUrl
                              : `${API_URL.replace("/api", "")}${docUrl}`
                            : "";

                          return (
                            <tr
                              key={inv._id || inv.id || index}
                              className="hover:bg-muted/30 transition-colors"
                            >
                              <td className="p-3.5 font-bold font-mono text-xs text-foreground">
                                <div className="flex items-center gap-1.5">
                                  <Receipt className="h-4 w-4 text-primary" />
                                  <span>{inv.invoiceNumber || `INV-${index + 1}`}</span>
                                </div>
                              </td>
                              <td className="p-3.5 text-xs text-muted-foreground">
                                {formatDate(inv.invoiceDate || inv.date || inv.createdAt)}
                              </td>
                              <td className="p-3.5 text-xs font-medium">
                                {inv.dueDate ? (
                                  <span className={!isPaid && new Date(inv.dueDate) < new Date() && balVal > 0 ? "text-destructive font-bold" : "text-muted-foreground"}>
                                    {formatDate(inv.dueDate)}
                                  </span>
                                ) : (
                                  "-"
                                )}
                              </td>
                              <td className="p-3.5 text-xs text-muted-foreground max-w-xs truncate">
                                {inv.notes || inv.items?.[0]?.description || "Agency Retainer & Marketing Services"}
                              </td>
                              <td className="p-3.5 text-xs font-bold text-foreground">
                                <div>{formatMoney(totalVal)}</div>
                                {!isPaid && balVal > 0 && balVal !== totalVal && (
                                  <span className="text-[10px] text-warning font-normal">
                                    Due: {formatMoney(balVal)}
                                  </span>
                                )}
                              </td>
                              <td className="p-3.5">
                                {isPaid ? (
                                  <Badge variant="completed" className="text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                    Paid
                                  </Badge>
                                ) : (
                                  <Badge variant={getStatusVariant(inv.paymentStatus || inv.status)} className="text-[11px]">
                                    {inv.paymentStatus || inv.status || "Pending"}
                                  </Badge>
                                )}
                              </td>
                              <td className="p-3.5">
                                {fullDocUrl ? (
                                  <a
                                    href={fullDocUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-xs font-medium transition"
                                  >
                                    <FileText className="h-3.5 w-3.5" />
                                    <span className="max-w-[120px] truncate">{docName}</span>
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                ) : (
                                  <span className="text-xs text-muted-foreground/60 italic">
                                    No file attached
                                  </span>
                                )}
                              </td>
                              <td className="p-3.5 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDownloadInvoice(inv)}
                                    className="h-8 text-xs gap-1"
                                    title="Download / Print official PDF invoice"
                                  >
                                    <Download className="h-3.5 w-3.5" />
                                    <span className="hidden sm:inline">PDF</span>
                                  </Button>

                                  {isPaid ? (
                                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                                      <CheckCircle2 className="h-3.5 w-3.5" />
                                      <span>Cleared</span>
                                    </span>
                                  ) : isClientUser ? (
                                    <Button
                                      size="sm"
                                      onClick={() => {
                                        setPaymentForm({
                                          amount: String(balVal),
                                          method: "UPI",
                                          reference: "",
                                          invoiceId: inv._id || inv.id,
                                          date: new Date().toISOString().split("T")[0],
                                          notes: `Settlement for invoice ${inv.invoiceNumber}`,
                                          sendAlert: true,
                                          alertChannel: "WhatsApp",
                                          customAlertMessage: "",
                                        });
                                        setShowAddPaymentModal(true);
                                      }}
                                      className="h-8 text-xs bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold"
                                    >
                                      Pay Now
                                    </Button>
                                  ) : (
                                    <>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleMarkInvoicePaid(inv)}
                                        disabled={markingInvoicePaidId === (inv._id || inv.id)}
                                        className="h-8 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 hover:bg-emerald-500/10 border-emerald-500/30 text-xs gap-1"
                                        title="Mark this invoice as fully paid and cleared"
                                      >
                                        {markingInvoicePaidId === (inv._id || inv.id) ? (
                                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                          <CheckCircle2 className="h-3.5 w-3.5" />
                                        )}
                                        <span className="hidden sm:inline">Mark Paid</span>
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleOpenAlertModal(inv)}
                                        className="h-8 text-warning hover:text-warning hover:bg-warning/10 text-xs gap-1"
                                        title="Send payment due reminder for this invoice"
                                      >
                                        <Bell className="h-3.5 w-3.5" />
                                        <span className="hidden sm:inline">Alert</span>
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

              </div>
            </div>
          </div>
        )}

        {active === "reports" && (
          <div className="space-y-5">
            <div className="rounded-3xl border bg-card p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <h2 className="text-lg font-semibold">Client Reports</h2>
                  <p className="text-sm text-muted-foreground">
                    Generate daily, weekly, monthly, project, payment and performance reports.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <p className="mb-1 text-xs text-muted-foreground">Report Type</p>
                    <Select value={reportType} onValueChange={setReportType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="project">Project</SelectItem>
                        <SelectItem value="payment">Payment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <p className="mb-1 text-xs text-muted-foreground">From</p>
                    <Input
                      type="date"
                      value={reportRange.fromDate}
                      onChange={(e) => setReportRange({ ...reportRange, fromDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <p className="mb-1 text-xs text-muted-foreground">To</p>
                    <Input
                      type="date"
                      value={reportRange.toDate}
                      onChange={(e) => setReportRange({ ...reportRange, toDate: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
                <ReportButton title="Daily Report" type="daily" onClick={downloadReport} loading={reportLoading} />
                <ReportButton title="Weekly Report" type="weekly" onClick={downloadReport} loading={reportLoading} />
                <ReportButton title="Monthly Report" type="monthly" onClick={downloadReport} loading={reportLoading} />
                <ReportButton title="Project Report" type="project" onClick={downloadReport} loading={reportLoading} />
                <ReportButton title="Payment Report" type="payment" onClick={downloadReport} loading={reportLoading} />
              </div>
            </div>

            <div className="rounded-3xl border bg-card p-5 shadow-sm">
              <h2 className="text-lg font-semibold">Report Preview</h2>
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <PreviewItem label="Client" value={reportSummary.client} />
                <PreviewItem label="Company" value={reportSummary.company} />
                <PreviewItem label="Total Works" value={reportSummary.totalWorks} />
                <PreviewItem label="Average Progress" value={`${reportSummary.avgProgress}%`} />
                <PreviewItem label="Completed Works" value={reportSummary.completedWorks} />
                <PreviewItem label="Team Members" value={reportSummary.teamCount} />
                <PreviewItem label="Paid Amount" value={formatMoney(reportSummary.paid)} />
                <PreviewItem label="Pending Amount" value={formatMoney(reportSummary.pendingAmount)} />
              </div>
            </div>
          </div>
        )}

        {active === "downloads" && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <DownloadCard title="Complete Client PDF" desc="Full client overview with projects, team and payments." onClick={() => printClientReport("Complete Client Report")} />
            <DownloadCard title="Work History PDF" desc="All works, progress, assigned employees and status." onClick={() => downloadReport("project")} />
            <DownloadCard title="Monthly Report PDF" desc="Monthly project and performance summary." onClick={() => downloadReport("monthly")} />
            <DownloadCard title="Payment Report PDF" desc="Invoice total, paid amount and pending balance." onClick={() => downloadReport("payment")} />
          </div>
        )}
      </div>

      <Dialog open={Boolean(selectedWork)} onOpenChange={() => setSelectedWork(null)}>
        <DialogContent className="max-h-[90vh] w-[95vw] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Work Details</DialogTitle>
          </DialogHeader>
          {selectedWork && (
            <div className="space-y-5">
              <div className="rounded-2xl border bg-muted/30 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-xl font-bold">{selectedWork.title}</h2>
                    <p className="text-muted-foreground">{selectedWork.category}</p>
                  </div>
                  <Badge variant={getStatusVariant(selectedWork.status)}>{selectedWork.status}</Badge>
                </div>
                <div className="mt-4">
                  <div className="mb-2 flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{selectedWork.progress}%</span>
                  </div>
                  <Progress value={selectedWork.progress} />
                </div>
                <p className="mt-4 whitespace-pre-line text-sm">{selectedWork.description || "No description added"}</p>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <PreviewItem label="Due Date" value={formatDate(selectedWork.dueDate)} />
                <PreviewItem label="Deliverables" value={`${selectedWork.completedDeliverables}/${selectedWork.deliverables}`} />
                <PreviewItem label="Priority" value={selectedWork.priority} />
              </div>

              <div className="rounded-2xl border p-4">
                <h3 className="font-semibold">Assigned Team</h3>
                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                  {selectedWork.assignedUsers.map((user: any) => (
                    <div key={user.id} className="rounded-xl bg-muted/40 p-3">
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.role}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border p-4">
                <h3 className="font-semibold">Attachments</h3>
                <div className="mt-3 space-y-2">
                  {selectedWork.attachments.length === 0 && <p className="text-sm text-muted-foreground">No attachments found</p>}
                  {selectedWork.attachments.map((file: any, index: number) => {
                    const url = file.fileUrl || file.url || file;
                    const name = file.fileName || String(url).split("/").pop() || `Attachment ${index + 1}`;
                    return (
                      <div key={index} className="flex flex-col gap-2 rounded-xl bg-muted/40 p-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="font-medium">{name}</p>
                        {url && (
                          <a className="text-sm text-primary underline" href={url} target="_blank" rel="noreferrer">
                            Open
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Manual Payment Entry Dialog */}
      <Dialog open={showAddPaymentModal} onOpenChange={setShowAddPaymentModal}>
        <DialogContent className="w-[95vw] sm:max-w-lg max-h-[88vh] sm:max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl font-bold">
              <CreditCard className="h-5 w-5 text-primary shrink-0" />
              Record Manual Payment
            </DialogTitle>
            <p className="text-xs text-muted-foreground">
              Add payment details for <strong className="text-foreground">{getCustomerName(customer)}</strong>.
              This will automatically update customer balances and reflect in the Client Web Portal.
            </p>
          </DialogHeader>

          <form onSubmit={handleRecordPayment} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-1">
                <Label htmlFor="pay-amount">Amount (₹) *</Label>
                {overview.pendingAmount > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      setPaymentForm((prev) => ({
                        ...prev,
                        amount: String(overview.pendingAmount),
                      }))
                    }
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    Set Full Due: {formatMoney(overview.pendingAmount)}
                  </button>
                )}
              </div>
              <Input
                id="pay-amount"
                type="number"
                min="1"
                placeholder="e.g. 50000"
                value={paymentForm.amount}
                onChange={(e) =>
                  setPaymentForm((prev) => ({ ...prev, amount: e.target.value }))
                }
                required
                className="font-mono text-base font-semibold"
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[10000, 25000, 50000, 75000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() =>
                      setPaymentForm((prev) => ({
                        ...prev,
                        amount: String(preset),
                      }))
                    }
                    className="rounded-md border bg-muted/50 px-2 py-1 text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition"
                  >
                    +₹{preset.toLocaleString("en-IN")}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="pay-date">Payment Date *</Label>
                <Input
                  id="pay-date"
                  type="date"
                  value={paymentForm.date}
                  onChange={(e) =>
                    setPaymentForm((prev) => ({ ...prev, date: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pay-method">Payment Method *</Label>
                <Select
                  value={paymentForm.method}
                  onValueChange={(val) =>
                    setPaymentForm((prev) => ({ ...prev, method: val }))
                  }
                >
                  <SelectTrigger id="pay-method">
                    <SelectValue placeholder="Select Method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UPI">UPI / GooglePay / PhonePe</SelectItem>
                    <SelectItem value="Bank Transfer">Bank Transfer (NEFT / RTGS / IMPS)</SelectItem>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Cheque">Cheque</SelectItem>
                    <SelectItem value="Card">Credit / Debit Card</SelectItem>
                    <SelectItem value="Net Banking">Net Banking</SelectItem>
                    <SelectItem value="Razorpay">Razorpay Gateway</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pay-ref">Reference ID / UTR / Cheque Number</Label>
              <Input
                id="pay-ref"
                placeholder="e.g. UTR7892348910 or UPI txn reference"
                value={paymentForm.reference}
                onChange={(e) =>
                  setPaymentForm((prev) => ({ ...prev, reference: e.target.value }))
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pay-inv">Link with Invoice (Optional)</Label>
              <Select
                value={paymentForm.invoiceId || "none"}
                onValueChange={(val) =>
                  setPaymentForm((prev) => ({
                    ...prev,
                    invoiceId: val === "none" ? "" : val,
                  }))
                }
              >
                <SelectTrigger id="pay-inv">
                  <SelectValue placeholder="No Specific Invoice (Advance / Retainer)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    No Specific Invoice (General Payment / Retainer)
                  </SelectItem>
                  {customerInvoices.map((inv) => {
                    const invId = inv._id || inv.id;
                    const invNum = inv.invoiceNumber || `INV-${String(invId).slice(-4)}`;
                    const totalVal = Number(inv.total || inv.originalAmount || 0);
                    const paidVal = Number(inv.paidAmount || 0);
                    const bal = Math.max(0, totalVal - paidVal);
                    return (
                      <SelectItem key={invId} value={invId}>
                        {invNum} · Due: {formatMoney(bal)} ({inv.status || "Unpaid"})
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pay-notes">Notes / Accounting Remarks</Label>
              <Textarea
                id="pay-notes"
                placeholder="e.g. Received advance retainer for October campaign via HDFC current account."
                rows={2}
                value={paymentForm.notes}
                onChange={(e) =>
                  setPaymentForm((prev) => ({ ...prev, notes: e.target.value }))
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pay-receipt">Attach Receipt / Payment Proof Document (Optional)</Label>
              <Input
                id="pay-receipt"
                type="file"
                accept="application/pdf,image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setPaymentReceiptFile(file);
                }}
                className="cursor-pointer file:cursor-pointer file:font-semibold text-xs"
              />
              {paymentReceiptFile && (
                <p className="text-xs text-primary font-medium flex items-center gap-1 mt-1 truncate">
                  <Paperclip className="h-3 w-3 shrink-0" /> Attached: {paymentReceiptFile.name} ({(paymentReceiptFile.size / 1024).toFixed(0)} KB)
                </p>
              )}
            </div>

            {/* Instant Payment Confirmation Alert Section */}
            <div className="rounded-xl border border-warning/30 bg-warning/5 p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-warning shrink-0" />
                  <Label htmlFor="pay-alert-toggle" className="text-xs sm:text-sm font-semibold cursor-pointer text-foreground">
                    Send Payment Confirmation Alert to Client
                  </Label>
                </div>
                <input
                  id="pay-alert-toggle"
                  type="checkbox"
                  checked={paymentForm.sendAlert}
                  onChange={(e) =>
                    setPaymentForm((prev) => ({ ...prev, sendAlert: e.target.checked }))
                  }
                  className="h-4 w-4 rounded accent-primary cursor-pointer"
                />
              </div>

              {paymentForm.sendAlert && (
                <div className="space-y-2.5 pt-1 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Alert Channel</Label>
                      <Select
                        value={paymentForm.alertChannel}
                        onValueChange={(val: any) =>
                          setPaymentForm((prev) => ({ ...prev, alertChannel: val }))
                        }
                      >
                        <SelectTrigger className="h-8 text-xs bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="WhatsApp">
                            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                              <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                              <span>WhatsApp Alert</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="Email">
                            <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-medium">
                              <Mail className="h-3.5 w-3.5 shrink-0" />
                              <span>Email Notification</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="SMS">
                            <div className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400 font-medium">
                              <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                              <span>SMS Alert</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Recipient Destination</Label>
                      <div className="h-8 px-2.5 rounded-md border bg-muted/40 flex items-center text-xs font-medium text-foreground truncate">
                        {paymentForm.alertChannel === "Email"
                          ? customer?.email || "No email registered"
                          : (Array.isArray(customer?.contactNumbers) ? customer.contactNumbers[0] : customer?.phone || customer?.contactNumber) || "+91 98765 43210"}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="pay-custom-alert" className="text-[11px] text-muted-foreground">
                      Custom Alert Message (Optional)
                    </Label>
                    <Textarea
                      id="pay-custom-alert"
                      rows={2}
                      placeholder={`Dear ${getCustomerName(customer)}, we have verified your payment of ₹${paymentForm.amount || "0"} via ${paymentForm.method} (Ref: ${paymentForm.reference || "REC"}). Thank you! - Digitalness Team`}
                      value={paymentForm.customAlertMessage}
                      onChange={(e) =>
                        setPaymentForm((prev) => ({ ...prev, customAlertMessage: e.target.value }))
                      }
                      className="text-xs font-sans leading-relaxed"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      An official receipt alert will be dispatched to the client immediately upon saving this payment.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-2 pt-3">

              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => {
                  setShowAddPaymentModal(false);
                  setPaymentReceiptFile(null);
                }}
                disabled={submittingPayment}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submittingPayment} className="w-full sm:w-auto gap-2">
                {submittingPayment ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Recording...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Save & Sync Payment
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Manual Invoice Creation & Document Upload Dialog */}
      <Dialog open={showAddInvoiceModal} onOpenChange={setShowAddInvoiceModal}>
        <DialogContent className="w-[95vw] sm:max-w-xl max-h-[88vh] sm:max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl font-bold">
              <Receipt className="h-5 w-5 text-primary shrink-0" />
              Create & Upload Invoice
            </DialogTitle>
            <p className="text-xs text-muted-foreground">
              Generate an official tax invoice and upload supporting PDF/document for <strong className="text-foreground">{getCustomerName(customer)}</strong>.
              This will reflect in the Client Web Portal.
            </p>
          </DialogHeader>

          <form onSubmit={handleCreateInvoice} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="inv-num">Invoice Number</Label>
                <Input
                  id="inv-num"
                  placeholder="e.g. DGT-2026-1090"
                  value={invoiceForm.invoiceNumber}
                  onChange={(e) => setInvoiceForm((prev) => ({ ...prev, invoiceNumber: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="inv-amount">Total Amount (₹) *</Label>
                <Input
                  id="inv-amount"
                  type="number"
                  min="1"
                  placeholder="e.g. 75000"
                  value={invoiceForm.amount}
                  onChange={(e) => setInvoiceForm((prev) => ({ ...prev, amount: e.target.value }))}
                  required
                  className="font-mono font-semibold"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="inv-status">Settlement / Payment Status *</Label>
              <Select
                value={invoiceForm.paymentStatus}
                onValueChange={(val: any) =>
                  setInvoiceForm((prev) => ({ ...prev, paymentStatus: val }))
                }
              >
                <SelectTrigger id="inv-status" className="font-semibold text-xs sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PAID">
                    <div className="flex items-center gap-2 text-emerald-600 font-bold">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>Already Paid / Settled (Balance: ₹0 · No Alerts)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="UNPAID">
                    <div className="flex items-center gap-2 text-amber-600 font-bold">
                      <Clock className="h-4 w-4 text-amber-600 shrink-0" />
                      <span>Unpaid / Payment Due (Generates pending balance)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="PARTIALLY_PAID">
                    <div className="flex items-center gap-2 text-sky-600 font-bold">
                      <span>Partially Paid (Enter advance amount)</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {invoiceForm.paymentStatus === "PAID" && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>Marked as Cleared & Reconciled</span>
                </div>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  This invoice is <strong>100% Paid</strong>. It will not generate any payment due alerts or warning symbols, and will automatically record a verified payment ledger entry.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Payment Mode</Label>
                    <Select
                      value={invoiceForm.paymentMethod}
                      onValueChange={(val) => setInvoiceForm((prev) => ({ ...prev, paymentMethod: val }))}
                    >
                      <SelectTrigger className="h-8 text-xs bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Bank Transfer">Bank Transfer (NEFT/RTGS)</SelectItem>
                        <SelectItem value="UPI">UPI / Google Pay</SelectItem>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="Cheque">Cheque</SelectItem>
                        <SelectItem value="Card">Card</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground">UTR / Transaction Reference</Label>
                    <Input
                      placeholder="e.g. UTR-982348"
                      className="h-8 text-xs bg-background font-mono"
                      value={invoiceForm.reference}
                      onChange={(e) => setInvoiceForm((prev) => ({ ...prev, reference: e.target.value }))}
                    />
                  </div>
                </div>
              </div>
            )}

            {invoiceForm.paymentStatus === "PARTIALLY_PAID" && (
              <div className="space-y-1.5">
                <Label htmlFor="inv-paid-amt">Amount Received in Advance (₹) *</Label>
                <Input
                  id="inv-paid-amt"
                  type="number"
                  min="1"
                  placeholder="e.g. 25000"
                  value={invoiceForm.paidAmount}
                  onChange={(e) => setInvoiceForm((prev) => ({ ...prev, paidAmount: e.target.value }))}
                  required
                  className="font-mono"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="inv-due">Payment Due Date *</Label>
              <Input
                id="inv-due"
                type="date"
                value={invoiceForm.dueDate}
                onChange={(e) => setInvoiceForm((prev) => ({ ...prev, dueDate: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="inv-desc">Service Description / Line Item</Label>
              <Input
                id="inv-desc"
                placeholder="e.g. Monthly SEO, Meta Ads & Social Media Retainer"
                value={invoiceForm.description}
                onChange={(e) => setInvoiceForm((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="inv-file">Upload Official Invoice PDF / Document</Label>
              <div className="flex flex-col gap-2">
                <Input
                  id="inv-file"
                  type="file"
                  accept="application/pdf,image/*,.doc,.docx"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setInvoiceDocumentFile(file);
                  }}
                  className="cursor-pointer file:cursor-pointer file:font-semibold text-xs"
                />
                {invoiceDocumentFile ? (
                  <p className="text-xs text-primary font-medium flex items-center gap-1 truncate">
                    <FileText className="h-3.5 w-3.5 shrink-0" /> Selected: {invoiceDocumentFile.name} ({(invoiceDocumentFile.size / 1024).toFixed(0)} KB)
                  </p>
                ) : (
                  <p className="text-[11px] text-muted-foreground">
                    Upload official GST tax invoice PDF or scanned bill. Client can view and download it directly.
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="inv-notes">Accounting Remarks / Notes</Label>
              <Textarea
                id="inv-notes"
                placeholder="e.g. Applicable GST 18% included. Payment due in 7 days."
                rows={2}
                value={invoiceForm.notes}
                onChange={(e) => setInvoiceForm((prev) => ({ ...prev, notes: e.target.value }))}
              />
            </div>

            <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-2 pt-3">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => {
                  setShowAddInvoiceModal(false);
                  setInvoiceDocumentFile(null);
                }}
                disabled={submittingInvoice}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submittingInvoice} className="w-full sm:w-auto gap-2">
                {submittingInvoice ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Uploading & Creating...
                  </>
                ) : (
                  <>
                    <UploadCloud className="h-4 w-4" />
                    Create Invoice & Save Document
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Send Payment Due Alert Modal */}
      <Dialog open={showAlertModal} onOpenChange={setShowAlertModal}>
        <DialogContent className="w-[95vw] sm:max-w-lg max-h-[88vh] sm:max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl font-bold text-foreground">
              <Bell className="h-5 w-5 text-warning shrink-0" />
              Send Payment Due Alert
            </DialogTitle>
            <p className="text-xs text-muted-foreground">
              Dispatch an instant notification alert to <strong className="text-foreground">{getCustomerName(customer)}</strong> regarding their pending payment balance.
            </p>
          </DialogHeader>

          <form onSubmit={handleSendDueAlert} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="alert-channel">Notification Channel</Label>
                <Select
                  value={alertForm.channel}
                  onValueChange={(val: any) => setAlertForm((prev) => ({ ...prev, channel: val }))}
                >
                  <SelectTrigger id="alert-channel">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WhatsApp">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        <span>WhatsApp Alert</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Email">
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                        <span>Email Notice</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="SMS">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                        <span>SMS Notification</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="alert-amount">Due Amount (₹) *</Label>
                <Input
                  id="alert-amount"
                  type="number"
                  min="1"
                  value={alertForm.amount}
                  onChange={(e) => setAlertForm((prev) => ({ ...prev, amount: e.target.value }))}
                  required
                  className="font-mono font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="alert-due">Due Date</Label>
                <Input
                  id="alert-due"
                  type="date"
                  value={alertForm.dueDate}
                  onChange={(e) => setAlertForm((prev) => ({ ...prev, dueDate: e.target.value }))}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="alert-phone">
                  {alertForm.channel === "Email" ? "Recipient Email" : "Recipient Phone"}
                </Label>
                <Input
                  id="alert-phone"
                  value={alertForm.channel === "Email" ? alertForm.recipientEmail : alertForm.recipientPhone}
                  onChange={(e) =>
                    setAlertForm((prev) =>
                      alertForm.channel === "Email"
                        ? { ...prev, recipientEmail: e.target.value }
                        : { ...prev, recipientPhone: e.target.value }
                    )
                  }
                  placeholder={alertForm.channel === "Email" ? "client@example.com" : "+91 98765 43210"}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="alert-msg">Custom Alert Message (Editable)</Label>
              <Textarea
                id="alert-msg"
                rows={4}
                value={alertForm.customMessage}
                onChange={(e) => setAlertForm((prev) => ({ ...prev, customMessage: e.target.value }))}
                className="text-xs leading-relaxed font-sans"
              />
            </div>

            <div className="rounded-xl border border-warning/30 bg-warning/5 p-3 text-xs space-y-1">
              <p className="font-semibold text-warning flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                Live Dispatch Preview
              </p>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                Will be delivered via <strong>{alertForm.channel}</strong> to <strong>{alertForm.recipientName}</strong> ({alertForm.channel === "Email" ? alertForm.recipientEmail : alertForm.recipientPhone}). Bank transfer and corporate UPI instructions are automatically included.
              </p>
            </div>

            <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-2 pt-3">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => setShowAlertModal(false)}
                disabled={sendingAlert}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={sendingAlert} className="w-full sm:w-auto gap-2 bg-warning text-warning-foreground hover:bg-warning/90">
                {sendingAlert ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Dispatching...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Dispatch Payment Due Alert
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Proposal Details Modal */}
      <Dialog open={Boolean(selectedProposal)} onOpenChange={(open) => !open && setSelectedProposal(null)}>
        <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[88vh] overflow-y-auto p-4 sm:p-6 rounded-2xl shadow-xl">
          {selectedProposal && (
            <div className="space-y-5">
              <DialogHeader>
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-primary/10 text-primary">
                    {selectedProposal.proposalNumber || "PR-PROPOSAL"}
                  </span>
                  <Badge variant={["Approved", "Accepted"].includes(selectedProposal.status) ? "completed" : "secondary"}>
                    {selectedProposal.status || "Draft"}
                  </Badge>
                </div>
                <DialogTitle className="text-xl font-bold mt-2">
                  {selectedProposal.title || selectedProposal.dealId?.dealName || "Project Proposal"}
                </DialogTitle>
                <p className="text-xs text-muted-foreground">
                  Issued by Digitalness for <strong className="text-foreground">{getCustomerName(customer)}</strong>
                </p>
              </DialogHeader>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-muted/40 border">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Proposal Value</p>
                  <p className="text-sm font-extrabold text-foreground mt-0.5">
                    {formatMoney(Number(selectedProposal.grandTotal || selectedProposal.proposalValue || 0))}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Timeline</p>
                  <p className="text-xs font-medium text-foreground mt-0.5">{selectedProposal.timeline || "As specified"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Payment Terms</p>
                  <p className="text-xs font-medium text-foreground mt-0.5">{selectedProposal.paymentTerms || "Milestone"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold">Support Period</p>
                  <p className="text-xs font-medium text-foreground mt-0.5">{selectedProposal.supportPeriod || "30 Days"}</p>
                </div>
              </div>

              {selectedProposal.scopeOfWork && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Scope of Work</h4>
                  <div className="p-3.5 rounded-xl bg-card border text-xs leading-relaxed text-foreground whitespace-pre-line">
                    {selectedProposal.scopeOfWork}
                  </div>
                </div>
              )}

              {selectedProposal.deliverables && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Key Deliverables</h4>
                  <div className="p-3.5 rounded-xl bg-card border text-xs leading-relaxed text-foreground whitespace-pre-line">
                    {selectedProposal.deliverables}
                  </div>
                </div>
              )}

              {Array.isArray(selectedProposal.services) && selectedProposal.services.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Services Breakdown</h4>
                  <div className="rounded-xl border overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-muted/60 text-muted-foreground font-semibold">
                        <tr>
                          <th className="p-2.5">Service</th>
                          <th className="p-2.5 text-right">Qty</th>
                          <th className="p-2.5 text-right">Price</th>
                          <th className="p-2.5 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {selectedProposal.services.map((srv: any, sIdx: number) => (
                          <tr key={sIdx}>
                            <td className="p-2.5">
                              <p className="font-semibold text-foreground">{srv.name}</p>
                              {srv.description && <p className="text-[10px] text-muted-foreground">{srv.description}</p>}
                            </td>
                            <td className="p-2.5 text-right">{srv.quantity || 1}</td>
                            <td className="p-2.5 text-right">{formatMoney(srv.price || 0)}</td>
                            <td className="p-2.5 text-right font-bold text-foreground">
                              {formatMoney(srv.total || (srv.quantity || 1) * (srv.price || 0))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
                <Button variant="outline" onClick={() => setSelectedProposal(null)}>
                  Close
                </Button>
                {selectedProposal.status === "Sent" && (
                  <Button
                    onClick={() => {
                      handleAcceptProposal(selectedProposal._id);
                      setSelectedProposal(null);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Accept Proposal</span>
                  </Button>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EmptyState({ title }: { title: string }) {
  return (
    <div className="col-span-full rounded-2xl border border-dashed bg-card p-10 text-center text-muted-foreground">
      {title}
    </div>
  );
}

function PreviewItem({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold text-foreground">{value || "-"}</p>
    </div>
  );
}

function ReportButton({ title, type, onClick, loading }: any) {
  return (
    <Button
      variant="outline"
      className="h-auto flex-col items-start gap-2 p-4 text-left"
      onClick={() => onClick(type)}
      disabled={loading === title}
    >
      <div className="flex w-full items-center justify-between">
        <FileText className="h-5 w-5 text-primary" />
        {loading === title ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
      </div>
      <span className="font-semibold">{title}</span>
      <span className="text-xs text-muted-foreground">Download / print PDF report</span>
    </Button>
  );
}

function DownloadCard({ title, desc, onClick }: any) {
  return (
    <div className="rounded-3xl border bg-card p-5 shadow-sm">
      <div className="rounded-2xl bg-primary/10 p-3 text-primary w-fit">
        <Download className="h-5 w-5" />
      </div>
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
      <Button className="mt-4 w-full" onClick={onClick}>
        Download
      </Button>
    </div>
  );
}
