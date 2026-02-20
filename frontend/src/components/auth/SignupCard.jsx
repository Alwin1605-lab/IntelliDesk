import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, UserPlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import useAuthStore from "@/stores/authStore";
import { authAPI } from "@/api/auth";
import { toast } from "sonner";

const signupSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    department: z.string().min(1, "Department is required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export default function SignupCard() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { setAuth, setLoading, isLoading } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const { confirmPassword, ...payload } = data;
      const response = await authAPI.signup(payload);
      const { user, accessToken, refreshToken } = response.data;
      setAuth(user, accessToken, refreshToken);
      toast.success("Account created successfully!");
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-3xl border border-white/60 bg-card/85 p-8 text-foreground shadow-[0_18px_45px_rgba(76,58,172,0.2)] backdrop-blur-xl">
      <div className="mb-7 space-y-2 text-center">
        <div className="mb-3 flex justify-center">
          <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/40">
            <UserPlus className="h-6 w-6 text-primary-foreground" />
          </div>
        </div>
        <h2 className="text-5xl font-semibold tracking-tight">Create account</h2>
        <p className="text-sm text-primary/70">Get started with IntelliDesk</p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-4.5">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-semibold">Full Name</Label>
            <Input
              id="name"
              placeholder="John Doe"
              className="h-12 rounded-xl border-primary/15 bg-primary/5 text-foreground placeholder:text-primary/45 focus-visible:ring-primary"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-email" className="text-sm font-semibold">Email</Label>
            <Input
              id="signup-email"
              type="email"
              placeholder="name@company.com"
              className="h-12 rounded-xl border-primary/15 bg-primary/5 text-foreground placeholder:text-primary/45 focus-visible:ring-primary"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="department" className="text-sm font-semibold">Department</Label>
            <Input
              id="department"
              placeholder="e.g. Engineering, HR, Finance"
              className="h-12 rounded-xl border-primary/15 bg-primary/5 text-foreground placeholder:text-primary/45 focus-visible:ring-primary"
              {...register("department")}
            />
            {errors.department && (
              <p className="text-sm text-destructive">{errors.department.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-password" className="text-sm font-semibold">Password</Label>
            <div className="relative">
              <Input
                id="signup-password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a password"
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
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-semibold">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              className="h-12 rounded-xl border-primary/15 bg-primary/5 text-foreground placeholder:text-primary/45 focus-visible:ring-primary"
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="mt-2 h-12 w-full rounded-xl bg-gradient-to-r from-primary to-primary/80 text-base font-semibold text-primary-foreground shadow-[0_10px_24px_rgba(92,66,221,0.45)] hover:opacity-95"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              "Create Account"
            )}
          </Button>

          <p className="pt-1 text-center text-sm text-primary/70">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </p>

        </div>
      </form>
    </div>
  );
}
