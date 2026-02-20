const nodemailer = require('nodemailer');

let transporter = null;

const initTransporter = () => {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
};

const sendEmail = async ({ to, subject, html }) => {
  try {
    if (!process.env.SMTP_USER || process.env.SMTP_USER === 'your-email@gmail.com') {
      console.log(`[Email] Skipped (SMTP not configured): "${subject}" -> ${to}`);
      return { success: true, skipped: true };
    }

    const transport = initTransporter();
    const info = await transport.sendMail({
      from: process.env.SMTP_FROM || 'TicketIQ <noreply@ticketiq.com>',
      to,
      subject,
      html,
    });

    console.log(`[Email] Sent: ${info.messageId} -> ${to}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[Email] Error sending to ${to}:`, error.message);
    return { success: false, error: error.message };
  }
};

// Email templates
const templates = {
  ticketCreated: (ticket, user) => ({
    subject: `[TicketIQ] Ticket ${ticket.ticketId} Created - ${ticket.title}`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #4F46E5, #7C3AED); padding: 24px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 20px;">🎫 TicketIQ</h1>
        </div>
        <div style="background: #ffffff; padding: 24px; border: 1px solid #e2e8f0;">
          <h2 style="color: #1e293b; margin-top: 0;">New Ticket Created</h2>
          <p style="color: #475569;">Hello ${user.name},</p>
          <p style="color: #475569;">Your ticket has been successfully created and is being processed.</p>
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
            <tr><td style="padding: 8px; color: #64748b; border-bottom: 1px solid #f1f5f9;">Ticket ID</td>
                <td style="padding: 8px; font-weight: 600; color: #1e293b; border-bottom: 1px solid #f1f5f9;">${ticket.ticketId}</td></tr>
            <tr><td style="padding: 8px; color: #64748b; border-bottom: 1px solid #f1f5f9;">Title</td>
                <td style="padding: 8px; color: #1e293b; border-bottom: 1px solid #f1f5f9;">${ticket.title}</td></tr>
            <tr><td style="padding: 8px; color: #64748b; border-bottom: 1px solid #f1f5f9;">Category</td>
                <td style="padding: 8px; color: #1e293b; border-bottom: 1px solid #f1f5f9;">${ticket.category}</td></tr>
            <tr><td style="padding: 8px; color: #64748b; border-bottom: 1px solid #f1f5f9;">Priority</td>
                <td style="padding: 8px; color: #1e293b; border-bottom: 1px solid #f1f5f9;">${ticket.priority}</td></tr>
          </table>
          <p style="color: #475569;">Our team will review and assign your ticket shortly.</p>
        </div>
        <div style="background: #f8fafc; padding: 16px; text-align: center; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: 0;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">TicketIQ - Smart AI Helpdesk System</p>
        </div>
      </div>
    `,
  }),

  ticketAssigned: (ticket, technician) => ({
    subject: `[TicketIQ] Ticket ${ticket.ticketId} Assigned to You`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #4F46E5, #7C3AED); padding: 24px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 20px;">🎫 TicketIQ</h1>
        </div>
        <div style="background: #ffffff; padding: 24px; border: 1px solid #e2e8f0;">
          <h2 style="color: #1e293b; margin-top: 0;">Ticket Assigned</h2>
          <p style="color: #475569;">Hello ${technician.name},</p>
          <p style="color: #475569;">A new ticket has been assigned to you:</p>
          <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 4px 0; color: #1e293b;"><strong>${ticket.ticketId}</strong> - ${ticket.title}</p>
            <p style="margin: 4px 0; color: #64748b;">Priority: <strong>${ticket.priority}</strong> | Category: <strong>${ticket.category}</strong></p>
          </div>
          <p style="color: #475569;">Please review and respond within the SLA timeframe.</p>
        </div>
        <div style="background: #f8fafc; padding: 16px; text-align: center; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: 0;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">TicketIQ - Smart AI Helpdesk System</p>
        </div>
      </div>
    `,
  }),

  slaBreachWarning: (ticket, admin) => ({
    subject: `⚠️ [TicketIQ] SLA Breach Alert - ${ticket.ticketId}`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #DC2626, #EF4444); padding: 24px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 20px;">⚠️ TicketIQ - SLA Alert</h1>
        </div>
        <div style="background: #ffffff; padding: 24px; border: 1px solid #e2e8f0;">
          <h2 style="color: #DC2626; margin-top: 0;">SLA Breach Detected</h2>
          <p style="color: #475569;">Hello ${admin.name},</p>
          <p style="color: #475569;">The following ticket has breached its SLA deadline:</p>
          <div style="background: #FEF2F2; border: 1px solid #FECACA; border-radius: 8px; padding: 16px; margin: 16px 0;">
            <p style="margin: 4px 0; color: #1e293b;"><strong>${ticket.ticketId}</strong> - ${ticket.title}</p>
            <p style="margin: 4px 0; color: #64748b;">Priority: <strong>${ticket.priority}</strong></p>
            <p style="margin: 4px 0; color: #DC2626;"><strong>Status: Escalated</strong></p>
          </div>
          <p style="color: #475569;">Immediate attention is required.</p>
        </div>
        <div style="background: #f8fafc; padding: 16px; text-align: center; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: 0;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">TicketIQ - Smart AI Helpdesk System</p>
        </div>
      </div>
    `,
  }),

  ticketResolved: (ticket, user) => ({
    subject: `✅ [TicketIQ] Ticket ${ticket.ticketId} Resolved`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #059669, #10B981); padding: 24px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 20px;">✅ TicketIQ</h1>
        </div>
        <div style="background: #ffffff; padding: 24px; border: 1px solid #e2e8f0;">
          <h2 style="color: #059669; margin-top: 0;">Ticket Resolved</h2>
          <p style="color: #475569;">Hello ${user.name},</p>
          <p style="color: #475569;">Your ticket <strong>${ticket.ticketId}</strong> - "${ticket.title}" has been resolved.</p>
          <p style="color: #475569;">If the issue persists, please reopen the ticket or create a new one.</p>
        </div>
        <div style="background: #f8fafc; padding: 16px; text-align: center; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: 0;">
          <p style="color: #94a3b8; font-size: 12px; margin: 0;">TicketIQ - Smart AI Helpdesk System</p>
        </div>
      </div>
    `,
  }),
};

module.exports = { sendEmail, templates };
