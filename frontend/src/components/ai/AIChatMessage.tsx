import React, { useState } from "react";
import { Sparkles, User, AlertCircle, Copy, Check } from "lucide-react";
import { WorkspaceMessage, WorkspaceUIBlock } from "@/types/workspaceChat";
import { ClientEntityPicker } from "./entity/ClientEntityPicker";
import { IntakeQuestion } from "./intake/IntakeQuestion";
import { ExecutionBlueprint } from "./execution/ExecutionBlueprint";
import { GeneratedCreativeCard } from "./creative/GeneratedCreativeCard";
import { ReadResultRenderer } from "./ReadResultRenderer";
import { UniversalCreativeBriefCard } from "./creative/UniversalCreativeBriefCard";
import { UniversalPosterQAPreviewCard } from "./creative/UniversalPosterQAPreviewCard";
import { UniversalDeliveryScheduleCard } from "./creative/UniversalDeliveryScheduleCard";
import { Button } from "@/components/ui/button";

interface AIChatMessageProps {
  message: WorkspaceMessage;
  onSelectEntity?: (candidateId: string) => void;
  onSubmitIntake?: (field: string, value: any, isSkip?: boolean) => void;
  onApproveBlueprint?: (decision: "approve") => void;
  onRejectBlueprint?: (decision: "reject") => void;
  onCreativeRevision?: (instruction: string, creativeRunId: string) => void;
  onCreativeSchedule?: (creativeRunId: string, details?: any) => void;
  onSendMessage?: (text: string) => void;
  loading?: boolean;
}

