import React from 'react';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MobileTopBar = () => {
  const navigate = useNavigate();

  return (
    <div className="md:hidden fixed top-0 left-0 right-0 bg-surface/80 backdrop-blur-md border-b border-soft-border z-40 px-4 py-3 flex items-center justify-between h-16">
        {/* Logo Icon & Text */}
        <div className="flex items-center gap-2 flex-shrink-0" onClick={() => navigate('/feed')}>
            <div className="w-8 h-8 rounded-lg bg-surface border border-soft-border text-text flex items-center justify-center font-serif font-bold text-lg shadow-sm overflow-hidden">
                <img src="/favicon.ico" alt="Calmly" className="w-6 h-6 object-contain" />
            </div>
            <span className="font-serif font-bold text-xl text-text tracking-tight">Calmly</span>
        </div>

        {/* Search Icon Button */}
        <button
            onClick={() => navigate('/search')}
            className="p-2 bg-slate-50 text-slate-500 rounded-full hover:bg-slate-100 transition active:scale-95"
        >
            <Search size={20} />
        </button>
    </div>
  );
};

export default MobileTopBar;
