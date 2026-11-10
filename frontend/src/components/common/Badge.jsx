import React from 'react';

export const Badge = ({ status, text, size = 'md' }) => {
  const norm = (status || text || '').toLowerCase();
  
  let styles = 'bg-slate-100 text-slate-700 border-slate-200';
  
  if (['valid', 'approved', 'completed', 'active', 'passed', 'verified'].includes(norm)) {
    styles = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (['revoked', 'rejected', 'failed', 'inactive'].includes(norm)) {
    styles = 'bg-rose-50 text-rose-700 border-rose-200';
  } else if (['pending', 'in_progress', 'review'].includes(norm)) {
    styles = 'bg-amber-50 text-amber-700 border-amber-200';
  } else if (['admin'].includes(norm)) {
    styles = 'bg-purple-50 text-purple-700 border-purple-200';
  } else if (['provider'].includes(norm)) {
    styles = 'bg-blue-50 text-blue-700 border-blue-200';
  } else if (['learner'].includes(norm)) {
    styles = 'bg-cyan-50 text-cyan-700 border-cyan-200';
  } else if (['verifier'].includes(norm)) {
    styles = 'bg-indigo-50 text-indigo-700 border-indigo-200';
  }

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-semibold';

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border capitalize ${styles} ${sizeClasses}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70"></span>
      {text || status}
    </span>
  );
};

export default Badge;

