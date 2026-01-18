import React from 'react';
import { useAppState } from '../AppStateContext';
import { useNavigate } from 'react-router-dom';

const BannedPage: React.FC = () => {
  const { logout } = useAppState();
  const navigate = useNavigate();

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="bg-rojo-600 p-8 text-white text-center">
          <h1 className="text-2xl font-black uppercase tracking-tight leading-tight">Account Moderate</h1>
        </div>
        
        <div className="p-10 space-y-8 text-center">
          <div className="space-y-4">
            <p className="text-zinc-200 text-lg font-bold leading-relaxed">
              You are forbidden from signing up or logging into accounts.
            </p>
            <p className="text-zinc-500 text-sm font-medium">
              Your account or network has been flagged for violations of our terms of service.
            </p>
          </div>

          <div className="pt-4 space-y-4">
            <button 
              onClick={handleSignOut} 
              className="w-full bg-zinc-100 text-zinc-900 py-3 rounded-xl font-bold uppercase text-xs tracking-wider hover:bg-white transition-colors"
            >
              Back to Home
            </button>
            <p className="text-[10px] text-zinc-600 uppercase font-bold tracking-[0.2em]">Contact support for appeals.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BannedPage;