
import React, { useState } from 'react';
import { useAppState } from '../AppStateContext';
import Layout from '../components/Layout';

const SettingsPage: React.FC = () => {
  const { currentUser, updateUser, theme, toggleTheme } = useAppState();
  const [displayName, setDisplayName] = useState(currentUser.displayName);
  const [about, setAbout] = useState(currentUser.about || '');
  const [saved, setSaved] = useState(false);

  const isDark = theme === 'dark';

  const handleSave = () => {
    updateUser({ displayName, about });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-500">
        <div>
          <h1 className="text-5xl font-black tracking-tighter uppercase">GRID CONFIG</h1>
          <p className="text-rojo-500 font-bold uppercase text-xs tracking-[0.3em] mt-2">Adjust your identity parameters</p>
        </div>

        <div className={`border rounded-[2.5rem] p-10 shadow-2xl transition-all ${isDark ? 'bg-black border-rojo-900/30' : 'bg-white border-rojo-100'}`}>
          <div className="space-y-10">
            {/* Visuals */}
            <section className="space-y-6">
              <h3 className="font-black uppercase text-[10px] tracking-widest text-slate-500">Interface Preference</h3>
              <div className="flex items-center justify-between p-6 rounded-3xl bg-rojo-950/20 border border-rojo-900/10">
                <div>
                  <p className="font-black text-lg">System Modality</p>
                  <p className="text-xs text-slate-500 font-medium">Switch between Cyber-Red and High-Contrast Light</p>
                </div>
                <button 
                  onClick={toggleTheme}
                  className={`px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all border ${isDark ? 'bg-rojo-600 border-rojo-500 text-white hover:bg-rojo-500 shadow-lg shadow-rojo-900/30' : 'bg-rojo-50 border-rojo-100 text-rojo-600'}`}
                >
                  {isDark ? 'Sync Light' : 'Sync Dark'}
                </button>
              </div>
            </section>

            <div className={`h-[1px] ${isDark ? 'bg-rojo-900/10' : 'bg-slate-100'}`}></div>

            {/* Profile Info */}
            <section className="space-y-8">
              <h3 className="font-black uppercase text-[10px] tracking-widest text-slate-500">Identity Details</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-3 tracking-widest ml-1">Visible Alias</label>
                  <input 
                    type="text" 
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className={`w-full rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-2 ring-rojo-500 border transition-all ${isDark ? 'bg-rojo-950/50 border-rojo-900/30 text-white' : 'bg-rojo-50 border-rojo-100'}`}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-slate-500 mb-3 tracking-widest ml-1">Identity Abstract (Bio)</label>
                  <textarea 
                    value={about}
                    onChange={(e) => setAbout(e.target.value)}
                    className={`w-full h-40 rounded-2xl px-6 py-4 text-sm font-medium outline-none focus:ring-2 ring-rojo-500 border transition-all leading-relaxed ${isDark ? 'bg-rojo-950/50 border-rojo-900/30 text-white' : 'bg-rojo-50 border-rojo-100'}`}
                    placeholder="Describe your role in the grid..."
                  />
                </div>
              </div>
            </section>

            <div className="flex justify-end pt-4">
              <button 
                onClick={handleSave}
                disabled={saved}
                className={`px-12 py-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all flex items-center gap-3 shadow-xl ${saved ? 'bg-emerald-600 text-white scale-105' : 'bg-rojo-600 hover:bg-rojo-500 text-white shadow-rojo-900/40'}`}
              >
                {saved ? (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    Parameters Cached
                  </>
                ) : 'Update Grid Identity'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SettingsPage;
