const mongoose = require('mongoose');
const User = require('../models/User');
const Ticket = require('../models/Ticket');
const KnowledgeBase = require('../models/KnowledgeBase');
const SLAConfig = require('../models/SLAConfig');
const slaDefaults = require('../config/slaDefaults');
const { computeSLADeadlines } = require('../services/slaService');

const seedUsers = [
  {
    name: 'Admin User',
    email: 'admin@ticketiq.com',
    password: 'Demo@123',
    role: 'admin',
    department: 'IT',
  },
  {
    name: 'Sarah Mitchell',
    email: 'tech1@ticketiq.com',
    password: 'Demo@123',
    role: 'technician',
    department: 'Network',
  },
  {
    name: 'James Rodriguez',
    email: 'tech2@ticketiq.com',
    password: 'Demo@123',
    role: 'technician',
    department: 'Software',
  },
  {
    name: 'Emily Chen',
    email: 'tech3@ticketiq.com',
    password: 'Demo@123',
    role: 'technician',
    department: 'Hardware',
  },
  {
    name: 'Marcus Thompson',
    email: 'tech4@ticketiq.com',
    password: 'Demo@123',
    role: 'technician',
    department: 'Security',
  },
  {
    name: 'Alex Johnson',
    email: 'employee@ticketiq.com',
    password: 'Demo@123',
    role: 'employee',
    department: 'General',
  },
  {
    name: 'Lisa Park',
    email: 'lisa@ticketiq.com',
    password: 'Demo@123',
    role: 'employee',
    department: 'General',
  },
  {
    name: 'David Kim',
    email: 'david@ticketiq.com',
    password: 'Demo@123',
    role: 'employee',
    department: 'General',
  },
];

