
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
    <div className="min-h-screen bg-rojo-950 flex items-center justify-center p-6 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-rojo-900/20 via-black to-black">
      <div className="max-w-xl w-full bg-black border border-rojo-500/50 rounded-[2.5rem] overflow-hidden shadow-[0_0_150px_rgba(255,0,0,0.2)] animate-in zoom-in duration-500">
        <div className="bg-rojo-600 p-8 text-white flex items-center justify-between shadow-2xl relative">
          <div className="absolute top-0 right-0 p-4">
             <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center animate-pulse">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
             </div>
          </div>
          <div className="space-y-1">
             <h1 className="text-3xl font-black tracking-tighter uppercase leading-none">GRID ACCESS<br/>TERMINATED</h1>
             <div className="text-[10px] font-black uppercase tracking-[0.3em] opacity-80">RojosGames Security Protocol 44</div>
          </div>
        </div>
        
        <div className="p-12 space-y-10">
          <div className="flex flex-col items-center text-center space-y-6">
            <h2 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">IDENTITY BLACKLISTED</h2>
            <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-sm">System integrity checks have flagged your account for terminal community policy violations.</p>
          </div>

          <div className="bg-rojo-950/20 border border-rojo-900/30 rounded-3xl p-8 space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-rojo-500/5 -mr-12 -mt-12 rounded-full blur-3xl"></div>
            <div>
              <p className="text-[10px] uppercase font-black text-rojo-500 mb-2 tracking-widest">Incident Record</p>
              <p className="text-sm font-bold text-slate-300 italic">"{currentUser.banReason || 'Repeated breaches of established social stability protocols.'}"</p>
            </div>
            <div className="grid grid-cols-2 gap-8 border-t border-rojo-900/10 pt-6">
              <div>
                <p className="text-[10px] uppercase font-black text-slate-600 mb-1 tracking-widest">Protocol Status</p>
                <p className="text-lg font-black text-rojo-500 uppercase tracking-tighter">Hard Suspension</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-black text-slate-600 mb-1 tracking-widest">Reset Interval</p>
                <p className="text-lg font-black text-slate-200 uppercase tracking-tighter">{currentUser.banExpires || 'Undefined'}</p>
              </div>
            </div>
          </div>

          <div className="pt-8 flex flex-col space-y-4">
            <button onClick={handleSignOut} className="w-full bg-white text-black py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-slate-200 transition-all shadow-xl">Exit Terminal</button>
            <button className="w-full border border-rojo-900/50 text-rojo-400 py-4 rounded-2xl font-black uppercase text-xs tracking-[0.1em] hover:bg-rojo-900/10 transition-all">Request Security Review</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BannedPage;
