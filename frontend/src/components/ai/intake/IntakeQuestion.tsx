import React, { useState, useRef } from "react";
import { ArrowRight, HelpCircle, SkipForward, Upload, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IntakeQuestionBlock } from "@/types/workspaceChat";

interface IntakeQuestionProps {
  block: IntakeQuestionBlock;
  onSubmitAnswer: (field: string, value: any, isSkip?: boolean) => void;
  disabled?: boolean;
}

export const IntakeQuestion: React.FC<IntakeQuestionProps> = ({
  block,
  onSubmitAnswer,
  disabled = false,
}) => {
  const [val, setVal] = useState("");
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalVal = uploadedFile?.name || selectedOption || val.trim();
    if (!finalVal) return;
    onSubmitAnswer(block.field, finalVal, false);
    setVal("");
    setSelectedOption("");
    setUploadedFile(null);
  };

  const handleOptionPick = (option: string) => {
    if (disabled) return;
    setSelectedOption(option);
    onSubmitAnswer(block.field, option, false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const sizeStr =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;
    setUploadedFile({ name: file.name, size: sizeStr });
    setVal(file.name);
  };

  const triggerFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const fieldName = (block?.field || "").toLowerCase();
  const isFileField =
    fieldName === "filename" ||
    fieldName.includes("file") ||
    fieldName.includes("doc");

  const hasOptions = block.options && block.options.length > 0;

  return (
    <div className="mt-3 p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-3.5 animate-in fade-in duration-200">
      {/* HEADER BADGE & PROGRESS */}
      <div className="flex items-center justify-between text-xs font-semibold">
        <span className="flex items-center gap-1.5 text-indigo-600 font-bold tracking-tight">
          <HelpCircle className="w-3.5 h-3.5" /> Required Information
        </span>
        {block.remainingFieldsCount !== undefined && (
          <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2.5 py-0.5 rounded-full border border-indigo-100">
            {block.remainingFieldsCount} {block.remainingFieldsCount === 1 ? "field" : "fields"} remaining
          </span>
        )}
      </div>

      {/* QUESTION TEXT */}
      <p className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">{block.question}</p>

      {/* QUICK SELECT PILLS / BUTTONS */}
      {hasOptions && (
        <div className="space-y-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Click to Select or Choose from Dropdown:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {block.options!.map((opt, i) => (
              <Button
                key={i}
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled}
                onClick={() => handleOptionPick(opt)}
                className="text-xs h-7.5 px-3 rounded-full bg-slate-50 hover:bg-indigo-600 hover:text-white border-slate-200 text-slate-700 font-medium transition-all duration-150 shadow-2xs"
              >
                {opt}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* DROPDOWN SELECT */}
      {hasOptions && (
        <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
          <Select
            value={selectedOption}
            onValueChange={(v) => {
              setSelectedOption(v);
              onSubmitAnswer(block.field, v, false);
            }}
            disabled={disabled}
          >
            <SelectTrigger className="h-8 text-xs bg-slate-50 border-slate-200 text-slate-700 w-full sm:w-64">
              <SelectValue placeholder={`Select ${block.field}...`} />
            </SelectTrigger>
            <SelectContent>
              {block.options!.map((opt, i) => (
                <SelectItem key={i} value={opt} className="text-xs">
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-xs text-slate-400 font-medium">or upload/enter below:</span>
        </div>
      )}

      {/* HIDDEN FILE INPUT */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="hidden"
        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.zip,.csv,.xlsx"
      />

      {/* UPLOAD DOCUMENT BUTTON / FILE SELECTOR */}
      <div className="pt-1 border-t border-slate-100 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={triggerFileUpload}
            className={`h-8 text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs ${
              isFileField
                ? "bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600"
                : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200"
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            {uploadedFile ? "Change Document File" : "Upload Document / File"}
          </Button>

          {uploadedFile && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
              <span className="truncate max-w-[180px]">{uploadedFile.name}</span>
              <span className="text-[10px] text-emerald-600 font-normal">({uploadedFile.size})</span>
            </div>
          )}
        </div>

        {/* MANUAL INPUT & SUBMISSION */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2 pt-1">
          <Input
            type={block.field === "phone" ? "tel" : "text"}
            placeholder={uploadedFile ? `Ready: ${uploadedFile.name}` : `Enter custom ${block.field} or file name...`}
            value={val}
            onChange={(e) => setVal(e.target.value)}
            disabled={disabled}
            className="text-xs h-8 bg-slate-50/90 border-slate-200 focus-visible:ring-indigo-500"
          />
          <Button
            type="submit"
            size="sm"
            disabled={disabled || (!val.trim() && !selectedOption && !uploadedFile)}
            className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-1.5 shadow-2xs flex-shrink-0"
          >
            <span>Submit</span>
            <ArrowRight className="w-3 h-3" aria-hidden="true" focusable="false" />
          </Button>
          {block.allowSkip && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled}
              onClick={() => onSubmitAnswer(block.field, null, true)}
              className="h-8 text-xs text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center gap-1.5 flex-shrink-0"
            >
              <SkipForward className="w-3 h-3" aria-hidden="true" focusable="false" />
              <span>Skip</span>
            </Button>
          )}
        </form>
      </div>
    </div>
  );
};
