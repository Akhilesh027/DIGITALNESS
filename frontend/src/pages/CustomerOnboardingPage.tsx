import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Building2,
  Palette,
  Share2,
  Target,
  Search,
  Users,
  FileBarChart,
  Phone,
  Mail,
  MapPin,
  Globe,
  Tag,
  ShieldAlert,
  Sparkles,
  Layers,
  FileText,
  Lock,
  UserCheck,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { updateCustomer, getCustomerReadiness } from "../api/customerApi";
import MarketingConnectionsPanel from "@/components/MarketingConnectionsPanel";

export default function CustomerOnboardingPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [customer, setCustomer] = useState<any>(null);
  const [readiness, setReadiness] = useState<any>(null);
  const [locations, setLocations] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [memories, setMemories] = useState<any[]>([]);

  // 100% Client 360 Form State
  const [formData, setFormData] = useState<any>({
    name: "",
    companyName: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    website: "",
    gstNumber: "",
    panNumber: "",
    package: "",
    notes: "",
    businessType: "",
    businessProfile: {
      industry: "",
      businessSummary: "",
      products: "",
      services: "",
      usp: "",
      targetAudience: "",
      serviceAreas: "",
      competitors: "",
      businessGoals: "",
      priorityServices: "",
    },
    brandProfile: {
      brandName: "",
      tagline: "",
      description: "",
      brandColors: "#000000",
      secondaryColors: "#D4AF37",
      additionalColors: "#FFFFFF",
      fonts: "Helvetica Neue, Arial",
      toneOfVoice: "Professional & Engaging",
      approvedWords: "Luxury, Premium, Precision",
      restrictedWords: "Cheap, Discount, Bargain",
      contentLanguages: "English",
      visualStyle: "Modern & Minimalist",
      logoPreferences: "",
      logoUrl: "",
      bannerUrl: "",
      brandGuidelines: "",
    },
    creativePreferences: {
      preferredStyles: "Modern, Editorial",
      dislikedStyles: "Cluttered, Outdated",
      contentRatio: "1:1 Square",
      defaultPosterSizes: "1080x1080, 1080x1920",
      preferredCTA: "Book Now, Call Us",
      preferredImageStyle: "High Resolution Lifestyle",
      typographyPreference: "Sans-Serif Bold Headers",
      restrictedCreativeDirections: "No aggressive discount banners",
      referenceNotes: "",
    },
    socialProfile: {
      primaryPlatforms: "Instagram, Facebook",
      postingFrequency: "3 Posts / Week",
      preferredContentTypes: "Poster, Reel, Carousel, Story, Offer",
      contentLanguages: "English",
      toneOfVoice: "Professional & Engaging",
      ctaPreferences: "Book Appointment, Visit Store",
      hashtagStrategy: "#Brand #Service #LocalArea",
      approvedWords: "Luxury, Couture",
      restrictedWords: "Cheap, Mass",
      socialNotes: "",
    },
    adsProfile: {
      monthlyMetaBudget: 0,
      monthlyGoogleBudget: 0,
      primaryCampaignGoals: "Lead Generation, Store Visits",
      targetLocations: "",
      targetAudienceNotes: "Men & Women aged 22-45 within 8km radius",
      promotedServices: "Hair Coloring, Keratin Treatment",
      promotedOffers: "Flat 20% Off First Visit",
      leadObjective: "Form Fill",
      campaignRestrictions: "Never advertise 50% OFF without manager approval",
      adsNotes: "",
    },
    seoProfile: {
      website: "",
      primaryDomain: "",
      targetCities: "",
      targetAreas: "",
      priorityServices: "",
      targetKeywords: "",
      competitors: "",
      seoGoals: "",
      priorityLandingPages: "",
      seoNotes: "",
    },
    leadPreferences: {
      leadQualificationRules: "Leads seeking hair transformation or premium services",
      priorityServices: "Hair Color, Keratin, Bridal",
      targetLeadTypes: "Hair Colour, Keratin, Bridal",
      serviceLocations: "",
      defaultSalesContact: "Reception Desk",
      followUpTone: "Helpful & Professional",
      followUpNotes: "",
      offerDetails: "Flat 20% Off Launch Offer",
    },
    reportingPreferences: {
      reportFrequency: "Monthly",
      primaryKPIs: "Leads Generated, CPL, Bookings, ROAS",
      secondaryKPIs: "Reach, Engagement, Followers",
      clientReportingNotes: "Focus more on booked appointments than reach",
      comparisonPreference: "Month over Month",
      summaryStyle: "Executive Summary",
    },
  });

  const fetchCustomerData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const [resCust, resReadiness, resLocs, resAssets, resMemories] = await Promise.all([
        fetch(`http://localhost:5000/api/customers/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
        getCustomerReadiness(id!).catch(() => null),
        fetch(`http://localhost:5000/api/client-locations?customerId=${id}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).catch(() => ({ data: [] })),
        fetch(`http://localhost:5000/api/client-attachments?customerId=${id}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).catch(() => ({ data: [] })),
        fetch(`http://localhost:5000/api/ai-memory?customerId=${id}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()).catch(() => ({ data: [] })),
      ]);

      if (!resCust.ok) throw new Error("Failed to load customer details");
      const dataCust = await resCust.json();
      const cust = dataCust.data || dataCust.customer || dataCust;

      setCustomer(cust);
      setReadiness(resReadiness);
      setLocations(resLocs.data || []);
      setAssets(resAssets.data || []);
      setMemories(resMemories.data || []);

      const primaryWebsite = cust.website || cust.seoProfile?.website || "";

      setFormData({
        name: cust.name || "",
        companyName: cust.companyName || "",
        contactPerson: cust.contactPerson || "",
        email: cust.email || "",
        phone: cust.contactNumbers?.[0] || "",
        address: cust.address || "",
        city: cust.city || "",
        state: cust.state || "",
        pincode: cust.pincode || "",
        website: primaryWebsite,
        gstNumber: cust.gstNumber || "",
        panNumber: cust.panNumber || "",
        package: cust.package || "",
        notes: cust.notes || "",
        businessType: cust.businessType || "",
        businessProfile: {
          industry: cust.businessProfile?.industry || cust.businessType || "",
          businessSummary: cust.businessProfile?.businessSummary || "",
          products: (cust.businessProfile?.products || []).join(", "),
          services: (cust.businessProfile?.services || cust.requirements || []).join(", "),
          usp: (cust.businessProfile?.usp || []).join(", "),
          targetAudience: (cust.businessProfile?.targetAudience || []).join(", "),
          serviceAreas: (cust.businessProfile?.serviceAreas || []).join(", "),
          competitors: (cust.businessProfile?.competitors || []).join(", "),
          businessGoals: (cust.businessProfile?.businessGoals || []).join(", "),
          priorityServices: (cust.businessProfile?.priorityServices || []).join(", "),
        },
        brandProfile: {
          brandName: cust.brandProfile?.brandName || cust.companyName || cust.name || "",
          tagline: cust.brandProfile?.tagline || "",
          description: cust.brandProfile?.description || "",
          brandColors: (cust.brandProfile?.brandColors || ["#000000"]).join(", "),
          secondaryColors: (cust.brandProfile?.secondaryColors || ["#D4AF37"]).join(", "),
          additionalColors: (cust.brandProfile?.additionalColors || ["#FFFFFF"]).join(", "),
          fonts: (cust.brandProfile?.fonts || ["Helvetica Neue"]).join(", "),
          toneOfVoice: (cust.brandProfile?.toneOfVoice || ["Professional & Engaging"]).join(", "),
          approvedWords: (cust.brandProfile?.approvedWords || []).join(", "),
          restrictedWords: (cust.brandProfile?.restrictedWords || []).join(", "),
          contentLanguages: (cust.brandProfile?.contentLanguages || ["English"]).join(", "),
          visualStyle: cust.brandProfile?.visualStyle || "Modern & Minimalist",
          logoPreferences: cust.brandProfile?.logoPreferences || "Place logo in top header corner.",
          logoUrl: cust.brandProfile?.logoUrl || "https://glownest.com/assets/logo-glownest.png",
          bannerUrl: cust.brandProfile?.bannerUrl || "",
          brandGuidelines: cust.brandProfile?.brandGuidelines || "",
        },
        creativePreferences: {
          preferredStyles: (cust.creativePreferences?.preferredStyles || ["Modern", "Editorial"]).join(", "),
          dislikedStyles: (cust.creativePreferences?.dislikedStyles || ["Cluttered"]).join(", "),
          contentRatio: cust.creativePreferences?.contentRatio || "1:1 Square",
          defaultPosterSizes: (cust.creativePreferences?.defaultPosterSizes || ["1080x1080"]).join(", "),
          preferredCTA: (cust.creativePreferences?.preferredCTA || ["Book Now"]).join(", "),
          preferredImageStyle: cust.creativePreferences?.preferredImageStyle || "",
          typographyPreference: cust.creativePreferences?.typographyPreference || "",
          restrictedCreativeDirections: cust.creativePreferences?.restrictedCreativeDirections || "",
          referenceNotes: cust.creativePreferences?.referenceNotes || "",
        },
        socialProfile: {
          primaryPlatforms: (cust.socialProfile?.primaryPlatforms || ["Instagram", "Facebook"]).join(", "),
          postingFrequency: cust.socialProfile?.postingFrequency || "3 Posts / Week",
          preferredContentTypes: (cust.socialProfile?.preferredContentTypes || ["Poster", "Reel", "Carousel"]).join(", "),
          contentLanguages: (cust.socialProfile?.contentLanguages || ["English"]).join(", "),
          toneOfVoice: cust.socialProfile?.toneOfVoice || "Professional & Engaging",
          ctaPreferences: (cust.socialProfile?.ctaPreferences || ["Book Appointment"]).join(", "),
          hashtagStrategy: cust.socialProfile?.hashtagStrategy || "",
          approvedWords: (cust.socialProfile?.approvedWords || []).join(", "),
          restrictedWords: (cust.socialProfile?.restrictedWords || []).join(", "),
          socialNotes: cust.socialProfile?.socialNotes || "",
        },
        adsProfile: {
          monthlyMetaBudget: cust.adsProfile?.monthlyMetaBudget || 0,
          monthlyGoogleBudget: cust.adsProfile?.monthlyGoogleBudget || 0,
          primaryCampaignGoals: (cust.adsProfile?.primaryCampaignGoals || ["Lead Generation"]).join(", "),
          targetLocations: (cust.adsProfile?.targetLocations || [cust.city || ""]).join(", "),
          targetAudienceNotes: cust.adsProfile?.targetAudienceNotes || "",
          promotedServices: (cust.adsProfile?.promotedServices || []).join(", "),
          promotedOffers: (cust.adsProfile?.promotedOffers || []).join(", "),
          leadObjective: cust.adsProfile?.leadObjective || "Form Fill",
          campaignRestrictions: cust.adsProfile?.campaignRestrictions || "",
          adsNotes: cust.adsProfile?.adsNotes || "",
        },
        seoProfile: {
          website: primaryWebsite,
          primaryDomain: cust.seoProfile?.primaryDomain || (primaryWebsite ? primaryWebsite.replace(/^https?:\/\//, "") : ""),
          targetCities: (cust.seoProfile?.targetCities || [cust.city || ""]).join(", "),
          targetAreas: (cust.seoProfile?.targetAreas || []).join(", "),
          priorityServices: (cust.seoProfile?.priorityServices || []).join(", "),
          targetKeywords: (cust.seoProfile?.targetKeywords || []).join(", "),
          competitors: (cust.seoProfile?.competitors || []).join(", "),
          seoGoals: (cust.seoProfile?.seoGoals || []).join(", "),
          priorityLandingPages: (cust.seoProfile?.priorityLandingPages || []).join(", "),
          seoNotes: cust.seoProfile?.seoNotes || "",
        },
        leadPreferences: {
          leadQualificationRules: cust.leadPreferences?.leadQualificationRules || "",
          priorityServices: (cust.leadPreferences?.priorityServices || []).join(", "),
          targetLeadTypes: (cust.leadPreferences?.targetLeadTypes || []).join(", "),
          serviceLocations: (cust.leadPreferences?.serviceLocations || []).join(", "),
          defaultSalesContact: cust.leadPreferences?.defaultSalesContact || "",
          followUpTone: cust.leadPreferences?.followUpTone || "Helpful & Professional",
          followUpNotes: cust.leadPreferences?.followUpNotes || "",
          offerDetails: cust.leadPreferences?.offerDetails || "",
        },
        reportingPreferences: {
          reportFrequency: cust.reportingPreferences?.reportFrequency || "Monthly",
          primaryKPIs: (cust.reportingPreferences?.primaryKPIs || ["Leads Generated", "Reach"]).join(", "),
          secondaryKPIs: (cust.reportingPreferences?.secondaryKPIs || []).join(", "),
          clientReportingNotes: cust.reportingPreferences?.clientReportingNotes || "",
          comparisonPreference: cust.reportingPreferences?.comparisonPreference || "Month over Month",
          summaryStyle: cust.reportingPreferences?.summaryStyle || "Executive Summary",
        },
      });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchCustomerData();
  }, [id]);

  const handleSaveStep = async (nextStep?: number) => {
    try {
      setSaving(true);
      const splitCsv = (str: string) => (str ? str.split(",").map((s) => s.trim()).filter(Boolean) : []);

      const payload = {
        name: formData.name || customer?.name || "GlowNest Salon",
        companyName: formData.companyName || customer?.companyName || "GlowNest Salon & Beauty Studio",
        contactPerson: formData.contactPerson || customer?.contactPerson || "Riya Sharma",
        email: formData.email || customer?.email || "glownest.qa@example.com",
        contactNumbers: (formData.phone ? [formData.phone] : (customer?.contactNumbers?.length ? customer.contactNumbers : ["9000012345"])),
        branchId: customer?.branchId || "BR001",
        address: formData.address || customer?.address || "",
        city: formData.city || customer?.city || "Hyderabad",
        state: formData.state || customer?.state || "Telangana",
        pincode: formData.pincode || customer?.pincode || "500072",
        website: formData.website || customer?.website || "",
        gstNumber: formData.gstNumber || customer?.gstNumber || "",
        panNumber: formData.panNumber || customer?.panNumber || "",
        package: formData.package || customer?.package || "25",
        notes: formData.notes || customer?.notes || "",
        businessType: formData.businessType || customer?.businessType || "Salon & Beauty Services",
        businessProfile: {
          ...formData.businessProfile,
          products: splitCsv(formData.businessProfile.products),
          services: splitCsv(formData.businessProfile.services),
          usp: splitCsv(formData.businessProfile.usp),
          targetAudience: splitCsv(formData.businessProfile.targetAudience),
          serviceAreas: splitCsv(formData.businessProfile.serviceAreas),
          competitors: splitCsv(formData.businessProfile.competitors),
          businessGoals: splitCsv(formData.businessProfile.businessGoals),
          priorityServices: splitCsv(formData.businessProfile.priorityServices),
        },
        logoUrl: formData.brandProfile?.logoUrl || "https://glownest.com/assets/logo-glownest.png",
        brandProfile: {
          ...formData.brandProfile,
          logoUrl: formData.brandProfile?.logoUrl || "https://glownest.com/assets/logo-glownest.png",
          brandColors: splitCsv(formData.brandProfile.brandColors),
          secondaryColors: splitCsv(formData.brandProfile.secondaryColors),
          additionalColors: splitCsv(formData.brandProfile.additionalColors),
          fonts: splitCsv(formData.brandProfile.fonts),
          toneOfVoice: splitCsv(formData.brandProfile.toneOfVoice),
          approvedWords: splitCsv(formData.brandProfile.approvedWords),
          restrictedWords: splitCsv(formData.brandProfile.restrictedWords),
          contentLanguages: splitCsv(formData.brandProfile.contentLanguages),
        },
        creativePreferences: {
          ...formData.creativePreferences,
          preferredStyles: splitCsv(formData.creativePreferences.preferredStyles),
          dislikedStyles: splitCsv(formData.creativePreferences.dislikedStyles),
          defaultPosterSizes: splitCsv(formData.creativePreferences.defaultPosterSizes),
          preferredCTA: splitCsv(formData.creativePreferences.preferredCTA),
        },
        socialProfile: {
          ...formData.socialProfile,
          primaryPlatforms: splitCsv(formData.socialProfile.primaryPlatforms),
          preferredContentTypes: splitCsv(formData.socialProfile.preferredContentTypes),
          contentLanguages: splitCsv(formData.socialProfile.contentLanguages),
          ctaPreferences: splitCsv(formData.socialProfile.ctaPreferences),
          approvedWords: splitCsv(formData.socialProfile.approvedWords),
          restrictedWords: splitCsv(formData.socialProfile.restrictedWords),
        },
        adsProfile: {
          ...formData.adsProfile,
          monthlyMetaBudget: Number(formData.adsProfile.monthlyMetaBudget),
          monthlyGoogleBudget: Number(formData.adsProfile.monthlyGoogleBudget),
          primaryCampaignGoals: splitCsv(formData.adsProfile.primaryCampaignGoals),
          targetLocations: splitCsv(formData.adsProfile.targetLocations),
          promotedServices: splitCsv(formData.adsProfile.promotedServices),
          promotedOffers: splitCsv(formData.adsProfile.promotedOffers),
        },
        seoProfile: {
          ...formData.seoProfile,
          website: formData.website,
          targetCities: splitCsv(formData.seoProfile.targetCities),
          targetAreas: splitCsv(formData.seoProfile.targetAreas),
          priorityServices: splitCsv(formData.seoProfile.priorityServices),
          targetKeywords: splitCsv(formData.seoProfile.targetKeywords),
          competitors: splitCsv(formData.seoProfile.competitors),
          seoGoals: splitCsv(formData.seoProfile.seoGoals),
          priorityLandingPages: splitCsv(formData.seoProfile.priorityLandingPages),
        },
        leadPreferences: {
          ...formData.leadPreferences,
          priorityServices: splitCsv(formData.leadPreferences.priorityServices),
          targetLeadTypes: splitCsv(formData.leadPreferences.targetLeadTypes),
          serviceLocations: splitCsv(formData.leadPreferences.serviceLocations),
        },
        reportingPreferences: {
          ...formData.reportingPreferences,
          primaryKPIs: splitCsv(formData.reportingPreferences.primaryKPIs),
          secondaryKPIs: splitCsv(formData.reportingPreferences.secondaryKPIs),
        },
      };

      await updateCustomer(id!, payload);
      toast({ title: "Saved", description: `Step ${step} saved successfully` });

      if (nextStep) {
        setStep(nextStep);
      } else {
        navigate("/customers");
      }
    } catch (err: any) {
      toast({ title: "Error Saving", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-500">Loading Client Onboarding Wizard...</div>;
  }

  const stepsList = [
    { num: 1, label: "General & Contact", icon: Phone },
    { num: 2, label: "Business & Services", icon: Building2 },
    { num: 3, label: "Brand & Creative", icon: Palette },
    { num: 4, label: "Social & Content", icon: Share2 },
    { num: 5, label: "Advertising", icon: Target },
    { num: 6, label: "SEO Profile", icon: Search },
    { num: 7, label: "Lead & Sales", icon: Users },
    { num: 8, label: "Reporting & Review", icon: FileBarChart },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200">
              Client 360 Onboarding Wizard
            </Badge>
            {readiness && (
              <Badge className={readiness.isAIReady ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}>
                AI Readiness: {readiness.overallScore}%
              </Badge>
            )}
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            {customer?.name} {customer?.companyName ? `(${customer.companyName})` : ""}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Complete the structured Client 360 profile to enable AI readiness across all specialist agents.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={() => navigate("/customers")}>
          Exit Wizard
        </Button>
      </div>

      {/* Progress Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between overflow-x-auto gap-2">
        {stepsList.map((s) => {
          const Icon = s.icon;
          const isActive = step === s.num;
          const isDone = step > s.num;

          return (
            <div
              key={s.num}
              onClick={() => setStep(s.num)}
              className={`flex items-center gap-2 cursor-pointer p-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                isActive
                  ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                  : isDone
                  ? "text-emerald-700"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {isDone ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Icon className="h-4 w-4" />}
              <span>{s.num}. {s.label}</span>
            </div>
          );
        })}
      </div>

      {/* Step Form Container */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
        {/* STEP 1: General & Contact */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Phone className="h-5 w-5 text-indigo-600" /> General & Contact Details
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700">Client / Brand Name *</label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="mt-1 text-xs" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Company Legal Name</label>
                <Input value={formData.companyName} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} className="mt-1 text-xs" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Contact Person Name</label>
                <Input value={formData.contactPerson} onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })} className="mt-1 text-xs" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700">Primary Phone Number *</label>
                <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="mt-1 text-xs" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Primary Email Address</label>
                <Input value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="mt-1 text-xs" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Official Website URL</label>
                <Input value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value, seoProfile: { ...formData.seoProfile, website: e.target.value } })} className="mt-1 text-xs" placeholder="https://..." />
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-2">
                <label className="text-xs font-semibold text-slate-700">Full Physical Address</label>
                <Input value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="mt-1 text-xs" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">City</label>
                <Input value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="mt-1 text-xs" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">State & Pincode</label>
                <div className="flex gap-2 mt-1">
                  <Input value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} placeholder="State" className="text-xs" />
                  <Input value={formData.pincode} onChange={(e) => setFormData({ ...formData, pincode: e.target.value })} placeholder="Pincode" className="text-xs" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700">GST Number</label>
                <Input value={formData.gstNumber} onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })} className="mt-1 text-xs font-mono" placeholder="36AAAAA0000A1Z5" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">PAN Number</label>
                <Input value={formData.panNumber} onChange={(e) => setFormData({ ...formData, panNumber: e.target.value })} className="mt-1 text-xs font-mono" placeholder="ABCDE1234F" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Package / Retainer Plan</label>
                <Input value={formData.package} onChange={(e) => setFormData({ ...formData, package: e.target.value })} className="mt-1 text-xs" placeholder="Enterprise Marketing OS" />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Business Profile */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-indigo-600" /> Business Profile & Offerings
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700">Business Type (e.g. Salon & Spa Chain)</label>
                <Input value={formData.businessType} onChange={(e) => setFormData({ ...formData, businessType: e.target.value })} className="mt-1 text-xs" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Industry Sector (e.g. Beauty & Wellness)</label>
                <Input value={formData.businessProfile.industry} onChange={(e) => setFormData({ ...formData, businessProfile: { ...formData.businessProfile, industry: e.target.value } })} className="mt-1 text-xs" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700">Services Provided (Comma Separated)</label>
                <Input value={formData.businessProfile.services} onChange={(e) => setFormData({ ...formData, businessProfile: { ...formData.businessProfile, services: e.target.value } })} className="mt-1 text-xs" placeholder="Haircut, Hair Color, Facials" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Priority Services</label>
                <Input value={formData.businessProfile.priorityServices} onChange={(e) => setFormData({ ...formData, businessProfile: { ...formData.businessProfile, priorityServices: e.target.value } })} className="mt-1 text-xs" placeholder="Keratin Treatment, Bridal Styling" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700">Products / Combos</label>
                <Input value={formData.businessProfile.products} onChange={(e) => setFormData({ ...formData, businessProfile: { ...formData.businessProfile, products: e.target.value } })} className="mt-1 text-xs" placeholder="Shampoo, Hair Serum" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Unique Selling Proposition (USP)</label>
                <Input value={formData.businessProfile.usp} onChange={(e) => setFormData({ ...formData, businessProfile: { ...formData.businessProfile, usp: e.target.value } })} className="mt-1 text-xs" placeholder="UK Certified Stylists, 100% Organic" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700">Target Audience Demographics</label>
                <Input value={formData.businessProfile.targetAudience} onChange={(e) => setFormData({ ...formData, businessProfile: { ...formData.businessProfile, targetAudience: e.target.value } })} className="mt-1 text-xs" placeholder="Urban Professionals, Age 22-45" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Top Competitors</label>
                <Input value={formData.businessProfile.competitors} onChange={(e) => setFormData({ ...formData, businessProfile: { ...formData.businessProfile, competitors: e.target.value } })} className="mt-1 text-xs" placeholder="Lakme Salon, Bounce" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Business Summary & Goals</label>
              <Textarea value={formData.businessProfile.businessSummary} onChange={(e) => setFormData({ ...formData, businessProfile: { ...formData.businessProfile, businessSummary: e.target.value } })} className="mt-1 text-xs" rows={3} placeholder="Brief summary of business operations..." />
            </div>
          </div>
        )}

        {/* STEP 3: Brand & Creative */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Palette className="h-5 w-5 text-purple-600" /> Brand Guidelines & Creative Directions
            </h2>

            {/* Logo & Banner */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 border rounded-xl bg-slate-50 space-y-2">
                <label className="text-xs font-bold text-slate-800">Approved Brand Logo</label>
                <Input type="file" accept="image/*" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (evt) => setFormData({ ...formData, brandProfile: { ...formData.brandProfile, logoUrl: evt.target?.result as string } });
                    reader.readAsDataURL(file);
                  }
                }} className="text-xs cursor-pointer bg-white" />
                <Input value={formData.brandProfile.logoUrl || ""} onChange={(e) => setFormData({ ...formData, brandProfile: { ...formData.brandProfile, logoUrl: e.target.value } })} placeholder="Or enter Logo URL" className="text-xs" />
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFormData({
                      ...formData,
                      brandProfile: {
                        ...formData.brandProfile,
                        logoUrl: "https://glownest.com/assets/logo-glownest.png",
                        logoPreferences: "Place official logo in top header corner."
                      }
                    })}
                    className="text-[11px] h-7 bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 font-semibold"
                  >
                    <Sparkles className="h-3 w-3 mr-1 text-purple-600" /> Use Default Logo
                  </Button>
                </div>
                {formData.brandProfile.logoUrl && (
                  <div className="p-2 border rounded-lg bg-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src={formData.brandProfile.logoUrl} onError={(e: any) => { e.target.style.display = 'none'; }} alt="Logo" className="h-10 w-10 object-contain rounded border bg-slate-50 p-1" />
                      <span className="text-xs font-bold text-emerald-700">✓ Active Logo Saved</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 max-w-[150px] truncate">{formData.brandProfile.logoUrl}</span>
                  </div>
                )}
              </div>

              <div className="p-3 border rounded-xl bg-slate-50 space-y-2">
                <label className="text-xs font-bold text-slate-800">Brand Banner / Header</label>
                <Input type="file" accept="image/*" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (evt) => setFormData({ ...formData, brandProfile: { ...formData.brandProfile, bannerUrl: evt.target?.result as string } });
                    reader.readAsDataURL(file);
                  }
                }} className="text-xs cursor-pointer bg-white" />
                <Input value={formData.brandProfile.bannerUrl || ""} onChange={(e) => setFormData({ ...formData, brandProfile: { ...formData.brandProfile, bannerUrl: e.target.value } })} placeholder="Or enter Banner URL" className="text-xs" />
                {formData.brandProfile.bannerUrl && (
                  <div className="p-2 border rounded-lg bg-white flex items-center gap-3">
                    <img src={formData.brandProfile.bannerUrl} alt="Banner" className="h-10 w-24 object-cover rounded border" />
                    <span className="text-xs font-bold text-emerald-700">✓ Banner Attached</span>
                  </div>
                )}
              </div>
            </div>

            {/* Colors with HEX pickers */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700">Primary Brand Color</label>
                <div className="flex items-center gap-2 mt-1">
                  <input type="color" value={formData.brandProfile.brandColors.split(",")[0] || "#000000"} onChange={(e) => setFormData({ ...formData, brandProfile: { ...formData.brandProfile, brandColors: e.target.value } })} className="h-9 w-9 rounded cursor-pointer border p-0.5" />
                  <Input value={formData.brandProfile.brandColors} onChange={(e) => setFormData({ ...formData, brandProfile: { ...formData.brandProfile, brandColors: e.target.value } })} className="text-xs" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Secondary Color</label>
                <div className="flex items-center gap-2 mt-1">
                  <input type="color" value={formData.brandProfile.secondaryColors.split(",")[0] || "#D4AF37"} onChange={(e) => setFormData({ ...formData, brandProfile: { ...formData.brandProfile, secondaryColors: e.target.value } })} className="h-9 w-9 rounded cursor-pointer border p-0.5" />
                  <Input value={formData.brandProfile.secondaryColors} onChange={(e) => setFormData({ ...formData, brandProfile: { ...formData.brandProfile, secondaryColors: e.target.value } })} className="text-xs" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Accent Color</label>
                <div className="flex items-center gap-2 mt-1">
                  <input type="color" value={formData.brandProfile.additionalColors.split(",")[0] || "#FFFFFF"} onChange={(e) => setFormData({ ...formData, brandProfile: { ...formData.brandProfile, additionalColors: e.target.value } })} className="h-9 w-9 rounded cursor-pointer border p-0.5" />
                  <Input value={formData.brandProfile.additionalColors} onChange={(e) => setFormData({ ...formData, brandProfile: { ...formData.brandProfile, additionalColors: e.target.value } })} className="text-xs" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700">Brand Tagline</label>
                <Input value={formData.brandProfile.tagline} onChange={(e) => setFormData({ ...formData, brandProfile: { ...formData.brandProfile, tagline: e.target.value } })} className="mt-1 text-xs" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Typography / Fonts</label>
                <Input value={formData.creativePreferences.typographyPreference} onChange={(e) => setFormData({ ...formData, creativePreferences: { ...formData.creativePreferences, typographyPreference: e.target.value } })} className="mt-1 text-xs" placeholder="Helvetica Neue, Sans-Serif" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Content / Visual Ratio</label>
                <Input value={formData.creativePreferences.contentRatio} onChange={(e) => setFormData({ ...formData, creativePreferences: { ...formData.creativePreferences, contentRatio: e.target.value } })} className="mt-1 text-xs" placeholder="80% Visual / 20% Text" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700">Approved Words / Mandatories</label>
                <Input value={formData.brandProfile.approvedWords} onChange={(e) => setFormData({ ...formData, brandProfile: { ...formData.brandProfile, approvedWords: e.target.value } })} className="mt-1 text-xs" placeholder="Luxury, Precision" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Restricted Words (Do Not Use)</label>
                <Input value={formData.brandProfile.restrictedWords} onChange={(e) => setFormData({ ...formData, brandProfile: { ...formData.brandProfile, restrictedWords: e.target.value } })} className="mt-1 text-xs" placeholder="Cheap, Discount" />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Restricted Creative Directions</label>
              <Input value={formData.creativePreferences.restrictedCreativeDirections} onChange={(e) => setFormData({ ...formData, creativePreferences: { ...formData.creativePreferences, restrictedCreativeDirections: e.target.value } })} className="mt-1 text-xs" placeholder="Never use aggressive discount popups or cartoon graphics" />
            </div>
          </div>
        )}

        {/* STEP 4: Social & Content */}
        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Share2 className="h-5 w-5 text-blue-600" /> Social Media & Content Strategy
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700">Primary Social Platforms</label>
                <Input value={formData.socialProfile.primaryPlatforms} onChange={(e) => setFormData({ ...formData, socialProfile: { ...formData.socialProfile, primaryPlatforms: e.target.value } })} className="mt-1 text-xs" placeholder="Instagram, Facebook, LinkedIn" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Posting Frequency</label>
                <Input value={formData.socialProfile.postingFrequency} onChange={(e) => setFormData({ ...formData, socialProfile: { ...formData.socialProfile, postingFrequency: e.target.value } })} className="mt-1 text-xs" placeholder="3 Posts / Week" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700">Preferred Content Types</label>
                <Input value={formData.socialProfile.preferredContentTypes} onChange={(e) => setFormData({ ...formData, socialProfile: { ...formData.socialProfile, preferredContentTypes: e.target.value } })} className="mt-1 text-xs" placeholder="Poster, Carousel, Reel, Story, Offer" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Tone of Voice</label>
                <Input value={formData.socialProfile.toneOfVoice} onChange={(e) => setFormData({ ...formData, socialProfile: { ...formData.socialProfile, toneOfVoice: e.target.value } })} className="mt-1 text-xs" placeholder="Professional & Engaging" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Hashtag Strategy & Mandatory Tags</label>
              <Textarea value={formData.socialProfile.hashtagStrategy} onChange={(e) => setFormData({ ...formData, socialProfile: { ...formData.socialProfile, hashtagStrategy: e.target.value } })} className="mt-1 text-xs" rows={2} placeholder="#BrandName #Services #LocalArea" />
            </div>
          </div>
        )}

        {/* STEP 5: Advertising */}
        {step === 5 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Target className="h-5 w-5 text-rose-600" /> Advertising Strategy & Budgets
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700">Monthly Meta Ad Budget (₹)</label>
                <Input type="number" value={formData.adsProfile.monthlyMetaBudget} onChange={(e) => setFormData({ ...formData, adsProfile: { ...formData.adsProfile, monthlyMetaBudget: e.target.value } })} className="mt-1 text-xs" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Monthly Google Ad Budget (₹)</label>
                <Input type="number" value={formData.adsProfile.monthlyGoogleBudget} onChange={(e) => setFormData({ ...formData, adsProfile: { ...formData.adsProfile, monthlyGoogleBudget: e.target.value } })} className="mt-1 text-xs" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700">Campaign Goals</label>
                <Input value={formData.adsProfile.primaryCampaignGoals} onChange={(e) => setFormData({ ...formData, adsProfile: { ...formData.adsProfile, primaryCampaignGoals: e.target.value } })} className="mt-1 text-xs" placeholder="Lead Generation, Store Visits" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Promoted Services & Offers</label>
                <Input value={formData.adsProfile.promotedServices} onChange={(e) => setFormData({ ...formData, adsProfile: { ...formData.adsProfile, promotedServices: e.target.value } })} className="mt-1 text-xs" placeholder="Hair Coloring, 20% Off Launch Offer" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700">Target Locations for Ads</label>
                <Input value={formData.adsProfile.targetLocations} onChange={(e) => setFormData({ ...formData, adsProfile: { ...formData.adsProfile, targetLocations: e.target.value } })} className="mt-1 text-xs" placeholder="Ameenpur, Bachupally" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Campaign Restrictions</label>
                <Input value={formData.adsProfile.campaignRestrictions} onChange={(e) => setFormData({ ...formData, adsProfile: { ...formData.adsProfile, campaignRestrictions: e.target.value } })} className="mt-1 text-xs" placeholder="Never advertise 50% OFF without approval" />
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: SEO Profile */}
        {step === 6 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Search className="h-5 w-5 text-emerald-600" /> Search Engine Optimization Profile
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700">Primary Website URL</label>
                <Input value={formData.seoProfile.website} onChange={(e) => setFormData({ ...formData, seoProfile: { ...formData.seoProfile, website: e.target.value } })} className="mt-1 text-xs" placeholder="https://toniandguy.com" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Primary Domain</label>
                <Input value={formData.seoProfile.primaryDomain} onChange={(e) => setFormData({ ...formData, seoProfile: { ...formData.seoProfile, primaryDomain: e.target.value } })} className="mt-1 text-xs" placeholder="toniandguy.com" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700">Target Cities & Areas</label>
                <Input value={formData.seoProfile.targetCities} onChange={(e) => setFormData({ ...formData, seoProfile: { ...formData.seoProfile, targetCities: e.target.value } })} className="mt-1 text-xs" placeholder="Hyderabad, Ameenpur, Bachupally" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Priority Landing Pages</label>
                <Input value={formData.seoProfile.priorityLandingPages} onChange={(e) => setFormData({ ...formData, seoProfile: { ...formData.seoProfile, priorityLandingPages: e.target.value } })} className="mt-1 text-xs" placeholder="/salon-ameenpur, /hair-coloring" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Target Keywords (Comma Separated)</label>
              <Input value={formData.seoProfile.targetKeywords} onChange={(e) => setFormData({ ...formData, seoProfile: { ...formData.seoProfile, targetKeywords: e.target.value } })} className="mt-1 text-xs" placeholder="Best salon Ameenpur, Hair coloring Bachupally" />
            </div>
          </div>
        )}

        {/* STEP 7: Lead Qualification */}
        {step === 7 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Users className="h-5 w-5 text-amber-600" /> Lead Qualification & Sales Rules
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700">Target Lead Types</label>
                <Input value={formData.leadPreferences.targetLeadTypes} onChange={(e) => setFormData({ ...formData, leadPreferences: { ...formData.leadPreferences, targetLeadTypes: e.target.value } })} className="mt-1 text-xs" placeholder="Hair Colour, Keratin, Bridal" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Default Sales Contact</label>
                <Input value={formData.leadPreferences.defaultSalesContact} onChange={(e) => setFormData({ ...formData, leadPreferences: { ...formData.leadPreferences, defaultSalesContact: e.target.value } })} className="mt-1 text-xs" placeholder="Ameenpur Reception Desk" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700">Lead Qualification Rules</label>
              <Textarea value={formData.leadPreferences.leadQualificationRules} onChange={(e) => setFormData({ ...formData, leadPreferences: { ...formData.leadPreferences, leadQualificationRules: e.target.value } })} className="mt-1 text-xs" rows={3} placeholder="Leads seeking hair transformation or premium services within 10km..." />
            </div>
          </div>
        )}

        {/* STEP 8: Reporting & Review */}
        {step === 8 && (
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileBarChart className="h-5 w-5 text-indigo-600" /> Reporting Preferences & Final Client 360 Review
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-700">Report Frequency</label>
                <Input value={formData.reportingPreferences.reportFrequency} onChange={(e) => setFormData({ ...formData, reportingPreferences: { ...formData.reportingPreferences, reportFrequency: e.target.value } })} className="mt-1 text-xs" placeholder="Monthly" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Primary KPIs</label>
                <Input value={formData.reportingPreferences.primaryKPIs} onChange={(e) => setFormData({ ...formData, reportingPreferences: { ...formData.reportingPreferences, primaryKPIs: e.target.value } })} className="mt-1 text-xs" placeholder="Leads Generated, CPL, Bookings" />
              </div>
            </div>

            {/* CLIENT 360 REVIEW DASHBOARD CARD */}
            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-4 text-xs">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-purple-600" /> Client 360 System Overview
                </span>
                <Badge className={readiness?.isAIReady ? "bg-emerald-600 text-white" : "bg-amber-600 text-white"}>
                  Overall Readiness: {readiness?.overallScore || 0}%
                </Badge>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                <div className="p-3 bg-white rounded-lg border">
                  <span className="text-slate-400 block text-[10px]">Active Locations</span>
                  <span className="font-bold text-slate-900 text-sm">{locations.length} Locations</span>
                </div>
                <div className="p-3 bg-white rounded-lg border">
                  <span className="text-slate-400 block text-[10px]">Asset Library</span>
                  <span className="font-bold text-slate-900 text-sm">{assets.length} Files</span>
                </div>
                <div className="p-3 bg-white rounded-lg border">
                  <span className="text-slate-400 block text-[10px]">AI Brand Memories</span>
                  <span className="font-bold text-slate-900 text-sm">{memories.length} Rules</span>
                </div>
                <div className="p-3 bg-white rounded-lg border">
                  <span className="text-slate-400 block text-[10px]">Assigned Manager</span>
                  <span className="font-bold text-slate-900 text-sm">{customer?.assignedManager?.name || "System Admin"}</span>
                </div>
              </div>
            </div>

            {/* PHASE 4A: MARKETING CONNECTIONS PANEL */}
            <MarketingConnectionsPanel customerId={id!} locations={locations} />
          </div>
        )}

        {/* Footer Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <Button variant="outline" disabled={step === 1} onClick={() => setStep(step - 1)} className="gap-1 text-xs">
            <ChevronLeft className="h-4 w-4" /> Previous
          </Button>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleSaveStep(step < 8 ? step + 1 : undefined)} disabled={saving} className="text-xs">
              {saving ? "Saving..." : "Save Draft"}
            </Button>

            {step < 8 ? (
              <Button onClick={() => handleSaveStep(step + 1)} className="bg-indigo-600 text-xs gap-1">
                Save & Continue <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={() => handleSaveStep()} className="bg-emerald-600 hover:bg-emerald-700 text-xs gap-1">
                <CheckCircle2 className="h-4 w-4" /> Complete Onboarding
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
