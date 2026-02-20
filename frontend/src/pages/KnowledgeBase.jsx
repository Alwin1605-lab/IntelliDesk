import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../hooks/useAuth';
import { CategoryBadge } from '../components/ui/Badge';
import { PageLoader } from '../components/ui/Spinner';
import Modal from '../components/ui/Modal';
import toast from 'react-hot-toast';
import {
  BookOpen,
  Search,
  Filter,
  Eye,
  ThumbsUp,
  Tag,
  ChevronRight,
  PlusCircle,
  Loader2,
} from 'lucide-react';

export default function KnowledgeBasePage() {
  const { user } = useAuth();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    problem: '',
    solution: '',
    category: 'Software',
    tags: '',
  });

  const isStaff = user?.role === 'admin' || user?.role === 'technician';

  useEffect(() => {
    fetchArticles();
  }, [categoryFilter]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchArticles();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const params = { limit: 50 };
      if (search.trim()) params.search = search.trim();
      if (categoryFilter) params.category = categoryFilter;
      const res = await api.get('/knowledge-base', { params });
      setArticles(res.data.data.articles);
    } catch (err) {
      console.error('Failed to fetch articles:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewArticle = async (articleId) => {
    try {
      const res = await api.get(`/knowledge-base/${articleId}`);
      setSelectedArticle(res.data.data.article);
    } catch (err) {
      console.error('Failed to fetch article:', err);
    }
  };

  const handleHelpful = async (articleId) => {
    try {
      await api.patch(`/knowledge-base/${articleId}/helpful`);
      toast.success('Marked as helpful!');
      // Update local state
      if (selectedArticle?._id === articleId) {
        setSelectedArticle((prev) => ({
          ...prev,
          helpfulCount: (prev.helpfulCount || 0) + 1,
        }));
      }
      setArticles((prev) =>
        prev.map((a) =>
          a._id === articleId ? { ...a, helpfulCount: (a.helpfulCount || 0) + 1 } : a
        )
      );
    } catch (err) {
      console.error('Failed to mark helpful:', err);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!createForm.title.trim() || !createForm.problem.trim() || !createForm.solution.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setCreating(true);
      await api.post('/knowledge-base', {
        ...createForm,
        tags: createForm.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      });
      toast.success('Article created!');
      setShowCreateModal(false);
      setCreateForm({ title: '', problem: '', solution: '', category: 'Software', tags: '' });
      fetchArticles();
    } catch (err) {
      console.error('Failed to create article:', err);
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Knowledge Base</h1>
          <p className="text-slate-500 text-sm mt-1">
            Browse solutions and troubleshooting guides
          </p>
        </div>
        {isStaff && (
          <button onClick={() => setShowCreateModal(true)} className="btn-primary">
            <PlusCircle size={16} />
            New Article
          </button>
        )}
      </div>

      {/* Search & Filter */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search articles by title, problem, or solution..."
              className="input-field pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-slate-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Categories</option>
              <option value="Network">Network</option>
              <option value="Hardware">Hardware</option>
              <option value="Software">Software</option>
              <option value="Security">Security</option>
              <option value="Access">Access</option>
            </select>
          </div>
        </div>
      </div>

      {/* Articles Grid */}
      {loading ? (
        <PageLoader />
      ) : articles.length === 0 ? (
        <div className="card px-5 py-16 text-center">
          <BookOpen className="mx-auto text-slate-300 mb-3" size={48} />
          <p className="text-slate-500 font-medium">No articles found</p>
          <p className="text-sm text-slate-400 mt-1">
            {search ? 'Try a different search term' : 'No articles have been published yet'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {articles.map((article) => (
            <div
              key={article._id}
              onClick={() => handleViewArticle(article._id)}
              className="card p-5 hover:shadow-md cursor-pointer transition-all duration-200 group"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <CategoryBadge category={article.category} />
                <ChevronRight
                  size={16}
                  className="text-slate-300 group-hover:text-slate-500 transition-colors"
                />
              </div>
              <h3 className="text-sm font-semibold text-slate-900 mb-2 line-clamp-2 group-hover:text-primary-700 transition-colors">
                {article.title}
              </h3>
              <p className="text-xs text-slate-500 line-clamp-3 mb-3">{article.problem}</p>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Eye size={12} />
                    {article.viewCount || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <ThumbsUp size={12} />
                    {article.helpfulCount || 0}
                  </span>
                </div>
                <span className="text-xs text-slate-400">{formatDate(article.createdAt)}</span>
              </div>

              {article.tags && article.tags.length > 0 && (
                <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                  <Tag size={11} className="text-slate-300" />
                  {article.tags.slice(0, 3).map((tag, i) => (
                    <span
                      key={i}
                      className="text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                  {article.tags.length > 3 && (
                    <span className="text-xs text-slate-400">+{article.tags.length - 3}</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Article Detail Modal */}
      <Modal
        isOpen={!!selectedArticle}
        onClose={() => setSelectedArticle(null)}
        title={selectedArticle?.title || ''}
        size="lg"
      >
        {selectedArticle && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 flex-wrap">
              <CategoryBadge category={selectedArticle.category} />
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Eye size={12} /> {selectedArticle.viewCount} views
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <ThumbsUp size={12} /> {selectedArticle.helpfulCount} helpful
              </span>
              <span className="text-xs text-slate-400">
                By {selectedArticle.createdBy?.name || 'Unknown'} on{' '}
                {formatDate(selectedArticle.createdAt)}
              </span>
            </div>

            {/* Problem */}
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-2">Problem</h4>
              <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                <p className="text-sm text-slate-700 whitespace-pre-wrap">
                  {selectedArticle.problem}
                </p>
              </div>
            </div>

            {/* Solution */}
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-2">Solution</h4>
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                <p className="text-sm text-slate-700 whitespace-pre-wrap">
                  {selectedArticle.solution}
                </p>
              </div>
            </div>

            {/* Tags */}
            {selectedArticle.tags && selectedArticle.tags.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-2">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedArticle.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="text-xs px-3 py-1 bg-slate-100 text-slate-600 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <button
                onClick={() => handleHelpful(selectedArticle._id)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
              >
                <ThumbsUp size={14} />
                Helpful ({selectedArticle.helpfulCount || 0})
              </button>
              <button
                onClick={() => setSelectedArticle(null)}
                className="btn-secondary text-sm"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Create Article Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Knowledge Base Article"
        size="lg"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={createForm.title}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Article title"
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              value={createForm.category}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, category: e.target.value }))}
              className="input-field"
            >
              <option value="Network">Network</option>
              <option value="Hardware">Hardware</option>
              <option value="Software">Software</option>
              <option value="Security">Security</option>
              <option value="Access">Access</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Problem Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={createForm.problem}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, problem: e.target.value }))}
              placeholder="Describe the problem..."
              className="input-field min-h-[100px] resize-y"
              rows={4}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Solution <span className="text-red-500">*</span>
            </label>
            <textarea
              value={createForm.solution}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, solution: e.target.value }))}
              placeholder="Step-by-step solution..."
              className="input-field min-h-[120px] resize-y"
              rows={5}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={createForm.tags}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, tags: e.target.value }))}
              placeholder="e.g. vpn, connectivity, remote"
              className="input-field"
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <PlusCircle size={16} />
                  Create Article
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
