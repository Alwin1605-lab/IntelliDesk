import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../hooks/useAuth';
import { StatusBadge, PriorityBadge, CategoryBadge } from '../components/ui/Badge';
import { PageLoader } from '../components/ui/Spinner';
import StatsCard from '../components/StatsCard';
import toast from 'react-hot-toast';
import {
  Wrench,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Filter,
  MessageSquare,
  ArrowUpDown,
} from 'lucide-react';

export default function TechnicianPanel() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    fetchTickets();
  }, [statusFilter, priorityFilter, sortBy, sortOrder]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const params = { limit: 50, sortBy, sortOrder };
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;
      const res = await api.get('/tickets', { params });
      setTickets(res.data.data.tickets);
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickStatus = async (e, ticketId, newStatus) => {
    e.stopPropagation();
    try {
      await api.patch(`/tickets/${ticketId}`, { status: newStatus });
      toast.success(`Ticket updated to ${newStatus}`);
      fetchTickets();
    } catch (err) {
      console.error('Failed to update ticket:', err);
    }
  };

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('desc');
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

  const getTimeAgo = (date) => {
    if (!date) return '';
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const stats = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === 'Open' || t.status === 'Escalated').length,
    inProgress: tickets.filter((t) => t.status === 'In Progress').length,
    resolved: tickets.filter((t) => t.status === 'Resolved' || t.status === 'Closed').length,
  };

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Ticket Queue</h1>
        <p className="text-slate-500 text-sm mt-1">
          Welcome, {user?.name?.split(' ')[0]}. You have {stats.open + stats.inProgress} active ticket{(stats.open + stats.inProgress) !== 1 ? 's' : ''}.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Assigned to Me" value={stats.total} icon={Wrench} color="primary" />
        <StatsCard title="Open / Escalated" value={stats.open} icon={AlertTriangle} color="orange" />
        <StatsCard title="In Progress" value={stats.inProgress} icon={Clock} color="blue" />
        <StatsCard title="Resolved" value={stats.resolved} icon={CheckCircle2} color="green" />
      </div>

      {/* Filters */}
      <div className="card">
        <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-900">Assigned Tickets</h2>
          <div className="flex items-center gap-3">
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
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">All Priority</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
            <button
              onClick={() => toggleSort('priority')}
              className={`flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                sortBy === 'priority'
                  ? 'border-primary-300 bg-primary-50 text-primary-700'
                  : 'border-slate-200 text-slate-500 hover:border-slate-300'
              }`}
            >
              <ArrowUpDown size={13} />
              Priority
            </button>
            <button
              onClick={() => toggleSort('createdAt')}
              className={`flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg border transition-colors ${
                sortBy === 'createdAt'
                  ? 'border-primary-300 bg-primary-50 text-primary-700'
                  : 'border-slate-200 text-slate-500 hover:border-slate-300'
              }`}
            >
              <ArrowUpDown size={13} />
              Date
            </button>
          </div>
        </div>

        {/* Ticket List */}
        {tickets.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <Wrench className="mx-auto text-slate-300 mb-3" size={40} />
            <p className="text-slate-500 font-medium">No tickets in your queue</p>
            <p className="text-sm text-slate-400 mt-1">New tickets will appear here when assigned to you</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {tickets.map((ticket) => {
              const isSLABreached =
                ticket.slaDeadline?.resolution &&
                !['Resolved', 'Closed'].includes(ticket.status) &&
                new Date() > new Date(ticket.slaDeadline.resolution);

              return (
                <div
                  key={ticket._id}
                  onClick={() => navigate(`/tickets/${ticket._id}`)}
                  className="px-5 py-4 hover:bg-slate-50 cursor-pointer transition-colors duration-150"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-mono text-slate-400">{ticket.ticketId}</span>
                        <StatusBadge status={ticket.status} />
                        <PriorityBadge priority={ticket.priority} />
                        <CategoryBadge category={ticket.category} />
                        {isSLABreached && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                            <AlertTriangle size={10} />
                            SLA Breached
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-medium text-slate-900">{ticket.title}</h3>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                        <span>By: {ticket.createdBy?.name || 'Unknown'}</span>
                        <span>{getTimeAgo(ticket.createdAt)}</span>
                        {ticket.comments?.length > 0 && (
                          <span className="flex items-center gap-1">
                            <MessageSquare size={11} />
                            {ticket.comments.length}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {ticket.status === 'Open' && (
                        <button
                          onClick={(e) => handleQuickStatus(e, ticket._id, 'In Progress')}
                          className="px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          Start
                        </button>
                      )}
                      {ticket.status === 'In Progress' && (
                        <button
                          onClick={(e) => handleQuickStatus(e, ticket._id, 'Resolved')}
                          className="px-3 py-1.5 text-xs font-medium bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors"
                        >
                          Resolve
                        </button>
                      )}
                      {ticket.status === 'Escalated' && (
                        <button
                          onClick={(e) => handleQuickStatus(e, ticket._id, 'In Progress')}
                          className="px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          Pick Up
                        </button>
                      )}
                      <ChevronRight size={16} className="text-slate-400" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
