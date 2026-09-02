import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';

import {
  Plus,
  FileBox,
  Trash2,
  Calendar,
  IndianRupee,
  Layers,
  Search,
  Pencil,
  Eye,
  Copy,
  CheckCircle2,
  FileText,
  BadgeIndianRupee,
  ClipboardList,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

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

import { Badge } from '@/components/ui/badge';

import { toast } from 'sonner';

const API_URL = 'https://server.digitalness.co.in/api';

type Deliverable = {
  title: string;
  category?: string;
  days?: number;
  description?: string;
};

type ServiceItem = {
  name: string;
  description: string;
  quantity: number;
  price: number;
  total?: number;
};

type ProposalTemplate = {
  _id: string;
  name: string;
  category: string;
  description?: string;
  estimatedDays?: number;
  estimatedCost?: number;
  defaultDeliverables?: Deliverable[];

  proposalTitle?: string;
  packageName?: string;
  scopeOfWork?: string;
  timeline?: string;
  paymentTerms?: string;
  termsAndConditions?: string;
  cancellationPolicy?: string;
  supportPeriod?: string;
  gstPercentage?: number;
  discount?: number;
  services?: ServiceItem[];
  companyProfile?: string;
  proposalNotes?: string;
  signatureText?: string;
};

const digitalnessDefaults = {
  companyName: 'Digitalness',
  tagline: 'Designed and Developed by Digitalness',
  email: 'info@digitalness.co.in',
  website: 'https://digitalness.co.in',
  address: 'Hyderabad, Telangana, India',
  phone: '',
};

const starterTemplates = {
  website: {
    name: 'Website Development Proposal',
    category: 'Website Development',
    proposalTitle: 'Website Design & Development Proposal',
    packageName: 'Business Website Package',
    description:
      'Professional website design and development proposal template for business websites, landing pages, portfolios and corporate websites.',
    estimatedDays: 30,
    estimatedCost: 45000,
    services: [
      {
        name: 'UI/UX Design',
        description: 'Modern responsive website interface design with premium layout and user-friendly flow.',
        quantity: 1,
        price: 12000,
      },
      {
        name: 'Frontend Development',
        description: 'Responsive React/Tailwind frontend development for desktop, tablet and mobile devices.',
        quantity: 1,
        price: 18000,
      },
      {
        name: 'Backend / CMS Setup',
        description: 'Backend setup, admin management and dynamic content structure based on project scope.',
        quantity: 1,
        price: 10000,
      },
      {
        name: 'Basic SEO Setup',
        description: 'Meta title, meta description, sitemap basics and performance-friendly structure.',
        quantity: 1,
        price: 5000,
      },
    ],
    deliverables: `Homepage Design
About / Services Pages
Contact Form
Responsive Layout
Admin / CMS Setup
Basic SEO Setup
Deployment Support`,
    scopeOfWork:
      'Digitalness will design and develop a responsive, modern and professional website based on the approved design direction, brand requirements and business goals. The scope includes UI design, frontend development, basic backend/CMS setup, contact form integration, responsive testing and deployment support.',
    timeline:
      'Estimated project timeline is 25–30 working days from the date of content approval and advance payment. Timeline may vary based on content availability, revision cycles and additional feature requests.',
    paymentTerms:
      '50% advance payment before project start, 30% after design approval/development progress, and 20% before final deployment/handover.',
  },
  seo: {
    name: 'SEO Services Proposal',
    category: 'SEO',
    proposalTitle: 'Search Engine Optimization Proposal',
    packageName: 'Monthly SEO Growth Package',
    description:
      'SEO proposal template for monthly search engine optimization, technical SEO, on-page SEO and reporting.',
    estimatedDays: 30,
    estimatedCost: 25000,
    services: [
      {
        name: 'SEO Audit',
        description: 'Website SEO audit, technical issue review and improvement plan.',
        quantity: 1,
        price: 5000,
      },
      {
        name: 'Keyword Research',
        description: 'Business-focused keyword research and content targeting plan.',
        quantity: 1,
        price: 5000,
      },
      {
        name: 'On-page SEO',
        description: 'Meta tags, heading structure, internal linking and content optimization.',
        quantity: 1,
        price: 10000,
      },
      {
        name: 'Monthly Report',
        description: 'Monthly performance tracking and SEO improvement report.',
        quantity: 1,
        price: 5000,
      },
    ],
    deliverables: `SEO Audit Report
Keyword Research Sheet
On-page SEO Updates
Technical SEO Suggestions
Monthly SEO Report`,
    scopeOfWork:
      'Digitalness will perform SEO audit, keyword research, on-page optimization, technical recommendations and monthly performance reporting to improve organic visibility.',
    timeline:
      'SEO is a continuous process. Initial setup will be completed in 15–20 working days and monthly optimization will continue as per package.',
    paymentTerms:
      'Monthly package payment must be completed in advance. Advertising budgets, tools or third-party charges are extra if applicable.',
  },
  marketing: {
    name: 'Digital Marketing Proposal',
    category: 'Digital Marketing',
    proposalTitle: 'Digital Marketing & Ads Management Proposal',
    packageName: 'Monthly Marketing Package',
    description:
      'Complete digital marketing template for Meta Ads, Google Ads, content planning, reporting and campaign management.',
    estimatedDays: 30,
    estimatedCost: 35000,
    services: [
      {
        name: 'Meta Ads Management',
        description: 'Campaign setup, targeting, optimization and weekly performance monitoring.',
        quantity: 1,
        price: 12000,
      },
      {
        name: 'Google Ads Management',
        description: 'Search/display campaign setup, keyword planning and optimization.',
        quantity: 1,
        price: 12000,
      },
      {
        name: 'Social Media Content Plan',
        description: 'Monthly content calendar, captions and creative direction.',
        quantity: 1,
        price: 7000,
      },
      {
        name: 'Monthly Performance Report',
        description: 'Campaign insights, lead report and improvement suggestions.',
        quantity: 1,
        price: 4000,
      },
    ],
    deliverables: `Meta Ads Setup
Google Ads Setup
Monthly Content Calendar
Campaign Optimization
Lead Tracking Report
Monthly Performance Report`,
    scopeOfWork:
      'Digitalness will manage digital advertising campaigns, content planning, campaign optimization and monthly reporting. Ad spend/bidding budget is not included in management fees.',
    timeline:
      'Campaign setup will be completed within 5–7 working days after receiving creatives, business details and ad account access. Campaign optimization will continue throughout the month.',
    paymentTerms:
      'Monthly management fee should be paid in advance. Ad budget is separate and paid directly to the platform/client ad account.',
  },
};

const defaultForm = {
  name: '',
  category: '',
  description: '',
  estimatedDays: 30,
  estimatedCost: 0,

  proposalTitle: '',
  packageName: '',
  scopeOfWork: '',
  timeline: '',
  paymentTerms: '',
  termsAndConditions:
    '1. Project timeline starts after advance payment and content confirmation.\n2. Additional features outside the approved scope will be charged separately.\n3. Client should provide required content, brand assets and approvals on time.\n4. Final delivery/handover will be completed after pending payment clearance.',
  cancellationPolicy:
    'Advance payment is non-refundable once project work has started. If the project is paused due to client-side delay, the timeline will be revised accordingly.',
  supportPeriod: '15 days basic support after final delivery, unless mentioned otherwise.',
  gstPercentage: 18,
  discount: 0,
  companyProfile:
    'Digitalness is a digital solutions company helping businesses with website development, branding, SEO, social media marketing, paid ads, CRM solutions and digital growth strategies.',
  proposalNotes: '',
  signatureText: 'For Digitalness\nAuthorized Signatory',
};

export default function TemplatesPage() {
  const token = localStorage.getItem('token');

  const [templates, setTemplates] = useState<ProposalTemplate[]>([]);
  const [open, setOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ProposalTemplate | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [delivText, setDelivText] = useState('');
  const [serviceText, setServiceText] = useState('');
  const [search, setSearch] = useState('');

  const [form, setForm] = useState(defaultForm);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  });

  const fetchTemplates = async () => {
    try {
      const res = await fetch(`${API_URL}/templates`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      setTemplates(Array.isArray(data.templates) ? data.templates : Array.isArray(data.data) ? data.data : []);
    } catch (error) {
      console.log(error);
      toast.error('Failed to fetch templates');
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(defaultForm);
    setDelivText('');
    setServiceText('');
  };

  const parseDeliverables = () => {
    return delivText
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean)
      .map((title) => ({
        title,
        category: form.category,
        days: 5,
      }));
  };

  const parseServices = () => {
    return serviceText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [name = '', description = '', quantity = '1', price = '0'] = line
          .split('|')
          .map((item) => item.trim());

        const qty = Number(quantity || 1);
        const rate = Number(price || 0);

        return {
          name,
          description,
          quantity: qty,
          price: rate,
          total: qty * rate,
        };
      });
  };

  const calculated = useMemo(() => {
    const services = parseServices();
    const subtotal = services.reduce((sum, item) => sum + Number(item.total || 0), 0);
    const discount = Number(form.discount || 0);
    const taxableAmount = Math.max(subtotal - discount, 0);
    const gstAmount = Math.round((taxableAmount * Number(form.gstPercentage || 0)) / 100);
    const grandTotal = taxableAmount + gstAmount;

    return {
      services,
      subtotal,
      discount,
      gstAmount,
      grandTotal,
    };
  }, [serviceText, form.discount, form.gstPercentage]);

  const applyStarterTemplate = (type: keyof typeof starterTemplates) => {
    const template = starterTemplates[type];

    setForm({
      ...defaultForm,
      name: template.name,
      category: template.category,
      proposalTitle: template.proposalTitle,
      packageName: template.packageName,
      description: template.description,
      estimatedDays: template.estimatedDays,
      estimatedCost: template.estimatedCost,
      scopeOfWork: template.scopeOfWork,
      timeline: template.timeline,
      paymentTerms: template.paymentTerms,
    });

    setDelivText(template.deliverables);

    setServiceText(
      template.services
        .map((service) => `${service.name} | ${service.description} | ${service.quantity} | ${service.price}`)
        .join('\n')
    );

    toast.success(`${template.name} loaded`);
  };

  const handleSave = async () => {
    try {
      if (!form.name || !form.category) {
        toast.error('Template name and category are required');
        return;
      }

      const services = parseServices();
      const deliverables = parseDeliverables();

      const payload = {
        ...form,
        estimatedCost: calculated.grandTotal || Number(form.estimatedCost || 0),
        defaultDeliverables: deliverables,

        proposalTemplate: {
          proposalTitle: form.proposalTitle || form.name,
          packageName: form.packageName,
          companyDetails: digitalnessDefaults,
          companyProfile: form.companyProfile,
          scopeOfWork: form.scopeOfWork,
          deliverables,
          services,
          timeline: form.timeline,
          paymentTerms: form.paymentTerms,
          termsAndConditions: form.termsAndConditions,
          cancellationPolicy: form.cancellationPolicy,
          supportPeriod: form.supportPeriod,
          gstPercentage: Number(form.gstPercentage || 0),
          discount: Number(form.discount || 0),
          subtotal: calculated.subtotal,
          gstAmount: calculated.gstAmount,
          grandTotal: calculated.grandTotal,
          proposalNotes: form.proposalNotes,
          signatureText: form.signatureText,
        },

        services,
        scopeOfWork: form.scopeOfWork,
        deliverablesText: delivText,
        timeline: form.timeline,
        paymentTerms: form.paymentTerms,
        termsAndConditions: form.termsAndConditions,
        cancellationPolicy: form.cancellationPolicy,
        supportPeriod: form.supportPeriod,
        gstPercentage: Number(form.gstPercentage || 0),
        discount: Number(form.discount || 0),
        subtotal: calculated.subtotal,
        gstAmount: calculated.gstAmount,
        grandTotal: calculated.grandTotal,
      };

      const url = editingId ? `${API_URL}/templates/${editingId}` : `${API_URL}/templates`;
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || 'Failed to save template');
        return;
      }

      toast.success(editingId ? 'Template updated' : 'Template created');
      setOpen(false);
      resetForm();
      fetchTemplates();
    } catch (error) {
      console.log(error);
      toast.error('Something went wrong');
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      const res = await fetch(`${API_URL}/templates/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || 'Failed to delete');
        return;
      }

      toast.success('Template deleted');
      fetchTemplates();
    } catch (error) {
      console.log(error);
      toast.error('Failed to delete template');
    }
  };

  const handleEdit = (template: ProposalTemplate) => {
    const proposalTemplate = (template as any).proposalTemplate || {};

    const services = template.services || proposalTemplate.services || [];
    const deliverables = template.defaultDeliverables || proposalTemplate.deliverables || [];

    setEditingId(template._id);

    setForm({
      ...defaultForm,
      name: template.name || '',
      category: template.category || '',
      description: template.description || '',
      estimatedDays: Number(template.estimatedDays || 30),
      estimatedCost: Number(template.estimatedCost || 0),

      proposalTitle: proposalTemplate.proposalTitle || template.proposalTitle || template.name || '',
      packageName: proposalTemplate.packageName || template.packageName || '',
      scopeOfWork: proposalTemplate.scopeOfWork || template.scopeOfWork || '',
      timeline: proposalTemplate.timeline || template.timeline || '',
      paymentTerms: proposalTemplate.paymentTerms || template.paymentTerms || '',
      termsAndConditions: proposalTemplate.termsAndConditions || template.termsAndConditions || defaultForm.termsAndConditions,
      cancellationPolicy: proposalTemplate.cancellationPolicy || template.cancellationPolicy || defaultForm.cancellationPolicy,
      supportPeriod: proposalTemplate.supportPeriod || template.supportPeriod || defaultForm.supportPeriod,
      gstPercentage: Number(proposalTemplate.gstPercentage ?? template.gstPercentage ?? 18),
      discount: Number(proposalTemplate.discount ?? template.discount ?? 0),
      companyProfile: proposalTemplate.companyProfile || template.companyProfile || defaultForm.companyProfile,
      proposalNotes: proposalTemplate.proposalNotes || template.proposalNotes || '',
      signatureText: proposalTemplate.signatureText || template.signatureText || defaultForm.signatureText,
    });

    setDelivText(deliverables.map((item: any) => item.title || item).join('\n'));

    setServiceText(
      services
        .map(
          (service: any) =>
            `${service.name || ''} | ${service.description || ''} | ${service.quantity || 1} | ${service.price || 0}`
        )
        .join('\n')
    );

    setOpen(true);
  };

  const copyTemplateDetails = (template: ProposalTemplate) => {
    const proposalTemplate = (template as any).proposalTemplate || {};
    const services = template.services || proposalTemplate.services || [];

    const content = `
${template.name}
Category: ${template.category}
Estimated Days: ${template.estimatedDays || '-'}
Estimated Cost: ₹${Number(template.estimatedCost || proposalTemplate.grandTotal || 0).toLocaleString('en-IN')}

Scope:
${proposalTemplate.scopeOfWork || template.scopeOfWork || '-'}

Services:
${services.map((s: any) => `- ${s.name}: ₹${Number(s.price || 0).toLocaleString('en-IN')}`).join('\n')}
    `.trim();

    navigator.clipboard.writeText(content);
    toast.success('Template copied');
  };

  const filteredTemplates = templates.filter((template) => {
    const value = `${template.name} ${template.category} ${template.description}`.toLowerCase();
    return value.includes(search.toLowerCase());
  });

  const templateTotal = (template: ProposalTemplate) => {
    const proposalTemplate = (template as any).proposalTemplate || {};
    return Number(template.estimatedCost || proposalTemplate.grandTotal || template.grandTotal || 0);
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-6 text-white shadow-xl"
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-indigo-100">
              <Sparkles className="h-3.5 w-3.5" />
              Proposal Templates
            </div>

            <h1 className="flex items-center gap-2 text-2xl font-heading font-bold md:text-3xl">
              <FileBox className="h-7 w-7" />
              Proposal Template Library
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-indigo-100">
              Create reusable Digitalness proposal templates with services, pricing, scope,
              timelines, payment terms, deliverables, signatures and PDF-ready content.
            </p>
          </div>

          <Dialog
            open={open}
            onOpenChange={(value) => {
              setOpen(value);
              if (!value) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button className="rounded-2xl bg-white px-5 py-3 font-semibold text-slate-950 hover:bg-indigo-50">
                <Plus className="mr-2 h-4 w-4" />
                New Proposal Template
              </Button>
            </DialogTrigger>

            <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingId ? 'Edit Proposal Template' : 'Create Proposal Template'}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
                  <Label className="mb-3 block text-sm font-semibold text-indigo-950">
                    Quick Starter Templates
                  </Label>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    <Button type="button" variant="outline" onClick={() => applyStarterTemplate('website')}>
                      Website Package
                    </Button>
                    <Button type="button" variant="outline" onClick={() => applyStarterTemplate('seo')}>
                      SEO Package
                    </Button>
                    <Button type="button" variant="outline" onClick={() => applyStarterTemplate('marketing')}>
                      Marketing Package
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <Label>Template Name *</Label>
                    <Input
                      placeholder="Website Development Proposal"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label>Category *</Label>
                    <Input
                      placeholder="Website Development / SEO / Marketing"
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label>Proposal Title</Label>
                    <Input
                      placeholder="Business Website Development Proposal"
                      value={form.proposalTitle}
                      onChange={(e) => setForm({ ...form, proposalTitle: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label>Package Name</Label>
                    <Input
                      placeholder="Premium Website Package"
                      value={form.packageName}
                      onChange={(e) => setForm({ ...form, packageName: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Briefly describe where this proposal template should be used."
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                  <div>
                    <Label>Estimated Days</Label>
                    <Input
                      type="number"
                      value={form.estimatedDays}
                      onChange={(e) => setForm({ ...form, estimatedDays: Number(e.target.value) })}
                    />
                  </div>

                  <div>
                    <Label>Discount</Label>
                    <Input
                      type="number"
                      value={form.discount}
                      onChange={(e) => setForm({ ...form, discount: Number(e.target.value) })}
                    />
                  </div>

                  <div>
                    <Label>GST %</Label>
                    <Input
                      type="number"
                      value={form.gstPercentage}
                      onChange={(e) => setForm({ ...form, gstPercentage: Number(e.target.value) })}
                    />
                  </div>

                  <div>
                    <Label>Grand Total</Label>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold">
                      ₹{calculated.grandTotal.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Services</Label>
                  <p className="mb-2 text-xs text-muted-foreground">
                    Add one service per line in this format: Service Name | Description | Quantity | Price
                  </p>
                  <Textarea
                    rows={6}
                    value={serviceText}
                    onChange={(e) => setServiceText(e.target.value)}
                    placeholder={`Website UI Design | Premium responsive UI design | 1 | 12000
Frontend Development | React and Tailwind development | 1 | 18000
SEO Setup | Basic SEO setup | 1 | 5000`}
                  />
                </div>

                {calculated.services.length > 0 && (
                  <div className="overflow-hidden rounded-2xl border border-slate-200">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-950 text-white">
                        <tr>
                          <th className="p-3 text-left">Service</th>
                          <th className="p-3 text-left">Qty</th>
                          <th className="p-3 text-left">Price</th>
                          <th className="p-3 text-left">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {calculated.services.map((service, index) => (
                          <tr key={index} className="border-t">
                            <td className="p-3">
                              <p className="font-semibold">{service.name}</p>
                              <p className="text-xs text-muted-foreground">{service.description}</p>
                            </td>
                            <td className="p-3">{service.quantity}</td>
                            <td className="p-3">₹{Number(service.price || 0).toLocaleString('en-IN')}</td>
                            <td className="p-3 font-semibold">
                              ₹{Number(service.total || 0).toLocaleString('en-IN')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <Label>Scope of Work</Label>
                    <Textarea
                      rows={5}
                      value={form.scopeOfWork}
                      onChange={(e) => setForm({ ...form, scopeOfWork: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label>Deliverables (one per line)</Label>
                    <Textarea
                      rows={5}
                      value={delivText}
                      onChange={(e) => setDelivText(e.target.value)}
                      placeholder={`Homepage Design
Admin Panel
SEO Setup`}
                    />
                  </div>

                  <div>
                    <Label>Timeline</Label>
                    <Textarea
                      rows={4}
                      value={form.timeline}
                      onChange={(e) => setForm({ ...form, timeline: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label>Payment Terms</Label>
                    <Textarea
                      rows={4}
                      value={form.paymentTerms}
                      onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label>Terms & Conditions</Label>
                    <Textarea
                      rows={5}
                      value={form.termsAndConditions}
                      onChange={(e) => setForm({ ...form, termsAndConditions: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label>Cancellation Policy</Label>
                    <Textarea
                      rows={5}
                      value={form.cancellationPolicy}
                      onChange={(e) => setForm({ ...form, cancellationPolicy: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label>Support Period</Label>
                    <Textarea
                      rows={3}
                      value={form.supportPeriod}
                      onChange={(e) => setForm({ ...form, supportPeriod: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label>Signature Text</Label>
                    <Textarea
                      rows={3}
                      value={form.signatureText}
                      onChange={(e) => setForm({ ...form, signatureText: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label>Digitalness Company Profile</Label>
                  <Textarea
                    rows={4}
                    value={form.companyProfile}
                    onChange={(e) => setForm({ ...form, companyProfile: e.target.value })}
                  />
                </div>

                <div>
                  <Label>Internal Proposal Notes</Label>
                  <Textarea
                    rows={3}
                    value={form.proposalNotes}
                    onChange={(e) => setForm({ ...form, proposalNotes: e.target.value })}
                  />
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <h4 className="mb-3 font-semibold">Pricing Summary</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                    <div>
                      <p className="text-muted-foreground">Subtotal</p>
                      <p className="font-bold">₹{calculated.subtotal.toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Discount</p>
                      <p className="font-bold">₹{calculated.discount.toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">GST</p>
                      <p className="font-bold">₹{calculated.gstAmount.toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Grand Total</p>
                      <p className="font-bold text-indigo-700">
                        ₹{calculated.grandTotal.toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  {editingId ? 'Update Template' : 'Create Template'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Total Templates</p>
          <h3 className="mt-1 text-2xl font-bold">{templates.length}</h3>
        </div>

        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Website Templates</p>
          <h3 className="mt-1 text-2xl font-bold">
            {templates.filter((t) => t.category?.toLowerCase().includes('website')).length}
          </h3>
        </div>

        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Avg Cost</p>
          <h3 className="mt-1 text-2xl font-bold">
            ₹
            {templates.length
              ? Math.round(
                templates.reduce((sum, item) => sum + templateTotal(item), 0) / templates.length
              ).toLocaleString('en-IN')
              : 0}
          </h3>
        </div>

        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground">Ready for Proposal</p>
          <h3 className="mt-1 text-2xl font-bold">
            {templates.filter((t) => ((t as any).proposalTemplate || t.services)?.length !== 0).length}
          </h3>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search proposal templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="text-sm text-muted-foreground">
          Showing {filteredTemplates.length} of {templates.length} templates
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filteredTemplates.map((template) => {
          const proposalTemplate = (template as any).proposalTemplate || {};
          const services = template.services || proposalTemplate.services || [];
          const deliverables = template.defaultDeliverables || proposalTemplate.deliverables || [];

          return (
            <motion.div
              key={template._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="overflow-hidden rounded-3xl border border-slate-200 bg-card shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="bg-gradient-to-br from-slate-950 to-indigo-950 p-5 text-white">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <Badge className="bg-white/15 text-white hover:bg-white/20">{template.category}</Badge>

                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-white hover:bg-white/10"
                      onClick={() => {
                        setSelectedTemplate(template);
                        setPreviewOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>

                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-white hover:bg-white/10"
                      onClick={() => handleEdit(template)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>

                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-white hover:bg-white/10"
                      onClick={() => deleteTemplate(template._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <h3 className="line-clamp-2 text-lg font-heading font-bold">{template.name}</h3>
                <p className="mt-2 line-clamp-2 text-sm text-indigo-100">{template.description}</p>
              </div>

              <div className="space-y-4 p-5">
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="rounded-2xl bg-slate-50 p-3">
                    <Calendar className="mb-1 h-4 w-4 text-indigo-600" />
                    <p className="font-bold">{template.estimatedDays || 0}</p>
                    <p className="text-xs text-muted-foreground">Days</p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-3">
                    <IndianRupee className="mb-1 h-4 w-4 text-emerald-600" />
                    <p className="font-bold">₹{templateTotal(template).toLocaleString('en-IN')}</p>
                    <p className="text-xs text-muted-foreground">Cost</p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-3">
                    <Layers className="mb-1 h-4 w-4 text-orange-600" />
                    <p className="font-bold">{deliverables.length || 0}</p>
                    <p className="text-xs text-muted-foreground">Items</p>
                  </div>
                </div>

                <div>
                  <p className="mb-2 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                    <BadgeIndianRupee className="h-4 w-4" />
                    Services
                  </p>
                  <div className="max-h-24 space-y-1 overflow-y-auto text-xs">
                    {services.length ? (
                      services.slice(0, 5).map((service: any, index: number) => (
                        <div key={index} className="flex justify-between rounded-lg bg-slate-50 px-3 py-2">
                          <span>{service.name}</span>
                          <span className="font-semibold">
                            ₹{Number(service.total || service.price || 0).toLocaleString('en-IN')}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground">No services added</p>
                    )}
                  </div>
                </div>

                <div>
                  <p className="mb-2 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                    <ClipboardList className="h-4 w-4" />
                    Deliverables
                  </p>
                  <ul className="max-h-24 space-y-1 overflow-y-auto text-xs">
                    {deliverables.length ? (
                      deliverables.slice(0, 6).map((deliverable: any, index: number) => (
                        <li key={index} className="flex gap-2">
                          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 text-emerald-600" />
                          <span>{deliverable.title || deliverable}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-muted-foreground">No deliverables added</li>
                    )}
                  </ul>
                </div>

                <div className="flex gap-2 border-t pt-4">
                  <Button className="flex-1" variant="outline" onClick={() => copyTemplateDetails(template)}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                  </Button>

                  <Button
                    className="flex-1"
                    onClick={() => {
                      setSelectedTemplate(template);
                      setPreviewOpen(true);
                    }}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Preview
                  </Button>
                </div>
              </div>
            </motion.div>
          );
        })}

        {filteredTemplates.length === 0 && (
          <div className="col-span-full rounded-3xl border border-dashed py-14 text-center text-muted-foreground">
            No proposal templates found
          </div>
        )}
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Proposal Template Preview</DialogTitle>
          </DialogHeader>

          {selectedTemplate && (
            <ProposalTemplatePreview template={selectedTemplate} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProposalTemplatePreview({ template }: { template: ProposalTemplate }) {
  const proposalTemplate = (template as any).proposalTemplate || {};
  const services = template.services || proposalTemplate.services || [];
  const deliverables = template.defaultDeliverables || proposalTemplate.deliverables || [];

  const subtotal = Number(proposalTemplate.subtotal || services.reduce((sum: number, item: any) => sum + Number(item.total || item.price || 0), 0));
  const discount = Number(proposalTemplate.discount || 0);
  const gstPercentage = Number(proposalTemplate.gstPercentage || 18);
  const gstAmount = Number(proposalTemplate.gstAmount || Math.round(((subtotal - discount) * gstPercentage) / 100));
  const grandTotal = Number(proposalTemplate.grandTotal || subtotal - discount + gstAmount);

  return (
    <div className="overflow-hidden rounded-3xl border bg-white">
      <div className="bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-8 text-white">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-indigo-200">
              {digitalnessDefaults.companyName}
            </p>
            <h2 className="mt-4 text-3xl font-bold">
              {proposalTemplate.proposalTitle || template.name}
            </h2>
            <p className="mt-3 max-w-2xl text-indigo-100">
              {template.description || 'Professional proposal template prepared for client presentation.'}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm">
            <p>{digitalnessDefaults.tagline}</p>
            <p>{digitalnessDefaults.website}</p>
            <p>{digitalnessDefaults.address}</p>
          </div>
        </div>
      </div>

      <div className="space-y-8 p-8">
        <section>
          <h3 className="mb-3 text-lg font-bold">About Digitalness</h3>
          <p className="text-sm leading-7 text-slate-600">
            {proposalTemplate.companyProfile || template.companyProfile || defaultForm.companyProfile}
          </p>
        </section>

        <section>
          <h3 className="mb-3 text-lg font-bold">Package Overview</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Package</p>
              <p className="font-bold">{proposalTemplate.packageName || template.packageName || template.name}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Estimated Timeline</p>
              <p className="font-bold">{template.estimatedDays || '-'} Days</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Estimated Investment</p>
              <p className="font-bold">₹{grandTotal.toLocaleString('en-IN')}</p>
            </div>
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-lg font-bold">Scope of Work</h3>
          <p className="whitespace-pre-line rounded-2xl bg-slate-50 p-4 text-sm leading-7 text-slate-700">
            {proposalTemplate.scopeOfWork || template.scopeOfWork || '-'}
          </p>
        </section>

        <section>
          <h3 className="mb-3 text-lg font-bold">Services & Commercials</h3>
          <div className="overflow-hidden rounded-2xl border">
            <table className="w-full text-sm">
              <thead className="bg-slate-950 text-white">
                <tr>
                  <th className="p-3 text-left">Service</th>
                  <th className="p-3 text-left">Description</th>
                  <th className="p-3 text-center">Qty</th>
                  <th className="p-3 text-left">Price</th>
                  <th className="p-3 text-left">Total</th>
                </tr>
              </thead>
              <tbody>
                {services.length ? (
                  services.map((service: any, index: number) => (
                    <tr key={index} className="border-t">
                      <td className="p-3 font-semibold">{service.name}</td>
                      <td className="p-3 text-slate-600">{service.description}</td>
                      <td className="p-3 text-center">{service.quantity || 1}</td>
                      <td className="p-3">₹{Number(service.price || 0).toLocaleString('en-IN')}</td>
                      <td className="p-3 font-semibold">
                        ₹{Number(service.total || service.price || 0).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="p-3 text-slate-500" colSpan={5}>
                      No services added
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="ml-auto mt-4 max-w-sm rounded-2xl bg-slate-50 p-4 text-sm">
            <div className="flex justify-between py-1">
              <span>Subtotal</span>
              <b>₹{subtotal.toLocaleString('en-IN')}</b>
            </div>
            <div className="flex justify-between py-1">
              <span>Discount</span>
              <b>₹{discount.toLocaleString('en-IN')}</b>
            </div>
            <div className="flex justify-between py-1">
              <span>GST ({gstPercentage}%)</span>
              <b>₹{gstAmount.toLocaleString('en-IN')}</b>
            </div>
            <div className="mt-2 flex justify-between border-t pt-3 text-base">
              <span>Grand Total</span>
              <b>₹{grandTotal.toLocaleString('en-IN')}</b>
            </div>
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-lg font-bold">Deliverables</h3>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {deliverables.length ? (
              deliverables.map((deliverable: any, index: number) => (
                <div key={index} className="flex gap-3 rounded-2xl border p-4 text-sm">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                  <span>{deliverable.title || deliverable}</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No deliverables added</p>
            )}
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <h3 className="mb-3 text-lg font-bold">Timeline</h3>
            <p className="whitespace-pre-line rounded-2xl bg-slate-50 p-4 text-sm leading-7">
              {proposalTemplate.timeline || template.timeline || '-'}
            </p>
          </div>

          <div>
            <h3 className="mb-3 text-lg font-bold">Payment Terms</h3>
            <p className="whitespace-pre-line rounded-2xl bg-slate-50 p-4 text-sm leading-7">
              {proposalTemplate.paymentTerms || template.paymentTerms || '-'}
            </p>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <h3 className="mb-3 text-lg font-bold">Terms & Conditions</h3>
            <p className="whitespace-pre-line rounded-2xl bg-slate-50 p-4 text-sm leading-7">
              {proposalTemplate.termsAndConditions || template.termsAndConditions || '-'}
            </p>
          </div>

          <div>
            <h3 className="mb-3 text-lg font-bold">Cancellation & Support</h3>
            <p className="whitespace-pre-line rounded-2xl bg-slate-50 p-4 text-sm leading-7">
              {proposalTemplate.cancellationPolicy || template.cancellationPolicy || '-'}
              {'\n\n'}
              {proposalTemplate.supportPeriod || template.supportPeriod || '-'}
            </p>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 border-t pt-6 md:grid-cols-2">
          <div className="rounded-2xl border p-4">
            <p className="text-sm text-slate-500">Client Signature</p>
            <div className="mt-12 border-t pt-2 text-sm">Authorized Client Representative</div>
          </div>

          <div className="rounded-2xl border p-4">
            <p className="text-sm text-slate-500">Digitalness Signature</p>
            <div className="mt-12 whitespace-pre-line border-t pt-2 text-sm">
              {proposalTemplate.signatureText || template.signatureText || defaultForm.signatureText}
            </div>
          </div>
        </section>

        <div className="rounded-2xl bg-slate-950 p-5 text-sm text-white">
          <ShieldCheck className="mb-2 h-5 w-5 text-emerald-300" />
          <p>
            This is a reusable proposal template. While creating a proposal, selected client/deal details
            will be added dynamically from the CRM.
          </p>
        </div>
      </div>
    </div>
  );
}
