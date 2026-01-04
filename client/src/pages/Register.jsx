import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [realName, setRealName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        setLoading(false);
        return;
    }

    const res = await register(email, password, realName);
    if (res.success) {
      navigate('/feed');
    } else {
      setError(res.message);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto mt-10 bg-surface p-8 rounded-lg shadow-sm border border-soft-border">
      <h2 className="text-3xl font-serif mb-2 text-center text-text">Join Calmly</h2>
      <p className="text-center text-secondary mb-6 text-sm">Create an account to start your journey.</p>

      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>}
      {message && <div className="bg-green-100 text-green-700 p-3 rounded mb-4 text-sm">{message}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-secondary mb-1">Real Name (Private)</label>
          <input
            type="text"
            required
            placeholder="John Doe"
            className="w-full px-4 py-2 border border-soft-border rounded-md focus:outline-none focus:ring-1 focus:ring-sage bg-background text-text"
            value={realName}
            onChange={(e) => setRealName(e.target.value)}
          />
          <p className="text-xs text-secondary mt-1">This won't be shown publicly unless you choose to.</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-secondary mb-1">Email</label>
          <input
            type="email"
            required
            className="w-full px-4 py-2 border border-soft-border rounded-md focus:outline-none focus:ring-1 focus:ring-sage bg-background text-text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <p className="text-xs text-secondary mt-1">Please use a real email address for account recovery.</p>
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
        <div className="flex items-start space-x-2 text-sm text-secondary">
            <input type="checkbox" required className="mt-1" />
            <span>I agree to the <Link to="/legal" className="text-text hover:underline">Terms of Service</Link> and <Link to="/legal" className="text-text hover:underline">Privacy Policy</Link>.</span>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-accent text-white py-2 rounded-md hover:opacity-90 transition disabled:opacity-50"
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-secondary">
        Already have an account? <Link to="/login" className="text-sage hover:underline">Log In</Link>
      </p>
    </div>
  );
};

export default Register;
