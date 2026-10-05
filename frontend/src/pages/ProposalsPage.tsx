import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Send,
  MailCheck,
  FileText,
  IndianRupee,
  Download,
  MessageCircle,
  Eye,
  Copy,
  Calculator,
  BadgeCheck,
  Clock,
  Paperclip,
  Signature,
  Sparkles,
  GitBranch,
  BarChart3,
  History,
  Upload,
  CheckCircle2,
  XCircle,
  RefreshCw,
  UploadCloud,
  FileUp,
  Building2,
  Phone,
  Mail,
  X,
  Wallet,
  CreditCard,
  CalendarDays,
  Check,
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
import { socket } from "@/lib/socket";

const API_URL = import.meta.env.VITE_API_URL || "https://server.digitalness.co.in/api";

type ProposalStatus =
  | "Draft"
  | "Sent"
  | "Viewed"
  | "Approved"
  | "Accepted"
  | "Rejected"
  | "Revision Requested"
  | "Expired";

interface ProposalService {
  name?: string;
  serviceName?: string;
  description?: string;
  quantity?: number;
  price?: number;
  total?: number;
}

interface ProposalAttachment {
  fileName: string;
  fileUrl?: string;
  fileType?: string;
  uploadedAt?: string;
}

interface ProposalActivity {
  title?: string;
  message?: string;
  type?: string;
  createdAt?: string;
  createdBy?: any;
}

interface Proposal {
  _id?: string;
  id?: string;
  proposalNumber?: string;
  customer?: any;
  customerId?: string;
  dealId?: string | null;
  leadId?: string | null;
  assignedTo?: string | { _id?: string; id?: string; name?: string; email?: string };
  parentProposalId?: string | null;
  version?: number;
  customerName: string;
  clientName?: string;
  companyName?: string;
  contactNumber: string;
  clientEmail?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  businessType?: string;
  gstNumber?: string;
  panNumber?: string;
  branchId?: string;
  title: string;
  packageName?: string;
  proposalValue: number;
  services: ProposalService[];
  requirements?: string;
  scopeOfWork?: string;
  deliverables?: string;
  timeline?: string;
  projectTimeline?: string;
  paymentTerms?: string;
  termsAndConditions?: string;
  cancellationPolicy?: string;
  supportPeriod?: string;
  discount?: number;
  gstPercentage?: number;
  subtotal?: number;
  gstAmount?: number;
  grandTotal?: number;
  notes?: string;
  mailSubject?: string;
  mailMessage?: string;
  status: ProposalStatus;
  mailSent?: boolean;
  sentAt?: string;
  viewedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  validUntil?: string;
  documentUrl?: string;
  documentName?: string;
  attachments?: ProposalAttachment[];
  customerSignatureUrl?: string;
  authorizedSignatureUrl?: string;
  companyStampUrl?: string;
  digitalSignatureName?: string;
  authorizedSignature?: string;
  companyStamp?: string;
  activityLogs?: ProposalActivity[];
  customerCreated?: boolean;

  // Billing & Agreement Settlement fields
  billingCycle?: "Monthly" | "Project" | "Yearly" | "One-Time" | string;
  agreedAmount?: number;
  advancePaid?: number;
  advancePaymentDate?: string;
  advancePaymentMethod?: string;
  advancePaymentReference?: string;
  advanceNotes?: string;
  balancePending?: number;
  dueDate?: string;
  billingConfigured?: boolean;
  billingConfiguredAt?: string;
  invoiceId?: any;
  paymentId?: any;

  createdAt?: string;
  updatedAt?: string;
}

interface Deal {
  _id: string;
  id?: string;
  leadId?: string | { _id?: string; id?: string };
  title: string;
  customerName: string;
  contactNumber: string;
  businessType?: string;
  branchId?: string;
  stage?: string;
  dealValue?: number;
  probability?: number;
  expectedCloseDate?: string;
  assignedTo?: string | { _id?: string; id?: string; name?: string; email?: string };
  proposalId?: string;
  proposalCreated?: boolean;
  customerId?: string | { _id?: string; id?: string };
  customerCreated?: boolean;
  notes?: string;
}

type ProposalTemplate = {
  label: string;
  category: string;
  title: string;
  packageName: string;
  servicesText: string;
  requirements: string;
  scopeOfWork: string;
  deliverables: string;
  projectTimeline: string;
  paymentTerms: string;
  termsAndConditions: string;
  cancellationPolicy: string;
  supportPeriod: string;
  discount?: string;
  gstPercentage?: string;
  notes?: string;
  mailSubject: string;
  mailMessage: string;
};

const proposalTemplates: Record<string, ProposalTemplate> = {
  "Website Starter": {
    label: "Website Starter",
    category: "Website",
    title: "Website Design & Development Proposal",
    packageName: "Website Starter",
    servicesText: `Website Design | Responsive business website up to 5 pages with modern UI | 1 | 25000
Basic SEO Setup | Title tags, meta description, sitemap and indexing support | 1 | 5000
Hosting Guidance | Domain, hosting and launch support guidance | 1 | 3000`,
    requirements:
      "A professional responsive business website with essential company pages, inquiry/contact flow and basic SEO readiness.",
    scopeOfWork:
      "Digitalness will design and develop a responsive website suitable for desktop, tablet and mobile devices. The scope includes UI layout, page development, content placement, contact form integration guidance, basic SEO structure, launch support and final handover.",
    deliverables:
      "Home page, About page, Services page, Gallery/Portfolio section, Contact page, responsive layout, basic SEO setup, website deployment guidance and final source handover where applicable.",
    projectTimeline:
      "Estimated timeline: 10 to 15 working days from the date of content confirmation, advance payment and required asset sharing.",
    paymentTerms:
      "50% advance payment before project start and 50% before final delivery/deployment.",
    termsAndConditions:
      "Content, images, brand assets and approvals must be provided by the client on time. Any additional pages, features, third-party integrations or major revisions outside the agreed scope will be estimated separately.",
    cancellationPolicy:
      "Advance payment is non-refundable once design or development work has started. Cancellation after project commencement will be reviewed based on completed work.",
    supportPeriod:
      "30 days basic support after website handover for minor bug fixes related to delivered scope.",
    discount: "0",
    gstPercentage: "18",
    notes: "Best for small businesses needing a clean online presence.",
    mailSubject: "Website Design & Development Proposal from Digitalness",
    mailMessage:
      "Dear Client,\n\nPlease find the website design and development proposal prepared by Digitalness. The proposal includes scope, deliverables, pricing, timeline and payment terms.\n\nRegards,\nDigitalness Team",
  },
  "Premium Website": {
    label: "Premium Website",
    category: "Website",
    title: "Premium Website Development Proposal",
    packageName: "Premium Website",
    servicesText: `Premium UI/UX Design | Custom high-end visual design for brand-focused website | 1 | 35000
Website Development | Responsive dynamic website development up to 10 pages | 1 | 55000
CMS / Admin Guidance | Content update structure and basic admin guidance | 1 | 15000
Advanced SEO Setup | Technical SEO basics, sitemap, schema guidance and performance checks | 1 | 12000`,
    requirements:
      "A premium, conversion-focused website with strong branding, responsive UI, structured content and professional presentation.",
    scopeOfWork:
      "Digitalness will create a premium website experience with custom UI sections, responsive development, optimized content structure, inquiry flow, performance-conscious implementation and launch support.",
    deliverables:
      "Premium homepage, inner pages, service sections, inquiry/contact flow, CMS/admin guidance if applicable, responsive layout, technical SEO setup, deployment support and handover.",
    projectTimeline:
      "Estimated timeline: 20 to 30 working days depending on content, approvals and feature complexity.",
    paymentTerms:
      "40% advance payment, 40% after design/development milestone and 20% before final launch.",
    termsAndConditions:
      "Major design changes after approval, custom integrations, copywriting, paid plugins/tools, hosting, domain and third-party costs are not included unless mentioned separately.",
    cancellationPolicy:
      "Advance and milestone payments are non-refundable once corresponding work has started or been delivered.",
    supportPeriod:
      "45 days basic support after launch for delivered-scope bug fixes.",
    discount: "0",
    gstPercentage: "18",
    notes: "Suitable for premium brands, service companies and campaign-led businesses.",
    mailSubject: "Premium Website Development Proposal from Digitalness",
    mailMessage:
      "Dear Client,\n\nPlease find the premium website development proposal from Digitalness. It includes a detailed scope, service pricing, timeline and commercial terms.\n\nRegards,\nDigitalness Team",
  },
  "Digital Marketing": {
    label: "Digital Marketing",
    category: "Marketing",
    title: "Digital Marketing Monthly Service Proposal",
    packageName: "Digital Marketing",
    servicesText: `Meta Ads Management | Campaign planning, audience setup, monitoring and optimization | 1 | 15000
Google Ads Management | Search/display campaign setup, tracking guidance and performance monitoring | 1 | 15000
Social Media Handling | Monthly content calendar, profile handling and post coordination | 1 | 12000
Monthly Performance Report | Summary report with campaign observations and recommendations | 1 | 5000`,
    requirements:
      "Monthly digital marketing support for lead generation, brand awareness and social media consistency.",
    scopeOfWork:
      "Digitalness will manage planned digital marketing activities including campaign setup support, ad monitoring, content coordination, monthly reporting and optimization suggestions based on campaign performance.",
    deliverables:
      "Meta Ads management, Google Ads management, social media content calendar, monthly posting support, campaign monitoring and monthly performance summary.",
    projectTimeline:
      "Monthly recurring service. Initial setup requires 3 to 5 working days after access, creatives and ad budget confirmation.",
    paymentTerms:
      "Monthly service fee payable in advance. Advertising budget is separate and payable directly to the platform or as agreed.",
    termsAndConditions:
      "Ad spend, GST, third-party tools, influencer costs, photoshoots, video shoots and additional creatives are separate unless included in the proposal. Results depend on budget, market demand, competition, landing page and offer quality.",
    cancellationPolicy:
      "Monthly service can be cancelled before the next billing cycle. Current month payment is non-refundable once work has started.",
    supportPeriod:
      "Support is available during the active service month for campaign and content-related coordination.",
    discount: "0",
    gstPercentage: "18",
    notes: "Ad spend is separate from management fee.",
    mailSubject: "Digital Marketing Service Proposal from Digitalness",
    mailMessage:
      "Dear Client,\n\nPlease find the digital marketing proposal from Digitalness. The proposal includes service scope, monthly pricing, deliverables and terms.\n\nRegards,\nDigitalness Team",
  },
  "Complete Growth Package": {
    label: "Complete Growth Package",
    category: "Website + Marketing",
    title: "Complete Business Growth Proposal",
    packageName: "Complete Growth Package",
    servicesText: `Website Development | Premium responsive business website | 1 | 45000
SEO Services | On-page SEO and keyword optimization | 1 | 15000
Meta Ads | Campaign setup and performance management | 1 | 15000
Google Ads | Search/display campaign setup and monitoring | 1 | 15000
Social Media Management | Monthly content and profile handling | 1 | 12000
Monthly Report | Performance and progress report | 1 | 5000`,
    requirements:
      "A complete digital growth setup covering website presence, paid ads, SEO basics, social media and reporting.",
    scopeOfWork:
      "Digitalness will design and develop a business website and support digital marketing activities through SEO setup, Meta Ads, Google Ads, social media management and monthly reporting.",
    deliverables:
      "Website development, SEO setup, Meta Ads management, Google Ads management, social media handling, reporting, campaign optimization suggestions and project coordination.",
    projectTimeline:
      "Website timeline: 15 to 25 working days. Marketing services begin after website/ad account/content readiness and continue monthly.",
    paymentTerms:
      "Website payment: 50% advance and 50% before launch. Marketing service fee payable monthly in advance. Ad spend is separate.",
    termsAndConditions:
      "Marketing performance depends on ad spend, audience, competition and landing page experience. Additional pages, videos, photo shoots, paid tools and third-party charges are not included unless mentioned.",
    cancellationPolicy:
      "Website advance is non-refundable after work begins. Monthly marketing can be stopped before the next billing cycle.",
    supportPeriod:
      "30 days website support after launch. Marketing support continues during active monthly plan.",
    discount: "0",
    gstPercentage: "18",
    notes: "Recommended for businesses wanting website + lead generation together.",
    mailSubject: "Complete Business Growth Proposal from Digitalness",
    mailMessage:
      "Dear Client,\n\nPlease find the complete growth proposal from Digitalness. It includes website, SEO, ads, social media and reporting details.\n\nRegards,\nDigitalness Team",
  },
  "Brand Launch Package": {
    label: "Brand Launch Package",
    category: "Branding",
    title: "Brand Launch & Campaign Proposal",
    packageName: "Brand Launch Package",
    servicesText: `Logo & Brand Identity | Logo direction, brand colors and basic identity guide | 1 | 18000
Landing Page | Premium campaign landing page | 1 | 25000
Launch Campaign Creatives | Meta ad creatives and launch content support | 1 | 12000
Social Media Launch Kit | Initial launch posts, captions and profile setup support | 1 | 10000`,
    requirements:
      "Brand launch support with identity, landing page and campaign-ready creatives.",
    scopeOfWork:
      "Digitalness will support brand launch with identity direction, campaign landing page, launch creatives, social media launch content and marketing-ready presentation.",
    deliverables:
      "Brand identity direction, landing page, launch creative set, social media launch kit and launch campaign guidance.",
    projectTimeline:
      "Estimated timeline: 12 to 20 working days depending on brand approvals and content availability.",
    paymentTerms:
      "50% advance payment and 50% before final delivery.",
    termsAndConditions:
      "Logo options, revisions, brand naming, trademark/legal verification, printing and media buying are not included unless clearly mentioned.",
    cancellationPolicy:
      "Advance payment is non-refundable once creative or design work has started.",
    supportPeriod:
      "15 days basic support after final handover for minor delivered-file corrections.",
    discount: "0",
    gstPercentage: "18",
    notes: "Useful for new brands, campaigns, openings and product/service launches.",
    mailSubject: "Brand Launch Proposal from Digitalness",
    mailMessage:
      "Dear Client,\n\nPlease find the brand launch proposal from Digitalness. It includes branding, landing page and campaign creative details.\n\nRegards,\nDigitalness Team",
  },
};

