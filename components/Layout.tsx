import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppState } from '../AppStateContext';

const OFFICIAL_LOGO = 'https://cdn.discordapp.com/attachments/857780833967276052/1462268781035257876/8vNx0KgNUIAAAAXV5kBICzjE2Ar5tOA8BqBAAAgCL7afqZ5F3G5QDfkrzfdCAAVnPneDxuPQMAAACwMBsAAAAAUEAAAAAAgAICAAAAABQQAAAAAKCAAAAAAAAFBAAAAAAoIAAAAABAAQEAAAAACggAAAAAUEAAAAAAgAICAAAAABQQAAAAAKCAAAAAAAAFBAAAAAAoIAAAAABAAQEAAAAACvwB3GyoTaCTr1QAAAAASUVORK5CYII.png?ex=696d936d&is=696c41ed&hm=0494b9036feb3cd27412dfdaa7c7145b3093e0a11ae37613e21fb1b644aae6c1&';

interface LayoutProps {
  children: React.ReactNode;
}

const NavLink: React.FC<{ to: string; children: React.ReactNode; active: boolean }> = ({ to, children, active }) => {
  const { theme } = useAppState();
  const isDark = theme === 'dark';
  return (
    <Link 
      to={to} 
      className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all relative py-1 ${
        active 
          ? 'text-rojo-500' 
          : (isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-500 hover:text-slate-900')
      }`}
    >
      {children}
      {active && <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-rojo-600 rounded-full shadow-[0_0_10px_rgba(255,0,0,0.5)]"></span>}
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

  if (!isAuthenticated && !['/login', '/signup', '/forgot-password', '/update-password'].includes(location.pathname)) {
    return null;
  }

  // Fixed: Added missing joinDate and other properties to ensure the guest object matches the User interface requirements used in sidebar stats.
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
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${isDark ? 'bg-[#050101] text-slate-100' : 'bg-[#FFFBFB] text-slate-900'}`}>
      {originalAdmin && (
        <div className="bg-amber-500 text-black py-2 px-6 flex items-center justify-between text-[10px] font-black uppercase tracking-wider z-[100] sticky top-0">
          <span>Logged in as: {user.displayName} (@{user.username})</span>
          <button onClick={revertToAdmin} className="bg-black text-white px-3 py-1 rounded-md hover:opacity-80 transition">Revert to Admin</button>
        </div>
      )}

      <header className={`h-20 border-b sticky ${originalAdmin ? 'top-10' : 'top-0'} z-50 flex items-center justify-between px-8 backdrop-blur-xl transition-all ${isDark ? 'bg-black/80 border-rojo-900/40' : 'bg-white/80 border-rojo-100'}`}>
        <div className="flex items-center space-x-12">
          <Link to="/" className="flex items-center gap-4 group">
            <img src={OFFICIAL_LOGO} className="h-10 w-10 object-contain drop-shadow-[0_0_8px_rgba(255,0,0,0.4)] group-hover:scale-110 transition-transform" alt="RojosGames" />
            <span className={`text-xl font-black tracking-tighter ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Rojos<span className="text-rojo-600">Games</span>
            </span>
          </Link>
          <nav className="hidden md:flex space-x-10">
            <NavLink to="/" active={location.pathname === '/'}>Forums</NavLink>
            <NavLink to="/members" active={location.pathname === '/members'}>Members</NavLink>
            <NavLink to="/messages" active={location.pathname === '/messages'}>Chat</NavLink>
          </nav>
        </div>

        <div className="flex items-center space-x-6">
          <button onClick={toggleTheme} className="p-2 text-slate-500 hover:text-rojo-500 transition-colors">
            {isDark ? <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" /></svg> : <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" /></svg>}
          </button>
          
          {(user.role === 'Admin' || user.role === 'Moderator') && (
            <Link to="/admin" className="px-4 py-1.5 rounded-full bg-rojo-600 text-white text-[9px] font-black uppercase tracking-widest hover:bg-rojo-500 transition-colors shadow-lg shadow-rojo-900/20">Mod Panel</Link>
          )}

          <div className="flex items-center gap-3 pl-4 border-l border-rojo-900/20">
            <Link to="/profile">
              <img src={user.avatarUrl} className="w-9 h-9 rounded-xl border border-rojo-900/20 hover:scale-105 transition-transform" alt="" />
            </Link>
            <button onClick={handleLogout} className="text-slate-500 hover:text-rojo-500 p-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-10 flex flex-col lg:flex-row gap-10">
        <main className="flex-1 min-w-0">
          {children}
        </main>

        <aside className="hidden lg:block w-72 space-y-6">
          <div className={`border rounded-3xl p-8 transition-all ${isDark ? 'bg-black/40 border-rojo-900/30' : 'bg-white border-rojo-100 shadow-sm'}`}>
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-rojo-600 mb-6">User Statistics</h3>
            <div className="flex items-center space-x-4 mb-8">
               <img src={user.avatarUrl} className="w-14 h-14 rounded-2xl border-2 border-rojo-900/10" alt="" />
               <div className="min-w-0">
                 <p className="font-black text-sm truncate">{user.displayName}</p>
                 <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">@{user.username}</p>
               </div>
            </div>
            <div className="space-y-4">
              <StatItem label="Forum Posts" value={user.postCount} />
              <StatItem label="Account Level" value={user.role} />
              <StatItem label="Joined" value={new Date(user.joinDate).getFullYear().toString()} />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

const StatItem = ({ label, value }: { label: string; value: string | number }) => (
  <div className="flex justify-between items-center py-2 border-b border-rojo-900/5 last:border-0">
    <span className="text-[10px] font-bold uppercase text-slate-500">{label}</span>
    <span className="text-xs font-black text-rojo-500">{value}</span>
  </div>
);

export default Layout;