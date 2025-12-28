import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

const VerifyEmail = () => {
  const { token } = useParams();
  const [status, setStatus] = useState('verifying'); // verifying, success, error

  useEffect(() => {
    const verify = async () => {
      try {
        await axios.get(`/auth/verify/${token}`);
        setStatus('success');
      } catch (error) {
        setStatus('error');
      }
    };
    verify();
  }, [token]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh]">
      {status === 'verifying' && <p className="text-xl">Verifying your email...</p>}
      {status === 'success' && (
        <div className="text-center">
          <h2 className="text-2xl font-serif text-green-700 mb-4">Email Verified!</h2>
          <p className="mb-6">You can now access your account.</p>
          <Link to="/login" className="px-6 py-2 bg-soft-dark text-white rounded-md">Log In</Link>
        </div>
      )}
      {status === 'error' && (
        <div className="text-center">
          <h2 className="text-2xl font-serif text-red-700 mb-4">Verification Failed</h2>
          <p className="mb-6">The link may be invalid or expired.</p>
          <Link to="/" className="text-sage hover:underline">Go Home</Link>
        </div>
      )}
    </div>
  );
};

export default VerifyEmail;
