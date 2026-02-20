import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import {
  Send,
  ArrowLeft,
  Sparkles,
  Loader2,
  Globe,
  MessageSquare,
  Mail,
  BookOpen,
  ExternalLink,
} from 'lucide-react';
import { CategoryBadge, PriorityBadge } from '../components/ui/Badge';

const channels = [
  { value: 'web', label: 'Web Portal', icon: Globe, desc: 'Submit via web form' },
  { value: 'chatbot', label: 'Chatbot', icon: MessageSquare, desc: 'Simulated chatbot intake' },
  { value: 'email', label: 'Email', icon: Mail, desc: 'Simulated email intake' },
];

export default function CreateTicket() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    description: '',
    channel: 'web',
  });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title.trim() || !form.description.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post('/tickets', form);
      const ticket = res.data.data.ticket;
      setResult(ticket);
      toast.success('Ticket created successfully!');
    } catch (err) {
      console.error('Failed to create ticket:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Success state — show AI classification result
  if (result) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="card p-8 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="text-emerald-600" size={28} />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Ticket Created Successfully</h2>
          <p className="text-slate-500 text-sm mb-6">
            Your ticket <span className="font-mono font-semibold text-primary-600">{result.ticketId}</span> has been submitted and processed by our AI engine.
          </p>

          {/* AI Classification Results */}
          <div className="bg-slate-50 rounded-xl p-5 text-left space-y-4 mb-6">
            <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Sparkles size={14} className="text-primary-500" />
              AI Classification Results
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">Category</p>
                <CategoryBadge category={result.category} />
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Priority</p>
                <PriorityBadge priority={result.priority} />
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Confidence</p>
                <span className="text-sm font-semibold text-slate-900">
                  {result.aiClassification?.confidence
                    ? `${(result.aiClassification.confidence * 100).toFixed(0)}%`
                    : 'N/A'}
                </span>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Assigned To</p>
                <span className="text-sm font-semibold text-slate-900">
                  {result.assignedTo?.name || 'Unassigned'}
                </span>
              </div>
            </div>
          </div>

          {/* AI Suggestions */}
          {result.aiSuggestions && result.aiSuggestions.length > 0 && (
            <div className="bg-indigo-50 rounded-xl p-5 text-left mb-6">
              <h3 className="text-sm font-semibold text-indigo-700 flex items-center gap-2 mb-3">
                <BookOpen size={14} />
                Suggested Knowledge Base Articles
              </h3>
              <div className="space-y-2">
                {result.aiSuggestions.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-start justify-between gap-2 bg-white rounded-lg p-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{s.title}</p>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{s.solution}</p>
                    </div>
                    {s.similarity != null && (
                      <span className="text-xs text-indigo-600 font-medium whitespace-nowrap">
                        {(s.similarity * 100).toFixed(0)}% match
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => navigate(`/tickets/${result._id}`)}
              className="btn-primary"
            >
              View Ticket
              <ExternalLink size={14} />
            </button>
            <button
              onClick={() => {
                setResult(null);
                setForm({ title: '', description: '', channel: 'web' });
              }}
              className="btn-secondary"
            >
              Create Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Create New Ticket</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Describe your issue and our AI will classify and route it automatically
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="card p-6 space-y-6">
        {/* Channel Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">
            Submission Channel
          </label>
          <div className="grid grid-cols-3 gap-3">
            {channels.map((ch) => (
              <button
                key={ch.value}
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, channel: ch.value }))}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${
                  form.channel === ch.value
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                }`}
              >
                <ch.icon size={20} />
                <span className="text-sm font-medium">{ch.label}</span>
                <span className="text-xs opacity-70">{ch.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1.5">
            Ticket Title <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            name="title"
            type="text"
            value={form.title}
            onChange={handleChange}
            placeholder="Brief summary of your issue..."
            className="input-field"
            maxLength={200}
            required
          />
          <p className="text-xs text-slate-400 mt-1">{form.title.length}/200 characters</p>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1.5">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Provide detailed information about the issue. Include error messages, affected systems, steps to reproduce, etc."
            className="input-field min-h-[160px] resize-y"
            maxLength={5000}
            rows={6}
            required
          />
          <p className="text-xs text-slate-400 mt-1">{form.description.length}/5000 characters</p>
        </div>

        {/* AI Info */}
        <div className="bg-gradient-to-r from-primary-50 to-violet-50 rounded-xl p-4 flex items-start gap-3">
          <Sparkles className="text-primary-500 flex-shrink-0 mt-0.5" size={18} />
          <div>
            <p className="text-sm font-medium text-primary-900">AI-Powered Processing</p>
            <p className="text-xs text-primary-700 mt-0.5">
              Our AI will automatically classify your ticket into the correct category (Network, Hardware, Software, Security, Access), predict priority level, assign the best available technician, and suggest relevant knowledge base articles.
            </p>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !form.title.trim() || !form.description.trim()}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                AI Processing...
              </>
            ) : (
              <>
                <Send size={16} />
                Submit Ticket
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
