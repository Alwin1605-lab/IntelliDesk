import React, { createContext, useContext, useState, useCallback } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const TicketContext = createContext(null);

export const TicketProvider = ({ children }) => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 0 });

  const fetchTickets = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const { data } = await api.get('/tickets', { params });
      setTickets(data.data);
      setPagination({ page: params.page || 1, total: data.total, pages: data.pages });
    } catch (err) {
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  }, []);

  const createTicket = useCallback(async (ticketData) => {
    const { data } = await api.post('/tickets', ticketData);
    setTickets((prev) => [data.data, ...prev]);
    toast.success(`Ticket ${data.data.ticketId} created successfully!`);
    return data.data;
  }, []);

  const updateTicket = useCallback(async (id, updates) => {
    const { data } = await api.put(`/tickets/${id}`, updates);
    setTickets((prev) => prev.map((t) => (t._id === id ? data.data : t)));
    toast.success('Ticket updated');
    return data.data;
  }, []);

  const deleteTicket = useCallback(async (id) => {
    await api.delete(`/tickets/${id}`);
    setTickets((prev) => prev.filter((t) => t._id !== id));
    toast.success('Ticket deleted');
  }, []);

  const classifyTicket = useCallback(async (title, description) => {
    const { data } = await api.post('/tickets/classify', { title, description });
    return data.data;
  }, []);

  return (
    <TicketContext.Provider value={{
      tickets, loading, pagination,
      fetchTickets, createTicket, updateTicket, deleteTicket, classifyTicket
    }}>
      {children}
    </TicketContext.Provider>
  );
};

export const useTickets = () => {
  const ctx = useContext(TicketContext);
  if (!ctx) throw new Error('useTickets must be used within TicketProvider');
  return ctx;
};
