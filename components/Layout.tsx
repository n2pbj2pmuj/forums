
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppState } from '../AppStateContext';

const OFFICIAL_LOGO = 'https://cdn.discordapp.com/attachments/857780833967276052/1462268781035257876/8vNx0KgNUIAAAAXV5kBICzjE2Ar5tOA8BqBAAAgCL7afqZ5F3G5QDfkrzfdCAAVnPneDxuPQMAAACwMBsAAAAAUEAAAAAAgAICAAAAABQQAAAAAKCAAAAAAAAFBAAAAAAoIAAAAABAAQEAAAAACggAAAAAUEAAAAAAgAICAAAAABQQAAAAAKCAAAAAAAAFBAAAAAAoIAAAAABAAQEAAAAACvwB3GyoTaCTr1QAAAAASUVORK5CYII.png?ex=696d936d&is=696c41ed&hm=0494b9036feb3cd27412dfdaa7c7145b3093e0a11ae37613e21fb1b644aae6c1&';

interface LayoutProps {
  children: React.ReactNode;
}

const NavLink: React.FC<{ to: string; children: React.ReactNode; active: boolean; badge?: number }> = ({ to, children, active, badge }) => {
  const { theme } = useAppState();
  const isDark = theme === 'dark';
  return (
    <Link 
      to={to} 
      className={`text-xs font-bold transition-all relative py-2 px-1 flex items-center gap-1 ${
        active 
          ? 'text-rojo-600' 
          : (isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-black')
      }`}
    >
      {children}
      {badge && badge > 0 ? <span className="bg-rojo-600 text-white text-[8px] px-1.5 py-0.5 rounded-full animate-pulse">{badge}</span> : null}
      {active && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-rojo-600 rounded-full"></span>}
    </Link>
  );
};

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, originalAdmin, revertToAdmin, theme, toggleTheme, logout, isAuthenticated, notifications, clearNotification } = useAppState();
  const isDark = theme === 'dark';

  const unreadCount = notifications.length;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!isAuthenticated && !['/login', '/signup', '/forgot-password', '/update-password'].includes(location.pathname)) {
    return null;
  }

  const user = currentUser || { 
    id: 'guest',
    displayName: 'Guest', 
    username: 'guest', 
    avatarUrl: '', 
    role: 'User' as const, 
    postCount: 0,
    joinDate: new Date().toISOString()
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-200 ${isDark ? 'bg-zinc-950 text-zinc-100' : 'bg-zinc-50 text-zinc-900'}`}>
      {/* Toast Pings */}
      <div className="fixed top-20 right-8 z-[999] space-y-3 pointer-events-none">
        {notifications.slice(0, 3).map(notif => (
          <div 
            key={notif.id} 
            onClick={() => { navigate(notif.link); clearNotification(notif.id); }}
            className={`pointer-events-auto p-4 rounded-2xl border shadow-2xl flex items-start gap-4 cursor-pointer hover:scale-105 transition-all w-80 animate-in slide-in-from-right duration-300 ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-100'}`}
          >
            <img src={notif.senderAvatar} className="w-10 h-10 rounded-xl border border-zinc-800" alt="" />
            <div className="flex-1 min-w-0">
               <p className="text-[10px] font-black uppercase text-rojo-500 tracking-widest">{notif.title}</p>
               <p className="text-sm font-bold truncate text-zinc-200">{notif.senderName}</p>
               <p className="text-xs text-zinc-500 truncate">{notif.content}</p>
            </div>
            <button onClick={(e) => { e.stopPropagation(); clearNotification(notif.id); }} className="text-zinc-700 hover:text-white">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        ))}
      </div>

      {originalAdmin && (
        <div className="bg-amber-500 text-black py-2 px-8 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider z-[100] sticky top-0">
          <span>Switched to: {user.displayName} (@{user.username})</span>
          <button onClick={revertToAdmin} className="bg-black text-white px-3 py-1 rounded font-bold hover:bg-zinc-800 transition">Exit Session</button>
        </div>
      )}

      <header className={`h-16 border-b sticky ${originalAdmin ? 'top-10' : 'top-0'} z-50 flex items-center justify-between px-8 backdrop-blur-md transition-all ${isDark ? 'bg-zinc-950/80 border-zinc-800' : 'bg-white/80 border-zinc-200 shadow-sm'}`}>
        <div className="flex items-center space-x-10">
          <Link to="/" className="flex items-center gap-3 group">
            <img src={OFFICIAL_LOGO} className="h-8 w-8 object-contain transition-transform group-hover:scale-105" alt="RojosGames" />
            <span className={`text-lg font-black tracking-tight ${isDark ? 'text-white' : 'text-zinc-900'}`}>
              Rojo<span className="text-rojo-600">Games</span>
            </span>
          </Link>
          <nav className="hidden md:flex space-x-8">
            <NavLink to="/" active={location.pathname === '/'}>Forums</NavLink>
            <NavLink to="/members" active={location.pathname === '/members'}>Members</NavLink>
            <NavLink to="/messages" active={location.pathname.startsWith('/messages')} badge={unreadCount}>Inbox</NavLink>
          </nav>
        </div>

        <div className="flex items-center space-x-5">
          <button onClick={toggleTheme} className="p-2 text-zinc-400 hover:text-rojo-600 transition-colors">
            {isDark ? <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" /></svg> : <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" /></svg>}
          </button>
          
          {(user.role === 'Admin' || user.role === 'Moderator') && (
            <Link to="/admin" className="px-3 py-1.5 rounded bg-zinc-800 text-zinc-100 text-[10px] font-bold uppercase tracking-wider hover:bg-zinc-700 transition-colors">Admin Panel</Link>
          )}

          <div className="flex items-center gap-3 pl-4 border-l border-zinc-800">
            <Link to="/profile">
              <img src={user.avatarUrl} className="w-8 h-8 rounded-lg border border-zinc-800 hover:border-rojo-600 transition-colors" alt="" />
            </Link>
            <button onClick={handleLogout} className="text-zinc-500 hover:text-rojo-600 p-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 flex flex-col lg:flex-row gap-8">
        <main className="flex-1 min-w-0">
          {children}
        </main>

        <aside className="hidden lg:block w-72 space-y-6">
          <div className={`border rounded-2xl p-6 shadow-sm transition-all ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-6">Network Identity</h3>
            <div className="flex items-center space-x-4 mb-8">
               <img src={user.avatarUrl} className="w-12 h-12 rounded-xl border border-zinc-800" alt="" />
               <div className="min-w-0">
                 <p className="font-bold text-sm truncate">{user.displayName}</p>
                 <p className="text-xs text-zinc-500">@{user.username}</p>
               </div>
            </div>
            <div className="space-y-4">
              <StatItem label="Posts" value={user.postCount} />
              <StatItem label="Role" value={user.role} />
              <StatItem label="Joined" value={new Date(user.joinDate).getFullYear().toString()} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

const StatItem = ({ label, value }: { label: string; value: string | number }) => (
  <div className="flex justify-between items-center py-2 border-b border-zinc-800/50 last:border-0">
    <span className="text-xs text-zinc-500">{label}</span>
    <span className="text-xs font-bold text-rojo-600">{value}</span>
  </div>
);

export default Layout;
