
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
        <div className="bg-rojo-600 p-8 text-white">
          <h1 className="text-2xl font-black uppercase tracking-tight">Access Restricted</h1>
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mt-1">Community Guidelines Violation</p>
        </div>
        
        <div className="p-8 space-y-8 text-center">
          <div>
            <h2 className="text-xl font-bold uppercase mb-2">Account Banned</h2>
            <p className="text-slate-400 text-sm leading-relaxed">Your account has been suspended for violating our terms of service or community protocols.</p>
          </div>

          <div className="bg-rojo-950/20 border border-rojo-900/20 rounded-xl p-6 text-left space-y-4">
            <div>
              <p className="text-[9px] uppercase font-bold text-rojo-500 mb-1 tracking-widest">Reason</p>
              <p className="text-sm font-medium italic text-slate-300">"{currentUser?.banReason || 'No specific reason provided.'}"</p>
            </div>
            <div className="grid grid-cols-2 gap-4 border-t border-rojo-900/10 pt-4">
              <div>
                <p className="text-[9px] uppercase font-bold text-slate-500 mb-1 tracking-widest">Status</p>
                <p className="text-sm font-bold text-rojo-500">Banned</p>
              </div>
              <div>
                <p className="text-[9px] uppercase font-bold text-slate-500 mb-1 tracking-widest">Expires</p>
                <p className="text-sm font-bold">{currentUser?.banExpires || 'Permanent'}</p>
              </div>
            </div>
          </div>

          <div className="pt-4 flex flex-col space-y-3">
            <button onClick={handleSignOut} className="w-full bg-white text-black py-3 rounded-lg font-bold uppercase text-[11px] tracking-widest hover:bg-slate-200 transition-all">Sign Out</button>
            <p className="text-[10px] text-slate-600 uppercase font-bold">Contact support if you believe this is an error.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BannedPage;
