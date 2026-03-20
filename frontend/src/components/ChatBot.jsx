import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User, PlusCircle, CheckCircle, ExternalLink, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useTickets } from '../context/TicketContext';
import { v4 as uuidv4 } from 'uuid';

const sessionId = uuidv4();

// Phrases that mean the user wants to raise a ticket
const TICKET_TRIGGERS = [
  'raise a ticket', 'create a ticket', 'open a ticket', 'submit a ticket',
  'log a ticket', 'raise ticket', 'create ticket', 'open ticket', 'submit ticket',
  'log ticket', 'make a ticket', 'file a ticket',
];

const wantsTicket = (text) =>
  TICKET_TRIGGERS.some((t) => text.toLowerCase().includes(t));

const ChatBot = ({ onClose }) => {
  const navigate = useNavigate();
  const { createTicket, classifyTicket } = useTickets();

  const [messages, setMessages] = useState([
    {
      role: 'bot',
      text: "👋 Hello! I'm your POWERGRID IT Support Assistant, powered by AI.\n\nI can help troubleshoot any IT issue — just describe your problem in plain English and I'll guide you through it. I can also raise a support ticket on your behalf if needed.\n\nWhat's going on?",
      time: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestTicket, setSuggestTicket] = useState(false);

  // Guided ticket creation state machine
  // ticketFlow: null | 'awaiting_title' | 'awaiting_kb_confirm' | 'awaiting_description'
  const [ticketFlow, setTicketFlow] = useState(null);
  const [ticketDraft, setTicketDraft] = useState({ title: '', description: '' });
  const [kbHits, setKbHits] = useState([]);

  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addBotMessage = (text, extra = {}) => {
    setMessages((prev) => [...prev, { role: 'bot', text, time: new Date(), ...extra }]);
  };

  const addUserMessage = (text) => {
    setMessages((prev) => [...prev, { role: 'user', text, time: new Date() }]);
  };

  // ── Ticket creation flow ─────────────────────────────────────────────────
  const startTicketFlow = () => {
    setTicketFlow('awaiting_title');
    setTicketDraft({ title: '', description: '' });
    setSuggestTicket(false);
    addBotMessage('Sure! Please enter a **title** for your ticket — a short summary of the issue (e.g. "VPN not connecting after Windows update").');
  };

  const handleTicketFlowInput = async (text) => {
    if (ticketFlow === 'awaiting_title') {
      const title = text.trim();
      setTicketDraft((d) => ({ ...d, title }));

      // Check KB before asking for description
      setLoading(true);
      try {
        const { data } = await api.get('/kb/suggest', { params: { title } });
        const articles = data.data || [];
        setLoading(false);

        if (articles.length > 0) {
          setKbHits(articles);
          setTicketFlow('awaiting_kb_confirm');
          addBotMessage(
            `Before I raise a ticket, I found ${articles.length} existing Knowledge Base article${articles.length > 1 ? 's' : ''} that may already solve your issue:`,
            { kbArticles: articles }
          );
          addBotMessage(
            `If these don't help, type **yes** to continue raising a ticket anyway, or **no** to cancel.`
          );
        } else {
          setTicketFlow('awaiting_description');
          addBotMessage(`Got it. Now please describe the issue in more detail — what exactly is happening, when did it start, and what have you tried so far?`);
        }
      } catch {
        setLoading(false);
        // On error, proceed normally
        setTicketFlow('awaiting_description');
        addBotMessage(`Got it. Now please describe the issue in more detail — what exactly is happening, when did it start, and what have you tried so far?`);
      }
      return;
    }

    if (ticketFlow === 'awaiting_kb_confirm') {
      const answer = text.trim().toLowerCase();
      if (answer === 'yes' || answer === 'y') {
        setKbHits([]);
        setTicketFlow('awaiting_description');
        addBotMessage(`Understood. Please describe the issue in more detail — what exactly is happening, when did it start, and what have you tried so far?`);
      } else {
        setKbHits([]);
        setTicketFlow(null);
        addBotMessage(`No problem! Please review the Knowledge Base articles above. If you still need help, just say "raise a ticket" and I'll assist you.`);
      }
      return;
    }

    if (ticketFlow === 'awaiting_description') {
      const description = text.trim();
      const { title } = ticketDraft;
      setTicketFlow(null);
      setLoading(true);

      try {
        // Final KB check at submission time (same as the form gate)
        try {
          const { data } = await api.get('/kb/suggest', { params: { title } });
          const fresh = data.data || [];
          if (fresh.length > 0 && kbHits.length === 0) {
            // KB articles appeared since we last checked — surface them
            setKbHits(fresh);
            setTicketDraft((d) => ({ ...d, description }));
            setTicketFlow('awaiting_kb_confirm');
            setLoading(false);
            addBotMessage(
              `Hold on — I just found some KB articles that match your issue:`,
              { kbArticles: fresh }
            );
            addBotMessage(`Type **yes** to submit the ticket anyway, or **no** to cancel.`);
            return;
          }
        } catch { /* allow submit if check fails */ }

        // Classify using the existing AI classify module
        let category = 'other';
        let priority = 'medium';
        try {
          const classification = await classifyTicket(title, description);
          category = classification.category || 'other';
          priority = classification.priority || 'medium';
        } catch (_) { /* fallback to defaults */ }

        const ticket = await createTicket({
          title,
          description,
          category,
          priority,
          source: 'chatbot',
        });

        setKbHits([]);
        addBotMessage(
          `Your ticket has been created and our team has been notified.`,
          { createdTicket: ticket }
        );
      } catch (err) {
        addBotMessage('⚠️ Sorry, I couldn\'t create the ticket. Please try again or use the ticket form directly.');
      } finally {
        setLoading(false);
      }
    }
  };

  // ── Normal LLM message ───────────────────────────────────────────────────
  const sendLLMMessage = async (text) => {
    setLoading(true);
    try {
      const history = messages
        .filter((m) => m.role === 'user' || (m.role === 'bot' && messages.indexOf(m) > 0))
        .map((m) => ({ role: m.role, text: m.text }));

      const { data } = await api.post('/chatbot/message', { message: text, sessionId, history });
      const botData = data.data;

      addBotMessage(botData.response, { kbArticles: botData.kbArticles });

      if (botData.suggestTicketCreation) setSuggestTicket(true);
    } catch {
      addBotMessage('⚠️ Sorry, I encountered an error. Please try again or raise a ticket directly.');
    } finally {
      setLoading(false);
    }
  };

  // ── Main send handler ────────────────────────────────────────────────────
  const sendMessage = async (text = input.trim()) => {
    if (!text || loading) return;
    setInput('');
    addUserMessage(text);

    // If we're in the guided ticket flow, handle it
    if (ticketFlow) {
      await handleTicketFlowInput(text);
      return;
    }

    // If user explicitly asks to raise a ticket, start the guided flow
    if (wantsTicket(text)) {
      startTicketFlow();
      return;
    }

    // Otherwise send to LLM
    await sendLLMMessage(text);
  };

  const quickReplies = ['Password reset', 'VPN access', 'WiFi not working', 'Email issue', 'Raise a ticket'];

  // ── Markdown renderer ────────────────────────────────────────────────────
  const renderInline = (text) => {
    const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**'))
        return <strong key={i} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>;
      if (part.startsWith('`') && part.endsWith('`'))
        return <code key={i} className="bg-gray-100 text-blue-700 rounded px-1 text-[10px] font-mono">{part.slice(1, -1)}</code>;
      return part;
    });
  };

  const formatText = (text) => {
    const blocks = text.split(/\n{2,}/);
    return blocks.map((block, bi) => {
      const lines = block.split('\n');

      if (lines.every((l) => /^\d+\.\s/.test(l.trim()) || l.trim() === '')) {
        const items = lines.filter((l) => /^\d+\.\s/.test(l.trim()));
        return (
          <ol key={bi} className="list-decimal list-inside space-y-1 my-1">
            {items.map((item, ii) => (
              <li key={ii} className="leading-snug">{renderInline(item.replace(/^\d+\.\s/, ''))}</li>
            ))}
          </ol>
        );
      }

      if (lines.every((l) => /^[•\-*]\s/.test(l.trim()) || l.trim() === '')) {
        const items = lines.filter((l) => /^[•\-*]\s/.test(l.trim()));
        return (
          <ul key={bi} className="list-disc list-inside space-y-1 my-1">
            {items.map((item, ii) => (
              <li key={ii} className="leading-snug">{renderInline(item.replace(/^[•\-*]\s/, ''))}</li>
            ))}
          </ul>
        );
      }

      return (
        <p key={bi} className="leading-relaxed mb-1">
          {lines.map((line, li) => {
            const trimmed = line.trim();
            if (/^\d+\.\s/.test(trimmed))
              return (
                <span key={li} className="block pl-2">
                  <span className="font-semibold text-blue-700">{trimmed.match(/^\d+/)[0]}.</span>{' '}
                  {renderInline(trimmed.replace(/^\d+\.\s/, ''))}
                </span>
              );
            if (/^[•\-*]\s/.test(trimmed))
              return (
                <span key={li} className="block pl-2">
                  <span className="text-blue-500 mr-1">›</span>
                  {renderInline(trimmed.replace(/^[•\-*]\s/, ''))}
                </span>
              );
            return (
              <span key={li}>
                {renderInline(line)}
                {li < lines.length - 1 && <br />}
              </span>
            );
          })}
        </p>
      );
    });
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed bottom-24 right-6 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 flex flex-col fade-in overflow-hidden"
      style={{ maxHeight: '520px' }}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <Bot size={16} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">IT Support Bot</p>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full pulse-dot"></span>
              <span className="text-xs text-blue-100">Online 24/7</span>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
          <X size={18} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50" style={{ minHeight: 280, maxHeight: 320 }}>
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'bot' ? 'bg-blue-100' : 'bg-gray-200'}`}>
              {msg.role === 'bot' ? <Bot size={14} className="text-blue-600" /> : <User size={14} className="text-gray-600" />}
            </div>
            <div className={`max-w-[75%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
              msg.role === 'bot'
                ? 'bg-white border border-gray-100 text-gray-700 shadow-sm'
                : 'bg-blue-600 text-white'
            }`}>
              {msg.text && formatText(msg.text)}

              {/* Ticket created confirmation card */}
              {msg.createdTicket && (
                <div className="mt-2 pt-2 border-t border-green-100 bg-green-50 rounded-lg px-2 py-1.5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <CheckCircle size={12} className="text-green-600 shrink-0" />
                    <span className="text-green-700 font-semibold text-[11px]">Ticket created successfully!</span>
                  </div>
                  <p className="text-gray-600 text-[10px] mb-0.5">
                    <span className="font-mono bg-gray-100 px-1 rounded">{msg.createdTicket.ticketId}</span>
                    {' · '}
                    <span className="capitalize">{msg.createdTicket.priority}</span> priority
                    {' · '}
                    <span className="capitalize">{msg.createdTicket.category}</span>
                  </p>
                  <p className="text-gray-700 text-[10px] font-medium truncate mb-1">{msg.createdTicket.title}</p>
                  <button
                    onClick={() => { navigate(`/tickets/${msg.createdTicket._id}`); onClose(); }}
                    className="flex items-center gap-1 text-blue-600 text-[10px] font-medium hover:underline"
                  >
                    <ExternalLink size={10} />
                    View ticket
                  </button>
                </div>
              )}

              {msg.kbArticles?.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <p className="text-gray-400 mb-1 flex items-center gap-1"><BookOpen size={11} /> Related KB articles:</p>
                  {msg.kbArticles.map((a) => (
                    <button
                      key={a._id}
                      onClick={() => { navigate(`/kb/${a._id}`); onClose(); }}
                      className="block text-blue-500 hover:underline text-left w-full"
                    >
                      → {a.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-2">
            <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
              <Bot size={14} className="text-blue-600" />
            </div>
            <div className="bg-white border border-gray-100 rounded-xl px-4 py-3 shadow-sm">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggest ticket banner — shown only when not already in ticket flow */}
      {suggestTicket && !ticketFlow && (
        <div className="px-4 py-2 bg-blue-50 border-t border-blue-100">
          <button
            onClick={startTicketFlow}
            className="flex items-center gap-2 text-blue-600 text-xs font-medium hover:underline"
          >
            <PlusCircle size={13} />
            Raise a support ticket for this issue →
          </button>
        </div>
      )}

      {/* Quick replies — hidden during ticket flow to avoid confusion */}
      {!ticketFlow && (
        <div className="px-3 py-2 flex gap-1.5 overflow-x-auto border-t border-gray-100">
          {quickReplies.map((q) => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              className="shrink-0 text-xs bg-gray-100 hover:bg-blue-50 hover:text-blue-600 text-gray-600 px-2.5 py-1 rounded-full transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-gray-100 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder={
            ticketFlow === 'awaiting_title' ? 'Enter ticket title...' :
            ticketFlow === 'awaiting_kb_confirm' ? 'Type yes to continue, no to cancel...' :
            ticketFlow === 'awaiting_description' ? 'Describe the issue...' :
            'Type your issue...'
          }
          className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        />
        <button
          onClick={() => sendMessage()}
          disabled={!input.trim() || loading}
          className="w-9 h-9 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg flex items-center justify-center transition-all"
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  );
};

export default ChatBot;
