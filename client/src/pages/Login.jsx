import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const res = await login(email, password);
    if (res.success) {
      navigate('/feed');
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 bg-white p-8 rounded-lg shadow-sm">
      <h2 className="text-3xl font-serif mb-6 text-center">Welcome Back</h2>
      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
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
          className="w-full bg-soft-dark text-white py-2 rounded-md hover:bg-gray-800 transition"
        >
          Log In
        </button>
      </form>
      <div className="mt-4 flex flex-col items-center space-y-2 text-sm">
        <Link to="/forgot-password" className="text-gray-500 hover:text-soft-dark">Forgot Password?</Link>
        <p className="text-gray-500">
          Don't have an account? <Link to="/register" className="text-sage hover:underline">Register</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
