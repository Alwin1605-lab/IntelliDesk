import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTickets } from '../context/TicketContext';
import api from '../utils/api';
import StatsCard from '../components/StatsCard';
import { PriorityBadge, StatusBadge, CategoryBadge } from '../components/Badges';
import {
  Ticket, Clock, CheckCircle, AlertTriangle, TrendingUp,
  Users, Shield, BarChart3, ArrowRight, Activity
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const Dashboard = () => {
  const { user } = useAuth();
  const { tickets, fetchTickets, loading } = useTickets();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    fetchTickets({ limit: 10, sort: '-createdAt' });

    if (user.role !== 'user') {
      api.get('/analytics/summary').then(({ data }) => {
        setSummary(data.data);
      }).finally(() => setStatsLoading(false));
    } else {
      setStatsLoading(false);
    }
  }, []);

  const recentTickets = tickets.slice(0, 8);

  const userStats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    inProgress: tickets.filter(t => t.status === 'in-progress').length,
    resolved: tickets.filter(t => ['resolved', 'closed'].includes(t.status)).length
  };

  const statsData = user.role === 'user'
    ? [
        { title: 'My Tickets', value: userStats.total, icon: Ticket, color: 'blue' },
        { title: 'Open', value: userStats.open, icon: AlertTriangle, color: 'orange' },
        { title: 'In Progress', value: userStats.inProgress, icon: Activity, color: 'purple' },
        { title: 'Resolved', value: userStats.resolved, icon: CheckCircle, color: 'green' }
      ]
    : [
        { title: 'Total Tickets', value: summary?.totalTickets, icon: Ticket, color: 'blue' },
        { title: 'Open', value: summary?.openTickets, icon: AlertTriangle, color: 'orange' },
        { title: 'Critical', value: summary?.criticalTickets, icon: Shield, color: 'red' },
        { title: 'Resolved', value: summary?.resolvedTickets, icon: CheckCircle, color: 'green' },
        { title: 'SLA Breached', value: summary?.slaBreached, icon: Clock, color: 'red' },
        { title: 'Avg Resolution', value: summary?.avgResolutionTime ? `${summary.avgResolutionTime}h` : 'N/A', icon: TrendingUp, color: 'purple' }
      ];

  return (
    <div className="fade-in">
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 mb-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold mb-1">Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, {user.name?.split(' ')[0]}! 👋</h2>
            <p className="text-blue-100 text-sm">
              {user.role === 'admin' ? 'Monitor and manage all IT support operations' :
               user.role === 'technician' ? 'Your assigned tickets are ready for action' :
               'Check your support ticket status or raise a new request'}
            </p>
          </div>
          <div className="hidden md:block">
            <div className="text-right">
              <p className="text-blue-200 text-xs">{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <div className="flex items-center gap-1.5 mt-1.5 justify-end">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                <span className="text-sm text-blue-100">System Operational</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className={`grid gap-4 mb-6 ${user.role === 'user' ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6'}`}>
        {statsLoading
          ? Array(user.role === 'user' ? 4 : 6).fill(0).map((_, i) => (
              <div key={i} className="card h-24 animate-pulse bg-gray-100" />
            ))
          : statsData.map((s, i) => (
              <StatsCard key={i} title={s.title} value={s.value ?? '—'} icon={s.icon} color={s.color} />
            ))
        }
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Raise New Ticket', desc: 'Report an IT issue', path: '/tickets/new', color: 'blue', icon: Ticket },
          { label: 'View All Tickets', desc: 'Track ticket status', path: '/tickets', color: 'purple', icon: BarChart3 },
          { label: 'Knowledge Base', desc: 'Self-service guides', path: '/kb', color: 'green', icon: Users }
        ].map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className="card flex items-center justify-between hover:shadow-md transition-all group text-left"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg bg-${item.color}-100 flex items-center justify-center`}>
                <item.icon size={18} className={`text-${item.color}-600`} />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">{item.label}</p>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
            </div>
            <ArrowRight size={16} className="text-gray-300 group-hover:text-gray-500 group-hover:translate-x-1 transition-all" />
          </button>
        ))}
      </div>

      {/* Recent Tickets Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">Recent Tickets</h3>
          <button onClick={() => navigate('/tickets')} className="text-sm text-blue-600 hover:underline flex items-center gap-1">
            View all <ArrowRight size={13} />
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}
          </div>
        ) : recentTickets.length === 0 ? (
          <div className="text-center py-10">
            <Ticket size={36} className="text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">No tickets yet</p>
            <button onClick={() => navigate('/tickets/new')} className="btn-primary mt-3 text-sm">
              Create your first ticket
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 border-b border-gray-100">
                  <th className="text-left py-2 font-medium">Ticket ID</th>
                  <th className="text-left py-2 font-medium">Title</th>
                  <th className="text-left py-2 font-medium hidden md:table-cell">Category</th>
                  <th className="text-left py-2 font-medium">Priority</th>
                  <th className="text-left py-2 font-medium">Status</th>
                  <th className="text-left py-2 font-medium hidden lg:table-cell">Created</th>
                </tr>
              </thead>
              <tbody>
                {recentTickets.map((ticket) => (
                  <tr
                    key={ticket._id}
                    onClick={() => navigate(`/tickets/${ticket._id}`)}
                    className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 font-mono text-xs text-blue-600 font-medium">{ticket.ticketId}</td>
                    <td className="py-3">
                      <span className="font-medium text-gray-800 line-clamp-1">{ticket.title}</span>
                    </td>
                    <td className="py-3 hidden md:table-cell">
                      <CategoryBadge category={ticket.category} />
                    </td>
                    <td className="py-3">
                      <PriorityBadge priority={ticket.priority} />
                    </td>
                    <td className="py-3">
                      <StatusBadge status={ticket.status} />
                    </td>
                    <td className="py-3 text-gray-400 text-xs hidden lg:table-cell">
                      {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
