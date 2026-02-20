import React from 'react';

const StatsCard = ({ title, value, subtitle, icon: Icon, color = 'blue', trend }) => {
  const colors = {
    blue:   { bg: 'bg-blue-50',   icon: 'bg-blue-100 text-blue-600',   text: 'text-blue-600' },
    red:    { bg: 'bg-red-50',    icon: 'bg-red-100 text-red-600',     text: 'text-red-600' },
    green:  { bg: 'bg-green-50',  icon: 'bg-green-100 text-green-600', text: 'text-green-600' },
    orange: { bg: 'bg-orange-50', icon: 'bg-orange-100 text-orange-600', text: 'text-orange-600' },
    purple: { bg: 'bg-purple-50', icon: 'bg-purple-100 text-purple-600', text: 'text-purple-600' }
  };
  const c = colors[color] || colors.blue;

  return (
    <div className={`card hover:shadow-md transition-shadow fade-in`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-800">{value ?? '—'}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
          {trend !== undefined && (
            <p className={`text-xs mt-1 font-medium ${trend >= 0 ? 'text-red-500' : 'text-green-500'}`}>
              {trend >= 0 ? `▲ ${trend}` : `▼ ${Math.abs(trend)}`} from last period
            </p>
          )}
        </div>
        {Icon && (
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${c.icon}`}>
            <Icon size={22} />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsCard;
