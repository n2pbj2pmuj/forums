
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
        {/* Profile Card - Removed overflow-hidden to prevent clipping of pop-out elements */}
        <div className={`rounded-3xl border relative ${isDark ? 'bg-black border-rojo-900/40 shadow-2xl' : 'bg-white border-slate-200 shadow-xl'}`}>
          <div className="h-48 relative bg-rojo-950 rounded-t-3xl overflow-hidden">
             {user.bannerUrl ? (
               <img src={user.bannerUrl} className="w-full h-full object-cover opacity-60" alt="" />
             ) : (
               <div className="w-full h-full bg-gradient-to-br from-rojo-950 to-rojo-900/20"></div>
             )}
          </div>
          
          <div className="px-10 pb-10 flex flex-col md:flex-row items-end gap-8 -mt-16 relative z-10">
            <div className="relative group shrink-0">
               <img src={user.avatarUrl} className={`w-36 h-36 rounded-[2rem] border-8 shadow-2xl transition-transform group-hover:scale-105 ${isDark ? 'border-[#0a0202]' : 'border-white'}`} alt="" />
               <div className="absolute inset-0 rounded-[2rem] shadow-inner pointer-events-none"></div>
            </div>
            <div className="flex-1 space-y-1 text-center md:text-left pb-2">
              <h1 className="text-4xl font-black tracking-tighter">{user.displayName}</h1>
              <div className="flex items-center justify-center md:justify-start gap-3">
                <p className="text-rojo-500 font-black uppercase text-xs tracking-widest">@{user.username}</p>
                <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${user.role === 'Admin' ? 'bg-rojo-600 text-white' : 'bg-slate-800 text-slate-400'}`}>{user.role}</span>
              </div>
            </div>
            <div className="flex gap-3 pb-2">
              {isOwnProfile ? (
                <Link to="/settings" className="bg-slate-100 text-black px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all shadow-lg">Settings</Link>
              ) : (
                <button onClick={handleMessage} className="bg-rojo-600 text-white px-10 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rojo-500 transition-all shadow-xl shadow-rojo-500/20">Message</button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-8">
            <div className={`border rounded-[2rem] p-8 shadow-xl transition-all ${isDark ? 'bg-black border-rojo-900/30' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center justify-between mb-6">
                 <h3 className="font-black uppercase text-[10px] tracking-[0.2em] text-slate-500">Bio / About</h3>
                 {isOwnProfile && <button onClick={() => setEditing(!editing)} className="text-rojo-500 text-[10px] font-black uppercase hover:underline">{editing ? 'Cancel' : 'Edit'}</button>}
              </div>
              {editing ? (
                <div className="space-y-4">
                  <textarea value={tempBio} onChange={e => setTempBio(e.target.value)} className="w-full bg-rojo-950/20 border border-rojo-900/50 rounded-2xl p-4 text-sm text-white outline-none focus:ring-2 ring-rojo-500" rows={4} />
                  <button onClick={() => { updateUser({ about: tempBio }); setEditing(false); }} className="w-full bg-rojo-600 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest">Save Changes</button>
                </div>
              ) : (
                <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{user.about || "This member hasn't added a bio yet."}</p>
              )}
              <div className="mt-8 space-y-4 border-t border-rojo-900/10 pt-6">
                 <div className="flex justify-between items-center">
                    <p className="text-[10px] uppercase font-black text-slate-500">Post Count</p>
                    <p className="font-black text-rojo-500">{user.postCount}</p>
                 </div>
                 <div className="flex justify-between items-center">
                    <p className="text-[10px] uppercase font-black text-slate-500">Status</p>
                    <p className={`font-black uppercase text-[10px] ${user.status === 'Active' ? 'text-emerald-500' : 'text-rojo-500'}`}>{user.status}</p>
                 </div>
              </div>
            </div>
          </div>
          <div className={`md:col-span-2 border rounded-[2rem] p-8 shadow-xl transition-all ${isDark ? 'bg-black border-rojo-900/30' : 'bg-white border-slate-200'}`}>
            <h3 className="font-black uppercase text-[10px] tracking-[0.2em] text-slate-500 mb-8">Recent Forum Activity</h3>
            <div className="space-y-4">
              {userThreads.length > 0 ? userThreads.map(t => (
                <Link key={t.id} to={`/thread/${t.id}`} className={`block p-5 rounded-2xl border transition-all hover:scale-[1.01] ${isDark ? 'bg-rojo-950/10 border-rojo-900/10 hover:border-rojo-900/50' : 'bg-slate-50 border-slate-100 hover:border-rojo-200'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-black tracking-tight">{t.title}</p>
                    <span className="text-rojo-500 text-[10px] font-black uppercase">{t.likes} Likes</span>
                  </div>
                  <p className="text-[9px] uppercase font-black text-slate-500 tracking-widest">{new Date(t.createdAt).toLocaleDateString()}</p>
                </Link>
              )) : (
                <div className="py-20 text-center opacity-30">
                  <p className="text-xs font-black uppercase tracking-[0.3em]">No activity to report</p>
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
