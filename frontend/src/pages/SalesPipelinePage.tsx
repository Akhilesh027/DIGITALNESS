import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  Phone,
  Calendar,
  IndianRupee,
  TrendingUp,
  Building2,
  ChevronRight,
  ChevronLeft,
  X,
  MessageSquare,
  Trophy,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

type DealStage =
  | "New"
  | "Contacted"
  | "Discovery"
  | "Qualified"
  | "Proposal"
  | "Negotiation"
  | "Won"
  | "Lost";

const DEAL_STAGES: DealStage[] = [
  "New",
  "Contacted",
  "Discovery",
  "Qualified",
  "Proposal",
  "Negotiation",
  "Won",
  "Lost",
];

const stageColors: Record<DealStage, string> = {
  New: "bg-blue-500/10 border-blue-500/30 text-blue-600",
  Contacted: "bg-cyan-500/10 border-cyan-500/30 text-cyan-600",
  Discovery: "bg-violet-500/10 border-violet-500/30 text-violet-600",
  Qualified: "bg-indigo-500/10 border-indigo-500/30 text-indigo-600",
  Proposal: "bg-amber-500/10 border-amber-500/30 text-amber-600",
  Negotiation: "bg-orange-500/10 border-orange-500/30 text-orange-600",
  Won: "bg-emerald-500/10 border-emerald-500/30 text-emerald-600",
  Lost: "bg-rose-500/10 border-rose-500/30 text-rose-600",
};

const lostReasons = [
  "Price",
  "No Response",
  "Competitor",
  "Not Interested",
  "Other",
];

// Helper: extract user info from localStorage
const getCurrentUser = () => {
  try {
    const stored = localStorage.getItem("user");
    if (!stored) return null;
    const user = JSON.parse(stored);
    return {
      _id: user._id || user.id,
      role: user.role,
      branchId: user.branchId,
      name: user.name,
    };
  } catch {
    return null;
  }
};

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
  if (Array.isArray(data?.deals)) return data.deals;
  if (Array.isArray(data?.leads)) return data.leads;
  if (Array.isArray(data?.users)) return data.users;
  if (Array.isArray(data?.branches)) return data.branches;
  return [];
};

