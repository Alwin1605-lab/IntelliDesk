import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Bell, LogOut, User, PlusCircle, Menu } from 'lucide-react';

const Navbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleColor = { admin: 'bg-purple-100 text-purple-700', technician: 'bg-blue-100 text-blue-700', user: 'bg-gray-100 text-gray-700' };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-4">
        <button onClick={onMenuClick} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
          <Menu size={20} />
        </button>
        <div>
          <h1 className="text-base font-semibold text-gray-800">IT Helpdesk</h1>
          <p className="text-xs text-gray-500">Smart Ticketing System</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/tickets/new')}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-3 py-2 rounded-lg transition-all"
        >
          <PlusCircle size={15} />
          <span className="hidden sm:block">New Ticket</span>
        </button>

        <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        <div className="flex items-center gap-2 pl-3 border-l border-gray-200">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold text-white">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="hidden sm:block">
            <div className="text-sm font-medium text-gray-700">{user?.name}</div>
            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${roleColor[user?.role]}`}>
              {user?.role}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="ml-1 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
