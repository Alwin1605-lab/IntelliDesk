import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User, PlusCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { v4 as uuidv4 } from 'uuid';

const sessionId = uuidv4();

const ChatBot = ({ onClose }) => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      text: "👋 Hello! I'm your POWERGRID IT Support Assistant.\n\nI can help with:\n• Password reset\n• VPN access issues\n• WiFi problems\n• Email issues\n• Or raise a support ticket\n\nWhat's your issue today?",
      time: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestTicket, setSuggestTicket] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text = input.trim()) => {
    if (!text || loading) return;
    setInput('');

    // Add user message
    setMessages((prev) => [...prev, { role: 'user', text, time: new Date() }]);
    setLoading(true);

    try {
      const { data } = await api.post('/chatbot/message', { message: text, sessionId });
      const botData = data.data;

      setMessages((prev) => [
        ...prev,
        {
          role: 'bot',
          text: botData.response,
          kbArticles: botData.kbArticles,
          time: new Date()
        }
      ]);

      if (botData.suggestTicketCreation) setSuggestTicket(true);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'bot', text: '⚠️ Sorry, I encountered an error. Please try again or raise a ticket directly.', time: new Date() }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickReplies = ['Password reset', 'VPN access', 'WiFi not working', 'Email issue', 'Raise a ticket'];

  const formatText = (text) =>
    text.split('\n').map((line, i) => (
      <span key={i}>
        {line.startsWith('**') && line.endsWith('**') ? (
          <strong>{line.slice(2, -2)}</strong>
        ) : (
          line
        )}
        <br />
      </span>
    ));

  return (
    <div className="fixed bottom-24 right-6 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 flex flex-col fade-in overflow-hidden"
         style={{ maxHeight: '520px' }}>
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
              {formatText(msg.text)}
              {msg.kbArticles?.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <p className="text-gray-400 mb-1">📚 Related articles:</p>
                  {msg.kbArticles.map((a) => (
                    <button
                      key={a._id}
                      onClick={() => navigate('/kb')}
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

      {/* Suggest ticket */}
      {suggestTicket && (
        <div className="px-4 py-2 bg-blue-50 border-t border-blue-100">
          <button
            onClick={() => { navigate('/tickets/new'); onClose(); }}
            className="flex items-center gap-2 text-blue-600 text-xs font-medium hover:underline"
          >
            <PlusCircle size={13} />
            Create a support ticket for this issue →
          </button>
        </div>
      )}

      {/* Quick replies */}
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

      {/* Input */}
      <div className="p-3 border-t border-gray-100 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type your issue..."
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
