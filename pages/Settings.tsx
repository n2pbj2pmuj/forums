
import React, { useState } from 'react';
import { useAppState } from '../AppStateContext';
import Layout from '../components/Layout';

const SettingsPage: React.FC = () => {
  const { currentUser, updateUser, theme, toggleTheme } = useAppState();
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl || '');
  const [bannerUrl, setBannerUrl] = useState(currentUser?.bannerUrl || '');
  const [about, setAbout] = useState(currentUser?.about || '');
  const [saved, setSaved] = useState(false);

  const isDark = theme === 'dark';

  const handleSave = () => {
    updateUser({ displayName, avatarUrl, bannerUrl, about });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
        <header>
          <h1 className="text-2xl font-black tracking-tight uppercase">Settings</h1>
          <p className="text-zinc-500 text-xs mt-1">Customize your profile and account experience.</p>
        </header>

        <div className={`border rounded-2xl p-8 shadow-sm ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
          <div className="space-y-8">
            <section className="space-y-4">
              <h3 className="font-bold uppercase text-[10px] tracking-widest text-zinc-500">Preferences</h3>
              <div className="flex items-center justify-between p-5 rounded-xl bg-black/20 border border-zinc-800">
                <div>
                  <p className="text-sm font-bold">Dark Mode</p>
                  <p className="text-[11px] text-zinc-500">Easier on the eyes at night.</p>
                </div>
                <button 
                  onClick={toggleTheme}
                  className={`px-5 py-2 rounded-lg font-bold uppercase text-[10px] transition-all ${isDark ? 'bg-rojo-600 text-white' : 'bg-zinc-200 text-black'}`}
                >
                  {isDark ? 'Enabled' : 'Disabled'}
                </button>
              </div>
            </section>

            <section className="space-y-6">
              <h3 className="font-bold uppercase text-[10px] tracking-widest text-zinc-500">Profile Identity</h3>
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-2">Display Name</label>
                    <input 
                      type="text" 
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className={`w-full rounded-xl px-4 py-3 text-sm border outline-none focus:ring-1 ring-rojo-600 ${isDark ? 'bg-black border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-200'}`}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-2">Avatar URL</label>
                    <input 
                      type="text" 
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      placeholder="https://..."
                      className={`w-full rounded-xl px-4 py-3 text-sm border outline-none focus:ring-1 ring-rojo-600 ${isDark ? 'bg-black border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-200'}`}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-2">Banner Image URL</label>
                  <input 
                    type="text" 
                    value={bannerUrl}
                    onChange={(e) => setBannerUrl(e.target.value)}
                    placeholder="https://..."
                    className={`w-full rounded-xl px-4 py-3 text-sm border outline-none focus:ring-1 ring-rojo-600 ${isDark ? 'bg-black border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-200'}`}
                  />
                  <p className="text-[10px] text-zinc-500 mt-2 italic">A wide background image for your profile header.</p>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-2">Bio</label>
                  <textarea 
                    value={about}
                    onChange={(e) => setAbout(e.target.value)}
                    className={`w-full h-32 rounded-xl px-4 py-3 text-sm border outline-none focus:ring-1 ring-rojo-600 ${isDark ? 'bg-black border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-200'}`}
                    placeholder="Tell the community about yourself..."
                  />
                </div>
              </div>
            </section>

            <div className="flex justify-end pt-4">
              <button 
                onClick={handleSave}
                disabled={saved}
                className={`px-8 py-3 rounded-xl font-bold uppercase text-xs transition-all ${saved ? 'bg-emerald-600 text-white' : 'bg-rojo-600 text-white hover:bg-rojo-500 shadow-lg shadow-rojo-900/10'}`}
              >
                {saved ? 'Settings Saved' : 'Save Profile'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SettingsPage;