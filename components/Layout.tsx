
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppState } from '../AppStateContext';

interface LayoutProps {
  children: React.ReactNode;
  // Added optional activeBanner prop to fix type errors in Home.tsx and Dashboard.tsx
  activeBanner?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, activeBanner: bannerPropText }) => {
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

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${isDark ? 'bg-rojo-950 text-slate-100' : 'bg-[#FFF8F8] text-slate-900'}`}>
      
      {/* Impersonation Warning Banner */}
      {originalAdmin && (
        <div className="bg-amber-500 text-black py-2 px-6 flex items-center justify-between text-xs font-bold uppercase tracking-wider z-[60]">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            Mode: Impersonating {currentUser.displayName} (@{currentUser.username})
          </div>
          <button onClick={revertToAdmin} className="bg-black text-white px-3 py-1 rounded hover:bg-slate-800 transition">Return to Admin</button>
        </div>
      )}

      {/* Top Header */}
      <header className={`h-16 border-b sticky top-0 z-50 flex items-center justify-between px-6 backdrop-blur-md transition-all ${isDark ? 'bg-black/80 border-rojo-900/50 shadow-[0_0_20px_rgba(255,0,0,0.1)]' : 'bg-white/80 border-rojo-100'}`}>
        <div className="flex items-center space-x-8">
          <Link to="/" className={`text-2xl font-black tracking-tight ${isDark ? 'text-rojo-500 neon-red' : 'text-rojo-600'}`}>
            ROJO<span className={isDark ? 'text-white' : 'text-slate-900'}>GAMES</span>
          </Link>
          <nav className="hidden md:flex space-x-6">
            <NavLink to="/" active={location.pathname === '/'}>Feed</NavLink>
            <NavLink to="/members" active={location.pathname === '/members'}>Members</NavLink>
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

          {currentUser.role === 'Admin' && (
            <Link to="/admin" className={`px-3 py-1.5 rounded-md text-xs font-black uppercase transition-all ${isDark ? 'bg-rojo-600 hover:bg-rojo-500 shadow-[0_0_15px_rgba(255,0,0,0.3)] text-white' : 'bg-rojo-700 text-white hover:bg-rojo-800'}`}>Admin</Link>
          )}

          <div className="flex items-center space-x-3 group relative">
            <Link to="/profile" className="flex items-center space-x-3 group">
              <img src={currentUser.avatarUrl} className={`w-8 h-8 rounded-full border-2 transition-all ${isDark ? 'border-rojo-900 group-hover:border-rojo-500' : 'border-slate-100 group-hover:border-rojo-600'}`} alt="Avatar" />
              <span className={`hidden lg:block text-sm font-bold transition-colors ${isDark ? 'text-slate-300 group-hover:text-white' : 'text-slate-700 group-hover:text-rojo-600'}`}>{currentUser.displayName}</span>
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

      {/* Global Promotional Banner - Prioritize assetBanner then bannerPropText */}
      {assetBanner ? (
        <div className="w-full h-24 relative overflow-hidden group cursor-pointer border-b border-rojo-900/30">
          <img src={assetBanner.imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Promotion" />
          <div className="absolute inset-0 bg-gradient-to-r from-rojo-950/80 to-transparent flex items-center px-8">
            <div className="space-y-1">
              <span className="bg-rojo-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded">Featured Event</span>
              <h2 className="text-white text-lg font-black uppercase tracking-tight">{assetBanner.name}</h2>
              <p className="text-rojo-200 text-xs font-bold">Limited time community rewards available now!</p>
            </div>
          </div>
        </div>
      ) : bannerPropText ? (
        <div className="w-full bg-rojo-600 text-white py-2 px-6 text-center text-[10px] font-black uppercase tracking-[0.2em] z-40">
          {bannerPropText}
        </div>
      ) : null}

      <div className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 flex flex-col lg:flex-row gap-8">
        <main className="flex-1 min-w-0">
          {children}
        </main>

        <aside className="hidden lg:block w-72 space-y-6">
          <div className={`border rounded-xl p-6 shadow-xl transition-all ${isDark ? 'bg-rojo-950 border-rojo-900/50 hover:border-rojo-500/50' : 'bg-white border-rojo-100'}`}>
            <h3 className={`text-sm font-black uppercase tracking-wider mb-4 ${isDark ? 'text-rojo-400 neon-red' : 'text-rojo-600'}`}>Citizen Profile</h3>
            <div className="flex items-center space-x-4 mb-6">
               <img src={currentUser.avatarUrl} className="w-12 h-12 rounded-full border border-rojo-900" alt="" />
               <div className="min-w-0">
                 <p className="font-bold truncate">{currentUser.displayName}</p>
                 <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">@{currentUser.username}</p>
               </div>
            </div>
            <div className="grid grid-cols-2 gap-4 border-t border-rojo-900/20 pt-4">
              <div>
                <p className="text-lg font-black">{currentUser.postCount}</p>
                <p className="text-[9px] font-bold text-slate-500 uppercase">Posts</p>
              </div>
              <div>
                <p className="text-lg font-black">4</p>
                <p className="text-[9px] font-bold text-slate-500 uppercase">Warnings</p>
              </div>
            </div>
          </div>

          <div className={`border rounded-xl p-5 shadow-lg ${isDark ? 'bg-rojo-950/50 border-rojo-900/80' : 'bg-white border-rojo-100'}`}>
            <h3 className={`text-sm font-black uppercase tracking-wider mb-4 ${isDark ? 'text-rojo-400' : 'text-rojo-600'}`}>Staff Support</h3>
            <div className="space-y-4">
                 <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-rojo-900/10 cursor-pointer transition-colors group">
                   <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Staff1" className="w-8 h-8 rounded-full border border-rojo-500 group-hover:border-white transition-colors" alt="" />
                   <div>
                     <p className="text-xs font-black text-rojo-500 group-hover:text-white transition-colors">Mod_Viper</p>
                     <p className="text-[9px] text-slate-500">Global Moderator</p>
                   </div>
                 </div>
                 <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-rojo-900/10 cursor-pointer transition-colors group">
                   <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Staff2" className="w-8 h-8 rounded-full border border-rojo-500 group-hover:border-white transition-colors" alt="" />
                   <div>
                     <p className="text-xs font-black text-rojo-500 group-hover:text-white transition-colors">Mod_Red</p>
                     <p className="text-[9px] text-slate-500">Security Lead</p>
                   </div>
                 </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

const NavLink = ({ to, children, active }: { to: string; children: React.ReactNode; active: boolean }) => {
  const { theme } = useAppState();
  const isDark = theme === 'dark';

  return (
    <Link 
      to={to} 
      className={`text-sm font-bold transition-all relative py-1 ${
        active 
          ? (isDark ? 'text-rojo-500' : 'text-rojo-600') 
          : (isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-500 hover:text-slate-900')
      }`}
    >
      {children}
      {active && <span className={`absolute -bottom-1 left-0 w-full h-0.5 rounded-full ${isDark ? 'bg-rojo-500 shadow-[0_0_8px_rgba(255,0,0,0.8)]' : 'bg-rojo-600'}`}></span>}
    </Link>
  );
};

export default Layout;
