import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Zap, Eye, EyeOff, LogIn } from 'lucide-react';

const Login = () => {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user', department: '' });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        await register(form);
      }
      toast.success(mode === 'login' ? 'Welcome back!' : 'Account created!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (email, password) => {
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Logged in!');
      navigate('/dashboard');
    } catch {
      toast.error('Quick login failed. Please seed the database first.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
        backgroundSize: '40px 40px'
      }} />

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
            <Zap size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">POWERGRID</h1>
          <p className="text-blue-300 text-sm mt-1">Smart IT Helpdesk System</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
            {['login', 'register'].map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                  mode === m ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {m === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input name="name" value={form.name} onChange={handleChange} required className="input-field" placeholder="Your name" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <select name="role" value={form.role} onChange={handleChange} className="input-field">
                      <option value="user">User</option>
                      <option value="technician">Technician</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <input name="department" value={form.department} onChange={handleChange} className="input-field" placeholder="e.g. Finance" />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} required className="input-field" placeholder="you@powergrid.com" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input
                  name="password" type={showPass ? 'text' : 'password'} value={form.password}
                  onChange={handleChange} required className="input-field pr-10" placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full btn-primary flex items-center justify-center gap-2 py-2.5">
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn size={16} />
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                </>
              )}
            </button>
          </form>

          {/* Quick access demo buttons */}
          {mode === 'login' && (
            <div className="mt-6 pt-5 border-t border-gray-100">
              <p className="text-xs text-gray-400 text-center mb-3 font-medium">DEMO QUICK ACCESS</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Admin', email: 'admin@powergrid.com', pass: 'Admin@123', color: 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200' },
                  { label: 'Tech', email: 'tech@powergrid.com', pass: 'Tech@123', color: 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200' },
                  { label: 'User', email: 'user@powergrid.com', pass: 'User@123', color: 'bg-green-50 hover:bg-green-100 text-green-700 border-green-200' }
                ].map(({ label, email, pass, color }) => (
                  <button key={label} onClick={() => quickLogin(email, pass)}
                    className={`text-xs font-medium py-2 px-3 rounded-lg border transition-all ${color}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