const seedKnowledgeBase = [
  {
    title: 'How to Reset Your Password',
    problem: 'User cannot log in because they forgot their password or their account is locked.',
    solution:
      '1. Go to the login page and click "Forgot Password".\n2. Enter your registered email address.\n3. Check your email for the reset link (check spam folder too).\n4. Click the link and set a new password.\n5. If your account is locked, contact IT helpdesk for an unlock request.\n\nFor Active Directory accounts, use the self-service portal at https://passwordreset.company.com',
    category: 'Access',
    tags: ['password', 'login', 'account', 'locked', 'reset'],
  },
  {
    title: 'VPN Connection Troubleshooting',
    problem: 'Unable to connect to company VPN. Connection times out or fails authentication.',
    solution:
      '1. Ensure you have the latest VPN client installed (v4.2+).\n2. Check your internet connection is stable.\n3. Try disconnecting and reconnecting.\n4. Clear VPN client cache: Settings > Advanced > Clear Cache.\n5. Verify your credentials are correct.\n6. If using MFA, ensure your authenticator app time is synced.\n7. Try connecting to a different VPN server/region.\n8. Restart your computer and try again.\n\nIf issue persists, collect VPN client logs and submit to Network team.',
    category: 'Network',
    tags: ['vpn', 'network', 'connection', 'remote', 'authentication'],
  },
  {
    title: 'Outlook Not Syncing Emails',
    problem: 'Microsoft Outlook is not receiving new emails or sending emails stuck in outbox.',
    solution:
      '1. Check your internet connection.\n2. Verify Outlook is set to "Online" mode (bottom status bar).\n3. Try Send/Receive All (F9).\n4. Check if Outlook is in Cached Exchange Mode:\n   - File > Account Settings > Account Settings > Change > Use Cached Exchange Mode.\n5. Clear Outlook cache: Close Outlook, delete files in %localappdata%\\Microsoft\\Outlook\\RoamCache\n6. Repair your Outlook profile: Control Panel > Mail > Show Profiles > Repair.\n7. Run Microsoft Support and Recovery Assistant tool.\n\nIf the issue persists, recreate the Outlook profile.',
    category: 'Software',
    tags: ['outlook', 'email', 'sync', 'microsoft', 'office'],
  },
  {
    title: 'Printer Not Responding',
    problem: 'Printer shows as offline or print jobs are stuck in the queue.',
    solution:
      '1. Check printer is powered on and connected to network.\n2. Print a test page from the printer itself.\n3. On your PC, go to Settings > Printers & Scanners.\n4. Right-click the printer > See what\'s printing > Cancel All Documents.\n5. Restart the Print Spooler service:\n   - Open Services (services.msc)\n   - Find "Print Spooler" > Restart\n6. Remove and re-add the printer.\n7. Update printer drivers from manufacturer website.\n8. Check if the printer IP has changed (for network printers).',
    category: 'Hardware',
    tags: ['printer', 'offline', 'print', 'spooler', 'hardware'],
  },
  {
    title: 'Suspicious Email / Phishing Report',
    problem: 'Received a suspicious email that may be a phishing attempt.',
    solution:
      '1. DO NOT click any links or download attachments.\n2. DO NOT reply to the email or provide any information.\n3. Report the email using the "Report Phishing" button in Outlook.\n4. If no button available, forward the email as attachment to security@company.com.\n5. If you already clicked a link or entered credentials:\n   - Immediately change your password.\n   - Enable MFA on your account.\n   - Report to IT Security team immediately.\n   - Run a full antivirus scan.\n6. Mark the email as junk/spam and delete it.',
    category: 'Security',
    tags: ['phishing', 'security', 'email', 'suspicious', 'malware'],
  },
  {
    title: 'Slow Computer Performance',
    problem: 'Computer is running very slow, applications take long to load.',
    solution:
      '1. Restart your computer (full shutdown, not sleep).\n2. Check disk space: ensure at least 10GB free on C: drive.\n3. Open Task Manager (Ctrl+Shift+Esc) and check for high CPU/memory processes.\n4. Disable unnecessary startup programs: Task Manager > Startup tab.\n5. Run Disk Cleanup: Search "Disk Cleanup" in Start menu.\n6. Check for Windows Updates and install pending updates.\n7. Run antivirus scan to check for malware.\n8. Clear browser cache and temporary files.\n9. If HDD, consider requesting SSD upgrade from IT.',
    category: 'Software',
    tags: ['slow', 'performance', 'computer', 'speed', 'startup'],
  },
  {
    title: 'WiFi Keeps Disconnecting',
    problem: 'Laptop WiFi connection drops frequently or fails to reconnect automatically.',
    solution:
      '1. Forget the WiFi network and reconnect.\n2. Update WiFi adapter drivers:\n   - Device Manager > Network Adapters > WiFi adapter > Update Driver.\n3. Disable WiFi power saving:\n   - Device Manager > WiFi adapter > Properties > Power Management > Uncheck "Allow computer to turn off this device".\n4. Reset network settings:\n   - Settings > Network & Internet > Status > Network Reset.\n5. Change WiFi band from 5GHz to 2.4GHz (better range) or vice versa.\n6. Check if the issue is location-specific (signal strength).\n7. Request IT to check the nearest access point.',
    category: 'Network',
    tags: ['wifi', 'disconnecting', 'wireless', 'connection', 'network'],
  },
  {
    title: 'Request Software Installation',
    problem: 'Need to install new software but do not have admin privileges.',
    solution:
      '1. Submit a software request through the IT portal.\n2. Include in your request:\n   - Software name and version needed.\n   - Business justification.\n   - Manager approval (if required by policy).\n3. IT will verify the software against the approved software list.\n4. If approved, installation will be done remotely via SCCM or by a technician.\n5. For urgent requests, contact the IT helpdesk directly.\n\nNote: Only approved software can be installed per company security policy.',
    category: 'Software',
    tags: ['install', 'software', 'request', 'admin', 'privileges'],
  },
  {
    title: 'Multi-Factor Authentication (MFA) Setup',
    problem: 'Need to set up MFA or MFA is not working properly.',
    solution:
      '1. To set up MFA:\n   - Go to https://aka.ms/mfasetup\n   - Sign in with your work credentials.\n   - Choose your preferred method (Authenticator app recommended).\n   - Follow the on-screen instructions.\n2. If MFA is not working:\n   - Ensure your phone time is correctly synced (Settings > Date & Time > Automatic).\n   - Try using a backup code if available.\n   - If using SMS, check for signal issues.\n3. If locked out:\n   - Contact IT helpdesk with your employee ID.\n   - IT can temporarily bypass MFA for account recovery.',
    category: 'Access',
    tags: ['mfa', '2fa', 'authentication', 'security', 'login'],
  },
  {
    title: 'Laptop Docking Station Issues',
    problem: 'External monitors, USB devices, or network not working when connected to docking station.',
    solution:
      '1. Disconnect and reconnect the laptop to the dock.\n2. Check all cable connections (power, video, USB, network).\n3. Update docking station firmware (check manufacturer website).\n4. Update display drivers and USB drivers.\n5. Try connecting monitors directly to the laptop to rule out dock issues.\n6. Reset the dock by unplugging power for 30 seconds.\n7. Check Windows Display Settings for monitor detection:\n   - Settings > Display > Detect.\n8. If USB devices not working, try different USB ports on the dock.\n9. Request a replacement dock if issue persists.',
    category: 'Hardware',
    tags: ['dock', 'docking', 'monitor', 'usb', 'display', 'hardware'],
  },
];

