const axios = require('axios');

const AI_URL = process.env.AI_SERVICE_URL || 'http://localhost:3001';

const aiClient = axios.create({
  baseURL: AI_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

const classifyTicket = async (title, description) => {
  try {
    const { data } = await aiClient.post('/classify', { title, description });
    return data;
  } catch (err) {
    console.error('AI classify error:', err.message);
    // Fallback: rule-based classification
    return fallbackClassify(title, description);
  }
};

const suggestSolution = async (category, title, description) => {
  try {
    const { data } = await aiClient.post('/suggest-solution', { category, title, description });
    return data;
  } catch (err) {
    console.error('AI suggest error:', err.message);
    return { suggestions: getDefaultSuggestions(category), similarTickets: [] };
  }
};

const findSimilarTickets = async (title, description, topK = 5) => {
  try {
    const { data } = await aiClient.post('/similar-tickets', { title, description, topK });
    return data.results || [];
  } catch (err) {
    console.error('AI similar tickets error:', err.message);
    return [];
  }
};

const analyzeRootCause = async (tickets) => {
  try {
    const { data } = await aiClient.post('/root-cause', { tickets });
    return data;
  } catch (err) {
    console.error('AI root cause error:', err.message);
    return { rootCauses: [], recommendation: 'AI analysis unavailable' };
  }
};

const predictSLABreach = async (priority, createdAt, currentTime) => {
  try {
    const { data } = await aiClient.post('/sla-prediction', { priority, createdAt, currentTime });
    return data;
  } catch (err) {
    return { breachRisk: 'unknown', shouldEscalate: false };
  }
};

const checkEmailSpam = async (subject, body, senderDomain = '') => {
  try {
    const { data } = await aiClient.post('/spam-check', { subject, body, senderDomain });
    return data; // { spam: bool, reason: str, method: str }
  } catch (err) {
    console.error('AI spam-check error:', err.message);
    return { spam: false, reason: 'check failed', method: 'error' }; // fail open
  }
};

const chatbotResponse = async (message, history = [], kbContext = '') => {
  try {
    const { data } = await aiClient.post('/chatbot', { message, history, kbContext });
    return data;
  } catch (err) {
    console.error('AI chatbot error:', err.message);
    return { response: 'I\'m having trouble connecting to the AI. Please try raising a ticket.', suggestTicket: true };
  }
};

// ─── Fallback (no AI service) ───
const TEAM_MAP = {
  network: 'Network Team', hardware: 'IT Support', software: 'Software Team',
  authentication: 'Identity & Access Team', email: 'Email & Collaboration Team',
  database: 'Database Team', security: 'Security Operations', hr: 'HR Team',
  other: 'General IT Support',
};

const SLA_HOURS = { critical: 1, high: 4, medium: 24, low: 72 };

function fallbackClassify(title, description) {
  const text = `${title} ${description}`.toLowerCase();
  const categories = {
    network: ['network', 'wifi', 'vpn', 'internet', 'connectivity', 'connection'],
    software: ['software', 'application', 'app', 'crash', 'install', 'update'],
    hardware: ['hardware', 'printer', 'laptop', 'keyboard', 'mouse', 'monitor'],
    authentication: ['login', 'password', 'account', 'access', 'locked', 'credential'],
    email: ['email', 'mail', 'outlook', 'inbox', 'smtp'],
    database: ['database', 'db', 'sql', 'query', 'backup'],
    security: ['security', 'breach', 'malware', 'virus', 'threat'],
    hr: ['hr', 'payroll', 'leave', 'employee', 'onboarding'],
  };
  let category = 'other';
  let maxScore = 0;
  for (const [cat, keywords] of Object.entries(categories)) {
    const score = keywords.filter(kw => text.includes(kw)).length;
    if (score > maxScore) { maxScore = score; category = cat; }
  }
  const priority = text.includes('critical') || text.includes('down') ? 'critical'
    : text.includes('urgent') || text.includes('cannot') ? 'high'
    : text.includes('slow') || text.includes('sometimes') ? 'medium' : 'low';
  return {
    category, confidence: 0.6, priority, priorityConfidence: 0.6,
    assignedTeam: TEAM_MAP[category] || 'General IT Support',
    slaHours: SLA_HOURS[priority] || 24,
    aiSuggestions: getDefaultSuggestions(category),
    similarTickets: [],
  };
}

function getDefaultSuggestions(category) {
  const suggestions = {
    network: ['Restart router/switch', 'Check cable connections', 'Run network diagnostics'],
    software: ['Restart application', 'Check for updates', 'Clear cache'],
    hardware: ['Restart device', 'Check connections', 'Update drivers'],
    authentication: ['Reset password via portal', 'Clear browser cache', 'Contact IT helpdesk'],
    email: ['Check spam folder', 'Verify account quota', 'Restart email client'],
    database: ['Check service status', 'Verify connection string', 'Review error logs'],
    security: ['Isolate system', 'Alert Security team', 'Change credentials'],
    hr: ['Log in to HR portal', 'Contact HR Business Partner', 'Review employee handbook'],
    other: ['Restart your device', 'Check for updates', 'Contact IT helpdesk'],
  };
  return suggestions[category] || suggestions.other;
}

module.exports = { classifyTicket, suggestSolution, findSimilarTickets, analyzeRootCause, predictSLABreach, chatbotResponse, checkEmailSpam };
