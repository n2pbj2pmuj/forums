
import React, { useState } from 'react';
import { useAppState } from '../AppStateContext';
import Layout from '../components/Layout';

const SettingsPage: React.FC = () => {
  const { currentUser, updateUser, theme, toggleTheme } = useAppState();
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [about, setAbout] = useState(currentUser?.about || '');
  const [saved, setSaved] = useState(false);

  const isDark = theme === 'dark';

  const handleSave = () => {
    updateUser({ displayName, about });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500">
        <header>
          <h1 className="text-3xl font-black tracking-tight uppercase">Account Settings</h1>
          <p className="text-rojo-500 font-bold uppercase text-[10px] tracking-widest mt-1">Manage your forum presence</p>
        </header>

        <div className={`border rounded-2xl p-8 shadow-xl ${isDark ? 'bg-black border-rojo-900/30' : 'bg-white border-slate-200'}`}>
          <div className="space-y-8">
            <section className="space-y-4">
              <h3 className="font-bold uppercase text-[10px] tracking-widest text-slate-500">Apperance</h3>
              <div className="flex items-center justify-between p-5 rounded-xl bg-slate-800/20 border border-slate-800/30">
                <div>
                  <p className="font-bold">Dark Mode</p>
                  <p className="text-[11px] text-slate-500">Toggle the visual theme of the forum</p>
                </div>
                <button 
                  onClick={toggleTheme}
                  className={`px-6 py-2 rounded-lg font-bold uppercase text-[10px] transition-all ${isDark ? 'bg-rojo-600 text-white' : 'bg-slate-200 text-black'}`}
                >
                  {isDark ? 'Dark Theme' : 'Light Theme'}
                </button>
              </div>
            </section>

            <section className="space-y-6">
              <h3 className="font-bold uppercase text-[10px] tracking-widest text-slate-500">Public Info</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-2">Display Name</label>
                  <input 
                    type="text" 
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className={`w-full rounded-lg px-4 py-3 text-sm border outline-none focus:ring-1 ring-rojo-500 ${isDark ? 'bg-rojo-950 border-rojo-900/30 text-white' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-2">Biography</label>
                  <textarea 
                    value={about}
                    onChange={(e) => setAbout(e.target.value)}
                    className={`w-full h-32 rounded-lg px-4 py-3 text-sm border outline-none focus:ring-1 ring-rojo-500 ${isDark ? 'bg-rojo-950 border-rojo-900/30 text-white' : 'bg-slate-50 border-slate-200'}`}
                    placeholder="Tell us about yourself..."
                  />
                </div>
              </div>
            </section>

            <div className="flex justify-end pt-4">
              <button 
                onClick={handleSave}
                disabled={saved}
                className={`px-8 py-3 rounded-lg font-bold uppercase text-xs transition-all ${saved ? 'bg-emerald-600 text-white' : 'bg-rojo-600 text-white hover:bg-rojo-500'}`}
              >
                {saved ? 'Settings Saved' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SettingsPage;
