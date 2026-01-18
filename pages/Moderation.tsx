
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../AppStateContext';
import { ModStatus, Report, ReportType, User } from '../types';
import Layout from '../components/Layout';

const ModerationPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'reports' | 'ip_bans'>('users');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { users, reports, ipBans, banUser, unbanUser, warnUser, updateTargetUser, updateUserNotes, toggleProtectedStatus, loginAs, theme, clientIp, unbanIp, addManualIpBan } = useAppState();
  const navigate = useNavigate();

  const isDark = theme === 'dark';
  const selectedUser = users.find(u => u.id === selectedUserId);

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="flex flex-col h-[85vh] gap-6 animate-in fade-in duration-500">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight uppercase">Admin Console</h1>
            <p className="text-rojo-600 font-bold uppercase text-[10px] tracking-widest mt-1">Universal Management System v4.0</p>
          </div>
          <div className="flex bg-zinc-900/50 p-1 rounded-2xl border border-zinc-800">
            <NavTab active={activeTab === 'users'} onClick={() => setActiveTab('users')}>Users</NavTab>
            <NavTab active={activeTab === 'reports'} onClick={() => setActiveTab('reports')}>Queue</NavTab>
            <NavTab active={activeTab === 'ip_bans'} onClick={() => setActiveTab('ip_bans')}>Network</NavTab>
          </div>
        </header>

        <div className="flex-1 flex gap-6 overflow-hidden">
          {activeTab === 'users' && (
            <>
              {/* Directory Pane */}
              <div className={`w-80 flex flex-col border rounded-[2rem] overflow-hidden ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-200'}`}>
                <div className="p-6 border-b border-zinc-800/50">
                   <input 
                     type="text" 
                     placeholder="Search Database..." 
                     value={searchTerm}
                     onChange={e => setSearchTerm(e.target.value)}
                     className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-xs outline-none focus:ring-1 ring-rojo-600 transition-all"
                   />
                </div>
                <div className="flex-1 overflow-y-auto no-scrollbar">
                  {filteredUsers.map(user => (
                    <button 
                      key={user.id} 
                      onClick={() => setSelectedUserId(user.id)}
                      className={`w-full flex items-center gap-4 p-5 text-left transition-all border-b border-zinc-900/40 ${selectedUserId === user.id ? 'bg-rojo-600/10 border-r-4 border-rojo-600 shadow-inner' : 'hover:bg-zinc-900/30'}`}
                    >
                      <img src={user.avatarUrl} className={`w-10 h-10 rounded-xl border-2 ${user.status === 'Banned' ? 'border-rojo-600' : 'border-zinc-800'}`} alt="" />
                      <div className="min-w-0">
                        <p className={`text-xs font-black truncate ${selectedUserId === user.id ? 'text-rojo-500' : ''}`}>{user.displayName}</p>
                        <p className="text-[9px] text-zinc-500 font-bold uppercase">@{user.username}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Inspector Pane */}
              <div className="flex-1 flex flex-col gap-6 overflow-y-auto no-scrollbar">
                {selectedUser ? (
                  <UserInspector user={selectedUser} />
                ) : (
                  <div className="flex-1 border-4 border-dashed border-zinc-900 rounded-[3rem] flex items-center justify-center opacity-20">
                    <p className="font-black uppercase tracking-[0.5em] text-xs">Awaiting Data Selection</p>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'ip_bans' && (
            <div className="flex-1 overflow-y-auto">
               <IpBanList />
            </div>
          )}

          {activeTab === 'reports' && (
             <div className="flex-1 flex items-center justify-center border rounded-[3rem] border-zinc-900 opacity-20">
                <p className="font-black uppercase tracking-[0.5em] text-xs text-zinc-500">Report Queue v2 Currently Offline</p>
             </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

const UserInspector: React.FC<{ user: User }> = ({ user }) => {
  const { banUser, warnUser, unbanUser, updateUserNotes, toggleProtectedStatus, updateTargetUser, loginAs, theme } = useAppState();
  const [banReason, setBanReason] = useState('');
  const [banDuration, setBanDuration] = useState('1');
  const [doIpBan, setDoIpBan] = useState(false);
  const [resetName, setResetName] = useState(false);
  const [notes, setNotes] = useState(user.notes || '');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const navigate = useNavigate();

  const handleNotesSave = async () => {
    setIsSavingNotes(true);
    await updateUserNotes(user.id, notes);
    setIsSavingNotes(false);
  };

  const handleImpersonate = () => {
    loginAs(user.id);
    navigate('/');
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-6">
        {/* Left Col: Core Profile */}
        <div className="w-80 space-y-6 shrink-0">
           <AdminPanelBox title="User Profile">
              <div className="flex flex-col items-center py-6 text-center">
                 <img src={user.avatarUrl} className="w-32 h-32 rounded-[2rem] border-8 border-zinc-900 shadow-2xl mb-6 object-cover" alt="" />
                 <h2 className="text-xl font-black tracking-tight">{user.displayName}</h2>
                 <p className="text-rojo-600 font-bold text-[10px] uppercase tracking-widest mt-1">@{user.username}</p>
                 
                 <div className="grid grid-cols-2 gap-4 w-full mt-8">
                   <div className="text-center p-3 rounded-2xl bg-zinc-900/50">
                      <p className="text-sm font-black">{user.postCount}</p>
                      <p className="text-[8px] uppercase font-bold text-zinc-500">Posts</p>
                   </div>
                   <div className="text-center p-3 rounded-2xl bg-zinc-900/50">
                      <p className="text-sm font-black">{new Date(user.joinDate).getFullYear()}</p>
                      <p className="text-[8px] uppercase font-bold text-zinc-500">Joined</p>
                   </div>
                 </div>
              </div>
           </AdminPanelBox>

           <AdminPanelBox title="Actions">
              <div className="grid grid-cols-1 gap-2 p-4">
                 <ActionBtn onClick={() => navigate(`/profile/${user.id}`)}>User Homepage</ActionBtn>
                 <ActionBtn onClick={handleImpersonate}>Impersonate Session</ActionBtn>
                 <ActionBtn onClick={() => toggleProtectedStatus(user.id)} active={user.isProtected} color="amber">
                    {user.isProtected ? 'Unprotect Account' : 'Mark as Protected'}
                 </ActionBtn>
                 <ActionBtn color="rojo" onClick={() => { if(window.confirm('Wipe user account?')) { /* Mock */ } }}>Wipe Payment Info</ActionBtn>
              </div>
           </AdminPanelBox>
        </div>

        {/* Right Col: Advanced Info & Moderation */}
        <div className="flex-1 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             <AdminPanelBox title="Update User">
                <div className="p-6 space-y-4">
                   <div>
                      <label className="text-[9px] font-black uppercase text-zinc-600 tracking-widest block mb-2">Display Name</label>
                      <input 
                        type="text" 
                        defaultValue={user.displayName}
                        onBlur={e => updateTargetUser(user.id, { displayName: e.target.value })}
                        className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-xs outline-none"
                      />
                   </div>
                   <div>
                      <label className="text-[9px] font-black uppercase text-zinc-600 tracking-widest block mb-2">Email Address</label>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          defaultValue={user.email}
                          onBlur={e => updateTargetUser(user.id, { email: e.target.value })}
                          className="flex-1 bg-black border border-zinc-800 rounded-xl px-4 py-3 text-xs outline-none"
                        />
                        <span className="text-emerald-500 flex items-center text-[10px] font-bold">✔ Verified</span>
                      </div>
                   </div>
                   <div>
                      <label className="text-[9px] font-black uppercase text-zinc-600 tracking-widest block mb-2">Role</label>
                      <select 
                        defaultValue={user.role}
                        onChange={e => updateTargetUser(user.id, { role: e.target.value as any })}
                        className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-xs outline-none font-bold"
                      >
                         <option value="User">Regular User</option>
                         <option value="Moderator">Moderator</option>
                         <option value="Admin">Administrator</option>
                      </select>
                   </div>
                </div>
             </AdminPanelBox>

             <AdminPanelBox title="Billing & Security">
                <div className="p-6 space-y-6">
                   <DetailRow label="Xbox User" val="NO" />
                   <DetailRow label="Phone Number" val="Not Connected" />
                   <DetailRow label="2SV Status" val="Enabled (Email)" />
                   <DetailRow label="Network Address" val={user.lastIp || 'UNKNOWN'} />
                   <DetailRow label="Billing Validated" val="Yes (2024-05)" />
                </div>
             </AdminPanelBox>
          </div>

          <AdminPanelBox title="Moderate User (Punishments)">
             <div className="p-6">
                <div className="flex gap-4 mb-8">
                   <div className="flex-1">
                      <label className="text-[9px] font-black uppercase text-zinc-600 tracking-widest block mb-2">Punishment Reason</label>
                      <input 
                        value={banReason}
                        onChange={e => setBanReason(e.target.value)}
                        placeholder="Guideline Violation..."
                        className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-xs outline-none focus:ring-1 ring-rojo-600"
                      />
                   </div>
                   <div className="w-32">
                      <label className="text-[9px] font-black uppercase text-zinc-600 tracking-widest block mb-2">Duration</label>
                      <select 
                        value={banDuration}
                        onChange={e => setBanDuration(e.target.value)}
                        className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-xs outline-none"
                      >
                         <option value="1">1 Day</option>
                         <option value="3">3 Days</option>
                         <option value="7">7 Days</option>
                         <option value="Permanent">Permanent</option>
                      </select>
                   </div>
                </div>
                
                <div className="flex flex-wrap items-center justify-between gap-4">
                   <div className="flex gap-6">
                      <label className="flex items-center gap-3 cursor-pointer group">
                         <input type="checkbox" checked={doIpBan} onChange={e => setDoIpBan(e.target.checked)} className="w-4 h-4 rounded border-zinc-800 bg-black text-rojo-600 focus:ring-rojo-600" />
                         <span className="text-[10px] font-black uppercase text-zinc-500 group-hover:text-white transition-colors">Apply IP Ban</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer group">
                         <input type="checkbox" checked={resetName} onChange={e => setResetName(e.target.checked)} className="w-4 h-4 rounded border-zinc-800 bg-black text-rojo-600 focus:ring-rojo-600" />
                         <span className="text-[10px] font-black uppercase text-zinc-500 group-hover:text-white transition-colors">Reset Account Name</span>
                      </label>
                   </div>
                   <div className="flex gap-3">
                      <button onClick={() => warnUser(user.id, banReason)} className="bg-amber-600 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-amber-900/20">Issue Warn</button>
                      {user.status === 'Banned' ? (
                        <button onClick={() => unbanUser(user.id)} className="bg-emerald-600 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-900/20">Unban</button>
                      ) : (
                        <button onClick={() => banUser(user.id, banReason, banDuration, doIpBan, resetName)} className="bg-rojo-600 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-rojo-900/20">Ban User</button>
                      )}
                   </div>
                </div>
             </div>
          </AdminPanelBox>

          <AdminPanelBox title="Punishment History">
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead className="border-b border-zinc-800 bg-zinc-900/20">
                      <tr className="text-[9px] uppercase font-black tracking-widest text-zinc-600">
                         <th className="px-6 py-4">ID</th>
                         <th className="px-6 py-4">Action</th>
                         <th className="px-6 py-4">Moderator</th>
                         <th className="px-6 py-4">Created</th>
                         <th className="px-6 py-4 text-right">Expiration</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-zinc-900/40 text-[10px] font-bold">
                      {(user.punishments || []).map(p => (
                         <tr key={p.id} className="hover:bg-zinc-900/40 transition-colors">
                            <td className="px-6 py-4 text-zinc-500">{p.id}</td>
                            <td className="px-6 py-4">
                               <span className={`px-2 py-0.5 rounded ${
                                 p.action === 'Ban' ? 'bg-rojo-600/10 text-rojo-600' :
                                 p.action === 'Warn' ? 'bg-amber-600/10 text-amber-500' :
                                 'bg-zinc-800 text-zinc-400'
                               }`}>{p.action}</span>
                            </td>
                            <td className="px-6 py-4 text-rojo-500">@{p.moderator}</td>
                            <td className="px-6 py-4 text-zinc-400">{new Date(p.created_at).toLocaleDateString()}</td>
                            <td className="px-6 py-4 text-right text-zinc-600">{p.expiration}</td>
                         </tr>
                      ))}
                      {(user.punishments || []).length === 0 && (
                        <tr><td colSpan={5} className="px-6 py-12 text-center opacity-20 uppercase tracking-widest">No previous punishments</td></tr>
                      )}
                   </tbody>
                </table>
             </div>
          </AdminPanelBox>

          <AdminPanelBox title="Internal Staff Notes">
             <div className="p-6">
                <textarea 
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full h-32 bg-black border border-zinc-800 rounded-[1.5rem] p-6 text-xs text-white outline-none focus:ring-1 ring-rojo-600 transition-all mb-4"
                  placeholder="Leave internal notes about this user for other moderators..."
                />
                <div className="flex justify-end">
                   <button 
                     onClick={handleNotesSave} 
                     disabled={isSavingNotes}
                     className="bg-zinc-800 text-zinc-100 px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-zinc-700 disabled:opacity-50"
                   >
                     {isSavingNotes ? 'Saving...' : 'Sync Notes'}
                   </button>
                </div>
             </div>
          </AdminPanelBox>
        </div>
      </div>
    </div>
  );
};

const IpBanList: React.FC = () => {
  const { ipBans, unbanIp, addManualIpBan, clientIp } = useAppState();
  const [newIp, setNewIp] = useState('');
  const [reason, setReason] = useState('Network Security Violation');

  const handleAdd = async () => {
    if(!newIp) return;
    await addManualIpBan(newIp, reason);
    setNewIp('');
  };

  return (
    <div className="space-y-6">
      <AdminPanelBox title="Network Blacklist Controls">
         <div className="p-8 flex gap-4">
            <input 
              value={newIp}
              onChange={e => setNewIp(e.target.value)}
              placeholder="0.0.0.0"
              className="flex-1 bg-black border border-zinc-800 rounded-xl px-4 py-3 text-xs outline-none"
            />
            <input 
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="flex-1 bg-black border border-zinc-800 rounded-xl px-4 py-3 text-xs outline-none"
            />
            <button onClick={handleAdd} className="bg-rojo-600 text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest">Blacklist IP</button>
         </div>
      </AdminPanelBox>

      <AdminPanelBox title="Currently Blacklisted Addresses">
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead className="border-b border-zinc-800 bg-zinc-900/20">
                  <tr className="text-[9px] uppercase font-black tracking-widest text-zinc-600">
                     <th className="px-8 py-5">IP Address</th>
                     <th className="px-8 py-5">Reason</th>
                     <th className="px-8 py-5">Banned On</th>
                     <th className="px-8 py-5 text-right">Action</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-zinc-900/40 text-xs font-bold">
                  {ipBans.map(ban => (
                    <tr key={ban.id}>
                       <td className="px-8 py-5">
                          <p className="text-rojo-500 font-black">{ban.ip_address}</p>
                          {ban.ip_address === clientIp && <span className="text-[8px] text-emerald-500 uppercase">You are here</span>}
                       </td>
                       <td className="px-8 py-5 italic text-zinc-500">"{ban.reason}"</td>
                       <td className="px-8 py-5 text-zinc-600">{new Date(ban.created_at).toLocaleDateString()}</td>
                       <td className="px-8 py-5 text-right">
                          <button onClick={() => unbanIp(ban.ip_address)} className="text-[9px] font-black uppercase text-emerald-500 hover:underline">Remove Ban</button>
                       </td>
                    </tr>
                  ))}
                  {ipBans.length === 0 && (
                    <tr><td colSpan={4} className="px-8 py-16 text-center opacity-20 uppercase tracking-[0.4em]">Firewall Clear</td></tr>
                  )}
               </tbody>
            </table>
         </div>
      </AdminPanelBox>
    </div>
  );
};

const NavTab: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
  <button 
    onClick={onClick} 
    className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${active ? 'bg-rojo-600 text-white shadow-xl' : 'text-zinc-500 hover:text-white'}`}
  >
    {children}
  </button>
);

const AdminPanelBox: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
  const { theme } = useAppState();
  const isDark = theme === 'dark';
  return (
    <div className={`border rounded-[2rem] overflow-hidden shadow-2xl transition-all ${isDark ? 'bg-zinc-950/80 border-zinc-800' : 'bg-white border-zinc-100 shadow-xl'}`}>
      <div className="bg-rojo-600 px-6 py-3 border-b border-rojo-700 flex items-center justify-between">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">{title}</h3>
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-white/20"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-white/20"></div>
        </div>
      </div>
      <div className="min-h-[50px]">
        {children}
      </div>
    </div>
  );
};

const ActionBtn: React.FC<{ onClick: () => void; children: React.ReactNode; color?: 'rojo' | 'amber'; active?: boolean }> = ({ onClick, children, color, active }) => (
  <button 
    onClick={onClick}
    className={`w-full py-3.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all text-center ${
      active 
        ? 'bg-amber-600 border-amber-500 text-white' 
        : color === 'rojo' 
          ? 'bg-rojo-900/10 border-rojo-900/40 text-rojo-500 hover:bg-rojo-600 hover:text-white hover:border-rojo-500' 
          : color === 'amber'
            ? 'bg-amber-900/10 border-amber-900/40 text-amber-500 hover:bg-amber-600 hover:text-white hover:border-amber-500'
            : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:bg-zinc-800 hover:text-white'
    }`}
  >
    {children}
  </button>
);

const DetailRow: React.FC<{ label: string; val: string }> = ({ label, val }) => (
  <div className="flex justify-between items-center group">
    <span className="text-[9px] font-black uppercase text-zinc-600 tracking-widest group-hover:text-zinc-400 transition-colors">{label}</span>
    <span className="text-[10px] font-bold text-zinc-300">{val}</span>
  </div>
);

export default ModerationPanel;
