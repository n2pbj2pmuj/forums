import React, { useState } from 'react';
import { useAppState } from '../AppStateContext';
import Layout from '../components/Layout';
import { Link } from 'react-router-dom';
import { DEFAULT_AVATAR } from '../constants';

const MembersPage: React.FC = () => {
  const { users, theme } = useAppState();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const isDark = theme === 'dark';

  const filteredUsers = users.filter(u => {
    const matchesSearch = (u.displayName || '').toLowerCase().includes(search.toLowerCase()) || 
                         (u.username || '').toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'All' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <Layout>
      <div className="space-y-10 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <h1 className={`text-5xl font-black tracking-tighter ${isDark ? 'text-white' : 'text-slate-900'}`}>COMMUNITY</h1>
            <p className="text-rojo-600 font-black uppercase text-[10px] tracking-[0.4em] mt-2">Forum Members Directory</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 flex-1 max-w-2xl">
            <div className="relative flex-1">
              <input 
                type="text" 
                placeholder="Search usernames..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`w-full pl-14 pr-6 py-4 rounded-3xl text-sm border transition-all outline-none focus:ring-4 ring-rojo-500/10 ${isDark ? 'bg-rojo-950/20 border-rojo-900/30 text-white placeholder-slate-700' : 'bg-white border-rojo-100'}`}
              />
              <svg className="w-6 h-6 absolute left-5 top-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <select 
              value={roleFilter} 
              onChange={e => setRoleFilter(e.target.value)}
              className={`px-6 py-4 rounded-3xl text-[10px] font-black uppercase tracking-widest border outline-none cursor-pointer ${isDark ? 'bg-rojo-950/20 border-rojo-900/30 text-white' : 'bg-white border-rojo-100'}`}
            >
              <option value="All">All Roles</option>
              <option value="Admin">Administrators</option>
              <option value="Moderator">Moderators</option>
              <option value="User">Regular Users</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredUsers.map(user => {
            const isBanned = user.status === 'Banned';
            return (
              <Link 
                key={user.id} 
                to={`/profile/${user.id}`}
                className={`group border rounded-[2.5rem] transition-all hover:-translate-y-2 hover:shadow-2xl hover:shadow-rojo-900/10 overflow-hidden ${isDark ? 'bg-black/40 border-rojo-900/20' : 'bg-white border-slate-100'}`}
              >
                <div className="h-24 bg-rojo-950/30 relative">
                  {user.bannerUrl && <img src={user.bannerUrl} className="w-full h-full object-cover opacity-50" alt="" />}
                </div>
                
                <div className="px-8 pb-8 flex flex-col items-center -mt-12 text-center">
                  <div className="relative mb-6">
                    <img 
                      src={user.avatarUrl || DEFAULT_AVATAR} 
                      className={`w-24 h-24 rounded-[2rem] border-8 shadow-2xl transition-transform group-hover:scale-105 object-cover ${isDark ? 'border-[#080101]' : 'border-white'}`} 
                      alt="" 
                      onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_AVATAR; }}
                    />
                    {!isBanned && <div className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 rounded-full border-4 border-[#080101]"></div>}
                  </div>
                  
                  <h3 className={`text-xl font-black tracking-tight truncate w-full ${isBanned ? 'line-through opacity-50' : 'text-rojo-500'}`}>{user.displayName}</h3>
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] mb-6">@{user.username}</p>

                  <div className={`w-full py-2 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] mb-8 border transition-all ${
                    isBanned ? 'bg-rojo-950 border-rojo-900 text-rojo-900' :
                    user.role === 'Admin' ? 'bg-rojo-600 border-rojo-500 text-white' :
                    user.role === 'Moderator' ? 'bg-slate-800 border-slate-700 text-slate-400 group-hover:text-white' :
                    'bg-slate-900/50 border-rojo-900/10 text-slate-500 group-hover:text-rojo-500 group-hover:border-rojo-500/30'
                  }`}>
                    {isBanned ? 'Banned' : user.role}
                  </div>

                  <div className="grid grid-cols-2 w-full pt-6 border-t border-rojo-900/5">
                    <div>
                      <p className="text-lg font-black">{user.postCount || 0}</p>
                      <p className="text-[9px] uppercase font-black text-slate-500 tracking-widest">Posts</p>
                    </div>
                    <div className="border-l border-rojo-900/5">
                      <p className="text-lg font-black">{new Date(user.joinDate || Date.now()).getFullYear()}</p>
                      <p className="text-[9px] uppercase font-black text-slate-500 tracking-widest">Joined</p>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {filteredUsers.length === 0 && (
          <div className="py-32 text-center">
            <div className="w-20 h-20 rounded-full bg-rojo-950/10 flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-rojo-600/20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            </div>
            <p className="text-slate-500 font-black uppercase text-xs tracking-widest">No users found matching your filters.</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MembersPage;