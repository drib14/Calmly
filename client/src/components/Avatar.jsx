import React from 'react';
import { User, Glasses } from 'lucide-react';

const COLORS = [
  'bg-red-500', 'bg-orange-500', 'bg-amber-500',
  'bg-green-500', 'bg-emerald-500', 'bg-teal-500',
  'bg-cyan-500', 'bg-sky-500', 'bg-blue-500',
  'bg-indigo-500', 'bg-violet-500', 'bg-purple-500',
  'bg-fuchsia-500', 'bg-pink-500', 'bg-rose-500'
];

const Avatar = ({ identity, size = "md" }) => {
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-16 h-16 text-lg",
    xl: "w-24 h-24 text-2xl"
  };

  if (!identity) return <div className={`${sizeClasses[size]} rounded-full bg-slate-200`}></div>;

  // 1. Real Identity: Initials or Custom Avatar
  if (identity.type === 'real') {
      if (identity.avatar) {
          return <img src={identity.avatar} className={`${sizeClasses[size]} rounded-full object-cover shadow-sm border border-soft-border`} />;
      }
      // Initials
      const initials = identity.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
      return (
          <div className={`${sizeClasses[size]} rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 flex items-center justify-center font-serif font-bold shadow-sm border border-transparent`}>
              {initials}
          </div>
      );
  }

  // 2. Pseudonym: User Icon (Unified Color usually, or gray)
  if (identity.type === 'pseudonym') {
      if (identity.avatar) {
          return <img src={identity.avatar} className={`${sizeClasses[size]} rounded-full object-cover shadow-sm border border-soft-border`} />;
      }
      return (
          <div className={`${sizeClasses[size]} rounded-full bg-surface text-secondary flex items-center justify-center border border-soft-border shadow-inner`}>
              <User size={size === 'sm' ? 14 : size === 'lg' ? 24 : 20} />
          </div>
      );
  }

  // 3. Anonymous: Incognito Hat + Deterministic Color
  if (identity.type === 'anonymous') {
      // Simple hash for color selection
      const hash = identity._id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const colorClass = COLORS[hash % COLORS.length];

      return (
          <div className={`${sizeClasses[size]} rounded-full ${colorClass} text-white flex items-center justify-center shadow-md`}>
              <Glasses size={size === 'sm' ? 14 : size === 'lg' ? 24 : 20} />
          </div>
      );
  }

  return null;
};

export default Avatar;
