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
        </div>
      </div>
    </div>
  );
}