const seedTickets = (users) => {
  const employee1 = users.find((u) => u.email === 'employee@ticketiq.com');
  const employee2 = users.find((u) => u.email === 'lisa@ticketiq.com');
  const employee3 = users.find((u) => u.email === 'david@ticketiq.com');
  const tech1 = users.find((u) => u.email === 'tech1@ticketiq.com');
  const tech2 = users.find((u) => u.email === 'tech2@ticketiq.com');
  const tech3 = users.find((u) => u.email === 'tech3@ticketiq.com');
  const tech4 = users.find((u) => u.email === 'tech4@ticketiq.com');

  const now = new Date();
  const hoursAgo = (h) => new Date(now.getTime() - h * 60 * 60 * 1000);
  const daysAgo = (d) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);

  return [
    {
      title: 'Cannot connect to VPN from home',
      description:
        'I have been trying to connect to the corporate VPN since this morning but the connection keeps timing out. I have restarted my laptop and router but the issue persists. I need VPN access to work on the quarterly report which is due tomorrow.',
      category: 'Network',
      priority: 'High',
      status: 'In Progress',
      channel: 'web',
      createdBy: employee1._id,
      assignedTo: tech1._id,
      slaDeadline: computeSLADeadlines('High'),
      respondedAt: hoursAgo(3),
      createdAt: hoursAgo(5),
      aiClassification: { category: 'Network', confidence: 0.92, prioritySuggestion: 'High', priorityScore: 0.85 },
      comments: [
        { author: tech1._id, text: 'I am looking into this. Can you confirm which VPN client version you are using?', createdAt: hoursAgo(3) },
        { author: employee1._id, text: 'I am using GlobalProtect version 5.2.8', createdAt: hoursAgo(2) },
      ],
    },
    {
      title: 'Outlook keeps crashing when opening attachments',
      description:
        'Microsoft Outlook crashes every time I try to open PDF attachments. This started after the latest Windows update. I have tried repairing Office but the issue persists.',
      category: 'Software',
      priority: 'Medium',
      status: 'Open',
      channel: 'web',
      createdBy: employee2._id,
      assignedTo: tech2._id,
      slaDeadline: computeSLADeadlines('Medium'),
      createdAt: hoursAgo(2),
      aiClassification: { category: 'Software', confidence: 0.88, prioritySuggestion: 'Medium', priorityScore: 0.6 },
    },
    {
      title: 'URGENT: Production server is down',
      description:
        'The main production web server is completely unresponsive. All customer-facing services are affected. This is impacting all users and we are losing revenue every minute. We need immediate attention.',
      category: 'Network',
      priority: 'Critical',
      status: 'Escalated',
      channel: 'email',
      createdBy: employee1._id,
      assignedTo: tech1._id,
      isEscalated: true,
      escalatedAt: hoursAgo(1),
      slaDeadline: {
        response: hoursAgo(2),
        resolution: hoursAgo(0.5),
      },
      createdAt: hoursAgo(4),
      respondedAt: hoursAgo(3.5),
      aiClassification: { category: 'Network', confidence: 0.95, prioritySuggestion: 'Critical', priorityScore: 0.98 },
      comments: [
        { author: tech1._id, text: 'Investigating now. Server logs show disk space issue.', createdAt: hoursAgo(3.5) },
        { author: tech1._id, text: 'Escalating to infrastructure team.', isInternal: true, createdAt: hoursAgo(1) },
      ],
    },
    {
      title: 'Need access to shared drive \\\\fileserver\\marketing',
      description:
        'I recently joined the Marketing team and need access to the shared marketing drive. My manager has approved the access request. Employee ID: EMP-4521.',
      category: 'Access',
      priority: 'Low',
      status: 'Resolved',
      channel: 'web',
      createdBy: employee3._id,
      assignedTo: tech4._id,
      slaDeadline: computeSLADeadlines('Low'),
      createdAt: daysAgo(3),
      respondedAt: daysAgo(2.8),
      resolvedAt: daysAgo(2.5),
      aiClassification: { category: 'Access', confidence: 0.91, prioritySuggestion: 'Low', priorityScore: 0.3 },
      comments: [
        { author: tech4._id, text: 'Access granted. Please log out and back in to see the drive.', createdAt: daysAgo(2.5) },
        { author: employee3._id, text: 'Works perfectly, thank you!', createdAt: daysAgo(2.4) },
      ],
    },
    {
      title: 'Printer on 3rd floor not printing',
      description:
        'The HP LaserJet Pro on the 3rd floor near meeting room C is showing offline status. Multiple people cannot print. The printer has paper and toner.',
      category: 'Hardware',
      priority: 'Medium',
      status: 'In Progress',
      channel: 'chatbot',
      createdBy: employee2._id,
      assignedTo: tech3._id,
      slaDeadline: computeSLADeadlines('Medium'),
      createdAt: hoursAgo(6),
      respondedAt: hoursAgo(5),
      aiClassification: { category: 'Hardware', confidence: 0.89, prioritySuggestion: 'Medium', priorityScore: 0.55 },
      comments: [
        { author: tech3._id, text: 'Checking the printer network config. Might need a restart.', createdAt: hoursAgo(5) },
      ],
    },
    {
      title: 'Suspicious email received from CEO',
      description:
        'I received an email that appears to be from our CEO asking me to urgently purchase gift cards. The email address looks slightly different. I have not clicked any links. Reporting this as potential phishing.',
      category: 'Security',
      priority: 'High',
      status: 'In Progress',
      channel: 'web',
      createdBy: employee1._id,
      assignedTo: tech4._id,
      slaDeadline: computeSLADeadlines('High'),
      createdAt: hoursAgo(1),
      respondedAt: hoursAgo(0.5),
      aiClassification: { category: 'Security', confidence: 0.94, prioritySuggestion: 'High', priorityScore: 0.88 },
      comments: [
        { author: tech4._id, text: 'Thank you for reporting. This is confirmed phishing. We are blocking the sender domain now. Do NOT respond to it.', createdAt: hoursAgo(0.5) },
      ],
    },
    {
      title: 'Request to install Adobe Acrobat Pro',
      description:
        'I need Adobe Acrobat Pro for editing and signing PDF contracts. My current free reader does not support editing. Manager John Smith has approved this.',
      category: 'Software',
      priority: 'Low',
      status: 'Open',
      channel: 'web',
      createdBy: employee3._id,
      assignedTo: tech2._id,
      slaDeadline: computeSLADeadlines('Low'),
      createdAt: daysAgo(1),
      aiClassification: { category: 'Software', confidence: 0.86, prioritySuggestion: 'Low', priorityScore: 0.25 },
    },
    {
      title: 'Laptop screen flickering',
      description:
        'My Dell Latitude 5520 laptop screen has been flickering intermittently for the past two days. It gets worse when the laptop is on battery. I have updated display drivers but the issue continues.',
      category: 'Hardware',
      priority: 'Medium',
      status: 'Open',
      channel: 'web',
      createdBy: employee2._id,
      assignedTo: tech3._id,
      slaDeadline: computeSLADeadlines('Medium'),
      createdAt: hoursAgo(8),
      aiClassification: { category: 'Hardware', confidence: 0.91, prioritySuggestion: 'Medium', priorityScore: 0.5 },
    },
    {
      title: 'WiFi dropping in Building B conference rooms',
      description:
        'Multiple employees are reporting WiFi disconnections in Building B conference rooms 201, 202, and 203. The issue occurs during video calls and is affecting productivity for multiple teams.',
      category: 'Network',
      priority: 'High',
      status: 'Resolved',
      channel: 'email',
      createdBy: employee1._id,
      assignedTo: tech1._id,
      slaDeadline: computeSLADeadlines('High'),
      createdAt: daysAgo(5),
      respondedAt: daysAgo(4.8),
      resolvedAt: daysAgo(4),
      aiClassification: { category: 'Network', confidence: 0.93, prioritySuggestion: 'High', priorityScore: 0.82 },
      comments: [
        { author: tech1._id, text: 'Found faulty access point in Building B. Replacement ordered.', createdAt: daysAgo(4.5) },
        { author: tech1._id, text: 'New AP installed and configured. Please verify.', createdAt: daysAgo(4) },
        { author: employee1._id, text: 'WiFi is working perfectly now. Thanks!', createdAt: daysAgo(3.9) },
      ],
    },
    {
      title: 'MFA not working on new phone',
      description:
        'I got a new phone and the Microsoft Authenticator app is not working. I cannot log into any company systems. I need this resolved urgently as I have a client meeting in 2 hours.',
      category: 'Access',
      priority: 'High',
      status: 'Resolved',
      channel: 'chatbot',
      createdBy: employee3._id,
      assignedTo: tech4._id,
      slaDeadline: computeSLADeadlines('High'),
      createdAt: daysAgo(2),
      respondedAt: daysAgo(1.95),
      resolvedAt: daysAgo(1.9),
      aiClassification: { category: 'Access', confidence: 0.90, prioritySuggestion: 'High', priorityScore: 0.78 },
      comments: [
        { author: tech4._id, text: 'MFA has been reset. Please re-register your authenticator app at https://aka.ms/mfasetup', createdAt: daysAgo(1.95) },
        { author: employee3._id, text: 'Done, it is working now. Thank you for the quick turnaround!', createdAt: daysAgo(1.9) },
      ],
    },
    {
      title: 'Blue screen of death on startup',
      description:
        'My workstation shows a blue screen (BSOD) with error code IRQL_NOT_LESS_OR_EQUAL every time I start it. Cannot access any files or work. This is critical for my daily operations.',
      category: 'Hardware',
      priority: 'High',
      status: 'In Progress',
      channel: 'web',
      createdBy: employee2._id,
      assignedTo: tech3._id,
      slaDeadline: computeSLADeadlines('High'),
      createdAt: hoursAgo(3),
      respondedAt: hoursAgo(2.5),
      aiClassification: { category: 'Hardware', confidence: 0.87, prioritySuggestion: 'High', priorityScore: 0.8 },
      comments: [
        { author: tech3._id, text: 'This usually indicates a driver or RAM issue. I will bring a diagnostic toolkit to your desk.', createdAt: hoursAgo(2.5) },
      ],
    },
    {
      title: 'Need to reset service account password',
      description:
        'The service account svc_backup_prod needs its password rotated per our quarterly security policy. Current credentials are expiring this Friday.',
      category: 'Security',
      priority: 'Medium',
      status: 'Closed',
      channel: 'web',
      createdBy: employee1._id,
      assignedTo: tech4._id,
      slaDeadline: computeSLADeadlines('Medium'),
      createdAt: daysAgo(7),
      respondedAt: daysAgo(6.9),
      resolvedAt: daysAgo(6.5),
      closedAt: daysAgo(6),
      aiClassification: { category: 'Security', confidence: 0.85, prioritySuggestion: 'Medium', priorityScore: 0.6 },
    },
    {
      title: 'Microsoft Teams meeting recording not working',
      description:
        'When I try to record a Teams meeting, it gives an error saying "Recording failed to save". This has been happening for all my meetings this week. I need recordings for compliance purposes.',
      category: 'Software',
      priority: 'Medium',
      status: 'Open',
      channel: 'web',
      createdBy: employee3._id,
      assignedTo: tech2._id,
      slaDeadline: computeSLADeadlines('Medium'),
      createdAt: hoursAgo(4),
      aiClassification: { category: 'Software', confidence: 0.88, prioritySuggestion: 'Medium', priorityScore: 0.55 },
    },
    {
      title: 'Data breach suspected - unauthorized access logs',
      description:
        'Our monitoring system detected multiple failed login attempts from an unknown IP address targeting admin accounts. The attempts occurred between 2 AM and 4 AM last night. This may indicate a brute force attack.',
      category: 'Security',
      priority: 'Critical',
      status: 'In Progress',
      channel: 'email',
      createdBy: employee1._id,
      assignedTo: tech4._id,
      slaDeadline: computeSLADeadlines('Critical'),
      createdAt: hoursAgo(6),
      respondedAt: hoursAgo(5.8),
      aiClassification: { category: 'Security', confidence: 0.96, prioritySuggestion: 'Critical', priorityScore: 0.95 },
      comments: [
        { author: tech4._id, text: 'IP has been blocked at firewall level. Analyzing access logs now.', createdAt: hoursAgo(5.8) },
        { author: tech4._id, text: 'No successful breaches detected. Implementing rate limiting on login endpoints.', isInternal: true, createdAt: hoursAgo(4) },
      ],
    },
    {
      title: 'Cannot access SharePoint site',
      description:
        'I am getting a 403 Forbidden error when trying to access the Finance team SharePoint site. I used to have access but it stopped working after the recent migration.',
      category: 'Access',
      priority: 'Medium',
      status: 'Open',
      channel: 'chatbot',
      createdBy: employee2._id,
      assignedTo: null,
      slaDeadline: computeSLADeadlines('Medium'),
      createdAt: hoursAgo(1),
      aiClassification: { category: 'Access', confidence: 0.89, prioritySuggestion: 'Medium', priorityScore: 0.5 },
    },
  ];
};

