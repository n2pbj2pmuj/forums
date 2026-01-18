
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAppState, censorText } from '../AppStateContext';
import Layout from '../components/Layout';
import { DEFAULT_AVATAR } from '../constants';

const ProfilePage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, users, threads, theme, updateUser, sendFriendRequest, friendRequests, friends, removeFriend, blocks, blockUser, unblockUser, cancelFriendRequest } = useAppState();
  const isDark = theme === 'dark';

  const user = id ? users.find(u => u.id === id) : currentUser;
  
  const [editing, setEditing] = useState(false);
  const [tempBio, setTempBio] = useState('');

  useEffect(() => {
    if (user) setTempBio(user.about || '');
  }, [user]);

  const friendshipState = useMemo(() => {
    if (!user || !currentUser || user.id === currentUser.id) return null;
    
    const isFriend = friends.some(f => (f.user_id === user.id && f.friend_id === currentUser.id) || (f.friend_id === user.id && f.user_id === currentUser.id));
    if (isFriend) return 'FRIENDS';

    const sentReq = friendRequests.find(r => r.sender_id === currentUser.id && r.receiver_id === user.id && r.status === 'pending');
    if (sentReq) return 'PENDING';

    const receivedReq = friendRequests.find(r => r.receiver_id === currentUser.id && r.sender_id === user.id && r.status === 'pending');
    if (receivedReq) return 'ACCEPT';

    return 'ADD';
  }, [user, currentUser, friends, friendRequests]);

  const isBlocked = useMemo(() => blocks.some(b => b.blocked_id === user?.id), [blocks, user]);

  if (!user) return <Layout><div className="p-20 text-center text-zinc-500 font-bold uppercase tracking-widest animate-pulse">Searching for User Profile...</div></Layout>;

  const userThreads = threads.filter(t => t.authorId === user.id);
  const isOwnProfile = user.id === currentUser?.id;
  const isBanned = user.status === 'Banned';

  return (
    <Layout>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className={`rounded-[2.5rem] border overflow-hidden relative shadow-2xl transition-all ${isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-zinc-100 shadow-xl'}`}>
          <div className="h-64 relative bg-zinc-950 group">
             {user.bannerUrl ? <img src={user.bannerUrl} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full bg-gradient-to-br from-rojo-950 to-zinc-900 opacity-80"></div>}
          </div>
          <div className="px-12 pb-12 flex flex-col md:flex-row items-end gap-8 -mt-20 relative z-10">
            <div className="relative shrink-0">
               <img src={user.avatarUrl || DEFAULT_AVATAR} className={`w-40 h-40 rounded-[2.25rem] border-[10px] shadow-2xl relative object-cover ${isDark ? 'border-[#0a0202]' : 'border-white'}`} alt="" />
               {!isBanned && <div className="absolute bottom-4 right-4 w-6 h-6 bg-emerald-500 rounded-full border-4 border-[#0a0202]"></div>}
            </div>
            <div className="flex-1 pb-4 text-center md:text-left">
              <div className="flex flex-wrap items-center gap-4 justify-center md:justify-start">
                <h1 className={`text-4xl font-black tracking-tighter ${isBanned ? 'line-through opacity-40' : ''}`}>{user.displayName}</h1>
                <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${user.role === 'Admin' ? 'bg-rojo-600 text-white' : 'bg-zinc-800 text-zinc-500'}`}>{user.role}</span>
              </div>
              <p className="text-rojo-600 font-black uppercase tracking-[0.3em] text-[10px] mt-2">@{user.username}</p>
            </div>
            <div className="flex flex-wrap gap-2 pb-4 justify-center md:justify-end">
              {isOwnProfile ? (
                <Link to="/settings" className="bg-zinc-100 text-black px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all">Customize</Link>
              ) : !isBanned && (
                <>
                  {isBlocked ? (
                    <button onClick={() => unblockUser(user.id)} className="bg-emerald-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-all">Unblock User</button>
                  ) : (
                    <>
                      {friendshipState === 'ADD' && <button onClick={() => sendFriendRequest(user.id)} className="bg-emerald-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-all">Add Friend</button>}
                      {friendshipState === 'PENDING' && <button onClick={() => cancelFriendRequest(user.id)} className="bg-zinc-800 text-zinc-300 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-700 transition-all">Cancel Request</button>}
                      {friendshipState === 'ACCEPT' && <button onClick={() => navigate('/messages')} className="bg-rojo-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest">Review Request</button>}
                      {friendshipState === 'FRIENDS' && <button onClick={() => removeFriend(user.id)} className="bg-zinc-800 text-rojo-500 border border-zinc-700 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rojo-600 hover:text-white transition-all">Unfriend</button>}
                      <button onClick={() => blockUser(user.id)} className="bg-zinc-950 text-rojo-600 border border-rojo-950 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rojo-600 hover:text-white transition-all">Block</button>
                      <button onClick={() => navigate(`/messages?user=${user.id}`)} className="bg-rojo-600 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rojo-500 transition-all">Message</button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className={`rounded-[2rem] p-10 border transition-all ${isDark ? 'bg-zinc-900/30 border-zinc-800' : 'bg-white border-zinc-100 shadow-lg'}`}>
            <div className="flex items-center justify-between mb-8"><h3 className="font-black uppercase text-[10px] tracking-[0.4em] text-zinc-500">Bio</h3>{isOwnProfile && <button onClick={() => setEditing(!editing)} className="text-rojo-600 font-black uppercase text-[10px] tracking-widest">{editing ? 'Cancel' : 'Edit'}</button>}</div>
            {editing ? (
              <div className="space-y-4"><textarea value={tempBio} onChange={e => setTempBio(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-[1.5rem] p-6 text-sm text-white outline-none" rows={5} /><button onClick={() => { updateUser({about: tempBio}); setEditing(false); }} className="w-full bg-rojo-600 text-white py-4 rounded-2xl text-[10px] font-black uppercase">Save</button></div>
            ) : <p className="text-sm font-medium text-zinc-400 leading-relaxed">{isBanned ? censorText(user.about || '') : (user.about || "Mysterious member...")}</p>}
          </div>
          <div className={`lg:col-span-2 rounded-[2rem] p-10 border transition-all ${isDark ? 'bg-zinc-900/30 border-zinc-800' : 'bg-white border-zinc-100 shadow-lg'}`}>
             <h3 className="font-black uppercase text-[10px] tracking-[0.4em] text-zinc-500 mb-8">Threads Created</h3>
             <div className="grid grid-cols-1 gap-4">
              {userThreads.length > 0 ? userThreads.map(t => (
                <Link key={t.id} to={`/thread/${t.id}`} className="group p-6 rounded-[1.5rem] border bg-zinc-950 border-zinc-800 hover:border-rojo-900/50 transition-all"><p className="font-black text-sm tracking-tight group-hover:text-rojo-500">{t.title}</p></Link>
              )) : <div className="py-24 text-center border-2 border-dashed border-zinc-800/50 rounded-[1.5rem] opacity-30 text-[10px] font-black uppercase tracking-widest">No Activity Records</div>}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProfilePage;
