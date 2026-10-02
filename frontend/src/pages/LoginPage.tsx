import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Loader2, Lock, Mail, UserCheck, ShieldCheck, ExternalLink, Briefcase } from "lucide-react";

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

interface LoginPageProps {
  initialMode?: "staff" | "client";
}

export default function LoginPage({ initialMode }: LoginPageProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const queryMode = searchParams.get("mode") === "client" ? "client" : undefined;
  const [loginMode, setLoginMode] = useState<"staff" | "client">(
    initialMode || queryMode || "staff"
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (initialMode) {
      setLoginMode(initialMode);
    }
  }, [initialMode]);

  const saveAuthData = (data: any) => {
    localStorage.setItem("token", data.token);
    localStorage.setItem("authToken", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    localStorage.setItem("currentUser", JSON.stringify(data.user));

    if (data.attendance) {
      localStorage.setItem("todayAttendance", JSON.stringify(data.attendance));
    }
  };

  const saveClientAuthData = (data: any) => {
    localStorage.setItem("token", data.token);
    localStorage.setItem("authToken", data.token);
    localStorage.setItem("clientToken", data.token);

    const clientUser = {
      _id: data.client?._id,
      id: data.client?._id,
      name: data.client?.name || data.customer?.name || "Client",
      email: data.client?.email,
      phone: data.client?.phone,
      role: "Client",
      customerId: data.client?.customerId || data.customer?._id,
      customer: data.customer,
      branchId: data.client?.branchId || "BR001",
    };

    localStorage.setItem("user", JSON.stringify(clientUser));
    localStorage.setItem("currentUser", JSON.stringify(clientUser));
    localStorage.setItem("clientData", JSON.stringify(data.client || clientUser));
    if (data.customer) {
      localStorage.setItem("customerData", JSON.stringify(data.customer));
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

      if (loginMode === "client") {
        // CLIENT PORTAL LOGIN
        const res = await fetch(`${API_URL}/clients/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: cleanEmail,
            password: loginPass,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          toast({
            title: "Client Login Failed",
            description: data.message || "Invalid client email or password",
            variant: "destructive",
          });
          return;
        }

        if (!data.token) {
          toast({
            title: "Login Failed",
            description: "Invalid response from server",
            variant: "destructive",
          });
          return;
        }

        saveClientAuthData(data);

        toast({
          title: "Welcome to Client Portal",
          description: `Logged in as ${data.client?.name || "Client"}. Loading your portal...`,
        });

        navigate("/client-portal", { replace: true });
        return;
      }

      // STAFF LOGIN
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
    <div className="min-h-screen bg-[#06053A] flex items-center justify-center p-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white shadow-2xl overflow-hidden">
        {/* Toggle between Staff & Client Portal */}
        <div className="bg-[#04032d] px-6 pt-5 pb-3 border-b border-white/10">
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-white/10 border border-white/10">
            <button
              type="button"
              onClick={() => {
                setLoginMode("staff");
                setEmail("");
                setPassword("");
              }}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${loginMode === "staff"
                  ? "bg-white text-[#06053A] shadow-md"
                  : "text-white/70 hover:text-white hover:bg-white/5"
                }`}
            >
              <Briefcase className="h-3.5 w-3.5" />
              <span>Agency Staff</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginMode("client");
                setEmail("");
                setPassword("");
              }}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all ${loginMode === "client"
                  ? "bg-amber-400 text-slate-950 shadow-md font-extrabold"
                  : "text-white/70 hover:text-white hover:bg-white/5"
                }`}
            >
              <UserCheck className="h-3.5 w-3.5" />
              <span>Client Portal</span>
            </button>
          </div>
        </div>

        <div className="bg-[#06053A] px-6 py-6 text-white text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
            {loginMode === "client" ? (
              <ShieldCheck className="h-6 w-6 text-amber-400" />
            ) : (
              <Lock className="h-6 w-6 text-white" />
            )}
          </div>

          <h1 className="text-xl font-bold">
            {loginMode === "client" ? "Client Portal Login" : "Digitalness CRM"}
          </h1>
          <p className="mt-1 text-xs text-white/70">
            {loginMode === "client"
              ? "Sign in to securely access your proposals, invoices, works & payments"
              : "Login to manage leads, works, reports and attendance"}
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
                placeholder={loginMode === "client" ? "Enter client registered email" : "Enter staff email"}
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
            className={`w-full h-11 font-bold ${loginMode === "client"
                ? "bg-amber-400 hover:bg-amber-500 text-slate-950"
                : "bg-[#06053A] hover:bg-[#0d0b60] text-white"
              }`}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Authenticating...
              </>
            ) : loginMode === "client" ? (
              "Enter Client Portal"
            ) : (
              "Staff Login"
            )}
          </Button>

          {loginMode === "client" && (
            <div className="pt-2 text-center border-t border-slate-100">
              <a
                href="http://localhost:5174"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-amber-600 font-semibold transition"
              >
                <span>Open Standalone Client App (Port 5174)</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}