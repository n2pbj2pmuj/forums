
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppState } from '../AppStateContext';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAppState();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await resetPassword(email);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Sequence failure. Check connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-rojo-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-black border border-rojo-900/50 rounded-3xl p-10 shadow-[0_0_50px_rgba(255,0,0,0.1)]">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-rojo-500 neon-red tracking-tighter mb-2 uppercase leading-none">KEY RECOVERY</h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-2">Reset Identity Access</p>
        </div>

        {success ? (
          <div className="space-y-6 text-center py-4 animate-in fade-in zoom-in duration-500">
             <div className="w-16 h-16 bg-rojo-600/20 border border-rojo-500 rounded-full flex items-center justify-center mx-auto">
               <svg className="w-8 h-8 text-rojo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
             </div>
             <p className="text-slate-400 text-sm leading-relaxed">A recovery link has been broadcast to your terminal inbox. Use it to re-establish your secure access.</p>
             <Link to="/login" className="block text-rojo-500 font-black uppercase text-xs tracking-widest hover:underline">Return to Login</Link>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-8">
            {error && <div className="p-4 bg-rojo-600/20 border border-rojo-500 text-rojo-500 text-xs font-bold rounded-xl">{error}</div>}
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-3 tracking-widest">Registered Email</label>
              <input 
                required
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-rojo-950 border border-rojo-900/30 rounded-2xl px-5 py-4 text-white focus:ring-2 ring-rojo-500 outline-none transition-all placeholder-slate-700"
                placeholder="identity@rojos.games"
              />
            </div>
            <button 
              disabled={loading}
              className="w-full bg-rojo-600 hover:bg-rojo-500 text-white font-black py-4 rounded-2xl shadow-lg transition-all uppercase text-sm tracking-widest disabled:opacity-50"
            >
              {loading ? 'Transmitting...' : 'Send Recovery Signal'}
            </button>
            <div className="text-center">
              <Link to="/login" className="text-slate-500 text-xs font-black uppercase hover:text-rojo-400 transition-colors">Abort & Return</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