export default function SalesPipelinePage() {
  const { toast } = useToast();
  const currentUser = getCurrentUser();

  const userRole = String(currentUser?.role || "")
    .trim()
    .toLowerCase();

  const isAdmin = userRole === "admin";
  const isOperationalManager =
    userRole === "operational manager" || userRole === "operationalmanager";
  const isAdminOrManager = isAdmin || isOperationalManager;
  const isTelecaller = userRole === "telecaller";
  const canAddDeal = isAdminOrManager;

  const [deals, setDeals] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [branches, setBranches] = useState<{ id: string; name: string, branchId: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [branchesLoading, setBranchesLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("All");
  const [selectedDeal, setSelectedDeal] = useState<any | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [lostDeal, setLostDeal] = useState<any | null>(null);
  const [lostReason, setLostReason] = useState("Price");
  const [callNote, setCallNote] = useState("");

  const [newDeal, setNewDeal] = useState({
    leadId: "",
    title: "",
    dealValue: 0,
    probability: 50,
    expectedCloseDate: "",
    assignedTo: "",
    branchId: "BR001",
    notes: "",
  });

  // Fetch branches from API
  const fetchBranches = async () => {
    try {
      setBranchesLoading(true);
      const res = await fetch(`${API_URL}/branches`, getAuthConfig());
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch branches");
      const branchesData = getArrayData(data);
      setBranches(branchesData);
      // If user has a branchId and it's not in the list, we might still keep filter "All"
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Could not load branches",
        variant: "destructive",
      });
      // Fallback to empty array
      setBranches([]);
    } finally {
      setBranchesLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);

      const [dealsRes, leadsRes, usersRes] = await Promise.all([
        fetch(`${API_URL}/deals`, getAuthConfig()),
        fetch(`${API_URL}/leads`, getAuthConfig()),
        fetch(`${API_URL}/users`, getAuthConfig()),
      ]);

      const dealsData = await dealsRes.json();
      const leadsData = await leadsRes.json();
      const usersData = await usersRes.json();

      if (!dealsRes.ok) {
        throw new Error(dealsData.message || "Failed to fetch deals");
      }

      let allDeals = getArrayData(dealsData);
      let allLeads = getArrayData(leadsData);
      let allEmployees = getArrayData(usersData);

      // Role-based access
      // Admin: all branches/data
      // Operational Manager: own branch data only
      // Telecaller/other users: only assigned deals/leads
      if (isOperationalManager && currentUser?.branchId) {
        allDeals = allDeals.filter(
          (deal: any) => String(deal.branchId) === String(currentUser.branchId)
        );
        allLeads = allLeads.filter(
          (lead: any) => String(lead.branchId) === String(currentUser.branchId)
        );
        allEmployees = allEmployees.filter(
          (emp: any) =>
            String(emp.branchId || emp.branch?.branchId || emp.branch) ===
            String(currentUser.branchId) ||
            ["Admin", "Operational Manager"].includes(emp.role)
        );
      } else if (!isAdmin && currentUser?._id) {
        allDeals = allDeals.filter(
          (deal: any) => extractId(deal.assignedTo) === currentUser._id
        );
        allLeads = allLeads.filter(
          (lead: any) => extractId(lead.assignedTo) === currentUser._id
        );
        allEmployees = allEmployees.filter(
          (emp: any) => String(emp._id || emp.id) === String(currentUser._id)
        );
      }

      setDeals(allDeals);
      setLeads(allLeads);
      setEmployees(allEmployees);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch pipeline data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const extractId = (obj: any): string | null => {
    if (!obj) return null;
    if (typeof obj === "string") return obj;
    if (obj.$oid) return obj.$oid;
    if (obj._id) return obj._id;
    return null;
  };

  // Load branches and data on mount
  useEffect(() => {
    fetchBranches();
    fetchData();
  }, []);

  const getDealId = (deal: any) => deal._id || deal.id;

  const employeeName = (assignedTo: any) => {
    if (!assignedTo) return "Unassigned";

    if (typeof assignedTo === "object") {
      return assignedTo.name || assignedTo.email || "Unassigned";
    }

    const emp = employees.find(
      (e: any) => String(e._id || e.id) === String(assignedTo)
    );

    return emp?.name || emp?.email || "Unassigned";
  };

  const branchName = (id: string) => {
    const branch = branches.find(
      (b) => String(b.id) === String(id) || String(b.branchId) === String(id)
    );
    return branch?.name || id || "—";
  };

  const visibleDeals = useMemo(() => {
    let filtered = deals;

    // Apply search
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (deal) =>
          deal.title?.toLowerCase().includes(q) ||
          deal.customerName?.toLowerCase().includes(q) ||
          deal.contactNumber?.toLowerCase().includes(q) ||
          deal.businessType?.toLowerCase().includes(q)
      );
    }

    // Apply branch filter (respect user's branch if telecaller)
    if (branchFilter !== "All") {
      filtered = filtered.filter((deal) => deal.branchId === branchFilter);
    } else if ((isTelecaller || isOperationalManager) && currentUser?.branchId) {
      filtered = filtered.filter(
        (deal) => String(deal.branchId) === String(currentUser.branchId)
      );
    }

    return filtered;
  }, [deals, search, branchFilter, isTelecaller, isOperationalManager, currentUser]);

  const dealsByStage = useMemo(() => {
    const grouped: Record<DealStage, any[]> = {
      New: [],
      Contacted: [],
      Discovery: [],
      Qualified: [],
      Proposal: [],
      Negotiation: [],
      Won: [],
      Lost: [],
    };

    visibleDeals.forEach((deal) => {
      grouped[deal.stage as DealStage]?.push(deal);
    });

    return grouped;
  }, [visibleDeals]);

  const stats = useMemo(() => {
    const open = visibleDeals.filter(
      (deal) => deal.stage !== "Won" && deal.stage !== "Lost"
    );

    return {
      total: visibleDeals.length,
      open: open.length,
      pipelineValue: open.reduce((sum, deal) => sum + Number(deal.dealValue || 0), 0),
      won: visibleDeals.filter((deal) => deal.stage === "Won").length,
      wonValue: visibleDeals
        .filter((deal) => deal.stage === "Won")
        .reduce((sum, deal) => sum + Number(deal.dealValue || 0), 0),
    };
  }, [visibleDeals]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount || 0);

  const moveStage = async (deal: any, dir: 1 | -1) => {
    const idx = DEAL_STAGES.indexOf(deal.stage);
    const next = DEAL_STAGES[idx + dir];

    if (!next) return;

    if (next === "Lost") {
      setLostDeal(deal);
      return;
    }

    await updateDealStage(deal, next);
  };

  const updateDealStage = async (
    deal: any,
    stage: DealStage,
    reason?: string
  ) => {
    try {
      const res = await fetch(`${API_URL}/deals/${getDealId(deal)}/stage`, {
        method: "PATCH",
        ...getAuthConfig(),
        body: JSON.stringify({
          stage,
          lostReason: reason,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to update stage");
      }

      const updatedDeal = data.deal || data.data || data;

      setDeals((prev) =>
        prev.map((item) =>
          String(getDealId(item)) === String(getDealId(updatedDeal))
            ? updatedDeal
            : item
        )
      );

      setSelectedDeal((prev: any) =>
        prev && String(getDealId(prev)) === String(getDealId(updatedDeal))
          ? updatedDeal
          : prev
      );

      if (stage === "Won") {
        toast({
          title: "Customer Created",
          description: "Deal won successfully and customer was created automatically",
        });
      }
      if (stage === "Proposal") {
        toast({
          title: "Proposal Created",
          description:
            data.message ||
            "Deal moved to Proposal and proposal created automatically",
        });
      } else {
        toast({
          title: "Stage Updated",
          description: `${deal.title} moved to ${stage}`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update deal stage",
        variant: "destructive",
      });
    }
  };

  const handleConfirmLost = async () => {
    if (!lostDeal) return;

    await updateDealStage(lostDeal, "Lost", lostReason);

    setLostDeal(null);
    setLostReason("Price");
  };

  const handleLeadSelect = (leadId: string) => {
    const lead = leads.find((l: any) => String(l._id || l.id) === String(leadId));

    setNewDeal({
      ...newDeal,
      leadId,
      title: lead?.businessType
        ? `${lead.name} - ${lead.businessType}`
        : lead?.name || "",
      branchId: lead?.branchId || (branches.length > 0 ? branches[0].id : "BR001"),
      assignedTo: lead?.assignedTo?._id || lead?.assignedTo || "",
    });
  };

  const handleAddDeal = async () => {
    if (!canAddDeal) {
      toast({
        title: "Access Denied",
        description: "Only Admin and Operational Manager can add deals",
        variant: "destructive",
      });
      return;
    }

    const lead = leads.find(
      (l: any) => String(l._id || l.id) === String(newDeal.leadId)
    );

    if (!newDeal.leadId || !newDeal.title || !newDeal.dealValue) {
      toast({
        title: "Missing fields",
        description: "Lead, title and deal value are required",
        variant: "destructive",
      });
      return;
    }

    try {
      const payload = {
        leadId: newDeal.leadId,
        title: newDeal.title,
        customerName:
          lead?.name ||
          lead?.customerName ||
          lead?.clientName ||
          newDeal.title,
        contactNumber:
          lead?.contactNumber ||
          lead?.phone ||
          lead?.mobile ||
          "",
        businessType: lead?.businessType || "",
        branchId:
          isOperationalManager && currentUser?.branchId
            ? currentUser.branchId
            : newDeal.branchId || lead?.branchId || branches[0]?.branchId || branches[0]?.id || "BR001",
        stage: "New",
        dealValue: Number(newDeal.dealValue),
        probability: Number(newDeal.probability),
        expectedCloseDate: newDeal.expectedCloseDate || undefined,
        assignedTo: newDeal.assignedTo || lead?.assignedTo?._id || lead?.assignedTo,
        notes: newDeal.notes,
      };

      const res = await fetch(`${API_URL}/deals`, {
        method: "POST",
        ...getAuthConfig(),
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to create deal");
      }

      const createdDeal = data.deal || data.data || data;

      setDeals((prev) => [createdDeal, ...prev]);

      toast({
        title: "Deal created",
        description: createdDeal.title,
      });

      setShowAdd(false);
      setNewDeal({
        leadId: "",
        title: "",
        dealValue: 0,
        probability: 50,
        expectedCloseDate: "",
        assignedTo: "",
        branchId:
          isOperationalManager && currentUser?.branchId
            ? currentUser.branchId
            : branches[0]?.branchId || branches[0]?.id || "BR001",
        notes: "",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create deal",
        variant: "destructive",
      });
    }
  };

  const saveCallLog = async () => {
    if (!selectedDeal || !callNote.trim()) return;

    try {
      const res = await fetch(
        `${API_URL}/deals/${getDealId(selectedDeal)}/call-log`,
        {
          method: "POST",
          ...getAuthConfig(),
          body: JSON.stringify({
            notes: callNote,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to add call log");
      }

      const updatedDeal = data.deal || data.data || data;

      setDeals((prev) =>
        prev.map((deal) =>
          String(getDealId(deal)) === String(getDealId(updatedDeal))
            ? updatedDeal
            : deal
        )
      );

      setSelectedDeal(updatedDeal);
      setCallNote("");

      toast({
        title: "Call log added",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add call log",
        variant: "destructive",
      });
    }
  };

  const deleteDeal = async (deal: any) => {
    try {
      const res = await fetch(`${API_URL}/deals/${getDealId(deal)}`, {
        method: "DELETE",
        ...getAuthConfig(),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to delete deal");
      }

      setDeals((prev) =>
        prev.filter((item) => String(getDealId(item)) !== String(getDealId(deal)))
      );

      setSelectedDeal(null);

      toast({
        title: "Deal deleted",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete deal",
        variant: "destructive",
      });
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
          <h1 className="text-2xl font-heading font-bold text-foreground">
            Sales Pipeline {isTelecaller && "(Telecaller View)"}
          </h1>
          <p className="text-muted-foreground">
            Track deals, stages, follow-ups and conversions
          </p>
        </div>

        {canAddDeal && (
          <Button variant="gradient" onClick={() => setShowAdd(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Deal
          </Button>
        )}
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border shadow-card">
          <p className="text-2xl font-heading font-bold">{stats.total}</p>
          <p className="text-sm text-muted-foreground">Total Deals</p>
        </div>

        <div className="p-4 rounded-xl bg-info/10 border border-info/30">
          <p className="text-2xl font-heading font-bold text-info">
            {stats.open}
          </p>
          <p className="text-sm text-muted-foreground">Open Deals</p>
        </div>

        <div className="p-4 rounded-xl bg-warning/10 border border-warning/30">
          <p className="text-2xl font-heading font-bold text-warning">
            {formatCurrency(stats.pipelineValue)}
          </p>
          <p className="text-sm text-muted-foreground">Pipeline Value</p>
        </div>

        <div className="p-4 rounded-xl bg-success/10 border border-success/30">
          <p className="text-2xl font-heading font-bold text-success">
            {formatCurrency(stats.wonValue)}
          </p>
          <p className="text-sm text-muted-foreground">Won Value</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search deals..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {isAdmin && (
          <Select value={branchFilter} onValueChange={setBranchFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Branch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Branches</SelectItem>
              {branches.map((branch) => (
                <SelectItem
                  key={branch.branchId || branch.id}
                  value={branch.branchId || branch.id}
                >
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Button variant="outline" onClick={fetchData}>
          Refresh
        </Button>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Loading deals...</p>}
      {branchesLoading && <p className="text-sm text-muted-foreground">Loading branches...</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-8 gap-4 overflow-x-auto">
        {DEAL_STAGES.map((stage) => (
          <div
            key={stage}
            className="rounded-xl bg-muted/30 border border-border p-3 min-h-[300px]"
          >
            <div className="flex items-center justify-between mb-3">
              <Badge className={stageColors[stage]}>{stage}</Badge>
              <span className="text-sm text-muted-foreground">
                {dealsByStage[stage].length}
              </span>
            </div>

            <div className="space-y-3">
              {dealsByStage[stage].map((deal) => {
                const dealId = getDealId(deal);
                const stageIndex = DEAL_STAGES.indexOf(deal.stage);

                return (
                  <motion.div
                    key={dealId}
                    layout
                    className="rounded-lg bg-card border border-border p-3 shadow-card hover:shadow-card-hover transition-all cursor-pointer"
                    onClick={() => setSelectedDeal(deal)}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-medium text-sm line-clamp-2">
                        {deal.title}
                      </h3>

                      {deal.stage === "Won" && (
                        <Trophy className="w-4 h-4 text-success" />
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground mb-2">
                      {deal.customerName}
                    </p>

                    <div className="space-y-1 text-xs text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {deal.contactNumber || "No phone"}
                      </div>

                      <div className="flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        {branchName(deal.branchId)}
                      </div>

                      <div className="flex items-center gap-1">
                        <IndianRupee className="w-3 h-3" />
                        {formatCurrency(deal.dealValue)}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        {deal.probability || 0}%
                      </Badge>

                      <p className="text-xs text-muted-foreground">
                        {employeeName(deal.assignedTo)}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2"
                        disabled={stageIndex === 0}
                        onClick={(e) => {
                          e.stopPropagation();
                          moveStage(deal, -1);
                        }}
                      >
                        <ChevronLeft className="w-3 h-3" />
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2"
                        disabled={stageIndex === DEAL_STAGES.length - 1}
                        onClick={(e) => {
                          e.stopPropagation();
                          moveStage(deal, 1);
                        }}
                      >
                        <ChevronRight className="w-3 h-3" />
                      </Button>
                    </div>
                  </motion.div>
                );
              })}

              {dealsByStage[stage].length === 0 && (
                <p className="text-xs text-center text-muted-foreground py-6">
                  No deals
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={showAdd && canAddDeal} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Add New Deal</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Select value={newDeal.leadId} onValueChange={handleLeadSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Select Lead *" />
              </SelectTrigger>
              <SelectContent>
                {leads.map((lead: any) => {
                  const id = lead._id || lead.id;
                  const name =
                    lead.name ||
                    lead.customerName ||
                    lead.clientName ||
                    "Unnamed Lead";

                  return (
                    <SelectItem key={id} value={id}>
                      {name} - {lead.contactNumber || lead.phone || "No phone"}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            <Input
              placeholder="Deal Title *"
              value={newDeal.title}
              onChange={(e) =>
                setNewDeal({ ...newDeal, title: e.target.value })
              }
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                type="number"
                placeholder="Deal Value *"
                value={newDeal.dealValue}
                onChange={(e) =>
                  setNewDeal({
                    ...newDeal,
                    dealValue: Number(e.target.value),
                  })
                }
              />

              <Input
                type="number"
                placeholder="Probability %"
                value={newDeal.probability}
                onChange={(e) =>
                  setNewDeal({
                    ...newDeal,
                    probability: Number(e.target.value),
                  })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                type="date"
                value={newDeal.expectedCloseDate}
                onChange={(e) =>
                  setNewDeal({
                    ...newDeal,
                    expectedCloseDate: e.target.value,
                  })
                }
              />

              {isAdmin ? (
                <Select
                  value={newDeal.branchId}
                  onValueChange={(value) =>
                    setNewDeal({ ...newDeal, branchId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem
                        key={branch.branchId || branch.id}
                        value={branch.branchId || branch.id}
                      >
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={branchName(currentUser?.branchId || newDeal.branchId)}
                  disabled
                />
              )}
            </div>

            <Select
              value={newDeal.assignedTo}
              onValueChange={(value) =>
                setNewDeal({ ...newDeal, assignedTo: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Assign User" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp: any) => {
                  const id = emp._id || emp.id;
                  const name =
                    emp.name || emp.fullName || emp.username || emp.email;

                  return (
                    <SelectItem key={id} value={id}>
                      {name} ({emp.role || emp.department || "User"})
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            <Textarea
              placeholder="Notes"
              value={newDeal.notes}
              onChange={(e) =>
                setNewDeal({ ...newDeal, notes: e.target.value })
              }
            />

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowAdd(false)}
              >
                Cancel
              </Button>

              <Button
                variant="gradient"
                className="flex-1"
                onClick={handleAddDeal}
              >
                Save Deal
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!selectedDeal}
        onOpenChange={(open) => !open && setSelectedDeal(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedDeal && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedDeal.title}</DialogTitle>
              </DialogHeader>

              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-muted/40">
                    <p className="text-xs text-muted-foreground">Customer</p>
                    <p className="font-medium">{selectedDeal.customerName}</p>
                  </div>

                  <div className="p-3 rounded-lg bg-muted/40">
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="font-medium">
                      {selectedDeal.contactNumber || "No phone"}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-muted/40">
                    <p className="text-xs text-muted-foreground">Value</p>
                    <p className="font-medium">
                      {formatCurrency(selectedDeal.dealValue)}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-muted/40">
                    <p className="text-xs text-muted-foreground">Owner</p>
                    <p className="font-medium">
                      {employeeName(selectedDeal.assignedTo)}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-muted/40">
                    <p className="text-xs text-muted-foreground">Branch</p>
                    <p className="font-medium">
                      {branchName(selectedDeal.branchId)}
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-muted/40">
                    <p className="text-xs text-muted-foreground">
                      Expected Close
                    </p>
                    <p className="font-medium">
                      {selectedDeal.expectedCloseDate
                        ? new Date(
                          selectedDeal.expectedCloseDate
                        ).toLocaleDateString("en-IN")
                        : "No date"}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold mb-2">Stage</p>
                  <div className="flex flex-wrap gap-2">
                    {DEAL_STAGES.map((stage) => (
                      <Button
                        key={stage}
                        size="sm"
                        variant={
                          selectedDeal.stage === stage ? "gradient" : "outline"
                        }
                        onClick={() => {
                          if (stage === "Lost") {
                            setLostDeal(selectedDeal);
                          } else {
                            updateDealStage(selectedDeal, stage);
                          }
                        }}
                      >
                        {stage}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold mb-2">Notes</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedDeal.notes || "No notes"}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-semibold mb-2">Add Call Log</p>

                  <Textarea
                    placeholder="Add call notes..."
                    value={callNote}
                    onChange={(e) => setCallNote(e.target.value)}
                  />

                  <Button
                    size="sm"
                    variant="gradient"
                    className="mt-2"
                    onClick={saveCallLog}
                  >
                    <MessageSquare className="w-3 h-3 mr-1" />
                    Save Call Log
                  </Button>
                </div>

                <div>
                  <p className="text-sm font-semibold mb-2">
                    Call Logs ({selectedDeal.callLogs?.length || 0})
                  </p>

                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedDeal.callLogs?.length ? (
                      [...selectedDeal.callLogs].reverse().map((log: any, i) => (
                        <div
                          key={log._id || i}
                          className="rounded-lg bg-muted/40 p-3 text-sm"
                        >
                          <p>{log.notes}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {log.date
                              ? new Date(log.date).toLocaleString("en-IN")
                              : ""}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No call logs yet
                      </p>
                    )}
                  </div>
                </div>

                <Button
                  variant="destructive"
                  onClick={() => deleteDeal(selectedDeal)}
                >
                  <X className="w-4 h-4 mr-2" />
                  Delete Deal
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!lostDeal} onOpenChange={(open) => !open && setLostDeal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Mark Deal as Lost</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Select reason for losing this deal.
            </p>

            <Select value={lostReason} onValueChange={setLostReason}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {lostReasons.map((reason) => (
                  <SelectItem key={reason} value={reason}>
                    {reason}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setLostDeal(null)}
              >
                Cancel
              </Button>

              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleConfirmLost}
              >
                Mark Lost
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}