import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTickets } from '../context/TicketContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Wand2, Send, AlertCircle, Lightbulb, Users, BookOpen, ExternalLink } from 'lucide-react';
import { PriorityBadge, CategoryBadge } from '../components/Badges';

const CATEGORIES = ['network', 'software', 'hardware', 'authentication', 'email', 'database', 'security', 'hr', 'other'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];
const SOURCES = ['web', 'email', 'chatbot', 'api', 'mobile'];

const CreateTicket = () => {
  const navigate = useNavigate();
  const { createTicket, classifyTicket } = useTickets();
  const [loading, setLoading] = useState(false);
  const [classifying, setClassifying] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [kbSuggestions, setKbSuggestions] = useState([]);
  const [kbConfirmed, setKbConfirmed] = useState(false);

  const [form, setForm] = useState({
    title: '', description: '', source: 'web',
    category: '', priority: '', tags: ''
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const fetchKbSuggestions = useCallback(async (title, category) => {
    if (!title || title.length < 3) { setKbSuggestions([]); return; }
    try {
      const params = { title };
      if (category) params.category = category;
      const { data } = await api.get('/kb/suggest', { params });
      setKbSuggestions(data.data || []);
    } catch {
      // silently ignore
    }
  }, []);

  const handleAIClassify = async () => {
    if (!form.title || !form.description) {
      toast.error('Please enter title and description first');
      return;
    }
    setClassifying(true);
    try {
      const result = await classifyTicket(form.title, form.description);
      setAiResult(result);
      setForm((f) => ({ ...f, category: result.category, priority: result.priority }));
      toast.success('AI classification complete!');
    } catch {
      toast.error('AI classification failed, please select manually');
    } finally {
      setClassifying(false);
    }
  };

  // Auto-classify when title + description are filled
  useEffect(() => {
    if (form.title.length > 10 && form.description.length > 20) {
      const timer = setTimeout(handleAIClassify, 1500);
      return () => clearTimeout(timer);
    }
  }, [form.title, form.description]);

  // Fetch KB suggestions whenever title or category changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setKbConfirmed(false);
      fetchKbSuggestions(form.title, form.category);
    }, 300);
    return () => clearTimeout(timer);
  }, [form.title, form.category, fetchKbSuggestions]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      toast.error('Title and description are required');
      return;
    }

    // Gate: always check KB at submit time, regardless of kbConfirmed state
    if (!kbConfirmed) {
      try {
        const params = { title: form.title };
        if (form.category) params.category = form.category;
        const { data } = await api.get('/kb/suggest', { params });
        const fresh = data.data || [];
        if (fresh.length > 0) {
          setKbSuggestions(fresh);
          setKbConfirmed(false);
          toast.error('Please review the existing KB solutions before submitting', { duration: 5000 });
          return; // hard block
        }
      } catch {
        // if suggest fails, allow submit
      }
    }

    setLoading(true);
    try {
      const tags = form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
      const ticket = await createTicket({ ...form, tags });
      navigate(`/tickets/${ticket._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto fade-in">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800">Raise a Support Ticket</h2>
        <p className="text-gray-500 text-sm mt-1">AI will automatically classify and prioritize your ticket</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="card space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Issue Title <span className="text-red-500">*</span>
              </label>
              <input
                name="title" value={form.title} onChange={handleChange}
                required maxLength={150} placeholder="Brief description of the issue"
                className="input-field"
              />
              <p className="text-xs text-gray-400 mt-1">{form.title.length}/150</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Detailed Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description" value={form.description} onChange={handleChange}
                required rows={5} placeholder="Describe your issue in detail. Include:&#10;• What happened?&#10;• When did it start?&#10;• Error messages?&#10;• Who is affected?"
                className="input-field resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Category
                  <span className="ml-2 text-xs text-blue-500 font-normal">auto-detected</span>
                </label>
                <select name="category" value={form.category} onChange={handleChange} className="input-field">
                  <option value="">— AI will detect —</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Priority
                  <span className="ml-2 text-xs text-blue-500 font-normal">auto-detected</span>
                </label>
                <select name="priority" value={form.priority} onChange={handleChange} className="input-field">
                  <option value="">— AI will detect —</option>
                  {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Source</label>
                <select name="source" value={form.source} onChange={handleChange} className="input-field">
                  {SOURCES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Tags</label>
                <input name="tags" value={form.tags} onChange={handleChange}
                  placeholder="vpn, urgent, floor-3" className="input-field" />
                <p className="text-xs text-gray-400 mt-1">Comma-separated</p>
              </div>
            </div>

            {/* KB blocker — shown inline in form when suggestions exist */}
            {kbSuggestions.length > 0 && !kbConfirmed && (
              <div className="rounded-xl border-2 border-amber-400 bg-amber-50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen size={16} className="text-amber-600 shrink-0" />
                  <p className="text-sm font-bold text-amber-800">Solution already exists in Knowledge Base!</p>
                </div>
                <p className="text-xs text-amber-700 mb-3">
                  We found existing articles that may solve your issue. Please review them before submitting a new ticket.
                </p>
                <div className="space-y-2 mb-3">
                  {kbSuggestions.slice(0, 3).map(a => (
                    <Link key={a._id} to={`/kb/${a._id}`} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2.5 bg-white border border-amber-300 hover:border-amber-500 rounded-lg transition-colors group">
                      <BookOpen size={13} className="text-amber-500 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-gray-800 group-hover:text-blue-600 transition-colors truncate">{a.title}</p>
                        <p className="text-xs text-gray-400 capitalize">{a.category}</p>
                      </div>
                      <span className="text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded shrink-0">
                        View Solution
                      </span>
                      <ExternalLink size={10} className="text-gray-300 shrink-0" />
                    </Link>
                  ))}
                </div>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={kbConfirmed}
                    onChange={e => setKbConfirmed(e.target.checked)}
                    className="rounded accent-amber-600 w-4 h-4"
                  />
                  <span className="text-xs font-semibold text-amber-800">
                    I've checked the articles above and still need to submit a ticket
                  </span>
                </label>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button" onClick={handleAIClassify} disabled={classifying}
                className="flex items-center gap-2 btn-secondary text-sm"
              >
                {classifying
                  ? <div className="w-3.5 h-3.5 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
                  : <Wand2 size={14} />
                }
                AI Classify
              </button>
              <button type="submit" disabled={loading || (kbSuggestions.length > 0 && !kbConfirmed)}
                className="flex-1 btn-primary flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                {loading
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <><Send size={14} /> Submit Ticket</>
                }
              </button>
            </div>
          </form>
        </div>

        {/* Sidebar info */}
        <div className="space-y-4">
          {/* KB Suggestions — sidebar copy (collapsed once confirmed) */}
          {kbSuggestions.length > 0 && !kbConfirmed && (
            <div className="card border-l-4 border-amber-400 bg-amber-50 fade-in">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen size={15} className="text-amber-600" />
                <h4 className="text-sm font-semibold text-amber-800">Solutions Found</h4>
              </div>
              <p className="text-xs text-amber-700">Check the form for existing KB articles before submitting.</p>
            </div>
          )}
          {/* AI Result */}
          {aiResult && (
            <div className="card border-l-4 border-blue-500 fade-in">
              <div className="flex items-center gap-2 mb-3">
                <Wand2 size={15} className="text-blue-600" />
                <h4 className="text-sm font-semibold text-gray-800">AI Classification</h4>
                <span className="text-xs text-gray-400 ml-auto">{Math.round(aiResult.confidence * 100)}% confident</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Category</span>
                  <CategoryBadge category={aiResult.category} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Priority</span>
                  <PriorityBadge priority={aiResult.priority} />
                </div>
                {aiResult.assignedTeam && (
                  <div className="flex items-center justify-between pt-1.5 border-t border-gray-100 mt-1">
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Users size={11} className="text-gray-400" />
                      Assigned Team
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">
                      {aiResult.assignedTeam}
                    </span>
                  </div>
                )}
              </div>
              {aiResult.aiSuggestions?.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Lightbulb size={13} className="text-yellow-500" />
                    <span className="text-xs font-medium text-gray-700">Suggested Steps</span>
                  </div>
                  <ul className="space-y-1">
                    {aiResult.aiSuggestions.slice(0, 3).map((s, i) => (
                      <li key={i} className="text-xs text-gray-600 flex gap-1.5">
                        <span className="text-blue-400 shrink-0">{i + 1}.</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* SLA info */}
          <div className="card">
            <h4 className="text-sm font-semibold text-gray-800 mb-3">⏱️ SLA Commitments</h4>
            {[
              { level: 'Critical', time: '1 hour', color: 'text-red-600' },
              { level: 'High', time: '4 hours', color: 'text-orange-600' },
              { level: 'Medium', time: '24 hours', color: 'text-yellow-600' },
              { level: 'Low', time: '72 hours', color: 'text-green-600' }
            ].map(({ level, time, color }) => (
              <div key={level} className="flex justify-between items-center py-1.5 border-b border-gray-50 last:border-0">
                <span className={`text-xs font-semibold ${color}`}>{level}</span>
                <span className="text-xs text-gray-500">{time} resolution</span>
              </div>
            ))}
          </div>

          {/* Tips */}
          <div className="card bg-blue-50 border-blue-100">
            <div className="flex items-start gap-2">
              <AlertCircle size={15} className="text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-blue-800 mb-1.5">Tips for faster resolution</p>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• Include exact error messages</li>
                  <li>• Mention number of users affected</li>
                  <li>• Note when the issue started</li>
                  <li>• Attach screenshots if possible</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateTicket;
