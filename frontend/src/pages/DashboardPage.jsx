import StatsCards from "@/components/dashboard/StatsCards";
import CategoryPieChart from "@/components/dashboard/CategoryPieChart";
import StatusBarChart from "@/components/dashboard/StatusBarChart";
import ResponseTimeChart from "@/components/dashboard/ResponseTimeChart";
import RecentTicketsTable from "@/components/dashboard/RecentTicketsTable";
import TechnicianWorkloadCards from "@/components/dashboard/TechnicianWorkloadCards";
import SlaAlertBanner from "@/components/dashboard/SlaAlertBanner";
import useAuthStore from "@/stores/authStore";
import { ROLES } from "@/lib/constants";

const mockSlaAlerts = [
  { id: "TK-042", title: "Server room AC failure", timeLeft: "2h 15m" },
  { id: "TK-039", title: "Database backup failing", timeLeft: "4h 30m" },
];

export default function DashboardPage() {
  const { user } = useAuthStore();
  const isManagerOrAdmin = user?.role === ROLES.MANAGER || user?.role === ROLES.ADMIN;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.name || "User"}. Here's your helpdesk overview.
        </p>
      </div>

      {/* SLA Alert Banner */}
      {isManagerOrAdmin && <SlaAlertBanner alerts={mockSlaAlerts} />}

      {/* Stats Cards */}
      <StatsCards stats={{ total: 156, open: 42, highPriority: 12, closedToday: 18 }} />

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <CategoryPieChart />
        <StatusBarChart />
      </div>

      {/* New Response Time Chart - Full Width or Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ResponseTimeChart />
        {/* Placeholder or another chart could go here, or simple full width */}
      </div>

      {/* Recent Tickets */}
      <RecentTicketsTable />

      {/* Technician Workload - Manager/Admin only */}
      {isManagerOrAdmin && (
        <div className="grid gap-6 lg:grid-cols-2">
          <TechnicianWorkloadCards />
        </div>
      )}
    </div>
  );
}
