import React from 'react';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MobileTopBar = () => {
  const navigate = useNavigate();

  return (
    <div className="md:hidden fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-slate-200 z-40 px-4 py-3 flex items-center justify-between h-16">
        {/* Logo Icon */}
        <div className="flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-serif font-bold text-lg shadow-sm">C</div>
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
