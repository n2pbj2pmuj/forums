import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../AppStateContext';
import { ModStatus, Report, ReportType, User } from '../types';
import Layout from '../components/Layout';

const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'reports' | 'users' | 'ip_bans'>('users');
  const { reports, users, ipBans, loginAs, resolveReport, banUser, unbanUser, unbanIp, addManualIpBan, theme, updateTargetUser, clientIp, fetchUserIpHistory } = useAppState();
  const navigate = useNavigate();
  
  const [showBanModal, setShowBanModal] = useState<string | null>(null);
  const [banReason, setBanReason] = useState('Violation of Community Guidelines');
  const [banDuration, setBanDuration] = useState('7');
  const [doIpBan, setDoIpBan] = useState(false);
  const [resetUsername, setResetUsername] = useState(false);
  
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<'User' | 'Moderator' | 'Admin'>('User');
  const [editUsername, setEditUsername] = useState('');

  const [ipHistoryModal, setIpHistoryModal] = useState<{userId: string, username: string, logs: any[]} | null>(null);
  const [showManualIpModal, setShowManualIpModal] = useState(false);
  const [manualIp, setManualIp] = useState('');
  const [manualIpReason, setManualIpReason] = useState('Network Blacklisted');

  const isDark = theme === 'dark';

  const handleBan = () => {
    if (showBanModal) {
      banUser(showBanModal, banReason, banDuration, doIpBan, resetUsername);
      setShowBanModal(null);
      setDoIpBan(false);
      setResetUsername(false);
    }
  };

  const handleManualIpBan = async () => {
    if (!manualIp.trim()) return;
    await addManualIpBan(manualIp, manualIpReason);
    setShowManualIpModal(false);
    setManualIp('');
    setManualIpReason('Network Blacklisted');
  };

  const handleRoleUpdate = () => {
    if (editingUserId) {
      updateTargetUser(editingUserId, { email: editEmail, role: editRole, username: editUsername });
      setEditingUserId(null);
    }
  };

  const viewIpHistory = async (user: User) => {
    const logs = await fetchUserIpHistory(user.id);
    setIpHistoryModal({ userId: user.id, username: user.username, logs });
  };

  return (
    <Layout>
      <div className="space-y-6 animate-in fade-in duration-500">
        <header>
          <h1 className={`text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Admin Dashboard</h1>
          <p className="text-rojo-500 font-bold uppercase text-[10px] tracking-widest mt-1">Management & Security</p>
        </header>

        <div className={`flex border-b overflow-x-auto no-scrollbar ${isDark ? 'border-rojo-900/50' : 'border-rojo-100'}`}>
          <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')}>Users</TabButton>
          <TabButton active={activeTab === 'reports'} onClick={() => setActiveTab('reports')}>Reports</TabButton>
          <TabButton active={activeTab === 'ip_bans'} onClick={() => setActiveTab('ip_bans')}>Banned IPs</TabButton>
        </div>

        {activeTab === 'users' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {users.map(user => {
              const userIsIpBanned = ipBans.some(b => b.ip_address === user.lastIp);
              return (
                <div key={user.id} className={`border rounded-[2rem] p-8 transition-all group ${isDark ? 'bg-black border-zinc-800 hover:border-rojo-900/30' : 'bg-white border-slate-100 shadow-sm'}`}>
                  <div className="flex items-start justify-between mb-8">
                    <div className="flex items-center gap-5">
                      <div className="relative">
                        <img src={user.avatarUrl} className="w-14 h-14 rounded-2xl border-2 border-zinc-800 object-cover" alt="" />
                        {user.status === 'Banned' && <div className="absolute -top-1 -right-1 w-5 h-5 bg-rojo-600 rounded-full border-4 border-black flex items-center justify-center text-white text-[8px] font-black">!</div>}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-black text-lg truncate leading-none">{user.displayName}</h3>
                        <p className="text-rojo-600 text-xs font-bold mt-1">@{user.username}</p>
                        
                        <div className="flex items-center gap-2 mt-3">
                           <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border transition-all ${
                             userIsIpBanned ? 'bg-rojo-600/10 border-rojo-600 text-rojo-600' : 'bg-zinc-800/40 border-zinc-800 text-zinc-500'
                           }`}>
                             IP: {user.lastIp || 'NO_RECORD'}
                           </span>
                           <button onClick={() => viewIpHistory(user)} className="text-zinc-600 hover:text-white transition-colors" title="View Logs">
                             <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                           </button>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${user.status === 'Active' ? 'bg-emerald-600/10 text-emerald-500' : 'bg-rojo-600/10 text-rojo-600'}`}>
                        {user.status}
                      </span>
                      <p className="text-[10px] text-zinc-600 font-bold uppercase mt-2">{user.role}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <button onClick={() => { setEditingUserId(user.id); setEditEmail(user.email); setEditRole(user.role); setEditUsername(user.username); }} className="py-2.5 rounded-xl font-black uppercase text-[9px] tracking-widest bg-zinc-900 text-zinc-400 hover:bg-zinc-800 transition-all border border-zinc-800">Edit Profile</button>
                    <button onClick={() => { loginAs(user.id); navigate('/'); }} className="bg-zinc-100 text-black font-black uppercase text-[9px] tracking-widest py-2.5 rounded-xl hover:bg-white transition-all shadow-xl shadow-white/5">Impersonate</button>
                    {user.status === 'Banned' ? (
                      <button onClick={() => unbanUser(user.id)} className="bg-emerald-600 text-white font-black uppercase text-[9px] tracking-widest py-2.5 rounded-xl hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-900/20">Unban</button>
                    ) : (
                      <button onClick={() => setShowBanModal(user.id)} className="bg-rojo-600 text-white font-black uppercase text-[9px] tracking-widest py-2.5 rounded-xl hover:bg-rojo-500 transition-all shadow-xl shadow-rojo-900/20">Ban User</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'ip_bans' && (
          <div className="space-y-6">
            <div className="flex justify-end">
              <button onClick={() => setShowManualIpModal(true)} className="bg-rojo-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-rojo-900/20 hover:scale-105 transition-all">Ban IP Address</button>
            </div>
            
            <div className={`border rounded-[2.5rem] overflow-hidden shadow-2xl transition-all ${isDark ? 'bg-black border-zinc-800' : 'bg-white border-slate-100'}`}>
              <table className="w-full text-left">
                <thead className={`border-b ${isDark ? 'bg-rojo-950/20 border-zinc-800' : 'bg-slate-50 border-slate-100'}`}>
                  <tr className="text-[10px] uppercase font-black tracking-widest text-zinc-500">
                    <th className="px-8 py-5">Banned IP</th>
                    <th className="px-8 py-5">Reason</th>
                    <th className="px-8 py-5">Banned On</th>
                    <th className="px-8 py-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900/40">
                  {ipBans.map(ban => (
                    <tr key={ban.id} className="text-xs group hover:bg-rojo-600/5 transition-colors">
                      <td className="px-8 py-5">
                        <p className="font-black text-rojo-600 tracking-tighter text-base">{ban.ip_address}</p>
                        {ban.ip_address === clientIp && <span className="text-[8px] uppercase text-emerald-500 font-black tracking-[0.3em]">Your Current Network</span>}
                      </td>
                      <td className="px-8 py-5">
                        <p className={`line-clamp-2 max-w-xs italic text-sm ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>"{ban.reason || 'General Ban'}"</p>
                      </td>
                      <td className="px-8 py-5">
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{new Date(ban.created_at).toLocaleDateString()}</span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button onClick={() => unbanIp(ban.ip_address)} className="bg-emerald-600 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-900/20 hover:scale-105 transition-all">Unban IP</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {ipBans.length === 0 && (
                <div className="p-24 text-center opacity-30">
                  <p className="text-zinc-500 font-black uppercase text-xs tracking-[0.5em]">No active IP bans</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
           <div className={`border rounded-[2.5rem] overflow-hidden ${isDark ? 'bg-black border-zinc-800' : 'bg-white border-slate-100'}`}>
              <div className="p-20 text-center opacity-30">
                 <p className="text-zinc-500 font-black uppercase text-xs tracking-[0.5em]">Report Queue Empty</p>
              </div>
           </div>
        )}
      </div>

      {/* MANUAL IP BAN MODAL */}
      {showManualIpModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[500] flex items-center justify-center p-6 animate-in zoom-in duration-200">
           <div className={`w-full max-w-lg rounded-[3rem] p-12 border bg-[#050101] border-rojo-600/30 shadow-2xl`}>
              <h2 className="text-3xl font-black uppercase mb-10 text-rojo-600 tracking-tighter">Ban IP Address</h2>
              <div className="space-y-8">
                <div>
                   <label className="block text-[10px] font-black uppercase text-zinc-600 mb-3 tracking-widest">Network Address</label>
                   <input value={manualIp} onChange={e => setManualIp(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-2xl p-4 text-white text-sm outline-none focus:ring-2 ring-rojo-600" placeholder="0.0.0.0" />
                </div>
                <div>
                   <label className="block text-[10px] font-black uppercase text-zinc-600 mb-3 tracking-widest">Ban Reason</label>
                   <textarea value={manualIpReason} onChange={e => setManualIpReason(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-[1.5rem] p-6 text-sm text-white outline-none focus:ring-2 ring-rojo-600 transition-all" rows={4} placeholder="Reason..." />
                </div>
              </div>
              <div className="mt-12 flex gap-4">
                 <button onClick={() => setShowManualIpModal(false)} className="flex-1 text-zinc-600 font-black uppercase text-xs tracking-widest">Cancel</button>
                 <button onClick={handleManualIpBan} className="flex-1 bg-rojo-600 text-white font-black py-5 rounded-[1.5rem] uppercase text-xs tracking-widest hover:bg-rojo-500 transition-all shadow-2xl shadow-rojo-950/40">Confirm Ban</button>
              </div>
           </div>
        </div>
      )}

      {/* IP HISTORY MODAL */}
      {ipHistoryModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-[500] flex items-center justify-center p-6 animate-in fade-in duration-200">
           <div className={`w-full max-w-2xl rounded-[3rem] p-10 border shadow-2xl ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-rojo-100'}`}>
              <div className="flex items-center justify-between mb-10">
                <h2 className="text-2xl font-black uppercase tracking-tighter">Log History: <span className="text-rojo-600">@{ipHistoryModal.username}</span></h2>
                <button onClick={() => setIpHistoryModal(null)} className="text-zinc-600 hover:text-white transition-colors">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="max-h-[500px] overflow-y-auto pr-4 space-y-4 no-scrollbar">
                {ipHistoryModal.logs.map((log, i) => (
                  <div key={i} className={`p-6 rounded-[2rem] border flex items-center justify-between transition-all ${isDark ? 'bg-black/60 border-zinc-900 hover:border-rojo-900/20' : 'bg-slate-50 border-slate-100'}`}>
                    <div>
                      <p className="text-lg font-black text-rojo-600 tracking-tight">{log.ip}</p>
                      <p className="text-[10px] text-zinc-600 mt-2 truncate max-w-xs font-bold uppercase tracking-widest">{log.user_agent}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">{new Date(log.created_at).toLocaleString()}</p>
                      {ipBans.some(b => b.ip_address === log.ip) && <span className="text-[9px] text-rojo-600 font-black uppercase tracking-[0.3em] block mt-2">BANNED</span>}
                    </div>
                  </div>
                ))}
                {ipHistoryModal.logs.length === 0 && <p className="text-center py-20 opacity-20 text-xs font-black uppercase tracking-widest">No history logs found</p>}
              </div>
           </div>
        </div>
      )}

      {/* BAN MODAL */}
      {showBanModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[400] flex items-center justify-center p-6 animate-in zoom-in duration-200">
          <div className="w-full max-w-lg rounded-[3rem] p-12 border bg-[#050101] border-rojo-600/30 shadow-2xl">
             <h2 className="text-3xl font-black uppercase mb-10 text-rojo-600 tracking-tighter">Ban Account</h2>
             <div className="space-y-8">
                <div>
                   <label className="block text-[10px] font-black uppercase text-zinc-600 mb-3 tracking-widest">Ban Reason</label>
                   <textarea value={banReason} onChange={e => setBanReason(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-[1.5rem] p-6 text-sm text-white outline-none focus:ring-2 ring-rojo-600 transition-all" rows={4} placeholder="Reason..." />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black uppercase text-zinc-600 mb-3 tracking-widest">Duration</label>
                    <select value={banDuration} onChange={e => setBanDuration(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-2xl p-4 text-sm text-white outline-none focus:ring-2 ring-rojo-600 font-bold">
                      <option value="1">1 Day</option>
                      <option value="7">7 Days</option>
                      <option value="30">30 Days</option>
                      <option value="Permanent">Permanent</option>
                    </select>
                  </div>
                  <div className="flex flex-col space-y-3">
                    <label className="block text-[10px] font-black uppercase text-zinc-600 mb-1 tracking-widest">Additional</label>
                    <label className="flex items-center gap-4 bg-zinc-950 border border-zinc-900 rounded-2xl p-3 cursor-pointer hover:border-rojo-600 transition-all group">
                      <input type="checkbox" checked={doIpBan} onChange={e => setDoIpBan(e.target.checked)} className="w-5 h-5 rounded border-zinc-800 text-rojo-600 focus:ring-rojo-600 bg-black" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-white transition-colors">Apply IP Ban</span>
                    </label>
                    <label className="flex items-center gap-4 bg-zinc-950 border border-zinc-900 rounded-2xl p-3 cursor-pointer hover:border-rojo-600 transition-all group">
                      <input type="checkbox" checked={resetUsername} onChange={e => setResetUsername(e.target.checked)} className="w-5 h-5 rounded border-zinc-800 text-rojo-600 focus:ring-rojo-600 bg-black" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-white transition-colors">Fully Terminate Username</span>
                    </label>
                  </div>
                </div>
             </div>
             <div className="mt-12 flex gap-4">
               <button onClick={() => setShowBanModal(null)} className="flex-1 text-zinc-600 font-black uppercase text-xs tracking-widest">Cancel</button>
               <button onClick={handleBan} className="flex-1 bg-rojo-600 text-white font-black py-5 rounded-[1.5rem] uppercase text-xs tracking-widest hover:bg-rojo-500 transition-all shadow-2xl shadow-rojo-950/40">Ban Account</button>
             </div>
          </div>
        </div>
      )}

      {/* Permissions Modal */}
      {editingUserId && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[300] flex items-center justify-center p-6">
           <div className={`w-full max-md rounded-[2.5rem] p-10 border ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-slate-100'}`}>
              <h2 className="text-xl font-black uppercase tracking-tighter mb-8 text-rojo-600">Update User</h2>
              <div className="space-y-6">
                 <div>
                    <label className="block text-[10px] font-black uppercase text-zinc-500 mb-2">Username Override</label>
                    <input value={editUsername} onChange={e => setEditUsername(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-xl p-4 text-white text-sm outline-none" />
                 </div>
                 <div>
                    <label className="block text-[10px] font-black uppercase text-zinc-500 mb-2">User Role</label>
                    <select value={editRole} onChange={e => setEditRole(e.target.value as any)} className="w-full bg-black border border-zinc-800 rounded-xl p-4 text-white text-sm outline-none">
                       <option value="User">Standard User</option>
                       <option value="Moderator">Moderator</option>
                       <option value="Admin">Administrator</option>
                    </select>
                 </div>
              </div>
              <div className="mt-10 flex gap-4">
                 <button onClick={() => setEditingUserId(null)} className="flex-1 text-zinc-600 font-black uppercase text-[10px] tracking-widest">Cancel</button>
                 <button onClick={handleRoleUpdate} className="flex-1 bg-rojo-600 text-white font-black py-4 rounded-2xl uppercase text-[10px] tracking-widest">Save Changes</button>
              </div>
           </div>
        </div>
      )}
    </Layout>
  );
};

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
  <button onClick={onClick} className={`px-10 py-5 text-[10px] font-black uppercase tracking-[0.3em] border-b-2 transition-all ${active ? 'border-rojo-600 text-rojo-600 bg-rojo-600/5' : 'border-transparent text-zinc-600 hover:text-zinc-300'}`}>{children}</button>
);

export default AdminPanel;
