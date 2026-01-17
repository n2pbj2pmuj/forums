
import React, { useEffect, useState } from 'react';
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
      if (event === 'PASSWORD_RECOVERY') navigate('/update-password');
    });
    return () => authListener.subscription.unsubscribe();
  }, [navigate]);
  return null;
};

const ProtectedRoutes: React.FC = () => {
  const { currentUser, isAuthenticated, loading } = useAppState();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
        <div className="text-rojo-500 font-black text-2xl animate-pulse uppercase tracking-[0.2em] mb-4">Syncing Forums...</div>
        <div className="w-48 h-1 bg-rojo-900/30 rounded-full overflow-hidden">
          <div className="w-1/2 h-full bg-rojo-500 animate-[loading_2s_infinite]"></div>
        </div>
        <style>{`
          @keyframes loading {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(200%); }
          }
        `}</style>
      </div>
    );
  }

  const isExempt = ['/login', '/signup', '/forgot-password', '/update-password'].includes(location.pathname);
  
  if (!isAuthenticated && !isExempt) {
    return <Navigate to="/login" replace />;
  }

  if (currentUser?.status === 'Banned' && location.pathname !== '/banned') {
    return <Navigate to="/banned" replace />;
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
      <Route path="*" element={<Navigate to="/" replace />} />
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
