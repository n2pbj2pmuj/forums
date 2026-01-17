
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppState } from '../AppStateContext';

const SignupPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signup } = useAppState();
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);
    try {
      await signup(username, email, pass);
      setSuccess(true);
      setUsername('');
      setEmail('');
      setPass('');
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-rojo-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-black border border-rojo-900/50 rounded-3xl p-10 shadow-[0_0_50px_rgba(255,0,0,0.1)]">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-rojo-500 neon-red tracking-tighter mb-2 uppercase">JOIN THE GRID</h1>
          <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Establish Forum Identity</p>
        </div>

        {success ? (
          <div className="space-y-8 text-center py-6 animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 bg-emerald-600/20 border border-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tight mb-3">Identity Registered</h2>
              <p className="text-slate-400 text-sm leading-relaxed px-4">Account created successfully! Check your email for a verification link to activate your access to the grid.</p>
            </div>
            <Link to="/login" className="block bg-rojo-600 text-white font-black py-4 rounded-2xl shadow-lg transition-all uppercase text-sm tracking-widest">Return to Terminal</Link>
          </div>
        ) : (
          <form onSubmit={handleSignup} className="space-y-6">
            {error && <div className="p-4 bg-rojo-600/20 border border-rojo-500 text-rojo-500 text-xs font-bold rounded-xl">{error}</div>}
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">Username (Alias)</label>
              <input 
                required
                type="text" 
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full bg-rojo-950 border border-rojo-900/30 rounded-2xl px-5 py-3 text-white focus:ring-2 ring-rojo-500 outline-none transition-all placeholder-slate-700"
                placeholder="Grid handle..."
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">Email Address</label>
              <input 
                required
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-rojo-950 border border-rojo-900/30 rounded-2xl px-5 py-3 text-white focus:ring-2 ring-rojo-500 outline-none transition-all placeholder-slate-700"
                placeholder="identity@rojos.games"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">Security Key</label>
              <input 
                required
                type="password" 
                value={pass}
                onChange={e => setPass(e.target.value)}
                className="w-full bg-rojo-950 border border-rojo-900/30 rounded-2xl px-5 py-3 text-white focus:ring-2 ring-rojo-500 outline-none transition-all placeholder-slate-700"
                placeholder="••••••••"
              />
            </div>

            <button 
              disabled={loading}
              className="w-full bg-rojo-600 hover:bg-rojo-500 text-white font-black py-4 rounded-2xl shadow-lg shadow-rojo-900/20 transition-all uppercase text-sm tracking-widest disabled:opacity-50"
            >
              {loading ? 'Initializing...' : 'Register Identity'}
            </button>
          </form>
        )}

        {!success && (
          <div className="mt-8 pt-8 border-t border-rojo-900/30 text-center">
            <p className="text-slate-500 text-xs">Already registered? <Link to="/login" className="text-rojo-400 font-black hover:underline">Secure Login</Link></p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SignupPage;
