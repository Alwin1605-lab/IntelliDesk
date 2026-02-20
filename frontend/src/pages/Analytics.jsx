import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import StatsCard from '../components/StatsCard';
import { BarChart3, Clock, Shield, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react';

const COLORS = {
  network: '#3b82f6', software: '#8b5cf6', hardware: '#f59e0b',
  authentication: '#ef4444', email: '#10b981', database: '#6366f1',
  security: '#dc2626', other: '#94a3b8'
};

const PRIORITY_COLORS = { critical: '#dc2626', high: '#f97316', medium: '#eab308', low: '#22c55e' };

const Analytics = () => {
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState(null);
  const [sla, setSla] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/analytics/summary'),
      api.get('/analytics/trends'),
      api.get('/analytics/sla')
    ]).then(([s, t, sl]) => {
      setSummary(s.data.data);
      setTrends(t.data.data);
      setSla(sl.data.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const categoryData = trends?.byCategory?.map(d => ({
    name: d._id ? d._id.charAt(0).toUpperCase() + d._id.slice(1) : 'Other',
    value: d.count,
    fill: COLORS[d._id] || '#94a3b8'
  })) || [];

  const priorityData = trends?.byPriority?.map(d => ({
    name: d._id ? d._id.charAt(0).toUpperCase() + d._id.slice(1) : 'Unknown',
    count: d.count,
    fill: PRIORITY_COLORS[d._id] || '#94a3b8'
  })) || [];

  const trendData = trends?.ticketsByDay?.slice(-14) || [];

  return (
    <div className="fade-in">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800">Analytics & Reports</h2>
        <p className="text-sm text-gray-500 mt-1">IT support performance metrics and trend analysis</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {[
          { title: 'Total Tickets', value: summary?.totalTickets, icon: BarChart3, color: 'blue' },
          { title: 'Open', value: summary?.openTickets, icon: AlertTriangle, color: 'orange' },
          { title: 'In Progress', value: summary?.inProgressTickets, icon: TrendingUp, color: 'purple' },
          { title: 'Resolved', value: summary?.resolvedTickets, icon: CheckCircle, color: 'green' },
          { title: 'SLA Breached', value: summary?.slaBreached, icon: Shield, color: 'red' },
          { title: 'Avg Resolution', value: `${summary?.avgResolutionTime || 0}h`, icon: Clock, color: 'blue' }
        ].map((s, i) => (
          <StatsCard key={i} {...s} subtitle={i === 5 ? 'average time' : undefined} />
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Ticket Volume Trend */}
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">Ticket Volume (Last 14 Days)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="_id" tick={{ fontSize: 11 }} tickFormatter={v => v?.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="created" stroke="#3b82f6" strokeWidth={2} dot={false} name="Created" />
              <Line type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={2} dot={false} name="Resolved" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Tickets by Category */}
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">Tickets by Category</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={categoryData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                {categoryData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Priority Distribution */}
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">Priority Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={priorityData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={70} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Bar dataKey="count" name="Tickets" radius={[0, 4, 4, 0]}>
                {priorityData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* SLA Compliance */}
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">SLA Compliance by Priority</h3>
          {sla.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No SLA data available yet</p>
          ) : (
            <div className="space-y-4">
              {sla.map((item) => {
                const compliance = item.total > 0 ? ((item.total - item.breached) / item.total) * 100 : 100;
                const color = compliance >= 90 ? 'bg-green-500' : compliance >= 70 ? 'bg-yellow-500' : 'bg-red-500';
                return (
                  <div key={item._id}>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-sm font-medium text-gray-700 capitalize">{item._id}</span>
                      <span className="text-sm text-gray-500">{compliance.toFixed(0)}% compliant</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${compliance}%` }} />
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-gray-400">
                      <span>{item.total} total</span>
                      <span>{item.breached} breached</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Top Technicians */}
      {trends?.topTechnicians?.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-gray-800 mb-4">🏆 Top Technicians</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-gray-500 border-b border-gray-100">
                <tr>
                  <th className="text-left py-2 font-medium">#</th>
                  <th className="text-left py-2 font-medium">Name</th>
                  <th className="text-left py-2 font-medium">Total Resolved</th>
                  <th className="text-left py-2 font-medium">Active Tickets</th>
                  <th className="text-left py-2 font-medium">Avg Resolution</th>
                </tr>
              </thead>
              <tbody>
                {trends.topTechnicians.map((tech, i) => (
                  <tr key={tech._id} className="border-b border-gray-50">
                    <td className="py-2.5 text-gray-400 font-mono">{i + 1}</td>
                    <td className="py-2.5 font-medium text-gray-800">{tech.name}</td>
                    <td className="py-2.5 text-green-600 font-semibold">{tech.totalResolved}</td>
                    <td className="py-2.5 text-blue-600">{tech.activeTickets}</td>
                    <td className="py-2.5 text-gray-500">{tech.avgResolutionTime ? `${tech.avgResolutionTime}h` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
