
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppStateProvider, useAppState } from './AppStateContext';
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

const ProtectedRoutes: React.FC = () => {
  const { currentUser, isAuthenticated } = useAppState();
  const location = useLocation();

  if (!isAuthenticated) {
    if (location.pathname === '/signup') return <SignupPage />;
    return <LoginPage />;
  }

  if (currentUser.status === 'Banned') {
    return (
      <Routes>
        <Route path="/banned" element={<BannedPage />} />
        <Route path="*" element={<Navigate to="/banned" />} />
      </Routes>
    );
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
      
      {/* Release cleanup: Remove Games/Catalog legacy routes */}
      <Route path="*" element={<HomePage />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AppStateProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="*" element={<ProtectedRoutes />} />
        </Routes>
      </Router>
    </AppStateProvider>
  );
};

export default App;
