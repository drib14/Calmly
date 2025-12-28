import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      await axios.post('/auth/forgotpassword', { email });
      setMessage('Email sent! Check your inbox for reset instructions.');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to send email');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 bg-white p-8 rounded-lg shadow-sm">
      <h2 className="text-2xl font-serif mb-6 text-center">Forgot Password</h2>
      {message && <div className="bg-green-100 text-green-700 p-3 rounded mb-4 text-sm">{message}</div>}
      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
          <input
            type="email"
            required
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-sage"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <button
          type="submit"
          className="w-full bg-soft-dark text-white py-2 rounded-md hover:bg-gray-800 transition"
        >
          Send Reset Link
        </button>
      </form>
      <div className="mt-4 text-center">
        <Link to="/login" className="text-sm text-sage hover:underline">Back to Login</Link>
      </div>
    </div>
  );
};

export default ForgotPassword;
