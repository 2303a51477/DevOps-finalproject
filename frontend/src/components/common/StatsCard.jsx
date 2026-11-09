import React from 'react';

export const StatsCard = ({ title, value, icon: Icon, change, changeType = 'positive', subtitle, color = 'sky' }) => {
  const colorMap = {
    sky: 'bg-sky-50 text-sky-600 border-sky-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  };

  const iconStyle = colorMap[color] || colorMap.sky;

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1 tracking-tight">{value}</h3>
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl border ${iconStyle}`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
      {(change || subtitle) && (
        <div className="mt-3 flex items-center text-xs text-slate-500">
          {change && (
            <span className={`font-semibold mr-1.5 ${changeType === 'positive' ? 'text-emerald-600' : 'text-rose-600'}`}>
              {change}
            </span>
          )}
          <span>{subtitle}</span>
        </div>
      )}
    </div>
  );
};

export default StatsCard;
