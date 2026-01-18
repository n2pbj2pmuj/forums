
import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'https://esm.sh/react-router-dom';
import { AppStateProvider, useAppState } from './AppStateContext.tsx';
import { supabase } from './services/supabaseClient.ts';
import HomePage from './pages/Home.tsx';
import ModerationPanel from './pages/Moderation.tsx';
import ChatPage from './pages/Chat.tsx';
import BannedPage from './pages/Banned.tsx';
import ThreadDetailPage from './pages/ThreadDetail.tsx';
import Profile from './pages/Profile.tsx';
import LoginPage from './pages/Login.tsx';
import SignupPage from './pages/Signup.tsx';
import ForgotPasswordPage from './pages/ForgotPassword.tsx';
import UpdatePasswordPage from './pages/UpdatePassword.tsx';
import MembersPage from './pages/Members.tsx';

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
  const { currentUser, isAuthenticated, loading, isIpBanned } = useAppState();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
        <div className="text-rojo-50 font-black text-2xl animate-pulse uppercase tracking-[0.2em] mb-4">Loading RojoGames...</div>
        <div className="w-48 h-1 bg-rojo-900/30 rounded-full overflow-hidden">
          <div className="w-1/2 h-full bg-rojo-500 animate-[loading_2s_infinite]"></div>
        </div>
      </div>
    );
  }

  if (isIpBanned && location.pathname !== '/banned') return <Navigate to="/banned" replace />;

  const isExempt = ['/login', '/signup', '/forgot-password', '/update-password'].includes(location.pathname);
  if (!isAuthenticated && !isExempt) return <Navigate to="/login" replace />;

  if (currentUser?.status === 'Banned' && location.pathname !== '/banned') return <Navigate to="/banned" replace />;

  const isStaff = currentUser?.role === 'Admin' || currentUser?.role === 'Moderator';
  if (location.pathname === '/admin' && !isStaff) return <Navigate to="/" replace />;

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/admin" element={<ModerationPanel />} />
      <Route path="/messages" element={<ChatPage />} />
      <Route path="/thread/:id" element={<ThreadDetailPage />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/profile/:id" element={<Profile />} />
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
