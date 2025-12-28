import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1: Email, 2: Code & New Password
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSendCode = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    try {
      await axios.post('/auth/forgotpassword', { email });
      setStep(2);
      setMessage('Code sent! Check your inbox.');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to send code');
    } finally {
        setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
      e.preventDefault();
      setError('');
      setMessage('');

      if (password !== confirmPassword) {
          setError("Passwords do not match");
          return;
      }
      setLoading(true);

      try {
          await axios.post('/auth/resetpassword', { email, code, password });
          setMessage('Password reset successful! Redirecting...');
          setTimeout(() => navigate('/login'), 2000);
      } catch (error) {
          setError(error.response?.data?.message || 'Failed to reset password');
      } finally {
          setLoading(false);
      }
  };

  return (
    <div className="max-w-md mx-auto mt-10 bg-white p-8 rounded-lg shadow-sm">
      <h2 className="text-2xl font-serif mb-6 text-center">
          {step === 1 ? 'Forgot Password' : 'Reset Password'}
      </h2>

      {message && <div className="bg-green-100 text-green-700 p-3 rounded mb-4 text-sm">{message}</div>}
      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>}

      {step === 1 ? (
          <form onSubmit={handleSendCode} className="space-y-4">
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
              disabled={loading}
              className="w-full bg-soft-dark text-white py-2 rounded-md hover:bg-gray-800 transition disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Reset Code'}
            </button>
          </form>
      ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="bg-gray-50 p-3 rounded text-sm text-gray-600 mb-4">
                  Code sent to: <span className="font-semibold">{email}</span>
                  <button type="button" onClick={() => setStep(1)} className="ml-2 text-sage hover:underline text-xs">Change</button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Verification Code</label>
                <input
                  type="text"
                  required
                  placeholder="Enter 6-digit code"
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-sage tracking-widest text-center"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-sage"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-sage"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-soft-dark text-white py-2 rounded-md hover:bg-gray-800 transition disabled:opacity-50"
              >
                {loading ? 'Reseting...' : 'Reset Password'}
              </button>
          </form>
      )}

      <div className="mt-4 text-center">
        <Link to="/login" className="text-sm text-sage hover:underline">Back to Login</Link>
      </div>
    </div>
  );
};

export default ForgotPassword;
