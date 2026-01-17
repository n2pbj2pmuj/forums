
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppState } from '../AppStateContext';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useAppState();
  const navigate = useNavigate();

  // Redirect automatically if already authenticated or state changes elsewhere
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
      // On success, we set loading to false and navigate immediately
      // This is faster than waiting for the context/useEffect to cycle
      setLoading(false);
      navigate('/');
    } catch (err: any) {
      setLoading(false); // Stop loading ONLY if there is an error
      if (err.message?.toLowerCase().includes('email not confirmed')) {
        setError('Verification pending. Please check your inbox for the activation link.');
      } else if (err.message?.toLowerCase().includes('invalid login credentials')) {
        setError('Invalid email or passphrase. Please verify your credentials.');
      } else {
        setError(err.message || 'Authentication failed. Please check your connection.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-rojo-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-black border border-rojo-900/50 rounded-3xl p-10 shadow-[0_0_50px_rgba(255,0,0,0.1)]">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-rojo-500 neon-red tracking-tighter mb-2 uppercase">ROJOGAMES</h1>
          <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Secure Identity Verification</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && <div className="p-4 bg-rojo-600/20 border border-rojo-500 text-rojo-500 text-xs font-bold rounded-xl leading-relaxed">{error}</div>}
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">Email Address</label>
            <input 
              required
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-rojo-950 border border-rojo-900/30 rounded-2xl px-5 py-3 text-white focus:ring-2 ring-rojo-500 outline-none transition-all placeholder-slate-700"
              placeholder="name@provider.com"
              disabled={loading}
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest">Secret Passphrase</label>
              <Link to="/forgot-password" className="text-[10px] font-black text-rojo-500 uppercase hover:underline">Forgot Key?</Link>
            </div>
            <input 
              required
              type="password" 
              value={pass}
              onChange={e => setPass(e.target.value)}
              className="w-full bg-rojo-950 border border-rojo-900/30 rounded-2xl px-5 py-3 text-white focus:ring-2 ring-rojo-500 outline-none transition-all placeholder-slate-700"
              placeholder="••••••••"
              disabled={loading}
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-rojo-600 hover:bg-rojo-500 text-white font-black py-4 rounded-2xl shadow-lg shadow-rojo-900/20 transition-all uppercase text-sm tracking-widest disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Authenticating...
              </span>
            ) : 'Authorize Session'}
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-rojo-900/30 text-center">
          <p className="text-slate-500 text-xs">New to the grid? <Link to="/signup" className="text-rojo-400 font-black hover:underline">Register Account</Link></p>
        </div>
      </div>
      <p className="mt-8 text-[10px] text-slate-700 font-black uppercase tracking-tighter">Secure Link 44-Rojos-Alpha</p>
    </div>
  );
};

export default LoginPage;
