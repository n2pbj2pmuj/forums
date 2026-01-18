
import React, { useState } from 'react';
import { useAppState } from '../AppStateContext';
import Layout from '../components/Layout';
import { Link } from 'react-router-dom';
import { DEFAULT_AVATAR } from '../constants';

const MembersPage: React.FC = () => {
  const { users, theme } = useAppState();
  const [search, setSearch] = useState('');
  const isDark = theme === 'dark';

  const filteredUsers = users.filter(u => 
    u.displayName.toLowerCase().includes(search.toLowerCase()) || 
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className={`text-4xl font-black tracking-tighter ${isDark ? 'text-white' : 'text-slate-900'}`}>MEMBER LIST</h1>
            <p className="text-rojo-500 font-bold uppercase text-[10px] tracking-[0.3em] mt-1">Forum Members</p>
          </div>
          <div className="relative group">
            <input 
              type="text" 
              placeholder="Search members..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`pl-12 pr-6 py-3 rounded-2xl text-sm w-full md:w-80 border transition-all outline-none focus:ring-2 ring-rojo-500 shadow-xl ${isDark ? 'bg-rojo-950/50 border-rojo-900/30 text-white placeholder-slate-700' : 'bg-white border-rojo-100 shadow-rojo-500/5'}`}
            />
            <svg className="w-5 h-5 absolute left-4 top-3.5 text-rojo-900 group-focus-within:text-rojo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredUsers.map(user => {
            const isBanned = user.status === 'Banned';
            return (
              <Link 
                key={user.id} 
                to={`/profile/${user.id}`}
                className={`group border rounded-3xl p-8 transition-all hover:-translate-y-2 hover:shadow-[0_0_30px_rgba(255,0,0,0.15)] relative overflow-hidden ${isDark ? 'bg-black border-rojo-900/30 hover:border-rojo-500' : 'bg-white border-rojo-100'}`}
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-rojo-500/5 -mr-12 -mt-12 rounded-full group-hover:bg-rojo-500/10 transition-colors"></div>
                
                <div className="flex flex-col items-center text-center space-y-5">
                  <div className="relative">
                    <img src={isBanned ? DEFAULT_AVATAR : user.avatarUrl} className={`w-24 h-24 rounded-3xl border-4 transition-all group-hover:scale-105 shadow-xl object-cover ${isDark ? 'border-rojo-950' : 'border-white'}`} alt="" />
                    <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 ${isBanned ? 'bg-rojo-600 border-black' : isDark ? 'border-black bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'border-white bg-emerald-500'}`}></div>
                  </div>
                  
                  <div className="min-w-0 w-full">
                    <h3 className={`text-xl font-black tracking-tight truncate transition-colors ${isBanned ? 'line-through decoration-rojo-500 opacity-60' : isDark ? 'text-white group-hover:text-rojo-500' : 'text-slate-900'}`}>{user.displayName}</h3>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-tighter">@{user.username}</p>
                  </div>

                  <div className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-colors ${
                    isBanned ? 'bg-rojo-950 border-rojo-900 text-rojo-900' :
                    user.role === 'Admin' ? 'bg-rojo-600 border-rojo-500 text-white' :
                    user.role === 'Moderator' ? 'bg-slate-800 border-slate-700 text-slate-400 group-hover:text-white' :
                    'bg-rojo-900/10 border-rojo-900/20 text-rojo-400 group-hover:text-rojo-500'
                  }`}>
                    {isBanned ? 'Banned' : user.role}
                  </div>

                  <div className="grid grid-cols-2 w-full pt-6 border-t border-rojo-900/10">
                    <div className="text-center">
                      <p className={`text-lg font-black ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{user.postCount}</p>
                      <p className="text-[9px] uppercase font-black text-slate-500 tracking-tighter">Posts</p>
                    </div>
                    <div className="text-center border-l border-rojo-900/10">
                      <p className={`text-lg font-black ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{new Date(user.joinDate).getFullYear()}</p>
                      <p className="text-[9px] uppercase font-black text-slate-500 tracking-tighter">Joined</p>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </Layout>
  );
};

export default MembersPage;
