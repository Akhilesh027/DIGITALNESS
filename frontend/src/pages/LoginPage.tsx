import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck, UserCheck, KeyRound, Copy, Check, Zap } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const API_URL = import.meta.env.VITE_API_URL || "https://server.digitalness.co.in/api";

const roleRoutes: Record<string, string> = {
  Admin: "/dashboard",
  "Operational Manager": "/employees",
  "Performance Marketer": "/performance",
  "Content Writer": "/tasks",
  "Graphic Designer": "/tasks",
  "UI/UX": "/works",
  Telecaller: "/leads",
  "Frontend Dev": "/works",
  "Backend Dev": "/works",
  BDE: "/leads",
  Support: "/tickets",
};

const DEMO_ACCOUNTS = [
  {
    roleName: "Super Admin",
    badge: "Admin",
    email: "admin@digitalness.com",
    password: "Admin@123456",
    icon: ShieldCheck,
    color: "bg-purple-50 text-purple-700 border-purple-200",
  },
  {
    roleName: "Operations Manager",
    badge: "Manager",
    email: "manager@digitalness.com",
    password: "Manager@123456",
    icon: UserCheck,
    color: "bg-blue-50 text-blue-700 border-blue-200",
  },
  {
    roleName: "Agency Admin",
    badge: "Agency",
    email: "admin@digitalness.agency",
    password: "Agency123!",
    icon: KeyRound,
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const saveAuthData = (data: any) => {
    localStorage.setItem("token", data.token);
    localStorage.setItem("authToken", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    localStorage.setItem("currentUser", JSON.stringify(data.user));

    if (data.attendance) {
      localStorage.setItem("todayAttendance", JSON.stringify(data.attendance));
    }
  };

  const executeLogin = async (loginEmail: string, loginPass: string) => {
    const cleanEmail = loginEmail.trim().toLowerCase();

    if (!cleanEmail || !loginPass) {
      toast({
        title: "Missing Details",
        description: "Please enter email and password",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: cleanEmail,
          password: loginPass,
          deviceInfo: navigator.userAgent,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast({
          title: "Login Failed",
          description: data.message || "Invalid email or password",
          variant: "destructive",
        });
        return;
      }

      if (!data.token || !data.user) {
        toast({
          title: "Login Failed",
          description: "Invalid login response from server",
          variant: "destructive",
        });
        return;
      }

      saveAuthData(data);

      toast({
        title: "Login Successful",
        description: data.attendance?.loginTime
          ? `Welcome ${data.user.name}. Attendance marked.`
          : `Welcome ${data.user.name}`,
      });

      const redirectPath = roleRoutes[data.user.role] || "/dashboard";

      navigate(redirectPath, { replace: true });
    } catch (error) {
      toast({
        title: "Server Error",
        description: "Unable to connect to backend server",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    executeLogin(email, password);
  };

  const handleFillCredentials = (accEmail: string, accPass: string) => {
    setEmail(accEmail);
    setPassword(accPass);
    toast({
      title: "Credentials Filled",
      description: `Filled: ${accEmail}`,
    });
  };

  const handleQuickLogin = (accEmail: string, accPass: string) => {
    setEmail(accEmail);
    setPassword(accPass);
    executeLogin(accEmail, accPass);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    toast({ title: "Copied!", description: `${label} copied to clipboard` });
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleEnterKey = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      handleLogin();
    }
  };

  return (
    <div className="min-h-screen bg-[#06053A] flex items-center justify-center p-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white shadow-2xl overflow-hidden">
        <div className="bg-[#06053A] px-6 py-7 text-white">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
            <Lock className="h-7 w-7" />
          </div>

          <h1 className="text-center text-2xl font-bold">
            Digitalness CRM
          </h1>
          <p className="mt-2 text-center text-sm text-white/70">
            Login to manage leads, works, reports and attendance
          </p>
        </div>

        <div className="space-y-5 p-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                disabled={loading}
                onKeyDown={handleEnterKey}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                disabled={loading}
                onKeyDown={handleEnterKey}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10"
              />
              <button
                type="button"
                disabled={loading}
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <Button
            onClick={handleLogin}
            className="w-full bg-[#06053A] hover:bg-[#0d0b60] h-11 font-semibold"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Logging in...
              </>
            ) : (
              "Login"
            )}
          </Button>

          {/* Quick Demo Credentials Section */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <Zap className="h-4 w-4 text-amber-500" />
                <span>Demo Accounts & Quick Fill</span>
              </div>
              <span className="text-[10px] text-slate-400">Click to fill or login</span>
            </div>

            <div className="space-y-2">
              {DEMO_ACCOUNTS.map((acc) => {
                const IconComp = acc.icon;
                return (
                  <div
                    key={acc.email}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl border bg-white shadow-xs hover:border-slate-300 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <IconComp className="h-4 w-4 text-slate-500 shrink-0" />
                        <span className="text-xs font-bold text-slate-800">{acc.roleName}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium border ${acc.color}`}>
                          {acc.badge}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-[11px] font-mono text-slate-600 truncate">
                        <span>{acc.email}</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(acc.email, `${acc.roleName} Email`)}
                          title="Copy Email"
                          className="text-slate-400 hover:text-slate-600"
                        >
                          {copiedText === acc.email ? (
                            <Check className="h-3 w-3 text-emerald-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                        <span className="text-slate-300">|</span>
                        <span>{acc.password}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 pt-1 sm:pt-0">
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => handleFillCredentials(acc.email, acc.password)}
                        className="px-2.5 py-1 text-[11px] font-medium rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors"
                      >
                        Fill
                      </button>
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => handleQuickLogin(acc.email, acc.password)}
                        className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-[#06053A] text-white hover:bg-[#0d0b60] transition-colors flex items-center gap-1"
                      >
                        <Zap className="h-3 w-3 text-amber-400" />
                        Login
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4 text-xs text-slate-500 border border-slate-100">
            <p className="font-medium text-slate-700">Attendance Note</p>
            <p className="mt-1">
              Your login time will be automatically recorded after successful
              login. Logout time will be recorded when you logout from CRM.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}