
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

// Fixed: Moved NavLink definition above Layout to ensure it is defined before usage in JSX,
// avoiding type-checking issues where children were not recognized correctly.
const NavLink: React.FC<NavLinkProps> = ({ to, children, active }) => {
  const { theme } = useAppState();
  const isDark = theme === 'dark';

  return (
    <Link 
      to={to} 
      className={`text-[10px] font-black uppercase tracking-[0.2em] transition-all relative py-1 ${
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
  const { currentUser, originalAdmin, revertToAdmin, theme, toggleTheme, logout, isAuthenticated, assets } = useAppState();

  const isDark = theme === 'dark';
  const assetBanner = assets.find(a => a.isActive && a.type === 'Banner');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!isAuthenticated && location.pathname !== '/login' && location.pathname !== '/signup') {
    return null;
  }

  // Prevents crash during brief window where isAuthenticated is true but identity is still syncing
  if (!currentUser) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-[#0a0202]' : 'bg-[#FFF8F8]'}`}>
        <div className="text-rojo-500 font-black text-xl animate-pulse tracking-widest uppercase">Initializing Identity...</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${isDark ? 'bg-[#0a0202] text-slate-100' : 'bg-[#FFF8F8] text-slate-900'}`}>
      
      {/* Impersonation Warning Banner */}
      {originalAdmin && (
        <div className="bg-amber-500 text-black py-2 px-6 flex items-center justify-between text-[10px] font-black uppercase tracking-wider z-[60]">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            Mode: Impersonating {currentUser.displayName} (@{currentUser.username})
          </div>
          <button onClick={revertToAdmin} className="bg-black text-white px-3 py-1 rounded-lg hover:bg-slate-800 transition shadow-lg">Return to Admin</button>
        </div>
      )}

      {/* Top Header */}
      <header className={`h-16 border-b sticky top-0 z-50 flex items-center justify-between px-6 backdrop-blur-md transition-all ${isDark ? 'bg-black/90 border-rojo-900/50 shadow-[0_0_20px_rgba(255,0,0,0.1)]' : 'bg-white/90 border-rojo-100'}`}>
        <div className="flex items-center space-x-8">
          <Link to="/" className={`text-2xl font-black tracking-tight ${isDark ? 'text-rojo-500 neon-red' : 'text-rojo-600'}`}>
            ROJO<span className={isDark ? 'text-white' : 'text-slate-900'}>GAMES</span>
          </Link>
          <nav className="hidden md:flex space-x-6">
            <NavLink to="/" active={location.pathname === '/'}>Feed</NavLink>
            <NavLink to="/members" active={location.pathname === '/members'}>Registry</NavLink>
            <NavLink to="/messages" active={location.pathname === '/messages'}>Comms</NavLink>
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          <button 
            onClick={toggleTheme}
            className={`p-2 rounded-lg transition-all ${isDark ? 'text-rojo-400 hover:bg-rojo-900/20' : 'text-slate-400 hover:bg-rojo-50'}`}
          >
            {isDark ? <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" /></svg> : <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" /></svg>}
          </button>
          
          <div className={`h-8 w-[1px] ${isDark ? 'bg-rojo-900/50' : 'bg-rojo-100'}`}></div>

          {(currentUser.role === 'Admin' || currentUser.role === 'Moderator') && (
            <Link to="/admin" className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isDark ? 'bg-rojo-600 hover:bg-rojo-500 shadow-[0_0_15px_rgba(255,0,0,0.3)] text-white' : 'bg-rojo-700 text-white hover:bg-rojo-800'}`}>Overwatch</Link>
          )}

          <div className="flex items-center space-x-3 group relative">
            <Link to="/profile" className="flex items-center space-x-3">
              <img src={currentUser.avatarUrl} className={`w-9 h-9 rounded-xl border-2 transition-all ${isDark ? 'border-rojo-900 hover:border-rojo-500' : 'border-slate-100'}`} alt="Avatar" />
            </Link>
            <button 
              onClick={handleLogout}
              className={`p-2 rounded-lg text-slate-500 hover:text-rojo-500 transition-colors ${isDark ? 'hover:bg-rojo-900/10' : 'hover:bg-rojo-50'}`}
              title="Sign Out"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
          </div>
        </div>
      </header>

      {/* Global Promotional Banner */}
      {assetBanner && (
        <div className="w-full h-24 relative overflow-hidden group cursor-pointer border-b border-rojo-900/30">
          <img src={assetBanner.imageUrl} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="Promotion" />
          <div className="absolute inset-0 bg-gradient-to-r from-rojo-950/90 to-transparent flex items-center px-12">
            <div className="space-y-1">
              <span className="bg-rojo-600 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded tracking-widest">Network Alert</span>
              <h2 className="text-white text-xl font-black uppercase tracking-tight">{assetBanner.name}</h2>
              <p className="text-rojo-400 text-[10px] font-black uppercase tracking-widest">Platform protocol update in progress.</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 flex flex-col lg:flex-row gap-10">
        <main className="flex-1 min-w-0">
          {children}
        </main>

        <aside className="hidden lg:block w-72 space-y-6">
          <div className={`border rounded-[2rem] p-8 shadow-2xl transition-all ${isDark ? 'bg-[#0e0303] border-rojo-900/40' : 'bg-white border-rojo-100'}`}>
            <h3 className={`text-[10px] font-black uppercase tracking-[0.3em] mb-6 ${isDark ? 'text-rojo-500' : 'text-rojo-600'}`}>Citizen Profile</h3>
            <div className="flex items-center space-x-4 mb-6">
               <img src={currentUser.avatarUrl} className="w-14 h-14 rounded-2xl border-2 border-rojo-900/50" alt="" />
               <div className="min-w-0">
                 <p className="font-black text-lg truncate tracking-tight">{currentUser.displayName}</p>
                 <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">@{currentUser.username}</p>
               </div>
            </div>
            <div className="grid grid-cols-2 gap-4 border-t border-rojo-900/20 pt-6">
              <div>
                <p className="text-2xl font-black">{currentUser.postCount}</p>
                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Posts</p>
              </div>
              <div>
                <p className="text-2xl font-black">{currentUser.role === 'Admin' ? 'INF' : '0'}</p>
                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Reports</p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Layout;
