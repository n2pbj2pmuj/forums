
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppState } from '../AppStateContext';

interface LayoutProps {
  children: React.ReactNode;
}

interface NavLinkProps {
  to: string;
  children: React.ReactNode;
  active: boolean;
}

const NavLink: React.FC<NavLinkProps> = ({ to, children, active }) => {
  const { theme } = useAppState();
  const isDark = theme === 'dark';

  return (
    <Link 
      to={to} 
      className={`text-xs font-bold uppercase tracking-widest transition-all relative py-1 ${
        active 
          ? (isDark ? 'text-rojo-500' : 'text-rojo-600') 
          : (isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-500 hover:text-slate-900')
      }`}
    >
      {children}
      {active && <span className={`absolute -bottom-1 left-0 w-full h-0.5 rounded-full ${isDark ? 'bg-rojo-500 shadow-[0_0_10px_rgba(255,0,0,1)]' : 'bg-rojo-600'}`}></span>}
    </Link>
  );
};

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, originalAdmin, revertToAdmin, theme, toggleTheme, logout, isAuthenticated } = useAppState();

  const isDark = theme === 'dark';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // If we're not authenticated and not on an auth page, we shouldn't even be here (App.tsx handles this), 
  // but we'll return null just in case of race conditions.
  if (!isAuthenticated && location.pathname !== '/login' && location.pathname !== '/signup') {
    return null;
  }

  // If currentUser is null but we ARE authenticated, we show a basic skeleton/header instead of blocking.
  const user = currentUser || { 
    displayName: 'Loading...', 
    username: '...', 
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=loading',
    role: 'User',
    postCount: 0
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${isDark ? 'bg-[#0a0202] text-slate-100' : 'bg-[#FFF8F8] text-slate-900'}`}>
      
      {originalAdmin && (
        <div className="bg-amber-500 text-black py-2 px-6 flex items-center justify-between text-[10px] font-black uppercase tracking-wider z-[60]">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            Logged in as User: {user.displayName} (@{user.username})
          </div>
          <button onClick={revertToAdmin} className="bg-black text-white px-3 py-1 rounded-lg hover:bg-slate-800 transition shadow-lg">Back to Admin Account</button>
        </div>
      )}

      <header className={`h-16 border-b sticky top-0 z-50 flex items-center justify-between px-6 backdrop-blur-md transition-all ${isDark ? 'bg-black/90 border-rojo-900/50 shadow-[0_0_20px_rgba(255,0,0,0.1)]' : 'bg-white/90 border-rojo-100'}`}>
        <div className="flex items-center space-x-12">
          <Link to="/" className={`text-2xl font-black tracking-tight ${isDark ? 'text-rojo-500' : 'text-rojo-600'}`}>
            ROJO<span className={isDark ? 'text-white' : 'text-slate-900'}>GAMES</span>
          </Link>
          <nav className="hidden md:flex space-x-8">
            <NavLink to="/" active={location.pathname === '/'}>Forums</NavLink>
            <NavLink to="/members" active={location.pathname === '/members'}>Members</NavLink>
            <NavLink to="/messages" active={location.pathname === '/messages'}>Chat</NavLink>
          </nav>
        </div>

        <div className="flex items-center space-x-6">
          <button 
            onClick={toggleTheme}
            className={`p-2 rounded-lg transition-all ${isDark ? 'text-slate-400 hover:text-rojo-400 hover:bg-rojo-900/20' : 'text-slate-400 hover:text-rojo-600 hover:bg-rojo-50'}`}
          >
            {isDark ? <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" /></svg> : <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" /></svg>}
          </button>
          
          {(user.role === 'Admin' || user.role === 'Moderator') && (
            <Link to="/admin" className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${isDark ? 'bg-rojo-600 text-white' : 'bg-rojo-700 text-white'}`}>Moderation</Link>
          )}

          <div className="flex items-center space-x-3">
            <Link to="/profile">
              <img src={user.avatarUrl} className={`w-9 h-9 rounded-lg border transition-all ${isDark ? 'border-rojo-900' : 'border-slate-100'}`} alt="My Profile" />
            </Link>
            <button 
              onClick={handleLogout}
              className={`p-2 rounded-lg text-slate-500 hover:text-rojo-500 transition-colors ${isDark ? 'hover:bg-rojo-900/10' : 'hover:bg-rojo-50'}`}
              title="Logout"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 flex flex-col lg:flex-row gap-8">
        <main className="flex-1 min-w-0">
          {children}
        </main>

        <aside className="hidden lg:block w-64 space-y-6">
          <div className={`border rounded-2xl p-6 shadow-xl transition-all ${isDark ? 'bg-[#0e0303] border-rojo-900/40' : 'bg-white border-rojo-100'}`}>
            <h3 className={`text-xs font-bold uppercase tracking-widest mb-4 ${isDark ? 'text-rojo-500' : 'text-rojo-600'}`}>My Account</h3>
            <div className="flex items-center space-x-3 mb-6">
               <img src={user.avatarUrl} className="w-12 h-12 rounded-lg border border-rojo-900/20" alt="" />
               <div className="min-w-0">
                 <p className="font-bold truncate">{user.displayName}</p>
                 <p className="text-[10px] text-slate-500 uppercase">@{user.username}</p>
               </div>
            </div>
            <div className="grid grid-cols-2 gap-2 border-t border-rojo-900/10 pt-4">
              <div>
                <p className="text-xl font-bold">{user.postCount}</p>
                <p className="text-[10px] text-slate-500 uppercase">Posts</p>
              </div>
              <div>
                <p className="text-xl font-bold">{user.role}</p>
                <p className="text-[10px] text-slate-500 uppercase">Level</p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Layout;
