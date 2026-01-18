
import React, { useState } from 'react';
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

const SignupPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signup } = useAppState();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setError('');
    setSuccess(false);
    setLoading(true);
    
    try {
      await signup(username.trim(), email.trim(), pass);
      setSuccess(true);
      setUsername('');
      setEmail('');
      setPass('');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#0a0202] border border-rojo-900/50 rounded-2xl p-8 shadow-2xl">
        <div className="flex flex-col items-center text-center mb-8">
          <SplatterIcon />
          <h1 className="text-3xl font-black text-rojo-500 tracking-tight mb-1 uppercase">Register</h1>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Join the RojosGames Community</p>
        </div>

        {success ? (
          <div className="space-y-6 text-center py-4">
            <div className="w-16 h-16 bg-emerald-600/20 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white uppercase mb-2">Account Created</h2>
              <p className="text-slate-400 text-xs leading-relaxed">Registration successful! Please check your email for a verification link to activate your account.</p>
            </div>
            <Link to="/login" className="block bg-rojo-600 text-white font-bold py-3 rounded-lg shadow-lg uppercase text-[11px] tracking-widest">Return to Login</Link>
          </div>
        ) : (
          <form onSubmit={handleSignup} className="space-y-5">
            {error && <div className="p-3 bg-rojo-600/10 border border-rojo-500/50 text-rojo-500 text-[11px] font-bold rounded-lg">{error}</div>}
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1 tracking-widest">Username</label>
              <input 
                required
                type="text" 
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full bg-black border border-rojo-900/30 rounded-lg px-4 py-3 text-white focus:ring-1 ring-rojo-500 outline-none transition-all text-sm"
                placeholder="Forum alias"
                disabled={loading}
              />
            </div>
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
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1 tracking-widest">Password</label>
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
              disabled={loading}
              className="w-full bg-rojo-600 hover:bg-rojo-500 text-white font-bold py-3 rounded-lg shadow-lg transition-all uppercase text-xs tracking-widest disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Create Account'}
            </button>
          </form>
        )}

        {!success && (
          <div className="mt-8 pt-6 border-t border-rojo-900/30 text-center">
            <p className="text-slate-500 text-[11px]">Already a member? <Link to="/login" className="text-rojo-500 font-bold hover:underline">Log in</Link></p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SignupPage;
