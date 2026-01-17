
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
          <h1 className={`text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Moderation Command</h1>
          <p className="text-rojo-500 font-bold uppercase text-[10px] tracking-widest mt-1">Platform Operations</p>
        </header>

        <div className={`flex border-b overflow-x-auto no-scrollbar ${isDark ? 'border-rojo-900/50' : 'border-rojo-100'}`}>
          <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')}>Members</TabButton>
          <TabButton active={activeTab === 'reports'} onClick={() => setActiveTab('reports')}>Reports Queue</TabButton>
        </div>

        {activeTab === 'users' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {users.map(user => (
              <div key={user.id} className={`border rounded-2xl p-6 transition-all group ${isDark ? 'bg-black border-rojo-900/30' : 'bg-white border-slate-200'}`}>
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <img src={user.avatarUrl} className="w-12 h-12 rounded-lg border border-rojo-900/50" alt="" />
                    <div>
                      <h3 className="font-bold">{user.displayName}</h3>
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
                  <button onClick={() => { setEditingUserId(user.id); setEditEmail(user.email); setEditRole(user.role); setEditUsername(user.username); }} className="py-2 rounded-lg font-bold uppercase text-[9px] bg-slate-800 text-slate-300">Roles</button>
                  <button onClick={() => { loginAs(user.id); navigate('/'); }} className="bg-slate-200 text-black font-bold uppercase text-[9px] py-2 rounded-lg">Login As</button>
                  {user.status === 'Banned' ? (
                    <button onClick={() => unbanUser(user.id)} className="bg-emerald-600 text-white font-bold uppercase text-[9px] py-2 rounded-lg">Unban</button>
                  ) : (
                    <button onClick={() => setShowBanModal(user.id)} className="bg-rojo-600 text-white font-bold uppercase text-[9px] py-2 rounded-lg">Ban</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'reports' && (
          <div className={`border rounded-2xl overflow-hidden ${isDark ? 'bg-black border-rojo-900/30' : 'bg-white border-slate-200'}`}>
            <table className="w-full text-left">
              <thead className={`border-b ${isDark ? 'bg-rojo-950/50 border-rojo-900/30' : 'bg-slate-50 border-slate-100'}`}>
                <tr className="text-[10px] uppercase font-bold text-slate-500">
                  <th className="px-6 py-4">Offender</th>
                  <th className="px-6 py-4">Report Details</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rojo-900/10">
                {reports.map(report => (
                  <tr key={report.id} className="text-xs">
                    <td className="px-6 py-4">
                      <p className="font-bold">@{report.authorUsername || 'System'}</p>
                      <p className="text-[9px] text-slate-500">{report.type}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-slate-300 line-clamp-1 italic">"{report.contentSnippet}"</p>
                      <p className="text-[9px] text-slate-500 mt-1">Reason: {report.reason}</p>
                      {report.targetUrl && <a href={report.targetUrl} className="text-rojo-500 text-[9px] font-bold hover:underline">VIEW CONTEXT</a>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {report.status === ModStatus.PENDING ? (
                        <div className="flex justify-end gap-2">
                          <button onClick={() => resolveReport(report.id, ModStatus.RESOLVED)} className="bg-emerald-600 text-white px-3 py-1 rounded text-[9px] font-bold uppercase">Resolve</button>
                          <button onClick={() => resolveReport(report.id, ModStatus.DISMISSED)} className="bg-slate-700 text-slate-300 px-3 py-1 rounded text-[9px] font-bold uppercase">Ignore</button>
                        </div>
                      ) : (
                        <span className="text-[9px] font-bold uppercase text-slate-500">{report.status}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editingUserId && (
        <div className="fixed inset-0 bg-black/90 z-[300] flex items-center justify-center p-6">
          <div className={`w-full max-w-lg rounded-2xl p-8 border ${isDark ? 'bg-rojo-950 border-rojo-500/30' : 'bg-white border-slate-200'}`}>
             <h2 className="text-xl font-bold uppercase mb-6">User Permissions</h2>
             <div className="space-y-4">
                <div>
                   <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Username</label>
                   <input value={editUsername} onChange={e => setEditUsername(e.target.value)} className="w-full bg-black border border-rojo-900/50 rounded-lg p-3 text-sm text-white" />
                </div>
                <div>
                   <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Role Protocol</label>
                   <select value={editRole} onChange={e => setEditRole(e.target.value as any)} className="w-full bg-black border border-rojo-900/50 rounded-lg p-3 text-sm text-white">
                     <option value="User">Standard User</option>
                     <option value="Moderator">Moderator</option>
                     <option value="Admin">Administrator</option>
                   </select>
                </div>
             </div>
             <div className="mt-8 flex gap-3">
               <button onClick={() => setEditingUserId(null)} className="flex-1 text-slate-500 font-bold uppercase text-xs">Cancel</button>
               <button onClick={handleRoleUpdate} className="flex-1 bg-rojo-600 text-white font-bold py-3 rounded-lg uppercase text-xs">Update</button>
             </div>
          </div>
        </div>
      )}

      {showBanModal && (
        <div className="fixed inset-0 bg-black/90 z-[300] flex items-center justify-center p-6">
          <div className="w-full max-w-lg rounded-2xl p-8 border bg-rojo-950 border-rojo-500/30">
             <h2 className="text-xl font-bold uppercase mb-6 text-rojo-500">Isolation Protocol</h2>
             <div className="space-y-4">
                <textarea value={banReason} onChange={e => setBanReason(e.target.value)} className="w-full bg-black border border-rojo-900/50 rounded-lg p-3 text-sm text-white" rows={3} placeholder="Reason..." />
                <select value={banDuration} onChange={e => setBanDuration(e.target.value)} className="w-full bg-black border border-rojo-900/50 rounded-lg p-3 text-sm text-white">
                  <option value="1">1 Day</option>
                  <option value="7">7 Days</option>
                  <option value="Permanent">Permanent Isolation</option>
                </select>
             </div>
             <div className="mt-8 flex gap-3">
               <button onClick={() => setShowBanModal(null)} className="flex-1 text-slate-500 font-bold uppercase text-xs">Cancel</button>
               <button onClick={handleBan} className="flex-1 bg-rojo-600 text-white font-bold py-3 rounded-lg uppercase text-xs">Apply Ban</button>
             </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
  <button onClick={onClick} className={`px-8 py-3 text-[10px] font-bold uppercase tracking-widest border-b-2 transition-all ${active ? 'border-rojo-500 text-rojo-500' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>{children}</button>
);

export default AdminPanel;
