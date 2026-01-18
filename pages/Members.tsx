
import React, { useState } from 'react';
import { useAppState } from '../AppStateContext';
import Layout from '../components/Layout';
import { Link } from 'react-router-dom';
import { DEFAULT_AVATAR } from '../constants';

const MembersPage: React.FC = () => {
  const { users, theme, showBannedContent, setShowBannedContent, sendFriendRequest, friendRequests, friends, currentUser } = useAppState();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const isDark = theme === 'dark';

  const filteredUsers = users.filter(u => {
    const isBanned = u.status === 'Banned';
    if (!showBannedContent && isBanned) return false;
    const matchesSearch = (u.displayName || '').toLowerCase().includes(search.toLowerCase()) || (u.username || '').toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'All' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <Layout>
      <div className="space-y-10 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div><h1 className={`text-5xl font-black tracking-tighter ${isDark ? 'text-white' : 'text-slate-900'}`}>COMMUNITY</h1><p className="text-rojo-600 font-black uppercase text-[10px] tracking-[0.4em] mt-2">Member Directory</p></div>
          <div className="flex flex-col sm:flex-row gap-4 flex-1 max-w-2xl">
            <input type="text" placeholder="Search usernames..." value={search} onChange={e => setSearch(e.target.value)} className={`w-full px-8 py-4 rounded-3xl text-sm border transition-all outline-none ${isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-rojo-100'}`} />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredUsers.map(user => {
            const isBanned = user.status === 'Banned';
            const isFriend = friends.some(f => (f.user_id === user.id && f.friend_id === currentUser?.id) || (f.friend_id === user.id && f.user_id === currentUser?.id));
            const hasPending = friendRequests.some(r => r.sender_id === currentUser?.id && r.receiver_id === user.id && r.status === 'pending');
            const isMe = user.id === currentUser?.id;

            return (
              <div key={user.id} className={`group border rounded-[2.5rem] overflow-hidden transition-all ${isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-slate-100'}`}>
                <div className="h-24 bg-rojo-950/30"></div>
                <div className="px-8 pb-8 flex flex-col items-center -mt-12 text-center">
                  <Link to={`/profile/${user.id}`} className="relative mb-6 block"><img src={user.avatarUrl || DEFAULT_AVATAR} className={`w-24 h-24 rounded-[2rem] border-8 object-cover ${isDark ? 'border-[#0a0202]' : 'border-white'}`} alt="" /></Link>
                  <h3 className="text-xl font-black tracking-tight truncate w-full">{user.displayName}</h3>
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-6">@{user.username}</p>
                  
                  <div className="flex w-full gap-2 mb-8">
                    <Link to={`/profile/${user.id}`} className="flex-1 py-2 bg-zinc-800 text-white rounded-xl text-[8px] font-black uppercase">Profile</Link>
                    {!isMe && !isBanned && (
                      isFriend ? <span className="flex-1 py-2 bg-emerald-600/20 text-emerald-500 rounded-xl text-[8px] font-black uppercase text-center flex items-center justify-center">Friend</span> :
                      hasPending ? <span className="flex-1 py-2 bg-zinc-800 text-zinc-600 rounded-xl text-[8px] font-black uppercase text-center flex items-center justify-center">Pending</span> :
                      <button onClick={() => sendFriendRequest(user.id)} className="flex-1 py-2 bg-rojo-600 text-white rounded-xl text-[8px] font-black uppercase">Add</button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 w-full pt-6 border-t border-zinc-800/20">
                    <div><p className="text-lg font-black">{user.postCount || 0}</p><p className="text-[9px] font-black text-slate-500">Posts</p></div>
                    <div className="border-l border-zinc-800/20"><p className="text-lg font-black">{new Date(user.joinDate).getFullYear()}</p><p className="text-[9px] font-black text-slate-500">Joined</p></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
};

export default MembersPage;
