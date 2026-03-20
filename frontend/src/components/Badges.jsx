import React from 'react';

const PRIORITY_CONFIG = {
  critical: { label: 'Critical', class: 'bg-red-100 text-red-700 border border-red-200' },
  high:     { label: 'High',     class: 'bg-orange-100 text-orange-700 border border-orange-200' },
  medium:   { label: 'Medium',   class: 'bg-yellow-100 text-yellow-700 border border-yellow-200' },
  low:      { label: 'Low',      class: 'bg-green-100 text-green-700 border border-green-200' }
};

const STATUS_CONFIG = {
  open:        { label: 'Open',        class: 'bg-blue-100 text-blue-700' },
  'in-progress': { label: 'In Progress', class: 'bg-purple-100 text-purple-700' },
  pending:     { label: 'Pending',     class: 'bg-yellow-100 text-yellow-700' },
  resolved:    { label: 'Resolved',    class: 'bg-green-100 text-green-700' },
  closed:      { label: 'Closed',      class: 'bg-gray-100 text-gray-600' },
  reopened:    { label: 'Reopened',    class: 'bg-red-100 text-red-700' }
};

const CATEGORY_CONFIG = {
  network:        { label: 'Network',        icon: '🌐' },
  software:       { label: 'Software',       icon: '💻' },
  hardware:       { label: 'Hardware',       icon: '🖥️' },
  authentication: { label: 'Authentication', icon: '🔐' },
  email:          { label: 'Email',          icon: '📧' },
  database:       { label: 'Database',       icon: '🗄️' },
  security:       { label: 'Security',       icon: '🔒' },
  hr:             { label: 'Human Resources', icon: '👥' },
  other:          { label: 'Other',          icon: '📋' }
};

export const PriorityBadge = ({ priority }) => {
  const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium;
  return (
    <span className={`badge text-xs font-semibold ${config.class}`}>
      {config.label}
    </span>
  );
};

export const StatusBadge = ({ status }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.open;
  return (
    <span className={`badge text-xs font-medium ${config.class}`}>
      {config.label}
    </span>
  );
};

export const CategoryBadge = ({ category }) => {
  const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.other;
  return (
    <span className="badge bg-gray-100 text-gray-700 text-xs font-medium gap-1">
      <span>{config.icon}</span>
      {config.label}
    </span>
  );
};

const SOURCE_CONFIG = {
  email:   { label: 'Email',   icon: '📧', class: 'bg-blue-50 text-blue-700 border-blue-200' },
  web:     { label: 'Web',     icon: '🌐', class: 'bg-gray-100 text-gray-700 border-gray-200' },
  chatbot: { label: 'Chatbot', icon: '🤖', class: 'bg-purple-50 text-purple-700 border-purple-200' },
  mobile:  { label: 'Mobile',  icon: '📱', class: 'bg-green-50 text-green-700 border-green-200' },
  api:     { label: 'API',     icon: '⚡', class: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
};

export const SourceBadge = ({ source }) => {
  const config = SOURCE_CONFIG[source] || SOURCE_CONFIG.web;
  return (
    <span className={`badge text-xs font-medium border ${config.class} gap-1`}>
      <span>{config.icon}</span>
      {config.label}
    </span>
  );
};

export { PRIORITY_CONFIG, STATUS_CONFIG, CATEGORY_CONFIG, SOURCE_CONFIG };
