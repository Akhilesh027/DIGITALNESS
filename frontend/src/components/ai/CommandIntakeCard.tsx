import React, { useState } from 'react';
import {
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  SkipForward,
  Send,
  Sparkles,
  Building2,
  Phone,
  Briefcase,
  User,
  MapPin,
  Mail,
  DollarSign,
  UserCheck,
  FileText,
  Loader2,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface CommandIntakeCardProps {
  execution: any;
  onAnswer: (answer: string) => Promise<void>;
  onFinish: () => Promise<void>;
  customers?: any[];
  employees?: any[];
  tasks?: any[];
  loading: boolean;
}

export const CommandIntakeCard: React.FC<CommandIntakeCardProps> = ({
  execution,
  onAnswer,
  onFinish,
  customers = [],
  employees = [],
  tasks = [],
  loading,
}) => {
  const [answerInput, setAnswerInput] = useState('');

  const convState = execution?.conversationState || {};
  const collectedFields = convState.collectedFields || {};
  const skippedFields = convState.skippedFields || [];
  const currentField = convState.currentField;
  const currentQuestion = convState.currentQuestion || 'Please provide the missing details:';
  const missingRequired = convState.missingRequiredFields || [];
  const isMinimumComplete = missingRequired.length === 0;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!answerInput.trim() || loading) return;
    const ans = answerInput.trim();
    setAnswerInput('');
    await onAnswer(ans);
  };

  const handleSelectOption = async (val: string) => {
    if (!val || loading) return;
    setAnswerInput('');
    await onAnswer(val);
  };

  const handleSkip = async () => {
    if (loading) return;
    await onAnswer('skip');
  };

  // Helper to extract value from field object
  const getFieldValue = (fieldKey: string) => {
    const item = collectedFields[fieldKey];
    if (!item) return null;
    if (typeof item === 'object' && 'value' in item) {
      if (Array.isArray(item.value)) return item.value.join(', ');
      return String(item.value);
    }
    if (Array.isArray(item)) return item.join(', ');
    return String(item);
  };

  // Command-specific field definitions
  const getFieldDefinitions = (cmd: string) => {
    switch (cmd) {
      case 'task.create':
        return [
          { key: 'title', label: 'Task Title', icon: FileText, required: true },
          { key: 'customer', label: 'Client / Customer', icon: Building2, required: true },
          { key: 'workType', label: 'Work Type', icon: Briefcase, required: false },
          { key: 'assignedTo', label: 'Assigned To', icon: UserCheck, required: false },
          { key: 'priority', label: 'Priority', icon: AlertCircle, required: false },
          { key: 'dueDate', label: 'Due Date', icon: MapPin, required: false },
        ];
      case 'task.assign':
        return [
          { key: 'taskId', label: 'Target Task', icon: FileText, required: true },
          { key: 'assignedTo', label: 'Assigned Employee', icon: UserCheck, required: true },
        ];
      case 'payment.record':
        return [
          { key: 'customerId', label: 'Customer / Client', icon: Building2, required: true },
          { key: 'amount', label: 'Amount (₹)', icon: DollarSign, required: true },
          { key: 'paymentMode', label: 'Payment Mode', icon: Briefcase, required: false },
          { key: 'referenceNumber', label: 'Reference ID', icon: FileText, required: false },
        ];
      case 'customer.create':
        return [
          { key: 'name', label: 'Client Name', icon: Building2, required: true },
          { key: 'contactNumbers', label: 'Contact Number', icon: Phone, required: true },
          { key: 'businessType', label: 'Business Type', icon: Briefcase, required: true },
          { key: 'city', label: 'Location', icon: MapPin, required: false },
          { key: 'email', label: 'Email Address', icon: Mail, required: false },
        ];
      default:
        return [
          { key: 'name', label: 'Company / Lead', icon: Building2, required: true },
          { key: 'phone', label: 'Mobile Number', icon: Phone, required: true },
          { key: 'requirements', label: 'Requirements', icon: Briefcase, required: true },
          { key: 'contactPerson', label: 'Contact Person', icon: User, required: false },
          { key: 'city', label: 'Location', icon: MapPin, required: false },
          { key: 'email', label: 'Email Address', icon: Mail, required: false },
          { key: 'budget', label: 'Budget', icon: DollarSign, required: false },
          { key: 'assignedTo', label: 'Assigned Employee', icon: UserCheck, required: false },
        ];
    }
  };

  const FIELD_DEFINITIONS = getFieldDefinitions(execution?.command || 'lead.create');

  return (
    <div className="bg-white rounded-2xl border-2 border-indigo-200 shadow-md overflow-hidden transition-all">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-indigo-50 via-white to-purple-50 px-6 py-4 border-b border-indigo-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Conversational Intake Agent
              <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 text-[10px] font-semibold">
                {execution?.command || 'lead.create'}
              </Badge>
            </h3>
            <p className="text-xs text-slate-500">
              {isMinimumComplete
                ? '✓ Minimum required data complete. You can add optional fields or finish now.'
                : `Please provide the missing required fields for ${execution?.command || 'this operation'}.`}
            </p>
          </div>
        </div>

        <div>
          {isMinimumComplete ? (
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 gap-1 text-xs py-1 px-2.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Minimum Data Ready
            </Badge>
          ) : (
            <Badge className="bg-amber-100 text-amber-800 border-amber-300 gap-1 text-xs py-1 px-2.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              {missingRequired.length} Required Field{missingRequired.length > 1 ? 's' : ''} Missing
            </Badge>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* PROGRESSIVE FIELD CHECKLIST */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {FIELD_DEFINITIONS.map((def) => {
            const Icon = def.icon;
            const val = getFieldValue(def.key);
            const isSkipped = skippedFields.includes(def.key);
            const isCurrent = currentField === def.key;

            return (
              <div
                key={def.key}
                className={`p-3 rounded-xl border transition-all text-xs flex flex-col justify-between ${
                  isCurrent
                    ? 'border-indigo-500 bg-indigo-50/60 ring-2 ring-indigo-200'
                    : val
                    ? 'border-emerald-200 bg-emerald-50/40 text-slate-800'
                    : isSkipped
                    ? 'border-slate-200 bg-slate-50 opacity-60'
                    : 'border-slate-200 bg-slate-50/50 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 font-semibold">
                    <Icon className={`w-3.5 h-3.5 ${isCurrent ? 'text-indigo-600' : val ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span>{def.label}</span>
                  </div>
                  {def.required && !val && !isSkipped && (
                    <span className="text-[10px] text-amber-600 font-bold">*req</span>
                  )}
                </div>

                <div className="truncate font-medium pt-1">
                  {val ? (
                    <span className="text-emerald-900 flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                      <span className="truncate">{val}</span>
                    </span>
                  ) : isSkipped ? (
                    <span className="text-slate-400 italic">Skipped</span>
                  ) : isCurrent ? (
                    <span className="text-indigo-700 font-bold animate-pulse">Waiting for answer...</span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ACTIVE QUESTION CONVERSATION BUBBLE */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 mt-0.5">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div className="space-y-1 flex-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                Digitalness Intake Question:
              </span>
              <p className="text-sm font-semibold text-slate-900 leading-snug">
                {currentQuestion}
              </p>
            </div>
          </div>

          {/* QUICK-SELECT TABS & DROPDOWNS FROM DATABASE */}
          {currentField === 'customer' || currentField === 'customerId' ? (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                  Select Client from Database:
                </span>
                <span className="text-slate-400">{customers.length} Clients Found</span>
              </div>
              <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1 bg-white rounded-lg border border-slate-200">
                {customers.length > 0 ? (
                  customers.map((c: any) => (
                    <button
                      key={c._id}
                      type="button"
                      onClick={() => handleSelectOption(c.name || c.companyName)}
                      disabled={loading}
                      className="px-2.5 py-1.5 rounded-md bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 border border-slate-200 text-slate-800 text-xs font-medium flex items-center gap-1.5 transition-all text-left group"
                    >
                      <Building2 className="w-3 h-3 text-slate-400 group-hover:text-indigo-600" />
                      <span className="font-semibold">{c.name || c.companyName}</span>
                      {c.city && <span className="text-[10px] text-slate-400 font-normal">({c.city})</span>}
                    </button>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 p-1 italic">No clients found in database</span>
                )}
              </div>
            </div>
          ) : currentField === 'assignedTo' ? (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                <span className="flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                  Assign Team Member from Database:
                </span>
                <span className="text-slate-400">{employees.length} Team Members</span>
              </div>
              <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1 bg-white rounded-lg border border-slate-200">
                {employees.length > 0 ? (
                  employees.map((emp: any) => (
                    <button
                      key={emp._id}
                      type="button"
                      onClick={() => handleSelectOption(emp.name)}
                      disabled={loading}
                      className="px-2.5 py-1.5 rounded-md bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 border border-slate-200 text-slate-800 text-xs font-medium flex items-center gap-1.5 transition-all group"
                    >
                      <User className="w-3 h-3 text-slate-400 group-hover:text-indigo-600" />
                      <span className="font-semibold">{emp.name}</span>
                      <Badge variant="outline" className="text-[9px] py-0 px-1 font-normal bg-white">
                        {emp.role || 'Member'}
                      </Badge>
                    </button>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 p-1 italic">No team members found in database</span>
                )}
              </div>
            </div>
          ) : currentField === 'taskId' ? (
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                <span className="flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-indigo-600" />
                  Select Task from Database:
                </span>
                <span className="text-slate-400">{tasks.length} Tasks</span>
              </div>
              <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1 bg-white rounded-lg border border-slate-200">
                {tasks.length > 0 ? (
                  tasks.slice(0, 12).map((t: any) => (
                    <button
                      key={t._id}
                      type="button"
                      onClick={() => handleSelectOption(t.title)}
                      disabled={loading}
                      className="px-2.5 py-1.5 rounded-md bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 border border-slate-200 text-slate-800 text-xs font-medium flex items-center gap-1.5 transition-all text-left group"
                    >
                      <FileText className="w-3 h-3 text-slate-400 group-hover:text-indigo-600" />
                      <span className="font-semibold">{t.title}</span>
                      {t.customer?.name && <span className="text-[10px] text-slate-400">({t.customer.name})</span>}
                    </button>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 p-1 italic">No tasks found in database</span>
                )}
              </div>
            </div>
          ) : currentField === 'requirements' || currentField === 'workType' ? (
            <div className="space-y-2 pt-1">
              <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
                Quick Select Requirement / Service:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Website Development',
                  'Google Ads & PPC',
                  'SEO Optimization',
                  'Meta & Instagram Ads',
                  'Graphic & Poster Design',
                  'Video Production & Reels',
                  'Social Media Management',
                  'Performance Marketing',
                ].map((service) => (
                  <button
                    key={service}
                    type="button"
                    onClick={() => handleSelectOption(service)}
                    disabled={loading}
                    className="px-2.5 py-1 rounded-full bg-white hover:bg-indigo-50 hover:border-indigo-400 border border-slate-200 text-slate-700 hover:text-indigo-700 text-xs font-medium transition-all shadow-2xs"
                  >
                    + {service}
                  </button>
                ))}
              </div>
            </div>
          ) : currentField === 'priority' ? (
            <div className="space-y-2 pt-1">
              <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-indigo-600" />
                Select Priority:
              </span>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Urgent', color: 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100' },
                  { label: 'High', color: 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100' },
                  { label: 'Medium', color: 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100' },
                  { label: 'Low', color: 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100' },
                ].map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => handleSelectOption(p.label)}
                    disabled={loading}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${p.color}`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          ) : currentField === 'paymentMode' ? (
            <div className="space-y-2 pt-1">
              <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-indigo-600" />
                Select Payment Mode:
              </span>
              <div className="flex flex-wrap gap-2">
                {['UPI / QR Code', 'Bank Transfer (NEFT/IMPS)', 'Cash', 'Cheque'].map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => handleSelectOption(mode)}
                    disabled={loading}
                    className="px-3 py-1.5 rounded-lg bg-white hover:bg-indigo-50 hover:border-indigo-400 border border-slate-200 text-slate-700 text-xs font-medium transition-all shadow-2xs"
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
          ) : currentField === 'city' ? (
            <div className="space-y-2 pt-1">
              <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                Common Locations:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {['Hyderabad', 'Kukatpally', 'Madhapur', 'Bangalore', 'Mumbai', 'Chennai', 'Delhi'].map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => handleSelectOption(loc)}
                    disabled={loading}
                    className="px-2.5 py-1 rounded-full bg-white hover:bg-indigo-50 hover:border-indigo-400 border border-slate-200 text-slate-700 text-xs font-medium transition-all shadow-2xs"
                  >
                    📍 {loc}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {/* ANSWER INPUT FORM */}
          <form onSubmit={handleSubmit} className="flex items-center gap-2 pt-1">
            <Input
              value={answerInput}
              onChange={(e) => setAnswerInput(e.target.value)}
              placeholder={`Or type custom answer for ${currentField || 'details'}...`}
              disabled={loading}
              autoFocus
              className="bg-white border-slate-300 focus-visible:ring-indigo-500 text-sm"
            />
            <Button
              type="submit"
              disabled={!answerInput.trim() || loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 gap-1.5 flex-shrink-0"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>Answer</span>
            </Button>
          </form>

          {/* ACTION BUTTONS: SKIP & FINISH */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 text-xs">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSkip}
                disabled={loading}
                className="text-slate-600 hover:bg-slate-100 gap-1 h-8 text-xs"
              >
                <SkipForward className="w-3.5 h-3.5" />
                Skip this question
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                onClick={onFinish}
                disabled={!isMinimumComplete || loading}
                className={`gap-1.5 h-8 text-xs ${
                  isMinimumComplete
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                Finish & Create Lead Now
              </Button>
            </div>
          </div>
        </div>

        {/* CORRECTION / TIPS BANNER */}
        <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 text-xs text-indigo-900 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-600 flex-shrink-0" />
          <span>
            <strong>Pro-tip:</strong> You can correct previously entered details anytime (e.g. type{' '}
            <code className="bg-white px-1.5 py-0.5 rounded border border-indigo-200 font-mono text-[11px]">
              Actually change mobile to 9123456780
            </code>
            ).
          </span>
        </div>
      </div>
    </div>
  );
};
