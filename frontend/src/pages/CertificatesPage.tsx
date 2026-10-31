import { useEffect, useMemo, useState, useRef } from "react";
import axios from "axios";
import {
  Award,
  Search,
  Plus,
  FileCheck,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Copy,
  Trash2,
  Edit,
  Download,
  UploadCloud,
  FileText,
  Filter,
  ShieldCheck,
  Eye,
  RefreshCw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { useToast } from "@/hooks/use-toast";

const API_URL = import.meta.env.VITE_API_URL || "https://server.digitalness.co.in/api";
const PUBLIC_WEB_URL = import.meta.env.VITE_PUBLIC_WEB_URL || "https://digitalness.co.in";

const getAuthConfig = (isMultipart = false) => {
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken");

  return {
    headers: {
      Authorization: `Bearer ${token}`,
      ...(isMultipart ? { "Content-Type": "multipart/form-data" } : { "Content-Type": "application/json" }),
    },
  };
};

export type CertificateType =
  | "Internship"
  | "Experience"
  | "Achievement"
  | "Course"
  | "CompanyAccreditation"
  | "Other";

export type CertificateStatus = "Active" | "Revoked" | "Expired";

export interface CertificateItem {
  _id: string;
  certificateId: string;
  recipientName: string;
  recipientEmail?: string;
  certificateType: CertificateType;
  domain: string;
  issueDate: string;
  startDate?: string;
  validUntil?: string;
  fileUrl: string;
  fileType: "pdf" | "image";
  status: CertificateStatus;
  description?: string;
  createdAt?: string;
}

const emptyForm = {
  certificateId: "",
  recipientName: "",
  recipientEmail: "",
  certificateType: "Internship" as CertificateType,
  domain: "",
  issueDate: new Date().toISOString().split("T")[0],
  startDate: "",
  validUntil: "",
  description: "",
  status: "Active" as CertificateStatus,
};

export default function CertificatesPage() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [certificates, setCertificates] = useState<CertificateItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCert, setEditingCert] = useState<CertificateItem | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Preview Dialog
  const [previewCert, setPreviewCert] = useState<CertificateItem | null>(null);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/certificates`, getAuthConfig());
      if (res.data?.success) {
        setCertificates(res.data.data || []);
      }
    } catch (err: any) {
      toast({
        title: "Failed to load certificates",
        description: err.response?.data?.message || err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, []);

  const openCreateDialog = () => {
    setEditingCert(null);
    setFormData(emptyForm);
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setIsDialogOpen(true);
  };

  const openEditDialog = (cert: CertificateItem) => {
    setEditingCert(cert);
    setFormData({
      certificateId: cert.certificateId,
      recipientName: cert.recipientName,
      recipientEmail: cert.recipientEmail || "",
      certificateType: cert.certificateType,
      domain: cert.domain,
      issueDate: cert.issueDate ? cert.issueDate.split("T")[0] : "",
      startDate: cert.startDate ? cert.startDate.split("T")[0] : "",
      validUntil: cert.validUntil ? cert.validUntil.split("T")[0] : "",
      description: cert.description || "",
      status: cert.status,
    });
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setIsDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.recipientName.trim()) {
      toast({ title: "Recipient name is required", variant: "destructive" });
      return;
    }
    if (!formData.domain.trim()) {
      toast({ title: "Domain or role title is required", variant: "destructive" });
      return;
    }
    if (!editingCert && !selectedFile) {
      toast({ title: "Please choose a certificate PDF or image file", variant: "destructive" });
      return;
    }

    try {
      setSaving(true);
      const data = new FormData();
      data.append("certificateId", formData.certificateId);
      data.append("recipientName", formData.recipientName);
      data.append("recipientEmail", formData.recipientEmail);
      data.append("certificateType", formData.certificateType);
      data.append("domain", formData.domain);
      data.append("issueDate", formData.issueDate);
      if (formData.startDate) data.append("startDate", formData.startDate);
      if (formData.validUntil) data.append("validUntil", formData.validUntil);
      data.append("description", formData.description);
      data.append("status", formData.status);

      if (selectedFile) {
        data.append("file", selectedFile);
      }

      if (editingCert) {
        await axios.put(`${API_URL}/certificates/${editingCert._id}`, data, getAuthConfig(true));
        toast({ title: "Certificate updated successfully!" });
      } else {
        await axios.post(`${API_URL}/certificates`, data, getAuthConfig(true));
        toast({ title: "Certificate uploaded & registered successfully!" });
      }

      setIsDialogOpen(false);
      fetchCertificates();
    } catch (err: any) {
      toast({
        title: "Failed to save certificate",
        description: err.response?.data?.message || err.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete certificate for "${name}"?`)) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/certificates/${id}`, getAuthConfig());
      toast({ title: "Certificate deleted successfully" });
      fetchCertificates();
    } catch (err: any) {
      toast({
        title: "Delete failed",
        description: err.response?.data?.message || err.message,
        variant: "destructive",
      });
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      const res = await axios.patch(`${API_URL}/certificates/${id}/status`, {}, getAuthConfig());
      if (res.data?.success) {
        toast({ title: res.data.message });
        fetchCertificates();
      }
    } catch (err: any) {
      toast({
        title: "Status change failed",
        description: err.response?.data?.message || err.message,
        variant: "destructive",
      });
    }
  };

  const copyVerificationLink = (certificateId: string) => {
    const link = `${PUBLIC_WEB_URL}/certifications?id=${encodeURIComponent(certificateId)}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Verification link copied to clipboard!",
      description: link,
    });
  };

  const getFullFileUrl = (relativeOrAbsolute: string) => {
    if (!relativeOrAbsolute) return "";
    if (relativeOrAbsolute.startsWith("http://") || relativeOrAbsolute.startsWith("https://")) {
      return relativeOrAbsolute;
    }
    const base = API_URL.replace(/\/api\/?$/, "");
    return `${base}${relativeOrAbsolute.startsWith("/") ? "" : "/"}${relativeOrAbsolute}`;
  };

  // Filtered list
  const filtered = useMemo(() => {
    return certificates.filter((c) => {
      const matchesSearch =
        search === "" ||
        c.certificateId.toLowerCase().includes(search.toLowerCase()) ||
        c.recipientName.toLowerCase().includes(search.toLowerCase()) ||
        (c.recipientEmail && c.recipientEmail.toLowerCase().includes(search.toLowerCase())) ||
        c.domain.toLowerCase().includes(search.toLowerCase());

      const matchesType = typeFilter === "All" || c.certificateType === typeFilter;
      const matchesStatus = statusFilter === "All" || c.status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [certificates, search, typeFilter, statusFilter]);

  // Metric stats
  const stats = useMemo(() => {
    const total = certificates.length;
    const active = certificates.filter((c) => c.status === "Active").length;
    const internships = certificates.filter((c) => c.certificateType === "Internship").length;
    const experience = certificates.filter((c) => c.certificateType === "Experience").length;
    return { total, active, internships, experience };
  }, [certificates]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Certificate Management
            </h1>
            <Badge variant="outline" className="border-indigo-200 text-indigo-700 bg-indigo-50">
              Website CMS
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Issue, upload, verify, and manage authentic employee & intern certificates displayed on your website.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchCertificates}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            onClick={openCreateDialog}
            className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
          >
            <Plus className="w-4 h-4" />
            Upload Certificate
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Total Certificates</span>
            <FileText className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold mt-2">{stats.total}</div>
        </div>

        <div className="p-4 rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Active & Verified</span>
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold mt-2 text-emerald-600">{stats.active}</div>
        </div>

        <div className="p-4 rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Internships</span>
            <Award className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold mt-2 text-blue-600">{stats.internships}</div>
        </div>

        <div className="p-4 rounded-xl border bg-card text-card-foreground shadow-sm">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium">
            <span>Experience Letters</span>
            <FileCheck className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold mt-2 text-amber-600">{stats.experience}</div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-card p-4 rounded-xl border">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by ID, Name, Domain..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Filter className="w-3.5 h-3.5" />
            <span>Type:</span>
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40 text-xs">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Types</SelectItem>
              <SelectItem value="Internship">Internship</SelectItem>
              <SelectItem value="Experience">Experience</SelectItem>
              <SelectItem value="Achievement">Achievement</SelectItem>
              <SelectItem value="Course">Course</SelectItem>
              <SelectItem value="CompanyAccreditation">Accreditation</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-32 text-xs">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Status</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Revoked">Revoked</SelectItem>
              <SelectItem value="Expired">Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Certificates Table */}
      <div className="bg-card rounded-xl border overflow-hidden shadow-sm">
        {loading ? (
          <div className="py-16 text-center text-muted-foreground space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-500" />
            <p>Loading certificate records...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground space-y-3">
            <Award className="w-12 h-12 mx-auto text-slate-300" />
            <h3 className="text-base font-semibold text-foreground">No certificates found</h3>
            <p className="text-sm max-w-sm mx-auto">
              {search || typeFilter !== "All" || statusFilter !== "All"
                ? "Try adjusting your search filters to find what you are looking for."
                : "No certificates have been uploaded yet. Click 'Upload Certificate' above to issue your first one."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground font-medium text-xs border-b">
                <tr>
                  <th className="px-4 py-3">Certificate ID</th>
                  <th className="px-4 py-3">Recipient</th>
                  <th className="px-4 py-3">Domain / Role</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Issue Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map((cert) => {
                  const isActive = cert.status === "Active";
                  const fullUrl = getFullFileUrl(cert.fileUrl);

                  return (
                    <tr key={cert._id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 font-semibold text-foreground">
                        <div className="flex items-center gap-1.5">
                          <span>{cert.certificateId}</span>
                          <button
                            onClick={() => copyVerificationLink(cert.certificateId)}
                            title="Copy Public Verification Link"
                            className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-indigo-600 transition"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">{cert.recipientName}</div>
                        {cert.recipientEmail && (
                          <div className="text-xs text-muted-foreground">{cert.recipientEmail}</div>
                        )}
                      </td>

                      <td className="px-4 py-3 text-muted-foreground">
                        <span className="font-medium text-foreground">{cert.domain}</span>
                      </td>

                      <td className="px-4 py-3">
                        <Badge
                          variant="secondary"
                          className={
                            cert.certificateType === "Internship"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : cert.certificateType === "Experience"
                                ? "bg-purple-50 text-purple-700 border-purple-200"
                                : "bg-slate-100 text-slate-700"
                          }
                        >
                          {cert.certificateType}
                        </Badge>
                      </td>

                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {cert.issueDate ? new Date(cert.issueDate).toLocaleDateString() : "-"}
                      </td>

                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggleStatus(cert._id)}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer transition ${isActive
                              ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                              : "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
                            }`}
                          title="Click to toggle Active / Revoked status"
                        >
                          {isActive ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Active
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-red-600" />
                              Revoked
                            </>
                          )}
                        </button>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            title="Preview Certificate"
                            onClick={() => setPreviewCert(cert)}
                          >
                            <Eye className="w-4 h-4 text-slate-600" />
                          </Button>

                          <a
                            href={fullUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 hover:bg-muted rounded text-slate-600 hover:text-indigo-600"
                            title="Open / Download Original Document"
                          >
                            <Download className="w-4 h-4" />
                          </a>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            title="Edit"
                            onClick={() => openEditDialog(cert)}
                          >
                            <Edit className="w-4 h-4 text-slate-600" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            title="Delete"
                            onClick={() => handleDelete(cert._id, cert.recipientName)}
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* Create / Edit Certificate Modal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCert ? "Edit Certificate Record" : "Upload & Issue Certificate"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 mt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-foreground">
                  Certificate ID
                </label>
                <Input
                  placeholder="e.g. DN-INT-2025-104 (Auto-generated if blank)"
                  value={formData.certificateId}
                  onChange={(e) =>
                    setFormData({ ...formData, certificateId: e.target.value.toUpperCase() })
                  }
                  className="mt-1 font-mono uppercase"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">
                  Certificate Type *
                </label>
                <Select
                  value={formData.certificateType}
                  onValueChange={(val: CertificateType) =>
                    setFormData({ ...formData, certificateType: val })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Internship">Internship Certificate</SelectItem>
                    <SelectItem value="Experience">Experience Certificate</SelectItem>
                    <SelectItem value="Achievement">Achievement / Award</SelectItem>
                    <SelectItem value="Course">Training Completion</SelectItem>
                    <SelectItem value="CompanyAccreditation">Company Accreditation</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-foreground">
                  Recipient Full Name *
                </label>
                <Input
                  required
                  placeholder="e.g. John Doe"
                  value={formData.recipientName}
                  onChange={(e) =>
                    setFormData({ ...formData, recipientName: e.target.value })
                  }
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">
                  Recipient Email
                </label>
                <Input
                  type="email"
                  placeholder="john@example.com"
                  value={formData.recipientEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, recipientEmail: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">
                Domain / Designation / Role *
              </label>
              <Input
                required
                placeholder="e.g. Full Stack Developer, Performance Marketing Executive"
                value={formData.domain}
                onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-foreground">Issue Date *</label>
                <Input
                  type="date"
                  required
                  value={formData.issueDate}
                  onChange={(e) =>
                    setFormData({ ...formData, issueDate: e.target.value })
                  }
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">Start Date</label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">Valid Until (Optional)</label>
                <Input
                  type="date"
                  value={formData.validUntil}
                  onChange={(e) =>
                    setFormData({ ...formData, validUntil: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
            </div>

            {/* Document File Uploader */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Certificate File (PDF or Image) {editingCert ? "(Upload only to replace)" : "*"}
              </label>
              <div className="border-2 border-dashed rounded-xl p-4 text-center hover:bg-muted/40 transition cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadCloud className="w-8 h-8 text-indigo-500 mx-auto mb-1" />
                <p className="text-xs font-medium text-foreground">
                  {selectedFile
                    ? selectedFile.name
                    : editingCert
                      ? "Click to choose a replacement file"
                      : "Click to browse or drop certificate PDF or image"}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Supports PDF, PNG, JPG up to 15MB
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setSelectedFile(e.target.files[0]);
                    }
                  }}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground">Description / Notes</label>
              <Textarea
                placeholder="Optional notes or remarks regarding this certificate"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={2}
                className="mt-1"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
              >
                {saving && <RefreshCw className="w-4 h-4 animate-spin" />}
                {editingCert ? "Update Certificate" : "Issue & Upload"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Quick Preview Dialog */}
      <Dialog open={Boolean(previewCert)} onOpenChange={() => setPreviewCert(null)}>
        <DialogContent className="max-w-2xl">
          {previewCert && (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-indigo-900">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  Certificate Verification Preview
                </DialogTitle>
              </DialogHeader>

              <div className="p-4 bg-slate-50 border rounded-xl space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-mono text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                      {previewCert.certificateId}
                    </span>
                    <h3 className="text-lg font-bold text-foreground mt-1">
                      {previewCert.recipientName}
                    </h3>
                    <p className="text-sm text-muted-foreground">{previewCert.domain}</p>
                  </div>
                  <Badge
                    className={
                      previewCert.status === "Active"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-red-100 text-red-800"
                    }
                  >
                    {previewCert.status === "Active" ? "Verified Authentic" : "Revoked"}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t text-muted-foreground">
                  <div>Type: <strong className="text-foreground">{previewCert.certificateType}</strong></div>
                  <div>Issued: <strong className="text-foreground">{previewCert.issueDate ? new Date(previewCert.issueDate).toLocaleDateString() : "-"}</strong></div>
                </div>
              </div>

              {/* View / Download Actions */}
              <div className="flex justify-between items-center pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyVerificationLink(previewCert.certificateId)}
                  className="gap-1.5"
                >
                  <Copy className="w-4 h-4" />
                  Copy Public Verification URL
                </Button>

                <div className="flex gap-2">
                  <a
                    href={getFullFileUrl(previewCert.fileUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5">
                      <ExternalLink className="w-4 h-4" />
                      Open Full Document
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
