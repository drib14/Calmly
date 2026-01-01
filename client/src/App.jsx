import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { IdentityProvider } from './context/IdentityContext';
import { SocketProvider } from './context/SocketContext';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Loader from './components/Loader';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Feed from './pages/Feed';
import CreatePost from './pages/CreatePost';
import Journal from './pages/Journal';
import Messages from './pages/Messages';
import ForgotPassword from './pages/ForgotPassword';
import SearchPage from './pages/SearchPage';
import Profile from './pages/Profile';
import About from './pages/About';
import Legal from './pages/Legal';
import Settings from './pages/Settings';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Loader />;
  if (!user) return <Navigate to="/login" />;
  return children;
};

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <IdentityProvider>
          <SocketProvider>
            <Toaster position="top-center" toastOptions={{ duration: 3000, style: { background: '#1e293b', color: '#fff' } }} />
            <Layout>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/about" element={<About />} />
                <Route path="/legal" element={<Legal />} />

                <Route path="/feed" element={
                  <ProtectedRoute>
                    <Feed />
                  </ProtectedRoute>
                } />

                <Route path="/search" element={
                  <ProtectedRoute>
                    <SearchPage />
                  </ProtectedRoute>
                } />

                <Route path="/journal" element={
                  <ProtectedRoute>
                    <Journal />
                  </ProtectedRoute>
                } />

                <Route path="/chat" element={
                  <ProtectedRoute>
                    <Messages />
                  </ProtectedRoute>
                } />

                <Route path="/profile/:handle" element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } />

                <Route path="/settings" element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                } />

                <Route path="/create" element={
                  <ProtectedRoute>
                    <CreatePost />
                  </ProtectedRoute>
                } />
              </Routes>
            </Layout>
          </SocketProvider>
        </IdentityProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
