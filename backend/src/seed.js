const mongoose = require('mongoose');
const User = require('./models/User');
const KnowledgeBase = require('./models/KnowledgeBase');

async function seedAdmin() {
  try {
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount > 0) return;

    console.log('Seeding initial data...');

    // Create admin
    await User.create({
      name: 'Admin User',
      email: 'admin@powergrid.com',
      password: 'Admin@123',
      role: 'admin',
      department: 'IT',
    });

    // Create technicians (first one gets the demo "tech@powergrid.com" login)
    const technicians = [
      { name: 'Network Tech', email: 'tech@powergrid.com', password: 'Tech@123', role: 'technician', department: 'IT', skills: ['network', 'hardware'] },
      { name: 'Software Tech', email: 'software@powergrid.com', password: 'Tech@123', role: 'technician', department: 'IT', skills: ['software', 'email', 'authentication'] },
      { name: 'Security Tech', email: 'security@powergrid.com', password: 'Tech@123', role: 'technician', department: 'Security', skills: ['security', 'database', 'authentication'] },
      { name: 'HR Tech', email: 'hr@powergrid.com', password: 'Tech@123', role: 'technician', department: 'HR', skills: ['hr', 'software'] },
    ];
    await User.insertMany(technicians);

    // Create demo user
    await User.create({
      name: 'Demo User',
      email: 'user@powergrid.com',
      password: 'User@123',
      role: 'user',
      department: 'Operations',
    });

    // Seed KB articles
    const adminUser = await User.findOne({ role: 'admin' });
    const kbArticles = [
      {
        title: 'How to Reset Your Password',
        content: `Steps to reset your password:\n1. Go to the login page\n2. Click "Forgot Password"\n3. Enter your email address\n4. Check your email for reset link\n5. Click the link and set new password\n\nPassword requirements:\n- Minimum 8 characters\n- At least one uppercase letter\n- At least one number\n- At least one special character\n\nIf you don't receive the email within 5 minutes, check spam folder or contact IT helpdesk.`,
        category: 'authentication',
        tags: ['password', 'reset', 'login', 'account'],
        createdBy: adminUser._id,
      },
      {
        title: 'Fix WiFi Connection Issues',
        content: `Troubleshooting WiFi connection problems:\n\n**Step 1:** Check if WiFi is enabled\n- Look for WiFi icon in system tray\n- Ensure airplane mode is OFF\n\n**Step 2:** Restart network adapter\n- Open Device Manager\n- Right-click WiFi adapter\n- Select "Disable device", wait 10 seconds\n- Select "Enable device"\n\n**Step 3:** Forget and reconnect to network\n- Go to WiFi settings\n- Click on network name\n- Select "Forget"\n- Reconnect with credentials\n\n**Step 4:** Flush DNS\n- Open Command Prompt as Admin\n- Run: ipconfig /flushdns\n- Run: ipconfig /renew\n\nIf issue persists, contact Network Team.`,
        category: 'network',
        tags: ['wifi', 'network', 'connectivity', 'internet'],
        createdBy: adminUser._id,
      },
      {
        title: 'VPN Setup and Troubleshooting',
        content: `Setting up and troubleshooting VPN access:\n\n**Initial Setup:**\n1. Download VPN client from IT portal\n2. Install and launch the application\n3. Enter server: vpn.company.com\n4. Login with your corporate credentials\n\n**Common Issues:**\n\n*Cannot connect to VPN:*\n- Check internet connection first\n- Verify credentials are correct\n- Try different VPN server\n- Disable firewall temporarily to test\n\n*Slow VPN connection:*\n- Connect to nearest server\n- Close bandwidth-heavy applications\n- Restart VPN client\n\n*VPN keeps disconnecting:*\n- Check network stability\n- Update VPN client\n- Contact IT for server-side check`,
        category: 'network',
        tags: ['vpn', 'remote-access', 'network', 'connection'],
        createdBy: adminUser._id,
      },
      {
        title: 'Office 365 Common Issues and Fixes',
        content: `Resolving common Office 365 problems:\n\n**Outlook not opening:**\n1. Start Outlook in Safe Mode: outlook.exe /safe\n2. Disable add-ins: File > Options > Add-ins\n3. Repair Office: Control Panel > Programs > Microsoft Office > Change > Online Repair\n\n**Teams audio/video issues:**\n1. Check microphone/camera permissions\n2. Test devices: Settings > Devices\n3. Clear Teams cache: %appdata%\\Microsoft\\Teams\n\n**OneDrive sync problems:**\n1. Check available storage\n2. Pause and resume sync\n3. Unlink and re-link account\n\n**License issues:**\n- Contact IT for license assignment\n- Check admin.microsoft.com (admin only)`,
        category: 'software',
        tags: ['office365', 'outlook', 'teams', 'onedrive', 'email'],
        createdBy: adminUser._id,
      },
      {
        title: 'Printer Troubleshooting Guide',
        content: `Fix common printer problems:\n\n**Printer offline:**\n1. Check printer is powered on\n2. Verify USB/network cable connections\n3. Restart printer and PC\n4. Right-click printer > See what's printing > Printer > Uncheck "Use Printer Offline"\n\n**Print queue stuck:**\n1. Open Services (services.msc)\n2. Stop "Print Spooler" service\n3. Navigate to C:\\Windows\\System32\\spool\\PRINTERS\n4. Delete all files inside\n5. Start Print Spooler service\n\n**Poor print quality:**\n1. Check ink/toner levels\n2. Run printer alignment/calibration\n3. Clean print heads\n4. Use correct paper type\n\n**Cannot install printer:**\n1. Download latest driver from manufacturer\n2. Run as Administrator\n3. Temporarily disable antivirus`,
        category: 'hardware',
        tags: ['printer', 'hardware', 'print', 'offline'],
        createdBy: adminUser._id,
      },
      {
        title: 'Data Security Best Practices',
        content: `Protecting company data and preventing security incidents:\n\n**Password Security:**\n- Use unique passwords for each system\n- Enable Multi-Factor Authentication (MFA)\n- Never share credentials\n- Use password manager\n\n**Email Security:**\n- Don't click suspicious links\n- Verify sender before opening attachments\n- Report phishing to security@company.com\n\n**Device Security:**\n- Lock screen when leaving desk (Win+L)\n- Encrypt laptop with BitLocker\n- Keep software updated\n- Never use public USB drives\n\n**Incident Reporting:**\n- Report security incidents immediately\n- Contact: security@company.com\n- Emergency: ext. 911\n- Do not attempt to fix security breaches yourself`,
        category: 'security',
        tags: ['security', 'password', 'phishing', 'data-protection'],
        createdBy: adminUser._id,
      },
      {
        title: 'Database Connection Issues',
        content: `Troubleshooting database connectivity problems:\n\n**Cannot connect to database:**\n1. Verify database server is running\n2. Check connection string (server, port, database name)\n3. Confirm credentials are correct\n4. Check firewall rules allow connection on port\n\n**Slow query performance:**\n1. Check database indexes\n2. Review query execution plan\n3. Monitor server resources (CPU, RAM, disk)\n4. Contact Database Team for optimization\n\n**Backup/Restore issues:**\n1. Verify sufficient disk space\n2. Check backup file integrity\n3. Ensure correct permissions\n4. Contact Database Team for large restores\n\n**Connection pool exhausted:**\n1. Restart application server\n2. Review connection pool settings\n3. Identify connection leaks in code`,
        category: 'database',
        tags: ['database', 'sql', 'connection', 'performance'],
        createdBy: adminUser._id,
      },
    ];

    await KnowledgeBase.insertMany(kbArticles);
    console.log('Seeding complete!');
    console.log('Admin:  admin@powergrid.com / Admin@123');
    console.log('Tech:   tech@powergrid.com  / Tech@123');
    console.log('User:   user@powergrid.com  / User@123');
  } catch (err) {
    console.error('Seed error:', err.message);
  }
}

module.exports = { seedAdmin };
