import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Search, Plus, ThumbsUp, ThumbsDown, Eye, BookOpen, X, Tag, Users } from 'lucide-react';
import { CategoryBadge } from '../components/Badges';

const CATEGORIES = ['network', 'software', 'hardware', 'authentication', 'email', 'database', 'security', 'other'];
const initialForm = { title: '', content: '', category: 'software', tags: '' };

const KnowledgeBase = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const canCreate = user?.role === 'admin' || user?.role === 'technician';

  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchArticles = useCallback(async () => {
    try {
      const params = {};
      if (search) params.search = search;
      if (catFilter) params.category = catFilter;
      const { data } = await api.get('/kb', { params });
      setArticles(data.data || []);
    } catch {
      toast.error('Failed to load articles');
    } finally {
      setLoading(false);
    }
  }, [search, catFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchArticles, 350);
    return () => clearTimeout(timer);
  }, [fetchArticles]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean)
      };
      await api.post('/kb', payload);
      toast.success('Article created');
      setShowCreate(false);
      setForm(initialForm);
      fetchArticles();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save article');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Knowledge Base</h2>
          <p className="text-sm text-gray-500 mt-1">Self-service IT solutions and guides</p>
        </div>
        {canCreate && (
          <button onClick={() => { setForm(initialForm); setShowCreate(true); }} className="btn-primary flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" /> New Article
          </button>
        )}
      </div>

      {/* Search & Filter */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-52">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input className="input-field pl-9 w-full" placeholder="Search articles..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input-field w-44" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
        </select>
      </div>

      {/* Articles Grid */}
      {loading ? (
        <p className="text-center py-16 text-gray-400">Loading articles...</p>
      ) : articles.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No articles found</p>
          <p className="text-gray-400 text-sm mt-1">Try a different search term or category</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {articles.map(a => (
            <div key={a._id} onClick={() => navigate(`/kb/${a._id}`)}
              className="card cursor-pointer hover:border-blue-200 hover:shadow-md transition-all group">
              <div className="flex items-start justify-between mb-2.5">
                <CategoryBadge category={a.category} />
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Eye className="w-3 h-3" /> {a.views || 0}
                </span>
              </div>
              <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2 leading-snug">
                {a.title}
              </h3>
              <p className="text-sm text-gray-500 line-clamp-2 mb-3 leading-relaxed">
                {a.content?.slice(0, 120)}...
              </p>
              {a.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {a.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
                      <Tag className="w-2.5 h-2.5" /> {tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-3 text-xs text-gray-400 pt-2 border-t border-gray-50">
                <span className="flex items-center gap-1 text-green-600"><ThumbsUp className="w-3 h-3" />{a.helpful || 0}</span>
                <span className="flex items-center gap-1 text-red-500"><ThumbsDown className="w-3 h-3" />{a.notHelpful || 0}</span>
                {a.affectedCount > 1 && (
                  <span className="flex items-center gap-1 text-orange-600 ml-auto font-semibold">
                    <Users className="w-3 h-3" />{a.affectedCount} affected
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="font-bold text-gray-800">Create Article</h3>
              <button onClick={() => setShowCreate(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
                <input className="input-field w-full" required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="How to fix VPN connection issues..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
                <select className="input-field w-full" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Content</label>
                <textarea className="input-field w-full" required rows={8} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Step-by-step solution..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Tags (comma-separated)</label>
                <input className="input-field w-full" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="vpn, remote-access, network" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1 disabled:opacity-60">
                  {submitting ? 'Saving...' : 'Create Article'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeBase;
