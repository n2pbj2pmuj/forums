
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
        <div className="bg-rojo-600 p-10 text-white text-center">
          <h1 className="text-3xl font-black uppercase tracking-tighter">Account Moderated</h1>
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mt-2">Rules Violation</p>
        </div>
        
        <div className="p-10 space-y-8 text-center">
          <p className="text-slate-400 text-sm leading-relaxed">
            Your access has been restricted due to activities that do not align with our platform standards.
          </p>

          <div className="bg-rojo-950/20 border border-rojo-900/20 rounded-xl p-8 text-left space-y-6">
            <div>
              <p className="text-[9px] uppercase font-bold text-rojo-500 mb-2 tracking-widest">Staff Note</p>
              <p className="text-sm font-medium italic text-slate-300">"{currentUser?.banReason || 'No specific reason provided.'}"</p>
            </div>
            <div className="grid grid-cols-2 gap-4 border-t border-rojo-900/10 pt-6">
              <div>
                <p className="text-[9px] uppercase font-bold text-slate-500 mb-1 tracking-widest">Status</p>
                <p className="text-sm font-bold text-rojo-500 uppercase">Banned</p>
              </div>
              <div>
                <p className="text-[9px] uppercase font-bold text-slate-500 mb-1 tracking-widest">Duration</p>
                <p className="text-sm font-bold">{currentUser?.banExpires || 'Account Terminated'}</p>
              </div>
            </div>
          </div>

          <div className="pt-6 flex flex-col space-y-4">
            <button 
              onClick={handleSignOut} 
              className="w-full bg-white text-black py-4 rounded-xl font-bold uppercase text-[11px] tracking-widest hover:bg-slate-200 transition-all shadow-xl"
            >
              Sign Out of Session
            </button>
            <p className="text-[10px] text-slate-600 uppercase font-bold tracking-tight">Contact administration for appeals.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BannedPage;
