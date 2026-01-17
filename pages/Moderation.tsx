
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../AppStateContext';
import { ModStatus, Report, ReportType, User } from '../types';
import Layout from '../components/Layout';

const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'reports' | 'users'>('users');
  const { reports, users, loginAs, resolveReport, banUser, unbanUser, theme, updateTargetUser } = useAppState();
  const navigate = useNavigate();
  
  const [showBanModal, setShowBanModal] = useState<string | null>(null);
  const [banReason, setBanReason] = useState('Violation of Community Guidelines');
  const [banDuration, setBanDuration] = useState('7');
  
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<'User' | 'Moderator' | 'Admin'>('User');
  const [editUsername, setEditUsername] = useState('');

  const isDark = theme === 'dark';

  const handleBan = () => {
    if (showBanModal) {
      banUser(showBanModal, banReason, banDuration);
      setShowBanModal(null);
    }
  };

  const handleRoleUpdate = () => {
    if (editingUserId) {
      updateTargetUser(editingUserId, { email: editEmail, role: editRole, username: editUsername });
      setEditingUserId(null);
    }
  };

  return (
    <Layout>
      <div className="space-y-6 animate-in fade-in duration-500">
        <header>
          <h1 className={`text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Moderation Console</h1>
          <p className="text-rojo-500 font-bold uppercase text-[10px] tracking-widest mt-1">Platform Operations & Safety</p>
        </header>

        <div className={`flex border-b overflow-x-auto no-scrollbar ${isDark ? 'border-rojo-900/50' : 'border-rojo-100'}`}>
          <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')}>Member Database</TabButton>
          <TabButton active={activeTab === 'reports'} onClick={() => setActiveTab('reports')}>Reports Queue</TabButton>
        </div>

        {activeTab === 'users' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {users.map(user => (
              <div key={user.id} className={`border rounded-2xl p-6 transition-all group ${isDark ? 'bg-black border-rojo-900/30' : 'bg-white border-slate-200 shadow-sm'}`}>
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <img src={user.avatarUrl} className="w-12 h-12 rounded-lg border border-rojo-900/50 object-cover" alt="" />
                    <div className="min-w-0">
                      <h3 className="font-bold truncate">{user.displayName}</h3>
                      <p className="text-rojo-500 text-xs">@{user.username}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${user.status === 'Active' ? 'text-emerald-500' : 'text-rojo-500'}`}>
                      {user.status}
                    </span>
                    <p className="text-[9px] text-slate-500 uppercase mt-1">{user.role}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => { setEditingUserId(user.id); setEditEmail(user.email); setEditRole(user.role); setEditUsername(user.username); }} className="py-2 rounded-lg font-bold uppercase text-[9px] bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors">Edit Roles</button>
                  <button onClick={() => { loginAs(user.id); navigate('/'); }} className="bg-slate-200 text-black font-bold uppercase text-[9px] py-2 rounded-lg hover:bg-white transition-colors">Login As</button>
                  {user.status === 'Banned' ? (
                    <button onClick={() => unbanUser(user.id)} className="bg-emerald-600 text-white font-bold uppercase text-[9px] py-2 rounded-lg hover:bg-emerald-500 transition-colors">Restore</button>
                  ) : (
                    <button onClick={() => setShowBanModal(user.id)} className="bg-rojo-600 text-white font-bold uppercase text-[9px] py-2 rounded-lg hover:bg-rojo-500 transition-colors">Ban</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'reports' && (
          <div className={`border rounded-2xl overflow-hidden shadow-2xl ${isDark ? 'bg-black border-rojo-900/30' : 'bg-white border-slate-200'}`}>
            <table className="w-full text-left">
              <thead className={`border-b ${isDark ? 'bg-rojo-950/50 border-rojo-900/30' : 'bg-slate-50 border-slate-100'}`}>
                <tr className="text-[10px] uppercase font-bold text-slate-500">
                  <th className="px-6 py-4">Target Author</th>
                  <th className="px-6 py-4">Content Context</th>
                  <th className="px-6 py-4">Violation Type</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rojo-900/10">
                {reports.map(report => (
                  <tr key={report.id} className="text-xs group hover:bg-rojo-500/5 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold">@{report.authorUsername || 'Unknown'}</p>
                      <p className="text-[9px] text-slate-500">Target ID: {report.targetId.substring(0,8)}...</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className={`line-clamp-2 max-w-xs italic mb-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>"{report.contentSnippet || 'No snippet available'}"</p>
                      {report.targetUrl && (
                        <a href={report.targetUrl} target="_blank" rel="noopener noreferrer" className="text-rojo-500 text-[9px] font-black uppercase hover:underline">View Live Context</a>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-rojo-900/10 text-rojo-500 rounded text-[9px] font-bold uppercase">{report.type}</span>
                      <p className="text-[9px] text-slate-500 mt-2 font-medium">"{report.reason}"</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {report.status === ModStatus.PENDING ? (
                        <div className="flex justify-end gap-2">
                          <button onClick={() => resolveReport(report.id, ModStatus.RESOLVED)} className="bg-emerald-600 text-white px-3 py-1.5 rounded text-[9px] font-bold uppercase shadow-lg shadow-emerald-900/20 hover:scale-105 transition-all">Resolve</button>
                          <button onClick={() => resolveReport(report.id, ModStatus.DISMISSED)} className="bg-slate-700 text-slate-300 px-3 py-1.5 rounded text-[9px] font-bold uppercase hover:bg-slate-600 transition-all">Ignore</button>
                        </div>
                      ) : (
                        <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest ${report.status === ModStatus.RESOLVED ? 'text-emerald-500 bg-emerald-500/10' : 'text-slate-500 bg-slate-500/10'}`}>{report.status}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {reports.length === 0 && (
              <div className="p-20 text-center opacity-30">
                <p className="text-slate-500 font-bold uppercase text-xs tracking-[0.2em]">Reports Queue Empty</p>
              </div>
            )}
          </div>
        )}
      </div>

      {editingUserId && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[300] flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className={`w-full max-w-lg rounded-2xl p-10 border shadow-2xl ${isDark ? 'bg-rojo-950 border-rojo-500/30' : 'bg-white border-slate-200'}`}>
             <h2 className="text-2xl font-black uppercase mb-8 text-rojo-500 tracking-tighter">Permission Protocol</h2>
             <div className="space-y-6">
                <div>
                   <label className="block text-[10px] font-bold uppercase text-slate-500 mb-2">Identify Username</label>
                   <input value={editUsername} onChange={e => setEditUsername(e.target.value)} className={`w-full border rounded-xl p-4 text-sm transition-all outline-none focus:ring-2 ring-rojo-500 ${isDark ? 'bg-black border-rojo-900/50 text-white' : 'bg-slate-50 border-slate-200'}`} />
                </div>
                <div>
                   <label className="block text-[10px] font-bold uppercase text-slate-500 mb-2">Account Rank</label>
                   <select value={editRole} onChange={e => setEditRole(e.target.value as any)} className={`w-full border rounded-xl p-4 text-sm transition-all outline-none focus:ring-2 ring-rojo-500 ${isDark ? 'bg-black border-rojo-900/50 text-white' : 'bg-slate-50 border-slate-200'}`}>
                     <option value="User">Standard Member</option>
                     <option value="Moderator">Community Moderator</option>
                     <option value="Admin">System Administrator</option>
                   </select>
                </div>
             </div>
             <div className="mt-10 flex gap-4">
               <button onClick={() => setEditingUserId(null)} className="flex-1 text-slate-500 font-bold uppercase text-xs tracking-widest py-4">Abort</button>
               <button onClick={handleRoleUpdate} className="flex-1 bg-rojo-600 text-white font-black py-4 rounded-2xl uppercase text-xs tracking-widest shadow-xl shadow-rojo-500/20 hover:bg-rojo-500 transition-all">Update Rank</button>
             </div>
          </div>
        </div>
      )}

      {showBanModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[300] flex items-center justify-center p-6 animate-in zoom-in duration-200">
          <div className="w-full max-w-lg rounded-3xl p-10 border bg-[#0a0202] border-rojo-500/30 shadow-[0_0_100px_rgba(255,0,0,0.15)]">
             <h2 className="text-2xl font-black uppercase mb-8 text-rojo-500 tracking-tight">Access Isolation Protocol</h2>
             <div className="space-y-6">
                <div>
                   <label className="block text-[10px] font-bold uppercase text-slate-500 mb-2">Isolation Reason</label>
                   <textarea value={banReason} onChange={e => setBanReason(e.target.value)} className="w-full bg-black border border-rojo-900/50 rounded-2xl p-5 text-sm text-white outline-none focus:ring-2 ring-rojo-500 transition-all" rows={4} placeholder="Specify violation code..." />
                </div>
                <div>
                   <label className="block text-[10px] font-bold uppercase text-slate-500 mb-2">Isolation Duration</label>
                   <select value={banDuration} onChange={e => setBanDuration(e.target.value)} className="w-full bg-black border border-rojo-900/50 rounded-xl p-4 text-sm text-white outline-none focus:ring-2 ring-rojo-500">
                     <option value="1">1 Solar Day</option>
                     <option value="7">7 Solar Days</option>
                     <option value="Permanent">Permanent Archival</option>
                   </select>
                </div>
             </div>
             <div className="mt-10 flex gap-4">
               <button onClick={() => setShowBanModal(null)} className="flex-1 text-slate-500 font-bold uppercase text-xs tracking-widest">Cancel</button>
               <button onClick={handleBan} className="flex-1 bg-rojo-600 text-white font-black py-4 rounded-2xl uppercase text-xs tracking-widest hover:bg-rojo-500 shadow-[0_0_20px_rgba(255,0,0,0.3)] transition-all">Apply Isolation</button>
             </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
  <button onClick={onClick} className={`px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] border-b-2 transition-all ${active ? 'border-rojo-500 text-rojo-500' : 'border-transparent text-slate-600 hover:text-slate-300'}`}>{children}</button>
);

export default AdminPanel;
