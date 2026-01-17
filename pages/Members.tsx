
import React, { useState } from 'react';
import { useAppState } from '../AppStateContext';
import Layout from '../components/Layout';
import { Link } from 'react-router-dom';

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
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className={`text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Member Directory</h1>
            <p className="text-slate-500">Connect with the {users.length} citizens of BlocVerse.</p>
          </div>
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search members..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`pl-10 pr-4 py-2.5 rounded-2xl text-sm w-72 border transition-all outline-none focus:ring-2 ring-indigo-500 ${isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200'}`}
            />
            <svg className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredUsers.map(user => (
            <Link 
              key={user.id} 
              to={`/profile/${user.id}`}
              className={`group border rounded-3xl p-6 transition-all hover:-translate-y-1 shadow-lg ${isDark ? 'bg-slate-900 border-slate-800 hover:border-indigo-500/50 hover:shadow-indigo-500/10' : 'bg-white border-slate-100 hover:border-indigo-200 hover:shadow-xl'}`}
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="relative">
                  <img src={user.avatarUrl} className={`w-20 h-20 rounded-2xl border-2 transition-all group-hover:scale-105 ${isDark ? 'border-slate-800' : 'border-slate-100'}`} alt="" />
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 ${isDark ? 'border-slate-900 bg-emerald-500' : 'border-white bg-emerald-500'}`}></div>
                </div>
                <div>
                  <h3 className={`font-black tracking-tight group-hover:text-indigo-400 transition-colors ${isDark ? 'text-white' : 'text-slate-900'}`}>{user.displayName}</h3>
                  <p className="text-xs text-slate-500">@{user.username}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                  user.role === 'Admin' ? 'bg-red-500/10 text-red-500' :
                  user.role === 'Moderator' ? 'bg-indigo-500/10 text-indigo-500' :
                  'bg-slate-500/10 text-slate-500'
                }`}>
                  {user.role}
                </div>
                <div className="grid grid-cols-2 w-full pt-4 border-t border-slate-800/20">
                  <div className="text-center">
                    <p className={`text-sm font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{user.postCount}</p>
                    <p className="text-[9px] uppercase font-bold text-slate-500">Posts</p>
                  </div>
                  <div className="text-center border-l border-slate-800/20">
                    <p className={`text-sm font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{new Date(user.joinDate).getFullYear()}</p>
                    <p className="text-[9px] uppercase font-bold text-slate-500">Joined</p>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default MembersPage;
