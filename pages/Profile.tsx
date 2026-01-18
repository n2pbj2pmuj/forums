import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAppState, censorText } from '../AppStateContext';
import Layout from '../components/Layout';
import { DEFAULT_AVATAR } from '../constants';

const ProfilePage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, users, threads, theme, updateUser } = useAppState();
  const isDark = theme === 'dark';

  // Find user by ID or use current user
  const user = id ? users.find(u => u.id === id) : currentUser;
  
  const [editing, setEditing] = useState(false);
  const [tempBio, setTempBio] = useState('');
  const [showBannerInput, setShowBannerInput] = useState(false);
  const [bannerUrlInput, setBannerUrlInput] = useState('');

  // Sync state with user data on change
  useEffect(() => {
    if (user) {
      setTempBio(user.about || '');
      setBannerUrlInput(user.bannerUrl || '');
    }
  }, [user]);

  if (!user) {
    return (
      <Layout>
        <div className="p-20 text-center text-zinc-500 font-bold uppercase tracking-widest animate-pulse">
          Searching for User Profile...
        </div>
      </Layout>
    );
  }

  const userThreads = threads.filter(t => t.authorId === user.id);
  const isOwnProfile = user.id === currentUser?.id;
  const isBanned = user.status === 'Banned';

  const handleBannerUpdate = async () => {
    await updateUser({ bannerUrl: bannerUrlInput });
    setShowBannerInput(false);
  };

  const handleBioUpdate = async () => {
    await updateUser({ about: tempBio });
    setEditing(false);
  };

  return (
    <Layout>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Profile Header Card */}
        <div className={`rounded-[2.5rem] border overflow-hidden relative shadow-2xl transition-all ${isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-zinc-100 shadow-xl'}`}>
          <div className="h-64 relative bg-zinc-950 group">
             {user.bannerUrl ? (
               <img src={user.bannerUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="" />
             ) : (
               <div className="w-full h-full bg-gradient-to-br from-rojo-950 to-zinc-900 opacity-80"></div>
             )}
             
             {isOwnProfile && (
               <div className="absolute top-6 right-6 flex gap-2">
                  <button onClick={() => setShowBannerInput(!showBannerInput)} className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all">Edit Header</button>
               </div>
             )}

             {showBannerInput && (
               <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-8 z-50">
                 <div className="w-full max-w-sm space-y-4">
                    <h3 className="text-white font-black uppercase text-xs tracking-widest text-center">Header Image URL</h3>
                    <input value={bannerUrlInput} onChange={e => setBannerUrlInput(e.target.value)} className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-6 py-4 text-white text-sm outline-none focus:ring-2 ring-rojo-600 transition-all" placeholder="https://..." />
                    <div className="flex gap-2">
                      <button onClick={handleBannerUpdate} className="flex-1 bg-rojo-600 text-white py-3 rounded-2xl text-[10px] font-black uppercase hover:bg-rojo-500 shadow-xl shadow-rojo-950/20">Save</button>
                      <button onClick={() => setShowBannerInput(false)} className="flex-1 bg-zinc-800 text-zinc-400 py-3 rounded-2xl text-[10px] font-black uppercase">Cancel</button>
                    </div>
                 </div>
               </div>
             )}
          </div>
          
          <div className="px-12 pb-12 flex flex-col md:flex-row items-end gap-8 -mt-20 relative z-10">
            <div className="relative group shrink-0">
               <div className="absolute -inset-1 bg-gradient-to-tr from-rojo-600 to-amber-500 rounded-[2.5rem] blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
               <img 
                 src={user.avatarUrl || DEFAULT_AVATAR} 
                 className={`w-40 h-40 rounded-[2.25rem] border-[10px] shadow-2xl relative object-cover ${isDark ? 'border-[#0a0202]' : 'border-white'}`} 
                 alt="" 
                 onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_AVATAR; }}
               />
               {!isBanned && <div className="absolute bottom-4 right-4 w-6 h-6 bg-emerald-500 rounded-full border-4 border-[#0a0202]"></div>}
            </div>
            
            <div className="flex-1 pb-4 text-center md:text-left">
              <div className="flex flex-wrap items-center gap-4 justify-center md:justify-start">
                <h1 className={`text-4xl font-black tracking-tighter ${isBanned ? 'line-through opacity-40' : ''}`}>{user.displayName}</h1>
                <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${user.role === 'Admin' ? 'bg-rojo-600 text-white shadow-lg shadow-rojo-900/40' : 'bg-zinc-800 text-zinc-500'}`}>{user.role}</span>
              </div>
              <p className="text-rojo-600 font-black uppercase tracking-[0.3em] text-[10px] mt-2">@{user.username}</p>
            </div>

            <div className="flex gap-3 pb-4">
              {isOwnProfile ? (
                <Link to="/settings" className="bg-zinc-100 text-black px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white shadow-xl shadow-zinc-950/20 transition-all">Customize</Link>
              ) : (
                !isBanned && <button onClick={() => navigate(`/messages?user=${user.id}`)} className="bg-rojo-600 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rojo-500 shadow-xl shadow-rojo-900/40 transition-all">Send Message</button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Bio Sidebar */}
          <div className={`rounded-[2rem] p-10 border transition-all ${isDark ? 'bg-zinc-900/30 border-zinc-800' : 'bg-white border-zinc-100 shadow-lg'}`}>
            <div className="flex items-center justify-between mb-8">
               <h3 className="font-black uppercase text-[10px] tracking-[0.4em] text-zinc-500">Personal Bio</h3>
               {isOwnProfile && <button onClick={() => setEditing(!editing)} className="text-rojo-600 font-black uppercase text-[10px] tracking-widest hover:underline transition-all">{editing ? 'Cancel' : 'Edit'}</button>}
            </div>
            
            {editing ? (
              <div className="space-y-4">
                <textarea value={tempBio} onChange={e => setTempBio(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-[1.5rem] p-6 text-sm text-white outline-none focus:ring-2 ring-rojo-600 transition-all" rows={5} placeholder="Write something about yourself..." />
                <button onClick={handleBioUpdate} className="w-full bg-rojo-600 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-rojo-950/10">Save Changes</button>
              </div>
            ) : (
              <div className="space-y-6">
                <p className={`text-sm leading-relaxed font-medium ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  {isBanned ? censorText(user.about || '') : (user.about || "This member hasn't written a bio yet.")}
                </p>
                <div className="pt-6 border-t border-zinc-800/50 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-zinc-500">
                  <span>Joined {new Date(user.joinDate || Date.now()).getFullYear()}</span>
                  <span className="text-rojo-600">{user.postCount || 0} Posts</span>
                </div>
              </div>
            )}
          </div>

          {/* Activity Section */}
          <div className={`lg:col-span-2 rounded-[2rem] p-10 border transition-all ${isDark ? 'bg-zinc-900/30 border-zinc-800' : 'bg-white border-zinc-100 shadow-lg'}`}>
            <h3 className="font-black uppercase text-[10px] tracking-[0.4em] text-zinc-500 mb-8">Thread History</h3>
            <div className="grid grid-cols-1 gap-4">
              {userThreads.length > 0 ? userThreads.map(t => (
                <Link key={t.id} to={`/thread/${t.id}`} className={`group p-6 rounded-[1.5rem] border transition-all hover:scale-[1.01] ${isDark ? 'bg-zinc-950 border-zinc-800 hover:border-rojo-900/50' : 'bg-zinc-50 border-zinc-100 hover:border-rojo-100 shadow-sm'}`}>
                  <div className="flex items-center justify-between gap-4 mb-3">
                    <p className={`font-black text-sm tracking-tight ${isBanned ? 'line-through opacity-40' : 'group-hover:text-rojo-500'}`}>{isBanned ? censorText(t.title) : t.title}</p>
                    <span className="text-rojo-600 text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-rojo-600/10 rounded-full">{t.likes} Likes</span>
                  </div>
                  <div className="flex items-center gap-3 text-[9px] text-zinc-500 font-black uppercase tracking-widest">
                    <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                    <span className="w-1.5 h-1.5 bg-zinc-800 rounded-full"></span>
                    <span>{t.replyCount} REPLIES</span>
                  </div>
                </Link>
              )) : (
                <div className="py-24 text-center border-2 border-dashed border-zinc-800/50 rounded-[1.5rem] opacity-30">
                  <p className="text-[10px] font-black uppercase tracking-[0.4em]">Queue Empty</p>
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