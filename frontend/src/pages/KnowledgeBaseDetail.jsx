import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { CategoryBadge } from '../components/Badges';
import { format, formatDistanceToNow } from 'date-fns';
import {
  ArrowLeft, Eye, ThumbsUp, ThumbsDown, Tag,
  Users, Ticket, BookOpen, Send, Edit2, CheckCircle2,
  MessageSquare, ExternalLink,
} from 'lucide-react';

const CATEGORIES = ['network', 'software', 'hardware', 'authentication', 'email', 'database', 'security', 'other'];
const initialForm = { title: '', content: '', category: 'software', tags: '' };

export default function KnowledgeBaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canEdit = user?.role === 'admin' || user?.role === 'technician';

  const [article, setArticle]       = useState(null);
  const [loading, setLoading]       = useState(true);
  const [commentText, setCommentText] = useState('');
  const [posting, setPosting]       = useState(false);
  const [showEdit, setShowEdit]     = useState(false);
  const [form, setForm]             = useState(initialForm);
  const [saving, setSaving]         = useState(false);

  const fetchArticle = useCallback(async () => {
    try {
      const { data } = await api.get(`/kb/${id}`);
      setArticle(data.data);
    } catch {
      toast.error('Failed to load article');
      navigate('/kb');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchArticle(); }, [fetchArticle]);

  const handleRate = async (type) => {
    try {
      await api.post(`/kb/${id}/rate`, { rating: type });
      toast.success(type === 'helpful' ? 'Thanks for your feedback!' : 'Feedback recorded');
      fetchArticle();
    } catch {
      toast.error('Could not record feedback');
    }
  };

  const handleComment = async () => {
    if (!commentText.trim()) return;
    setPosting(true);
    try {
      await api.post(`/kb/${id}/comments`, { text: commentText.trim() });
      setCommentText('');
      toast.success('Comment posted');
      fetchArticle();
    } catch {
      toast.error('Failed to post comment');
    } finally {
      setPosting(false);
    }
  };

  const openEdit = () => {
    if (!article) return;
    setForm({
      title: article.title,
      content: article.content,
      category: article.category,
      tags: (article.tags || []).join(', '),
    });
    setShowEdit(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      };
      await api.put(`/kb/${id}`, payload);
      toast.success('Article updated');
      setShowEdit(false);
      fetchArticle();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 gap-3">
      <div className="w-8 h-8 border-[3px] border-blue-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-gray-400">Loading article…</p>
    </div>
  );

  if (!article) return null;

  return (
    <div className="max-w-4xl mx-auto pb-12 fade-in">

      {/* Back */}
      <button onClick={() => navigate('/kb')}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-5 transition-colors group">
        <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
        Back to Knowledge Base
      </button>

      {/* Header card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-5 overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-blue-500 to-violet-500" />
        <div className="px-7 py-6">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <CategoryBadge category={article.category} />
            {article.affectedCount > 1 && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                <Users size={11} />
                {article.affectedCount} people affected
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4 leading-snug">{article.title}</h1>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-500">
            <span className="flex items-center gap-1.5">
              <Eye size={13} className="text-gray-400" />
              {article.views || 0} views
            </span>
            <span className="flex items-center gap-1.5 text-green-600">
              <ThumbsUp size={13} />
              {article.helpful || 0} helpful
            </span>
            <span className="flex items-center gap-1.5 text-red-500">
              <ThumbsDown size={13} />
              {article.notHelpful || 0} not helpful
            </span>
            {article.sourceTicket && (
              <Link
                to={`/tickets/${article.sourceTicket._id}`}
                className="inline-flex items-center gap-1 text-blue-600 hover:underline text-xs font-medium"
              >
                <Ticket size={12} />
                Source ticket: {article.sourceTicket.ticketId || 'View'}
                <ExternalLink size={10} />
              </Link>
            )}
            <span className="text-xs text-gray-400">
              {article.createdAt ? format(new Date(article.createdAt), 'dd MMM yyyy') : ''}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Main content */}
        <div className="lg:col-span-2 space-y-5">

          {/* Content */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">Solution</p>
              {canEdit && (
                <button onClick={openEdit}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg border border-transparent hover:border-blue-100 transition-all">
                  <Edit2 size={13} /> Edit
                </button>
              )}
            </div>
            <pre className="whitespace-pre-wrap font-sans text-sm text-gray-700 leading-relaxed">
              {article.content}
            </pre>
            {article.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-5 pt-4 border-t border-gray-100">
                {article.tags.map(tag => (
                  <span key={tag} className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-600 text-xs rounded-full">
                    <Tag size={10} /> {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Rating */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <p className="text-sm font-semibold text-gray-700 mb-3">Was this helpful?</p>
            <div className="flex gap-3">
              <button onClick={() => handleRate('helpful')}
                className="flex items-center gap-2 px-4 py-2 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-lg text-sm font-medium transition-colors">
                <ThumbsUp size={14} /> Yes, it helped
              </button>
              <button onClick={() => handleRate('notHelpful')}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-sm font-medium transition-colors">
                <ThumbsDown size={14} /> Not really
              </button>
            </div>
          </div>

          {/* Comments */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-5">
              Comments · {article.comments?.length || 0}
            </p>

            {(!article.comments || article.comments.length === 0) && (
              <div className="text-center py-8">
                <MessageSquare size={24} className="mx-auto text-gray-200 mb-2" />
                <p className="text-sm text-gray-400">No comments yet</p>
              </div>
            )}

            <div className="space-y-5 mb-5">
              {article.comments?.map((c, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-8 h-8 bg-violet-500 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0">
                    {c.author?.name?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="text-sm font-semibold text-gray-800">{c.author?.name || 'Unknown'}</span>
                      <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded capitalize">{c.author?.role}</span>
                      <span className="text-xs text-gray-400 ml-auto">
                        {c.createdAt ? formatDistanceToNow(new Date(c.createdAt), { addSuffix: true }) : ''}
                      </span>
                    </div>
                    <div className="text-sm text-gray-700 leading-relaxed p-3.5 rounded-lg bg-gray-50 border border-gray-100 whitespace-pre-wrap">
                      {c.text}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Comment box */}
            <div className="border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
              <textarea
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="Add a comment…"
                rows={3}
                className="w-full px-4 py-3 text-sm text-gray-800 placeholder-gray-400 resize-none focus:outline-none bg-white"
              />
              <div className="flex items-center justify-end px-3 py-2.5 bg-gray-50 border-t border-gray-100">
                <button
                  onClick={handleComment}
                  disabled={!commentText.trim() || posting}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition-all">
                  {posting
                    ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <Send size={13} />}
                  Post
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">

          {/* Affected / linked tickets */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <Users size={14} className="text-orange-500" />
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Impact</p>
            </div>
            <div className="px-5 py-4">
              <div className="text-3xl font-bold text-orange-600 mb-1">{article.affectedCount || 1}</div>
              <p className="text-xs text-gray-500">people / tickets affected</p>
            </div>
          </div>

          {/* Linked tickets */}
          {article.linkedTickets?.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <Ticket size={14} className="text-blue-500" />
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Linked Tickets</p>
              </div>
              <div className="px-5 py-3 space-y-2">
                {article.linkedTickets.map(t => (
                  <Link key={t._id} to={`/tickets/${t._id}`}
                    className="flex items-center gap-2 p-2 hover:bg-blue-50 rounded-lg transition-colors group">
                    <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded group-hover:bg-blue-100">
                      {t.ticketId}
                    </span>
                    <span className="text-xs text-gray-600 truncate">{t.title}</span>
                    <ExternalLink size={10} className="text-gray-300 shrink-0 ml-auto" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Source ticket */}
          {article.sourceTicket && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <CheckCircle2 size={14} className="text-green-500" />
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Created From</p>
              </div>
              <div className="px-5 py-4">
                <Link to={`/tickets/${article.sourceTicket._id}`}
                  className="flex items-center gap-2 text-sm text-blue-600 hover:underline font-medium">
                  <Ticket size={13} />
                  {article.sourceTicket.ticketId || 'View ticket'}
                  <ExternalLink size={11} />
                </Link>
                {article.sourceTicket.title && (
                  <p className="text-xs text-gray-500 mt-1 leading-snug">{article.sourceTicket.title}</p>
                )}
              </div>
            </div>
          )}

          {/* Article meta */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <BookOpen size={14} className="text-gray-400" />
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Article Info</p>
            </div>
            <div className="px-5 py-3 text-sm divide-y divide-gray-50">
              {[
                { label: 'Category', value: <span className="capitalize">{article.category}</span> },
                { label: 'Views', value: article.views || 0 },
                { label: 'Helpful', value: article.helpful || 0 },
                { label: 'Created', value: article.createdAt ? format(new Date(article.createdAt), 'dd MMM yyyy') : '—' },
                { label: 'Updated', value: article.updatedAt ? format(new Date(article.updatedAt), 'dd MMM yyyy') : '—' },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between py-2.5">
                  <span className="text-gray-500 text-xs">{label}</span>
                  <span className="text-gray-800 font-medium text-xs text-right">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Edit modal */}
      {showEdit && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="font-bold text-gray-800">Edit Article</h3>
              <button onClick={() => setShowEdit(false)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400">✕</button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
                <input className="input-field w-full" required value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
                <select className="input-field w-full" value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Content</label>
                <textarea className="input-field w-full" required rows={8} value={form.content}
                  onChange={e => setForm(f => ({ ...f, content: e.target.value }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Tags (comma-separated)</label>
                <input className="input-field w-full" value={form.tags}
                  onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowEdit(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 disabled:opacity-60">
                  {saving ? 'Saving…' : 'Update Article'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