const packageTemplates: Record<string, string> = Object.fromEntries(
  Object.entries(proposalTemplates).map(([key, template]) => [key, template.servicesText])
);

const statusOptions: ProposalStatus[] = [
  "Draft",
  "Sent",
  "Viewed",
  "Approved",
  "Accepted",
  "Rejected",
  "Revision Requested",
  "Expired",
];

const blankForm = {
  customerName: "",
  companyName: "",
  contactNumber: "",
  clientEmail: "",
  address: "",
  city: "",
  state: "",
  businessType: "",
  gstNumber: "",
  panNumber: "",
  branchId: "",
  dealId: "",
  leadId: "",
  customerId: "",
  assignedTo: "",
  parentProposalId: "",
  version: "1",
  title: "",
  packageName: "",
  proposalValue: "",
  discount: "0",
  gstPercentage: "18",
  validUntil: "",
  requirements: "",
  scopeOfWork: "",
  deliverables: "",
  projectTimeline: "",
  paymentTerms: "50% advance payment before project start and 50% before final delivery.",
  termsAndConditions:
    "The proposal is valid only until the mentioned validity date. Any additional scope will be estimated separately.",
  cancellationPolicy:
    "Once work has started, advance payment is non-refundable. Cancellation terms may vary based on project progress.",
  supportPeriod: "30 days basic support after project handover.",
  servicesText: "",
  attachmentsText: "",
  customerSignatureUrl: "",
  authorizedSignatureUrl: "",
  companyStampUrl: "",
  digitalSignatureName: "Authorized Signatory",
  notes: "",
  mailSubject: "",
  mailMessage: "",
  documentUrl: "",
  documentName: "",
  status: "Draft" as ProposalStatus,
};

const DIGITALNESS = {
  name: "Digitalness",
  tagline: "Designed and Developed by Digitalness",
  email: "info@digitalness.co.in",
  website: "https://digitalness.co.in",
  address: "Hyderabad, Telangana, India",
  phone: "",
};

const getAuthConfig = () => {
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken");

  return {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  };
};

const safeJson = async (res: Response) => {
  const text = await res.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { message: text || "Invalid server response" };
  }
};

const getArrayData = (data: any) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.proposals)) return data.proposals;
  if (Array.isArray(data?.items)) return data.items;
  return [];
};

const getItemId = (item: Proposal) => item._id || item.id || "";
const cleanPhone = (phone = "") => phone.replace(/\D/g, "");
const cleanObjectId = (value?: string | null) => {
  if (!value || value === "" || value === "null" || value === "undefined") return null;
  return value;
};

const getRefId = (value: any): string => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value._id || value.id || "";
};

const formatINR = (amount: number | string | undefined) =>
  `₹${Number(amount || 0).toLocaleString("en-IN")}`;

const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const formatDate = (date?: string) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (date?: string) => {
  if (!date) return "-";
  return new Date(date).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const parseServices = (text: string, fallbackValue = 0): ProposalService[] => {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length && fallbackValue > 0) {
    return [
      {
        name: "Project Services",
        description: "Custom service package",
        quantity: 1,
        price: fallbackValue,
        total: fallbackValue,
      },
    ];
  }

  return lines.map((line) => {
    const parts = line.split("|").map((part) => part.trim());
    const name = parts[0] || "Service";
    const description = parts[1] || "";
    const quantity = Number(parts[2] || 1);
    const price = Number(parts[3] || parts[2] || 0);

    return {
      name,
      description,
      quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
      price: Number.isFinite(price) ? price : 0,
      total: (Number.isFinite(quantity) && quantity > 0 ? quantity : 1) *
        (Number.isFinite(price) ? price : 0),
    };
  });
};

const servicesToText = (services: ProposalService[] = []) =>
  services
    .map(
      (service) =>
        `${service.name || service.serviceName || ""} | ${service.description || ""
        } | ${service.quantity || 1} | ${service.price || 0}`
    )
    .join("\n");

const parseAttachments = (text: string): ProposalAttachment[] => {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split("|").map((part) => part.trim());
      return {
        fileName: parts[0] || "Attachment",
        fileUrl: parts[1] || "",
        fileType: parts[2] || "",
      };
    });
};

const attachmentsToText = (attachments: ProposalAttachment[] = []) =>
  attachments
    .map(
      (file) =>
        `${file.fileName || ""} | ${file.fileUrl || ""} | ${file.fileType || ""}`
    )
    .join("\n");

const calculateTotals = (services: ProposalService[], discount = 0, gstPercentage = 18) => {
  const subtotal = services.reduce((sum, service) => {
    const total = Number(service.total ?? Number(service.quantity || 1) * Number(service.price || 0));
    return sum + total;
  }, 0);
  const safeDiscount = Number(discount || 0);
  const taxable = Math.max(subtotal - safeDiscount, 0);
  const gstAmount = Math.round((taxable * Number(gstPercentage || 0)) / 100);
  const grandTotal = taxable + gstAmount;
  return { subtotal, discount: safeDiscount, gstPercentage: Number(gstPercentage || 0), gstAmount, grandTotal };
};

const getProposalActivities = (proposal: Proposal): ProposalActivity[] => {
  const activities: ProposalActivity[] = [];

  if (proposal.createdAt) activities.push({ title: "Proposal Created", type: "created", createdAt: proposal.createdAt });
  if (proposal.updatedAt) activities.push({ title: "Proposal Updated", type: "updated", createdAt: proposal.updatedAt });
  if (proposal.sentAt) activities.push({ title: "Proposal Sent", type: "sent", createdAt: proposal.sentAt });
  if (proposal.viewedAt) activities.push({ title: "Proposal Viewed", type: "viewed", createdAt: proposal.viewedAt });
  if (proposal.approvedAt) activities.push({ title: "Proposal Approved", type: "approved", createdAt: proposal.approvedAt });
  if (proposal.rejectedAt) activities.push({ title: "Proposal Rejected", type: "rejected", createdAt: proposal.rejectedAt });

  return [...(proposal.activityLogs || []), ...activities].sort((a, b) => {
    const at = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bt = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bt - at;
  });
};

const statusTone = (status?: ProposalStatus) => {
  if (status === "Approved" || status === "Accepted") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "Rejected" || status === "Expired") return "bg-red-50 text-red-700 border-red-200";
  if (status === "Sent" || status === "Viewed") return "bg-blue-50 text-blue-700 border-blue-200";
  if (status === "Revision Requested") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-slate-50 text-slate-700 border-slate-200";
};

