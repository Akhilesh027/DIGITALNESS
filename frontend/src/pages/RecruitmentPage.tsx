// src/pages/RecruitmentPage.tsx
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Briefcase,
  Calendar,
  CheckCircle2,
  Eye,
  FileText,
  Mail,
  Phone,
  Plus,
  Search,
  Trash2,
  UploadCloud,
  UserRound,
  XCircle,
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

const getAuthConfig = () => {
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    localStorage.getItem("accessToken");

  return {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };
};

type JobStatus = "Open" | "Closed" | "On Hold";
type CandidateStatus =
  | "Applied"
  | "Under Review"
  | "Shortlisted"
  | "Interview Scheduled"
  | "Selected"
  | "Rejected";

const candidateStatuses: CandidateStatus[] = [
  "Applied",
  "Under Review",
  "Shortlisted",
  "Interview Scheduled",
  "Selected",
  "Rejected",
];

const emptyJob = {
  title: "",
  department: "",
  location: "",
  jobType: "Full Time",
  experience: "",
  openings: 1,
  salaryRange: "",
  description: "",
  requirements: "",
  status: "Open" as JobStatus,
};

const emptyCandidate = {
  jobId: "",
  name: "",
  email: "",
  phone: "",
  experience: "",
  currentCompany: "",
  expectedSalary: "",
  resumeUrl: "",
  portfolioUrl: "",
  status: "Applied" as CandidateStatus,
  interviewDate: "",
  hrNotes: "",
};

