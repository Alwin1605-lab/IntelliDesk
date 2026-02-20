const axios = require('axios');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

const callMLService = async (endpoint, data, timeoutMs = 10000) => {
  try {
    const response = await axios.post(`${ML_SERVICE_URL}${endpoint}`, data, {
      timeout: timeoutMs,
      headers: { 'Content-Type': 'application/json' },
    });
    return response.data;
  } catch (error) {
    console.warn(
      `[AI] ML service call to ${endpoint} failed:`,
      error.message
    );
    return null;
  }
};

/**
 * Classify a ticket's category using AI
 */
const classifyTicket = async (text) => {
  const result = await callMLService('/classify', { text });
  if (result && result.category) {
    return {
      category: result.category,
      confidence: result.confidence || 0,
    };
  }
  // Fallback: keyword-based classification
  return fallbackClassify(text);
};

/**
 * Predict priority using AI
 */
const predictPriority = async (text, category) => {
  const result = await callMLService('/priority', { text, category });
  if (result && result.priority) {
    return {
      priority: result.priority,
      score: result.score || 0,
    };
  }
  // Fallback: rule-based priority
  return fallbackPriority(text);
};

/**
 * Get KB recommendations
 */
const getRecommendations = async (text) => {
  const result = await callMLService('/recommend', { text }, 15000);
  if (result && result.suggestions) {
    return result.suggestions;
  }
  return [];
};

/**
 * Trigger FAISS index rebuild
 */
const rebuildIndex = async (articles) => {
  try {
    await callMLService('/index/rebuild', { articles }, 30000);
    console.log('[AI] FAISS index rebuild triggered');
  } catch (e) {
    console.warn('[AI] Index rebuild failed:', e.message);
  }
};

// ---------- Fallbacks ----------

function fallbackClassify(text) {
  const lower = text.toLowerCase();
  const rules = [
    {
      category: 'Network',
      keywords: ['network', 'internet', 'wifi', 'wi-fi', 'vpn', 'dns', 'connectivity', 'lan', 'firewall', 'router', 'ip address', 'bandwidth', 'latency', 'ping'],
    },
    {
      category: 'Hardware',
      keywords: ['hardware', 'printer', 'monitor', 'keyboard', 'mouse', 'laptop', 'computer', 'screen', 'battery', 'usb', 'dock', 'headset', 'webcam', 'charger'],
    },
    {
      category: 'Security',
      keywords: ['security', 'virus', 'malware', 'phishing', 'breach', 'hack', 'ransomware', 'suspicious', 'threat', 'vulnerability', 'antivirus', 'encryption', 'unauthorized'],
    },
    {
      category: 'Access',
      keywords: ['access', 'permission', 'login', 'password', 'reset', 'account', 'locked', 'unlock', 'mfa', '2fa', 'credentials', 'sso', 'authentication', 'authorize'],
    },
    {
      category: 'Software',
      keywords: ['software', 'install', 'update', 'crash', 'error', 'bug', 'application', 'app', 'outlook', 'excel', 'teams', 'license', 'slow', 'freeze', 'unresponsive'],
    },
  ];

  let bestMatch = { category: 'Other', score: 0 };
  for (const rule of rules) {
    const score = rule.keywords.filter((kw) => lower.includes(kw)).length;
    if (score > bestMatch.score) {
      bestMatch = { category: rule.category, score };
    }
  }

  return {
    category: bestMatch.category,
    confidence: bestMatch.score > 0 ? Math.min(0.5 + bestMatch.score * 0.1, 0.95) : 0.2,
  };
}

function fallbackPriority(text) {
  const lower = text.toLowerCase();

  const criticalKeywords = ['down', 'outage', 'breach', 'ransomware', 'emergency', 'critical', 'server down', 'all users', 'production'];
  const highKeywords = ['urgent', 'important', 'asap', 'cannot work', 'blocking', 'deadline', 'multiple users'];
  const lowKeywords = ['request', 'nice to have', 'when possible', 'low priority', 'minor', 'cosmetic'];

  if (criticalKeywords.some((kw) => lower.includes(kw))) {
    return { priority: 'Critical', score: 0.9 };
  }
  if (highKeywords.some((kw) => lower.includes(kw))) {
    return { priority: 'High', score: 0.75 };
  }
  if (lowKeywords.some((kw) => lower.includes(kw))) {
    return { priority: 'Low', score: 0.6 };
  }

  return { priority: 'Medium', score: 0.5 };
}

module.exports = {
  classifyTicket,
  predictPriority,
  getRecommendations,
  rebuildIndex,
};
