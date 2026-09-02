import { useState, useEffect } from "react";
import {
  Globe,
  CheckCircle2,
  AlertCircle,
  Plus,
  RefreshCw,
  Trash2,
  Lock,
  Share2,
  Instagram,
  Facebook,
  ShieldCheck,
  Activity,
  AlertTriangle,
  Layers,
  MessageSquare,
  DollarSign,
  Palette,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  getMarketingConnections,
  connectPlatformAccount,
  disconnectPlatformAccount,
  checkConnectionHealth,
  startMetaOAuth,
  getMetaDiscoverySession,
  confirmMetaAssets,
  MarketingConnectionItem,
  ConnectionHealth,
} from "../api/marketingConnectionApi";

interface Props {
  customerId: string;
  locations?: any[];
}

const statusBadgeStyles: Record<string, { label: string; style: string }> = {
  CONNECTED: { label: "Connected", style: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  Connected: { label: "Connected", style: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  EXPIRED: { label: "Token Expired", style: "bg-amber-100 text-amber-800 border-amber-300 animate-pulse" },
  Expired: { label: "Token Expired", style: "bg-amber-100 text-amber-800 border-amber-300" },
  REAUTH_REQUIRED: { label: "Re-Auth Required", style: "bg-rose-100 text-rose-800 border-rose-300 animate-pulse" },
  ERROR: { label: "Connection Error", style: "bg-rose-100 text-rose-800 border-rose-300" },
  Error: { label: "Connection Error", style: "bg-rose-100 text-rose-800 border-rose-300" },
  DISCONNECTED: { label: "Disconnected", style: "bg-slate-100 text-slate-700 border-slate-300" },
  Disconnected: { label: "Disconnected", style: "bg-slate-100 text-slate-700 border-slate-300" },
  REVOKED: { label: "Credentials Revoked", style: "bg-slate-100 text-slate-700 border-slate-300" },
};

export default function MarketingConnectionsPanel({ customerId, locations = [] }: Props) {
  const { toast } = useToast();
  const [connections, setConnections] = useState<MarketingConnectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [healthMap, setHealthMap] = useState<Record<string, ConnectionHealth>>({});
  const [checkingHealthId, setCheckingHealthId] = useState<string | null>(null);

  // Meta OAuth Discovery Session State
  const [metaDiscoveryModal, setMetaDiscoveryModal] = useState(false);
  const [discoverySession, setDiscoverySession] = useState<any>(null);
  const [selectedMetaAssets, setSelectedMetaAssets] = useState<{
    locationId: string;
    facebookPageId: string;
    instagramBusinessAccountId: string;
    metaAdAccountId: string;
  }>({
    locationId: "",
    facebookPageId: "",
    instagramBusinessAccountId: "",
    metaAdAccountId: "",
  });

  // Form for simulated OAuth Connect (Legacy/Dev Bridge)
  const [connectForm, setConnectForm] = useState({
    locationId: "",
    platform: "Meta",
    accountType: "FacebookPage",
    platformAccountId: "",
    platformAccountName: "",
    accessToken: "eaab_mock_token_" + Math.random().toString(36).substring(7),
  });

  const loadConnections = async () => {
    try {
      setLoading(true);
      const data = await getMarketingConnections(customerId);
      setConnections(data || []);
    } catch (err: any) {
      console.error("Failed to load connections:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (customerId) loadConnections();

    // Check for returned OAuth discovery session in URL
    const urlParams = new URLSearchParams(window.location.search);
    const metaSessionId = urlParams.get("metaDiscoverySession");
    if (metaSessionId) {
      getMetaDiscoverySession(metaSessionId)
        .then((sessionData) => {
          setDiscoverySession(sessionData);
          setMetaDiscoveryModal(true);
        })
        .catch((err) => {
          toast({ title: "Session Expired", description: "Meta discovery session has expired.", variant: "destructive" });
        });
    }
  }, [customerId]);

  const handleStartMetaOAuth = async (locationId?: string) => {
    try {
      setSubmitting(true);
      const res = await startMetaOAuth(customerId, locationId);
      if (res?.authUrl) {
        window.location.href = res.authUrl;
      }
    } catch (err: any) {
      toast({ title: "Meta Connect Failed", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmMetaSelection = async () => {
    if (!discoverySession) return;
    try {
      setSubmitting(true);
      await confirmMetaAssets({
        discoverySessionId: discoverySession.sessionId,
        customerId,
        locationId: selectedMetaAssets.locationId || undefined,
        selectedAssets: {
          facebookPageId: selectedMetaAssets.facebookPageId || undefined,
          instagramBusinessAccountId: selectedMetaAssets.instagramBusinessAccountId || undefined,
          metaAdAccountId: selectedMetaAssets.metaAdAccountId || undefined,
        },
      });

      toast({ title: "Meta Connected", description: "Selected Facebook, Instagram, and Ad accounts connected successfully!" });
      setMetaDiscoveryModal(false);
      loadConnections();
    } catch (err: any) {
      toast({ title: "Confirmation Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleConnect = async () => {
    try {
      setSubmitting(true);
      if (!connectForm.platformAccountId || !connectForm.platformAccountName) {
        toast({ title: "Validation Error", description: "Account ID and Name are required", variant: "destructive" });
        return;
      }

      await connectPlatformAccount({
        customerId,
        locationId: connectForm.locationId || undefined,
        platform: connectForm.platform,
        accountType: connectForm.accountType,
        platformAccountId: connectForm.platformAccountId,
        platformAccountName: connectForm.platformAccountName,
        accessToken: connectForm.accessToken,
        scopes: ["pages_manage_posts", "instagram_basic", "instagram_content_publish"],
      });

      toast({ title: "Connected", description: `${connectForm.platformAccountName} connected successfully!` });
      setOpenModal(false);
      loadConnections();
    } catch (err: any) {
      toast({ title: "Connection Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDisconnect = async (id: string, name: string) => {
    try {
      await disconnectPlatformAccount(id);
      toast({ title: "Disconnected", description: `${name} credentials have been revoked.` });
      loadConnections();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleCheckHealth = async (connId: string) => {
    try {
      setCheckingHealthId(connId);
      const health = await checkConnectionHealth(connId);
      setHealthMap((prev) => ({ ...prev, [connId]: health }));
      if (health.healthy) {
        toast({ title: "Connection Healthy", description: "All permissions and tokens are valid." });
      } else {
        toast({
          title: "Connection Attention Required",
          description: `Issues: ${health.issues.join(", ")}`,
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({ title: "Health Check Failed", description: err.message, variant: "destructive" });
    } finally {
      setCheckingHealthId(null);
    }
  };

  const getPlatformIcon = (platform: string, accountType: string) => {
    if (accountType === "InstagramBusiness" || platform === "Instagram") {
      return <Instagram className="h-5 w-5 text-rose-600" />;
    }
    if (accountType === "FacebookPage" || platform === "Facebook") {
      return <Facebook className="h-5 w-5 text-blue-600" />;
    }
    if (platform === "GoogleAds" || platform === "GoogleBusiness") {
      return <Globe className="h-5 w-5 text-amber-600" />;
    }
    if (platform === "WhatsApp") {
      return <MessageSquare className="h-5 w-5 text-emerald-600" />;
    }
    if (platform === "Canva") {
      return <Palette className="h-5 w-5 text-cyan-600" />;
    }
    if (platform === "Razorpay") {
      return <DollarSign className="h-5 w-5 text-indigo-600" />;
    }
    return <Share2 className="h-5 w-5 text-indigo-600" />;
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
        <div>
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Globe className="h-4 w-4 text-indigo-600" /> Integration & Marketing Connections
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage multi-tenant Meta (Facebook & Instagram), Google, WhatsApp, and Payment connections per client branch location.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            onClick={() => handleStartMetaOAuth()}
            className="bg-blue-600 hover:bg-blue-700 text-xs gap-1.5 text-white shadow-sm"
          >
            <Facebook className="h-3.5 w-3.5" /> Connect Meta (FB & IG)
          </Button>

          <Button
            size="sm"
            onClick={async () => {
              try {
                const res = await startGoogleBusinessOAuth(customerId, locationId);
                if (res.authUrl) {
                  window.location.href = res.authUrl;
                }
              } catch (err: any) {
                toast({ title: "Google OAuth Error", description: err.message, variant: "destructive" });
              }
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-xs gap-1.5 text-white shadow-sm"
          >
            <Globe className="h-3.5 w-3.5" /> Connect Google Business
          </Button>

          <Button size="sm" variant="outline" onClick={() => setOpenModal(true)} className="text-xs gap-1">
            <Plus className="h-3.5 w-3.5" /> Other Connections
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-6 text-xs text-slate-400">Loading Connections...</div>
      ) : connections.length === 0 ? (
        <div className="p-6 text-center border-2 border-dashed rounded-xl bg-slate-50 space-y-2">
          <Share2 className="h-8 w-8 text-slate-300 mx-auto" />
          <p className="text-xs font-semibold text-slate-600">No Active Platform Accounts Connected</p>
          <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
            Connect Facebook Pages, Instagram Business, Google Business Profiles, or WhatsApp accounts to enable automated workflows.
          </p>
          <Button size="sm" onClick={() => handleStartMetaOAuth()} className="bg-blue-600 text-xs mt-2 text-white">
            <Facebook className="h-3.5 w-3.5 mr-1" /> Connect Meta First
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {connections.map((conn) => {
            const badge = statusBadgeStyles[conn.status] || statusBadgeStyles.CONNECTED;
            const health = healthMap[conn._id];

            return (
              <div key={conn._id} className="p-3.5 border rounded-xl bg-slate-50 flex flex-col justify-between gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-indigo-100 text-indigo-700 shrink-0 mt-0.5">
                      {getPlatformIcon(conn.platform, conn.accountType)}
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-bold text-slate-900 text-xs">{conn.platformAccountName}</span>
                        <Badge variant="outline" className={`text-[10px] py-0 px-1.5 ${badge.style}`}>
                          {badge.label}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                        <span>Platform: <strong className="text-slate-700">{conn.platform}</strong></span>
                        <span>Type: <strong className="text-slate-700">{conn.accountType}</strong></span>
                        {conn.locationId && (
                          <span>Branch: <strong className="text-slate-700">{conn.locationId.name}</strong></span>
                        )}
                      </div>

                      {conn.scopes && conn.scopes.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {conn.scopes.slice(0, 3).map((scope, i) => (
                            <span key={i} className="text-[9px] bg-slate-200/70 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                              {scope}
                            </span>
                          ))}
                          {conn.scopes.length > 3 && (
                            <span className="text-[9px] text-slate-400 font-mono">+{conn.scopes.length - 3} more</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCheckHealth(conn._id)}
                      disabled={checkingHealthId === conn._id}
                      className="h-7 w-7 p-0 text-slate-500 hover:text-indigo-600"
                    >
                      <Activity className={`h-3.5 w-3.5 ${checkingHealthId === conn._id ? "animate-spin text-indigo-600" : ""}`} />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDisconnect(conn._id, conn.platformAccountName)}
                      className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>

                {health && !health.healthy && (
                  <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[11px] flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-rose-600" />
                    <span>{health.issues.join(", ")}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Meta Discovered Assets Selection Modal */}
      <Dialog open={metaDiscoveryModal} onOpenChange={setMetaDiscoveryModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <Facebook className="h-4 w-4 text-blue-600" /> Connect Discovered Meta Assets
            </DialogTitle>
            <DialogDescription className="text-xs">
              Select which discovered Facebook Pages, linked Instagram accounts, and Ad Accounts belong to this client branch.
            </DialogDescription>
          </DialogHeader>

          {discoverySession && (
            <div className="space-y-4 pt-2">
              <div>
                <label className="text-xs font-semibold text-slate-700">Assign to Branch Location</label>
                <select
                  value={selectedMetaAssets.locationId}
                  onChange={(e) => setSelectedMetaAssets({ ...selectedMetaAssets, locationId: e.target.value })}
                  className="w-full mt-1 text-xs p-2 border rounded-md bg-white"
                >
                  <option value="">Master / All Locations</option>
                  {locations.map((loc) => (
                    <option key={loc._id} value={loc._id}>
                      {loc.name} ({loc.city})
                    </option>
                  ))}
                </select>
              </div>

              {/* Facebook Pages */}
              <div>
                <label className="text-xs font-semibold text-slate-700">Select Facebook Page</label>
                <select
                  value={selectedMetaAssets.facebookPageId}
                  onChange={(e) => {
                    const pId = e.target.value;
                    const page = discoverySession.pages?.find((p: any) => p.pageId === pId);
                    setSelectedMetaAssets({
                      ...selectedMetaAssets,
                      facebookPageId: pId,
                      instagramBusinessAccountId: page?.instagramBusinessAccountId || "",
                    });
                  }}
                  className="w-full mt-1 text-xs p-2 border rounded-md bg-white"
                >
                  <option value="">Do not connect Facebook Page</option>
                  {discoverySession.pages?.map((p: any) => (
                    <option key={p.pageId} value={p.pageId}>
                      {p.name} {p.hasInstagram ? `(Linked to @${p.instagramUsername || "IG"})` : "(No IG linked)"}
                    </option>
                  ))}
                </select>
              </div>

              {/* Instagram Accounts */}
              <div>
                <label className="text-xs font-semibold text-slate-700">Linked Instagram Professional Account</label>
                <select
                  value={selectedMetaAssets.instagramBusinessAccountId}
                  onChange={(e) => setSelectedMetaAssets({ ...selectedMetaAssets, instagramBusinessAccountId: e.target.value })}
                  className="w-full mt-1 text-xs p-2 border rounded-md bg-white"
                >
                  <option value="">Do not connect Instagram</option>
                  {discoverySession.pages
                    ?.filter((p: any) => p.hasInstagram)
                    .map((p: any) => (
                      <option key={p.instagramBusinessAccountId} value={p.instagramBusinessAccountId}>
                        @{p.instagramUsername || p.name} (via {p.name})
                      </option>
                    ))}
                </select>
              </div>

              {/* Ad Accounts */}
              <div>
                <label className="text-xs font-semibold text-slate-700">Meta Ad Account</label>
                <select
                  value={selectedMetaAssets.metaAdAccountId}
                  onChange={(e) => setSelectedMetaAssets({ ...selectedMetaAssets, metaAdAccountId: e.target.value })}
                  className="w-full mt-1 text-xs p-2 border rounded-md bg-white"
                >
                  <option value="">Do not connect Ad Account</option>
                  {discoverySession.adAccounts?.map((ad: any) => (
                    <option key={ad.adAccountId} value={ad.adAccountId}>
                      {ad.name} ({ad.currency})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t">
                <Button variant="outline" onClick={() => setMetaDiscoveryModal(false)} className="text-xs">
                  Cancel
                </Button>
                <Button onClick={handleConfirmMetaSelection} disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-xs text-white">
                  {submitting ? "Saving Connections..." : "Confirm & Save Connections"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Manual / Legacy Connection Modal */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <Plus className="h-4 w-4 text-indigo-600" /> Connect Platform Account
            </DialogTitle>
            <DialogDescription className="text-xs">
              Direct connection gateway for Google Business Profile, WhatsApp, Canva, and Razorpay.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-semibold text-slate-700">Target Location</label>
              <select
                value={connectForm.locationId}
                onChange={(e) => setConnectForm({ ...connectForm, locationId: e.target.value })}
                className="w-full mt-1 text-xs p-2 border rounded-md bg-white"
              >
                <option value="">All Locations / Master Account</option>
                {locations.map((loc) => (
                  <option key={loc._id} value={loc._id}>
                    {loc.name} ({loc.city})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Platform</label>
                <select
                  value={connectForm.platform}
                  onChange={(e) => {
                    const plat = e.target.value;
                    let defaultAcc = "FacebookPage";
                    if (plat === "Instagram") defaultAcc = "InstagramBusiness";
                    else if (plat === "GoogleAds") defaultAcc = "GoogleAdsAccount";
                    else if (plat === "GoogleBusiness") defaultAcc = "GBPLocation";
                    else if (plat === "WhatsApp") defaultAcc = "WhatsAppPhoneNumber";
                    else if (plat === "Canva") defaultAcc = "CanvaAccount";
                    else if (plat === "Razorpay") defaultAcc = "RazorpayAccount";
                    setConnectForm({ ...connectForm, platform: plat, accountType: defaultAcc });
                  }}
                  className="w-full mt-1 text-xs p-2 border rounded-md bg-white"
                >
                  <option value="GoogleBusiness">Google Business Profile</option>
                  <option value="GoogleAds">Google Ads</option>
                  <option value="WhatsApp">WhatsApp Business</option>
                  <option value="Canva">Canva Connect</option>
                  <option value="Razorpay">Razorpay Payments</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700">Account Type</label>
                <Input
                  value={connectForm.accountType}
                  onChange={(e) => setConnectForm({ ...connectForm, accountType: e.target.value })}
                  className="mt-1 text-xs"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Platform Account Name *</label>
              <Input
                value={connectForm.platformAccountName}
                onChange={(e) => setConnectForm({ ...connectForm, platformAccountName: e.target.value })}
                placeholder="e.g. ApexBee Official Branch"
                className="mt-1 text-xs"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">Platform Account ID *</label>
              <Input
                value={connectForm.platformAccountId}
                onChange={(e) => setConnectForm({ ...connectForm, platformAccountId: e.target.value })}
                placeholder="e.g. act_109283748201 or page_998822"
                className="mt-1 text-xs"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpenModal(false)} className="text-xs">
                Cancel
              </Button>
              <Button onClick={handleConnect} disabled={submitting} className="bg-indigo-600 text-xs">
                {submitting ? "Connecting..." : "Authorize & Connect"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
