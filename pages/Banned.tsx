
import React, { useState, useEffect } from 'react';
import { useAppState } from '../AppStateContext';
// Fix: Use absolute ESM path to resolve exported member errors
import { useNavigate } from 'https://esm.sh/react-router-dom';

const BannedPage: React.FC = () => {
  const { logout, currentUser, isIpBanned } = useAppState();
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState<{ d: number, h: number, m: number, s: number } | null>(null);

  useEffect(() => {
    if (!currentUser?.banExpires || currentUser.banExpires === 'Never') return;

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(currentUser.banExpires!).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft(null);
        clearInterval(timer);
        return;
      }

      setTimeLeft({
        d: Math.floor(diff / (1000 * 60 * 60 * 24)),
        h: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        m: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        s: Math.floor((diff % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentUser]);

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  const isPermanent = currentUser?.banExpires === 'Never';
  
  if (isIpBanned && !currentUser) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="bg-rojo-600 p-8 text-white text-center">
            <h1 className="text-2xl font-black uppercase tracking-tight">Access Denied</h1>
          </div>
          <div className="p-10 space-y-6 text-center">
            <p className="text-zinc-200 text-lg font-bold leading-relaxed">
              You are forbidden from signing up or logging into accounts.
            </p>
            <p className="text-zinc-500 text-sm">You are no longer welcome on the site.</p>
            <button onClick={handleSignOut} className="w-full bg-zinc-100 text-zinc-900 py-3 rounded-xl font-bold uppercase text-xs tracking-wider">Back to Login</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="bg-rojo-600 p-8 text-white text-center">
          <h1 className="text-2xl font-black uppercase tracking-tight leading-tight">
            {isPermanent ? 'Account Deleted' : 'Account Moderated'}
          </h1>
        </div>
        
        <div className="p-10 space-y-8 text-center">
          <div className="space-y-4">
            <h2 className="text-rojo-500 font-black uppercase text-xs tracking-widest">
              {isPermanent ? 'Account Deleted' : `Banned for ${timeLeft?.d || 0} days`}
            </h2>
            <div className="p-5 rounded-2xl bg-black/40 border border-zinc-800 text-left">
              <p className="text-[10px] font-black uppercase text-zinc-600 mb-2 tracking-widest">Reason</p>
              <p className="text-zinc-200 text-sm italic font-medium">"{currentUser?.banReason || 'No reason provided'}"</p>
            </div>
            
            {!isPermanent && timeLeft && (
               <div className="p-5 rounded-2xl bg-black/20 border border-zinc-800">
                  <p className="text-[10px] font-black uppercase text-zinc-600 mb-2 tracking-widest">Duration Remaining</p>
                  <div className="flex justify-center gap-4">
                    <TimeBlock label="Days" val={timeLeft.d} />
                    <TimeBlock label="Hrs" val={timeLeft.h} />
                    <TimeBlock label="Min" val={timeLeft.m} />
                  </div>
               </div>
            )}
          </div>

          <div className="pt-4 space-y-4">
            <button 
              onClick={handleSignOut} 
              className="w-full bg-zinc-100 text-zinc-900 py-3 rounded-xl font-bold uppercase text-xs tracking-wider hover:bg-white transition-colors"
            >
              Sign Out
            </button>
            <p className="text-[10px] text-zinc-600 uppercase font-bold tracking-[0.2em]">Contact support for appeals.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const TimeBlock = ({ label, val }: { label: string, val: number }) => (
  <div className="text-center">
    <p className="text-lg font-black text-white">{val}</p>
    <p className="text-[8px] font-black uppercase text-zinc-600 tracking-tighter">{label}</p>
  </div>
);

export default BannedPage;
