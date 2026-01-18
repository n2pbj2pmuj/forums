
import React, { useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAppState, censorText } from '../AppStateContext';
import Layout from '../components/Layout';
import { DEFAULT_AVATAR } from '../constants';

const ProfilePage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, users, threads, theme, updateUser } = useAppState();
  const isDark = theme === 'dark';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const user = id ? users.find(u => u.id === id) : currentUser;
  const [editing, setEditing] = useState(false);
  const [tempBio, setTempBio] = useState(user?.about || '');

  if (!user) return <Layout><div className="p-20 text-center text-slate-500 font-bold uppercase tracking-widest">User Not Found</div></Layout>;

  const userThreads = threads.filter(t => t.authorId === user.id);
  const isOwnProfile = user.id === currentUser?.id;
  const isBanned = user.status === 'Banned';

  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => updateUser({ bannerUrl: ev.target?.result as string });
      reader.readAsDataURL(file);
    }
  };

  return (
    <Layout>
      <div className="space-y-8 animate-in fade-in duration-700">
        <div className={`rounded-[2.5rem] border overflow-hidden relative ${isDark ? 'bg-black border-rojo-900/30' : 'bg-white border-slate-100 shadow-xl'}`}>
          <div className="h-64 relative bg-rojo-950/40 group">
             {user.bannerUrl ? (
               <img src={user.bannerUrl} className="w-full h-full object-cover" alt="" />
             ) : (
               <div className="w-full h-full bg-gradient-to-br from-rojo-950 to-rojo-900/20"></div>
             )}
             {isOwnProfile && (
               <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                  <input type="file" ref={fileInputRef} onChange={handleBannerUpload} className="hidden" accept="image/*" />
                  <button onClick={() => fileInputRef.current?.click()} className="bg-white text-black px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-2xl">Change Banner</button>
               </div>
             )}
          </div>
          
          <div className="px-12 pb-12 flex flex-col md:flex-row items-end gap-8 -mt-20 relative z-10">
            <div className="relative group shrink-0">
               <img src={isBanned ? DEFAULT_AVATAR : user.avatarUrl} className={`w-40 h-40 rounded-[2.5rem] border-[10px] shadow-2xl transition-transform group-hover:scale-105 ${isDark ? 'border-[#050101]' : 'border-white'}`} alt="" />
            </div>
            <div className="flex-1 space-y-2 text-center md:text-left pb-4">
              <h1 className={`text-5xl font-black tracking-tighter ${isBanned ? 'line-through opacity-50' : ''}`}>{user.displayName}</h1>
              <div className="flex items-center justify-center md:justify-start gap-4">
                <p className="text-rojo-600 font-black uppercase text-xs tracking-[0.2em]">@{user.username}</p>
                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em] ${user.role === 'Admin' ? 'bg-rojo-600 text-white' : 'bg-slate-800 text-slate-400'}`}>{user.role}</span>
              </div>
            </div>
            <div className="flex gap-4 pb-4">
              {isOwnProfile ? (
                <Link to="/settings" className="bg-slate-900 text-white px-10 py-4 rounded-3xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-800 transition-all">Settings</Link>
              ) : (
                !isBanned && <button onClick={() => navigate(`/messages?user=${user.id}`)} className="bg-rojo-600 text-white px-10 py-4 rounded-3xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-rojo-500 transition-all shadow-xl shadow-rojo-500/30">Message</button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="space-y-8">
            <div className={`border rounded-[2.5rem] p-10 shadow-lg ${isDark ? 'bg-black/20 border-rojo-900/20' : 'bg-white border-slate-100'}`}>
              <div className="flex items-center justify-between mb-8">
                 <h3 className="font-black uppercase text-[10px] tracking-[0.3em] text-slate-500">Biography</h3>
                 {isOwnProfile && <button onClick={() => setEditing(!editing)} className="text-rojo-500 text-[10px] font-black uppercase tracking-widest hover:underline">{editing ? 'Cancel' : 'Edit'}</button>}
              </div>
              {editing ? (
                <div className="space-y-6">
                  <textarea value={tempBio} onChange={e => setTempBio(e.target.value)} className="w-full bg-rojo-950/20 border border-rojo-900/50 rounded-3xl p-6 text-sm text-white outline-none focus:ring-2 ring-rojo-500" rows={5} />
                  <button onClick={() => { updateUser({ about: tempBio }); setEditing(false); }} className="w-full bg-rojo-600 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-rojo-600/20">Update Bio</button>
                </div>
              ) : (
                <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {isBanned ? censorText(user.about || '') : (user.about || "This user is a man of mystery. No bio available.")}
                </p>
              )}
            </div>
          </div>
          <div className={`md:col-span-2 border rounded-[2.5rem] p-10 shadow-lg ${isDark ? 'bg-black/20 border-rojo-900/20' : 'bg-white border-slate-100'}`}>
            <h3 className="font-black uppercase text-[10px] tracking-[0.3em] text-slate-500 mb-8">Recent Topics</h3>
            <div className="space-y-4">
              {userThreads.length > 0 ? userThreads.map(t => (
                <Link key={t.id} to={`/thread/${t.id}`} className={`block p-6 rounded-3xl border transition-all hover:translate-x-2 ${isDark ? 'bg-rojo-950/5 border-rojo-900/10 hover:border-rojo-500/50' : 'bg-slate-50/50 border-slate-100 hover:border-rojo-200'}`}>
                  <div className="flex items-center justify-between">
                    <p className={`font-black tracking-tight text-lg ${isBanned ? 'line-through opacity-50' : ''}`}>{isBanned ? censorText(t.title) : t.title}</p>
                    <span className="text-rojo-500 text-[9px] font-black uppercase tracking-widest bg-rojo-500/5 px-3 py-1 rounded-full">{t.likes} Likes</span>
                  </div>
                  <div className="flex items-center gap-4 mt-3">
                    <span className="text-[9px] uppercase font-black text-slate-500 tracking-widest">In General Discussion</span>
                    <span className="w-1 h-1 bg-slate-800 rounded-full"></span>
                    <span className="text-[9px] uppercase font-black text-slate-500 tracking-widest">{new Date(t.createdAt).toLocaleDateString()}</span>
                  </div>
                </Link>
              )) : (
                <div className="py-20 text-center opacity-20">
                  <p className="text-xs font-black uppercase tracking-[0.4em]">Quiet as a grave.</p>
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
