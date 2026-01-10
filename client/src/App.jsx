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
import VerifyEmail from './pages/VerifyEmail';
import Journal from './pages/Journal';
import Messages from './pages/Messages';
import ForgotPassword from './pages/ForgotPassword';
import SearchPage from './pages/SearchPage';
import Profile from './pages/Profile';
import About from './pages/About';
import Legal from './pages/Legal';
import Settings from './pages/Settings';
import SinglePost from './pages/SinglePost';
import NotFound from './pages/NotFound';
import LearnMore from './pages/LearnMore';

// Admin Pages
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import ReportManagement from './pages/admin/ReportManagement';
import SupportInbox from './pages/admin/SupportInbox';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Loader />;
  if (!user) return <Navigate to="/login" />;
  return children;
};

const AdminRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return <Loader />;
    if (!user || user.role !== 'admin') return <Navigate to="/feed" />;
    return children;
};

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <IdentityProvider>
          <SocketProvider>
            <Toaster position="top-center" toastOptions={{ duration: 3000, style: { background: '#1e293b', color: '#fff' } }} />
            <Routes>
                {/* Admin Routes - Outside standard Layout for full control */}
                <Route path="/admin" element={
                    <AdminRoute>
                        <AdminLayout />
                    </AdminRoute>
                }>
                    <Route index element={<AdminDashboard />} />
                    <Route path="users" element={<UserManagement />} />
                    <Route path="reports" element={<ReportManagement />} />
                    <Route path="support" element={<SupportInbox />} />
                </Route>

                {/* Main App Routes */}
                <Route path="*" element={
                    <Layout>
                      <Routes>
                        <Route path="/" element={<Landing />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/verify-email/:token" element={<VerifyEmail />} />
                        <Route path="/forgot-password" element={<ForgotPassword />} />
                        <Route path="/about" element={<About />} />
                        <Route path="/legal" element={<Legal />} />
                        <Route path="/learn-more" element={<LearnMore />} />

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

                        <Route path="/post/:id" element={
                          <ProtectedRoute>
                            <SinglePost />
                          </ProtectedRoute>
                        } />

                        {/* Catch-all 404 */}
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Layout>
                } />
            </Routes>
          </SocketProvider>
        </IdentityProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
