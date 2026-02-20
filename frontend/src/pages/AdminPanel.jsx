import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { UserPlus, Edit2, UserX, Users, Wrench, Shield, Search, X } from 'lucide-react';

const ROLES = ['user', 'technician', 'admin'];
const DEPARTMENTS = ['IT', 'HR', 'Finance', 'Operations', 'Management', 'Security'];
const SKILLS = ['network', 'software', 'hardware', 'authentication', 'email', 'database', 'security', 'other'];

const initialForm = { name: '', email: '', password: '', role: 'user', department: 'IT', skills: [], isAvailable: true };

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/users');
      setUsers(data.data || []);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const openCreate = () => {
    setEditUser(null);
    setForm(initialForm);
    setShowModal(true);
  };

  const openEdit = (u) => {
    setEditUser(u);
    setForm({ name: u.name, email: u.email, password: '', role: u.role, department: u.department || 'IT', skills: u.skills || [], isAvailable: u.isAvailable !== false });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editUser) {
        const payload = { ...form };
        if (!payload.password) delete payload.password;
        await api.put(`/users/${editUser._id}`, payload);
        toast.success('User updated');
      } else {
        await api.post('/auth/register', form);
        toast.success('User created');
      }
      setShowModal(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (u) => {
    if (!window.confirm(`${u.isActive !== false ? 'Deactivate' : 'Delete'} user ${u.name}?`)) return;
    try {
      await api.delete(`/users/${u._id}`);
      toast.success('User deactivated');
      fetchUsers();
    } catch {
      toast.error('Failed to deactivate user');
    }
  };

  const toggleSkill = (skill) => {
    setForm(f => ({
      ...f,
      skills: f.skills.includes(skill) ? f.skills.filter(s => s !== skill) : [...f.skills, skill]
    }));
  };

  const filtered = users.filter(u =>
    (!roleFilter || u.role === roleFilter) &&
    (!searchTerm || u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const roleCount = (role) => users.filter(u => u.role === role).length;

  return (
    <div className="fade-in">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Admin Panel</h2>
          <p className="text-sm text-gray-500 mt-1">Manage users, roles, and technician assignments</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2 text-sm">
          <UserPlus className="w-4 h-4" /> New User
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Users', count: users.length, icon: Users, color: 'text-blue-600' },
          { label: 'Technicians', count: roleCount('technician'), icon: Wrench, color: 'text-purple-600' },
          { label: 'Admins', count: roleCount('admin'), icon: Shield, color: 'text-orange-600' }
        ].map((s, i) => (
          <div key={i} className="card flex items-center gap-4">
            <div className={`p-2.5 bg-gray-50 rounded-xl ${s.color}`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">{s.label}</p>
              <p className="text-2xl font-bold text-gray-800">{s.count}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card mb-4 flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input className="input-field pl-9 w-full" placeholder="Search users..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <select className="input-field w-40" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
          <option value="">All Roles</option>
          {ROLES.map(r => <option key={r} value={r} className="capitalize">{r}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-x-auto">
        {loading ? (
          <p className="text-center py-10 text-gray-400">Loading users...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center py-10 text-gray-400">No users found</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-gray-500 border-b border-gray-100">
              <tr>
                <th className="text-left py-2.5 font-medium">Name</th>
                <th className="text-left py-2.5 font-medium">Email</th>
                <th className="text-left py-2.5 font-medium">Role</th>
                <th className="text-left py-2.5 font-medium">Department</th>
                <th className="text-left py-2.5 font-medium">Tickets</th>
                <th className="text-left py-2.5 font-medium">Status</th>
                <th className="text-left py-2.5 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u._id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${u.isActive === false ? 'opacity-50' : ''}`}>
                  <td className="py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs flex-shrink-0">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-800">{u.name}</span>
                    </div>
                  </td>
                  <td className="py-3 text-gray-500">{u.email}</td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.role === 'admin' ? 'bg-orange-100 text-orange-700' : u.role === 'technician' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 text-gray-500">{u.department || '—'}</td>
                  <td className="py-3">
                    <span className="text-blue-600 font-medium">{u.activeTickets || 0}</span>
                    <span className="text-gray-400 text-xs"> active</span>
                    <span className="text-gray-400 text-xs"> / {u.totalResolved || 0} resolved</span>
                  </td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {u.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(u)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDeactivate(u)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Deactivate">
                        <UserX className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h3 className="font-bold text-gray-800">{editUser ? 'Edit User' : 'Create User'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                  <input className="input-field w-full" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                  <input className="input-field w-full" type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="john@example.com" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{editUser ? 'New Password (leave blank to keep)' : 'Password'}</label>
                <input className="input-field w-full" type="password" required={!editUser} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="••••••••" minLength={6} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
                  <select className="input-field w-full" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                    {ROLES.map(r => <option key={r} value={r} className="capitalize">{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Department</label>
                  <select className="input-field w-full" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              {form.role === 'technician' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Skills</label>
                  <div className="flex flex-wrap gap-2">
                    {SKILLS.map(skill => (
                      <button type="button" key={skill} onClick={() => toggleSkill(skill)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-all capitalize ${form.skills.includes(skill) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400'}`}>
                        {skill}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {form.role === 'technician' && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isAvailable} onChange={e => setForm(f => ({ ...f, isAvailable: e.target.checked }))} className="rounded" />
                  <span className="text-sm text-gray-700">Available for ticket assignment</span>
                </label>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1 disabled:opacity-60">
                  {submitting ? 'Saving...' : editUser ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
