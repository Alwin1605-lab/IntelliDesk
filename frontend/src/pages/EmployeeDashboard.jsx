import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../hooks/useAuth';
import { StatusBadge, PriorityBadge, CategoryBadge } from '../components/ui/Badge';
import { PageLoader } from '../components/ui/Spinner';
import StatsCard from '../components/StatsCard';
import { Ticket, Clock, CheckCircle2, AlertTriangle, PlusCircle, ChevronRight, Filter } from 'lucide-react';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const searchQuery = searchParams.get('search') || '';

  useEffect(() => {
    fetchTickets();
  }, [statusFilter, searchQuery]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const params = { limit: 50, sortBy: 'createdAt', sortOrder: 'desc' };
      if (statusFilter) params.status = statusFilter;
      if (searchQuery) params.search = searchQuery;
      const res = await api.get('/tickets', { params });
      setTickets(res.data.data.tickets);
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  const stats = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === 'Open' || t.status === 'Escalated').length,
    inProgress: tickets.filter((t) => t.status === 'In Progress').length,
    resolved: tickets.filter((t) => t.status === 'Resolved' || t.status === 'Closed').length,
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

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome back, {user?.name?.split(' ')[0]}</h1>
          <p className="text-slate-500 text-sm mt-1">Here's an overview of your support tickets</p>
        </div>
        <button onClick={() => navigate('/tickets/new')} className="btn-primary">
          <PlusCircle size={16} />
          New Ticket
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Tickets" value={stats.total} icon={Ticket} color="primary" />
        <StatsCard title="Open" value={stats.open} icon={AlertTriangle} color="orange" />
        <StatsCard title="In Progress" value={stats.inProgress} icon={Clock} color="blue" />
        <StatsCard title="Resolved" value={stats.resolved} icon={CheckCircle2} color="green" />
      </div>

      {/* Tickets List */}
      <div className="card">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">My Tickets</h2>
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Status</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
              <option value="Escalated">Escalated</option>
            </select>
          </div>
        </div>

        {tickets.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <Ticket className="mx-auto text-slate-300 mb-3" size={40} />
            <p className="text-slate-500 font-medium">No tickets found</p>
            <p className="text-sm text-slate-400 mt-1">Create your first ticket to get started</p>
            <button onClick={() => navigate('/tickets/new')} className="btn-primary mt-4">
              <PlusCircle size={16} />
              Create Ticket
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {tickets.map((ticket) => (
              <div
                key={ticket._id}
                onClick={() => navigate(`/tickets/${ticket._id}`)}
                className="px-5 py-4 hover:bg-slate-50 cursor-pointer transition-colors duration-150 flex items-center gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-slate-400">{ticket.ticketId}</span>
                    <StatusBadge status={ticket.status} />
                    <PriorityBadge priority={ticket.priority} />
                  </div>
                  <h3 className="text-sm font-medium text-slate-900 truncate">{ticket.title}</h3>
                  <div className="flex items-center gap-3 mt-1.5">
                    <CategoryBadge category={ticket.category} />
                    <span className="text-xs text-slate-400">{formatDate(ticket.createdAt)}</span>
                    {ticket.assignedTo && (
                      <span className="text-xs text-slate-500">
                        Assigned to: {ticket.assignedTo.name}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-400 flex-shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
