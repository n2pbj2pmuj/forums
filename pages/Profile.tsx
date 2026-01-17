
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

  const handleMessage = () => {
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
          </div>
          
          <div className="px-8 pb-8 flex flex-col md:flex-row items-end gap-6 -mt-12">
            <img src={user.avatarUrl} className={`w-32 h-32 rounded-2xl border-4 shadow-2xl ${isDark ? 'border-black' : 'border-white'}`} alt="" />
            <div className="flex-1 space-y-1 text-center md:text-left">
              <h1 className="text-3xl font-black tracking-tight">{user.displayName}</h1>
              <p className="text-rojo-500 font-bold">@{user.username}</p>
            </div>
            <div className="flex gap-2 pb-1">
              {isOwnProfile ? (
                <Link to="/settings" className="bg-slate-800 text-white px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-slate-700">Settings</Link>
              ) : (
                <button onClick={handleMessage} className="bg-rojo-600 text-white px-8 py-2 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-rojo-500">Message</button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-6">
            <div className={`border rounded-2xl p-6 shadow-xl ${isDark ? 'bg-black border-rojo-900/30' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center justify-between mb-4">
                 <h3 className="font-bold uppercase text-[10px] tracking-widest text-slate-500">About Me</h3>
                 {isOwnProfile && <button onClick={() => setEditing(!editing)} className="text-rojo-500 text-[10px] font-bold uppercase">{editing ? 'Cancel' : 'Edit'}</button>}
              </div>
              {editing ? (
                <div className="space-y-3">
                  <textarea value={tempBio} onChange={e => setTempBio(e.target.value)} className="w-full bg-black border border-rojo-900/50 rounded-lg p-3 text-xs text-white outline-none" rows={3} />
                  <button onClick={() => { updateUser({ about: tempBio }); setEditing(false); }} className="w-full bg-rojo-600 text-white py-2 rounded-lg text-xs font-bold uppercase">Save</button>
                </div>
              ) : (
                <p className="text-sm leading-relaxed text-slate-400">{user.about || "No bio provided."}</p>
              )}
              <div className="mt-6 space-y-3 border-t border-rojo-900/10 pt-4">
                 <p className="text-[10px] uppercase font-bold text-slate-500">Post Count: {user.postCount}</p>
                 <p className="text-[10px] uppercase font-bold text-slate-500">Rank: {user.role}</p>
              </div>
            </div>
          </div>
          <div className={`md:col-span-2 border rounded-2xl p-6 shadow-xl ${isDark ? 'bg-black border-rojo-900/30' : 'bg-white border-slate-200'}`}>
            <h3 className="font-bold uppercase text-[10px] tracking-widest text-slate-500 mb-4">Activity</h3>
            <div className="space-y-3">
              {userThreads.length > 0 ? userThreads.map(t => (
                <Link key={t.id} to={`/thread/${t.id}`} className={`block p-4 rounded-xl border transition-all ${isDark ? 'bg-rojo-950/20 border-rojo-900/20' : 'bg-slate-50 border-slate-100'}`}>
                  <p className="font-bold">{t.title}</p>
                  <p className="text-[9px] uppercase font-bold text-slate-500">{new Date(t.createdAt).toLocaleDateString()}</p>
                </Link>
              )) : <p className="p-10 text-center text-xs opacity-30 font-bold uppercase">No Activity</p>}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProfilePage;
