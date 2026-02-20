import { useState } from "react";
import LoginCard from "@/components/auth/LoginCard";
import ForgotPasswordModal from "@/components/auth/ForgotPasswordModal";

export default function LoginPage() {
  const [forgotOpen, setForgotOpen] = useState(false);

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-primary/20 via-background to-primary/10 p-4">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-28 top-20 h-[34rem] w-[34rem] rounded-full bg-primary/25 blur-[120px]" />
        <div className="absolute -bottom-24 -right-24 h-[30rem] w-[30rem] rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/25 blur-[110px]" />
      </div>
      <div className="relative z-10">
        <LoginCard onForgotPassword={() => setForgotOpen(true)} />
        <ForgotPasswordModal open={forgotOpen} onOpenChange={setForgotOpen} />
      </div>
    </div>
  );
}
