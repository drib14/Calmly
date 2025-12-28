import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PenTool, LogOut, User, PlusCircle } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-sm py-4">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link to={user ? "/feed" : "/"} className="text-2xl font-serif font-semibold text-soft-dark hover:text-muted-gold transition">
          Safe Space
        </Link>

        <div className="flex items-center space-x-6">
          {user ? (
            <>
              <Link to="/feed" className="hover:text-muted-gold transition">Feed</Link>
              <Link to="/messages" className="hover:text-muted-gold transition">Inbox</Link>
              <Link to="/journal" className="hover:text-muted-gold transition">Journal</Link>
              <Link to="/create" className="flex items-center space-x-1 text-sage hover:text-green-700 transition">
                <PenTool size={18} />
                <span>Write</span>
              </Link>
              <button onClick={handleLogout} className="flex items-center space-x-1 hover:text-red-500 transition">
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-muted-gold transition">Login</Link>
              <Link to="/register" className="px-4 py-2 bg-soft-dark text-white rounded-md hover:bg-gray-700 transition">
                Join
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
