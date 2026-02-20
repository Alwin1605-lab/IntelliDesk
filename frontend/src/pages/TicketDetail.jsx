import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../hooks/useAuth';
import { StatusBadge, PriorityBadge, CategoryBadge } from '../components/ui/Badge';
import { PageLoader } from '../components/ui/Spinner';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Sparkles,
  Clock,
  User,
  MessageSquare,
  Send,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  Shield,
  Tag,
  CalendarClock,
  Loader2,
  UserCheck,
} from 'lucide-react';

export default function TicketDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [technicians, setTechnicians] = useState([]);

  const isStaff = user?.role === 'admin' || user?.role === 'technician';

  useEffect(() => {
    fetchTicket();
    if (isStaff) fetchTechnicians();
  }, [id]);

  const fetchTicket = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/tickets/${id}`);
      setTicket(res.data.data.ticket);
    } catch (err) {
      console.error('Failed to fetch ticket:', err);
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const fetchTechnicians = async () => {
    try {
      const res = await api.get('/users/technicians');
      setTechnicians(res.data.data.technicians || []);
    } catch (err) {
      console.error('Failed to fetch technicians:', err);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      setUpdatingStatus(true);
      const res = await api.patch(`/tickets/${id}`, { status: newStatus });
      setTicket(res.data.data.ticket);
      toast.success(`Ticket status updated to ${newStatus}`);
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleReassign = async (techId) => {
    if (!techId) return;
    try {
      const res = await api.patch(`/tickets/${id}`, { assignedTo: techId });
      setTicket(res.data.data.ticket);
      toast.success('Ticket reassigned');
    } catch (err) {
      console.error('Failed to reassign:', err);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    try {
      setSubmittingComment(true);
      const res = await api.post(`/tickets/${id}/comments`, {
        text: comment,
        isInternal,
      });
      setTicket(res.data.data.ticket);
      setComment('');
      setIsInternal(false);
      toast.success('Comment added');
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
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

  const isSLABreached = () => {
    if (!ticket?.slaDeadline?.resolution) return false;
    if (ticket.status === 'Resolved' || ticket.status === 'Closed') {
      return ticket.resolvedAt && new Date(ticket.resolvedAt) > new Date(ticket.slaDeadline.resolution);
    }
    return new Date() > new Date(ticket.slaDeadline.resolution);
  };

  const getSLATimeRemaining = () => {
    if (!ticket?.slaDeadline?.resolution) return null;
    if (ticket.status === 'Resolved' || ticket.status === 'Closed') return null;
    const deadline = new Date(ticket.slaDeadline.resolution).getTime();
    const diff = deadline - Date.now();
    if (diff <= 0) return 'Breached';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${mins}m remaining`;
  };

  if (loading) return <PageLoader />;
  if (!ticket) return null;

  const statusActions = [];
  if (isStaff) {
    if (ticket.status === 'Open') statusActions.push('In Progress');
    if (ticket.status === 'In Progress') statusActions.push('Resolved', 'Escalated');
    if (ticket.status === 'Escalated') statusActions.push('In Progress', 'Resolved');
    if (ticket.status === 'Resolved') statusActions.push('Closed', 'In Progress');
    if (user?.role === 'admin' && ticket.status !== 'Closed') statusActions.push('Closed');
  }

  const visibleComments = ticket.comments?.filter((c) => {
    if (isStaff) return true;
    return !c.isInternal;
  }) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors mt-0.5"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-mono text-slate-400">{ticket.ticketId}</span>
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
            <CategoryBadge category={ticket.category} />
            {isSLABreached() && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                <AlertTriangle size={10} />
                SLA Breached
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold text-slate-900">{ticket.title}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content — Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Description</h3>
            <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
              {ticket.description}
            </p>
          </div>

          {/* AI Suggestions */}
          {ticket.aiSuggestions && ticket.aiSuggestions.length > 0 && (
            <div className="card p-5 border-indigo-100 bg-indigo-50/30">
              <h3 className="text-sm font-semibold text-indigo-800 flex items-center gap-2 mb-3">
                <BookOpen size={14} />
                AI-Suggested Knowledge Base Articles
              </h3>
              <div className="space-y-2">
                {ticket.aiSuggestions.map((s, i) => (
                  <div key={i} className="bg-white rounded-lg p-3 border border-indigo-100">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900">{s.title}</p>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{s.solution}</p>
                      </div>
                      {s.similarity != null && (
                        <span className="text-xs text-indigo-600 font-medium whitespace-nowrap">
                          {(s.similarity * 100).toFixed(0)}% match
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comments Section */}
          <div className="card">
            <div className="px-5 py-4 border-b border-slate-200">
              <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <MessageSquare size={14} />
                Comments ({visibleComments.length})
              </h3>
            </div>

            <div className="divide-y divide-slate-100">
              {visibleComments.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <MessageSquare className="mx-auto text-slate-300 mb-2" size={28} />
                  <p className="text-sm text-slate-500">No comments yet</p>
                </div>
              ) : (
                visibleComments.map((c, i) => (
                  <div key={i} className="px-5 py-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-violet-400 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                        {c.author?.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-slate-900">
                            {c.author?.name || 'Unknown'}
                          </span>
                          <span className="text-xs text-slate-400 capitalize">
                            {c.author?.role}
                          </span>
                          {c.isInternal && (
                            <span className="px-1.5 py-0.5 rounded text-xs bg-amber-100 text-amber-700 font-medium">
                              Internal
                            </span>
                          )}
                          <span className="text-xs text-slate-400">{getTimeAgo(c.createdAt)}</span>
                        </div>
                        <p className="text-sm text-slate-600 whitespace-pre-wrap">{c.text}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Add Comment */}
            <div className="px-5 py-4 border-t border-slate-200 bg-slate-50/50">
              <form onSubmit={handleAddComment}>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Write a comment..."
                  className="input-field min-h-[80px] resize-y mb-3"
                  rows={3}
                  maxLength={2000}
                />
                <div className="flex items-center justify-between">
                  <div>
                    {isStaff && (
                      <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isInternal}
                          onChange={(e) => setIsInternal(e.target.checked)}
                          className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                        />
                        Internal note (not visible to employee)
                      </label>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={submittingComment || !comment.trim()}
                    className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submittingComment ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Send size={14} />
                    )}
                    Add Comment
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Status Actions */}
          {statusActions.length > 0 && (
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-3">Update Status</h3>
              <div className="space-y-2">
                {statusActions
                  .filter((s, i, arr) => arr.indexOf(s) === i) // deduplicate
                  .map((status) => (
                  <button
                    key={status}
                    onClick={() => handleStatusUpdate(status)}
                    disabled={updatingStatus}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                      status === 'Resolved'
                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        : status === 'Escalated'
                        ? 'bg-red-50 text-red-700 hover:bg-red-100'
                        : status === 'Closed'
                        ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                    }`}
                  >
                    {status === 'Resolved' && <CheckCircle2 size={14} className="inline mr-2" />}
                    {status === 'Escalated' && <AlertTriangle size={14} className="inline mr-2" />}
                    Mark as {status}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Reassignment */}
          {isStaff && technicians.length > 0 && (
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <UserCheck size={14} />
                Assign Technician
              </h3>
              <select
                value={ticket.assignedTo?._id || ''}
                onChange={(e) => handleReassign(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">Unassigned</option>
                {technicians.map((tech) => (
                  <option key={tech._id} value={tech._id}>
                    {tech.name} ({tech.department} — {tech.activeTicketCount || 0} active)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Ticket Details */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Details</h3>
            <dl className="space-y-3 text-sm">
              <div className="flex items-start justify-between">
                <dt className="text-slate-500 flex items-center gap-1.5">
                  <User size={13} /> Created by
                </dt>
                <dd className="text-slate-900 font-medium text-right">
                  {ticket.createdBy?.name || 'Unknown'}
                </dd>
              </div>
              <div className="flex items-start justify-between">
                <dt className="text-slate-500 flex items-center gap-1.5">
                  <UserCheck size={13} /> Assigned to
                </dt>
                <dd className="text-slate-900 font-medium text-right">
                  {ticket.assignedTo?.name || 'Unassigned'}
                </dd>
              </div>
              <div className="flex items-start justify-between">
                <dt className="text-slate-500 flex items-center gap-1.5">
                  <Shield size={13} /> Department
                </dt>
                <dd className="text-slate-900 font-medium">{ticket.department}</dd>
              </div>
              <div className="flex items-start justify-between">
                <dt className="text-slate-500 flex items-center gap-1.5">
                  <Tag size={13} /> Channel
                </dt>
                <dd className="text-slate-900 font-medium capitalize">{ticket.channel}</dd>
              </div>
              <div className="flex items-start justify-between">
                <dt className="text-slate-500 flex items-center gap-1.5">
                  <Clock size={13} /> Created
                </dt>
                <dd className="text-slate-900 font-medium text-right text-xs">
                  {formatDate(ticket.createdAt)}
                </dd>
              </div>
              {ticket.resolvedAt && (
                <div className="flex items-start justify-between">
                  <dt className="text-slate-500 flex items-center gap-1.5">
                    <CheckCircle2 size={13} /> Resolved
                  </dt>
                  <dd className="text-slate-900 font-medium text-right text-xs">
                    {formatDate(ticket.resolvedAt)}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* SLA Info */}
          {ticket.slaDeadline?.resolution && (
            <div className={`card p-5 ${isSLABreached() ? 'border-red-200 bg-red-50/30' : ''}`}>
              <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <CalendarClock size={14} />
                SLA Information
              </h3>
              <dl className="space-y-3 text-sm">
                {ticket.slaDeadline.response && (
                  <div>
                    <dt className="text-slate-500 text-xs mb-0.5">Response Deadline</dt>
                    <dd className="text-slate-900 font-medium text-xs">
                      {formatDate(ticket.slaDeadline.response)}
                      {ticket.respondedAt && (
                        <span className="ml-2 text-emerald-600">(Responded)</span>
                      )}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-slate-500 text-xs mb-0.5">Resolution Deadline</dt>
                  <dd className="text-slate-900 font-medium text-xs">
                    {formatDate(ticket.slaDeadline.resolution)}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500 text-xs mb-0.5">Status</dt>
                  <dd>
                    {isSLABreached() ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700">
                        <AlertTriangle size={11} />
                        SLA Breached
                      </span>
                    ) : getSLATimeRemaining() ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                        <Clock size={11} />
                        {getSLATimeRemaining()}
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-slate-500">Completed</span>
                    )}
                  </dd>
                </div>
              </dl>
            </div>
          )}

          {/* AI Classification */}
          {ticket.aiClassification?.category && (
            <div className="card p-5 border-primary-100 bg-primary-50/20">
              <h3 className="text-sm font-semibold text-primary-800 flex items-center gap-2 mb-3">
                <Sparkles size={14} />
                AI Classification
              </h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-primary-600">Category</dt>
                  <dd className="font-medium text-slate-900">{ticket.aiClassification.category}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-primary-600">Confidence</dt>
                  <dd className="font-medium text-slate-900">
                    {ticket.aiClassification.confidence
                      ? `${(ticket.aiClassification.confidence * 100).toFixed(0)}%`
                      : 'N/A'}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-primary-600">Priority</dt>
                  <dd className="font-medium text-slate-900">
                    {ticket.aiClassification.prioritySuggestion || 'N/A'}
                  </dd>
                </div>
                {ticket.aiClassification.priorityScore != null && (
                  <div className="flex justify-between">
                    <dt className="text-primary-600">Priority Score</dt>
                    <dd className="font-medium text-slate-900">
                      {(ticket.aiClassification.priorityScore * 100).toFixed(0)}%
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
