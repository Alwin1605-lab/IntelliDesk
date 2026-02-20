import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, LogIn, Loader2, Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import useAuthStore from "@/stores/authStore";
import { authAPI } from "@/api/auth";
import { toast } from "sonner";

const mockAuthEnabled = import.meta.env.VITE_ENABLE_MOCK_AUTH === "true";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

function getMockAuthResponse(credentials) {
  const nameFromEmail = credentials.email.split("@")[0] || "User";
  const displayName =
    nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1);

  return {
    user: {
      id: "mock-user-1",
      name: displayName,
      email: credentials.email,
      role: "admin",
      department: "IT",
    },
    accessToken: "mock-access-token",
    refreshToken: "mock-refresh-token",
  };
}

export default function LoginCard({ onForgotPassword }) {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { setAuth, setLoading, isLoading } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const response = mockAuthEnabled
        ? { data: getMockAuthResponse(data) }
        : await authAPI.login(data);

      const { user, accessToken, refreshToken } = response.data;
      setAuth(user, accessToken, refreshToken);
      toast.success(`Welcome back, ${user.name}!`);
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-3xl border border-white/60 bg-card/85 p-9 text-foreground shadow-[0_18px_45px_rgba(76,58,172,0.2)] backdrop-blur-xl">
      <div className="mb-8 space-y-2 text-center">
        <div className="mb-3 flex justify-center">
          <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/40">
            <LogIn className="h-7 w-7 text-primary-foreground" />
          </div>
        </div>
        <h2 className="text-5xl font-semibold tracking-tight text-primary">Welcome back</h2>
        <p className="text-sm text-primary/70">Sign in to your IntelliDesk account</p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-6">
          <div className="space-y-2.5">
            <Label htmlFor="email" className="flex items-center gap-2 text-sm font-semibold text-primary">
              <Mail className="h-4 w-4" />
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Email address"
              className="h-12 rounded-xl border-primary/15 bg-primary/5 text-foreground placeholder:text-primary/45 focus-visible:ring-primary"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="flex items-center gap-2 text-sm font-semibold text-primary">
                <Lock className="h-4 w-4" />
                Password
              </Label>
              <button
                type="button"
                onClick={onForgotPassword}
                className="text-sm text-primary hover:underline"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                className="h-12 rounded-xl border-primary/15 bg-primary/5 pr-12 text-foreground placeholder:text-primary/45 focus-visible:ring-primary"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-primary/45 hover:text-primary"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="h-12 w-full rounded-xl bg-gradient-to-r from-primary to-primary/80 text-base font-semibold text-primary-foreground shadow-[0_10px_24px_rgba(92,66,221,0.45)] hover:opacity-95"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </Button>

          <p className="pt-1 text-center text-sm text-primary/70">
            Don't have an account?{" "}
            <Link to="/signup" className="font-semibold text-primary hover:underline">
              Sign up
            </Link>
          </p>

        </div>
      </form>
    </div>
  );
}
