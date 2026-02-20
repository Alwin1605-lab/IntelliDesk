import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Ticket, Eye, EyeOff, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success(`Welcome back, ${user.name}!`);
      const routes = { admin: '/admin', technician: '/technician', employee: '/dashboard' };
      navigate(routes[user.role] || '/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const demoAccounts = [
    { label: 'Admin', email: 'admin@ticketiq.com', role: 'admin' },
    { label: 'Technician', email: 'tech1@ticketiq.com', role: 'technician' },
    { label: 'Employee', email: 'employee@ticketiq.com', role: 'employee' },
  ];

  const fillDemo = (account) => {
    setEmail(account.email);
    setPassword('Demo@123');
  };

  return (
    <div className="min-h-screen flex">
      {/* Left - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-primary-700 to-violet-800 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center">
              <Ticket className="text-white" size={24} />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">TicketIQ</h1>
          </div>
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Smart AI-Powered<br />IT Helpdesk
          </h2>
          <p className="text-lg text-primary-200 leading-relaxed max-w-md">
            Streamline your IT support with intelligent ticket classification,
            automatic routing, and AI-powered knowledge base recommendations.
          </p>
          <div className="mt-10 grid grid-cols-2 gap-4">
            {[
              { n: 'AI Classification', d: 'Auto-categorize tickets' },
              { n: 'Smart Routing', d: 'Assign to right team' },
              { n: 'SLA Monitoring', d: 'Track compliance' },
              { n: 'Knowledge Base', d: 'Instant solutions' },
            ].map((f) => (
              <div key={f.n} className="bg-white/10 backdrop-blur rounded-xl p-4">
                <p className="text-sm font-semibold text-white">{f.n}</p>
                <p className="text-xs text-primary-200 mt-1">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-violet-600 rounded-xl flex items-center justify-center">
              <Ticket className="text-white" size={20} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">TicketIQ</h1>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900">Welcome back</h2>
            <p className="text-slate-500 mt-1">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="you@company.com"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pr-10"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Demo accounts */}
          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-slate-50 px-3 text-xs text-slate-500">Demo Accounts</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.email}
                  onClick={() => fillDemo(acc)}
                  className="px-3 py-2.5 text-xs font-medium text-slate-600 bg-white border border-slate-200
                             rounded-lg hover:border-primary-300 hover:text-primary-700 hover:bg-primary-50
                             transition-all duration-200 text-center"
                >
                  {acc.label}
                </button>
              ))}
            </div>
            <p className="text-center text-xs text-slate-400 mt-3">
              Password: Demo@123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
