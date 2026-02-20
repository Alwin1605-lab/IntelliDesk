import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTickets } from '../context/TicketContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { PriorityBadge, StatusBadge, CategoryBadge } from '../components/Badges';
import { format, formatDistanceToNow } from 'date-fns';
import {
  ArrowLeft, User, Clock, Send, Lightbulb, Edit, Check,
  Star, MessageSquare, History, AlertCircle, Bot, Users
} from 'lucide-react';

const STATUSES = ['open', 'in-progress', 'pending', 'resolved', 'closed'];

const TicketDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { updateTicket } = useTickets();

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [sending, setSending] = useState(false);
  const [technicians, setTechnicians] = useState([]);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    api.get(`/tickets/${id}`).then(({ data }) => setTicket(data.data)).finally(() => setLoading(false));
    if (user.role !== 'user') {
      api.get('/users/technicians').then(({ data }) => setTechnicians(data.data));
    }
  }, [id]);

  const handleStatusChange = async (status) => {
    try {
      const updated = await updateTicket(id, { status });
      setTicket(updated);
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleAssign = async (techId) => {
    try {
      const updated = await updateTicket(id, { assignedTo: techId });
      setTicket(updated);
    } catch {
      toast.error('Failed to assign ticket');
    }
  };

  const handleComment = async () => {
    if (!comment.trim()) return;
    setSending(true);
    try {
      const { data } = await api.post(`/tickets/${id}/comments`, { text: comment, isInternal });
      setTicket((t) => ({ ...t, comments: data.data }));
      setComment('');
      toast.success('Comment added');
    } catch {
      toast.error('Failed to add comment');
    } finally {
      setSending(false);
    }
  };

  const handleFeedback = async () => {
    try {
      await api.post(`/tickets/${id}/feedback`, { rating, feedback });
      toast.success('Thank you for your feedback!');
    } catch {
      toast.error('Failed to submit feedback');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!ticket) return (
    <div className="text-center py-20">
      <p className="text-gray-500">Ticket not found</p>
      <button onClick={() => navigate('/tickets')} className="btn-primary mt-4 text-sm">Back to Tickets</button>
    </div>
  );

  const canEdit = user.role !== 'user';

  return (
    <div className="max-w-5xl mx-auto fade-in">
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <button onClick={() => navigate('/tickets')}
          className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors mt-0.5">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="font-mono text-sm text-blue-600 font-semibold">{ticket.ticketId}</span>
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
            <CategoryBadge category={ticket.category} />
            {ticket.assignedTeam && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">
                <Users size={11} />
                {ticket.assignedTeam}
              </span>
            )}
            {ticket.slaBreached && (
              <span className="badge bg-red-100 text-red-700 border border-red-200">⚠ SLA Breached</span>
            )}
          </div>
          <h2 className="text-xl font-bold text-gray-800">{ticket.title}</h2>
          <p className="text-sm text-gray-500 mt-1">
            Opened by <strong>{ticket.createdBy?.name}</strong> ({ticket.createdBy?.department}) •{' '}
            {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        {['details', 'comments', 'ai-analysis', 'history'].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all capitalize ${
              activeTab === tab ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {tab.replace('-', ' ')}
            {tab === 'comments' && ticket.comments?.length > 0 && (
              <span className="ml-1.5 text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">
                {ticket.comments.length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-4">
          {activeTab === 'details' && (
            <div className="card">
              <h3 className="font-semibold text-gray-800 mb-3">Description</h3>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{ticket.description}</p>

              {ticket.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-gray-100">
                  {ticket.tags.map(tag => (
                    <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">#{tag}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="card">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <MessageSquare size={16} />
                Comments ({ticket.comments?.length || 0})
              </h3>

              {ticket.comments?.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-6">No comments yet. Add the first one!</p>
              )}

              <div className="space-y-4 mb-5">
                {ticket.comments?.map((c, i) => (
                  <div key={i} className={`flex gap-3 ${c.isInternal ? 'opacity-70' : ''}`}>
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-semibold text-blue-600 shrink-0">
                      {c.author?.name?.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-700">{c.author?.name}</span>
                        <span className="text-xs text-gray-400 capitalize">{c.author?.role}</span>
                        {c.isInternal && <span className="badge bg-yellow-100 text-yellow-700 text-xs">Internal Note</span>}
                        <span className="text-xs text-gray-400 ml-auto">
                          {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <div className={`text-sm text-gray-700 leading-relaxed p-3 rounded-lg ${c.isInternal ? 'bg-yellow-50' : 'bg-gray-50'}`}>
                        {c.text}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add comment */}
              <div className="border-t border-gray-100 pt-4">
                <textarea
                  value={comment} onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment or update..."
                  rows={3} className="input-field resize-none mb-2"
                />
                <div className="flex items-center justify-between">
                  {user.role !== 'user' && (
                    <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer">
                      <input type="checkbox" checked={isInternal} onChange={(e) => setIsInternal(e.target.checked)} className="rounded" />
                      Internal note (not visible to user)
                    </label>
                  )}
                  <div className="ml-auto">
                    <button onClick={handleComment} disabled={!comment.trim() || sending}
                      className="btn-primary flex items-center gap-2 text-sm">
                      {sending ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send size={13} />}
                      Post Comment
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ai-analysis' && (
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <Bot size={16} className="text-blue-600" />
                <h3 className="font-semibold text-gray-800">AI Analysis</h3>
                <span className="text-xs text-gray-400 ml-auto">
                  Confidence: {ticket.aiConfidence ? `${Math.round(ticket.aiConfidence * 100)}%` : 'N/A'}
                </span>
              </div>

              {ticket.aiSuggestions?.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-1.5 mb-3">
                    <Lightbulb size={14} className="text-yellow-500" />
                    <span className="text-sm font-medium text-gray-700">Recommended Resolution Steps</span>
                  </div>
                  <ol className="space-y-2">
                    {ticket.aiSuggestions.map((s, i) => (
                      <li key={i} className="flex gap-3 text-sm text-gray-700 bg-blue-50 rounded-lg p-3">
                        <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs shrink-0 font-bold">
                          {i + 1}
                        </span>
                        {s}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {ticket.relatedArticles?.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Related Knowledge Base Articles</h4>
                  {ticket.relatedArticles.map((a) => (
                    <div key={a._id} className="p-3 bg-gray-50 rounded-lg text-sm text-blue-600 hover:underline cursor-pointer">
                      📚 {a.title}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <History size={16} className="text-gray-600" />
                <h3 className="font-semibold text-gray-800">Ticket History</h3>
              </div>
              {ticket.history?.length === 0 ? (
                <p className="text-sm text-gray-400">No history entries</p>
              ) : (
                <div className="space-y-3">
                  {ticket.history?.map((h, i) => (
                    <div key={i} className="flex gap-3 text-sm">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mt-1.5 shrink-0" />
                      <div>
                        <span className="font-medium capitalize">{h.action?.replace('_', ' ')}</span>
                        {h.oldValue && h.newValue && (
                          <span className="text-gray-500"> · {h.oldValue} → {h.newValue}</span>
                        )}
                        <div className="text-xs text-gray-400 mt-0.5">
                          {h.timestamp ? format(new Date(h.timestamp), 'dd MMM yyyy HH:mm') : '—'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Feedback */}
          {ticket.status === 'resolved' && user.role === 'user' && !ticket.rating && (
            <div className="card border-l-4 border-green-500">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Star size={16} className="text-yellow-500" /> Rate your experience
              </h3>
              <div className="flex gap-2 mb-3">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} onClick={() => setRating(s)}
                    className={`w-9 h-9 rounded-full border-2 text-sm font-semibold transition-all ${
                      rating >= s ? 'border-yellow-400 bg-yellow-50 text-yellow-600' : 'border-gray-200 text-gray-400 hover:border-yellow-300'
                    }`}>
                    {s}
                  </button>
                ))}
              </div>
              <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)}
                placeholder="Additional comments (optional)" rows={2} className="input-field mb-3" />
              <button onClick={handleFeedback} disabled={!rating} className="btn-primary text-sm">
                Submit Feedback
              </button>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Ticket Info */}
          <div className="card">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Ticket Info</h4>
            <div className="space-y-3 text-sm">
              {[
                { label: 'Ticket ID', value: ticket.ticketId },
                { label: 'Source', value: ticket.source?.toUpperCase() },
                { label: 'Created', value: ticket.createdAt ? format(new Date(ticket.createdAt), 'dd MMM yyyy, HH:mm') : '—' },
                { label: 'SLA Deadline', value: ticket.slaDeadline ? format(new Date(ticket.slaDeadline), 'dd MMM yyyy, HH:mm') : '—' },
                { label: 'First Response', value: ticket.firstResponseAt ? format(new Date(ticket.firstResponseAt), 'dd MMM yyyy, HH:mm') : 'Pending' },
                { label: 'Resolved At', value: ticket.resolvedAt ? format(new Date(ticket.resolvedAt), 'dd MMM yyyy, HH:mm') : '—' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between">
                  <span className="text-gray-500">{label}</span>
                  <span className="text-gray-700 font-medium text-right ml-4">{value || '—'}</span>
                </div>
              ))}
              {ticket.rating && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Rating</span>
                  <span className="text-yellow-500">{'★'.repeat(ticket.rating)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Assignment */}
          <div className="card">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <User size={14} /> Assignment
            </h4>
            {ticket.assignedTeam && (
              <div className="flex items-center gap-2 mb-3 p-2 bg-indigo-50 rounded-lg border border-indigo-100">
                <Users size={14} className="text-indigo-500 shrink-0" />
                <div>
                  <p className="text-xs text-indigo-500 font-medium">Handling Team</p>
                  <p className="text-sm font-semibold text-indigo-700">{ticket.assignedTeam}</p>
                </div>
              </div>
            )}
            {ticket.assignedTo ? (
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-semibold text-blue-600">
                  {ticket.assignedTo.name?.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">{ticket.assignedTo.name}</p>
                  <p className="text-xs text-gray-400">{ticket.assignedTo.email}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400 mb-3">Not assigned</p>
            )}

            {canEdit && technicians.length > 0 && (
              <select onChange={(e) => handleAssign(e.target.value)} defaultValue={ticket.assignedTo?._id || ''}
                className="input-field text-sm">
                <option value="">Reassign to...</option>
                {technicians.map(t => (
                  <option key={t._id} value={t._id}>
                    {t.name} ({t.activeTickets} active)
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Status Update */}
          {canEdit && (
            <div className="card">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Edit size={14} /> Update Status
              </h4>
              <div className="grid grid-cols-1 gap-1.5">
                {STATUSES.map(s => (
                  <button key={s} onClick={() => handleStatusChange(s)}
                    className={`flex items-center justify-between text-xs py-2 px-3 rounded-lg border transition-all ${
                      ticket.status === s
                        ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}>
                    <span className="capitalize">{s.replace('-', ' ')}</span>
                    {ticket.status === s && <Check size={12} className="text-blue-600" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TicketDetail;
