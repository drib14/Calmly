import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { IdentityProvider } from './context/IdentityContext';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Feed from './pages/Feed';
import CreatePost from './pages/CreatePost';
import VerifyEmail from './pages/VerifyEmail';
import Journal from './pages/Journal';
import Messages from './pages/Messages';
import ForgotPassword from './pages/ForgotPassword';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return children;
};

function App() {
  return (
    <AuthProvider>
      <IdentityProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <div className="min-h-screen bg-soft-light text-soft-dark font-sans">
            <Navbar />
            <div className="container mx-auto px-4 py-8">
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/verify-email/:token" element={<VerifyEmail />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />

                <Route path="/feed" element={
                  <ProtectedRoute>
                    <Feed />
                  </ProtectedRoute>
                } />

                <Route path="/journal" element={
                  <ProtectedRoute>
                    <Journal />
                  </ProtectedRoute>
                } />

                <Route path="/messages" element={
                  <ProtectedRoute>
                    <Messages />
                  </ProtectedRoute>
                } />

                <Route path="/create" element={
                  <ProtectedRoute>
                    <CreatePost />
                  </ProtectedRoute>
                } />
              </Routes>
            </div>
          </div>
        </Router>
      </IdentityProvider>
    </AuthProvider>
  );
}

export default App;
