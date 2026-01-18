
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'https://esm.sh/react-router-dom';
import { useAppState } from '../AppStateContext';
import { PresenceStatus } from '../types';

const OFFICIAL_LOGO = 'https://cdn.discordapp.com/attachments/857780833967276052/1462268781035257876/8vNx0KgNUIAAAAXV5kBICzjE2Ar5tOA8BqBAAAgCL7afqZ5F3G5QDfkrzfdCAAVnPneDxuPQMAAACwMBsAAAAAUEAAAAAAgAICAAAAABQQAAAAAKCAAAAAAAAFBAAAAAAoIAAAAABAAQEAAAAACggAAAAAUEAAAAAAgAICAAAAABQQAAAAAKCAAAAAAAAFBAAAAAAoIAAAAABAAQEAAAAACvwB3GyoTaCTr1QAAAAASUVORK5CYII.png?ex=696d936d&is=696c41ed&hm=0494b9036feb3cd27412dfdaa7c7145b3093e0a11ae37613e21fb1b644aae6c1&';

interface LayoutProps {
  children: React.ReactNode;
}

const SettingsModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { currentUser, updateUser, theme } = useAppState();
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl || '');
  const [status, setStatus] = useState<PresenceStatus>(currentUser?.presenceStatus || 'Online');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    setLoading(true);
    await updateUser({ displayName, avatarUrl, presenceStatus: status });
    setLoading(false);
    onClose();
  };

  const isDark = theme === 'dark';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 backdrop-blur-md bg-black/60 animate-in fade-in duration-200">
      <div className={`w-full max-w-md rounded-[2.5rem] border shadow-2xl overflow-hidden ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-100'}`}>
        <div className="bg-rojo-600 p-6 flex items-center justify-between">
          <h2 className="text-white font-black uppercase tracking-widest text-sm">User Settings</h2>
          <button onClick={onClose} className="text-white hover:rotate-90 transition-transform"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        <div className="p-10 space-y-6">
          <div>
            <label className="block text-[10px] font-black uppercase text-zinc-500 mb-2 tracking-widest">Display Name</label>
            <input value={displayName} onChange={e => setDisplayName(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:ring-1 ring-rojo-600 transition-all" />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-zinc-500 mb-2 tracking-widest">Avatar URL</label>
            <input value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3 text-sm text-white outline-none focus:ring-1 ring-rojo-600 transition-all" />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-zinc-500 mb-2 tracking-widest">Status</label>
            <div className="flex gap-2">
              {(['Online', 'Idle', 'DND'] as PresenceStatus[]).map(s => (
                <button 
                  key={s} 
                  onClick={() => setStatus(s)} 
                  className={`flex-1 py-3 rounded-2xl text-[9px] font-black uppercase transition-all ${status === s ? 'bg-rojo-600 text-white shadow-lg' : 'bg-zinc-900 text-zinc-500 hover:bg-zinc-800'}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <button onClick={handleSave} disabled={loading} className="w-full bg-rojo-600 hover:bg-rojo-500 text-white font-black py-4 rounded-2xl text-xs uppercase tracking-[0.2em] shadow-xl disabled:opacity-50 transition-all">
            {loading ? 'SAVING...' : 'UPDATE PROFILE'}
          </button>
        </div>
      </div>
    </div>
  );
};

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, theme, toggleTheme, logout, isAuthenticated } = useAppState();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const isDark = theme === 'dark';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!isAuthenticated && !['/login', '/signup', '/forgot-password', '/update-password'].includes(location.pathname)) {
    return null;
  }

  const user = currentUser || { id: 'guest', displayName: 'Guest', username: 'guest', avatarUrl: '', role: 'User', presenceStatus: 'Online' };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-200 ${isDark ? 'bg-zinc-950 text-zinc-100' : 'bg-zinc-50 text-zinc-900'}`}>
      <header className={`h-16 border-b sticky top-0 z-50 flex items-center justify-between px-8 backdrop-blur-md transition-all ${isDark ? 'bg-zinc-950/80 border-zinc-800' : 'bg-white/80 border-zinc-200 shadow-sm'}`}>
        <div className="flex items-center space-x-10">
          <Link to="/" className="flex items-center gap-3 group">
            <img src={OFFICIAL_LOGO} className="h-8 w-8 object-contain transition-transform group-hover:scale-105" alt="RojosGames" />
            <span className={`text-lg font-black tracking-tight ${isDark ? 'text-white' : 'text-zinc-900'}`}>
              Rojo<span className="text-rojo-600">Games</span>
            </span>
          </Link>
          <nav className="hidden md:flex space-x-8">
            <Link to="/" className="text-xs font-bold hover:text-rojo-600 transition-colors">Forums</Link>
            <Link to="/members" className="text-xs font-bold hover:text-rojo-600 transition-colors">Members</Link>
            <Link to="/messages" className="text-xs font-bold hover:text-rojo-600 transition-colors">Inbox</Link>
          </nav>
        </div>

        <div className="flex items-center space-x-5">
          <button onClick={toggleTheme} className="p-2 text-zinc-400 hover:text-rojo-600 transition-colors">
            {isDark ? <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" /></svg> : <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" /></svg>}
          </button>
          
          <button onClick={() => setIsSettingsOpen(true)} className="p-2 text-zinc-400 hover:text-rojo-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </button>

          <div className="flex items-center gap-3 pl-4 border-l border-zinc-800">
            <Link to="/profile" className="relative">
              <img src={user.avatarUrl} className="w-8 h-8 rounded-lg border border-zinc-800 hover:border-rojo-600 transition-colors" alt="" />
              <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-zinc-950 ${user.presenceStatus === 'Online' ? 'bg-emerald-500' : user.presenceStatus === 'Idle' ? 'bg-amber-500' : 'bg-rojo-600'}`}></div>
            </Link>
            <button onClick={handleLogout} className="text-zinc-500 hover:text-rojo-600 p-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
          </div>
        </div>
      </header>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      <div className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 flex flex-col lg:flex-row gap-8">
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
