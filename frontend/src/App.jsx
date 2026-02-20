import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TicketProvider } from './context/TicketContext';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CreateTicket from './pages/CreateTicket';
import TicketDetail from './pages/TicketDetail';
import TicketList from './pages/TicketList';
import Analytics from './pages/Analytics';
import AdminPanel from './pages/AdminPanel';
import KnowledgeBase from './pages/KnowledgeBase';
import Layout from './components/Layout';

const PrivateRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-gray-500 text-sm">Loading...</p>
      </div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
};

const AppRoutes = () => {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route path="/" element={
        <PrivateRoute>
          <TicketProvider>
            <Layout />
          </TicketProvider>
        </PrivateRoute>
      }>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="tickets" element={<TicketList />} />
        <Route path="tickets/new" element={<CreateTicket />} />
        <Route path="tickets/:id" element={<TicketDetail />} />
        <Route path="kb" element={<KnowledgeBase />} />
        <Route path="analytics" element={
          <PrivateRoute roles={['admin', 'technician']}>
            <Analytics />
          </PrivateRoute>
        } />
        <Route path="admin" element={
          <PrivateRoute roles={['admin']}>
            <AdminPanel />
          </PrivateRoute>
        } />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: { fontSize: '14px', borderRadius: '8px', maxWidth: '400px' }
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
