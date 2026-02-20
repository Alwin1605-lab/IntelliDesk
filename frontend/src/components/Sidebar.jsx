import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Ticket, PlusCircle, BarChart2, BookOpen,
  Settings, ChevronLeft, ChevronRight, Zap, Users, Shield
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['user', 'technician', 'admin'] },
  { to: '/tickets', label: 'Tickets', icon: Ticket, roles: ['user', 'technician', 'admin'] },
  { to: '/tickets/new', label: 'New Ticket', icon: PlusCircle, roles: ['user', 'technician', 'admin'] },
  { to: '/analytics', label: 'Analytics', icon: BarChart2, roles: ['admin', 'technician'] },
  { to: '/kb', label: 'Knowledge Base', icon: BookOpen, roles: ['user', 'technician', 'admin'] },
  { to: '/admin', label: 'Admin Panel', icon: Shield, roles: ['admin'] },
];

const Sidebar = ({ open, setOpen }) => {
  const location = useLocation();
  const { user } = useAuth();

  const allowed = navItems.filter((item) => item.roles.includes(user?.role));

  return (
    <aside className={`${open ? 'w-60' : 'w-16'} bg-slate-900 text-white flex flex-col transition-all duration-300 relative shrink-0`}>
      {/* Logo */}
      <div className={`flex items-center ${open ? 'px-5' : 'px-4 justify-center'} h-16 border-b border-slate-700`}>
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setOpen(!open)}>
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
            <Zap size={16} className="text-white" />
          </div>
          {open && (
            <div>
              <div className="text-sm font-bold text-white leading-tight">POWERGRID</div>
              <div className="text-[10px] text-slate-400 font-medium tracking-wide">IT HELPDESK</div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {allowed.map((item) => {
          const Icon = item.icon;
          const active = location.pathname === item.to ||
            (item.to !== '/dashboard' && location.pathname.startsWith(item.to));
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 mx-2 mb-1 px-3 py-2.5 rounded-lg transition-all group ${
                active
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
              title={!open ? item.label : ''}
            >
              <Icon size={18} className="shrink-0" />
              {open && <span className="text-sm font-medium">{item.label}</span>}
              {!open && (
                <div className="absolute left-16 bg-slate-700 text-white text-xs rounded px-2 py-1 invisible opacity-0 group-hover:visible group-hover:opacity-100 whitespace-nowrap z-50 transition-all">
                  {item.label}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User info */}
      {open && user && (
        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <div className="text-sm font-medium text-white truncate">{user.name}</div>
              <div className="text-xs text-slate-400 capitalize">{user.role}</div>
            </div>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className="absolute -right-3 top-20 w-6 h-6 bg-slate-700 hover:bg-slate-600 text-white rounded-full flex items-center justify-center border border-slate-600 transition-all"
      >
        {open ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
      </button>
    </aside>
  );
};

export default Sidebar;
