import { Navigate } from "react-router-dom";
import useAuthStore from "@/stores/authStore";
import { toast } from "sonner";

export default function RoleRoute({ children, roles = [] }) {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles.length > 0 && !roles.includes(user?.role)) {
    toast.error("You don't have permission to access this page.");
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
