
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAppState } from '../AppStateContext';
import Layout from '../components/Layout';

const ProfilePage: React.FC = () => {
  const { id } = useParams();
  const { currentUser, users, threads, theme, updateUser } = useAppState();
  const isDark = theme === 'dark';

  const user = id ? users.find(u => u.id === id) : currentUser;
  const [editing, setEditing] = useState(false);
  const [tempBio, setTempBio] = useState(user?.about || '');

  if (!user) return <Layout><div className="p-20 text-center text-slate-500 font-bold uppercase tracking-widest">User Sequence Not Found</div></Layout>;

  const userThreads = threads.filter(t => t.authorId === user.id);
  const isOwnProfile = user.id === currentUser.id;

  const handleSaveBio = () => {
    updateUser({ about: tempBio });
    setEditing(false);
  };

  const simulateUpload = (type: 'pfp' | 'banner') => {
    const url = prompt(`Enter ${type === 'pfp' ? 'Profile Picture' : 'Banner'} URL:`, type === 'pfp' ? user.avatarUrl : (user.bannerUrl || ''));
    if (url) {
      if (type === 'pfp') updateUser({ avatarUrl: url });
      else updateUser({ bannerUrl: url });
    }
  };

  return (
    <Layout>
      <div className="space-y-8 animate-in fade-in duration-500">
        {/* Header Hero */}
        <div className={`rounded-3xl border transition-all overflow-hidden ${isDark ? 'bg-black border-rojo-900/40 shadow-2xl shadow-rojo-900/10' : 'bg-white border-rojo-100 shadow-xl'}`}>
          <div className="h-48 relative bg-rojo-950">
             {user.bannerUrl ? (
               <img src={user.bannerUrl} className="w-full h-full object-cover opacity-60" alt="" />
             ) : (
               <div className="w-full h-full bg-gradient-to-br from-rojo-950 via-black to-rojo-900/30"></div>
             )}
             {isOwnProfile && (
               <button 
                 onClick={() => simulateUpload('banner')}
                 className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/20 hover:bg-rojo-600 transition-colors"
               >
                 Change Cover
               </button>
             )}
          </div>
          
          <div className="px-10 pb-10 flex flex-col md:flex-row items-end gap-8 -mt-16">
            <div className="relative group">
              <img src={user.avatarUrl} className={`w-36 h-36 rounded-3xl border-8 shadow-2xl transition-all ${isDark ? 'border-black' : 'border-white'}`} alt="" />
              {isOwnProfile && (
                <button 
                  onClick={() => simulateUpload('pfp')}
                  className="absolute inset-0 bg-black/60 rounded-3xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                   <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </button>
              )}
              <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-lg ${
                user.role === 'Admin' ? 'bg-rojo-600 border-rojo-400 text-white' : 
                user.role === 'Moderator' ? 'bg-slate-700 border-slate-500 text-white' : 
                'bg-slate-800 border-slate-600 text-white'
              }`}>
                {user.role}
              </div>
            </div>
            
            <div className="flex-1 space-y-2 text-center md:text-left">
              <h1 className="text-4xl font-black tracking-tight">{user.displayName}</h1>
              <div className="flex items-center justify-center md:justify-start gap-3">
                 <p className="text-rojo-500 font-bold text-lg">@{user.username}</p>
                 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]"></span>
                 <p className="text-[10px] font-black uppercase text-slate-500">Citizen Level 4</p>
              </div>
            </div>

            <div className="flex gap-2">
              {isOwnProfile ? (
                <Link to="/settings" className="bg-rojo-600/10 border border-rojo-600/30 text-rojo-400 px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-rojo-600 hover:text-white transition-all">Account Grid</Link>
              ) : (
                <button className="bg-rojo-600 text-white px-8 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-rojo-500 shadow-lg shadow-rojo-900/20 transition-all">Message</button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-6">
            <div className={`border rounded-3xl p-8 shadow-xl ${isDark ? 'bg-black border-rojo-900/30' : 'bg-white border-rojo-100'}`}>
              <div className="flex items-center justify-between mb-6">
                 <h3 className="font-black uppercase text-[10px] tracking-widest text-slate-500">BIOGRAPHY</h3>
                 {isOwnProfile && (
                   <button onClick={() => setEditing(!editing)} className="text-rojo-500 text-[10px] font-black uppercase hover:underline">
                     {editing ? 'Cancel' : 'Update'}
                   </button>
                 )}
              </div>
              
              {editing ? (
                <div className="space-y-3">
                  <textarea 
                    value={tempBio}
                    onChange={e => setTempBio(e.target.value)}
                    className="w-full bg-rojo-950/50 border border-rojo-900/50 rounded-xl p-3 text-sm text-white outline-none focus:ring-1 ring-rojo-500"
                    rows={4}
                  />
                  <button onClick={handleSaveBio} className="w-full bg-rojo-600 text-white py-2 rounded-xl text-xs font-black uppercase">Confirm Edit</button>
                </div>
              ) : (
                <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {user.about || "This user prefers silence over speech. Their bio is currently offline."}
                </p>
              )}

              <div className="mt-8 space-y-4 border-t border-rojo-900/20 pt-6">
                 <ProfileDetail label="Joined Grid" value={new Date(user.joinDate).toLocaleDateString()} />
                 <ProfileDetail label="Post Record" value={user.postCount.toLocaleString()} />
                 <ProfileDetail label="Reputation" value="Excellent" />
              </div>
            </div>
          </div>

          <div className={`md:col-span-2 border rounded-3xl p-8 shadow-xl ${isDark ? 'bg-black border-rojo-900/30' : 'bg-white border-rojo-100'}`}>
            <h3 className="font-black uppercase text-[10px] tracking-widest text-slate-500 mb-6">TRANSMISSION LOG</h3>
            <div className="space-y-4">
              {userThreads.length > 0 ? userThreads.map(t => (
                <Link key={t.id} to={`/thread/${t.id}`} className={`block p-6 rounded-2xl border transition-all ${isDark ? 'bg-rojo-950/20 border-rojo-900/20 hover:border-rojo-500/50 group' : 'bg-rojo-50/50 border-rojo-100 hover:bg-white hover:shadow-md'}`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className={`font-bold text-lg mb-1 group-hover:text-rojo-500 transition-colors ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>{t.title}</p>
                      <p className="text-[10px] text-slate-500 uppercase font-black">{new Date(t.createdAt).toLocaleDateString()} • {t.replyCount} REPLIES</p>
                    </div>
                    <svg className="w-5 h-5 text-rojo-900 group-hover:text-rojo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </div>
                </Link>
              )) : (
                <div className="flex flex-col items-center justify-center py-20 opacity-20">
                  <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
                  <p className="font-black uppercase tracking-tighter text-sm">Silence is the loudest noise.</p>
                </div>
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
    <span className="text-[10px] font-black uppercase text-slate-600 tracking-tighter">{label}</span>
    <span className="text-sm font-bold">{value}</span>
  </div>
);

export default ProfilePage;
