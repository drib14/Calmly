import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CloudOff } from 'lucide-react';

const NotFound = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-8">
            <div className="bg-surface p-8 rounded-full border-2 border-dashed border-secondary mb-6">
                <CloudOff size={64} className="text-secondary" />
            </div>
            <h1 className="text-4xl font-serif font-bold text-text mb-4">Page Not Found</h1>
            <p className="text-secondary max-w-md mb-8">
                The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
            </p>
            <button
                onClick={() => navigate('/')}
                className="px-6 py-3 bg-primary text-white rounded-full font-bold hover:opacity-90 transition shadow-lg"
            >
                Return Home
            </button>
        </div>
    );
};

export default NotFound;
