
import React, { useState, useEffect } from 'react';
// Fix: Use absolute ESM path to resolve exported member errors
import { useNavigate, Link } from 'https://esm.sh/react-router-dom';
import { useAppState } from '../AppStateContext';

const OFFICIAL_LOGO = 'https://cdn.discordapp.com/attachments/857780833967276052/1462268781035257876/8vNx0KgNUIAAAAXV5kBICzjE2Ar5tOA8BqBAAAgCL7afqZ5F3G5QDfkrzfdCAAVnPneDxuPQMAAACwMBsAAAAAUEAAAAAAgAICAAAAABQQAAAAAKCAAAAAAAAFBAAAAAAoIAAAAABAAQEAAAAACggAAAAAUEAAAAAAgAICAAAAABQQAAAAAKCAAAAAAAAFBAAAAAAoIAAAAABAAQEAAAAACvwB3GyoTaCTr1QAAAAASUVORK5CYII.png?ex=696d936d&is=696c41ed&hm=0494b9036feb3cd27412dfdaa7c7145b3093e0a11ae37613e21fb1b644aae6c1&';

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
        setError('Please verify your email address before logging in.');
      } else if (err.message?.toLowerCase().includes('invalid login credentials')) {
        setError('Incorrect email or password.');
      } else {
        setError(err.message || 'Login failed. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
        <div className="flex flex-col items-center text-center mb-8">
          <img src={OFFICIAL_LOGO} className="h-12 w-12 object-contain mb-4" alt="RojoGames Logo" />
          <h1 className="text-2xl font-black text-white tracking-tight">Rojo<span className="text-rojo-600">Games</span></h1>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mt-1">Community Login</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && <div className="p-3 bg-rojo-600/10 border border-rojo-600/20 text-rojo-500 text-xs font-bold rounded-lg text-center">{error}</div>}
          
          <div>
            <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-1.5 tracking-wider">Email</label>
            <input 
              required
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-1 ring-rojo-600 outline-none transition-all text-sm"
              placeholder="Enter your email"
              disabled={loading}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[10px] font-bold uppercase text-zinc-500 tracking-wider">Password</label>
              <Link to="/forgot-password" title="Recover Password" className="text-[10px] font-bold text-rojo-600 uppercase hover:underline">Forgot?</Link>
            </div>
            <input 
              required
              type="password" 
              value={pass}
              onChange={e => setPass(e.target.value)}
              className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white focus:ring-1 ring-rojo-600 outline-none transition-all text-sm"
              placeholder="••••••••"
              disabled={loading}
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-rojo-600 hover:bg-rojo-500 text-white font-bold py-3 rounded-xl shadow-lg transition-all uppercase text-xs tracking-widest disabled:opacity-50 mt-2"
          >
            {loading ? 'Processing...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-zinc-800 text-center">
          <p className="text-zinc-500 text-xs">New to the platform? <Link to="/signup" className="text-rojo-600 font-bold hover:underline">Register now</Link></p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
