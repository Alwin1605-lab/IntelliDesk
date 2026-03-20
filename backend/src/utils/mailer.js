'use strict';
const nodemailer = require('nodemailer');

// ─── Singleton transporter ───────────────────────────────────────────────────
let _transporter = null;

function getTransporter() {
  if (_transporter) return _transporter;

  const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS } = process.env;

  if (!EMAIL_USER || !EMAIL_PASS) {
    console.warn('[Mailer] EMAIL_USER / EMAIL_PASS not set — auto-reply disabled');
    return null;
  }

  _transporter = nodemailer.createTransport({
    host: EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(EMAIL_PORT || '587'),
    secure: parseInt(EMAIL_PORT || '587') === 465,
    auth: { user: EMAIL_USER, pass: EMAIL_PASS },
  });

  return _transporter;
}

/**
 * Send ticket-created confirmation to the user who emailed in.
 */
async function sendTicketConfirmation({ to, ticketId, title, category, priority, assignedTeam }) {
  const transporter = getTransporter();
  if (!transporter) return;

  const supportEmail = process.env.EMAIL_USER;
  const categoryLabels = {
    network: 'Network', software: 'Software', hardware: 'Hardware',
    authentication: 'Authentication', email: 'Email', database: 'Database',
    security: 'Security', hr: 'Human Resources', other: 'General IT',
  };
  const priorityLabels = {
    critical: '🔴 Critical', high: '🟠 High', medium: '🟡 Medium', low: '🟢 Low',
  };
  const slaMap = { critical: '1 hour', high: '4 hours', medium: '24 hours', low: '72 hours' };

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; color: #333; margin: 0; padding: 0; background: #f5f7fa; }
    .container { max-width: 560px; margin: 30px auto; background: #fff; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #1d4ed8, #3b82f6); padding: 28px 32px; }
    .header h1 { color: #fff; margin: 0; font-size: 20px; }
    .header p { color: #bfdbfe; margin: 4px 0 0; font-size: 13px; }
    .body { padding: 28px 32px; }
    .ticket-id { background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 14px 20px; margin-bottom: 24px; }
    .ticket-id span { font-size: 22px; font-weight: 700; color: #1d4ed8; font-family: monospace; }
    .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
    .row:last-child { border: none; }
    .label { color: #64748b; }
    .value { font-weight: 600; color: #1e293b; }
    .sla-box { background: #fefce8; border: 1px solid #fde68a; border-radius: 8px; padding: 12px 16px; margin-top: 20px; font-size: 13px; color: #92400e; }
    .footer { background: #f8fafc; padding: 16px 32px; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
    .btn { display: inline-block; margin-top: 20px; background: #1d4ed8; color: #fff; text-decoration: none; padding: 10px 24px; border-radius: 8px; font-size: 14px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚡ POWERGRID IT Helpdesk</h1>
      <p>Smart IT Support System</p>
    </div>
    <div class="body">
      <p style="font-size:15px;">Your support request has been received and a ticket has been created automatically.</p>
      <div class="ticket-id">
        <div style="font-size:12px;color:#64748b;margin-bottom:4px;">TICKET ID</div>
        <span>${ticketId}</span>
      </div>
      <div class="row"><span class="label">Issue</span><span class="value" style="max-width:280px;text-align:right;">${title}</span></div>
      <div class="row"><span class="label">Category</span><span class="value">${categoryLabels[category] || 'General IT'}</span></div>
      <div class="row"><span class="label">Priority</span><span class="value">${priorityLabels[priority] || priority}</span></div>
      <div class="row"><span class="label">Assigned Team</span><span class="value">${assignedTeam || 'IT Support'}</span></div>
      <div class="row"><span class="label">Status</span><span class="value" style="color:#2563eb;">Open</span></div>
      <div class="sla-box">
        ⏱️ <strong>SLA Commitment:</strong> Your ticket will be resolved within <strong>${slaMap[priority] || '24 hours'}</strong>.
      </div>
      <p style="font-size:13px;color:#64748b;margin-top:20px;">
        You can reply to this email to add more information to your ticket.<br>
        Reference your ticket ID <strong>${ticketId}</strong> in any follow-up communication.
      </p>
    </div>
    <div class="footer">
      This is an automated message from POWERGRID IT Helpdesk • ${supportEmail}<br>
      Please do not reply directly to this email for new issues — send a new email instead.
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
POWERGRID IT Helpdesk — Ticket Confirmation

Your support request has been registered.

Ticket ID    : ${ticketId}
Issue        : ${title}
Category     : ${categoryLabels[category] || 'General IT'}
Priority     : ${priority}
Assigned Team: ${assignedTeam || 'IT Support'}
Status       : Open

SLA: Your ticket will be resolved within ${slaMap[priority] || '24 hours'}.

Reference ticket ID ${ticketId} in any follow-up emails.

— POWERGRID IT Helpdesk
  `.trim();

  try {
    await transporter.sendMail({
      from: `"POWERGRID IT Helpdesk" <${supportEmail}>`,
      to,
      subject: `[Ticket ${ticketId}] Your IT support request has been registered`,
      text,
      html,
    });
    console.log(`[Mailer] Confirmation sent to ${to} for ticket ${ticketId}`);
  } catch (err) {
    console.error('[Mailer] Failed to send confirmation:', err.message);
  }
}

module.exports = { sendTicketConfirmation };