const generateWhatsappMessage = (proposal: Proposal) => {
  const client = proposal.customerName || proposal.clientName || "Client";
  const value = formatINR(proposal.grandTotal || proposal.proposalValue);
  return `Hello ${client},\n\nGreetings from Digitalness.\n\nPlease find your proposal details:\n\nProposal: ${proposal.title}\nProposal No: ${proposal.proposalNumber || "-"}\nValue: ${value}\nStatus: ${proposal.status || "Draft"}\n\nRegards,\nDigitalness Team`;
};

const generateProposalHTML = (proposal: Proposal) => {
  const client = proposal.customerName || proposal.clientName || "-";
  const services = proposal.services || [];
  const totals = calculateTotals(services, proposal.discount || 0, proposal.gstPercentage || 18);
  const servicesRows = services.length
    ? services
      .map(
        (service, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${service.name || service.serviceName || "-"}</td>
            <td>${service.description || "-"}</td>
            <td>${service.quantity || 1}</td>
            <td>${formatINR(service.price)}</td>
            <td>${formatINR(service.total ?? Number(service.quantity || 1) * Number(service.price || 0))}</td>
          </tr>`
      )
      .join("")
    : `<tr><td colspan="6">No services added</td></tr>`;

  const attachmentsRows = (proposal.attachments || []).length
    ? (proposal.attachments || [])
      .map(
        (file, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${file.fileName || "-"}</td>
            <td>${file.fileType || "-"}</td>
            <td>${file.fileUrl || "-"}</td>
          </tr>`
      )
      .join("")
    : `<tr><td colspan="4">No attachments added</td></tr>`;

  return `<!doctype html>
<html>
<head>
  <title>${proposal.title || "Proposal"}</title>
  <style>
    body { font-family: Arial, sans-serif; color: #111827; margin: 0; background: #f3f4f6; }
    .page { max-width: 950px; margin: 24px auto; background: #fff; padding: 40px; border-radius: 18px; }
    .header { display: flex; justify-content: space-between; gap: 20px; border-bottom: 3px solid #111827; padding-bottom: 20px; }
    .brand { font-size: 28px; font-weight: 800; color: #111827; }
    .tagline { color: #6b7280; margin-top: 4px; }
    h1 { font-size: 30px; margin: 24px 0 8px; }
    h2 { font-size: 18px; margin: 28px 0 12px; color: #111827; }
    .badge { display:inline-block; padding:6px 10px; border-radius:999px; background:#f3f4f6; font-size:12px; }
    .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-top: 18px; }
    .box { border:1px solid #e5e7eb; border-radius:12px; padding:14px; }
    .label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: .04em; }
    .value { margin-top:4px; font-size: 15px; font-weight: 600; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border: 1px solid #e5e7eb; padding: 10px; text-align: left; font-size: 13px; vertical-align: top; }
    th { background: #111827; color: #ffffff; }
    .summary { margin-left:auto; margin-top:16px; width:320px; border:1px solid #e5e7eb; border-radius:12px; padding:14px; }
    .summary-row { display:flex; justify-content:space-between; padding:6px 0; }
    .grand { font-size:20px; font-weight:800; border-top:1px solid #e5e7eb; margin-top:8px; padding-top:10px; }
    .section { margin-top: 26px; }
    .signatures { display:grid; grid-template-columns:repeat(2,1fr); gap:18px; margin-top:40px; }
    .signature-box { border:1px dashed #9ca3af; border-radius:12px; padding:20px; height:100px; }
    .footer { margin-top: 40px; border-top: 1px solid #e5e7eb; padding-top: 18px; color: #6b7280; font-size: 13px; }
    @media print { body { background:#fff; } .page { margin:0; border-radius:0; } button { display:none; } }
  </style>
</head>
<body>
  <div class="page">
    <button onclick="window.print()" style="margin-bottom:20px;padding:10px 16px;cursor:pointer;">Download / Save as PDF</button>
    <div class="header">
      <div>
        <div class="brand">${DIGITALNESS.name}</div>
        <div class="tagline">${DIGITALNESS.tagline}</div>
        <div class="tagline">${DIGITALNESS.website} • ${DIGITALNESS.address}</div>
      </div>
      <div style="text-align:right">
        <div class="badge">${proposal.status || "Draft"}</div>
        <p><b>Proposal No:</b> ${proposal.proposalNumber || "-"}</p>
        <p><b>Date:</b> ${formatDate(proposal.createdAt)}</p>
        <p><b>Valid Until:</b> ${formatDate(proposal.validUntil)}</p>
      </div>
    </div>

    <h1>${proposal.title || "Business Proposal"}</h1>
    <p>Prepared for <b>${client}</b></p>

    <div class="grid">
      <div class="box"><div class="label">Client Name</div><div class="value">${client}</div></div>
      <div class="box"><div class="label">Company</div><div class="value">${proposal.companyName || "-"}</div></div>
      <div class="box"><div class="label">Contact Number</div><div class="value">${proposal.contactNumber || "-"}</div></div>
      <div class="box"><div class="label">Client Email</div><div class="value">${proposal.clientEmail || proposal.email || "-"}</div></div>
      <div class="box"><div class="label">Business Type</div><div class="value">${proposal.businessType || "-"}</div></div>
      <div class="box"><div class="label">Package</div><div class="value">${proposal.packageName || "Custom Package"}</div></div>
    </div>

    <div class="section">
      <h2>Services & Pricing</h2>
      <table><thead><tr><th>S.No</th><th>Service</th><th>Description</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead><tbody>${servicesRows}</tbody></table>
      <div class="summary">
        <div class="summary-row"><span>Subtotal</span><b>${formatINR(totals.subtotal)}</b></div>
        <div class="summary-row"><span>Discount</span><b>${formatINR(totals.discount)}</b></div>
        <div class="summary-row"><span>GST (${totals.gstPercentage}%)</span><b>${formatINR(totals.gstAmount)}</b></div>
        <div class="summary-row grand"><span>Grand Total</span><span>${formatINR(totals.grandTotal)}</span></div>
      </div>
    </div>

    <div class="section"><h2>Scope of Work</h2><p>${proposal.scopeOfWork || proposal.requirements || "-"}</p></div>
    <div class="section"><h2>Deliverables</h2><p>${proposal.deliverables || "-"}</p></div>
    <div class="section"><h2>Timeline</h2><p>${proposal.timeline || proposal.projectTimeline || "-"}</p></div>
    <div class="section"><h2>Payment Terms</h2><p>${proposal.paymentTerms || "-"}</p></div>
    <div class="section"><h2>Terms & Conditions</h2><p>${proposal.termsAndConditions || "-"}</p></div>
    <div class="section"><h2>Cancellation Policy</h2><p>${proposal.cancellationPolicy || "-"}</p></div>
    <div class="section"><h2>Support Period</h2><p>${proposal.supportPeriod || "-"}</p></div>

    <div class="section">
      <h2>Attachments</h2>
      <table><thead><tr><th>S.No</th><th>File Name</th><th>Type</th><th>URL</th></tr></thead><tbody>${attachmentsRows}</tbody></table>
    </div>

    <div class="signatures">
      <div class="signature-box"><b>Customer Signature</b><br/>${proposal.customerSignatureUrl || ""}</div>
      <div class="signature-box"><b>Authorized Signature</b><br/>${proposal.digitalSignatureName || "Digitalness"}<br/>${proposal.authorizedSignatureUrl || proposal.authorizedSignature || ""}</div>
    </div>

    <div class="footer">Regards,<br/><b>Digitalness Team</b><br/>${DIGITALNESS.email} • ${DIGITALNESS.website}</div>
  </div>
</body>
</html>`;
};

export default function ProposalsPage() {
  const { toast } = useToast();

  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [dealsLoading, setDealsLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [agreementFile, setAgreementFile] = useState<File | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [open, setOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewProposal, setPreviewProposal] = useState<Proposal | null>(null);
  const [editing, setEditing] = useState<Proposal | null>(null);
  const [form, setForm] = useState(blankForm);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sendingId, setSendingId] = useState("");
  const [versioningId, setVersioningId] = useState("");

  // Billing configuration modal state
  const [billingModalOpen, setBillingModalOpen] = useState(false);
  const [billingProposal, setBillingProposal] = useState<Proposal | null>(null);
  const [billingForm, setBillingForm] = useState({
    billingCycle: "Project",
    agreedAmount: "",
    advancePaid: "0",
    advancePaymentDate: new Date().toISOString().split("T")[0],
    advancePaymentMethod: "UPI",
    advancePaymentReference: "",
    advanceNotes: "",
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  });
  const [savingBilling, setSavingBilling] = useState(false);

  const openBillingModal = (proposal: Proposal) => {
    setBillingProposal(proposal);
    const proposalVal = Number(proposal.grandTotal || proposal.proposalValue || 0);
    const existingAgreed = proposal.agreedAmount !== undefined && proposal.agreedAmount > 0
      ? String(proposal.agreedAmount)
      : String(proposalVal);
    const existingAdvance = proposal.advancePaid !== undefined
      ? String(proposal.advancePaid)
      : "0";
    const existingDueDate = proposal.dueDate
      ? new Date(proposal.dueDate).toISOString().split("T")[0]
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const existingAdvanceDate = proposal.advancePaymentDate
      ? new Date(proposal.advancePaymentDate).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0];

    setBillingForm({
      billingCycle: proposal.billingCycle || "Project",
      agreedAmount: existingAgreed,
      advancePaid: existingAdvance,
      advancePaymentDate: existingAdvanceDate,
      advancePaymentMethod: proposal.advancePaymentMethod || "UPI",
      advancePaymentReference: proposal.advancePaymentReference || "",
      advanceNotes: proposal.advanceNotes || "",
      dueDate: existingDueDate,
    });
    setBillingModalOpen(true);
  };

  const handleSaveBilling = async () => {
    if (!billingProposal) return;
    try {
      setSavingBilling(true);
      const proposalId = getItemId(billingProposal);
      const res = await fetch(`${API_URL}/proposals/${proposalId}/configure-billing`, {
        method: "POST",
        ...getAuthConfig(),
        body: JSON.stringify({
          billingCycle: billingForm.billingCycle,
          agreedAmount: Number(billingForm.agreedAmount || 0),
          advancePaid: Number(billingForm.advancePaid || 0),
          advancePaymentDate: billingForm.advancePaymentDate,
          advancePaymentMethod: billingForm.advancePaymentMethod,
          advancePaymentReference: billingForm.advancePaymentReference,
          advanceNotes: billingForm.advanceNotes,
          dueDate: billingForm.dueDate,
        }),
      });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.message || "Failed to configure billing");

      const updated = data.data?.proposal || data.proposal || data.data || data;
      setProposals((prev) => prev.map((p) => (getItemId(p) === proposalId ? updated : p)));
      if (previewProposal && getItemId(previewProposal) === proposalId) {
        setPreviewProposal(updated);
      }
      toast({
        title: "Client Billing Configured! 🎉",
        description: `${billingForm.billingCycle} billing successfully configured. Invoice generated & reflected to Client Portal.`,
      });
      setBillingModalOpen(false);
      window.dispatchEvent(new CustomEvent("crm_proposal_updated", { detail: updated }));
      fetchProposals();
    } catch (err: any) {
      toast({
        title: "Configuration Failed",
        description: err.message || "Could not configure billing",
        variant: "destructive",
      });
    } finally {
      setSavingBilling(false);
    }
  };

  const fetchProposals = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/proposals`, {
        method: "GET",
        ...getAuthConfig(),
      });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.message || "Failed to fetch proposals");
      setProposals(getArrayData(data));
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to fetch proposals", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      setCustomersLoading(true);
      const res = await fetch(`${API_URL}/customers`, {
        method: "GET",
        ...getAuthConfig(),
      });
      const data = await safeJson(res);
      if (res.ok) {
        setCustomers(getArrayData(data));
      }
    } catch (error: any) {
      console.warn("Fetch customers error:", error.message);
    } finally {
      setCustomersLoading(false);
    }
  };

  const fetchDeals = async () => {
    try {
      setDealsLoading(true);
      const res = await fetch(`${API_URL}/deals`, {
        method: "GET",
        ...getAuthConfig(),
      });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.message || "Failed to fetch deals");
      setDeals(getArrayData(data));
    } catch (error: any) {
      console.error("Fetch deals error:", error.message);
      toast({
        title: "Deals not loaded",
        description: error.message || "Unable to load deal dropdown",
        variant: "destructive",
      });
    } finally {
      setDealsLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals();
    fetchDeals();
    fetchCustomers();

    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get("search");
    if (searchParam) {
      setSearch(searchParam);
    }
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const dealIdParam = urlParams.get("dealId");
    if (dealIdParam && deals.length > 0) {
      handleDealSelect(dealIdParam);
      setOpen(true);
    }
  }, [deals]);

  // Real-time synchronization across CRM sections
  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }

    const handleProposalCreated = (data: any) => {
      if (!data) return;
      setProposals((prev) => {
        const id = getItemId(data);
        if (prev.some((p) => getItemId(p) === id)) {
          return prev.map((p) => (getItemId(p) === id ? data : p));
        }
        return [data, ...prev];
      });
    };

    const handleProposalUpdated = (data: any) => {
      if (!data) return;
      const id = getItemId(data);
      setProposals((prev) => prev.map((p) => (getItemId(p) === id ? data : p)));
      setPreviewProposal((prev) => (prev && getItemId(prev) === id ? data : prev));
    };

    const handleProposalDeleted = (data: any) => {
      const id = data?._id || data?.id;
      if (id) {
        setProposals((prev) => prev.filter((p) => getItemId(p) !== id));
      }
    };

    const handleLocalSync = (e: any) => {
      if (e.detail) {
        handleProposalUpdated(e.detail);
      } else {
        fetchProposals();
      }
    };

    socket.on("proposal_created", handleProposalCreated);
    socket.on("proposal_updated", handleProposalUpdated);
    socket.on("proposal_status_updated", handleProposalUpdated);
    socket.on("proposal_deleted", handleProposalDeleted);
    window.addEventListener("crm_proposal_updated", handleLocalSync);

    return () => {
      socket.off("proposal_created", handleProposalCreated);
      socket.off("proposal_updated", handleProposalUpdated);
      socket.off("proposal_status_updated", handleProposalUpdated);
      socket.off("proposal_deleted", handleProposalDeleted);
      window.removeEventListener("crm_proposal_updated", handleLocalSync);
    };
  }, []);

  const analytics = useMemo(() => {
    const total = proposals.length;
    const approved = proposals.filter((p) => p.status === "Approved" || p.status === "Accepted").length;
    const rejected = proposals.filter((p) => p.status === "Rejected").length;
    const sent = proposals.filter((p) => p.status === "Sent" || p.status === "Viewed" || p.mailSent).length;
    const revision = proposals.filter((p) => p.status === "Revision Requested").length;
    const pending = proposals.filter((p) => ["Draft", "Sent", "Viewed", "Revision Requested"].includes(p.status)).length;
    const totalValue = proposals.reduce((sum, p) => sum + Number(p.grandTotal || p.proposalValue || 0), 0);
    const approvedValue = proposals
      .filter((p) => p.status === "Approved" || p.status === "Accepted")
      .reduce((sum, p) => sum + Number(p.grandTotal || p.proposalValue || 0), 0);
    const conversionRate = total ? Math.round((approved / total) * 100) : 0;
    return { total, approved, rejected, sent, revision, pending, totalValue, approvedValue, conversionRate };
  }, [proposals]);

  const filtered = useMemo(() => {
    return proposals.filter((p) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        p.proposalNumber?.toLowerCase().includes(q) ||
        p.customerName?.toLowerCase().includes(q) ||
        p.clientName?.toLowerCase().includes(q) ||
        p.companyName?.toLowerCase().includes(q) ||
        p.title?.toLowerCase().includes(q) ||
        p.contactNumber?.toLowerCase().includes(q) ||
        p.clientEmail?.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q) ||
        p.businessType?.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "All" || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [proposals, search, statusFilter]);

  const resetForm = () => {
    setForm(blankForm);
    setEditing(null);
  };

  const handleDealSelect = (dealId: string) => {
    if (!dealId || dealId === "manual") {
      setForm((prev) => ({
        ...prev,
        dealId: "",
        leadId: "",
        customerId: "",
        assignedTo: "",
        customerName: "",
        companyName: "",
        contactNumber: "",
        businessType: "",
        branchId: "",
        proposalValue: "",
      }));
      return;
    }

    const selectedDeal = deals.find((deal) => (deal._id || deal.id) === dealId);

    if (!selectedDeal) return;

    const leadId = getRefId(selectedDeal.leadId);
    const assignedTo = getRefId(selectedDeal.assignedTo);
    const customerId = getRefId(selectedDeal.customerId);
    const customerName = selectedDeal.customerName || "";
    const dealValue = Number(selectedDeal.dealValue || 0);

    setForm((prev) => ({
      ...prev,
      dealId: selectedDeal._id || selectedDeal.id || "",
      leadId,
      customerId,
      assignedTo,
      customerName,
      companyName: prev.companyName || customerName,
      contactNumber: selectedDeal.contactNumber || "",
      businessType: selectedDeal.businessType || "",
      branchId: selectedDeal.branchId || "",
      proposalValue: dealValue ? String(dealValue) : prev.proposalValue,
      title: prev.title || `${selectedDeal.title || "Deal"} Proposal`,
      requirements: prev.requirements || selectedDeal.notes || "",
      mailSubject: prev.mailSubject || `Proposal from Digitalness - ${customerName}`,
      mailMessage:
        prev.mailMessage ||
        `Dear ${customerName || "Client"},\n\nPlease find your proposal details. Kindly review and confirm.\n\nRegards,\nDigitalness Team`,
    }));
  };

  const handleClientSelect = (customerId: string) => {
    if (customerId === "manual") {
      setForm((prev) => ({
        ...prev,
        customerId: "",
        customerName: "",
        companyName: "",
        contactNumber: "",
        clientEmail: "",
        businessType: "",
        branchId: "",
        title: "",
      }));
      return;
    }

    const selectedCust = customers.find(
      (c) => (c._id || c.id) === customerId
    );
    if (!selectedCust) return;

    const custName = selectedCust.name || selectedCust.companyName || "";
    const phone =
      (Array.isArray(selectedCust.contactNumbers) && selectedCust.contactNumbers[0]) ||
      selectedCust.phone ||
      selectedCust.contactNumber ||
      "";
    const email = selectedCust.email || "";
    const company = selectedCust.companyName || selectedCust.name || "";
    const bType = selectedCust.businessType || "";
    const branch = selectedCust.branchId || "";

    setForm((prev) => ({
      ...prev,
      customerId,
      customerName: custName,
      companyName: company,
      contactNumber: phone,
      clientEmail: email,
      businessType: bType,
      branchId: branch,
      title: `${custName} - Client Service Agreement`,
      status: "Sent",
      mailSubject: `Agreement & Project Proposal for ${custName} - Digitalness`,
      mailMessage: `Dear ${custName},\n\nPlease review your service agreement document prepared by Digitalness. Kindly review and approve via your Client Portal.\n\nRegards,\nDigitalness Team`,
    }));
  };

  const openCreate = () => {
    resetForm();
    setAgreementFile(null);
    setOpen(true);
  };

  const openEdit = (proposal: Proposal) => {
    setEditing(proposal);
    setForm({
      customerName: proposal.customerName || proposal.clientName || "",
      companyName: proposal.companyName || "",
      contactNumber: proposal.contactNumber || "",
      clientEmail: proposal.clientEmail || proposal.email || "",
      address: proposal.address || "",
      city: proposal.city || "",
      state: proposal.state || "",
      businessType: proposal.businessType || "",
      gstNumber: proposal.gstNumber || "",
      panNumber: proposal.panNumber || "",
      branchId: proposal.branchId || "",
      dealId: getRefId(proposal.dealId),
      leadId: getRefId(proposal.leadId),
      customerId: getRefId(proposal.customerId),
      assignedTo: getRefId(proposal.assignedTo),
      parentProposalId: proposal.parentProposalId || "",
      version: String(proposal.version || 1),
      title: proposal.title || "",
      packageName: proposal.packageName || "",
      proposalValue: String(proposal.proposalValue || proposal.grandTotal || ""),
      discount: String(proposal.discount || 0),
      gstPercentage: String(proposal.gstPercentage ?? 18),
      validUntil: proposal.validUntil ? proposal.validUntil.slice(0, 10) : "",
      requirements: proposal.requirements || "",
      scopeOfWork: proposal.scopeOfWork || "",
      deliverables: proposal.deliverables || "",
      projectTimeline: proposal.timeline || proposal.projectTimeline || "",
      paymentTerms: proposal.paymentTerms || blankForm.paymentTerms,
      termsAndConditions: proposal.termsAndConditions || blankForm.termsAndConditions,
      cancellationPolicy: proposal.cancellationPolicy || blankForm.cancellationPolicy,
      supportPeriod: proposal.supportPeriod || blankForm.supportPeriod,
      servicesText: servicesToText(proposal.services),
      attachmentsText: attachmentsToText(proposal.attachments),
      customerSignatureUrl: proposal.customerSignatureUrl || "",
      authorizedSignatureUrl: proposal.authorizedSignatureUrl || proposal.authorizedSignature || "",
      companyStampUrl: proposal.companyStampUrl || proposal.companyStamp || "",
      digitalSignatureName: proposal.digitalSignatureName || "Authorized Signatory",
      notes: proposal.notes || "",
      mailSubject: proposal.mailSubject || `Proposal from Digitalness - ${proposal.customerName || proposal.clientName || ""}`,
      mailMessage: proposal.mailMessage || `Dear ${proposal.customerName || proposal.clientName || "Client"},\n\nPlease find your proposal details. Kindly review and confirm.\n\nRegards,\nDigitalness Team`,
      status: proposal.status || "Draft",
    });
    setOpen(true);
  };

  const openNewVersion = async (proposal: Proposal) => {
    try {
      const proposalId = getItemId(proposal);
      if (!proposalId) {
        toast({
          title: "Save proposal first",
          description: "A saved proposal is required before creating a new version.",
          variant: "destructive",
        });
        return;
      }

      setVersioningId(proposalId);

      const res = await fetch(`${API_URL}/proposals/${proposalId}/version`, {
        method: "POST",
        ...getAuthConfig(),
        body: JSON.stringify({
          status: "Draft",
          notes: `Revision created from ${proposal.proposalNumber || proposal.title}`,
        }),
      });

      const data = await safeJson(res);

      if (!res.ok) {
        throw new Error(data.message || "Failed to create proposal version");
      }

      const newVersion = data.data || data.proposal || data;
      setProposals((prev) => [newVersion, ...prev]);

      toast({
        title: "New version created",
        description: `${newVersion.proposalNumber || "Proposal"} V${newVersion.version || ""} created successfully`,
      });

      openEdit(newVersion);
    } catch (error: any) {
      toast({
        title: "Version failed",
        description: error.message || "Failed to create new proposal version",
        variant: "destructive",
      });
    } finally {
      setVersioningId("");
    }
  };

  const applyTemplate = (templateName: string) => {
    const template = proposalTemplates[templateName];

    if (!template) return;

    const services = parseServices(template.servicesText);
    const totals = calculateTotals(
      services,
      Number(template.discount || 0),
      Number(template.gstPercentage || 18)
    );

    setForm((prev) => ({
      ...prev,
      title: template.title,
      packageName: template.packageName,
      servicesText: template.servicesText,
      proposalValue: String(totals.grandTotal),
      discount: template.discount ?? prev.discount ?? "0",
      gstPercentage: template.gstPercentage ?? prev.gstPercentage ?? "18",
      requirements: template.requirements,
      scopeOfWork: template.scopeOfWork,
      deliverables: template.deliverables,
      projectTimeline: template.projectTimeline,
      paymentTerms: template.paymentTerms,
      termsAndConditions: template.termsAndConditions,
      cancellationPolicy: template.cancellationPolicy,
      supportPeriod: template.supportPeriod,
      notes: template.notes || prev.notes,
      mailSubject: template.mailSubject,
      mailMessage: template.mailMessage,
    }));

    toast({
      title: "Template applied",
      description: `${template.label} details filled automatically`,
    });
  };

  const buildPayload = () => {
    const services = parseServices(form.servicesText, Number(form.proposalValue || 0));
    const totals = calculateTotals(services, Number(form.discount || 0), Number(form.gstPercentage || 18));
    return {
      customerName: form.customerName.trim(),
      clientName: form.customerName.trim(),
      companyName: form.companyName.trim(),
      contactNumber: form.contactNumber.trim(),
      clientEmail: form.clientEmail.trim(),
      email: form.clientEmail.trim(),
      address: form.address,
      city: form.city,
      state: form.state,
      businessType: form.businessType,
      gstNumber: form.gstNumber,
      panNumber: form.panNumber,
      branchId: form.branchId,
      dealId: cleanObjectId(form.dealId),
      leadId: cleanObjectId(form.leadId),
      customerId: cleanObjectId(form.customerId),
      assignedTo: cleanObjectId(form.assignedTo),
      parentProposalId: cleanObjectId(form.parentProposalId),
      version: Number(form.version || 1),
      title: form.title.trim(),
      packageName: form.packageName,
      proposalValue: totals.grandTotal,
      subtotal: totals.subtotal,
      discount: totals.discount,
      gstPercentage: totals.gstPercentage,
      gstAmount: totals.gstAmount,
      grandTotal: totals.grandTotal,
      validUntil: form.validUntil || null,
      requirements: form.requirements,
      scopeOfWork: form.scopeOfWork,
      deliverables: form.deliverables,
      timeline: form.projectTimeline,
      projectTimeline: form.projectTimeline,
      paymentTerms: form.paymentTerms,
      termsAndConditions: form.termsAndConditions,
      cancellationPolicy: form.cancellationPolicy,
      supportPeriod: form.supportPeriod,
      services,
      attachments: parseAttachments(form.attachmentsText),
      customerSignatureUrl: form.customerSignatureUrl,
      authorizedSignatureUrl: form.authorizedSignatureUrl,
      companyStampUrl: form.companyStampUrl,
      digitalSignatureName: form.digitalSignatureName,
      notes: form.notes,
      mailSubject: form.mailSubject || `Proposal from Digitalness - ${form.customerName}`,
      mailMessage: form.mailMessage || `Dear ${form.customerName},\n\nPlease find your proposal details. Kindly review and confirm.\n\nRegards,\nDigitalness Team`,
      status: form.status,
    };
  };

  const handleSave = async () => {
    try {
      if (!form.customerName.trim()) {
        toast({ title: "Select Client", description: "Please select a client to create the agreement proposal", variant: "destructive" });
        return;
      }

      setSaving(true);
      let uploadedDocUrl = form.documentUrl || "";
      let uploadedDocName = form.documentName || "";

      // If a new agreement file was chosen, upload it to the backend
      if (agreementFile) {
        const formData = new FormData();
        formData.append("document", agreementFile);

        const token =
          localStorage.getItem("token") ||
          localStorage.getItem("authToken") ||
          localStorage.getItem("accessToken");

        const uploadRes = await fetch(`${API_URL}/proposals/upload-document`, {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        });

        const uploadData = await safeJson(uploadRes);
        if (uploadRes.ok && uploadData.fileUrl) {
          uploadedDocUrl = uploadData.fileUrl;
          uploadedDocName = uploadData.fileName || agreementFile.name;
        } else {
          throw new Error(uploadData.message || "Failed to upload agreement document");
        }
      }

      const payload = buildPayload();
      payload.documentUrl = uploadedDocUrl;
      payload.documentName = uploadedDocName;

      if (uploadedDocUrl) {
        const docAtt = {
          fileName: uploadedDocName || "Agreement Document",
          fileUrl: uploadedDocUrl,
          fileType: agreementFile?.type || "application/pdf",
          uploadedAt: new Date().toISOString(),
        };
        const existingAtts = Array.isArray(payload.attachments) ? payload.attachments : [];
        payload.attachments = [docAtt, ...existingAtts.filter((a: any) => a.fileUrl !== uploadedDocUrl)];
      }

      const proposalId = editing ? getItemId(editing) : "";
      const url = editing ? `${API_URL}/proposals/${proposalId}` : `${API_URL}/proposals`;

      const res = await fetch(url, {
        method: editing ? "PUT" : "POST",
        ...getAuthConfig(),
        body: JSON.stringify(payload),
      });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.message || "Failed to save proposal");

      const savedProposal = data.data || data.proposal || data;
      if (editing) {
        setProposals((prev) => prev.map((p) => (getItemId(p) === proposalId ? savedProposal : p)));
      } else {
        setProposals((prev) => [savedProposal, ...prev]);
      }
      toast({ title: "Agreement Saved & Sent", description: "Agreement uploaded and reflected to client portal for approval." });
      window.dispatchEvent(new CustomEvent("crm_proposal_updated", { detail: savedProposal }));
      window.dispatchEvent(new CustomEvent("crm_deal_updated", { detail: savedProposal.dealId }));
      window.dispatchEvent(new CustomEvent("crm_lead_updated", { detail: savedProposal.leadId }));
      fetchProposals();
      setOpen(false);
      resetForm();
      setAgreementFile(null);
    } catch (error: any) {
      toast({ title: "Save failed", description: error.message || "Failed to save proposal", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (proposal: Proposal, status: ProposalStatus) => {
    if (status === "Approved" || status === "Accepted") {
      openBillingModal(proposal);
      return;
    }
    try {
      const proposalId = getItemId(proposal);
      const res = await fetch(`${API_URL}/proposals/${proposalId}/status`, {
        method: "PATCH",
        ...getAuthConfig(),
        body: JSON.stringify({ status }),
      });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.message || "Failed to update status");
      const updatedProposal = data.data || data.proposal || data;
      setProposals((prev) => prev.map((p) => (getItemId(p) === proposalId ? updatedProposal : p)));
      toast({ title: "Status updated", description: `Proposal marked as ${status} & synced across CRM` });
      window.dispatchEvent(new CustomEvent("crm_proposal_updated", { detail: updatedProposal }));
      window.dispatchEvent(new CustomEvent("crm_deal_updated", { detail: updatedProposal.dealId }));
      window.dispatchEvent(new CustomEvent("crm_lead_updated", { detail: updatedProposal.leadId }));
      fetchProposals();
    } catch (error: any) {
      toast({ title: "Status update failed", description: error.message || "Failed to update proposal status", variant: "destructive" });
    }
  };

  const handleSendMail = async (proposal: Proposal) => {
    try {
      const proposalId = getItemId(proposal);
      if (!proposalId) {
        toast({ title: "Save proposal first", description: "Please save the proposal before sending mail.", variant: "destructive" });
        return;
      }
      let clientEmail = proposal.clientEmail || proposal.email || "";
      if (!clientEmail.trim()) {
        const enteredEmail = window.prompt(`Client email is missing for ${proposal.customerName || proposal.clientName || "this proposal"}.\n\nPlease enter client email:`);
        if (!enteredEmail?.trim()) return;
        clientEmail = enteredEmail.trim();
        if (!isValidEmail(clientEmail)) {
          toast({ title: "Invalid email", description: "Please enter a valid email address.", variant: "destructive" });
          return;
        }
      }
      setSendingId(proposalId);
      const res = await fetch(`${API_URL}/proposals/${proposalId}/send-mail`, {
        method: "POST",
        ...getAuthConfig(),
        body: JSON.stringify({
          clientEmail,
          subject: proposal.mailSubject || `Proposal from Digitalness - ${proposal.customerName || proposal.clientName}`,
          message: proposal.mailMessage || generateWhatsappMessage(proposal),
        }),
      });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.message || "Failed to send mail");
      const updatedProposal = data.data || data.proposal || data;
      setProposals((prev) => prev.map((p) => (getItemId(p) === proposalId ? updatedProposal : p)));
      toast({ title: "Mail sent successfully", description: `Proposal sent to ${clientEmail}` });
      window.dispatchEvent(new CustomEvent("crm_proposal_updated", { detail: updatedProposal }));
      window.dispatchEvent(new CustomEvent("crm_deal_updated", { detail: updatedProposal.dealId }));
    } catch (error: any) {
      toast({ title: "Mail failed", description: error.message || "Failed to send proposal mail", variant: "destructive" });
    } finally {
      setSendingId("");
    }
  };

  const handleWhatsapp = (proposal: Proposal) => {
    const phone = cleanPhone(proposal.contactNumber);
    if (!phone) {
      toast({ title: "Contact number missing", description: "Please add client contact number first.", variant: "destructive" });
      return;
    }
    const finalPhone = phone.length === 10 ? `91${phone}` : phone;
    const message = encodeURIComponent(generateWhatsappMessage(proposal));
    window.open(`https://wa.me/${finalPhone}?text=${message}`, "_blank");
  };

  const handleDownloadProposal = (proposal: Proposal) => {
    const html = generateProposalHTML(proposal);
    const win = window.open("", "_blank");
    if (!win) {
      toast({ title: "Popup blocked", description: "Please allow popups to download proposal.", variant: "destructive" });
      return;
    }
    win.document.write(html);
    win.document.close();
  };

  const handleCopyLink = async (proposal: Proposal) => {
    const id = getItemId(proposal);
    const link = `${window.location.origin}/proposals/${id}`;
    await navigator.clipboard.writeText(link);
    toast({ title: "Copied", description: "Proposal link copied" });
  };

  const handleDelete = async (proposal: Proposal) => {
    try {
      const proposalId = getItemId(proposal);
      const res = await fetch(`${API_URL}/proposals/${proposalId}`, {
        method: "DELETE",
        ...getAuthConfig(),
      });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.message || "Failed to delete proposal");
      setProposals((prev) => prev.filter((p) => getItemId(p) !== proposalId));
      toast({ title: "Deleted", description: "Proposal deleted successfully" });
    } catch (error: any) {
      toast({ title: "Delete failed", description: error.message || "Failed to delete proposal", variant: "destructive" });
    }
  };

  const renderMiniTimeline = (proposal: Proposal) => {
    const activities = getProposalActivities(proposal).slice(0, 4);
    if (!activities.length) return <p className="text-xs text-muted-foreground">No activity yet</p>;
    return (
      <div className="space-y-2">
        {activities.map((item, index) => (
          <div key={index} className="flex gap-2 text-xs">
            <span className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" />
            <div>
              <p className="font-medium">{item.title || item.type || "Activity"}</p>
              <p className="text-muted-foreground">{formatDateTime(item.createdAt)}</p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-heading font-bold">Proposals</h1>
          <p className="text-muted-foreground">Create, version, approve, email, WhatsApp and download Digitalness proposals</p>
        </div>
        <Button variant="gradient" onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Create Proposal
        </Button>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border shadow-card"><FileText className="w-5 h-5 text-primary mb-2" /><p className="text-sm text-muted-foreground">Total</p><p className="text-2xl font-bold">{analytics.total}</p></div>
        <div className="p-4 rounded-xl bg-card border border-border shadow-card"><IndianRupee className="w-5 h-5 text-success mb-2" /><p className="text-sm text-muted-foreground">Total Value</p><p className="text-2xl font-bold">{formatINR(analytics.totalValue)}</p></div>
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200"><MailCheck className="w-5 h-5 text-blue-700 mb-2" /><p className="text-sm text-muted-foreground">Sent/Viewed</p><p className="text-2xl font-bold text-blue-700">{analytics.sent}</p></div>
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200"><BadgeCheck className="w-5 h-5 text-emerald-700 mb-2" /><p className="text-sm text-muted-foreground">Approved</p><p className="text-2xl font-bold text-emerald-700">{analytics.approved}</p></div>
        <div className="p-4 rounded-xl bg-red-50 border border-red-200"><XCircle className="w-5 h-5 text-red-700 mb-2" /><p className="text-sm text-muted-foreground">Rejected</p><p className="text-2xl font-bold text-red-700">{analytics.rejected}</p></div>
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200"><BarChart3 className="w-5 h-5 text-amber-700 mb-2" /><p className="text-sm text-muted-foreground">Conversion</p><p className="text-2xl font-bold text-amber-700">{analytics.conversionRate}%</p></div>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search proposal, client, email, business..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[230px]"><SelectValue placeholder="Filter status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Statuses</SelectItem>
            {statusOptions.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {loading && <div className="p-6 rounded-xl border bg-card text-muted-foreground">Loading proposals...</div>}

        {!loading && filtered.map((proposal) => {
          const id = getItemId(proposal);
          const email = proposal.clientEmail || proposal.email;
          const value = proposal.grandTotal || proposal.proposalValue;

          return (
            <motion.div key={id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="p-5 rounded-xl bg-card border border-border shadow-card">
              <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold">{proposal.title}</h3>
                    <span className={`text-xs px-2.5 py-1 rounded-full border ${statusTone(proposal.status)}`}>{proposal.status || "Draft"}</span>
                    <Badge variant="outline">V{proposal.version || 1}</Badge>
                    {proposal.proposalNumber && <Badge variant="outline">{proposal.proposalNumber}</Badge>}
                    {proposal.mailSent && <Badge variant="outline">Mail Sent</Badge>}
                    {proposal.customerCreated && <Badge variant="outline">Customer Created</Badge>}
                    {!email && <Badge variant="destructive">Email Missing</Badge>}
                  </div>

                  <p className="text-sm text-muted-foreground">{proposal.customerName || proposal.clientName} • {proposal.contactNumber} • {email || "No email"}</p>

                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
                    <div className="p-3 rounded-lg bg-muted/40"><p className="text-muted-foreground">Business</p><p className="font-semibold">{proposal.businessType || "-"}</p></div>
                    <div className="p-3 rounded-lg bg-muted/40"><p className="text-muted-foreground">Package</p><p className="font-semibold">{proposal.packageName || "Custom"}</p></div>
                    <div className="p-3 rounded-lg bg-muted/40"><p className="text-muted-foreground">Value</p><p className="font-semibold">{formatINR(value)}</p></div>
                    <div className="p-3 rounded-lg bg-muted/40"><p className="text-muted-foreground">Valid Until</p><p className="font-semibold">{formatDate(proposal.validUntil)}</p></div>
                  </div>

                  {/* Settlement & Billing Summary Banner if Approved/Accepted */}
                  {(proposal.status === "Approved" || proposal.status === "Accepted") && (
                    <div className="mt-3">
                      {proposal.billingConfigured ? (
                        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge className="bg-emerald-600 text-white font-bold text-[11px]">
                                {proposal.billingCycle || "Project"} Retainer
                              </Badge>
                              <span className="text-xs font-bold text-foreground">
                                Contract Value: {formatINR(proposal.agreedAmount || proposal.grandTotal)}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Advance Paid: <strong className="text-emerald-600 dark:text-emerald-400">{formatINR(proposal.advancePaid || 0)}</strong>
                              {proposal.advancePaymentMethod ? ` (${proposal.advancePaymentMethod})` : ""}
                              {" • "}
                              Pending Balance: <strong className={proposal.balancePending ? "text-amber-600 dark:text-amber-400 font-bold" : "text-emerald-600 font-bold"}>{formatINR(proposal.balancePending || 0)}</strong>
                              {proposal.dueDate ? ` (Due: ${formatDate(proposal.dueDate)})` : ""}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 font-bold text-xs shrink-0"
                            onClick={() => openBillingModal(proposal)}
                          >
                            <CreditCard className="w-3.5 h-3.5 mr-1" />
                            Update Billing / Advance
                          </Button>
                        </div>
                      ) : (
                        <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-emerald-500/10 to-transparent border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                              Agreement Approved by Client — Billing Setup Required
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Configure billing model (Monthly / Project / Yearly), confirm agreed value amount, and record advance paid.
                            </p>
                          </div>
                          <Button
                            size="sm"
                            className="bg-gradient-to-r from-amber-500 to-emerald-600 text-white font-bold shadow-md hover:from-amber-600 hover:to-emerald-700 shrink-0 text-xs"
                            onClick={() => openBillingModal(proposal)}
                          >
                            <CreditCard className="w-3.5 h-3.5 mr-1.5" />
                            Setup Billing (Monthly/Project/Yearly)
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 xl:max-w-[520px] xl:justify-end">
                  {(proposal.documentUrl || (proposal.attachments && proposal.attachments.length > 0)) && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-primary/50 text-primary hover:bg-primary/10 font-semibold"
                      onClick={() => {
                        const doc = proposal.documentUrl || proposal.attachments?.[0]?.fileUrl;
                        if (!doc) return;
                        const fullUrl = doc.startsWith("http") ? doc : `${API_URL.replace("/api", "")}${doc}`;
                        window.open(fullUrl, "_blank");
                      }}
                    >
                      <FileText className="w-3 h-3 mr-1 text-primary" />
                      Agreement Doc
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => { setPreviewProposal(proposal); setPreviewOpen(true); }}><Eye className="w-3 h-3 mr-1" />Preview</Button>
                  <Button size="sm" variant="outline" onClick={() => openEdit(proposal)}><Edit className="w-3 h-3 mr-1" />Edit</Button>
                  <Button size="sm" variant="outline" disabled={versioningId === id} onClick={() => openNewVersion(proposal)}><GitBranch className="w-3 h-3 mr-1" />{versioningId === id ? "Creating..." : "New Version"}</Button>
                  <Button size="sm" variant="outline" onClick={() => handleDownloadProposal(proposal)}><Download className="w-3 h-3 mr-1" />PDF</Button>
                  <Button size="sm" variant="outline" onClick={() => handleWhatsapp(proposal)}><MessageCircle className="w-3 h-3 mr-1" />WhatsApp</Button>
                  <Button size="sm" variant="outline" onClick={() => handleCopyLink(proposal)}><Copy className="w-3 h-3 mr-1" />Copy Link</Button>
                  <Button size="sm" variant={!email ? "default" : "outline"} disabled={sendingId === id} onClick={() => handleSendMail(proposal)}><Send className="w-3 h-3 mr-1" />{sendingId === id ? "Sending..." : "Send Mail"}</Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(proposal)}><Trash2 className="w-3 h-3 mr-1" />Delete</Button>
                </div>
              </div>

              <div className="mt-4 grid lg:grid-cols-3 gap-4 border-t pt-4">
                <div className="lg:col-span-2">
                  <p className="text-sm font-medium mb-2">Services</p>
                  <div className="grid md:grid-cols-2 gap-2">
                    {(proposal.services || []).slice(0, 4).map((service, index) => (
                      <div key={index} className="p-3 rounded-lg bg-muted/40 text-sm">
                        <p className="font-medium">{service.name || service.serviceName}</p>
                        <p className="text-muted-foreground line-clamp-2">{service.description || "-"}</p>
                        <p className="font-semibold">{service.quantity || 1} × {formatINR(service.price)} = {formatINR(service.total ?? Number(service.quantity || 1) * Number(service.price || 0))}</p>
                      </div>
                    ))}
                    {(!proposal.services || proposal.services.length === 0) && <p className="text-sm text-muted-foreground">No services added</p>}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2 flex items-center gap-2"><History className="w-4 h-4" />Activity Timeline</p>
                  {renderMiniTimeline(proposal)}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {(proposal.status === "Approved" || proposal.status === "Accepted") && (
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                    onClick={() => openBillingModal(proposal)}
                  >
                    <CreditCard className="w-3.5 h-3.5 mr-1" />
                    {proposal.billingConfigured ? "Manage Billing & Advance" : "⚡ Setup Billing"}
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={() => handleStatusChange(proposal, "Sent")}><MailCheck className="w-3 h-3 mr-1" />Mark Sent</Button>
                <Button size="sm" variant="outline" onClick={() => handleStatusChange(proposal, "Viewed")}><Eye className="w-3 h-3 mr-1" />Viewed</Button>
                <Button size="sm" variant="outline" onClick={() => handleStatusChange(proposal, "Approved")}><CheckCircle2 className="w-3 h-3 mr-1" />Approve</Button>
                <Button size="sm" variant="outline" onClick={() => handleStatusChange(proposal, "Revision Requested")}><RefreshCw className="w-3 h-3 mr-1" />Revision</Button>
                <Button size="sm" variant="outline" onClick={() => handleStatusChange(proposal, "Rejected")}><XCircle className="w-3 h-3 mr-1" />Reject</Button>
              </div>
            </motion.div>
          );
        })}

        {!loading && filtered.length === 0 && <div className="p-8 rounded-xl border bg-card text-center text-muted-foreground">No proposals found</div>}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6 rounded-2xl shadow-2xl">
          <DialogHeader className="border-b pb-3">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <FileUp className="w-5 h-5 text-primary" />
              {editing ? "Edit Client Agreement" : "Create Client Proposal & Agreement"}
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Select client to auto-load details, upload the agreement document, and reflect it immediately to the client portal for approval.
            </p>
          </DialogHeader>

          <div className="space-y-5 pt-3">
            {/* Step 1: Select Client */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-foreground flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-primary" />
                  Select Client *
                </label>
                {customersLoading && <Badge variant="outline" className="text-[10px]">Loading clients...</Badge>}
              </div>

              <Select
                value={form.customerId || (form.customerName ? "custom" : "")}
                onValueChange={(val) => handleClientSelect(val)}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Choose a client from registered customers" />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {customers.map((c) => {
                    const cId = c._id || c.id;
                    const cName = c.name || c.companyName || "Unnamed Client";
                    const cBranch = c.branchId ? ` • ${c.branchId}` : "";
                    const cPhone = Array.isArray(c.contactNumbers) ? c.contactNumbers[0] : c.phone || "";
                    return (
                      <SelectItem key={cId} value={cId}>
                        <span className="font-semibold">{cName}</span>
                        {c.businessType ? ` (${c.businessType})` : ""}
                        {cBranch}
                        {cPhone ? ` • ${cPhone}` : ""}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Step 2: Auto-Retrieved Client Details Card */}
            {form.customerName && (
              <div className="rounded-xl border bg-muted/30 p-4 space-y-3 animate-in fade-in-50 duration-200">
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    Client Details Loaded
                  </span>
                  <Badge variant="outline" className="text-[11px] font-semibold">{form.branchId || "Branch Assigned"}</Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
                  <div className="p-2.5 rounded-lg bg-background border">
                    <p className="text-muted-foreground font-medium">Client / Business</p>
                    <p className="font-bold text-foreground text-sm truncate">{form.customerName}</p>
                    {form.companyName && form.companyName !== form.customerName && (
                      <p className="text-[11px] text-muted-foreground truncate">{form.companyName}</p>
                    )}
                  </div>

                  <div className="p-2.5 rounded-lg bg-background border">
                    <p className="text-muted-foreground font-medium flex items-center gap-1">
                      <Mail className="w-3 h-3 text-muted-foreground" /> Email Address
                    </p>
                    <p className="font-semibold text-foreground truncate">{form.clientEmail || "-"}</p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-background border">
                    <p className="text-muted-foreground font-medium flex items-center gap-1">
                      <Phone className="w-3 h-3 text-muted-foreground" /> Contact Phone
                    </p>
                    <p className="font-semibold text-foreground truncate">{form.contactNumber || "-"}</p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-background border">
                    <p className="text-muted-foreground font-medium">Industry / Business Type</p>
                    <p className="font-semibold text-foreground truncate">{form.businessType || "General Agency Services"}</p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-background border">
                    <p className="text-muted-foreground font-medium">Branch Location</p>
                    <p className="font-semibold text-foreground truncate">{form.branchId || "-"}</p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-background border">
                    <p className="text-muted-foreground font-medium">Client Portal Sync</p>
                    <p className="font-semibold text-emerald-600 dark:text-emerald-400">Active & Ready</p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Upload Agreement Document */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-foreground flex items-center gap-1.5">
                <UploadCloud className="w-4 h-4 text-primary" />
                Upload Agreement Document *
              </label>

              <div className="rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 transition p-5 text-center relative cursor-pointer">
                <input
                  type="file"
                  accept="application/pdf,.doc,.docx,image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setAgreementFile(f);
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />

                {agreementFile ? (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-background border shadow-sm text-left">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-foreground">{agreementFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(agreementFile.size / (1024 * 1024)).toFixed(2)} MB • {agreementFile.type || "Document"}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        setAgreementFile(null);
                      }}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : form.documentUrl ? (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-background border shadow-sm text-left">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-foreground">{form.documentName || "Current Agreement Document"}</p>
                        <a
                          href={form.documentUrl.startsWith("http") ? form.documentUrl : `${API_URL.replace("/api", "")}${form.documentUrl}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-primary underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View Current Document
                        </a>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">Click or drop new file to replace</span>
                  </div>
                ) : (
                  <div className="space-y-2 py-2">
                    <UploadCloud className="w-10 h-10 mx-auto text-primary" />
                    <p className="font-bold text-sm text-foreground">Click to upload or drag & drop Agreement PDF / Document</p>
                    <p className="text-xs text-muted-foreground">Supports PDF, DOC, DOCX or scanned agreement files up to 30MB</p>
                  </div>
                )}
              </div>
            </div>

            {/* Step 4: Agreement Title, Amount & Terms */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Agreement Title *</label>
                <Input
                  placeholder="e.g. Master Services Agreement"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Agreement Value / Retainer (₹ Optional)</label>
                <Input
                  type="number"
                  placeholder="e.g. 50000"
                  value={form.proposalValue}
                  onChange={(e) => setForm({ ...form, proposalValue: e.target.value })}
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-semibold text-muted-foreground">Notes / Scope Summary (Optional)</label>
                <Textarea
                  placeholder="Add key highlights or terms for the client..."
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
            </div>

            {/* Step 5: Live Reflection Alert */}
            <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 text-xs space-y-1">
              <p className="font-bold text-primary flex items-center gap-1.5">
                <BadgeCheck className="w-4 h-4" />
                Live Client Portal Sync
              </p>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                When you click <strong>Save & Issue to Client</strong>, this agreement document will immediately appear in the client's portal for <strong>{form.customerName || "the selected client"}</strong> with an <strong>Approve Agreement</strong> button.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t mt-4">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>Cancel</Button>
            <Button
              variant="gradient"
              onClick={handleSave}
              disabled={saving || !form.customerName}
              className="gap-2 font-bold shadow-md"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Saving & Uploading...
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  Save & Issue Agreement to Client
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Proposal Preview</DialogTitle></DialogHeader>
          {previewProposal && (
            <div className="space-y-5">
              <div className="p-5 rounded-xl bg-gradient-to-r from-slate-950 to-slate-800 text-white">
                <p className="text-sm opacity-80">{DIGITALNESS.name}</p>
                <h2 className="text-2xl font-bold">{previewProposal.title}</h2>
                <p className="opacity-80">Prepared for {previewProposal.customerName || previewProposal.clientName}</p>
              </div>
              <div className="grid md:grid-cols-3 gap-3 text-sm">
                <div className="p-3 rounded-lg border"><p className="text-muted-foreground">Proposal No</p><p className="font-semibold">{previewProposal.proposalNumber || "New"}</p></div>
                <div className="p-3 rounded-lg border"><p className="text-muted-foreground">Status</p><p className="font-semibold">{previewProposal.status}</p></div>
                <div className="p-3 rounded-lg border"><p className="text-muted-foreground">Grand Total</p><p className="font-semibold">{formatINR(previewProposal.grandTotal || previewProposal.proposalValue)}</p></div>
              </div>
              <div className="border rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted"><tr><th className="p-2 text-left">Service</th><th className="p-2 text-left">Description</th><th className="p-2 text-left">Qty</th><th className="p-2 text-left">Total</th></tr></thead>
                  <tbody>{(previewProposal.services || []).map((s, i) => <tr key={i} className="border-t"><td className="p-2">{s.name}</td><td className="p-2">{s.description}</td><td className="p-2">{s.quantity || 1}</td><td className="p-2">{formatINR(s.total ?? Number(s.quantity || 1) * Number(s.price || 0))}</td></tr>)}</tbody>
                </table>
              </div>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div><h4 className="font-semibold mb-1">Scope</h4><p className="text-muted-foreground whitespace-pre-line">{previewProposal.scopeOfWork || "-"}</p></div>
                <div><h4 className="font-semibold mb-1">Payment Terms</h4><p className="text-muted-foreground whitespace-pre-line">{previewProposal.paymentTerms || "-"}</p></div>
              </div>
              {/* If Billing Configured, show in preview */}
              {previewProposal.billingConfigured && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4" />
                      Agreed Contract Billing ({previewProposal.billingCycle || "Project"})
                    </span>
                    <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                      Billing Configured
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
                    <div className="p-2 rounded bg-background border">
                      <span className="text-muted-foreground block">Agreed Value</span>
                      <strong className="text-foreground">{formatINR(previewProposal.agreedAmount || previewProposal.grandTotal)}</strong>
                    </div>
                    <div className="p-2 rounded bg-background border">
                      <span className="text-muted-foreground block">Advance Paid</span>
                      <strong className="text-emerald-600 dark:text-emerald-400">{formatINR(previewProposal.advancePaid || 0)}</strong>
                    </div>
                    <div className="p-2 rounded bg-background border">
                      <span className="text-muted-foreground block">Pending Balance</span>
                      <strong className={previewProposal.balancePending ? "text-amber-600 dark:text-amber-400" : "text-emerald-600"}>
                        {formatINR(previewProposal.balancePending || 0)}
                      </strong>
                    </div>
                    <div className="p-2 rounded bg-background border">
                      <span className="text-muted-foreground block">Balance Due Date</span>
                      <strong className="text-foreground">{formatDate(previewProposal.dueDate)}</strong>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                {(previewProposal.status === "Approved" || previewProposal.status === "Accepted") && (
                  <Button
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                    onClick={() => {
                      setPreviewOpen(false);
                      openBillingModal(previewProposal);
                    }}
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    {previewProposal.billingConfigured ? "Update Billing & Advance" : "Setup Billing"}
                  </Button>
                )}
                <Button variant="outline" onClick={() => handleDownloadProposal(previewProposal)}>
                  <Download className="w-4 h-4 mr-2" />Download PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ================= BILLING & SETTLEMENT CONFIGURATION MODAL ================= */}
      <Dialog open={billingModalOpen} onOpenChange={setBillingModalOpen}>
        <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto p-6 rounded-2xl shadow-2xl">
          <DialogHeader className="border-b pb-3">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-600" />
              Configure Client Billing &amp; Settlement
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Client approved the proposal agreement. Select the billing cycle, confirm the contract value, and record any advance payment.
            </p>
          </DialogHeader>

          {billingProposal && (
            <div className="space-y-5 pt-3">
              {/* Proposal & Client Summary */}
              <div className="p-4 rounded-xl bg-muted/40 border flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground block">Client / Company</span>
                  <strong className="text-sm font-bold text-foreground">
                    {billingProposal.customerName || billingProposal.clientName}
                    {billingProposal.companyName ? ` (${billingProposal.companyName})` : ""}
                  </strong>
                </div>
                <div>
                  <span className="text-muted-foreground block">Proposal Number</span>
                  <span className="font-mono font-bold text-primary">
                    {billingProposal.proposalNumber || "PR-Agreement"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Selected Agreement Value</span>
                  <strong className="text-sm font-black text-foreground">
                    {formatINR(billingProposal.grandTotal || billingProposal.proposalValue)}
                  </strong>
                </div>
              </div>

              {/* Question 1: Billing Model (Monthly, Project, Yearly) */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                  1. Select Billing Model / Cycle *
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: "Monthly", label: "Monthly", desc: "Recurring Monthly Retainer", icon: CalendarDays },
                    { id: "Project", label: "Project", desc: "Fixed Scope / Milestone", icon: Sparkles },
                    { id: "Yearly", label: "Yearly", desc: "Annual Contract Retainer", icon: BadgeCheck },
                  ].map((cycle) => {
                    const isSelected = billingForm.billingCycle === cycle.id;
                    const IconComp = cycle.icon;
                    return (
                      <button
                        key={cycle.id}
                        type="button"
                        onClick={() => setBillingForm((prev) => ({ ...prev, billingCycle: cycle.id }))}
                        className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between ${isSelected
                            ? "bg-primary/10 border-primary text-primary shadow-sm ring-2 ring-primary/20"
                            : "bg-card hover:bg-muted/40 border-border text-foreground"
                          }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <IconComp className="w-5 h-5" />
                          {isSelected && <Check className="w-4 h-4 font-bold" />}
                        </div>
                        <div>
                          <strong className="block text-sm font-bold">{cycle.label}</strong>
                          <span className="text-[11px] text-muted-foreground">{cycle.desc}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Question 2: Agreed Contract Value Amount */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    2. Agreed Contract Value Amount (₹) *
                  </label>
                  <span className="text-[11px] text-muted-foreground">
                    Pre-filled from proposal agreement
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">
                    ₹
                  </span>
                  <Input
                    type="number"
                    min="0"
                    placeholder="Enter agreed value amount"
                    value={billingForm.agreedAmount}
                    onChange={(e) =>
                      setBillingForm((prev) => ({ ...prev, agreedAmount: e.target.value }))
                    }
                    className="pl-8 font-bold text-base"
                  />
                </div>
              </div>

              {/* Question 3: Advance Payment Received */}
              <div className="space-y-3 p-4 rounded-xl border bg-muted/20">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Wallet className="w-4 h-4 text-emerald-600" />
                    3. Advance Paid Amount (₹)
                  </label>
                  <span className="text-[11px] text-muted-foreground">
                    Enter ₹0 if no advance paid yet
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">
                    ₹
                  </span>
                  <Input
                    type="number"
                    min="0"
                    placeholder="Advance paid amount (e.g. 20000)"
                    value={billingForm.advancePaid}
                    onChange={(e) =>
                      setBillingForm((prev) => ({ ...prev, advancePaid: e.target.value }))
                    }
                    className="pl-8 font-bold text-base text-emerald-600 dark:text-emerald-400"
                  />
                </div>

                {Number(billingForm.advancePaid || 0) > 0 && (
                  <div className="grid sm:grid-cols-2 gap-3 pt-2 border-t">
                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                        Advance Payment Date
                      </label>
                      <Input
                        type="date"
                        value={billingForm.advancePaymentDate}
                        onChange={(e) =>
                          setBillingForm((prev) => ({
                            ...prev,
                            advancePaymentDate: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                        Payment Method
                      </label>
                      <Select
                        value={billingForm.advancePaymentMethod}
                        onValueChange={(val) =>
                          setBillingForm((prev) => ({
                            ...prev,
                            advancePaymentMethod: val,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="UPI">UPI / GPay / PhonePe</SelectItem>
                          <SelectItem value="Bank Transfer">Bank Transfer (NEFT/RTGS/IMPS)</SelectItem>
                          <SelectItem value="Cash">Cash</SelectItem>
                          <SelectItem value="Cheque">Cheque</SelectItem>
                          <SelectItem value="Card">Credit / Debit Card</SelectItem>
                          <SelectItem value="Net Banking">Net Banking</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                        Reference / Transaction ID
                      </label>
                      <Input
                        placeholder="e.g. UPI Ref, UTR number, or Cheque number"
                        value={billingForm.advancePaymentReference}
                        onChange={(e) =>
                          setBillingForm((prev) => ({
                            ...prev,
                            advancePaymentReference: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                        Payment Notes (Optional)
                      </label>
                      <Input
                        placeholder="e.g. Advance paid upon agreement signoff"
                        value={billingForm.advanceNotes}
                        onChange={(e) =>
                          setBillingForm((prev) => ({
                            ...prev,
                            advanceNotes: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Live Settlement Balance Calculation */}
              {(() => {
                const agreed = Number(billingForm.agreedAmount || 0);
                const advance = Number(billingForm.advancePaid || 0);
                const pending = Math.max(0, agreed - advance);

                return (
                  <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 text-white space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-300">
                      <span>Total Agreed Value:</span>
                      <strong className="text-white text-sm">{formatINR(agreed)}</strong>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-300">
                      <span>Advance Paid:</span>
                      <strong className="text-emerald-400 text-sm">-{formatINR(advance)}</strong>
                    </div>
                    <div className="pt-2 border-t border-slate-700 flex items-center justify-between">
                      <span className="text-sm font-bold text-white">Pending Balance:</span>
                      <strong
                        className={`text-lg font-black ${pending > 0 ? "text-amber-400" : "text-emerald-400"
                          }`}
                      >
                        {formatINR(pending)}
                      </strong>
                    </div>

                    {pending > 0 && (
                      <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <span className="text-slate-400">Balance Payment Due Date:</span>
                        <Input
                          type="date"
                          value={billingForm.dueDate}
                          onChange={(e) =>
                            setBillingForm((prev) => ({ ...prev, dueDate: e.target.value }))
                          }
                          className="w-auto bg-slate-800 border-slate-700 text-white text-xs h-8"
                        />
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Automation Explainer */}
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-[11px] text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground">Automatic CRM &amp; Portal Synchronization:</p>
                <p>• Creates an official Invoice with original amount, advance deducted, and balance due.</p>
                <p>• If advance paid &gt; 0, automatically records a verified Payment receipt.</p>
                <p>• Reflects clearly on the Client Portal under Proposals &amp; Payments with complete breakdown.</p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  onClick={() => setBillingModalOpen(false)}
                  disabled={savingBilling}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveBilling}
                  disabled={savingBilling || !billingForm.agreedAmount}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold gap-2 shadow-md"
                >
                  {savingBilling ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Setting Up Billing...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Confirm &amp; Setup Client Billing
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
