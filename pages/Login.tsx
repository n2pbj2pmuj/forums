
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppState } from '../AppStateContext';

const LoginPage: React.FC = () => {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const { login } = useAppState();
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login(user);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-rojo-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-black border border-rojo-900/50 rounded-3xl p-10 shadow-[0_0_50px_rgba(255,0,0,0.1)]">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-rojo-500 neon-red tracking-tighter mb-2">ROJOGAMES</h1>
          <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Forum Authentication</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">Username</label>
            <input 
              required
              type="text" 
              value={user}
              onChange={e => setUser(e.target.value)}
              className="w-full bg-rojo-950 border border-rojo-900/30 rounded-2xl px-5 py-3 text-white focus:ring-2 ring-rojo-500 outline-none transition-all placeholder-slate-700"
              placeholder="Enter your alias..."
            />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">Security Code</label>
            <input 
              required
              type="password" 
              value={pass}
              onChange={e => setPass(e.target.value)}
              className="w-full bg-rojo-950 border border-rojo-900/30 rounded-2xl px-5 py-3 text-white focus:ring-2 ring-rojo-500 outline-none transition-all placeholder-slate-700"
              placeholder="••••••••"
            />
          </div>

          <button className="w-full bg-rojo-600 hover:bg-rojo-500 text-white font-black py-4 rounded-2xl shadow-lg shadow-rojo-900/20 transition-all uppercase text-sm tracking-widest">
            Authorize Session
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
