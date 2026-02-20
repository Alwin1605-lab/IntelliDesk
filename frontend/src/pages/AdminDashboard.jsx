import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { StatusBadge, PriorityBadge, CategoryBadge } from '../components/ui/Badge';
import { PageLoader } from '../components/ui/Spinner';
import StatsCard from '../components/StatsCard';
import {
  Ticket,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  Shield,
  Users,
  BarChart3,
  ChevronRight,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from 'recharts';

const CATEGORY_COLORS = {
  Network: '#06b6d4',
  Hardware: '#f59e0b',
  Software: '#8b5cf6',
  Security: '#ef4444',
  Access: '#6366f1',
  Other: '#94a3b8',
};

const STATUS_COLORS = {
  Open: '#10b981',
  'In Progress': '#3b82f6',
  Resolved: '#94a3b8',
  Closed: '#64748b',
  Escalated: '#ef4444',
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.get('/analytics/dashboard');
      setData(res.data.data);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading || !data) return <PageLoader />;

  const { overview, byCategory, byStatus, techWorkload, ticketTrend, recentTickets } = data;

  // Enrich category data with colors
  const categoryChartData = byCategory.map((d) => ({
    ...d,
    color: CATEGORY_COLORS[d.name] || CATEGORY_COLORS.Other,
  }));

  // Enrich status data with colors
  const statusChartData = byStatus.map((d) => ({
    ...d,
    color: STATUS_COLORS[d.name] || '#94a3b8',
  }));

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white border border-slate-200 rounded-lg shadow-lg px-3 py-2 text-sm">
        <p className="font-medium text-slate-900">{label || payload[0]?.name}</p>
        {payload.map((entry, i) => (
          <p key={i} className="text-slate-600">
            {entry.name || 'Count'}: <span className="font-semibold">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">System-wide analytics and performance overview</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        <StatsCard title="Total Tickets" value={overview.totalTickets} icon={Ticket} color="primary" />
        <StatsCard title="Open" value={overview.openTickets} icon={AlertTriangle} color="orange" />
        <StatsCard title="In Progress" value={overview.inProgress} icon={Clock} color="blue" />
        <StatsCard title="Resolved" value={overview.resolved} icon={CheckCircle2} color="green" />
        <StatsCard title="Escalated" value={overview.escalated} icon={AlertTriangle} color="red" />
        <StatsCard
          title="SLA Compliance"
          value={`${overview.slaCompliance}%`}
          icon={Shield}
          color="violet"
        />
        <StatsCard
          title="Avg Resolution"
          value={`${overview.avgResolutionHours}h`}
          icon={TrendingUp}
          color="blue"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Category — Pie Chart */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Tickets by Category</h3>
          {categoryChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={categoryChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, value }) => `${name} (${value})`}
                  labelLine={true}
                >
                  {categoryChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[280px] text-sm text-slate-400">
              No data available
            </div>
          )}
        </div>

        {/* By Status — Bar Chart */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Tickets by Status</h3>
          {statusChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={statusChartData} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Tickets" radius={[4, 4, 0, 0]}>
                  {statusChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[280px] text-sm text-slate-400">
              No data available
            </div>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ticket Trend — Line Chart */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Ticket Trend (Last 30 Days)</h3>
          {ticketTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={ticketTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickFormatter={(v) => {
                    const d = new Date(v);
                    return `${d.getMonth() + 1}/${d.getDate()}`;
                  }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Tickets"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={{ fill: '#6366f1', r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[280px] text-sm text-slate-400">
              No data available
            </div>
          )}
        </div>

        {/* Technician Workload */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-4">
            <Users size={14} />
            Technician Workload
          </h3>
          {techWorkload.length > 0 ? (
            <div className="space-y-3">
              {techWorkload.map((tech, i) => {
                const maxTickets = Math.max(...techWorkload.map((t) => t.activeTickets), 1);
                const pct = (tech.activeTickets / maxTickets) * 100;
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-400 to-violet-400 flex items-center justify-center text-white text-xs font-semibold">
                          {tech.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{tech.name}</p>
                          <p className="text-xs text-slate-500">{tech.department}</p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-slate-900">
                        {tech.activeTickets} active
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary-500 to-violet-500 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-sm text-slate-400">
              No technicians found
            </div>
          )}
        </div>
      </div>

      {/* Recent Tickets Table */}
      <div className="card">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
            <BarChart3 size={14} />
            Recent Tickets
          </h3>
        </div>

        {recentTickets && recentTickets.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">ID</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Title</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Priority</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Category</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Created By</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Assigned To</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentTickets.map((ticket) => (
                  <tr
                    key={ticket._id}
                    onClick={() => navigate(`/tickets/${ticket._id}`)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-3">
                      <span className="font-mono text-xs text-slate-400">{ticket.ticketId}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="font-medium text-slate-900 truncate block max-w-[200px]">
                        {ticket.title}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={ticket.status} />
                    </td>
                    <td className="px-5 py-3">
                      <PriorityBadge priority={ticket.priority} />
                    </td>
                    <td className="px-5 py-3">
                      <CategoryBadge category={ticket.category} />
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {ticket.createdBy?.name || '-'}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {ticket.assignedTo?.name || <span className="text-slate-400">Unassigned</span>}
                    </td>
                    <td className="px-5 py-3 text-slate-400 text-xs whitespace-nowrap">
                      {formatDate(ticket.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-5 py-12 text-center">
            <Ticket className="mx-auto text-slate-300 mb-3" size={40} />
            <p className="text-slate-500">No tickets yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
