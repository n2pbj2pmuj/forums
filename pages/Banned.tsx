
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
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-[#0a0202] border border-rojo-900/50 rounded-2xl overflow-hidden shadow-2xl">
        <div className="bg-rojo-600 p-12 text-white text-center">
          <h1 className="text-4xl font-black uppercase tracking-tighter leading-none">Account Moderated</h1>
        </div>
        
        <div className="p-10 space-y-8 text-center">
          <p className="text-slate-400 text-sm leading-relaxed px-4">
            Access to this account has been terminated for violating our community standards. Visual censorship has been applied to all public contributions.
          </p>

          <div className="bg-rojo-950/20 border border-rojo-900/20 rounded-xl p-8 text-left space-y-6">
            <div>
              <p className="text-[9px] uppercase font-bold text-rojo-500 mb-2 tracking-widest">Incident Log</p>
              <p className="text-sm font-medium italic text-slate-300">"{currentUser?.banReason || 'No specific reason provided.'}"</p>
            </div>
            <div className="grid grid-cols-2 gap-4 border-t border-rojo-900/10 pt-6">
              <div>
                <p className="text-[9px] uppercase font-bold text-slate-500 mb-1 tracking-widest">Protocol Status</p>
                <p className="text-sm font-bold text-rojo-500 uppercase">Suspended</p>
              </div>
              <div>
                <p className="text-[9px] uppercase font-bold text-slate-500 mb-1 tracking-widest">Restriction End</p>
                <p className="text-sm font-bold">{currentUser?.banExpires || 'Permanent'}</p>
              </div>
            </div>
          </div>

          <div className="pt-6 flex flex-col space-y-4">
            <button 
              onClick={handleSignOut} 
              className="w-full bg-white text-black py-4 rounded-xl font-bold uppercase text-[11px] tracking-widest hover:bg-slate-200 transition-all shadow-xl"
            >
              Log Out
            </button>
            <p className="text-[10px] text-slate-600 uppercase font-bold tracking-tight">Appeals must be submitted via external help-desk channels.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BannedPage;
