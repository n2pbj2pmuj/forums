
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../AppStateContext';

const UpdatePasswordPage: React.FC = () => {
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { updatePassword } = useAppState();
  const navigate = useNavigate();

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await updatePassword(pass);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Update failed. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-rojo-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-black border border-rojo-900/50 rounded-3xl p-10 shadow-2xl">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-rojo-500 tracking-tighter mb-2 uppercase leading-none">Update Password</h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-2">Set a new password</p>
        </div>

        <form onSubmit={handleUpdate} className="space-y-8">
          {error && <div className="p-4 bg-rojo-600/20 border border-rojo-500 text-rojo-500 text-xs font-bold rounded-xl leading-relaxed">{error}</div>}
          <div>
            <label className="block text-[10px] font-black uppercase text-slate-500 mb-3 tracking-widest">New Password</label>
            <input 
              required
              type="password" 
              value={pass}
              onChange={e => setPass(e.target.value)}
              className="w-full bg-rojo-950 border border-rojo-900/30 rounded-2xl px-5 py-4 text-white focus:ring-2 ring-rojo-500 outline-none transition-all placeholder-slate-700"
              placeholder="••••••••"
            />
          </div>
          <button 
            disabled={loading}
            className="w-full bg-rojo-600 hover:bg-rojo-500 text-white font-black py-4 rounded-2xl shadow-lg transition-all uppercase text-sm tracking-widest disabled:opacity-50"
          >
            {loading ? 'Updating...' : 'Set Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UpdatePasswordPage;
