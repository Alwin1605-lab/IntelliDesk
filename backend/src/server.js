require('dotenv').config();
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const { Server } = require('socket.io');
const cron = require('node-cron');

const app = express();
const server = http.createServer(app);

// Socket.IO
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL || '*', methods: ['GET', 'POST'] }
});
app.set('io', io);

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

// Serve uploaded files
app.use('/api/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

// Routes
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/tickets',   require('./routes/tickets'));
app.use('/api/users',     require('./routes/users'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/kb',        require('./routes/knowledgeBase'));
app.use('/api/chatbot',   require('./routes/chatbot'));

// 404
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

// MongoDB connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/helpdesk_db')
  .then(() => {
    console.log('MongoDB connected');

    // Seed admin if first run
    require('./seed').seedAdmin();

    // SLA breach check cron — every 30 minutes
    cron.schedule('*/30 * * * *', async () => {
      try {
        await require('./jobs/slaChecker').checkSLABreaches(io);
      } catch (e) { console.error('SLA check error:', e.message); }
    });

    // Email → Auto Ticket cron — every 60 seconds (only if credentials are set)
    if (process.env.EMAIL_USER && !process.env.EMAIL_USER.startsWith('your_')) {
      cron.schedule('* * * * *', async () => {
        try {
          await require('./jobs/emailPoller').pollEmails(io);
        } catch (e) { console.error('Email poll error:', e.message); }
      });
      console.log('Email poller started (checking inbox every 60s)');
    } else {
      console.log('Email poller disabled — set EMAIL_USER and EMAIL_PASS in .env to enable');
    }

    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => { console.error('MongoDB error:', err); process.exit(1); });

// Socket.IO
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('join', (room) => socket.join(room));
  socket.on('disconnect', () => console.log('Client disconnected:', socket.id));
});

module.exports = { app, io };
