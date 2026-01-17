
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
      <div className="max-w-3xl mx-auto space-y-8">
        <h1 className="text-4xl font-black tracking-tight">Account Settings</h1>

        <div className={`border rounded-3xl p-8 transition-all ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="space-y-8">
            {/* Visuals */}
            <section className="space-y-4">
              <h3 className="font-black uppercase text-xs tracking-widest text-slate-500">Preferences</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold">Interface Theme</p>
                  <p className="text-xs text-slate-500">Toggle between Cyber-Dark and Classic-Light</p>
                </div>
                <button 
                  onClick={toggleTheme}
                  className={`px-6 py-2 rounded-xl font-bold transition-all border ${isDark ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400' : 'bg-slate-100 border-slate-200 text-slate-600'}`}
                >
                  {isDark ? 'Switch to Light' : 'Switch to Dark'}
                </button>
              </div>
            </section>

            <div className={`h-[1px] ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}></div>

            {/* Profile Info */}
            <section className="space-y-6">
              <h3 className="font-black uppercase text-xs tracking-widest text-slate-500">Profile Information</h3>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Display Name</label>
                <input 
                  type="text" 
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className={`w-full rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:ring-2 ring-indigo-500 border transition-all ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-widest">Bio / About Me</label>
                <textarea 
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  className={`w-full h-32 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 ring-indigo-500 border transition-all ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`}
                  placeholder="Tell the community about yourself..."
                />
              </div>
            </section>

            <div className="flex justify-end pt-4">
              <button 
                onClick={handleSave}
                className={`px-10 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${saved ? 'bg-emerald-600 text-white' : (isDark ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700')}`}
              >
                {saved ? (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    Saved Successfully
                  </>
                ) : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SettingsPage;
