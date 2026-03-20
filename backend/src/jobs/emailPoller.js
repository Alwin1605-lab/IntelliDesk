'use strict';
/**
 * emailPoller.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Reads UNSEEN emails from the support inbox (IMAP), creates tickets for each,
 * AI-classifies them, auto-assigns a technician, and sends an auto-reply.
 *
 * Called by node-cron every 60 seconds from server.js.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const Imap           = require('node-imap');
const { simpleParser } = require('mailparser');
const User           = require('../models/User');
const Ticket         = require('../models/Ticket');
const KnowledgeBase  = require('../models/KnowledgeBase');
const { classifyTicket, checkEmailSpam } = require('../utils/aiService');
const { sendTicketConfirmation } = require('../utils/mailer');

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Extract plain text from a parsed email */
function extractBody(parsed) {
  if (parsed.text) return parsed.text.trim();
  if (parsed.html) {
    // Very basic HTML → text strip
    return parsed.html
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
  return '';
}

/** Extract sender email from "Name <email>" format */
function extractEmail(from) {
  if (!from) return null;
  const match = from.text
    ? (from.text.match(/<(.+?)>/) || [null, from.text])
    : (String(from).match(/<(.+?)>/) || [null, String(from)]);
  return (match[1] || '').toLowerCase().trim();
}

/** Find or shadow-create a user account for the email sender */
async function resolveUser(senderEmail, senderName) {
  let user = await User.findOne({ email: senderEmail });
  if (!user) {
    // Create a "shadow" user so ticket.createdBy is always populated
    user = await User.create({
      name: senderName || senderEmail.split('@')[0],
      email: senderEmail,
      password: Math.random().toString(36) + 'Aa1!', // unusable random password
      role: 'user',
      department: 'External',
    });
    console.log(`[EmailPoller] Created shadow user for ${senderEmail}`);
  }
  return user;
}

/** Pick least-busy technician by skill match */
async function autoAssign(category) {
  const skillMap = {
    network: ['network'], hardware: ['hardware'], software: ['software'],
    authentication: ['authentication', 'security'], email: ['email'],
    database: ['database'], security: ['security'], hr: ['hr'],
  };
  const skills = skillMap[category] || [];
  const query = { role: 'technician', isActive: { $ne: false }, isAvailable: true };
  if (skills.length) query.skills = { $in: skills };

  let tech = await User.findOne(query).sort({ activeTickets: 1 });
  if (!tech) tech = await User.findOne({ role: 'technician', isActive: { $ne: false }, isAvailable: true }).sort({ activeTickets: 1 });
  return tech;
}

// ─── Core poll function ───────────────────────────────────────────────────────

/**
 * Opens the inbox, fetches all UNSEEN messages, creates tickets, marks them
 * as SEEN, then closes the connection.
 *
 * @param {import('socket.io').Server} io  – Socket.IO instance for live push
 */
async function pollOnce(io) {
  const { EMAIL_USER, EMAIL_PASS, EMAIL_HOST, EMAIL_IMAP_PORT } = process.env;

  return new Promise((resolve, reject) => {
    const imap = new Imap({
      user:     EMAIL_USER,
      password: EMAIL_PASS,
      host:     EMAIL_HOST    || 'imap.gmail.com',
      port:     parseInt(EMAIL_IMAP_PORT || '993'),
      tls:      true,
      tlsOptions: { rejectUnauthorized: false },
      connTimeout: 20000,
      authTimeout: 15000,
    });

    imap.once('error', (err) => {
      reject(err);
    });

    imap.once('ready', () => {
      imap.openBox('INBOX', false, async (err, box) => {
        if (err) {
          console.error('[EmailPoller] openBox error:', err.message);
          imap.end();
          return resolve();
        }

        imap.search(['UNSEEN'], async (err, results) => {
          if (err || !results || results.length === 0) {
            if (!err) console.log('[EmailPoller] No new emails.');
            imap.end();
            return resolve();
          }

          console.log(`[EmailPoller] Found ${results.length} unseen email(s)`);

          const fetch = imap.fetch(results, { bodies: '', markSeen: true });
          const promises = [];

          fetch.on('message', (msg) => {
            const p = new Promise((res2) => {
              let rawBuffer = Buffer.alloc(0);

              msg.on('body', (stream) => {
                stream.on('data', (chunk) => {
                  rawBuffer = Buffer.concat([rawBuffer, chunk]);
                });
              });

              msg.once('end', async () => {
                try {
                  const parsed   = await simpleParser(rawBuffer);
                  const subject  = (parsed.subject || '(No Subject)').trim();
                  const body     = extractBody(parsed);
                  const fromAddr = extractEmail(parsed.from);
                  const fromName = parsed.from?.value?.[0]?.name || fromAddr;

                  if (!fromAddr) { res2(); return; }

                  // Skip auto-reply / delivery failure / loop prevention
                  const skipPatterns = [
                    /^(auto.?reply|out.?of.?office|delivery.?status|mailer.?daemon|noreply|no-reply)/i,
                    /\[Ticket [A-Z]+-\d+\]/i,
                  ];
                  if (skipPatterns.some(p => p.test(subject) || p.test(fromAddr))) {
                    console.log(`[EmailPoller] Skipping auto-reply/loop from ${fromAddr}`);
                    res2(); return;
                  }

                  // ── Layer 1: Heuristic spam filter ───────────────────────
                  const SPAM_SUBJECT_RE = /sale|special offer|congratulat|you('ve| have) won|you are selected|unsubscribe|newsletter|coupon|discount|buy now|click here|free trial|limited time|act now|verify your (account|email)|dear (customer|user|friend)|earn money|make money|work from home|weight loss|casino|lottery|pharmacy|cheap meds|refinance|mortgage offer|crypto|investment opportunity/i;
                  const BULK_SENDER_DOMAINS = ['mailchimp.com','sendgrid.net','constantcontact.com','klaviyo.com','marketo.com','hubspot.com','mailerlite.com','campaignmonitor.com','aweber.com','getresponse.com','mcsv.net','mandrillapp.com'];
                  const senderDomain = fromAddr.split('@')[1] || '';
                  const urlCount = (body.match(/https?:\/\//g) || []).length;

                  let heuristicSpam = false;
                  let heuristicReason = '';

                  if (SPAM_SUBJECT_RE.test(subject)) {
                    heuristicSpam = true; heuristicReason = 'Subject matches spam pattern';
                  } else if (BULK_SENDER_DOMAINS.some(d => senderDomain.endsWith(d))) {
                    heuristicSpam = true; heuristicReason = `Bulk-mail sender domain: ${senderDomain}`;
                  } else if (!subject && body.length < 20) {
                    heuristicSpam = true; heuristicReason = 'Empty subject and near-empty body';
                  } else if (urlCount > 5) {
                    heuristicSpam = true; heuristicReason = `Excessive URLs in body (${urlCount})`;
                  } else if (SPAM_SUBJECT_RE.test(body.slice(0, 300))) {
                    heuristicSpam = true; heuristicReason = 'Body matches spam pattern';
                  }

                  if (heuristicSpam) {
                    console.log(`[EmailPoller] Heuristic spam drop from ${fromAddr} — ${heuristicReason}`);
                    res2(); return;
                  }

                  // ── Layer 2: AI spam check (Groq) — fail open ────────────
                  const spamResult = await checkEmailSpam(subject, body, senderDomain);
                  if (spamResult.spam) {
                    console.log(`[EmailPoller] AI spam drop from ${fromAddr} — ${spamResult.reason} (${spamResult.method})`);
                    res2(); return;
                  }

                  // ── AI classify ──────────────────────────────────────
                  let aiData = {};
                  try {
                    aiData = await classifyTicket(subject, body);
                  } catch (e) {
                    console.warn('[EmailPoller] AI classify failed:', e.message);
                  }

                  const category = aiData.category || 'other';
                  const priority = aiData.priority || 'medium';

                  // ── Resolve user ─────────────────────────────────────
                  const user = await resolveUser(fromAddr, fromName);

                  // ── Auto-assign technician ───────────────────────────
                  const tech = await autoAssign(category);

                  // ── SLA deadline ─────────────────────────────────────
                  const slaMap   = { critical: 1, high: 4, medium: 24, low: 72 };
                  const slaHours = slaMap[priority] || 24;

                  // ── Related KB articles ───────────────────────────────
                  const relatedArticles = await KnowledgeBase
                    .find({ category, isPublished: true })
                    .limit(3).select('_id');

                  // ── Create ticket ─────────────────────────────────────
                  const ticket = await Ticket.create({
                    title:       subject.slice(0, 150),
                    description: body || subject,
                    category,
                    priority,
                    source:      'email',
                    createdBy:   user._id,
                    assignedTo:  tech?._id || null,
                    assignedTeam: aiData.assignedTeam || '',
                    aiConfidence: aiData.confidence   || 0,
                    aiSuggestions: aiData.aiSuggestions || [],
                    similarTickets: aiData.similarTickets || [],
                    categoryProbabilities: aiData.categoryProbabilities || {},
                    slaHours,
                    slaDeadline: new Date(Date.now() + slaHours * 3600 * 1000),
                    relatedArticles: relatedArticles.map(a => a._id),
                    history: [{
                      action: 'created',
                      newValue: 'open',
                      changedBy: user._id,
                    }],
                  });

                  if (tech) await User.findByIdAndUpdate(tech._id, { $inc: { activeTickets: 1 } });

                  const populated = await ticket.populate([
                    { path: 'createdBy',   select: 'name email department' },
                    { path: 'assignedTo',  select: 'name email' },
                    { path: 'relatedArticles', select: 'title category' },
                  ]);

                  // ── Real-time push ────────────────────────────────────
                  if (io) io.emit('ticket:created', populated);

                  console.log(`[EmailPoller] Ticket ${ticket.ticketId} created from ${fromAddr} — ${category}/${priority}`);

                  // ── Auto-reply ─────────────────────────────────────────
                  await sendTicketConfirmation({
                    to:           fromAddr,
                    ticketId:     ticket.ticketId,
                    title:        ticket.title,
                    category:     ticket.category,
                    priority:     ticket.priority,
                    assignedTeam: ticket.assignedTeam,
                  });

                } catch (innerErr) {
                  console.error('[EmailPoller] Failed to process message:', innerErr.message);
                }
                res2();
              });
            });
            promises.push(p);
          });

          fetch.once('error', (e) => console.error('[EmailPoller] fetch error:', e.message));

          fetch.once('end', async () => {
            await Promise.allSettled(promises);
            imap.end();
            resolve();
          });
        });
      });
    });

    imap.connect();
  });
}

/**
 * Wraps pollOnce with a single automatic retry on transient socket errors
 * (e.g. "This socket has been ended by the other party" — Gmail idle timeout).
 */
async function pollEmails(io) {
  const { EMAIL_USER, EMAIL_PASS } = process.env;
  if (!EMAIL_USER || !EMAIL_PASS) return;

  console.log('[EmailPoller] Checking inbox…');
  try {
    await pollOnce(io);
  } catch (err) {
    const isTransient = /socket|ECONNRESET|ETIMEDOUT|ended/i.test(err.message || '');
    if (isTransient) {
      console.warn('[EmailPoller] Transient IMAP error, retrying once…', err.message);
      try {
        await new Promise(r => setTimeout(r, 3000)); // brief back-off
        await pollOnce(io);
      } catch (err2) {
        console.error('[EmailPoller] IMAP error after retry:', err2.message);
      }
    } else {
      console.error('[EmailPoller] IMAP error:', err.message);
    }
  }
}

module.exports = { pollEmails };
