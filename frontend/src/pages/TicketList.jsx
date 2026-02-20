import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTickets } from '../context/TicketContext';
import { PriorityBadge, StatusBadge, CategoryBadge } from '../components/Badges';
import { formatDistanceToNow } from 'date-fns';
import { Search, Filter, Plus, Ticket, ChevronLeft, ChevronRight } from 'lucide-react';

const STATUS_OPTIONS = ['', 'open', 'in-progress', 'pending', 'resolved', 'closed'];
const PRIORITY_OPTIONS = ['', 'critical', 'high', 'medium', 'low'];
const CATEGORY_OPTIONS = ['', 'network', 'software', 'hardware', 'authentication', 'email', 'database', 'security', 'other'];

const TicketList = () => {
  const navigate = useNavigate();
  const { tickets, loading, pagination, fetchTickets } = useTickets();
  const [filters, setFilters] = useState({ status: '', priority: '', category: '', search: '', page: 1 });

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchTickets({ ...filters, limit: 15 });
    }, 300);
    return () => clearTimeout(timeout);
  }, [filters]);

  const setFilter = (key, val) => setFilters(f => ({ ...f, [key]: val, page: 1 }));
  const setPage = (p) => setFilters(f => ({ ...f, page: p }));

  return (
    <div className="fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Tickets</h2>
          <p className="text-sm text-gray-500 mt-0.5">{pagination.total} total tickets</p>
        </div>
        <button onClick={() => navigate('/tickets/new')} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={15} /> New Ticket
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <Search size={16} className="text-gray-400 shrink-0" />
            <input
              value={filters.search}
              onChange={(e) => setFilter('search', e.target.value)}
              placeholder="Search tickets..."
              className="input-field flex-1"
            />
          </div>

          {[
            { key: 'status', options: STATUS_OPTIONS, label: 'All Status' },
            { key: 'priority', options: PRIORITY_OPTIONS, label: 'All Priority' },
            { key: 'category', options: CATEGORY_OPTIONS, label: 'All Category' }
          ].map(({ key, options, label }) => (
            <select key={key} value={filters[key]} onChange={(e) => setFilter(key, e.target.value)}
              className="input-field w-auto min-w-[130px]">
              <option value="">{label}</option>
              {options.filter(Boolean).map(o => (
                <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1).replace('-', ' ')}</option>
              ))}
            </select>
          ))}

          {(filters.status || filters.priority || filters.category || filters.search) && (
            <button onClick={() => setFilters({ status: '', priority: '', category: '', search: '', page: 1 })}
              className="btn-secondary text-sm">
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Ticket ID', 'Title', 'Category', 'Priority', 'Status', 'Assigned To', 'Created'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array(8).fill(0).map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    {Array(7).fill(0).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : tickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <Ticket size={40} className="text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400 font-medium">No tickets found</p>
                    <p className="text-gray-300 text-xs mt-1">Try changing the filters or create a new ticket</p>
                  </td>
                </tr>
              ) : (
                tickets.map((ticket) => (
                  <tr
                    key={ticket._id}
                    onClick={() => navigate(`/tickets/${ticket._id}`)}
                    className={`border-b border-gray-50 hover:bg-blue-50/50 cursor-pointer transition-colors ${
                      ticket.priority === 'critical' && !['resolved', 'closed'].includes(ticket.status)
                        ? 'bg-red-50/30'
                        : ''
                    }`}
                  >
                    <td className="px-4 py-3 font-mono text-xs text-blue-600 font-medium whitespace-nowrap">
                      {ticket.ticketId}
                      {ticket.isOverdue && <span className="ml-1 text-red-500">⚠</span>}
                    </td>
                    <td className="px-4 py-3 max-w-[220px]">
                      <p className="font-medium text-gray-800 truncate">{ticket.title}</p>
                      <p className="text-xs text-gray-400 truncate">{ticket.createdBy?.name}</p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <CategoryBadge category={ticket.category} />
                    </td>
                    <td className="px-4 py-3">
                      <PriorityBadge priority={ticket.priority} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={ticket.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">
                      {ticket.assignedTo?.name || <span className="text-gray-300">Unassigned</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Page {filters.page} of {pagination.pages} ({pagination.total} tickets)
            </p>
            <div className="flex gap-1">
              <button onClick={() => setPage(Math.max(1, filters.page - 1))} disabled={filters.page === 1}
                className="p-1.5 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors">
                <ChevronLeft size={14} />
              </button>
              <button onClick={() => setPage(Math.min(pagination.pages, filters.page + 1))}
                disabled={filters.page === pagination.pages}
                className="p-1.5 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketList;