const seedDatabase = async () => {
  try {
    // Check if data already exists
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log('[Seed] Database already has data. Skipping seed.');
      return;
    }

    console.log('[Seed] Seeding database with demo data...');

    // Create users
    const createdUsers = [];
    for (const userData of seedUsers) {
      const user = await User.create(userData);
      createdUsers.push(user);
    }
    console.log(`[Seed] Created ${createdUsers.length} users`);

    // Set active ticket counts for technicians
    const tech1 = createdUsers.find((u) => u.email === 'tech1@ticketiq.com');
    const tech2 = createdUsers.find((u) => u.email === 'tech2@ticketiq.com');
    const tech3 = createdUsers.find((u) => u.email === 'tech3@ticketiq.com');
    const tech4 = createdUsers.find((u) => u.email === 'tech4@ticketiq.com');

    // Create tickets
    const ticketData = seedTickets(createdUsers);
    const createdTickets = [];
    for (const tData of ticketData) {
      const ticket = await Ticket.create(tData);
      createdTickets.push(ticket);
    }
    console.log(`[Seed] Created ${createdTickets.length} tickets`);

    // Update technician active ticket counts
    const techTicketCounts = {};
    for (const ticket of createdTickets) {
      if (ticket.assignedTo && ['Open', 'In Progress', 'Escalated'].includes(ticket.status)) {
        const techId = ticket.assignedTo.toString();
        techTicketCounts[techId] = (techTicketCounts[techId] || 0) + 1;
      }
    }
    for (const [techId, count] of Object.entries(techTicketCounts)) {
      await User.findByIdAndUpdate(techId, { activeTicketCount: count });
    }

    // Create knowledge base articles
    const admin = createdUsers.find((u) => u.role === 'admin');
    const kbArticles = seedKnowledgeBase.map((kb) => ({
      ...kb,
      createdBy: admin._id,
    }));
    await KnowledgeBase.insertMany(kbArticles);
    console.log(`[Seed] Created ${kbArticles.length} knowledge base articles`);

    // Create SLA configs
    const slaConfigs = Object.entries(slaDefaults).map(([priority, config]) => ({
      priority,
      responseMinutes: config.responseMinutes,
      resolutionMinutes: config.resolutionMinutes,
    }));
    await SLAConfig.insertMany(slaConfigs);
    console.log(`[Seed] Created ${slaConfigs.length} SLA configs`);

    console.log('[Seed] Database seeding completed successfully!');
    console.log('[Seed] Demo Credentials:');
    console.log('  Admin:      admin@ticketiq.com / Demo@123');
    console.log('  Technician: tech1@ticketiq.com / Demo@123');
    console.log('  Employee:   employee@ticketiq.com / Demo@123');
  } catch (error) {
    console.error('[Seed] Error:', error.message);
    throw error;
  }
};

module.exports = seedDatabase;