export const AIChatMessage: React.FC<AIChatMessageProps> = ({
  message,
  onSelectEntity,
  onSubmitIntake,
  onApproveBlueprint,
  onRejectBlueprint,
  onCreativeRevision,
  onCreativeSchedule,
  onSendMessage,
  loading = false,
}) => {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  const handleCopy = async () => {
    if (!message.text) return;
    try {
      await navigator.clipboard.writeText(message.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  if (isUser) {
    return (
      <div className="flex justify-end my-3.5 animate-in fade-in slide-in-from-bottom-2 duration-300 select-text group">
        <div className="flex items-start gap-2.5 max-w-[85%] sm:max-w-[75%]">
          <div className="relative bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 text-white rounded-2xl rounded-tr-xs px-4 py-2.5 shadow-md shadow-indigo-600/20 text-xs sm:text-[13px] font-medium leading-relaxed border border-indigo-400/20 select-text">
            {message.text}
            <button
              onClick={handleCopy}
              className="absolute -left-7 top-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-400 hover:text-white"
              title="Copy message"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" focusable="false" />
              ) : (
                <Copy className="w-3.5 h-3.5" aria-hidden="true" focusable="false" />
              )}
            </button>
          </div>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-200 text-indigo-700 flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5 shadow-xs border border-indigo-200/80">
            <User className="w-4 h-4" aria-hidden="true" focusable="false" />
          </div>
        </div>
      </div>
    );
  }

  // Assistant Message
  return (
    <div className="flex justify-start my-3.5 animate-in fade-in slide-in-from-bottom-2 duration-300 select-text group">
      <div className="flex items-start gap-3 max-w-[96%] sm:max-w-[90%] w-full">
        {/* AVATAR WITH GLOWING ACCENT */}
        <div className="relative flex-shrink-0 mt-0.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 via-purple-600 to-slate-900 text-white flex items-center justify-center shadow-lg shadow-indigo-600/25 border border-indigo-400/30">
            <Sparkles className="w-4 h-4 text-indigo-200 animate-pulse" aria-hidden="true" focusable="false" />
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-slate-900" />
        </div>

        <div className="flex-1 space-y-2.5 min-w-0">
          {/* AGENT ORCHESTRATION HEADER */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-extrabold text-slate-300 tracking-tight flex items-center gap-1">
                Parent AI Orchestrator
              </span>
              <span className="text-[9px] px-1.5 py-0.2 bg-indigo-950/60 text-indigo-300 rounded-full font-bold border border-indigo-500/30 font-mono">
                OS v3.2 • Verified
              </span>
            </div>

            {/* ONE-CLICK COPY BUTTON */}
            {message.text && (
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-indigo-300 transition-colors px-2 py-0.5 rounded-md hover:bg-slate-800 border border-transparent hover:border-slate-700 opacity-80 group-hover:opacity-100"
                title="Copy response text"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" focusable="false" />
                    <span className="text-emerald-400 font-bold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" focusable="false" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* ASSISTANT TEXT NARRATIVE */}
          {message.text && (
            <div className="bg-slate-900/90 text-slate-100 rounded-2xl rounded-tl-xs px-4.5 py-3.5 border border-slate-800 shadow-xl shadow-slate-950/20 text-xs sm:text-[13px] leading-relaxed whitespace-pre-line relative overflow-hidden select-text">
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-indigo-500/60 via-purple-500/40 to-transparent" />
              {message.text.split("\n").map((line, lIdx) => {
                // Parse **bold** markdown
                const parts = line.split(/(\*\*.*?\*\*)/g);
                return (
                  <div key={lIdx} className={lIdx > 0 ? "mt-1.5" : ""}>
                    {parts.map((part, pIdx) => {
                      if (part.startsWith("**") && part.endsWith("**")) {
                        return (
                          <strong key={pIdx} className="font-bold text-indigo-300">
                            {part.slice(2, -2)}
                          </strong>
                        );
                      }
                      return <span key={pIdx}>{part}</span>;
                    })}
                  </div>
                );
              })}
            </div>
          )}

          {/* STRUCTURED UI BLOCKS */}
          {message.uiBlocks &&
            message.uiBlocks.map((block: WorkspaceUIBlock, idx: number) => {
              switch (block.type) {
                case "entity_picker":
                  return (
                    <ClientEntityPicker
                      key={idx}
                      block={block}
                      onSelect={(id) => onSelectEntity && onSelectEntity(id)}
                      disabled={loading}
                    />
                  );

                case "intake_question":
                  return (
                    <IntakeQuestion
                      key={idx}
                      block={block}
                      onSubmitAnswer={(field, val, isSkip) =>
                        onSubmitIntake && onSubmitIntake(field, val, isSkip)
                      }
                      disabled={loading}
                    />
                  );

                case "execution_blueprint":
                  return (
                    <ExecutionBlueprint
                      key={idx}
                      block={block}
                      onApprove={(d) => onApproveBlueprint && onApproveBlueprint(d)}
                      onReject={(d) => onRejectBlueprint && onRejectBlueprint(d)}
                      disabled={loading}
                    />
                  );

                case "generated_asset":
                  return (
                    <GeneratedCreativeCard
                      key={idx}
                      block={block}
                      onRevision={(inst, runId) =>
                        onCreativeRevision && onCreativeRevision(inst, runId)
                      }
                      onSchedule={(runId, details) =>
                        onCreativeSchedule && onCreativeSchedule(runId, details)
                      }
                      disabled={loading}
                    />
                  );

                case "morning_briefing":
                  return (
                    <div key={idx} className="mt-3 p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm">
                      <ReadResultRenderer
                        command="briefing.getMorningBrief"
                        result={block.briefingData}
                        onSendMessage={onSendMessage}
                      />
                    </div>
                  );

                case "decision_inbox":
                  return (
                    <div key={idx} className="mt-3 p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm">
                      <ReadResultRenderer
                        command="decision.getInbox"
                        result={block}
                        onSendMessage={onSendMessage}
                      />
                    </div>
                  );

                case "sla_alerts":
                  return (
                    <div key={idx} className="mt-3 p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm">
                      <ReadResultRenderer
                        command="sla.getCritical"
                        result={block.slaData}
                        onSendMessage={onSendMessage}
                      />
                    </div>
                  );

                case "execution_result":
                  return (
                    <div key={idx} className="mt-3 p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm">
                      <ReadResultRenderer
                        command={block.command}
                        result={block.result}
                        onSendMessage={onSendMessage}
                      />
                    </div>
                  );

                case "error_card":
                  return (
                    <div key={idx} className="mt-3 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                        <span>{block.errorMessage}</span>
                      </div>
                      {block.canRetry && (
                        <Button size="sm" variant="outline" className="h-7 text-xs border-rose-300">
                          Retry
                        </Button>
                      )}
                    </div>
                  );

                case "creative_brief":
                  return (
                    <UniversalCreativeBriefCard
                      key={idx}
                      block={block}
                      onApprove={() => {
                        if (onSendMessage) {
                          onSendMessage("Approved. Proceed with the prepared brief.");
                        } else if (onApproveBlueprint) {
                          onApproveBlueprint("approve");
                        }
                      }}
                      onRequestChange={() => {
                        if (onSendMessage) {
                          onSendMessage("Edit / Request Change for this poster brief.");
                        }
                      }}
                      onAnotherDirection={() => {
                        if (onSendMessage) {
                          onSendMessage("Generate another creative direction for this poster.");
                        }
                      }}
                      onCancel={() => {
                        if (onSendMessage) {
                          onSendMessage("Cancel this poster generation workflow.");
                        } else if (onRejectBlueprint) {
                          onRejectBlueprint("reject");
                        }
                      }}
                      disabled={loading}
                    />
                  );

                case "poster_preview_qa":
                  return (
                    <UniversalPosterQAPreviewCard
                      key={idx}
                      block={block}
                      onFinalApprove={() => {
                        if (onSendMessage) {
                          onSendMessage("Final approved.");
                        } else if (onCreativeSchedule) {
                          onCreativeSchedule(block.creativeRunId);
                        }
                      }}
                      onRequestRevision={() => {
                        if (onSendMessage) {
                          onSendMessage("Request revision: Adjust lighting and make website URL more prominent.");
                        } else if (onCreativeRevision) {
                          onCreativeRevision("Adjust lighting and make website URL more prominent", block.creativeRunId);
                        }
                      }}
                      onRunAnother={() => {
                        if (onSendMessage) {
                          onSendMessage("Run another creative workflow.");
                        }
                      }}
                      disabled={loading}
                    />
                  );

                case "delivery_schedule":
                  return (
                    <UniversalDeliveryScheduleCard
                      key={idx}
                      block={block}
                      onPublishNow={() => {
                        if (onSendMessage) {
                          onSendMessage("Publish Now");
                        }
                      }}
                      onScheduleSlot={(slot) => {
                        if (onSendMessage) {
                          onSendMessage(`Schedule for ${slot}`);
                        }
                      }}
                      onSaveDraft={() => {
                        if (onSendMessage) {
                          onSendMessage("Save as Approved Draft");
                        }
                      }}
                      disabled={loading}
                    />
                  );

                default:
                  return null;
              }
            })}
        </div>
      </div>
    </div>
  );
};
