import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [realName, setRealName] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const { register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
    }

    const res = await register(email, password, realName);
    if (res.success) {
      setMessage(res.message);
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 bg-white p-8 rounded-lg shadow-sm">
      <h2 className="text-3xl font-serif mb-2 text-center">Join Safe Space</h2>
      <p className="text-center text-gray-500 mb-6 text-sm">Create an account to start your journey.</p>

      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>}
      {message && <div className="bg-green-100 text-green-700 p-3 rounded mb-4 text-sm">{message}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Real Name (Private)</label>
          <input
            type="text"
            required
            placeholder="John Doe"
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-sage"
            value={realName}
            onChange={(e) => setRealName(e.target.value)}
          />
          <p className="text-xs text-gray-400 mt-1">This won't be shown publicly unless you choose to.</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            required
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-sage"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            type="password"
            required
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-sage"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button
          type="submit"
          className="w-full bg-sage text-white py-2 rounded-md hover:bg-green-700 transition"
        >
          Create Account
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-500">
        Already have an account? <Link to="/login" className="text-sage hover:underline">Log In</Link>
      </p>
    </div>
  );
};

export default Register;
