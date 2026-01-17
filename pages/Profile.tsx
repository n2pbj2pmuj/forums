
import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAppState } from '../AppStateContext';
import Layout from '../components/Layout';

const ProfilePage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, users, threads, theme, updateUser } = useAppState();
  const isDark = theme === 'dark';

  const user = id ? users.find(u => u.id === id) : currentUser;
  const [editing, setEditing] = useState(false);
  const [tempBio, setTempBio] = useState(user?.about || '');

  if (!user) return <Layout><div className="p-20 text-center text-slate-500 font-bold uppercase tracking-widest">User Not Found</div></Layout>;

  const userThreads = threads.filter(t => t.authorId === user.id);
  const isOwnProfile = user.id === currentUser?.id;

  const handleSaveBio = () => {
    updateUser({ about: tempBio });
    setEditing(false);
  };

  const simulateUpload = (type: 'pfp' | 'banner') => {
    const url = prompt(`Enter ${type === 'pfp' ? 'Avatar' : 'Banner'} URL:`, type === 'pfp' ? user.avatarUrl : (user.bannerUrl || ''));
    if (url) {
      if (type === 'pfp') updateUser({ avatarUrl: url });
      else updateUser({ bannerUrl: url });
    }
  };

  const handleMessageClick = () => {
    navigate(`/messages?user=${user.id}`);
  };

  return (
    <Layout>
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-black border-rojo-900/40 shadow-2xl' : 'bg-white border-slate-200 shadow-xl'}`}>
          <div className="h-40 relative bg-rojo-950">
             {user.bannerUrl ? (
               <img src={user.bannerUrl} className="w-full h-full object-cover opacity-60" alt="" />
             ) : (
               <div className="w-full h-full bg-gradient-to-br from-rojo-950 to-rojo-900/20"></div>
             )}
             {isOwnProfile && (
               <button onClick={() => simulateUpload('banner')} className="absolute top-4 right-4 bg-black/60 text-white px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest border border-white/10 hover:bg-rojo-600">Change Banner</button>
             )}
          </div>
          
          <div className="px-8 pb-8 flex flex-col md:flex-row items-end gap-6 -mt-12">
            <div className="relative group">
              <img src={user.avatarUrl} className={`w-32 h-32 rounded-2xl border-4 shadow-2xl ${isDark ? 'border-black' : 'border-white'}`} alt="" />
              {isOwnProfile && (
                <button onClick={() => simulateUpload('pfp')} className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                   <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </button>
              )}
            </div>
            
            <div className="flex-1 space-y-1 text-center md:text-left">
              <h1 className="text-3xl font-black tracking-tight">{user.displayName}</h1>
              <p className="text-rojo-500 font-bold">@{user.username}</p>
            </div>

            <div className="flex gap-2 pb-1">
              {isOwnProfile ? (
                <Link to="/settings" className="bg-slate-800 text-white px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-slate-700">Settings</Link>
              ) : (
                <button onClick={handleMessageClick} className="bg-rojo-600 text-white px-8 py-2 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-rojo-500">Message</button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-6">
            <div className={`border rounded-2xl p-6 shadow-xl ${isDark ? 'bg-black border-rojo-900/30' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center justify-between mb-4">
                 <h3 className="font-bold uppercase text-[10px] tracking-widest text-slate-500">About Me</h3>
                 {isOwnProfile && (
                   <button onClick={() => setEditing(!editing)} className="text-rojo-500 text-[10px] font-bold uppercase hover:underline">{editing ? 'Cancel' : 'Edit'}</button>
                 )}
              </div>
              
              {editing ? (
                <div className="space-y-3">
                  <textarea value={tempBio} onChange={e => setTempBio(e.target.value)} className="w-full bg-black border border-rojo-900/50 rounded-lg p-3 text-xs text-white outline-none" rows={3} />
                  <button onClick={handleSaveBio} className="w-full bg-rojo-600 text-white py-2 rounded-lg text-xs font-bold uppercase">Save Bio</button>
                </div>
              ) : (
                <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {user.about || "No bio provided."}
                </p>
              )}

              <div className="mt-6 space-y-3 border-t border-rojo-900/10 pt-4">
                 <ProfileDetail label="Member Since" value={new Date(user.joinDate).toLocaleDateString()} />
                 <ProfileDetail label="Post Count" value={user.postCount.toString()} />
                 <ProfileDetail label="Rank" value={user.role} />
              </div>
            </div>
          </div>

          <div className={`md:col-span-2 border rounded-2xl p-6 shadow-xl ${isDark ? 'bg-black border-rojo-900/30' : 'bg-white border-slate-200'}`}>
            <h3 className="font-bold uppercase text-[10px] tracking-widest text-slate-500 mb-4">Latest Threads</h3>
            <div className="space-y-3">
              {userThreads.length > 0 ? userThreads.map(t => (
                <Link key={t.id} to={`/thread/${t.id}`} className={`block p-4 rounded-xl border transition-all ${isDark ? 'bg-rojo-950/20 border-rojo-900/20 hover:border-rojo-500/50' : 'bg-slate-50 border-slate-100 hover:bg-white'}`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className={`font-bold text-base ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>{t.title}</p>
                      <p className="text-[10px] text-slate-500 uppercase font-bold">{new Date(t.createdAt).toLocaleDateString()} • {t.replyCount} Replies</p>
                    </div>
                    <svg className="w-4 h-4 text-rojo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </div>
                </Link>
              )) : (
                <div className="py-12 text-center text-slate-500 text-xs font-bold uppercase opacity-30">No threads posted yet.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

const ProfileDetail = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between">
    <span className="text-[10px] font-bold uppercase text-slate-600">{label}</span>
    <span className="text-xs font-bold">{value}</span>
  </div>
);

export default ProfilePage;
