
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppState } from '../AppStateContext';

const SplatterIcon = () => (
  <svg className="w-10 h-10 text-rojo-600 mb-2 drop-shadow-[0_0_8px_rgba(255,0,0,0.6)]" viewBox="0 0 100 100" fill="currentColor">
    <circle cx="50" cy="50" r="20" />
    <circle cx="35" cy="40" r="12" />
    <circle cx="65" cy="45" r="10" />
    <circle cx="55" cy="65" r="14" />
    <circle cx="40" cy="60" r="8" />
    <circle cx="25" cy="50" r="6" />
    <circle cx="75" cy="55" r="7" />
    <circle cx="45" cy="25" r="5" />
    <circle cx="60" cy="30" r="6" />
  </svg>
);

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useAppState();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    
    setError('');
    setLoading(true);
    
    try {
      await login(email, pass);
      setLoading(false);
      navigate('/');
    } catch (err: any) {
      setLoading(false);
      if (err.message?.toLowerCase().includes('email not confirmed')) {
        setError('Verification pending. Please check your inbox for the activation link.');
      } else if (err.message?.toLowerCase().includes('invalid login credentials')) {
        setError('Invalid email or password. Please try again.');
      } else {
        setError(err.message || 'Authentication failed. Please check your connection.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#0a0202] border border-rojo-900/50 rounded-2xl p-8 shadow-2xl">
        <div className="flex flex-col items-center text-center mb-8">
          <SplatterIcon />
          <h1 className="text-3xl font-black text-rojo-500 tracking-tight mb-1">RojosGames</h1>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Forum Member Login</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          {error && <div className="p-3 bg-rojo-600/10 border border-rojo-500/50 text-rojo-500 text-[11px] font-bold rounded-lg">{error}</div>}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1 tracking-widest">Email Address</label>
            <input 
              required
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-black border border-rojo-900/30 rounded-lg px-4 py-3 text-white focus:ring-1 ring-rojo-500 outline-none transition-all text-sm"
              placeholder="email@example.com"
              disabled={loading}
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-widest">Password</label>
              <Link to="/forgot-password" title="Recover Password" className="text-[10px] font-bold text-rojo-500 uppercase hover:underline">Forgot?</Link>
            </div>
            <input 
              required
              type="password" 
              value={pass}
              onChange={e => setPass(e.target.value)}
              className="w-full bg-black border border-rojo-900/30 rounded-lg px-4 py-3 text-white focus:ring-1 ring-rojo-500 outline-none transition-all text-sm"
              placeholder="••••••••"
              disabled={loading}
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-rojo-600 hover:bg-rojo-500 text-white font-bold py-3 rounded-lg shadow-lg transition-all uppercase text-xs tracking-widest disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-rojo-900/30 text-center">
          <p className="text-slate-500 text-[11px]">New here? <Link to="/signup" className="text-rojo-500 font-bold hover:underline">Create an account</Link></p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
