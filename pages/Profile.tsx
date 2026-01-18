
import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAppState, censorText } from '../AppStateContext';
import Layout from '../components/Layout';
import { DEFAULT_AVATAR } from '../constants';

const ProfilePage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, users, threads, theme, updateUser } = useAppState();
  const isDark = theme === 'dark';

  const user = id ? users.find(u => u.id === id) : currentUser;
  const [editing, setEditing] = useState(false);
  const [tempBio, setTempBio] = useState(user?.about || '');
  const [showBannerInput, setShowBannerInput] = useState(false);
  const [bannerUrlInput, setBannerUrlInput] = useState(user?.bannerUrl || '');

  if (!user) return <Layout><div className="p-20 text-center text-zinc-500 font-bold">User Not Found</div></Layout>;

  const userThreads = threads.filter(t => t.authorId === user.id);
  const isOwnProfile = user.id === currentUser?.id;
  const isBanned = user.status === 'Banned';

  const handleBannerUpdate = () => {
    updateUser({ bannerUrl: bannerUrlInput });
    setShowBannerInput(false);
  };

  return (
    <Layout>
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* Banner Section */}
        <div className={`rounded-3xl border overflow-hidden relative ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'}`}>
          <div className="h-56 relative bg-zinc-800 group">
             {user.bannerUrl ? (
               <img src={user.bannerUrl} className="w-full h-full object-cover" alt="" />
             ) : (
               <div className="w-full h-full bg-gradient-to-r from-zinc-800 to-zinc-900"></div>
             )}
             {isOwnProfile && (
               <div className="absolute top-4 right-4">
                  <button 
                    onClick={() => setShowBannerInput(!showBannerInput)} 
                    className="bg-white/90 text-black px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider shadow-lg hover:bg-white transition"
                  >
                    Edit Banner
                  </button>
               </div>
             )}
             {showBannerInput && isOwnProfile && (
               <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-6 z-20">
                 <div className="w-full max-w-sm bg-zinc-900 p-6 rounded-2xl border border-zinc-800 shadow-2xl">
                    <h3 className="text-xs font-bold uppercase mb-4">Update Banner URL</h3>
                    <input 
                      type="text" 
                      value={bannerUrlInput} 
                      onChange={e => setBannerUrlInput(e.target.value)} 
                      placeholder="Paste image URL here..."
                      className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2 text-sm text-white mb-4 outline-none focus:ring-1 ring-rojo-600"
                    />
                    <div className="flex gap-2">
                      <button onClick={handleBannerUpdate} className="flex-1 bg-rojo-600 text-white py-2 rounded-lg text-xs font-bold uppercase">Save</button>
                      <button onClick={() => setShowBannerInput(false)} className="flex-1 bg-zinc-800 text-zinc-400 py-2 rounded-lg text-xs font-bold uppercase">Cancel</button>
                    </div>
                 </div>
               </div>
             )}
          </div>
          
          <div className="px-10 pb-10 flex flex-col md:flex-row items-end gap-6 -mt-16 relative z-10">
            <div className="relative shrink-0">
               <img 
                 src={isBanned ? DEFAULT_AVATAR : user.avatarUrl} 
                 className={`w-32 h-32 rounded-2xl border-8 shadow-xl ${isDark ? 'border-zinc-950' : 'border-white'}`} 
                 alt="" 
               />
               {!isBanned && <div className="absolute bottom-2 right-2 w-4 h-4 bg-emerald-500 rounded-full border-4 border-zinc-950"></div>}
            </div>
            <div className="flex-1 space-y-1 text-center md:text-left pb-2">
              <h1 className={`text-3xl font-black tracking-tight ${isBanned ? 'line-through opacity-50' : ''}`}>{user.displayName}</h1>
              <div className="flex items-center justify-center md:justify-start gap-3">
                <p className="text-rojo-600 font-bold text-sm">@{user.username}</p>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${user.role === 'Admin' ? 'bg-rojo-600 text-white' : 'bg-zinc-800 text-zinc-400'}`}>{user.role}</span>
              </div>
            </div>
            <div className="flex gap-3 pb-2">
              {isOwnProfile ? (
                <Link to="/settings" className="bg-zinc-800 text-white px-6 py-2.5 rounded-xl text-xs font-bold uppercase hover:bg-zinc-700 transition">Settings</Link>
              ) : (
                !isBanned && <button onClick={() => navigate(`/messages?user=${user.id}`)} className="bg-rojo-600 text-white px-6 py-2.5 rounded-xl text-xs font-bold uppercase hover:bg-rojo-500 transition shadow-lg shadow-rojo-900/20">Message</button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-6">
            <div className={`border rounded-2xl p-8 shadow-sm ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
              <div className="flex items-center justify-between mb-6">
                 <h3 className="font-bold uppercase text-[10px] tracking-widest text-zinc-500">About Me</h3>
                 {isOwnProfile && <button onClick={() => setEditing(!editing)} className="text-rojo-600 text-[10px] font-bold uppercase hover:underline">{editing ? 'Cancel' : 'Edit'}</button>}
              </div>
              {editing ? (
                <div className="space-y-4">
                  <textarea value={tempBio} onChange={e => setTempBio(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-xl p-4 text-sm text-white outline-none focus:ring-1 ring-rojo-600" rows={4} />
                  <button onClick={() => { updateUser({ about: tempBio }); setEditing(false); }} className="w-full bg-rojo-600 text-white py-2.5 rounded-xl text-xs font-bold uppercase">Update Bio</button>
                </div>
              ) : (
                <p className={`text-sm leading-relaxed ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  {isBanned ? censorText(user.about || '') : (user.about || "No information shared.")}
                </p>
              )}
            </div>
          </div>

          <div className={`md:col-span-2 border rounded-2xl p-8 shadow-sm ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
            <h3 className="font-bold uppercase text-[10px] tracking-widest text-zinc-500 mb-6">Recent Activity</h3>
            <div className="space-y-3">
              {userThreads.length > 0 ? userThreads.map(t => (
                <Link key={t.id} to={`/thread/${t.id}`} className={`block p-4 rounded-xl border transition-all ${isDark ? 'bg-zinc-800/20 border-zinc-800 hover:border-zinc-700' : 'bg-zinc-50 border-zinc-100 hover:border-zinc-200'}`}>
                  <div className="flex items-center justify-between">
                    <p className={`font-bold text-sm ${isBanned ? 'line-through opacity-50' : ''}`}>{isBanned ? censorText(t.title) : t.title}</p>
                    <span className="text-rojo-600 text-[10px] font-bold uppercase">{t.likes} Likes</span>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-zinc-500 uppercase font-bold">
                    <span>Topic</span>
                    <span className="w-1 h-1 bg-zinc-700 rounded-full"></span>
                    <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                  </div>
                </Link>
              )) : (
                <div className="py-12 text-center opacity-30">
                  <p className="text-xs font-bold uppercase">No recent activity.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProfilePage;