import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await login(email, password);
    if (res.success) {
      navigate('/feed');
    } else {
      setError(res.message);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto mt-10 bg-surface p-8 rounded-lg shadow-sm border border-soft-border">
      <h2 className="text-3xl font-serif mb-6 text-center text-text">Welcome Back</h2>
      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-secondary mb-1">Email</label>
          <input
            type="email"
            required
            className="w-full px-4 py-2 border border-soft-border rounded-md focus:outline-none focus:ring-1 focus:ring-sage bg-background text-text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="relative">
          <label className="block text-sm font-medium text-secondary mb-1">Password</label>
          <input
            type={showPassword ? "text" : "password"}
            required
            className="w-full px-4 py-2 border border-soft-border rounded-md focus:outline-none focus:ring-1 focus:ring-sage bg-background text-text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-8 text-secondary hover:text-text"
          >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-accent text-white py-2 rounded-md hover:opacity-90 transition disabled:opacity-50"
        >
          {loading ? 'Logging in...' : 'Log In'}
        </button>
      </form>
      <div className="mt-4 flex flex-col items-center space-y-2 text-sm">
        <Link to="/forgot-password" className="text-secondary hover:text-text">Forgot Password?</Link>
        <p className="text-secondary">
          Don't have an account? <Link to="/register" className="text-sage hover:underline">Register</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
