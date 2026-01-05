import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Compass } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6">
      {/* Abstract Graphic */}
      <div className="relative mb-8">
        <div className="w-32 h-32 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center relative overflow-hidden">
            <div className="absolute w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent animate-pulse" />
            <span className="text-4xl filter grayscale opacity-50">🌑</span>
        </div>
        <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-surface border border-soft-border rounded-full flex items-center justify-center shadow-lg">
            <span className="text-lg">404</span>
        </div>
      </div>

      <h1 className="text-3xl md:text-4xl font-serif font-bold text-text mb-4">Lost in Space</h1>
      <p className="text-secondary max-w-md mb-8 leading-relaxed">
        The page you are looking for seems to have drifted away into the void. It might have been moved, deleted, or never existed.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
        <button
          onClick={() => navigate('/feed')}
          className="flex-1 flex items-center justify-center space-x-2 bg-slate-900 text-white py-3 px-6 rounded-xl font-bold hover:scale-105 transition-transform"
        >
          <Home size={18} />
          <span>Go Home</span>
        </button>
        <button
          onClick={() => navigate('/search')}
          className="flex-1 flex items-center justify-center space-x-2 bg-surface text-text border border-soft-border py-3 px-6 rounded-xl font-bold hover:bg-background transition"
        >
          <Compass size={18} />
          <span>Explore</span>
        </button>
      </div>
    </div>
  );
};

export default NotFound;