export default function RecruitmentPage() {
  const { toast } = useToast();

  const [jobs, setJobs] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [tab, setTab] = useState<"jobs" | "candidates" | "interviews">("jobs");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [showJobModal, setShowJobModal] = useState(false);
  const [showCandidateModal, setShowCandidateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  const [jobForm, setJobForm] = useState<any>(emptyJob);
  const [candidateForm, setCandidateForm] = useState<any>(emptyCandidate);
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [jobsRes, candidatesRes] = await Promise.all([
        axios.get(`${API_URL}/recruitment/jobs`, getAuthConfig()),
        axios.get(`${API_URL}/recruitment/candidates`, getAuthConfig()),
      ]);

      setJobs(jobsRes.data?.data || jobsRes.data || []);
      setCandidates(candidatesRes.data?.data || candidatesRes.data || []);
    } catch {
      toast({
        title: "Error",
        description: "Failed to fetch recruitment data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      const matchSearch =
        c.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.email?.toLowerCase().includes(search.toLowerCase()) ||
        c.phone?.toLowerCase().includes(search.toLowerCase());

      const matchStatus = statusFilter === "All" || c.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [candidates, search, statusFilter]);

  const interviews = candidates.filter(
    (c) => c.status === "Interview Scheduled"
  );

  const saveJob = async () => {
    if (!jobForm.title || !jobForm.department || !jobForm.description) {
      toast({
        title: "Missing Details",
        description: "Job title, department and description are required",
        variant: "destructive",
      });
      return;
    }

    try {
      if (jobForm._id) {
        await axios.put(
          `${API_URL}/recruitment/jobs/${jobForm._id}`,
          jobForm,
          getAuthConfig()
        );
      } else {
        await axios.post(`${API_URL}/recruitment/jobs`, jobForm, getAuthConfig());
      }

      toast({ title: "Saved", description: "Job saved successfully" });
      setShowJobModal(false);
      setJobForm(emptyJob);
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.response?.data?.message || "Failed to save job",
        variant: "destructive",
      });
    }
  };

  const saveCandidate = async () => {
    if (!candidateForm.name || !candidateForm.email || !candidateForm.phone) {
      toast({
        title: "Missing Details",
        description: "Name, email and phone are required",
        variant: "destructive",
      });
      return;
    }

    try {
      if (candidateForm._id) {
        await axios.put(
          `${API_URL}/recruitment/candidates/${candidateForm._id}`,
          candidateForm,
          getAuthConfig()
        );
      } else {
        await axios.post(
          `${API_URL}/recruitment/candidates`,
          candidateForm,
          getAuthConfig()
        );
      }

      toast({ title: "Saved", description: "Candidate saved successfully" });
      setShowCandidateModal(false);
      setCandidateForm(emptyCandidate);
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error?.response?.data?.message || "Failed to save candidate",
        variant: "destructive",
      });
    }
  };

  const updateCandidateStatus = async (id: string, status: CandidateStatus) => {
    try {
      await axios.patch(
        `${API_URL}/recruitment/candidates/${id}/status`,
        { status },
        getAuthConfig()
      );

      toast({ title: "Updated", description: `Candidate moved to ${status}` });
      fetchData();
    } catch {
      toast({
        title: "Error",
        description: "Failed to update candidate status",
        variant: "destructive",
      });
    }
  };

  const deleteJob = async (id: string) => {
    if (!confirm("Delete this job?")) return;
    await axios.delete(`${API_URL}/recruitment/jobs/${id}`, getAuthConfig());
    fetchData();
  };

  const deleteCandidate = async (id: string) => {
    if (!confirm("Delete this candidate?")) return;
    await axios.delete(
      `${API_URL}/recruitment/candidates/${id}`,
      getAuthConfig()
    );
    fetchData();
  };

  const handleResumeUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setCandidateForm((prev: any) => ({
        ...prev,
        resumeUrl: String(reader.result || ""),
      }));
    };
    reader.readAsDataURL(file);
  };

  const getJobTitle = (jobId: string) => {
    const job = jobs.find((j) => j._id === jobId || j.id === jobId);
    return job?.title || "General Application";
  };

  const stats = {
    jobs: jobs.length,
    candidates: candidates.length,
    interviews: candidates.filter((c) => c.status === "Interview Scheduled")
      .length,
    selected: candidates.filter((c) => c.status === "Selected").length,
  };

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Recruitment Management
          </h1>
          <p className="text-sm text-slate-500">
            Manage jobs, applications, resumes, interviews and HR notes.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={() => {
              setCandidateForm(emptyCandidate);
              setShowCandidateModal(true);
            }}
          >
            <UserRound className="mr-2 h-4 w-4" />
            Add Candidate
          </Button>

          <Button
            onClick={() => {
              setJobForm(emptyJob);
              setShowJobModal(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Job
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <Briefcase className="mb-2 h-5 w-5 text-slate-500" />
          <p className="text-2xl font-bold">{stats.jobs}</p>
          <p className="text-sm text-slate-500">Jobs</p>
        </div>

        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <UserRound className="mb-2 h-5 w-5 text-slate-500" />
          <p className="text-2xl font-bold">{stats.candidates}</p>
          <p className="text-sm text-slate-500">Candidates</p>
        </div>

        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <Calendar className="mb-2 h-5 w-5 text-slate-500" />
          <p className="text-2xl font-bold">{stats.interviews}</p>
          <p className="text-sm text-slate-500">Interviews</p>
        </div>

        <div className="rounded-2xl border bg-white p-4 shadow-sm">
          <CheckCircle2 className="mb-2 h-5 w-5 text-slate-500" />
          <p className="text-2xl font-bold">{stats.selected}</p>
          <p className="text-sm text-slate-500">Selected</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border bg-white p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="grid grid-cols-3 gap-2">
          {["jobs", "candidates", "interviews"].map((item) => (
            <Button
              key={item}
              variant={tab === item ? "default" : "outline"}
              onClick={() => setTab(item as any)}
            >
              {item === "jobs"
                ? "Jobs"
                : item === "candidates"
                  ? "Candidates"
                  : "Interviews"}
            </Button>
          ))}
        </div>

        {tab !== "jobs" && (
          <div className="flex flex-col gap-2 lg:flex-row">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                className="pl-10"
                placeholder="Search candidates..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-[210px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Status</SelectItem>
                {candidateStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {tab === "jobs" && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          {jobs.map((job) => (
            <div key={job._id} className="rounded-2xl border bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold">{job.title}</h3>
                  <p className="text-sm text-slate-500">{job.department}</p>
                </div>
                <Badge>{job.status}</Badge>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-slate-500">Location</p>
                  <p className="font-medium">{job.location || "-"}</p>
                </div>
                <div>
                  <p className="text-slate-500">Job Type</p>
                  <p className="font-medium">{job.jobType}</p>
                </div>
                <div>
                  <p className="text-slate-500">Experience</p>
                  <p className="font-medium">{job.experience || "-"}</p>
                </div>
                <div>
                  <p className="text-slate-500">Openings</p>
                  <p className="font-medium">{job.openings || 1}</p>
                </div>
              </div>

              <p className="mt-4 line-clamp-3 text-sm text-slate-600">
                {job.description}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => {
                  setJobForm(job);
                  setShowJobModal(true);
                }}>
                  Edit
                </Button>
                <Button size="sm" variant="destructive" onClick={() => deleteJob(job._id)}>
                  Delete
                </Button>
              </div>
            </div>
          ))}

          {!loading && jobs.length === 0 && (
            <div className="col-span-full rounded-2xl border bg-white p-8 text-center text-slate-500">
              No jobs created yet
            </div>
          )}
        </div>
      )}

      {tab === "candidates" && (
        <div className="rounded-2xl border bg-white shadow-sm overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-slate-50">
              <tr>
                <th className="p-4 text-left text-sm">Candidate</th>
                <th className="p-4 text-left text-sm">Job</th>
                <th className="p-4 text-left text-sm">Experience</th>
                <th className="p-4 text-left text-sm">Status</th>
                <th className="p-4 text-left text-sm">Interview</th>
                <th className="p-4 text-left text-sm">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredCandidates.map((candidate) => (
                <tr key={candidate._id}>
                  <td className="p-4">
                    <div className="font-medium">{candidate.name}</div>
                    <div className="text-xs text-slate-500">
                      {candidate.email} · {candidate.phone}
                    </div>
                  </td>
                  <td className="p-4 text-sm">{getJobTitle(candidate.jobId)}</td>
                  <td className="p-4 text-sm">{candidate.experience || "-"}</td>
                  <td className="p-4">
                    <Select
                      value={candidate.status}
                      onValueChange={(v: CandidateStatus) =>
                        updateCandidateStatus(candidate._id, v)
                      }
                    >
                      <SelectTrigger className="h-9 w-[190px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {candidateStatuses.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-4 text-sm">
                    {candidate.interviewDate
                      ? new Date(candidate.interviewDate).toLocaleString("en-IN")
                      : "-"}
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedCandidate(candidate);
                          setShowViewModal(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setCandidateForm(candidate);
                          setShowCandidateModal(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteCandidate(candidate._id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredCandidates.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    No candidates found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === "interviews" && (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          {interviews.map((candidate) => (
            <div key={candidate._id} className="rounded-2xl border bg-white p-5 shadow-sm">
              <Badge>Interview Scheduled</Badge>
              <h3 className="mt-3 text-lg font-semibold">{candidate.name}</h3>
              <p className="text-sm text-slate-500">{getJobTitle(candidate.jobId)}</p>

              <div className="mt-4 space-y-2 text-sm">
                <p>
                  <Mail className="mr-2 inline h-4 w-4" />
                  {candidate.email}
                </p>
                <p>
                  <Phone className="mr-2 inline h-4 w-4" />
                  {candidate.phone}
                </p>
                <p>
                  <Calendar className="mr-2 inline h-4 w-4" />
                  {candidate.interviewDate
                    ? new Date(candidate.interviewDate).toLocaleString("en-IN")
                    : "No date"}
                </p>
              </div>

              <div className="mt-4 flex gap-2">
                <Button
                  size="sm"
                  onClick={() => updateCandidateStatus(candidate._id, "Selected")}
                >
                  Select
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => updateCandidateStatus(candidate._id, "Rejected")}
                >
                  Reject
                </Button>
              </div>
            </div>
          ))}

          {interviews.length === 0 && (
            <div className="col-span-full rounded-2xl border bg-white p-8 text-center text-slate-500">
              No interviews scheduled
            </div>
          )}
        </div>
      )}

      <Dialog open={showJobModal} onOpenChange={setShowJobModal}>
        <DialogContent className="max-h-[92vh] w-[95vw] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{jobForm._id ? "Edit Job" : "Create Job"}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              placeholder="Job Title *"
              value={jobForm.title}
              onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
            />

            <Input
              placeholder="Department *"
              value={jobForm.department}
              onChange={(e) =>
                setJobForm({ ...jobForm, department: e.target.value })
              }
            />

            <Input
              placeholder="Location"
              value={jobForm.location}
              onChange={(e) =>
                setJobForm({ ...jobForm, location: e.target.value })
              }
            />

            <Select
              value={jobForm.jobType}
              onValueChange={(v) => setJobForm({ ...jobForm, jobType: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Full Time">Full Time</SelectItem>
                <SelectItem value="Part Time">Part Time</SelectItem>
                <SelectItem value="Internship">Internship</SelectItem>
                <SelectItem value="Contract">Contract</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="Experience"
              value={jobForm.experience}
              onChange={(e) =>
                setJobForm({ ...jobForm, experience: e.target.value })
              }
            />

            <Input
              type="number"
              placeholder="Openings"
              value={jobForm.openings}
              onChange={(e) =>
                setJobForm({ ...jobForm, openings: Number(e.target.value || 1) })
              }
            />

            <Input
              placeholder="Salary Range"
              value={jobForm.salaryRange}
              onChange={(e) =>
                setJobForm({ ...jobForm, salaryRange: e.target.value })
              }
            />

            <Select
              value={jobForm.status}
              onValueChange={(v: JobStatus) => setJobForm({ ...jobForm, status: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Open">Open</SelectItem>
                <SelectItem value="Closed">Closed</SelectItem>
                <SelectItem value="On Hold">On Hold</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Textarea
            placeholder="Job Description *"
            value={jobForm.description}
            onChange={(e) =>
              setJobForm({ ...jobForm, description: e.target.value })
            }
          />

          <Textarea
            placeholder="Requirements / Skills"
            value={jobForm.requirements}
            onChange={(e) =>
              setJobForm({ ...jobForm, requirements: e.target.value })
            }
          />

          <Button onClick={saveJob}>Save Job</Button>
        </DialogContent>
      </Dialog>

      <Dialog open={showCandidateModal} onOpenChange={setShowCandidateModal}>
        <DialogContent className="max-h-[92vh] w-[95vw] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {candidateForm._id ? "Edit Candidate" : "Add Candidate"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Select
              value={candidateForm.jobId || "none"}
              onValueChange={(v) =>
                setCandidateForm({
                  ...candidateForm,
                  jobId: v === "none" ? "" : v,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Job" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">General Application</SelectItem>
                {jobs.map((job) => (
                  <SelectItem key={job._id} value={job._id}>
                    {job.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              placeholder="Candidate Name *"
              value={candidateForm.name}
              onChange={(e) =>
                setCandidateForm({ ...candidateForm, name: e.target.value })
              }
            />

            <Input
              placeholder="Email *"
              value={candidateForm.email}
              onChange={(e) =>
                setCandidateForm({ ...candidateForm, email: e.target.value })
              }
            />

            <Input
              placeholder="Phone *"
              value={candidateForm.phone}
              onChange={(e) =>
                setCandidateForm({ ...candidateForm, phone: e.target.value })
              }
            />

            <Input
              placeholder="Experience"
              value={candidateForm.experience}
              onChange={(e) =>
                setCandidateForm({
                  ...candidateForm,
                  experience: e.target.value,
                })
              }
            />

            <Input
              placeholder="Current Company"
              value={candidateForm.currentCompany}
              onChange={(e) =>
                setCandidateForm({
                  ...candidateForm,
                  currentCompany: e.target.value,
                })
              }
            />

            <Input
              placeholder="Expected Salary"
              value={candidateForm.expectedSalary}
              onChange={(e) =>
                setCandidateForm({
                  ...candidateForm,
                  expectedSalary: e.target.value,
                })
              }
            />

            <Select
              value={candidateForm.status}
              onValueChange={(v: CandidateStatus) =>
                setCandidateForm({ ...candidateForm, status: v })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {candidateStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="datetime-local"
              value={candidateForm.interviewDate}
              onChange={(e) =>
                setCandidateForm({
                  ...candidateForm,
                  interviewDate: e.target.value,
                })
              }
            />

            <Input
              placeholder="Portfolio URL"
              value={candidateForm.portfolioUrl}
              onChange={(e) =>
                setCandidateForm({
                  ...candidateForm,
                  portfolioUrl: e.target.value,
                })
              }
            />

            <Input
              placeholder="Resume URL"
              value={
                candidateForm.resumeUrl?.startsWith("data:")
                  ? "Resume uploaded"
                  : candidateForm.resumeUrl
              }
              disabled={candidateForm.resumeUrl?.startsWith("data:")}
              onChange={(e) =>
                setCandidateForm({
                  ...candidateForm,
                  resumeUrl: e.target.value,
                })
              }
            />

            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed p-3 text-sm text-slate-500">
              <UploadCloud className="h-4 w-4" />
              Upload Resume
              <input
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleResumeUpload(file);
                }}
              />
            </label>
          </div>

          <Textarea
            placeholder="HR Notes"
            value={candidateForm.hrNotes}
            onChange={(e) =>
              setCandidateForm({ ...candidateForm, hrNotes: e.target.value })
            }
          />

          <Button onClick={saveCandidate}>Save Candidate</Button>
        </DialogContent>
      </Dialog>

      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent className="max-h-[92vh] w-[95vw] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Candidate Details</DialogTitle>
          </DialogHeader>

          {selectedCandidate && (
            <div className="space-y-5">
              <div className="rounded-2xl border bg-slate-50 p-5">
                <h2 className="text-xl font-bold">{selectedCandidate.name}</h2>
                <p className="text-sm text-slate-500">
                  {getJobTitle(selectedCandidate.jobId)}
                </p>
                <Badge className="mt-3">{selectedCandidate.status}</Badge>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Info label="Email" value={selectedCandidate.email} />
                <Info label="Phone" value={selectedCandidate.phone} />
                <Info label="Experience" value={selectedCandidate.experience} />
                <Info
                  label="Current Company"
                  value={selectedCandidate.currentCompany}
                />
                <Info
                  label="Expected Salary"
                  value={selectedCandidate.expectedSalary}
                />
                <Info
                  label="Interview"
                  value={
                    selectedCandidate.interviewDate
                      ? new Date(selectedCandidate.interviewDate).toLocaleString(
                        "en-IN"
                      )
                      : "-"
                  }
                />
              </div>

              <div className="rounded-2xl border p-4">
                <h3 className="font-semibold">HR Notes</h3>
                <p className="mt-2 whitespace-pre-line text-sm text-slate-600">
                  {selectedCandidate.hrNotes || "No notes added"}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {selectedCandidate.resumeUrl && (
                  <Button
                    variant="outline"
                    onClick={() => window.open(selectedCandidate.resumeUrl, "_blank")}
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    View Resume
                  </Button>
                )}

                {selectedCandidate.portfolioUrl && (
                  <Button
                    variant="outline"
                    onClick={() =>
                      window.open(selectedCandidate.portfolioUrl, "_blank")
                    }
                  >
                    Portfolio
                  </Button>
                )}

                <Button
                  onClick={() =>
                    updateCandidateStatus(selectedCandidate._id, "Selected")
                  }
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Select
                </Button>

                <Button
                  variant="destructive"
                  onClick={() =>
                    updateCandidateStatus(selectedCandidate._id, "Rejected")
                  }
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Info({ label, value }: { label: string; value?: any }) {
  return (
    <div className="rounded-xl border bg-white p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="font-medium">{value || "-"}</p>
    </div>
  );
}