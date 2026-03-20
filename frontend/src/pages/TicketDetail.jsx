import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTickets } from '../context/TicketContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { PriorityBadge, StatusBadge, CategoryBadge } from '../components/Badges';
import { format, formatDistanceToNow } from 'date-fns';
import {
  ArrowLeft, User, Send, Lightbulb, Star,
  MessageSquare, History, Bot, Users,
  CheckCircle2, ClipboardCheck, Clock,
  Calendar, AlertCircle, RotateCcw,
  Lock, Info, Paperclip, X, FileText,
  Image as ImageIcon, Download, ExternalLink,
  BookOpen, Link2,
} from 'lucide-react';

/* ─────────────────────────────────────────
   WORKFLOW CONFIG
───────────────────────────────────────── */
const WORKFLOW = ['open', 'in-progress', 'pending', 'resolved', 'closed'];
const STEP_META = {
  'open':        { label: 'Open',        desc: 'Ticket received, awaiting assignment' },
  'in-progress': { label: 'In Progress', desc: 'Technician is actively working on this' },
  'pending':     { label: 'Pending',     desc: 'Waiting for info or a third party' },
  'resolved':    { label: 'Resolved',    desc: 'Issue fixed — solution provided' },
  'closed':      { label: 'Closed',      desc: 'Ticket closed and archived' },
};

