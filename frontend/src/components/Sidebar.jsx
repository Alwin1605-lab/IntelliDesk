import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  LayoutDashboard,
  PlusCircle,
  BarChart3,
  BookOpen,
  Wrench,
  Ticket,
} from 'lucide-react';

const navItems = {
  employee: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/tickets/new', icon: PlusCircle, label: 'New Ticket' },
    { to: '/knowledge-base', icon: BookOpen, label: 'Knowledge Base' },
  ],
  technician: [
    { to: '/technician', icon: Wrench, label: 'My Queue' },
    { to: '/knowledge-base', icon: BookOpen, label: 'Knowledge Base' },
  ],
  admin: [
    { to: '/admin', icon: BarChart3, label: 'Dashboard' },
    { to: '/knowledge-base', icon: BookOpen, label: 'Knowledge Base' },
  ],
};

export default function Sidebar() {
  const { user } = useAuth();
  const items = navItems[user?.role] || navItems.employee;

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-full">
      {/* Logo */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-200">
        <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-violet-600 rounded-lg flex items-center justify-center">
          <Ticket className="w-4.5 h-4.5 text-white" size={18} />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">TicketIQ</h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="px-3 mb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Navigation
        </p>
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/dashboard' || item.to === '/admin' || item.to === '/technician'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-primary-50 text-primary-700 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <item.icon size={18} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User info */}
      <div className="p-4 border-t border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-violet-500 flex items-center justify-center text-white text-sm font-semibold">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">{user?.name}</p>
            <p className="text-xs text-slate-500 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
