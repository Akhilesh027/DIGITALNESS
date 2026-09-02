import React, { useState } from "react";
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  RefreshCw,
  X,
  Send,
  Layers,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import {
  submitCreativeEditRequest,
  approveAndCommitCanvaEdit,
  cancelCanvaEdit,
  CreativeEditRequestDTO,
} from "@/api/creativeEditApi";

interface CreativeCanvaEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  creativeAsset: any;
  onVersionCommitted?: (newAsset: any) => void;
}

export const CreativeCanvaEditorModal: React.FC<CreativeCanvaEditorModalProps> = ({
  isOpen,
  onClose,
  creativeAsset,
  onVersionCommitted,
}) => {
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [editRequest, setEditRequest] = useState<CreativeEditRequestDTO | null>(null);

  if (!isOpen || !creativeAsset) return null;

  const quickPrompts = [
    "Logo koncham bigger chey",
    "Change phone number to +91 9988776655",
    "Reduce main heading size",
    "Replace hero image",
  ];

  const handleSubmitFeedback = async () => {
    if (!feedback.trim()) {
      toast.error("Please enter design feedback.");
      return;
    }

    setLoading(true);
    try {
      const res = await submitCreativeEditRequest(creativeAsset._id, feedback);
      if (res.success && res.editRequest) {
        setEditRequest(res.editRequest);
        toast.success("Feedback interpreted & Canva draft preview generated!");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Failed to process edit request.");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveCommit = async () => {
    if (!editRequest) return;
    setCommitting(true);
    try {
      const res = await approveAndCommitCanvaEdit(editRequest._id);
      if (res.success) {
        toast.success(`Creative V${res.result.version} committed & published to Cloudinary!`);
        if (onVersionCommitted) onVersionCommitted(res.result.newAsset);
        onClose();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Failed to commit changes.");
    } finally {
      setCommitting(false);
    }
  };

  const handleCancelDraft = async () => {
    if (!editRequest) return;
    try {
      await cancelCanvaEdit(editRequest._id);
      toast.info("Canva draft discarded.");
      setEditRequest(null);
    } catch (err: any) {
      toast.error("Failed to cancel draft.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl text-slate-100">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-sm">
              C
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                Canva Creative Editor & Revision Studio
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800">
                  V{creativeAsset.version}
                </span>
              </h3>
              <p className="text-xs text-slate-400">{creativeAsset.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Natural Language Prompt Box */}
          <div className="space-y-2 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Natural Language Manager Feedback (English & Telugu)
            </label>
            <div className="flex gap-2">
              <textarea
                rows={2}
                placeholder="e.g., Logo koncham bigger chey, phone number change chey to +91 9876543210, heading size thagginchu..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={handleSubmitFeedback}
                disabled={loading}
                className="px-5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 transition disabled:opacity-50"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Apply
              </button>
            </div>

            {/* Quick Prompts Chips */}
            <div className="flex flex-wrap gap-1.5 pt-1 text-[11px]">
              <span className="text-slate-500 py-0.5">Quick Examples:</span>
              {quickPrompts.map((p) => (
                <button
                  key={p}
                  onClick={() => setFeedback(p)}
                  className="px-2 py-0.5 rounded-md bg-slate-800/80 hover:bg-slate-800 text-slate-300 transition"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Structured Interpretation Breakdown */}
          {editRequest && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Supported Ops */}
              <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-800/60 space-y-2">
                <p className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Supported Canva Operations ({editRequest.interpretedOperations.length})
                </p>
                {editRequest.interpretedOperations.length === 0 ? (
                  <p className="text-xs text-slate-500">No supported operations detected in prompt.</p>
                ) : (
                  <ul className="text-xs text-slate-300 space-y-1">
                    {editRequest.interpretedOperations.map((op, idx) => (
                      <li key={idx} className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span className="font-semibold text-emerald-300">{op.intent}</span> on{" "}
                        <span className="text-slate-200">{op.targetRole}</span>
                        {op.managerProvidedValue && ` ("${op.managerProvidedValue}")`}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Unsupported Ops */}
              <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/60 space-y-2">
                <p className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" /> Unsupported Canva Operations ({editRequest.unsupportedOperations.length})
                </p>
                {editRequest.unsupportedOperations.length === 0 ? (
                  <p className="text-xs text-slate-500">All requested operations are safely supported.</p>
                ) : (
                  <ul className="text-xs text-slate-300 space-y-1.5">
                    {editRequest.unsupportedOperations.map((unop, idx) => (
                      <li key={idx} className="space-y-0.5">
                        <div className="font-semibold text-amber-300">{unop.reasonCode}</div>
                        <div className="text-slate-400 text-[11px]">{unop.explanation}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* Visual Before vs After Preview */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Visual Revision Preview (Before vs Canva Draft)
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Before */}
              <div className="space-y-1.5 text-center">
                <span className="text-xs font-semibold text-slate-400">Current Creative (V{creativeAsset.version})</span>
                <div className="aspect-square bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
                  <img
                    src={editRequest?.previewReference?.beforePreviewUrl || creativeAsset.assetUrl}
                    alt="Before Creative"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              {/* After Draft */}
              <div className="space-y-1.5 text-center">
                <span className="text-xs font-semibold text-indigo-400 flex items-center justify-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" /> Canva Draft (Candidate V{creativeAsset.version + 1})
                </span>
                <div className="aspect-square bg-slate-950 rounded-xl overflow-hidden border-2 border-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-950/50">
                  {editRequest?.previewReference?.afterPreviewUrl ? (
                    <img
                      src={editRequest.previewReference.afterPreviewUrl}
                      alt="After Creative Draft"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="p-6 text-center text-slate-500 text-xs">
                      Submit feedback above to generate a live Canva draft preview.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/60">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            Close
          </button>

          {editRequest && (
            <div className="flex gap-2">
              <button
                onClick={handleCancelDraft}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
              >
                Discard Draft
              </button>
              <button
                onClick={handleApproveCommit}
                disabled={committing || editRequest.interpretedOperations.length === 0}
                className="px-5 py-2 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
              >
                {committing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                Approve & Save Canva Changes (V{creativeAsset.version + 1})
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
