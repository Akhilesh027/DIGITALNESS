import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";

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
  Client: "/client-portal",
};

export default function LoginPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

  const handleEnterKey = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      handleLogin();
    }
  };

  return (
    <div className="relative min-h-screen bg-[#070A1C] flex items-center justify-center p-4 py-12 overflow-hidden select-none">
      {/* Dynamic Background Ambient Gradients */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#FF1B7A]/20 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#00D8F6]/20 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#7928CA]/10 rounded-full blur-[160px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-white/95 dark:bg-[#0E1330]/95 backdrop-blur-2xl shadow-2xl shadow-black/50 overflow-hidden transition-all">
        {/* Brand Banner with Official Logo */}
        <div className="relative bg-gradient-to-b from-[#0A0D28] to-[#0F1438] px-8 py-9 text-center border-b border-white/10">
          <div className="mx-auto mb-4 flex h-14 max-w-[220px] items-center justify-center rounded-2xl bg-white/5 p-2 border border-white/10 shadow-inner">
            <img
              src="/logo.png"
              alt="Digitalness Logo"
              className="h-full w-auto object-contain filter drop-shadow-md"
            />
          </div>

          <h1 className="text-xl font-heading font-bold text-white tracking-tight">
            Digital Marketing CRM
          </h1>
          <p className="mt-1 text-xs text-slate-300 font-medium">
            Grow your business with digitalness <span className="text-[#FF1B7A]">︽</span>
          </p>
        </div>

        {/* Login Form */}
        <div className="space-y-5 p-7">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Staff Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="email"
                placeholder="name@digitalness.co.in"
                value={email}
                disabled={loading}
                onKeyDown={handleEnterKey}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 h-11 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:border-[#FF1B7A] focus:ring-[#FF1B7A]/20 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••••••"
                value={password}
                disabled={loading}
                onKeyDown={handleEnterKey}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 h-11 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 focus:border-[#FF1B7A] focus:ring-[#FF1B7A]/20 text-sm font-mono"
              />
              <button
                type="button"
                disabled={loading}
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
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
            className="w-full h-11 font-bold rounded-xl bg-gradient-to-r from-[#FF1B7A] via-[#7928CA] to-[#00D8F6] hover:opacity-90 text-white shadow-lg shadow-[#FF1B7A]/25 transition-all text-sm tracking-wide"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Authenticating...
              </>
            ) : (
              "Sign In to Workspace"
            )}
          </Button>

          <p className="text-center text-[11px] text-slate-500 font-medium">
            Authorized Personnel Only • Digitalness Security Layer
          </p>
        </div>
      </div>
    </div>
  );
}