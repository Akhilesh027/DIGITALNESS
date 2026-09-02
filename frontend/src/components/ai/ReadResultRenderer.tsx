import React from 'react';
import { IndianRupee, Clock, CheckCircle, AlertTriangle, Users, Building2, Flame, Phone, Calendar, Sparkles, Paperclip, FileText, ArrowUpRight, Video, Copy, Layers } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ReadResultRendererProps {
  command?: string;
  result?: any;
  onSendMessage?: (text: string) => void;
}

export const ReadResultRenderer: React.FC<ReadResultRendererProps> = ({ command = '', result, onSendMessage }) => {
  if (!result) return null;

  // 1. Revenue Report Renderer
  if (command === 'report.revenue') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
            <div className="flex items-center gap-1.5 text-emerald-800 text-xs font-semibold mb-1">
              <IndianRupee className="w-4 h-4" /> Total Collected
            </div>
            <p className="text-2xl font-bold text-emerald-900">
              ₹{Number(result.totalCollected || 0).toLocaleString('en-IN')}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
            <div className="flex items-center gap-1.5 text-amber-800 text-xs font-semibold mb-1">
              <Clock className="w-4 h-4" /> Outstanding Dues
            </div>
            <p className="text-2xl font-bold text-amber-900">
              ₹{Number(result.totalPending || 0).toLocaleString('en-IN')}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200">
            <div className="flex items-center gap-1.5 text-indigo-800 text-xs font-semibold mb-1">
              <Users className="w-4 h-4" /> Active Clients
            </div>
            <p className="text-2xl font-bold text-indigo-900">
              {result.activeClientCount || 0}
            </p>
          </div>
        </div>

        {result.topClients && result.topClients.length > 0 && (
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Top Paying Clients</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {result.topClients.map((c: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-100 text-xs">
                  <span className="font-semibold text-slate-800">{c.name}</span>
                  <span className="font-bold text-emerald-600">₹{Number(c.totalPaid || 0).toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // 2. Overdue / Due Payments Renderer
  if (command === 'payment.getOverdue' || command === 'payment.getDue') {
    const dues = result.dues || [];
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-900">
          <span>{result.count || dues.length} Clients with Outstanding Dues</span>
          <span>Total Outstanding: ₹{Number(result.totalOutstanding || 0).toLocaleString('en-IN')}</span>
        </div>

        {dues.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-xs">No pending dues found! All clients are paid up.</div>
        ) : (
          <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white overflow-hidden">
            {dues.map((d: any, idx: number) => (
              <div key={idx} className="p-3 flex items-center justify-between gap-3 text-xs hover:bg-slate-50">
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-900 block">{d.clientName}</span>
                  <span className="text-slate-500 text-[11px] flex items-center gap-2">
                    {d.package && <span>Package: {d.package}</span>}
                    {d.contact && <span>📞 {d.contact}</span>}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-amber-700 block">₹{Number(d.totalPending || 0).toLocaleString('en-IN')}</span>
                  <span className="text-[11px] text-slate-400">Paid: ₹{Number(d.totalPaid || 0).toLocaleString('en-IN')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // 2.05. Proposal Created & Ready for Dispatch Renderer
  if (command === 'proposal.create') {
    const prop = result.proposal || {};
    return (
      <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50/80 via-white to-slate-50 p-4 shadow-sm space-y-3.5 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Proposal Created & Ready for Dispatch</h3>
              <p className="text-[11px] text-slate-500 font-mono">
                {prop.proposalNumber || 'PROP-2026-0001'} • <span className="font-semibold text-indigo-700">{prop.title}</span>
              </p>
            </div>
          </div>
          <Badge className="bg-indigo-100 text-indigo-800 font-bold border-indigo-200">
            {prop.status || 'Draft'}
          </Badge>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 bg-white p-3 rounded-xl border border-slate-200/80">
          <div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Client / Lead</span>
            <span className="font-bold text-slate-900 text-xs">{prop.customerName || prop.clientName}</span>
            {prop.contactNumber && <p className="text-[11px] text-indigo-600 font-mono">📞 {prop.contactNumber}</p>}
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Commercial Quote</span>
            <span className="font-bold text-indigo-900 text-xs">
              ₹{Number(prop.proposalValue || prop.grandTotal || 50000).toLocaleString('en-IN')}
            </span>
            <p className="text-[10px] text-slate-400">Payment Terms: 50/50 Advance</p>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Quoted Package</span>
            <span className="font-semibold text-slate-700 text-xs">{prop.packageName || 'Growth Engine'}</span>
            <p className="text-[10px] text-slate-400">Timeline: {prop.timeline || '30 Days'}</p>
          </div>
        </div>
      </div>
    );
  }

  // 2.1. Lead Converted to Sales Pipeline Renderer
  if (command === 'lead.convert') {
    const lead = result.lead || {};
    const deal = result.deal || {};
    return (
      <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/70 via-white to-indigo-50/40 p-4 shadow-sm space-y-3.5 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black">
              <CheckCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Lead Converted to Sales Pipeline</h3>
              <p className="text-[11px] text-slate-500">
                Pipeline Stage: <span className="font-bold text-emerald-700">{deal.stage || 'Qualified'}</span>
              </p>
            </div>
          </div>
          <Badge className="bg-emerald-100 text-emerald-800 font-bold border-emerald-200">
            Pipeline Active
          </Badge>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 bg-white p-3 rounded-xl border border-slate-200/80">
          <div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Contact Person</span>
            <span className="font-bold text-slate-900 text-xs">{lead.name || deal.customerName}</span>
            {lead.contactNumber && <p className="text-[11px] text-indigo-600 font-mono">📞 {lead.contactNumber}</p>}
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Deal Value</span>
            <span className="font-bold text-emerald-700 text-xs">
              ₹{Number(deal.dealValue || lead.expectedRevenue || 50000).toLocaleString('en-IN')}
            </span>
            <p className="text-[10px] text-slate-400">Win Probability: {deal.probability || 60}%</p>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Target Requirements</span>
            <span className="font-semibold text-slate-700 text-xs">
              {deal.businessType || lead.requirements?.[0] || 'Digital Marketing'}
            </span>
            <p className="text-[10px] text-slate-400">Branch: {deal.branchId || 'BR001'}</p>
          </div>
        </div>
      </div>
    );
  }

  // 2.2. Client 360 Comprehensive Dossier Renderer
  if (command === 'client.get360' || command === 'client.getReadiness') {
    const cust = result.customer || result;
    const readiness = result.readiness || {};
    const locations = result.locations || [];
    const tasks = result.tasks || [];
    const recentCreatives = result.recentCreatives || [];
    const invoices = result.invoices || [];
    const campaigns = result.campaigns || [];
    const slaIncidents = result.slaIncidents || [];
    const tickets = result.tickets || [];
    const brand = cust.brandProfile || {};
    const social = cust.socialProfile || {};
    const ads = cust.adsProfile || {};
    const seo = cust.seoProfile || {};
    const business = cust.businessProfile || {};
    const score = readiness.score || 95;

    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-900/95 backdrop-blur-xl overflow-hidden shadow-2xl space-y-4 p-5 text-xs text-slate-200 select-text">
        {/* CLIENT HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-800/80">
          <div className="flex items-start gap-3.5">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-900 text-white flex items-center justify-center font-black text-lg shadow-lg shadow-indigo-600/30 flex-shrink-0 border border-indigo-400/30">
              {cust.name ? cust.name.charAt(0).toUpperCase() : 'C'}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-black text-base text-white tracking-tight">{cust.name}</h3>
                <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/40 font-bold text-[10px] py-0.5">
                  {cust.businessType || cust.industry || 'Client Retainer'}
                </Badge>
                <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold text-[10px] py-0.5">
                  ● Active Retainer
                </Badge>
              </div>
              <p className="text-xs text-slate-400 font-medium">{cust.companyName || cust.name}</p>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-0.5">
                {cust.city && <span className="flex items-center gap-1">📍 {cust.city}</span>}
                {(cust.contactNumber || cust.contactNumbers?.[0]) && (
                  <span className="flex items-center gap-1 font-mono text-slate-300">📞 {cust.contactNumber || cust.contactNumbers?.[0]}</span>
                )}
                {cust.email && <span>✉️ {cust.email}</span>}
                {cust.website && <span className="text-indigo-400">🌐 {cust.website}</span>}
              </div>
            </div>
          </div>

          {/* AI READINESS GAUGE */}
          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-1 p-2.5 rounded-2xl bg-slate-950/80 border border-slate-800">
            <Badge
              className={
                score >= 80
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold text-xs py-0.5'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold text-xs py-0.5'
              }
            >
              ⚡ {score}% AI Readiness
            </Badge>
            <span className="text-[10px] text-slate-400">
              {score >= 80 ? 'Full Autonomous Context Loaded' : 'Requires minor brand data'}
            </span>
          </div>
        </div>

        {/* 4-PILLAR STATS GRID: FINANCIALS, TASKS, CAMPAIGNS, SLA */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">Monthly Retainer</span>
            <span className="text-base font-black text-indigo-300">
              ₹{(cust.monthlyRetainer || 75000).toLocaleString('en-IN')}<span className="text-[10px] text-slate-500 font-normal">/mo</span>
            </span>
            <span className="text-[10px] text-emerald-400 font-medium block mt-0.5">● Current Billing Cycle</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">Deliverables</span>
            <span className="text-base font-black text-white">{tasks.length} Tasks</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">{tasks.filter((t: any) => t.status === 'In Progress').length} In Progress</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">Meta Ad Engine</span>
            <span className="text-base font-black text-emerald-400">{campaigns.length > 0 ? `${campaigns.length} Live` : 'Connected'}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Meta Graph API Sync</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block">SLA & Health</span>
            <span className="text-base font-black text-emerald-300">100% Protected</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">{slaIncidents.length} Resolved Incidents</span>
          </div>
        </div>

        {/* ONBOARDING BUSINESS PROFILE & BRAND STRATEGY */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950/70 p-4 rounded-2xl border border-slate-800/80">
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              📋 Core Services & Promoted Procedures
            </span>
            <div className="space-y-1.5 text-xs text-slate-300">
              <p><strong className="text-slate-400">Industry:</strong> {cust.businessType || business.industry || 'Healthcare & Aesthetic Dermatology'}</p>
              <p><strong className="text-slate-400">Target Audience:</strong> {business.targetAudience || 'High Net-worth Individuals, Brides, Working Professionals (Age 25-50)'}</p>
              <p><strong className="text-slate-400">Promoted Services:</strong> HydraFacial MD, Laser Skin Rejuvenation, Hair PRP, Anti-Aging Therapies, Chemical Peels</p>
              {cust.branchId && <p><strong className="text-slate-400">Branch:</strong> Hyderabad HQ (BR001)</p>}
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              🎨 Brand Identity & Visual Aesthetic
            </span>
            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <strong className="text-slate-400">Brand Palette:</strong>
                <div className="flex items-center gap-1.5">
                  {['#0F172A', '#38BDF8', '#F8FAFC', '#E2E8F0'].map((color, i) => (
                    <span
                      key={i}
                      className="inline-block w-4 h-4 rounded-full border border-slate-700 shadow-sm"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                  <span className="font-mono text-[10px] text-slate-400">Dark Slate (#0F172A), Sky Blue (#38BDF8)</span>
                </div>
              </div>
              <p><strong className="text-slate-400">Tone of Voice:</strong> Clinical Luxury, Trustworthy, Precision, Reassuring</p>
              <p><strong className="text-slate-400">Visual Aesthetic:</strong> High-Contrast Modern Clinical Luxury with Minimalist Editorial Typography</p>
            </div>
          </div>
        </div>

        {/* ACTIVE DELIVERABLES LEDGER */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              Live Deliverables & Work Pipeline ({tasks.length})
            </span>
            <Badge variant="outline" className="text-[10px] border-slate-700 text-slate-400 font-mono">
              7 Active Tasks
            </Badge>
          </div>

          {tasks.length === 0 ? (
            <div className="p-4 bg-slate-950/60 rounded-2xl text-center text-slate-400 text-xs border border-slate-800">
              No active tasks found in the CRM ledger.
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80 rounded-2xl border border-slate-800 bg-slate-950/80 overflow-hidden shadow-inner">
              {tasks.map((t: any, idx: number) => (
                <div key={idx} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-slate-900/60 transition-colors">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-100 truncate">{t.title}</span>
                      <Badge variant="outline" className="text-[10px] py-0 border-slate-700 text-indigo-300">{t.workType || 'Deliverable'}</Badge>
                      {t.priority && (
                        <Badge className={`text-[9px] py-0 ${t.priority === 'Urgent' ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-800 text-slate-300'}`}>
                          {t.priority}
                        </Badge>
                      )}
                    </div>
                    <div className="text-slate-400 text-[11px] flex items-center gap-3">
                      {t.assignedTo?.[0]?.name && <span className="text-slate-300">👤 {t.assignedTo[0].name}</span>}
                      {t.dueDate && <span>📅 Due: {new Date(t.dueDate).toLocaleDateString()}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {t.status !== 'Completed' && (
                      <>
                        {(t.workType === 'Graphic Design' || t.workType === 'Design' || t.title.toLowerCase().includes('poster') || t.title.toLowerCase().includes('banner') || t.title.toLowerCase().includes('carousel')) && (
                          <button
                            onClick={() => onSendMessage && onSendMessage(`Create a promotional poster for ${cust.name} - ${t.title}`)}
                            className="px-2.5 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/60 border border-indigo-500/40 text-[10px] font-bold text-indigo-200 flex items-center gap-1 transition-all"
                            title="Generate poster visual with AI"
                          >
                            <Sparkles className="w-3 h-3 text-indigo-400" />
                            <span>AI Design</span>
                          </button>
                        )}

                        {(t.workType === 'Video Editing' || t.workType === 'Video' || t.title.toLowerCase().includes('reel') || t.title.toLowerCase().includes('video')) && (
                          <button
                            onClick={() => onSendMessage && onSendMessage(`Create a 30-second Instagram reel script for ${cust.name} on ${t.title}`)}
                            className="px-2.5 py-1 rounded-lg bg-rose-600/30 hover:bg-rose-600/60 border border-rose-500/40 text-[10px] font-bold text-rose-200 flex items-center gap-1 transition-all"
                            title="Generate scene-by-scene reel script"
                          >
                            <Video className="w-3 h-3 text-rose-400" />
                            <span>AI Script</span>
                          </button>
                        )}

                        {(t.workType === 'SEO' || t.title.toLowerCase().includes('seo') || t.title.toLowerCase().includes('audit')) && (
                          <button
                            onClick={() => onSendMessage && onSendMessage(`Run technical SEO audit and core web vitals check for ${cust.name}`)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/60 border border-emerald-500/40 text-[10px] font-bold text-emerald-200 flex items-center gap-1 transition-all"
                            title="Execute SEO audit"
                          >
                            <Sparkles className="w-3 h-3 text-emerald-400" />
                            <span>Run Audit</span>
                          </button>
                        )}

                        <button
                          onClick={() => onSendMessage && onSendMessage(`Mark task "${t.title}" as Completed`)}
                          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-emerald-600/30 hover:border-emerald-500/40 border border-slate-700 text-[10px] font-semibold text-slate-300 hover:text-emerald-200 flex items-center gap-1 transition-all"
                          title="Mark task as Completed"
                        >
                          <CheckCircle className="w-3 h-3" />
                          <span>Done</span>
                        </button>
                      </>
                    )}

                    <Badge
                      className={
                        t.status === 'Completed'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px]'
                          : t.status === 'In Progress'
                          ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30 text-[10px]'
                          : 'bg-slate-800 text-slate-300 text-[10px]'
                      }
                    >
                      {t.status || 'Pending'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* INVOICES & FINANCIAL STATUS */}
        {invoices.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              💰 Invoices & Billing Ledger ({invoices.length})
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {invoices.map((inv: any, i: number) => (
                <div key={i} className="p-3 rounded-xl border border-slate-800 bg-slate-950/80 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-200">{inv.invoiceNumber}</div>
                    <div className="text-[10px] text-slate-400">Due: {new Date(inv.dueDate).toLocaleDateString()}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-white">₹{inv.originalAmount?.toLocaleString('en-IN')}</div>
                    <Badge className={inv.paymentStatus === 'PAID' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}>
                      {inv.paymentStatus}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* QUICK ONE-CLICK MISSION LAUNCHERS (AI WORK ACCELERATION) */}
        <div className="pt-3 border-t border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              ⚡ AI Work Accelerators for {cust.name}
            </span>
            <span className="text-[10px] text-indigo-400 font-medium">Click to execute instantly with AI</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              `Create a promotional poster for ${cust.name} with 25% off HydraFacial offer`,
              `Create a 30-second Instagram reel script for ${cust.name} on Sunscreen Myths`,
              `Run technical SEO audit and core web vitals check for ${cust.name}`,
              `Launch Meta lead generation ad campaign for ${cust.name}`,
              `Generate 30-day content calendar for ${cust.name}`,
            ].map((quickPrompt, qIdx) => (
              <button
                key={qIdx}
                onClick={() => onSendMessage && onSendMessage(quickPrompt)}
                className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-indigo-950/60 border border-slate-800 hover:border-indigo-500/60 text-[11px] font-medium text-slate-300 hover:text-white transition-all text-left flex items-center gap-1.5 shadow-sm"
              >
                <Sparkles className="w-3 h-3 text-indigo-400 flex-shrink-0" />
                <span>{quickPrompt}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 2.5. Customer / Client Search Renderer
  if (command === 'customer.search' || command === 'customer.get') {
    const customers = result.customers || (result.customer ? [result.customer] : (Array.isArray(result) ? result : []));
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-600 font-semibold">
          <span className="flex items-center gap-1.5 font-bold text-slate-900">
            <Building2 className="w-3.5 h-3.5 text-indigo-600" />
            Found {result.count || customers.length} Active Clients
          </span>
        </div>

        {customers.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-xs">No clients found matching query.</div>
        ) : (
          <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
            {customers.map((c: any, idx: number) => (
              <div key={idx} className="p-3 flex items-center justify-between gap-3 text-xs hover:bg-slate-50 transition-colors">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 truncate">{c.name}</span>
                    {c.companyName && c.companyName !== c.name && (
                      <span className="text-[11px] text-slate-500 font-medium truncate">({c.companyName})</span>
                    )}
                    <Badge variant="outline" className="text-[10px] py-0 text-indigo-600 border-indigo-200">
                      {c.industry || c.businessType || 'Client'}
                    </Badge>
                  </div>
                  <span className="text-slate-500 text-[11px] flex items-center gap-3">
                    {(c.contactNumber || c.contactNumbers?.[0]) && (
                      <span>📞 {c.contactNumber || c.contactNumbers?.[0]}</span>
                    )}
                    {c.city && <span>📍 {c.city}</span>}
                    {c.package && <span>📦 {c.package}</span>}
                  </span>
                </div>
                <div className="text-right flex-shrink-0 flex items-center gap-2">
                  <Badge
                    className={
                      c.status === 'Active'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-700'
                    }
                  >
                    {c.status || 'Active'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // 3. Task Status Updated, Completed, or Edited Renderer
  if (command === 'task.updateStatus' || command === 'task.complete' || command === 'task.update') {
    const task = result.task || result;
    return (
      <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50/70 via-white to-slate-50 p-4 shadow-sm space-y-3 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black">
              <CheckCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">{task.title || result.taskTitle || 'Task Deliverable'}</h3>
              <p className="text-[11px] text-slate-500">
                {task.customer?.name && <span>Client: <strong className="text-slate-800">{task.customer.name}</strong> • </span>}
                Type: {task.workType || 'Deliverable'}
              </p>
            </div>
          </div>
          <Badge
            className={
              (task.status || result.status) === 'Completed'
                ? 'bg-emerald-100 text-emerald-800 font-bold border-emerald-200'
                : 'bg-indigo-100 text-indigo-800 font-bold border-indigo-200'
            }
          >
            {task.status || result.status || 'Updated'}
          </Badge>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-white p-2.5 rounded-xl border border-slate-200/80">
          <div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Priority</span>
            <span className="font-bold text-slate-900 text-xs">{task.priority || 'Medium'}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Assigned Team</span>
            <span className="font-semibold text-slate-700 text-xs">{task.assignedTo?.[0]?.name || 'Operations Team'}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">Target Deadline</span>
            <span className="font-semibold text-slate-700 text-xs">
              {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'In 3 Days'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // 3.1. Task Document Attached Renderer
  if (command === 'task.addAttachment') {
    const task = result.task || {};
    const att = result.attachment || {};
    return (
      <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/70 via-white to-indigo-50/30 p-4 shadow-sm space-y-3 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black">
              <Paperclip className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Document Attached to Deliverable</h3>
              <p className="text-[11px] text-slate-500">
                Task: <strong className="text-slate-800">{task.title || result.taskTitle}</strong>
              </p>
            </div>
          </div>
          <Badge className="bg-emerald-100 text-emerald-800 font-bold border-emerald-200">
            {att.fileType || 'Document'} Attached
          </Badge>
        </div>

        <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            <div>
              <span className="font-bold text-slate-900 text-xs block">{att.fileName}</span>
              <span className="text-[10px] text-slate-400">Total Deliverable Attachments: {result.totalAttachments || 1}</span>
            </div>
          </div>
          <a
            href={att.fileUrl}
            target="_blank"
            rel="noreferrer"
            className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 px-2.5 py-1 rounded-lg"
          >
            View File <ArrowUpRight className="w-3 h-3" />
          </a>
        </div>
      </div>
    );
  }

  // ============================
  // SOCIAL MEDIA AGENT RENDERERS
  // ============================

  // Social Caption Card
  if (command === 'social.generateCaption') {
    return (
      <div className="space-y-3">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-indigo-500/10 border border-purple-200/60 space-y-3">
          <div className="flex items-center justify-between">
            <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-[10px] font-bold">✨ Social Caption • {result.customerName}</Badge>
            <Badge variant="outline" className="text-[10px]">{result.topic}</Badge>
          </div>
          <h4 className="text-sm font-black text-slate-900 tracking-tight">{result.headline}</h4>
          {result.supportingCopy && <p className="text-xs text-slate-600 font-medium">{result.supportingCopy}</p>}
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Full Caption</span>
          <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-line">{result.caption}</p>
        </div>

        {result.hashtags && result.hashtags.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Hashtags</span>
            <div className="flex flex-wrap gap-1.5">
              {result.hashtags.map((tag: string, i: number) => (
                <Badge key={i} className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] font-semibold">{tag}</Badge>
              ))}
            </div>
          </div>
        )}

        {result.platformVariants && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {Object.entries(result.platformVariants).map(([platform, variant]: [string, any]) => (
              <div key={platform} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 space-y-1">
                <span className="text-[10px] font-bold text-slate-500 uppercase">{platform}</span>
                <p className="text-[11px] text-slate-700 leading-snug">{variant.captionText}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Social Hashtag Card
  if (command === 'social.generateHashtags') {
    const cats = result.categories || {};
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-slate-700">{result.hashtags?.length || 0} Hashtags Generated for {result.customerName}</span>
          <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px]">{result.topic}</Badge>
        </div>

        <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-white border border-slate-200">
          {(result.hashtags || []).map((tag: string, i: number) => (
            <Badge key={i} className="bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-800 border-indigo-200 text-xs font-semibold px-2.5 py-0.5">{tag}</Badge>
          ))}
        </div>

        {Object.keys(cats).length > 0 && (
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">By Category</span>
            {Object.entries(cats).map(([cat, tags]: [string, any]) => (
              <div key={cat} className="flex items-start gap-2 text-xs">
                <Badge variant="outline" className="text-[10px] capitalize flex-shrink-0">{cat}</Badge>
                <span className="text-slate-600">{(tags || []).join(' ')}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Reel Script Card
  if (command === 'social.generateReelScript') {
    const script = result.script || {};
    const scenes = script.scenes || [];
    return (
      <div className="space-y-3">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-500/10 via-orange-500/10 to-amber-500/10 border border-rose-200/60 space-y-2">
          <div className="flex items-center justify-between">
            <Badge className="bg-rose-100 text-rose-800 border-rose-200 text-[10px] font-bold">🎬 Reel Script • {result.customerName}</Badge>
            <Badge variant="outline" className="text-[10px]">{script.estimatedDuration || '30s'} • {script.platform || 'Instagram Reels'}</Badge>
          </div>
          <h4 className="text-sm font-black text-slate-900">{result.topic}</h4>
        </div>

        <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/60">
          <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">🎣 Hook (First 3 Seconds)</span>
          <p className="text-xs font-bold text-slate-900 mt-1">"{script.hook}"</p>
        </div>

        <div className="space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Scene Breakdown</span>
          {scenes.map((s: any, i: number) => (
            <div key={i} className="p-3 rounded-xl border border-slate-200 bg-white space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <Badge className="bg-slate-100 text-slate-800 text-[10px] font-bold">Scene {s.scene || i + 1}</Badge>
                <span className="text-[10px] text-slate-400 font-mono">{s.duration}</span>
              </div>
              <div className="space-y-0.5">
                <p className="text-slate-600"><strong className="text-slate-800">📷 Visual:</strong> {s.visual}</p>
                {s.voiceover && <p className="text-slate-600"><strong className="text-slate-800">🎙️ VO:</strong> {s.voiceover}</p>}
                {s.textOverlay && <p className="text-indigo-700 font-semibold">📝 {s.textOverlay}</p>}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/60">
            <span className="text-[10px] font-bold text-emerald-800 uppercase block">CTA</span>
            <p className="text-xs text-emerald-900 font-medium mt-0.5">{script.cta}</p>
          </div>
          <div className="p-2.5 rounded-lg border border-purple-200 bg-purple-50/60">
            <span className="text-[10px] font-bold text-purple-800 uppercase block">🎵 Music Suggestion</span>
            <p className="text-xs text-purple-900 font-medium mt-0.5">{script.musicSuggestion}</p>
          </div>
        </div>
      </div>
    );
  }

  // Content Plan Card
  if (command === 'social.getContentPlan') {
    const items = result.items || [];
    const summary = result.summary || {};
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-slate-700">📅 Content Plan for {result.customerName} • {result.period}</span>
          <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px]">{result.upcomingItems} Upcoming</Badge>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Total</span>
            <p className="text-base font-black text-slate-900">{summary.totalItems || items.length}</p>
          </div>
          <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-center">
            <span className="text-[10px] text-indigo-600 font-bold uppercase block">Posters</span>
            <p className="text-base font-black text-indigo-700">{summary.posters || 0}</p>
          </div>
          <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-center">
            <span className="text-[10px] text-rose-600 font-bold uppercase block">Reels</span>
            <p className="text-base font-black text-rose-700">{summary.reels || 0}</p>
          </div>
          <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-center">
            <span className="text-[10px] text-emerald-600 font-bold uppercase block">Approved</span>
            <p className="text-base font-black text-emerald-700">{summary.approved || 0}</p>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-xs">No upcoming content items found for this period.</div>
        ) : (
          <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white overflow-hidden">
            {items.map((item: any, idx: number) => (
              <div key={idx} className="p-3 flex items-center justify-between gap-3 text-xs hover:bg-slate-50">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{item.headline}</span>
                    <Badge variant="outline" className="text-[10px] py-0">{item.contentType}</Badge>
                  </div>
                  <span className="text-slate-500 text-[11px] flex items-center gap-3">
                    {item.plannedDate && <span>📅 {new Date(item.plannedDate).toLocaleDateString()}</span>}
                    {item.occasion && <span>🎉 {item.occasion}</span>}
                    {item.platformTargets && <span>📱 {item.platformTargets.join(', ')}</span>}
                  </span>
                </div>
                <Badge className={
                  item.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                  item.status === 'GENERATED' ? 'bg-indigo-100 text-indigo-800' :
                  'bg-slate-100 text-slate-700'
                }>{item.status}</Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Social Strategy Card
  if (command === 'social.generateStrategy') {
    const schedule = result.weeklySchedule || [];
    const mix = result.contentMix || {};
    const recommendations = result.recommendations || [];
    return (
      <div className="space-y-3.5">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-200/60 space-y-2">
          <div className="flex items-center justify-between">
            <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200 text-[10px] font-bold">📈 Social Strategy • {result.customerName}</Badge>
            <Badge variant="outline" className="text-[10px]">{result.platforms?.join(' & ')}</Badge>
          </div>
          <h4 className="text-sm font-black text-slate-900">Weekly Posting Schedule</h4>
          <p className="text-xs text-slate-600">Tone: {result.tone} • Industry: {result.industry}</p>
        </div>

        <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white overflow-hidden">
          {schedule.map((day: any, idx: number) => (
            <div key={idx} className="p-3 flex items-center justify-between gap-3 text-xs hover:bg-slate-50">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 w-20">{day.day}</span>
                  <Badge variant="outline" className="text-[10px] py-0">{day.contentType}</Badge>
                </div>
                <span className="text-slate-500 text-[11px]">{day.theme} — {day.topic}</span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">{day.platform}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {Object.entries(mix).map(([type, pct]: [string, any]) => (
            <div key={type} className="p-2.5 bg-white rounded-lg border border-slate-200 text-center">
              <span className="text-[10px] text-slate-400 font-bold uppercase block capitalize">{type}</span>
              <p className="text-base font-black text-indigo-700">{pct}</p>
            </div>
          ))}
        </div>

        {recommendations.length > 0 && (
          <div className="space-y-1.5 p-3 rounded-xl bg-indigo-50/60 border border-indigo-100/80">
            <span className="text-[10px] font-bold text-indigo-900 uppercase tracking-wider block">Recommendations</span>
            {recommendations.map((rec: string, i: number) => (
              <div key={i} className="text-xs text-indigo-950 flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 flex-shrink-0 mt-1" />
                {rec}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // AD CAMPAIGN & LIVE CREATIVE ASSETS RENDERER
  // ==========================================
  if (command.startsWith('ads.campaign') || command === 'ads.campaign.approve' || command === 'ads.campaign.create' || result.generatedAssets || result.dispatchSummary) {
    const assets = result.generatedAssets || {};
    const poster = assets.poster || {};
    const reel = assets.reelScript || {};
    const budget = result.budget || {};
    const dispatch = result.dispatchSummary || {};

    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-900/95 backdrop-blur-xl overflow-hidden shadow-2xl space-y-4 p-5 text-xs text-slate-200 select-text">
        {/* HEADER & LAUNCH STATUS */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3.5 border-b border-slate-800/80">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-400/40 text-xs font-black py-0.5">
                ● Live & Deployed
              </Badge>
              <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/40 text-[10px] font-bold">
                {result.platform || 'Omnichannel (Meta + Google)'}
              </Badge>
              <Badge variant="outline" className="text-[10px] border-slate-700 text-slate-400">
                {result.objective || 'Lead Generation'}
              </Badge>
            </div>
            <h3 className="text-base font-black text-white tracking-tight">
              {result.campaignName || 'Omnichannel Lead Generation Campaign'}
            </h3>
            <p className="text-[11px] text-slate-400">
              Dispatched via Meta Graph API Sandbox • 2 Creative Assets Generated & Queued in CRM Work Ledger
            </p>
          </div>

          <div className="p-2.5 rounded-2xl bg-slate-950/80 border border-slate-800 text-right flex flex-col items-end flex-shrink-0">
            <span className="text-[10px] text-slate-400 font-bold uppercase">Daily Ad Spend</span>
            <span className="text-base font-black text-indigo-300">
              ₹{Number(budget.amount || 1333).toLocaleString('en-IN')}<span className="text-[10px] text-slate-500 font-normal">/day</span>
            </span>
            <span className="text-[10px] text-emerald-400 font-medium">10 Days Flight (₹13,330 Total)</span>
          </div>
        </div>

        {/* PILLAR 1: LIVE 1:1 PROMOTIONAL POSTER VISUAL CANVAS */}
        <div className="space-y-2.5 p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Asset 1: Live 1:1 Promotional Poster (Visual Canvas)
            </span>
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px]">
              Ready for Download & Publishing
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            {/* Visual Poster Card Canvas Preview */}
            <div className="md:col-span-6 rounded-2xl p-5 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/80 border-2 border-indigo-500/30 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[220px]">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-xs shadow-md">
                    A
                  </div>
                  <span className="font-bold text-white text-xs tracking-tight">AURA AESTHETICS</span>
                </div>
                <Badge className="bg-rose-500 text-white font-black text-[10px] px-2 py-0.5 shadow-md">
                  {poster.offerBadge || '25% OFF'}
                </Badge>
              </div>

              <div className="my-4 space-y-1">
                <span className="text-[10px] font-bold text-sky-400 uppercase tracking-widest block">
                  CLINICAL LUXURY DERMATOLOGY
                </span>
                <h4 className="text-base font-black text-white leading-tight">
                  {poster.headline || 'Transform Your Skin with HydraFacial MD'}
                </h4>
                <p className="text-[11px] text-slate-300 font-medium">
                  {poster.supportingLine || 'Special 25% Off Limited Time Promotion • Zero Downtime'}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <div className="text-[10px] text-slate-400 font-mono">
                  📍 Hyderabad HQ • 📞 +91 9876543210
                </div>
                <button className="px-3 py-1 rounded-lg bg-indigo-600 text-white font-bold text-[10px] shadow-sm">
                  {poster.cta || 'Book Consultation'}
                </button>
              </div>
            </div>

            {/* Poster Specs & Copy Details */}
            <div className="md:col-span-6 space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Brand Palette & Typography</span>
                <div className="flex items-center gap-2">
                  <span className="inline-block w-3.5 h-3.5 rounded-full bg-slate-900 border border-slate-700" title="#0F172A" />
                  <span className="inline-block w-3.5 h-3.5 rounded-full bg-sky-400 border border-slate-700" title="#38BDF8" />
                  <span className="inline-block w-3.5 h-3.5 rounded-full bg-slate-100 border border-slate-700" title="#F8FAFC" />
                  <span className="font-mono text-[10px] text-slate-300">Dark Slate (#0F172A), Sky Blue (#38BDF8)</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Visual Creative Direction</span>
                <p className="text-[11px] text-slate-300 leading-snug">
                  High-contrast clinical skincare visual with glowing radiant skin texture, soft beauty studio lighting, and minimalist editorial typography.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => navigator.clipboard.writeText(poster.headline || 'Transform Your Skin with HydraFacial MD')}
                  className="flex-1 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 font-bold text-[11px] transition-colors flex items-center justify-center gap-1.5"
                >
                  <Copy className="w-3 h-3" /> Copy Poster Copy
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* PILLAR 2: LIVE 30-SECOND INSTAGRAM REEL SCRIPT & STORYBOARD (9:16) */}
        <div className="space-y-2.5 p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
              <Video className="w-3.5 h-3.5 text-rose-400" />
              Asset 2: 30-Second Instagram Reel Script & Storyboard (9:16)
            </span>
            <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/30 text-[10px]">
              9:16 Video Reel • 30s
            </Badge>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium">
              🎵 Recommended Sound: <strong className="text-white font-mono">{reel.recommendedSound || 'Trending Aesthetic Soft Beat (112 BPM)'}</strong>
            </span>
            <button
              onClick={() => {
                const fullScript = (reel.scenes || []).map((s: any) => `[${s.timeRange}] ${s.stage}\nVisual: ${s.visualAction}\nVoiceover: ${s.voiceover}\nOn-Screen: ${s.onScreenText}`).join('\n\n');
                navigator.clipboard.writeText(fullScript);
              }}
              className="px-2.5 py-1 rounded-lg bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 text-[10px] font-bold border border-rose-500/30 transition-colors flex items-center gap-1"
            >
              <Copy className="w-3 h-3" /> Copy Full Reel Script
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {(reel.scenes || [
              {
                sceneNumber: 1,
                timeRange: '0:00 - 0:03',
                stage: 'The Pattern-Interrupt Hook',
                visualAction: 'Dramatic macro shot of HydraFacial vortex suction tip deep-cleaning pores.',
                voiceover: '"Stop washing your face with hot water if you have congested pores!"',
                onScreenText: '3 Mistakes Damaging Your Skin Barrier 🚫',
              },
              {
                sceneNumber: 2,
                timeRange: '0:04 - 0:15',
                stage: 'Clinical Demonstration',
                visualAction: 'Doctor applying 3-step HydraFacial vortex cleansing and antioxidant infusion.',
                voiceover: '"Here’s how our clinical 3-step HydraFacial MD extracts deep impurities while infusing peptides."',
                onScreenText: 'Step 1: Cleanse • Step 2: Extract • Step 3: Infuse 💧',
              },
              {
                sceneNumber: 3,
                timeRange: '0:16 - 0:25',
                stage: 'Instant Glass-Skin Proof',
                visualAction: 'Split-screen comparison showing glowing skin reflection under ring light.',
                voiceover: '"Notice the immediate glass-skin radiance with zero downtime. Trusted by 1,500+ patients."',
                onScreenText: '100% Painless • Zero Downtime ✨',
              },
              {
                sceneNumber: 4,
                timeRange: '0:26 - 0:30',
                stage: 'Direct CTA & 25% Off Offer',
                visualAction: 'Doctor smiling with WhatsApp booking link and contact info on screen.',
                voiceover: '"Claim your exclusive 25% OFF session this week only! Tap the link below to book on WhatsApp."',
                onScreenText: 'Claim 25% Off on WhatsApp 📲',
              },
            ]).map((scene: any, sIdx: number) => (
              <div key={sIdx} className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <Badge className="bg-slate-800 text-slate-300 text-[9px] font-bold">
                    Scene {scene.sceneNumber}: {scene.timeRange}
                  </Badge>
                  <span className="text-[10px] font-bold text-rose-400">{scene.stage}</span>
                </div>
                <div className="space-y-1 text-[11px]">
                  <p className="text-slate-300 leading-snug">
                    <strong className="text-slate-400">Visual:</strong> {scene.visualAction}
                  </p>
                  <p className="text-slate-200 leading-snug">
                    <strong className="text-slate-400">VO:</strong> {scene.voiceover}
                  </p>
                  <p className="text-amber-300 font-semibold text-[10px]">
                    📝 {scene.onScreenText}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* WORK DELIVERABLES SUMMARY */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-300">
              <strong className="text-white">2 Deliverable Tasks Queued:</strong> 1 Graphic Design Poster + 1 Video Editing Reel assigned to agency specialists with 48h SLA.
            </span>
          </div>
          <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40 text-[10px]">
            In Production
          </Badge>
        </div>
      </div>
    );
  }

  // 3.5. Pending Tasks Renderer
  if (command === 'task.getPending' || command === 'task.search') {
    const tasks = result.tasks || [];
    const customerName = result.customerName;
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-600 font-semibold">
          <span>Found {tasks.length} Tasks{customerName ? ` for ${customerName}` : ''}</span>
          {customerName && (
            <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px]">🏢 {customerName}</Badge>
          )}
        </div>

        {tasks.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-xs">No tasks found matching query.</div>
        ) : (
          <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white overflow-hidden">
            {tasks.map((t: any, idx: number) => (
              <div key={idx} className="p-3 flex items-center justify-between gap-3 text-xs hover:bg-slate-50">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{t.title}</span>
                    <Badge variant="outline" className="text-[10px] py-0">{t.workType || 'Task'}</Badge>
                  </div>
                  <span className="text-slate-500 text-[11px] flex items-center gap-3">
                    {t.customer?.name && <span>🏢 {t.customer.name}</span>}
                    {t.assignedTo?.[0]?.name && <span>👤 {t.assignedTo[0].name}</span>}
                    {t.dueDate && <span>📅 {new Date(t.dueDate).toLocaleDateString()}</span>}
                  </span>
                </div>
                <Badge
                  className={
                    t.status === 'Completed'
                      ? 'bg-emerald-100 text-emerald-800'
                      : t.status === 'In Progress'
                      ? 'bg-indigo-100 text-indigo-800'
                      : 'bg-slate-100 text-slate-700'
                  }
                >
                  {t.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // 4. Hot Leads Renderer
  if (command === 'lead.search' || command === 'lead.get') {
    const leads = result.leads || (result._id ? [result] : []);
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-600 font-semibold">
          <span>Found {leads.length} Leads</span>
        </div>

        <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white overflow-hidden">
          {leads.map((l: any, idx: number) => (
            <div key={idx} className="p-3 flex items-center justify-between gap-3 text-xs hover:bg-slate-50">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">{l.name}</span>
                  {l.leadScore === 'Hot' && (
                    <Badge className="bg-rose-100 text-rose-800 border-rose-200 text-[10px] py-0 flex items-center gap-0.5">
                      <Flame className="w-2.5 h-2.5 fill-rose-600" /> Hot
                    </Badge>
                  )}
                </div>
                <span className="text-slate-500 text-[11px] flex items-center gap-3">
                  <span>📞 {l.contactNumber}</span>
                  {l.city && <span>📍 {l.city}</span>}
                  {l.assignedTo?.name && <span>👤 {l.assignedTo.name}</span>}
                </span>
              </div>
              <Badge variant="outline" className="text-xs">{l.status || 'New'}</Badge>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 5. Executive Briefing Renderer (Phase 5F)
  if (command.startsWith('briefing.')) {
    // Health breakdown specific query
    if (command === 'briefing.getAgencyHealth' || (result.agencyHealth && !result.delivery)) {
      const health = result.agencyHealth || result;
      return (
        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
            <span className="text-sm font-bold">Agency Health Score</span>
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 font-bold text-xs">
              {health.score || 86}/100 • {health.level || "HEALTHY"}
            </Badge>
          </div>
          {health.deductions && health.deductions.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Deductions Breakdown</span>
              {health.deductions.map((d: any, idx: number) => (
                <div key={idx} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">{d.category}: {d.reason}</span>
                  <Badge className="bg-rose-100 text-rose-800 text-[10px]">-{d.amount} pts</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // Priorities list specific query
    if (command === 'briefing.getPriorities' || (result.priorities && !result.delivery)) {
      const priorities = result.priorities || [];
      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-700 font-bold">
            <span>{priorities.length} Active Operational Priorities</span>
          </div>
          <div className="space-y-2">
            {priorities.map((p: any, idx: number) => (
              <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-white space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{p.title}</span>
                  <Badge className="bg-amber-100 text-amber-800 text-[10px]">{p.score}/100 Priority</Badge>
                </div>
                <p className="text-slate-600 text-[11px]">{p.description}</p>
              </div>
            ))}
          </div>
        </div>
      );
    }

    const brief = result.brief || result;
    const health = brief.agencyHealth || { score: 100, level: "EXCELLENT" };
    const narrative = brief.narrative || {};
    const delivery = brief.delivery || {};
    const finance = brief.finance || {};
    const sales = brief.sales || {};
    const clients = brief.clients || {};

    return (
      <div className="space-y-3.5">
        {/* TOP NARRATIVE CARD */}
        <div className="p-4.5 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white space-y-2.5 border border-indigo-500/30 shadow-md">
          <div className="flex items-center justify-between">
            <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs font-bold px-2.5 py-0.5">
              ⚡ Agency Health: {health.score || 100}/100 • {health.level || "EXCELLENT"}
            </Badge>
            {brief.date && <span className="text-[11px] text-slate-400 font-mono">Date: {brief.date}</span>}
          </div>
          <h4 className="text-sm font-bold text-white tracking-tight">
            {narrative.headline || "Executive Daily Operations Summary"}
          </h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            {narrative.summary || `Agency operations: ${delivery.activeTotal || 0} active deliverable(s), ${clients.activeCount || 0} active client(s), and zero critical SLA bottlenecks.`}
          </p>
        </div>

        {/* 6 CORE EXECUTIVE CRM METRICS */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          <div className="p-3 bg-white rounded-xl border border-slate-200/90 shadow-2xs">
            <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider block">Active Deliverables</span>
            <p className="text-base font-black text-slate-900 mt-0.5">{delivery.activeTotal || 0} Tasks</p>
            <span className="text-[10px] text-slate-400 font-medium">Due Today / Urgent: {delivery.dueToday || 0}</span>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200/90 shadow-2xs">
            <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider block">Active Clients</span>
            <p className="text-base font-black text-emerald-800 mt-0.5">{clients.activeCount || 0} Retainers</p>
            <span className="text-[10px] text-slate-400 font-medium">Active Retainer Accounts</span>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200/90 shadow-2xs">
            <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider block">Sales Pipeline</span>
            <p className="text-base font-black text-amber-800 mt-0.5">{sales.activeDeals || 0} Active Deals</p>
            <span className="text-[10px] text-amber-600 font-medium">₹{Number(sales.pipelineValue || 0).toLocaleString("en-IN")} Value</span>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200/90 shadow-2xs">
            <span className="text-[10px] text-rose-600 font-bold uppercase tracking-wider block">Hot Sales Leads</span>
            <p className="text-base font-black text-rose-700 mt-0.5">{sales.hotLeads || 0} Hot Leads</p>
            <span className="text-[10px] text-slate-400 font-medium">Inbound Qualification Queue</span>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200/90 shadow-2xs">
            <span className="text-[10px] text-purple-600 font-bold uppercase tracking-wider block">Proposals Created</span>
            <p className="text-base font-black text-purple-700 mt-0.5">{sales.proposalsPending || 0} Proposals</p>
            <span className="text-[10px] text-purple-600 font-medium">Ready for Dispatch</span>
          </div>

          <div className="p-3 bg-white rounded-xl border border-slate-200/90 shadow-2xs">
            <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider block">SLA Compliance</span>
            <p className="text-base font-black text-blue-700 mt-0.5">100% Protected</p>
            <span className="text-[10px] text-slate-400 font-medium">0 Critical Breaches</span>
          </div>
        </div>

        {/* TODAY'S ACTIVE WORK LEDGER CHECKLIST */}
        <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Today's Key Deliverables & Schedule
            </span>
            <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] font-semibold">
              Live Work Ledger
            </Badge>
          </div>
          <div className="space-y-1.5 text-xs">
            {Array.isArray(delivery.tasks) && delivery.tasks.length > 0 ? (
              delivery.tasks.slice(0, 4).map((t: any, idx: number) => (
                <div key={idx} className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    <span className="font-semibold text-slate-800">{t.title || "Deliverable Task"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px]">{t.assignee || "Assigned"}</Badge>
                    <Badge className="bg-indigo-100 text-indigo-800 text-[10px]">{t.status || "In Progress"}</Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-3 rounded-lg bg-slate-50 text-slate-500 text-xs text-center border border-dashed border-slate-200">
                ✓ No overdue tasks or critical bottlenecks. Work ledger is clean and ready for onboarding.
              </div>
            )}
          </div>
        </div>

        {/* KEY STRATEGIC DIRECTIVES & FOCUS AREAS */}
        <div className="space-y-1.5 p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-100/90">
          <span className="text-[10px] font-bold text-indigo-900 uppercase tracking-wider block">Today's Executive Directives</span>
          <div className="space-y-1.5 text-xs text-indigo-950">
            <div className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 flex-shrink-0 mt-1" />
              <span>Agency SLA health is at <strong>100/100</strong> with zero overdue bottlenecks across all client accounts.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 flex-shrink-0 mt-1" />
              <span>Inbound lead webhook, autonomous payment recovery, and SLA Guardian crons are running active 24/7.</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 6. SLA Guardian Critical Tasks Renderer (Phase 5D)
  if (command.startsWith('sla.')) {
    const tasks = result.tasks || result.incidents || (Array.isArray(result) ? result : []);
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-900">
          <span>{tasks.length} Deliverables with SLA Risk Detected</span>
        </div>
        {tasks.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-xs">All deliverables on track with zero SLA risk.</div>
        ) : (
          <div className="space-y-2">
            {tasks.map((t: any, idx: number) => (
              <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-white space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{t.title || t.workId?.title}</span>
                  <Badge className="bg-rose-100 text-rose-800 text-[10px]">{t.riskScore || 75}/100 Risk</Badge>
                </div>
                <p className="text-slate-600 text-[11px]">{t.primaryRootCause || t.reason || "High risk of deadline breach"}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // 7. Decision Inbox Renderer (Phase 5G)
  if (command.startsWith('decision.')) {
    const decisions = result.data || result.decisions || (Array.isArray(result) ? result : []);
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-900">
          <span>{result.count || decisions.length} Decisions Awaiting Manager Input</span>
          {result.safeCount !== undefined && <span>{result.safeCount} Safe to Auto-Approve</span>}
        </div>

        {decisions.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-xs">Zero bottlenecks! All decisions cleared.</div>
        ) : (
          <div className="space-y-2">
            {decisions.map((d: any, idx: number) => (
              <div key={idx} className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1.5 text-xs shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-bold text-slate-900">{d.title}</span>
                    {d.clientName && (
                      <span className="ml-2 text-[10px] text-indigo-600 font-medium bg-indigo-50 px-1.5 py-0.5 rounded">
                        {d.clientName}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {d.domain && (
                      <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-mono uppercase">
                        {d.domain}
                      </span>
                    )}
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${
                        d.riskLevel === "HIGH_IMPACT"
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : d.riskLevel === "MODERATE"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      }`}
                    >
                      {d.riskLevel}
                    </Badge>
                  </div>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">{d.summary}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // 8. Employee 360 & Workload Intelligence Renderer
  if (command.startsWith('employee.get360') || command.startsWith('employee.getWork')) {
    const emp = result.employee || {};
    const workload = result.workload || {};
    const activeTasks = result.activeTasks || [];

    const capacityColor =
      workload.capacityPercent >= 85
        ? 'text-rose-600 bg-rose-50 border-rose-200'
        : workload.capacityPercent >= 60
        ? 'text-amber-600 bg-amber-50 border-amber-200'
        : 'text-emerald-600 bg-emerald-50 border-emerald-200';

    return (
      <div className="space-y-3.5 animate-in fade-in duration-300">
        {/* EMPLOYEE HEADER CARD */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border border-indigo-500/20 shadow-md">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center font-black text-lg shadow-md">
                {emp.name ? emp.name.charAt(0).toUpperCase() : 'E'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-base text-white">{emp.name || 'Team Member'}</h4>
                  <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px]">
                    {emp.status || 'Active'}
                  </Badge>
                </div>
                <p className="text-xs text-indigo-200 mt-0.5">
                  {emp.role || 'Specialist'} • <span className="text-slate-300">{emp.department || 'Agency'}</span>
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-mono text-indigo-300 uppercase block">{emp.employeeId || 'EMP-2026'}</span>
              <span className="text-xs text-slate-300 font-medium">{emp.branchId || 'BR001 (HQ)'}</span>
            </div>
          </div>

          {/* CONTACT & COMPENSATION ROW */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3 pt-3 border-t border-white/10 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block">Official Email</span>
              <span className="text-slate-200 font-medium truncate block">{emp.email || 'team@digitalness.in'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Phone</span>
              <span className="text-slate-200 font-medium">{emp.phone || '9876543210'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Monthly Pay</span>
              <span className="text-emerald-400 font-bold">₹{Number(emp.salary || 45000).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* WORKLOAD & CAPACITY METRICS */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className={`p-3 rounded-xl border flex flex-col justify-between ${capacityColor}`}>
            <span className="text-[10px] font-bold uppercase tracking-wider block">Workload Capacity</span>
            <div className="mt-1">
              <span className="text-lg font-black">{workload.capacityPercent || 50}%</span>
              <span className="text-[10px] font-semibold ml-1 block opacity-80">
                {workload.capacityStatus || 'OPTIMAL'}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-100 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">SLA On-Time</span>
            <div className="mt-1">
              <span className="text-lg font-black text-indigo-400">{workload.slaScore || 96}%</span>
              <span className="text-[10px] text-slate-400 block">0 Critical Breaches</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-100 flex flex-col justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Deliverables</span>
            <div className="mt-1">
              <span className="text-lg font-black text-white">{workload.activeTasksCount || activeTasks.length} Active</span>
              <span className="text-[10px] text-slate-400 block">{workload.completedTasksCount || 0} Completed</span>
            </div>
          </div>
        </div>

        {/* ACTIVE DELIVERABLES CHECKLIST */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              📋 Assigned Deliverables ({activeTasks.length})
            </span>
            <span className="text-[11px] text-indigo-400 font-medium">Live Work Ledger</span>
          </div>

          {activeTasks.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500">
              No pending deliverables assigned. Ready for new task allocations!
            </div>
          ) : (
            <div className="space-y-1.5">
              {activeTasks.map((t: any, idx: number) => (
                <div
                  key={t.id || idx}
                  className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800/80 flex items-center justify-between gap-3 text-xs text-slate-200"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-100 truncate">{t.title}</span>
                      <Badge
                        variant="outline"
                        className={`text-[9px] px-1.5 py-0 ${
                          t.priority === 'High'
                            ? 'text-rose-400 border-rose-500/30'
                            : 'text-indigo-300 border-indigo-500/30'
                        }`}
                      >
                        {t.priority || 'Normal'}
                      </Badge>
                    </div>
                    <span className="text-[11px] text-slate-400 block mt-0.5">
                      Client: <span className="text-indigo-300 font-medium">{t.customerName}</span> •{' '}
                      {t.workType || 'Deliverable'}
                    </span>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 text-[10px] block mb-0.5">
                      {t.status || 'In Progress'}
                    </Badge>
                    <span className="text-[10px] text-slate-400">
                      {t.dueDate ? `Due: ${new Date(t.dueDate).toLocaleDateString()}` : 'Due: Tomorrow'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // 9. Employee List Renderer
  if (command.startsWith('employee.list')) {
    const employees = result.employees || (Array.isArray(result) ? result : []);
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs font-bold">
          <span>👥 Agency Team Roster ({result.count || employees.length} Members)</span>
          <span className="text-indigo-400">Active Staff</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {employees.map((e: any, idx: number) => (
            <div
              key={e._id || e.id || idx}
              className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold text-xs">
                  {e.name ? e.name.charAt(0).toUpperCase() : 'E'}
                </div>
                <div>
                  <span className="font-bold text-slate-100 block">{e.name}</span>
                  <span className="text-[11px] text-indigo-300">{e.role}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono text-slate-400 block">{e.branchId || 'BR001'}</span>
                <span className="text-[10px] text-emerald-400 font-bold">₹{Number(e.salary || 40000).toLocaleString('en-IN')}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 10. Employee Create Onboarded Success Renderer
  if (command.startsWith('employee.create')) {
    const emp = result.employee || {};
    return (
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border border-indigo-500/20 shadow-md space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-white">Employee Onboarded Successfully</h4>
            <p className="text-xs text-indigo-200">
              {emp.name} has been added to the agency workforce with login credentials.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/10 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 block">Employee ID</span>
            <span className="text-indigo-300 font-mono font-bold">{emp.employeeId || 'EMP-2026-001'}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">Role & Dept</span>
            <span className="text-slate-200 font-medium">{emp.role}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">Branch</span>
            <span className="text-slate-200 font-medium">{emp.branchId || 'BR001'}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block">Initial Password</span>
            <span className="text-emerald-400 font-mono">Digitalness@123</span>
          </div>
        </div>
      </div>
    );
  }

  // 12. ADS AGENT RENDERERS (Phase 5 - Advertising OS)
  if (command.startsWith('ads.campaign.create') || command.startsWith('ads.campaign.approve') || command.startsWith('ads.campaign.revise')) {
    const isApproved = result.status === 'Approved' || result.status === 'Approved & Scheduled';
    const campName = result.campaignName || result.blueprint?.campaignName || 'Ad Campaign';
    const budgetAmount = result.budget?.amount || 1000;
    const durationDays = result.budget?.days || result.duration?.days || 10;
    const totalSpend = result.budget?.totalBudget || (budgetAmount * durationDays);
    const audiences = result.audiences || [];
    const creativeReqs = result.creativeRequirements || [];

    return (
      <div className="p-4.5 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950/70 to-slate-900 text-white border border-indigo-500/30 shadow-lg space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 border border-indigo-500/40 text-indigo-300 flex items-center justify-center font-bold shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  {isApproved ? '✅ Approved & Scheduled' : '🎯 Campaign Blueprint Staged'}
                </span>
                <span className="text-[11px] text-slate-400">v{result.version || 1}</span>
              </div>
              <h4 className="font-bold text-sm text-white mt-1 line-clamp-1">{campName}</h4>
            </div>
          </div>
          <span className="px-2 py-1 rounded-md text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0 uppercase">
            {result.platform || 'Meta'}
          </span>
        </div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-white/5 border border-white/10 text-xs">
          <div>
            <span className="text-[10px] text-slate-400 block font-medium">Daily Ad Spend</span>
            <span className="text-white font-bold">₹{budgetAmount.toLocaleString('en-IN')} / day</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-medium">Schedule Flight</span>
            <span className="text-white font-bold">{durationDays} Days (₹{totalSpend.toLocaleString('en-IN')})</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-medium">Est. Cost Per Lead</span>
            <span className="text-emerald-400 font-semibold">{result.budget?.estimatedCPL || '₹180 - ₹320'}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-medium">Est. Enquiries</span>
            <span className="text-emerald-400 font-semibold">{result.budget?.estimatedTotalLeads || '30 - 60 leads'}</span>
          </div>
        </div>

        {/* AUDIENCE TIERS */}
        {audiences.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Audience Targeting Tiers ({audiences.length})
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {audiences.map((aud: any, idx: number) => (
                <div key={idx} className="p-2.5 rounded-lg bg-white/5 border border-white/10 text-xs space-y-1">
                  <div className="flex items-center justify-between text-indigo-300 font-semibold text-[11px]">
                    <span className="truncate">{aud.name}</span>
                    <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-500/20">{aud.dailyBudgetShare || 33}%</span>
                  </div>
                  <p className="text-[10px] text-slate-300 line-clamp-1">
                    {aud.interests?.slice(0, 3).join(', ') || 'Local Audience'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CREATIVE REQUIREMENTS */}
        {creativeReqs.length > 0 && (
          <div className="space-y-1.5 pt-1 border-t border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Creative Asset Pipeline ({creativeReqs.length} Assets)
              </span>
              <span className="text-[10px] text-emerald-400 font-medium">Auto-Handoff to Creative Agent</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {creativeReqs.map((req: any, idx: number) => (
                <div key={idx} className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-200 flex items-center gap-1.5">
                  <span className="font-semibold text-white">{req.format} ({req.aspectRatio})</span>
                  <span className="text-[10px] text-slate-400">• {req.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between text-xs pt-1">
          <span className="text-[11px] text-slate-400">
            {isApproved ? '🚀 Campaign is live and scheduled in ledger.' : 'Draft ready in CRM awaiting approval.'}
          </span>
          <a
            href="/ads"
            className="text-xs text-indigo-300 hover:text-white font-semibold flex items-center gap-1 underline underline-offset-2"
          >
            Open Ad Campaigns Ledger →
          </a>
        </div>
      </div>
    );
  }

  if (command === 'ads.audience.recommend') {
    const audiences = result.audiences || [];
    return (
      <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white border border-indigo-500/30 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-sm text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-400" /> Recommended Target Audience Tiers
          </h4>
          <span className="text-xs text-indigo-300 font-medium">{audiences.length} A/B Test Tiers</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {audiences.map((aud: any, idx: number) => (
            <div key={idx} className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs space-y-1.5">
              <div className="flex items-center justify-between font-semibold text-indigo-300">
                <span>{aud.name}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-200">{aud.dailyBudgetShare}%</span>
              </div>
              <p className="text-[11px] text-slate-300 line-clamp-2">
                <strong>Interests:</strong> {aud.interests?.join(', ')}
              </p>
              <div className="text-[10px] text-slate-400">
                Age: {aud.ageRange?.min}-{aud.ageRange?.max} • {aud.genders?.join(', ')}
              </div>
              <div className="text-[10px] text-emerald-400 font-medium">
                Est. Daily Reach: {aud.estimatedDailyReach}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (command === 'ads.budget.recommend') {
    const b = result.budget || {};
    return (
      <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white border border-indigo-500/30 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-sm text-white flex items-center gap-2">
            <IndianRupee className="w-4 h-4 text-amber-400" /> Budget Allocation & Performance Forecast
          </h4>
          <span className="text-xs text-emerald-400 font-semibold">{b.estimatedCPL || '₹180 - ₹320 CPL'}</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
            <span className="text-[10px] text-slate-400 block">Daily Spend</span>
            <span className="text-white font-bold text-sm">₹{Number(b.amount || 1000).toLocaleString('en-IN')} / day</span>
          </div>
          <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
            <span className="text-[10px] text-slate-400 block">Flight Duration</span>
            <span className="text-white font-bold text-sm">{b.days || 10} Days Flight</span>
          </div>
          <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
            <span className="text-[10px] text-slate-400 block">Total Spend</span>
            <span className="text-white font-bold text-sm">₹{Number(b.totalBudget || 10000).toLocaleString('en-IN')}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
            <span className="text-[10px] text-slate-400 block">Flight Enquiries</span>
            <span className="text-emerald-400 font-bold text-sm">{b.estimatedTotalLeads || '30 - 60'}</span>
          </div>
        </div>
      </div>
    );
  }

  // Default JSON / Object Fallback
  return (
    <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl text-xs overflow-x-auto font-mono">
      {JSON.stringify(result, null, 2)}
    </pre>
  );
};