/* ─────────────────────────────────────────
   HELPER: render text with clickable links
───────────────────────────────────────── */
const URL_RE = /https?:\/\/[^\s<>"']+/g;

function TextWithLinks({ text }) {
  if (!text) return null;
  const parts = [];
  let last = 0;
  let match;
  const re = new RegExp(URL_RE.source, 'g');
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    parts.push(
      <a key={match.index} href={match[0]} target="_blank" rel="noopener noreferrer"
        className="inline-flex items-center gap-0.5 text-blue-600 underline decoration-blue-300 underline-offset-2 hover:text-blue-800 break-all">
        {match[0]}
        <ExternalLink size={11} className="shrink-0 ml-0.5 opacity-60" />
      </a>
    );
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}

/* ─────────────────────────────────────────
   HELPER: attachment pill / preview
───────────────────────────────────────── */
const BYTES = (n) => n < 1024 ? `${n} B` : n < 1048576 ? `${(n/1024).toFixed(1)} KB` : `${(n/1048576).toFixed(1)} MB`;

function AttachmentList({ attachments }) {
  if (!attachments?.length) return null;
  return (
    <div className="flex flex-wrap gap-2 mt-2.5">
      {attachments.map((a, i) => {
        const isImage = a.mimetype?.startsWith('image/');
        const href = a.url;
        return isImage ? (
          <a key={i} href={href} target="_blank" rel="noopener noreferrer"
            className="block rounded-lg overflow-hidden border border-gray-200 hover:border-blue-300 transition-colors"
            style={{ width: 96, height: 72 }}>
            <img src={href} alt={a.originalName}
              className="w-full h-full object-cover" />
          </a>
        ) : (
          <a key={i} href={href} target="_blank" rel="noopener noreferrer" download={a.originalName}
            className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 hover:bg-blue-50 hover:border-blue-200 rounded-lg text-xs text-gray-700 transition-colors max-w-[220px]">
            <FileText size={14} className="text-blue-500 shrink-0" />
            <span className="truncate font-medium">{a.originalName}</span>
            <span className="text-gray-400 shrink-0">{BYTES(a.size)}</span>
            <Download size={12} className="text-gray-400 shrink-0" />
          </a>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────
   HELPER: file staging preview
───────────────────────────────────────── */
function StagedFiles({ files, onRemove }) {
  if (!files.length) return null;
  return (
    <div className="flex flex-wrap gap-2 px-3 pt-2">
      {files.map((f, i) => {
        const isImage = f.type.startsWith('image/');
        const previewUrl = isImage ? URL.createObjectURL(f) : null;
        return (
          <div key={i} className="relative group flex items-center gap-1.5 bg-gray-100 border border-gray-200 rounded-lg overflow-hidden">
            {isImage ? (
              <img src={previewUrl} alt={f.name}
                className="w-12 h-10 object-cover" />
            ) : (
              <div className="w-12 h-10 flex items-center justify-center bg-gray-200">
                <FileText size={18} className="text-gray-500" />
              </div>
            )}
            <span className="text-xs text-gray-600 max-w-[100px] truncate pr-1">{f.name}</span>
            <button onClick={() => onRemove(i)}
              className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <X size={9} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────── */
export default function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { updateTicket } = useTickets();
  const fileInputRef = useRef(null);

  const [ticket, setTicket]                 = useState(null);
  const [loading, setLoading]               = useState(true);
  const [comment, setComment]               = useState('');
  const [stagedFiles, setStagedFiles]       = useState([]);
  const [isInternal, setIsInternal]         = useState(false);
  const [sending, setSending]               = useState(false);
  const [technicians, setTechnicians]       = useState([]);
  const [rating, setRating]                 = useState(0);
  const [feedback, setFeedback]             = useState('');
  const [activeTab, setActiveTab]           = useState('details');
  const [resolutionText, setResolutionText] = useState('');
  const [pendingStatus, setPendingStatus]   = useState(null);
  const [savingStatus, setSavingStatus]     = useState(false);
  const [lightbox, setLightbox]             = useState(null); // url string
  const [creatingKb, setCreatingKb]         = useState(false);
  const [kbArticles, setKbArticles]         = useState([]);
  const [linkingKb, setLinkingKb]           = useState(false);
  const [selectedKbId, setSelectedKbId]     = useState('');

  useEffect(() => {
    api.get(`/tickets/${id}`).then(({ data }) => {
      setTicket(data.data);
      setResolutionText(data.data.resolution || '');
    }).finally(() => setLoading(false));
    if (user.role !== 'user') {
      api.get('/users/technicians').then(({ data }) => setTechnicians(data.data));
    }
  }, [id]);

  /* ── File staging ── */
  const handleFileSelect = (e) => {
    const newFiles = Array.from(e.target.files || []);
    setStagedFiles(prev => [...prev, ...newFiles].slice(0, 5));
    e.target.value = '';
  };

  const handlePaste = (e) => {
    const items = Array.from(e.clipboardData?.items || []);
    const imageItems = items.filter(it => it.kind === 'file' && it.type.startsWith('image/'));
    if (imageItems.length) {
      const newFiles = imageItems.map(it => it.getAsFile()).filter(Boolean);
      setStagedFiles(prev => [...prev, ...newFiles].slice(0, 5));
    }
    // text paste is handled natively by the textarea
  };

  const removeFile = (idx) => setStagedFiles(prev => prev.filter((_, i) => i !== idx));

  /* ── Post comment ── */
  const handleComment = async () => {
    if (!comment.trim() && stagedFiles.length === 0) return;
    setSending(true);
    try {
      const fd = new FormData();
      fd.append('text', comment.trim());
      fd.append('isInternal', isInternal ? 'true' : 'false');
      stagedFiles.forEach(f => fd.append('files', f));

      const { data } = await api.post(`/tickets/${id}/comments`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setTicket(t => ({ ...t, comments: data.data }));
      setComment('');
      setStagedFiles([]);
      toast.success('Comment added');
    } catch { toast.error('Failed to add comment'); }
    finally { setSending(false); }
  };

  /* ── Feedback ── */
  const handleFeedback = async () => {
    try {
      await api.post(`/tickets/${id}/feedback`, { rating, feedback });
      toast.success('Thank you for your feedback!');
    } catch { toast.error('Failed to submit feedback'); }
  };

  /* ── Workflow ── */
  const handleStepClick = (targetStatus) => {
    if (!canEdit || ticket.status === targetStatus) return;
    if (targetStatus === 'resolved') { setPendingStatus('resolved'); return; }
    applyStatus(targetStatus);
  };

  const applyStatus = async (status, resolution) => {
    setSavingStatus(true);
    try {
      const payload = { status };
      if (resolution) payload.resolution = resolution;
      const updated = await updateTicket(id, payload);
      setTicket(updated);
      setResolutionText(updated.resolution || '');
      setPendingStatus(null);
      toast.success(`Status → ${STEP_META[status].label}`);
      if (status === 'resolved' && updated.relatedArticles?.length > 0) {
        toast.success('KB article auto-published to Knowledge Base!', { duration: 4000 });
      }
    } catch { toast.error('Failed to update status'); }
    finally { setSavingStatus(false); }
  };

  const submitResolution = async () => {
    if (!resolutionText.trim()) {
      toast.error('Please describe the resolution first');
      return;
    }
    await applyStatus('resolved', resolutionText.trim());
  };

  /* ── Assign ── */
  const handleAssign = async (techId) => {
    try { setTicket(await updateTicket(id, { assignedTo: techId })); }
    catch { toast.error('Failed to assign ticket'); }
  };

  /* ── KB: create from ticket ── */
  const handleCreateKb = async () => {
    setCreatingKb(true);
    try {
      const { data } = await api.post(`/kb/from-ticket/${id}`);
      toast.success('KB article created!');
      // refresh ticket so relatedArticles updates
      const refreshed = await api.get(`/tickets/${id}`);
      setTicket(refreshed.data.data);
      // navigate to the new article
      navigate(`/kb/${data.data._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create KB article');
    } finally {
      setCreatingKb(false);
    }
  };

  /* ── KB: link existing ── */
  const fetchKbArticles = async () => {
    if (kbArticles.length > 0) return;
    try {
      const { data } = await api.get('/kb');
      setKbArticles(data.data || []);
    } catch { /* ignore */ }
  };

  const handleLinkKb = async () => {
    if (!selectedKbId) return;
    setLinkingKb(true);
    try {
      await api.post(`/kb/${selectedKbId}/link-ticket`, { ticketId: id });
      toast.success('Ticket linked to KB article');
      const refreshed = await api.get(`/tickets/${id}`);
      setTicket(refreshed.data.data);
      setSelectedKbId('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to link ticket');
    } finally {
      setLinkingKb(false);
    }
  };

  /* ── Loading / not found ── */
  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 gap-3">
      <div className="w-8 h-8 border-[3px] border-blue-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-gray-400">Loading ticket…</p>
    </div>
  );
  if (!ticket) return (
    <div className="text-center py-24">
      <AlertCircle size={36} className="mx-auto text-gray-300 mb-3" />
      <p className="font-medium text-gray-500">Ticket not found</p>
      <button onClick={() => navigate('/tickets')} className="btn-primary mt-4 text-sm">Back to Tickets</button>
    </div>
  );

  const canEdit    = user.role !== 'user';
  const currentIdx = WORKFLOW.indexOf(ticket.status);
  const isResolved = ['resolved', 'closed'].includes(ticket.status);

  const InfoRow = ({ label, value, highlight }) => (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className={`text-sm font-medium text-right ${highlight ? 'text-red-500' : 'text-gray-800'}`}>{value || '—'}</span>
    </div>
  );

  const TABS = [
    { key: 'details',     label: 'Details',    Icon: Info },
    { key: 'comments',    label: 'Comments',   Icon: MessageSquare, count: ticket.comments?.length },
    { key: 'ai-analysis', label: 'AI Analysis', Icon: Bot },
    { key: 'history',     label: 'History',    Icon: History },
  ];

  /* ════════════════════════════════ RENDER ════════════════════════════════ */
  return (
    <div className="max-w-6xl mx-auto pb-12 fade-in">

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="preview"
            className="max-w-full max-h-full rounded-xl shadow-2xl"
            onClick={e => e.stopPropagation()} />
          <button onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 w-9 h-9 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white transition-colors">
            <X size={18} />
          </button>
        </div>
      )}

      {/* ── Back ── */}
      <button onClick={() => navigate('/tickets')}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-5 transition-colors group">
        <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
        Back to tickets
      </button>

      {/* ════ HEADER ════ */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-5 overflow-hidden">
        <div className={`h-1 w-full ${
          ticket.status === 'open'        ? 'bg-blue-500'   :
          ticket.status === 'in-progress' ? 'bg-violet-500' :
          ticket.status === 'pending'     ? 'bg-amber-400'  :
          ticket.status === 'resolved'    ? 'bg-green-500'  : 'bg-gray-400'
        }`} />
        <div className="px-7 py-5">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-md">
              {ticket.ticketId}
            </span>
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
            <CategoryBadge category={ticket.category} />
            {ticket.assignedTeam && (
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-100">
                <Users size={11} />{ticket.assignedTeam}
              </span>
            )}
            {ticket.slaBreached && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-600 border border-red-200">
                <AlertCircle size={11} />SLA Breached
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3 leading-snug">{ticket.title}</h1>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-gray-500">
            <span className="flex items-center gap-1.5">
              <User size={13} className="text-gray-400" />
              Opened by&nbsp;<span className="font-semibold text-gray-700">{ticket.createdBy?.name}</span>
              {ticket.createdBy?.department && (
                <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-medium ml-0.5">
                  {ticket.createdBy.department}
                </span>
              )}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock size={13} className="text-gray-400" />
              {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
            </span>
            {ticket.source && (
              <span className="uppercase tracking-wide text-xs font-semibold text-gray-400">{ticket.source}</span>
            )}
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex items-center gap-1 border-b border-gray-200 mb-5">
        {TABS.map(({ key, label, Icon, count }) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px ${
              activeTab === key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}>
            <Icon size={13} />
            {label}
            {count > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                activeTab === key ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'
              }`}>{count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ════ MAIN GRID ════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── LEFT / MAIN ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Resolution banner */}
          {isResolved && ticket.resolution && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-5">
              <div className="flex items-center gap-2 mb-2">
                <ClipboardCheck size={15} className="text-green-600 shrink-0" />
                <h4 className="text-sm font-semibold text-green-800">Resolution</h4>
                {ticket.resolvedAt && (
                  <span className="ml-auto text-xs text-green-600">
                    {format(new Date(ticket.resolvedAt), 'dd MMM yyyy, HH:mm')}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap pl-6">{ticket.resolution}</p>
            </div>
          )}

          {/* ── DETAILS ── */}
          {activeTab === 'details' && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Description</p>
              <p className="text-gray-800 leading-relaxed whitespace-pre-wrap text-sm">{ticket.description}</p>
              {ticket.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-5 pt-4 border-t border-gray-100">
                  {ticket.tags.map(tag => (
                    <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">#{tag}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════
              COMMENTS TAB
          ══════════════════════════════ */}
          {activeTab === 'comments' && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-5">
                Comments · {ticket.comments?.length || 0}
              </p>

              {ticket.comments?.length === 0 && (
                <div className="text-center py-10">
                  <MessageSquare size={26} className="mx-auto text-gray-200 mb-2" />
                  <p className="text-sm text-gray-400">No comments yet</p>
                </div>
              )}

              {/* Comment list */}
              <div className="space-y-5 mb-6">
                {ticket.comments?.map((c, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0">
                      {c.author?.name?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="text-sm font-semibold text-gray-800">{c.author?.name}</span>
                        <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded capitalize">{c.author?.role}</span>
                        {c.isInternal && (
                          <span className="text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">Internal</span>
                        )}
                        <span className="text-xs text-gray-400 ml-auto">
                          {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <div className={`text-sm text-gray-700 leading-relaxed p-3.5 rounded-lg ${
                        c.isInternal ? 'bg-amber-50 border border-amber-100' : 'bg-gray-50 border border-gray-100'
                      }`}>
                        {/* Text with link highlighting */}
                        <span className="whitespace-pre-wrap break-words">
                          <TextWithLinks text={c.text} />
                        </span>

                        {/* Attachments */}
                        {c.attachments?.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200/60 flex flex-wrap gap-2">
                            {c.attachments.map((a, ai) => {
                              const isImage = a.mimetype?.startsWith('image/');
                              return isImage ? (
                                <button key={ai} onClick={() => setLightbox(a.url)}
                                  className="block rounded-lg overflow-hidden border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
                                  style={{ width: 90, height: 68 }}>
                                  <img src={a.url} alt={a.originalName} className="w-full h-full object-cover" />
                                </button>
                              ) : (
                                <a key={ai} href={a.url} target="_blank" rel="noopener noreferrer" download={a.originalName}
                                  className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 hover:bg-blue-50 hover:border-blue-200 rounded-lg text-xs text-gray-700 transition-colors max-w-[220px]">
                                  <FileText size={14} className="text-blue-500 shrink-0" />
                                  <span className="truncate font-medium">{a.originalName}</span>
                                  <span className="text-gray-400 shrink-0">{BYTES(a.size)}</span>
                                  <Download size={11} className="text-gray-400 shrink-0" />
                                </a>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* ── Compose box ── */}
              <div className="border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
                {/* Staged files */}
                <StagedFiles files={stagedFiles} onRemove={removeFile} />

                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  onPaste={handlePaste}
                  placeholder="Write a comment… paste an image or drag files below"
                  rows={3}
                  className="w-full px-4 py-3 text-sm text-gray-800 placeholder-gray-400 resize-none focus:outline-none bg-white"
                />

                {/* Toolbar */}
                <div className="flex items-center justify-between px-3 py-2.5 bg-gray-50 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    {/* Attach button */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      title="Attach files (images, PDFs, docs, zip — max 10 MB each, up to 5)"
                      className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-blue-600 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg border border-transparent hover:border-blue-100 transition-all"
                    >
                      <Paperclip size={14} />
                      Attach
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.log"
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                    {stagedFiles.length > 0 && (
                      <span className="text-xs text-gray-400">{stagedFiles.length} file{stagedFiles.length > 1 ? 's' : ''} attached</span>
                    )}
                    {user.role !== 'user' && (
                      <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 cursor-pointer select-none px-2.5 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                        <input type="checkbox" checked={isInternal} onChange={e => setIsInternal(e.target.checked)} className="rounded accent-amber-500" />
                        <Lock size={11} className="text-amber-500" />
                        Internal
                      </label>
                    )}
                  </div>

                  <button
                    onClick={handleComment}
                    disabled={(!comment.trim() && stagedFiles.length === 0) || sending}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition-all"
                  >
                    {sending
                      ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      : <Send size={13} />}
                    Post
                  </button>
                </div>
              </div>

              <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                <ImageIcon size={11} />
                You can paste images directly into the text box. Max 5 files, 10 MB each.
              </p>
            </div>
          )}

          {/* ── AI ANALYSIS ── */}
          {activeTab === 'ai-analysis' && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-violet-500 rounded-xl flex items-center justify-center shrink-0">
                  <Bot size={16} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">AI Analysis</p>
                  <p className="text-xs text-gray-400">Confidence: {ticket.aiConfidence ? `${Math.round(ticket.aiConfidence * 100)}%` : 'N/A'}</p>
                </div>
              </div>

              {/* Related KB articles */}
              {ticket.relatedArticles?.length > 0 && (
                <div className="mb-5 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen size={15} className="text-blue-600" />
                    <p className="text-sm font-semibold text-blue-800">KB Article Available</p>
                  </div>
                  <div className="space-y-2">
                    {ticket.relatedArticles.map(a => (
                      <div key={a._id} className="flex items-center justify-between p-3 bg-white border border-blue-100 rounded-lg">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-800 truncate">{a.title}</p>
                          <p className="text-xs text-gray-500 capitalize mt-0.5">{a.category}</p>
                        </div>
                        <Link to={`/kb/${a._id}`}
                          className="inline-flex items-center gap-1.5 ml-3 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors shrink-0">
                          <ExternalLink size={11} /> View KB
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Suggestions */}
              {ticket.aiSuggestions?.length > 0 && (
                <div className="mb-5">
                  <div className="flex items-center gap-1.5 mb-3">
                    <Lightbulb size={14} className="text-amber-500" />
                    <p className="text-sm font-semibold text-gray-700">Recommended Steps</p>
                  </div>
                  <ol className="space-y-2">
                    {ticket.aiSuggestions.map((s, i) => (
                      <li key={i} className="flex gap-3 p-3.5 bg-blue-50 border border-blue-100 rounded-lg text-sm text-gray-700">
                        <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</span>
                        {s}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Admin/tech KB actions */}
              {canEdit && (
                <div className="border-t border-gray-100 pt-4 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">KB Actions</p>

                  {/* Create KB from resolved ticket */}
                  {isResolved && ticket.relatedArticles?.length === 0 && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-xl">
                      <p className="text-xs text-green-700 mb-2">This ticket is resolved. Create a KB article to help others with the same issue.</p>
                      <button onClick={handleCreateKb} disabled={creatingKb}
                        className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-xs font-semibold rounded-lg transition-colors">
                        {creatingKb
                          ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          : <BookOpen size={12} />}
                        Create KB Article
                      </button>
                    </div>
                  )}

                  {/* Link to existing KB */}
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl">
                    <p className="text-xs text-gray-600 mb-2">Link this ticket to an existing KB article (marks it as a duplicate):</p>
                    <div className="flex gap-2">
                      <select
                        value={selectedKbId}
                        onChange={e => setSelectedKbId(e.target.value)}
                        onClick={fetchKbArticles}
                        className="input-field text-xs flex-1 py-1.5"
                      >
                        <option value="">Select KB article…</option>
                        {kbArticles.map(a => (
                          <option key={a._id} value={a._id}>{a.title}</option>
                        ))}
                      </select>
                      <button onClick={handleLinkKb} disabled={!selectedKbId || linkingKb}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors shrink-0">
                        {linkingKb
                          ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          : <Link2 size={12} />}
                        Link
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {!ticket.aiSuggestions?.length && !ticket.relatedArticles?.length && !canEdit && (
                <div className="text-center py-8 text-gray-400">
                  <Bot size={26} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No AI analysis available</p>
                </div>
              )}
            </div>
          )}

          {/* ── HISTORY ── */}
          {activeTab === 'history' && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-5">Ticket History</p>
              {!ticket.history?.length ? (
                <div className="text-center py-10">
                  <History size={26} className="mx-auto text-gray-200 mb-2" />
                  <p className="text-sm text-gray-400">No history yet</p>
                </div>
              ) : (
                <div className="relative pl-6 border-l-2 border-gray-100 space-y-5">
                  {ticket.history.map((h, i) => (
                    <div key={i} className="relative">
                      <div className="absolute -left-[25px] top-1 w-3 h-3 bg-white border-2 border-blue-400 rounded-full" />
                      <p className="text-sm font-semibold text-gray-800 capitalize">{h.action?.replace('_', ' ')}</p>
                      {h.oldValue && h.newValue && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          <span className="text-gray-500">{h.oldValue}</span>{' → '}
                          <span className="text-blue-600 font-medium">{h.newValue}</span>
                        </p>
                      )}
                      <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                        <Calendar size={10} />
                        {h.timestamp ? format(new Date(h.timestamp), 'dd MMM yyyy, HH:mm') : '—'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Feedback */}
          {ticket.status === 'resolved' && user.role === 'user' && !ticket.rating && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 border-t-4 border-t-amber-400">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Star size={16} className="text-amber-400" /> Rate your experience
              </h3>
              <div className="flex gap-2 mb-4">
                {[1,2,3,4,5].map(s => (
                  <button key={s} onClick={() => setRating(s)}
                    className={`w-10 h-10 rounded-xl border-2 text-lg font-bold transition-all ${
                      rating >= s ? 'border-amber-400 bg-amber-50 text-amber-500' : 'border-gray-200 text-gray-200 hover:border-amber-300'
                    }`}>★</button>
                ))}
              </div>
              <textarea value={feedback} onChange={e => setFeedback(e.target.value)}
                placeholder="Additional comments (optional)" rows={2} className="input-field mb-3" />
              <button onClick={handleFeedback} disabled={!rating} className="btn-primary text-sm">Submit Feedback</button>
            </div>
          )}
        </div>

        {/* ══════════════════════════════
            SIDEBAR
        ══════════════════════════════ */}
        <div className="space-y-4">

          {/* STATUS & WORKFLOW */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Status & Workflow</p>
            </div>
            <div className="px-5 py-4">
              {WORKFLOW.map((step, idx) => {
                const isDone      = currentIdx > idx;
                const isCurrent   = currentIdx === idx;
                const isClickable = canEdit && !isResolved && idx === currentIdx + 1;
                return (
                  <div key={step} className="flex gap-3">
                    <div className="flex flex-col items-center w-8 shrink-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all
                        ${isDone      ? 'bg-green-500 border-green-500'  : ''}
                        ${isCurrent   ? 'bg-blue-600 border-blue-600'    : ''}
                        ${isClickable ? 'bg-white border-dashed border-blue-400' : ''}
                        ${!isDone && !isCurrent && !isClickable ? 'bg-white border-gray-200' : ''}
                      `}>
                        {isDone    && <CheckCircle2 size={15} className="text-white" />}
                        {isCurrent && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                        {isClickable && <div className="w-2 h-2 bg-blue-400 rounded-full" />}
                        {!isDone && !isCurrent && !isClickable && <div className="w-2 h-2 bg-gray-200 rounded-full" />}
                      </div>
                      {idx < WORKFLOW.length - 1 && (
                        <div className="w-0.5 flex-1 my-1 min-h-[16px]"
                             style={{ background: isDone ? '#86efac' : '#e5e7eb' }} />
                      )}
                    </div>
                    <div className="pb-3 flex-1 min-w-0 pt-1">
                      <button
                        disabled={!isClickable}
                        onClick={() => isClickable && handleStepClick(step)}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-all
                          ${isCurrent   ? 'bg-blue-50 border border-blue-100' : ''}
                          ${isClickable ? 'hover:bg-blue-50 hover:border-blue-200 border border-dashed border-blue-200 cursor-pointer' : 'cursor-default'}
                        `}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-sm font-semibold leading-none
                            ${isDone    ? 'text-gray-400 line-through' : ''}
                            ${isCurrent ? 'text-blue-700'              : ''}
                            ${isClickable ? 'text-blue-600'            : ''}
                            ${!isDone && !isCurrent && !isClickable ? 'text-gray-400' : ''}
                          `}>{STEP_META[step].label}</span>
                          {isClickable && (
                            <span className="text-[10px] font-bold bg-blue-600 text-white px-1.5 py-0.5 rounded shrink-0">NEXT</span>
                          )}
                        </div>
                        {isCurrent && (
                          <p className="text-xs text-gray-400 mt-0.5 leading-snug">{STEP_META[step].desc}</p>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {pendingStatus === 'resolved' && (
              <div className="px-5 pb-5 border-t border-gray-100 pt-4">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-2">
                  <ClipboardCheck size={13} className="text-green-600" />
                  Describe the resolution
                </label>
                <textarea value={resolutionText} onChange={e => setResolutionText(e.target.value)}
                  placeholder="What was done to fix the issue?" rows={4}
                  className="input-field resize-none text-sm mb-3" autoFocus />
                <div className="flex gap-2">
                  <button onClick={submitResolution} disabled={savingStatus || !resolutionText.trim()}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-semibold py-2 rounded-lg transition-all">
                    {savingStatus
                      ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      : <CheckCircle2 size={13} />}
                    Mark Resolved
                  </button>
                  <button onClick={() => setPendingStatus(null)}
                    className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {canEdit && isResolved && ticket.status !== 'closed' && (
              <div className="px-5 pb-5 border-t border-gray-100 pt-4 flex gap-2">
                <button onClick={() => applyStatus('open')}
                  className="flex-1 flex items-center justify-center gap-1.5 text-sm font-medium text-gray-500 hover:text-orange-600 hover:bg-orange-50 border border-dashed border-gray-200 hover:border-orange-200 py-2 rounded-lg transition-all">
                  <RotateCcw size={13} /> Re-open
                </button>
                <button onClick={() => applyStatus('closed')}
                  className="flex-1 flex items-center justify-center gap-1.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 py-2 rounded-lg transition-all">
                  <Lock size={13} /> Close
                </button>
              </div>
            )}
          </div>

          {/* TICKET INFO */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Ticket Info</p>
            </div>
            <div className="px-5 py-2">
              <InfoRow label="Ticket ID"      value={<span className="font-mono text-xs">{ticket.ticketId}</span>} />
              <InfoRow label="Source"         value={<span className="font-mono text-xs uppercase">{ticket.source}</span>} />
              <InfoRow label="Created"        value={ticket.createdAt ? format(new Date(ticket.createdAt), 'dd MMM yyyy, HH:mm') : null} />
              <InfoRow label="SLA Deadline"   value={ticket.slaDeadline ? format(new Date(ticket.slaDeadline), 'dd MMM yyyy, HH:mm') : null} highlight={ticket.slaBreached} />
              <InfoRow label="First Response" value={ticket.firstResponseAt ? format(new Date(ticket.firstResponseAt), 'dd MMM yyyy, HH:mm') : 'Pending'} />
              <InfoRow label="Resolved At"    value={ticket.resolvedAt ? format(new Date(ticket.resolvedAt), 'dd MMM yyyy, HH:mm') : null} />
              {ticket.rating && (
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-sm text-gray-500">Rating</span>
                  <span className="text-amber-400">
                    {'★'.repeat(ticket.rating)}<span className="text-gray-200">{'★'.repeat(5 - ticket.rating)}</span>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ASSIGNMENT */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Assignment</p>
            </div>
            <div className="px-5 py-4 space-y-4">
              {ticket.assignedTeam && (
                <div className="flex items-center gap-3 p-3 bg-violet-50 border border-violet-100 rounded-lg">
                  <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center shrink-0">
                    <Users size={15} className="text-violet-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-violet-500">Handling Team</p>
                    <p className="text-sm font-bold text-violet-800">{ticket.assignedTeam}</p>
                  </div>
                </div>
              )}
              {ticket.assignedTo ? (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-500 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0">
                    {ticket.assignedTo.name?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{ticket.assignedTo.name}</p>
                    <p className="text-xs text-gray-400">{ticket.assignedTo.email}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 bg-gray-50 border border-dashed border-gray-200 rounded-lg">
                  <User size={14} className="text-gray-300" />
                  <p className="text-sm text-gray-400">Not assigned yet</p>
                </div>
              )}
              {canEdit && technicians.length > 0 && (
                <select onChange={e => handleAssign(e.target.value)}
                  defaultValue={ticket.assignedTo?._id || ''}
                  className="input-field text-sm">
                  <option value="">Reassign to…</option>
                  {technicians.map(t => (
                    <option key={t._id} value={t._id}>{t.name} ({t.activeTickets} active)</option>
                  ))}
                </select>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
