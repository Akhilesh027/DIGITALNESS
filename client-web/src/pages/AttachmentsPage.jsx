import React, { useState, useEffect, useCallback } from "react";
import {
  Paperclip,
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Download,
  Trash2,
  File,
  Sparkles,
  ExternalLink,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL, getAuthHeaders, extractCustomerId, getMediaUrl } from "../config/api";
import { MOCK_ATTACHMENTS } from "../data/mockData";

const CATEGORIES = [
  "Brand Assets & Logos",
  "Product Photos & Catalogue",
  "Website Content & Copy",
  "Brochures & Presentations (PDF)",
  "Social Media Creatives",
  "Project Requirement Document",
  "Other",
];

export default function AttachmentsPage() {
  const { client, customer } = useAuth();
  const [attachments, setAttachments] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileTitle, setFileTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const customerId = extractCustomerId(client, customer);

  const formatFileSize = (bytes) => {
    if (!bytes || isNaN(bytes)) return "File";
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(1)} MB`;
    const kb = bytes / 1024;
    return `${kb.toFixed(0)} KB`;
  };

  const formatDate = (d) => {
    if (!d) return "-";
    return new Date(d).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const fetchAttachments = useCallback(async () => {
    if (!customerId) {
      setAttachments(MOCK_ATTACHMENTS);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const headers = getAuthHeaders();
      const urls = [
        `${API_BASE_URL}/client-attachments/${customerId}`,
        `${API_BASE_URL}/client-attachments?customerId=${customerId}`,
      ];

      let found = [];
      for (const url of urls) {
        try {
          const res = await fetch(url, { headers });
          if (res.ok) {
            const data = await res.json();
            const list = Array.isArray(data)
              ? data
              : Array.isArray(data.attachments)
              ? data.attachments
              : Array.isArray(data.data)
              ? data.data
              : [];
            if (list.length > 0) {
              found = list;
              break;
            }
          }
        } catch {
          // continue to next url
        }
      }

      if (found.length > 0) {
        setAttachments(found);
      } else {
        // If no server attachments yet, keep mock as preview or empty
        setAttachments([]);
      }
    } catch (err) {
      console.warn("Failed to fetch attachments:", err.message);
      setAttachments(MOCK_ATTACHMENTS);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchAttachments();
  }, [fetchAttachments]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAttachments();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!fileTitle) {
        setFileTitle(file.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMsg("Please select a file to upload.");
      return;
    }

    setErrorMsg("");
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("customerId", customerId || "");
      formData.append("title", fileTitle || selectedFile.name);
      formData.append("category", selectedCategory);
      formData.append("notes", notes);
      formData.append("file", selectedFile);

      const res = await fetch(`${API_BASE_URL}/client-attachments`, {
        method: "POST",
        headers: getAuthHeaders(true),
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to upload file");
      }

      setUploadSuccess(true);
      setSelectedFile(null);
      setFileTitle("");
      setNotes("");

      // Add to list or re-fetch
      if (data.attachment) {
        setAttachments((prev) => [data.attachment, ...prev]);
      } else {
        fetchAttachments();
      }

      setTimeout(() => setUploadSuccess(false), 4000);
    } catch (err) {
      setErrorMsg(err.message || "Upload failed. Please check connection.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (attId) => {
    if (!window.confirm("Are you sure you want to remove this attachment?")) return;

    try {
      const res = await fetch(`${API_BASE_URL}/client-attachments/${attId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (res.ok) {
        setAttachments((prev) => prev.filter((a) => a._id !== attId));
      } else {
        const data = await res.json();
        alert(data.message || "Failed to delete attachment");
      }
    } catch (err) {
      alert("Error deleting file: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-3 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Brand Assets & Files Vault</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-2">
              Project Attachments & Deliverables
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed mt-1">
              Upload your high-res company logos, brand guidelines, product photography,
              content copy, and campaign briefs. All files are securely stored and synced live with the agency team.
            </p>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="self-start sm:self-center inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-xs transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>Refresh Vault</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Upload Form (Left Column) */}
        <div className="lg:col-span-5">
          <div className="glass-card rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-brand-400" />
              <h3 className="text-base font-extrabold text-white">Upload New Asset</h3>
            </div>

            {uploadSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>File uploaded successfully to Digitalness desk!</span>
              </div>
            )}

            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Asset Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-brand-400"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  File Title / Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Master Vector Logo Pack 2026"
                  value={fileTitle}
                  onChange={(e) => setFileTitle(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-brand-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Notes / Instructions (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Use dark theme variant for header"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-brand-400"
                />
              </div>

              {/* Drag/drop input */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Select File
                </label>
                <label className="border-2 border-dashed border-slate-800 hover:border-brand-500/50 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer bg-slate-900/60 transition group">
                  <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-brand-400 transition" />
                  <span className="text-xs font-semibold text-slate-300 group-hover:text-white truncate max-w-[240px]">
                    {selectedFile ? selectedFile.name : "Click to browse files"}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    PNG, JPG, SVG, PDF, ZIP, DOCX up to 20MB
                  </span>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={uploading || !selectedFile}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-brand-500 to-amber-500 hover:from-brand-600 text-slate-950 font-black text-xs shadow-glow transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" />
                    <span>Upload to Agency Desk</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Uploaded Files Table / List (Right Column) */}
        <div className="lg:col-span-7">
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-white">Project Assets Vault</h3>
              <span className="text-xs text-slate-400 font-semibold">{attachments.length} Files</span>
            </div>

            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
                <div className="w-6 h-6 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs">Loading vault assets...</span>
              </div>
            ) : attachments.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-slate-900/50 border border-slate-800 text-slate-400 space-y-2">
                <FileText className="w-8 h-8 text-slate-500 mx-auto" />
                <p className="text-sm font-semibold text-slate-300">No attachments uploaded yet</p>
                <p className="text-xs text-slate-400">
                  Upload brand assets, logo files, or documents on the left to share with the team.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {attachments.map((file) => {
                  const downloadLink = getMediaUrl(file.fileUrl || file.downloadUrl);
                  const isLocalMock = !file.fileUrl && file._id?.startsWith?.("att-mock");

                  return (
                    <div
                      key={file._id}
                      className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800/80 flex items-center justify-between gap-3 hover:border-slate-700 transition"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-brand-400 shrink-0">
                          <File className="w-5 h-5" />
                        </div>
                        <div className="truncate">
                          <h4 className="text-xs font-bold text-white truncate">
                            {file.title || file.fileName}
                          </h4>
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                            <span className="text-brand-400 font-medium">{file.category || "Asset"}</span>
                            <span>•</span>
                            <span>{file.fileSize ? formatFileSize(file.fileSize) : "Document"}</span>
                            <span>•</span>
                            <span>{formatDate(file.createdAt || file.uploadedAt)}</span>
                          </div>
                          {file.notes && (
                            <p className="text-[11px] text-slate-400 italic mt-0.5 truncate">
                              "{file.notes}"
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {downloadLink && !isLocalMock ? (
                          <a
                            href={downloadLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            download={file.fileName || file.title}
                            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition flex items-center gap-1.5 text-xs"
                            title="Download file"
                          >
                            <Download className="w-4 h-4" />
                            <span className="hidden sm:inline">Download</span>
                          </a>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-1 rounded bg-slate-800 text-slate-400">
                            Demo Asset
                          </span>
                        )}

                        {file._id && !isLocalMock && (
                          <button
                            onClick={() => handleDelete(file._id)}
                            className="p-2 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
                            title="Delete attachment"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
