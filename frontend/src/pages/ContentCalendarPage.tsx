import { useEffect, useState } from "react";
import {
  Calendar as CalendarIcon,
  Plus,
  RefreshCw,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Send,
  CalendarDays,
  List,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  getContentItems,
  createContentItem,
  submitContentForApproval,
  approveContentItem,
  requestContentRevision,
  scheduleContent,
  cancelContentSchedule,
} from "../api/contentItemApi";
import { getCustomers } from "../api/customerApi";

export default function ContentCalendarPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"month" | "list">("month");

  // Filters
  const [statusFilter, setStatusFilter] = useState("all");
  const [contentTypeFilter, setContentTypeFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Create Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCustomerId, setNewCustomerId] = useState("");
  const [newContentType, setNewContentType] = useState("Poster");
  const [newPlatforms, setNewPlatforms] = useState<string[]>(["Instagram", "Facebook"]);
  const [newCaption, setNewCaption] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Detail Modal & Schedule Modal
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [scheduleDate, setScheduleDate] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const [contentData, customerData] = await Promise.all([
        getContentItems(),
        getCustomers(),
      ]);
      setItems(contentData);
      setCustomers(customerData);
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to load content calendar", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateContent = async () => {
    if (!newTitle || !newCustomerId || !newContentType) {
      toast({ title: "Validation Error", description: "Title, Customer and Content Type are required", variant: "destructive" });
      return;
    }

    try {
      setSubmitting(true);
      await createContentItem({
        title: newTitle,
        customerId: newCustomerId,
        contentType: newContentType,
        platforms: newPlatforms,
        caption: newCaption,
      });

      toast({ title: "Success", description: "Content item created successfully" });
      setIsCreateOpen(false);
      setNewTitle("");
      setNewCaption("");
      fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to create content item", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitApproval = async (id: string) => {
    try {
      await submitContentForApproval(id);
      toast({ title: "Submitted", description: "Content submitted for manager approval" });
      fetchData();
      if (selectedItem?._id === id) setSelectedItem(null);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await approveContentItem(id);
      toast({ title: "Approved", description: "Content approved successfully" });
      fetchData();
      if (selectedItem?._id === id) setSelectedItem(null);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleSchedule = async (id: string) => {
    if (!scheduleDate) {
      toast({ title: "Error", description: "Please select a date and time to schedule", variant: "destructive" });
      return;
    }

    try {
      await scheduleContent(id, scheduleDate);
      toast({ title: "Scheduled", description: "Content item scheduled successfully!" });
      setScheduleDate("");
      fetchData();
      if (selectedItem?._id === id) setSelectedItem(null);
    } catch (err: any) {
      toast({ title: "Schedule Failed", description: err.message, variant: "destructive" });
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.customerId?.name || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
    const matchesType = contentTypeFilter === "all" || item.contentType === contentTypeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <CalendarIcon className="h-6 w-6 text-indigo-600" /> Content Calendar
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Plan, organize, review, and schedule client marketing content deliverables.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-lg flex items-center gap-1 border border-slate-200">
            <Button
              variant={viewMode === "month" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("month")}
              className="h-8"
            >
              <CalendarDays className="h-4 w-4 mr-1" /> Month
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="h-8"
            >
              <List className="h-4 w-4 mr-1" /> List
            </Button>
          </div>

          <Button onClick={fetchData} variant="outline" size="sm" className="gap-1">
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                <Plus className="h-4 w-4" /> Create Content
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <DialogHeader>
                <DialogTitle>Create Marketing Content</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700">Client Customer *</label>
                  <Select value={newCustomerId} onValueChange={setNewCustomerId}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select Client Customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((c) => (
                        <SelectItem key={c._id} value={c._id}>
                          {c.name} {c.companyName ? `(${c.companyName})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">Content Title *</label>
                  <Input
                    placeholder="e.g. Independence Day Promo Post"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Content Type</label>
                    <Select value={newContentType} onValueChange={setNewContentType}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {["Poster", "Carousel", "Reel", "Story", "Video", "GMB Post", "Blog", "Ad Creative", "Offer"].map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700">Caption / Copy Draft</label>
                  <Textarea
                    placeholder="Enter social post caption..."
                    value={newCaption}
                    onChange={(e) => setNewCaption(e.target.value)}
                    className="mt-1"
                    rows={4}
                  />
                </div>

                <Button onClick={handleCreateContent} disabled={submitting} className="w-full bg-indigo-600">
                  {submitting ? "Saving..." : "Save Content Draft"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search content by title or client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-slate-500" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Draft">Draft</SelectItem>
              <SelectItem value="Approval Pending">Approval Pending</SelectItem>
              <SelectItem value="Approved">Approved</SelectItem>
              <SelectItem value="Scheduled">Scheduled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-4">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading content calendar...</div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No content items found matching filters.</div>
        ) : viewMode === "list" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Title</th>
                  <th className="p-3">Client</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Platforms</th>
                  <th className="p-3">Approval</th>
                  <th className="p-3">Scheduled For</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/80">
                    <td className="p-3 font-semibold text-slate-900">{item.title}</td>
                    <td className="p-3 text-xs">{item.customerId?.name || "—"}</td>
                    <td className="p-3 text-xs"><Badge variant="outline">{item.contentType}</Badge></td>
                    <td className="p-3 text-xs">{(item.platforms || []).join(", ") || "—"}</td>
                    <td className="p-3 text-xs">
                      <Badge
                        className={
                          item.approvalStatus === "Approved"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : item.approvalStatus === "Pending Approval"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-slate-100 text-slate-600"
                        }
                      >
                        {item.approvalStatus}
                      </Badge>
                    </td>
                    <td className="p-3 text-xs text-slate-500">
                      {item.scheduledFor ? new Date(item.scheduledFor).toLocaleString() : "Not Scheduled"}
                    </td>
                    <td className="p-3 text-right">
                      <Button size="sm" variant="outline" onClick={() => setSelectedItem(item)}>
                        Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => (
              <div
                key={item._id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:border-indigo-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <Badge variant="outline" className="bg-white">
                      {item.contentType}
                    </Badge>
                    <Badge
                      className={
                        item.approvalStatus === "Approved"
                          ? "bg-emerald-100 text-emerald-800"
                          : item.approvalStatus === "Pending Approval"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-slate-200 text-slate-700"
                      }
                    >
                      {item.approvalStatus}
                    </Badge>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base">{item.title}</h3>
                  <p className="text-xs text-indigo-600 font-medium mt-0.5">{item.customerId?.name}</p>

                  {item.caption && (
                    <p className="text-xs text-slate-600 mt-2 line-clamp-2 italic bg-white p-2 rounded border border-slate-100">
                      "{item.caption}"
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                  <span>{item.scheduledFor ? new Date(item.scheduledFor).toLocaleDateString() : "Draft"}</span>
                  <Button size="sm" variant="ghost" className="h-7 text-xs text-indigo-600" onClick={() => setSelectedItem(item)}>
                    View & Manage $\rightarrow$
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Item Detail Modal */}
      {selectedItem && (
        <Dialog open={Boolean(selectedItem)} onOpenChange={() => setSelectedItem(null)}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-600" /> {selectedItem.title}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2 text-sm text-slate-700">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div>
                  <span className="text-xs text-slate-500 block">Client Customer</span>
                  <span className="font-semibold">{selectedItem.customerId?.name || "—"}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Content Type</span>
                  <span className="font-semibold">{selectedItem.contentType}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Approval Status</span>
                  <Badge className="mt-0.5">{selectedItem.approvalStatus}</Badge>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Publish Status</span>
                  <Badge variant="outline" className="mt-0.5">{selectedItem.publishStatus}</Badge>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Caption / Copy</label>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-mono text-xs whitespace-pre-wrap">
                  {selectedItem.caption || "No caption written yet."}
                </div>
              </div>

              {selectedItem.approvalStatus === "Approved" && (
                <div className="space-y-2 p-3 bg-indigo-50/50 rounded-lg border border-indigo-100">
                  <label className="text-xs font-bold text-indigo-900 block">Schedule Publishing (Approval Verified ✓)</label>
                  <div className="flex gap-2">
                    <Input
                      type="datetime-local"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      className="bg-white"
                    />
                    <Button onClick={() => handleSchedule(selectedItem._id)} className="bg-indigo-600">
                      Schedule
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center pt-2">
                {selectedItem.approvalStatus === "Not Submitted" && (
                  <Button onClick={() => handleSubmitApproval(selectedItem._id)} className="bg-amber-600 hover:bg-amber-700">
                    Submit for Approval
                  </Button>
                )}

                {selectedItem.approvalStatus === "Pending Approval" && (
                  <Button onClick={() => handleApprove(selectedItem._id)} className="bg-emerald-600 hover:bg-emerald-700">
                    Approve Content
                  </Button>
                )}

                {selectedItem.status === "Scheduled" && (
                  <Button onClick={() => cancelContentSchedule(selectedItem._id)} variant="destructive">
                    Cancel Schedule
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
