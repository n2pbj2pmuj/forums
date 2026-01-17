
import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AppStateProvider, useAppState } from './AppStateContext';
import { supabase } from './services/supabaseClient';
import HomePage from './pages/Home';
import ModerationPanel from './pages/Moderation';
import ChatPage from './pages/Chat';
import BannedPage from './pages/Banned';
import ThreadDetailPage from './pages/ThreadDetail';
import ProfilePage from './pages/Profile';
import SettingsPage from './pages/Settings';
import MembersPage from './pages/Members';
import LoginPage from './pages/Login';
import SignupPage from './pages/Signup';
import ForgotPasswordPage from './pages/ForgotPassword';
import UpdatePasswordPage from './pages/UpdatePassword';

const GlobalAuthHandler: React.FC = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        navigate('/update-password');
      }
    });
    return () => authListener.subscription.unsubscribe();
  }, [navigate]);

  return null;
};

const ProtectedRoutes: React.FC = () => {
  const { currentUser, isAuthenticated, loading } = useAppState();
  const location = useLocation();

  if (loading) {
    return <div className="min-h-screen bg-rojo-950 flex items-center justify-center text-rojo-500 font-black text-xl animate-pulse uppercase tracking-[0.5em]">Syncing...</div>;
  }

  // Exempt routes that should be accessible without auth (like password reset)
  const isExempt = location.pathname === '/signup' || location.pathname === '/forgot-password';

  if (!isAuthenticated && !isExempt) {
    return <LoginPage />;
  }

  if (currentUser?.status === 'Banned' && location.pathname !== '/banned') {
    return <Navigate to="/banned" />;
  }

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/admin" element={<ModerationPanel />} />
      <Route path="/messages" element={<ChatPage />} />
      <Route path="/thread/:id" element={<ThreadDetailPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/profile/:id" element={<ProfilePage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/members" element={<MembersPage />} />
      <Route path="/banned" element={<BannedPage />} />
      <Route path="/update-password" element={<UpdatePasswordPage />} />
      <Route path="*" element={<HomePage />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AppStateProvider>
      <Router>
        <GlobalAuthHandler />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="*" element={<ProtectedRoutes />} />
        </Routes>
      </Router>
    </AppStateProvider>
  );
};

export default App;
