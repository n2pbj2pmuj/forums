
import React from 'react';
import { useAppState } from '../AppStateContext';
import { useNavigate } from 'react-router-dom';

const BannedPage: React.FC = () => {
  const { currentUser, logout } = useAppState();
  const navigate = useNavigate();

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="bg-rojo-600 p-8 text-white text-center">
          <h1 className="text-2xl font-black uppercase tracking-tight">Access Restricted</h1>
        </div>
        
        <div className="p-8 space-y-6 text-center">
          <p className="text-zinc-400 text-sm leading-relaxed">
            Your account has been moderated due to a violation of our community standards.
          </p>

          <div className="bg-black/40 border border-zinc-800 rounded-xl p-6 text-left space-y-4">
            <div>
              <p className="text-[10px] uppercase font-bold text-zinc-500 mb-1">Moderator Note</p>
              <p className="text-sm italic text-zinc-300">"{currentUser?.banReason || 'No details provided.'}"</p>
            </div>
            <div className="grid grid-cols-2 gap-4 border-t border-zinc-800 pt-4">
              <div>
                <p className="text-[10px] uppercase font-bold text-zinc-500 mb-1">Status</p>
                <p className="text-sm font-bold text-rojo-600 uppercase">Suspended</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-zinc-500 mb-1">Expires</p>
                <p className="text-sm font-bold text-zinc-200">{currentUser?.banExpires || 'Permanent'}</p>
              </div>
            </div>
          </div>

          <div className="pt-4 space-y-4">
            <button 
              onClick={handleSignOut} 
              className="w-full bg-zinc-100 text-zinc-900 py-3 rounded-xl font-bold uppercase text-xs tracking-wider hover:bg-white transition-colors"
            >
              Sign Out
            </button>
            <p className="text-[10px] text-zinc-600 uppercase font-bold">Please contact support for appeals.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BannedPage;