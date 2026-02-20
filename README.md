# TicketIQ - Smart AI Helpdesk Ticketing System

A production-ready, enterprise-grade AI-powered IT helpdesk ticketing system with intelligent ticket classification, priority prediction, knowledge base search, SLA monitoring, and multi-role access control.

## Architecture

```
Frontend (React/Vite, port 5173)
    ↓
Backend (Node.js/Express, port 5000) → ML Service (Python/Flask, port 5001)
    ↓
MongoDB (port 27017, db: ticketiq)
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS + Recharts |
| Backend | Node.js + Express + Mongoose + JWT |
| ML Service | Python Flask + HuggingFace Transformers + Sentence-BERT + FAISS + XGBoost |
| Database | MongoDB |
| Email | Nodemailer (configurable SMTP) |

## Features

- **AI Ticket Classification** - Auto-categorizes tickets into Network, Hardware, Software, Security, Access using zero-shot classification (DistilBERT) with TF-IDF fallback
- **AI Priority Prediction** - Predicts ticket priority (Low/Medium/High/Critical) using XGBoost with rule-based fallback
- **Intelligent Routing** - Auto-assigns tickets to the least-busy technician in the matching department
- **Knowledge Base with Semantic Search** - FAISS + Sentence-BERT vector search with TF-IDF cosine similarity fallback
- **SLA Monitoring** - Automated breach detection every 5 minutes with auto-escalation and email alerts
- **Role-Based Access** - Admin, Technician, Employee roles with protected routes
- **Email Notifications** - Ticket created, assigned, resolved, SLA breach via Nodemailer
- **Analytics Dashboard** - Charts for category distribution, status breakdown, ticket trends, SLA compliance, technician workload
- **Multi-Channel Intake** - Web portal, chatbot simulation, email simulation

## Prerequisites

- **Node.js** >= 18
- **Python** >= 3.9
- **MongoDB** running locally on port 27017 (no auth required by default)

## Quick Start

### 1. Clone & Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install

# ML Service
cd ../ml-service
pip install -r requirements.txt
```

### 2. Configure Environment

The backend comes with a pre-configured `.env` file. To customize, edit `backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ticketiq
JWT_SECRET=ticketiq_super_secret_jwt_key_2024
JWT_EXPIRES_IN=7d
ML_SERVICE_URL=http://localhost:5001

# SMTP (optional - emails will silently fail if not configured)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=TicketIQ <noreply@ticketiq.com>
```

### 3. Start MongoDB

```bash
mongod
```

### 4. Start the Services

Open three terminals:

**Terminal 1 - Backend (port 5000):**
```bash
cd backend
npm run dev
```

On first startup, the backend auto-seeds the database with demo data (8 users, 15 tickets, 10 KB articles, SLA configs).

**Terminal 2 - ML Service (port 5001) [Optional]:**
```bash
cd ml-service
python app.py
```

> The ML service will attempt to load HuggingFace models on startup. If they fail, it falls back to TF-IDF-based custom models automatically. The backend also has its own fallback AI if the ML service is unreachable.

**Terminal 3 - Frontend (port 5173):**
```bash
cd frontend
npm run dev
```

### 5. Open the App

Navigate to `http://localhost:5173`

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@ticketiq.com | Demo@123 |
| Technician | tech1@ticketiq.com | Demo@123 |
| Employee | employee@ticketiq.com | Demo@123 |

## Pages & Roles

| Page | Route | Roles |
|------|-------|-------|
| Login | `/login` | All |
| Employee Dashboard | `/dashboard` | Employee |
| Create Ticket | `/tickets/new` | Employee |
| Ticket Detail | `/tickets/:id` | All (scoped) |
| Admin Dashboard | `/admin` | Admin |
| Technician Panel | `/technician` | Technician |
| Knowledge Base | `/knowledge-base` | All |

## API Endpoints

### Auth
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register (admin only)
- `GET /api/auth/me` - Get current user

### Tickets
- `GET /api/tickets` - List tickets (role-filtered)
- `GET /api/tickets/:id` - Get ticket detail
- `POST /api/tickets` - Create ticket (triggers AI classification + routing)
- `PATCH /api/tickets/:id` - Update ticket (status, priority, assignment)
- `POST /api/tickets/:id/comments` - Add comment

### Users
- `GET /api/users` - List users (admin)
- `GET /api/users/technicians` - List technicians
- `PATCH /api/users/:id` - Update user

### Analytics
- `GET /api/analytics/dashboard` - Admin dashboard stats
- `GET /api/analytics/sla` - SLA detailed stats

### Knowledge Base
- `GET /api/knowledge-base` - List/search articles
- `GET /api/knowledge-base/:id` - Get article
- `POST /api/knowledge-base` - Create article (admin/technician)
- `PATCH /api/knowledge-base/:id/helpful` - Mark as helpful

### ML Service
- `GET /health` - Health check
- `POST /classify` - Classify ticket text
- `POST /priority` - Predict priority
- `POST /recommend` - Get KB recommendations
- `POST /index/rebuild` - Rebuild FAISS index

## Project Structure

```
ticketiq/
├── backend/
│   ├── config/          # DB connection, SLA defaults
│   ├── middleware/       # Auth, role guard, validation
│   ├── models/          # Mongoose schemas
│   ├── routes/          # Express route handlers
│   ├── services/        # Email, AI, routing, SLA services
│   ├── seed/            # Auto-seed data
│   ├── utils/           # Helpers
│   └── server.js        # Entry point
├── ml-service/
│   ├── models/          # Classifier, priority, KB search
│   ├── data/            # Training data
│   ├── utils/           # Text processing
│   └── app.py           # Flask entry point
├── frontend/
│   ├── public/          # Static assets
│   └── src/
│       ├── api/         # Axios instance
│       ├── components/  # Reusable UI components
│       ├── context/     # Auth context
│       ├── hooks/       # Custom hooks
│       ├── layouts/     # Dashboard layout
│       └── pages/       # Page components
└── README.md
```

## SLA Configuration

| Priority | Response Time | Resolution Time |
|----------|--------------|-----------------|
| Critical | 15 min | 2 hours |
| High | 30 min | 8 hours |
| Medium | 1 hour | 24 hours |
| Low | 4 hours | 48 hours |

## License

MIT
