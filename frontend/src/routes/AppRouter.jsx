import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ROLES } from "@/lib/constants";

// Route guards
import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";

// Layout
import AppLayout from "@/components/layout/AppLayout";

// Public pages
import LoginPage from "@/pages/LoginPage";
import SignupPage from "@/pages/SignupPage";

// Protected pages
import DashboardPage from "@/pages/DashboardPage";
import TicketCreatePage from "@/pages/TicketCreatePage";
import TicketListPage from "@/pages/TicketListPage";
import TicketDetailPage from "@/pages/TicketDetailPage";
import TechnicianPanelPage from "@/pages/TechnicianPanelPage";
import AdminPanelPage from "@/pages/AdminPanelPage";
import KnowledgeBasePage from "@/pages/KnowledgeBasePage";
import NotFoundPage from "@/pages/NotFoundPage";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Protected routes inside AppLayout */}
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          {/* Dashboard — all authenticated roles */}
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* Tickets — all authenticated roles */}
          <Route path="/tickets" element={<TicketListPage />} />
          <Route path="/tickets/create" element={<TicketCreatePage />} />
          <Route path="/tickets/:id" element={<TicketDetailPage />} />

          {/* Technician board — technician, manager, admin */}
          <Route
            path="/technician"
            element={
              <RoleRoute roles={[ROLES.TECHNICIAN, ROLES.MANAGER, ROLES.ADMIN]}>
                <TechnicianPanelPage />
              </RoleRoute>
            }
          />

          {/* Admin panel — admin only */}
          <Route
            path="/admin"
            element={
              <RoleRoute roles={[ROLES.ADMIN]}>
                <AdminPanelPage />
              </RoleRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <RoleRoute roles={[ROLES.ADMIN]}>
                <AdminPanelPage />
              </RoleRoute>
            }
          />

          {/* Knowledge Base — all authenticated roles */}
          <Route path="/knowledge-base" element={<KnowledgeBasePage />} />
        </Route>

        {/* Root redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* 404 catch-all */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
