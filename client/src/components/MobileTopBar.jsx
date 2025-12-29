import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MobileTopBar = () => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
      if (e.key === 'Enter') {
          navigate(`/search?q=${query}`);
      }
  };

  return (
    <div className="md:hidden fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-slate-200 z-40 px-4 py-3 flex items-center justify-between h-16">
        {/* Logo Icon */}
        <div className="flex-shrink-0 mr-4">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-serif font-bold text-lg shadow-sm">C</div>
        </div>

        {/* Search Bar */}
        <div className="flex-1 relative">
            <Search className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
            <input
                className="w-full bg-slate-100 border-none rounded-full py-2 pl-9 pr-4 text-sm focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all outline-none"
                placeholder="Search..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleSearch}
            />
        </div>
    </div>
  );
};

export default MobileTopBar;
