import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../AppStateContext';
import { ModStatus, Report, ReportType, User, Punishment } from '../types';
import Layout from '../components/Layout';

const ModerationPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'reports' | 'ip_bans'>('users');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { users, theme } = useAppState();

  const isDark = theme === 'dark';
  const selectedUser = users.find(u => u.id === selectedUserId);

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-140px)] gap-4 animate-in fade-in duration-500 overflow-hidden">
        <header className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight uppercase">Admin Console</h1>
            <p className="text-rojo-600 font-bold uppercase text-[9px] tracking-widest mt-1">Universal Management System v4.1</p>
          </div>
          <div className="flex bg-zinc-900/50 p-1 rounded-2xl border border-zinc-800 shrink-0">
            <NavTab active={activeTab === 'users'} onClick={() => setActiveTab('users')}>Users</NavTab>
            <NavTab active={activeTab === 'reports'} onClick={() => setActiveTab('reports')}>Queue</NavTab>
            <NavTab active={activeTab === 'ip_bans'} onClick={() => setActiveTab('ip_bans')}>Network</NavTab>
          </div>
        </header>

        <div className="flex-1 flex gap-4 overflow-hidden min-h-0">
          {activeTab === 'users' && (
            <>
              {/* Directory Pane */}
              <div className={`w-60 lg:w-64 flex flex-col border rounded-[1.5rem] overflow-hidden shrink-0 ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'}`}>
                <div className="p-3 border-b border-zinc-800/50">
                   <input 
                     type="text" 
                     placeholder="Database Search..." 
                     value={searchTerm}
                     onChange={e => setSearchTerm(e.target.value)}
                     className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-2 text-xs outline-none focus:ring-1 ring-rojo-600 transition-all"
                   />
                </div>
                <div className="flex-1 overflow-y-auto no-scrollbar">
                  {filteredUsers.map(user => (
                    <button 
                      key={user.id} 
                      onClick={() => setSelectedUserId(user.id)}
                      className={`w-full flex items-center gap-3 p-3 text-left transition-all border-b border-zinc-900/40 ${selectedUserId === user.id ? 'bg-rojo-600/10 border-r-4 border-rojo-600 shadow-inner' : 'hover:bg-zinc-900/30'}`}
                    >
                      <img src={user.avatarUrl} className={`w-7 h-7 rounded-lg border-2 shrink-0 ${user.status === 'Banned' ? 'border-rojo-600' : 'border-zinc-800'}`} alt="" />
                      <div className="min-w-0">
                        <p className={`text-[10px] font-black truncate ${selectedUserId === user.id ? 'text-rojo-500' : ''}`}>{user.displayName}</p>
                        <p className="text-[7px] text-zinc-500 font-bold uppercase truncate">@{user.username}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Inspector Pane */}
              <div className="flex-1 overflow-y-auto no-scrollbar pr-2 min-w-0">
                {selectedUser ? (
                  <UserInspector user={selectedUser} />
                ) : (
                  <div className="h-full border-4 border-dashed border-zinc-900 rounded-[2rem] flex items-center justify-center opacity-20">
                    <p className="font-black uppercase tracking-[0.5em] text-[10px]">Awaiting Data Selection</p>
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'ip_bans' && (
            <div className="flex-1 overflow-y-auto pr-2">
               <IpBanList />
            </div>
          )}

          {activeTab === 'reports' && (
             <div className="flex-1 flex items-center justify-center border rounded-[2rem] border-zinc-900 opacity-20">
                <p className="font-black uppercase tracking-[0.5em] text-[10px] text-zinc-500">Report Queue v2 Offline</p>
             </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

const UserInspector: React.FC<{ user: User }> = ({ user }) => {
  const { banUser, warnUser, unbanUser, updateUserNotes, toggleProtectedStatus, updateTargetUser, loginAs, fetchUserIpHistory, threads, posts } = useAppState();
  const [banReason, setBanReason] = useState('');
  const [banDuration, setBanDuration] = useState('1');
  const [doIpBan, setDoIpBan] = useState(false);
  const [resetName, setResetName] = useState(false);
  const [notes, setNotes] = useState(user.notes || '');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [ipHistory, setIpHistory] = useState<{ip: string, created_at: string, user_agent: string}[]>([]);
  const [showIpModal, setShowIpModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const getHistory = async () => {
      const logs = await fetchUserIpHistory(user.id);
      setIpHistory(logs);
    };
    getHistory();
    setNotes(user.notes || '');
  }, [user.id, fetchUserIpHistory, user.notes]);

  const handleNotesSave = async () => {
    setIsSavingNotes(true);
    await updateUserNotes(user.id, notes);
    setIsSavingNotes(false);
  };

  const userThreadsCreated = threads.filter(t => t.authorId === user.id);
  const userPostsCreated = posts.filter(p => p.authorId === user.id);
  const threadsLiked = threads.filter(t => t.likedBy?.includes(user.id));
  const postsLiked = posts.filter(p => p.likedBy?.includes(user.id));
  const lastLogin = ipHistory.length > 0 ? new Date(ipHistory[0].created_at).toLocaleString() : 'NEVER';

  return (
    <div className="flex flex-col gap-4 pb-8">
      {/* Profile Row */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-4 lg:col-span-3">
          <AdminPanelBox title="Account Profile">
            <div className="flex flex-col items-center p-4 text-center">
              <img src={user.avatarUrl} className="w-20 h-20 rounded-xl border-4 border-zinc-900 shadow-xl mb-3 object-cover" alt="" />
              <h2 className="text-sm font-black tracking-tight truncate w-full">{user.displayName}</h2>
              <p className="text-rojo-600 font-bold text-[8px] uppercase tracking-widest mt-0.5 truncate w-full">@{user.username}</p>
              
              <div className="grid grid-cols-2 gap-2 w-full mt-4">
                <div className="p-2 rounded-lg bg-zinc-900/50">
                  <p className="text-[10px] font-black">{user.postCount}</p>
                  <p className="text-[6px] uppercase font-bold text-zinc-500">Posts</p>
                </div>
                <div className="p-2 rounded-lg bg-zinc-900/50">
                  <p className="text-[10px] font-black">{new Date(user.joinDate).getFullYear()}</p>
                  <p className="text-[6px] uppercase font-bold text-zinc-500">Joined</p>
                </div>
              </div>
            </div>
          </AdminPanelBox>
        </div>

        <div className="md:col-span-8 lg:col-span-9 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AdminPanelBox title="Account Settings">
            <div className="p-4 space-y-3">
              <div>
                <label className="text-[7px] font-black uppercase text-zinc-600 tracking-widest block mb-1">Display Name</label>
                <input 
                  type="text" 
                  defaultValue={user.displayName}
                  onBlur={e => updateTargetUser(user.id, { displayName: e.target.value })}
                  className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-1.5 text-[10px] outline-none"
                />
              </div>
              <div>
                <label className="text-[7px] font-black uppercase text-zinc-600 tracking-widest block mb-1">Role</label>
                <select 
                  defaultValue={user.role}
                  onChange={e => updateTargetUser(user.id, { role: e.target.value as any })}
                  className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-1.5 text-[10px] outline-none font-bold"
                >
                  <option value="User">Standard Member</option>
                  <option value="Moderator">Moderator</option>
                  <option value="Admin">Administrator</option>
                </select>
              </div>
            </div>
          </AdminPanelBox>

          <AdminPanelBox title="Access Logs">
             <div className="p-4 space-y-2">
                <DetailRow label="Last Seen" val={lastLogin} />
                <div onClick={() => setShowIpModal(true)} className="cursor-pointer group">
                  <DetailRow label="Known IP" val={user.lastIp || 'PRIVATE'} />
                  <p className="text-[6px] text-right text-zinc-700 uppercase group-hover:text-rojo-600 transition-colors">Click to view log history</p>
                </div>
                <DetailRow label="Account Verified" val={user.email ? 'YES' : 'NO'} />
                <DetailRow label="Status" val={user.status} />
             </div>
          </AdminPanelBox>
        </div>
      </div>

      {/* Stats & Actions Row */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-4 lg:col-span-3 space-y-4">
           <AdminPanelBox title="Staff Actions">
              <div className="grid grid-cols-1 gap-1.5 p-3">
                 <ActionBtn onClick={() => navigate(`/profile/${user.id}`)}>User Profile</ActionBtn>
                 <ActionBtn onClick={() => { loginAs(user.id); navigate('/'); }}>Impersonate</ActionBtn>
                 <ActionBtn onClick={() => toggleProtectedStatus(user.id)} active={user.isProtected} color="amber">
                    {user.isProtected ? 'PROTECTED' : 'GRANT PROTECTION'}
                 </ActionBtn>
              </div>
           </AdminPanelBox>
        </div>

        <div className="md:col-span-8 lg:col-span-9">
           <AdminPanelBox title="Activity Analysis">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-4">
                 <StatBox label="Threads Created" val={userThreadsCreated.length} />
                 <StatBox label="Replies Posted" val={userPostsCreated.length} />
                 <StatBox label="Likes Given (Threads)" val={threadsLiked.length} />
                 <StatBox label="Likes Given (Posts)" val={postsLiked.length} />
              </div>
           </AdminPanelBox>
        </div>
      </div>

      {/* Moderation Row */}
      <AdminPanelBox title="Punishment Control Panel">
        <div className="p-4">
          <div className="flex flex-col md:flex-row gap-3 mb-4">
            <div className="flex-1">
              <label className="text-[7px] font-black uppercase text-zinc-600 tracking-widest block mb-1">Reason for Action</label>
              <input 
                value={banReason}
                onChange={e => setBanReason(e.target.value)}
                placeholder="Guideline breach details..."
                className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-2 text-[10px] outline-none"
              />
            </div>
            <div className="md:w-28">
              <label className="text-[7px] font-black uppercase text-zinc-600 tracking-widest block mb-1">Duration</label>
              <select 
                value={banDuration}
                onChange={e => setBanDuration(e.target.value)}
                className="w-full bg-black border border-zinc-800 rounded-lg px-2 py-2 text-[10px] outline-none"
              >
                <option value="1">1 Day</option>
                <option value="7">7 Days</option>
                <option value="30">30 Days</option>
                <option value="Permanent">Permanent</option>
              </select>
            </div>
          </div>
          <div className="flex items-center justify-between gap-4 pt-3 border-t border-zinc-800/20">
             <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" checked={doIpBan} onChange={e => setDoIpBan(e.target.checked)} className="w-3 h-3 rounded bg-black text-rojo-600" />
                  <span className="text-[8px] font-black uppercase text-zinc-500 group-hover:text-white">IP Ban</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" checked={resetName} onChange={e => setResetName(e.target.checked)} className="w-3 h-3 rounded bg-black text-rojo-600" />
                  <span className="text-[8px] font-black uppercase text-zinc-500 group-hover:text-white">Reset Name</span>
                </label>
             </div>
             <div className="flex gap-2">
                <button onClick={() => warnUser(user.id, banReason)} className="bg-amber-600 text-white px-4 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest">Warn</button>
                {user.status === 'Banned' ? (
                  <button onClick={() => unbanUser(user.id)} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest">Unban</button>
                ) : (
                  <button onClick={() => banUser(user.id, banReason, banDuration, doIpBan, resetName)} className="bg-rojo-600 text-white px-4 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest">Ban</button>
                )}
             </div>
          </div>
        </div>
      </AdminPanelBox>

      {/* History & Notes Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AdminPanelBox title="Punishment Logs">
           <div className="overflow-x-auto max-h-[160px] no-scrollbar">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-zinc-900 z-10 border-b border-zinc-800">
                  <tr className="text-[7px] uppercase font-black tracking-widest text-zinc-600">
                    <th className="px-4 py-2">Action</th>
                    <th className="px-4 py-2">Staff</th>
                    <th className="px-4 py-2">Created</th>
                    <th className="px-4 py-2 text-right">Expiry</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900/40 text-[8px] font-bold">
                  {(user.punishments || []).map(p => (
                    <tr key={p.id} className="hover:bg-zinc-900/40 transition-colors">
                      <td className="px-4 py-2">
                        <span className={`px-1.5 py-0.5 rounded ${
                          p.action === 'Ban' ? 'bg-rojo-600/10 text-rojo-600' :
                          p.action === 'Warn' ? 'bg-amber-600/10 text-amber-500' :
                          'bg-zinc-800 text-zinc-400'
                        }`}>{p.action}</span>
                      </td>
                      <td className="px-4 py-2 text-zinc-400">@{p.moderator}</td>
                      <td className="px-4 py-2 text-zinc-600">{new Date(p.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-2 text-right text-zinc-700">{p.expiration}</td>
                    </tr>
                  ))}
                  {(user.punishments || []).length === 0 && (
                    <tr><td colSpan={4} className="px-4 py-10 text-center opacity-20 uppercase tracking-widest">No Logs</td></tr>
                  )}
                </tbody>
              </table>
           </div>
        </AdminPanelBox>

        <AdminPanelBox title="Staff Notes">
           <div className="p-4">
              <textarea 
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full h-20 bg-black border border-zinc-800 rounded-xl p-3 text-[10px] text-white outline-none focus:ring-1 ring-rojo-600 transition-all mb-2"
                placeholder="Confidential comments..."
              />
              <div className="flex justify-end">
                 <button onClick={handleNotesSave} disabled={isSavingNotes} className="bg-zinc-800 text-zinc-100 px-4 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-zinc-700 transition-all">
                   {isSavingNotes ? 'Updating...' : 'Commit Notes'}
                 </button>
              </div>
           </div>
        </AdminPanelBox>
      </div>

      {/* IP History Modal */}
      {showIpModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[200] flex items-center justify-center p-6 animate-in fade-in duration-200">
           <div className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-[2rem] overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
              <div className="bg-rojo-600 p-6 flex items-center justify-between">
                 <h3 className="text-sm font-black uppercase tracking-widest text-white">Network & Device History: @{user.username}</h3>
                 <button onClick={() => setShowIpModal(false)} className="text-white hover:opacity-70">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                 </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-3 no-scrollbar">
                 {user.role === 'Admin' ? (
                   <div className="py-20 text-center opacity-40 italic text-xs uppercase font-black tracking-widest">
                     Administrative Privacy Active. No IPs logged.
                   </div>
                 ) : ipHistory.length > 0 ? (
                    ipHistory.map((log, i) => (
                      <div key={i} className="p-4 rounded-xl bg-zinc-900/50 border border-zinc-800 flex justify-between items-start gap-4">
                         <div className="min-w-0">
                            <p className="text-rojo-500 font-black text-xs tracking-tight">{log.ip}</p>
                            <p className="text-[8px] text-zinc-600 font-bold uppercase truncate mt-1">{log.user_agent}</p>
                         </div>
                         <p className="text-[9px] font-black uppercase text-zinc-500 shrink-0">{new Date(log.created_at).toLocaleString()}</p>
                      </div>
                    ))
                 ) : (
                    <div className="py-20 text-center opacity-40 italic text-xs uppercase font-black tracking-widest">
                      No network records found.
                    </div>
                 )}
              </div>
              <div className="p-6 border-t border-zinc-900 bg-black/20">
                 <button onClick={() => setShowIpModal(false)} className="w-full bg-zinc-900 text-zinc-400 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800">Close Audit</button>
              </div>
           </div>
        </div>
      )}
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
    <div className="space-y-4 max-w-3xl mx-auto">
      <AdminPanelBox title="Manual Firewall Control">
         <div className="p-6 flex flex-col sm:flex-row gap-3">
            <input value={newIp} onChange={e => setNewIp(e.target.value)} placeholder="IP Address..." className="flex-1 bg-black border border-zinc-800 rounded-lg px-4 py-2 text-xs outline-none" />
            <input value={reason} onChange={e => setReason(e.target.value)} className="flex-1 bg-black border border-zinc-800 rounded-lg px-4 py-2 text-xs outline-none" />
            <button onClick={handleAdd} className="bg-rojo-600 text-white px-6 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest shrink-0">Blacklist</button>
         </div>
      </AdminPanelBox>

      <AdminPanelBox title="Global Restricted Assets">
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead className="border-b border-zinc-800 bg-zinc-900/20">
                  <tr className="text-[8px] uppercase font-black tracking-widest text-zinc-600">
                     <th className="px-6 py-3">Address</th>
                     <th className="px-6 py-3">Context</th>
                     <th className="px-6 py-3 text-right">Action</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-zinc-900/40 text-[10px] font-bold">
                  {ipBans.map(ban => (
                    <tr key={ban.id}>
                       <td className="px-6 py-3">
                          <p className="text-rojo-500">{ban.ip_address}</p>
                          {ban.ip_address === clientIp && <span className="text-[7px] text-emerald-500 uppercase font-black">Self</span>}
                       </td>
                       <td className="px-6 py-3 italic text-zinc-500 truncate max-w-[200px]">"{ban.reason}"</td>
                       <td className="px-6 py-3 text-right">
                          <button onClick={() => unbanIp(ban.ip_address)} className="text-[8px] font-black uppercase text-emerald-500 hover:underline">Revoke</button>
                       </td>
                    </tr>
                  ))}
                  {ipBans.length === 0 && (
                    <tr><td colSpan={3} className="px-6 py-12 text-center opacity-20 uppercase tracking-[0.4em]">Firewall Clear</td></tr>
                  )}
               </tbody>
            </table>
         </div>
      </AdminPanelBox>
    </div>
  );
};

const StatBox: React.FC<{ label: string; val: number }> = ({ label, val }) => (
  <div className="bg-black/20 border border-zinc-900 p-4 rounded-xl text-center group hover:border-rojo-900/30 transition-all">
     <p className="text-xl font-black text-white group-hover:text-rojo-600 transition-colors">{val}</p>
     <p className="text-[7px] font-black uppercase text-zinc-600 tracking-widest mt-1">{label}</p>
  </div>
);

const NavTab: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
  <button onClick={onClick} className={`px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${active ? 'bg-rojo-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}>
    {children}
  </button>
);

const AdminPanelBox: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
  const { theme } = useAppState();
  const isDark = theme === 'dark';
  return (
    <div className={`border rounded-2xl overflow-hidden shadow-xl transition-all h-full ${isDark ? 'bg-zinc-950/80 border-zinc-800' : 'bg-white border-zinc-100 shadow-sm'}`}>
      <div className="bg-rojo-600 px-4 py-1.5 border-b border-rojo-700 flex items-center justify-between shrink-0">
        <h3 className="text-[8px] font-black uppercase tracking-[0.2em] text-white">{title}</h3>
        <div className="flex gap-1">
          <div className="w-1 h-1 rounded-full bg-white/20"></div>
          <div className="w-1 h-1 rounded-full bg-white/20"></div>
        </div>
      </div>
      <div className="min-h-0">{children}</div>
    </div>
  );
};

const ActionBtn: React.FC<{ onClick: () => void; children: React.ReactNode; color?: 'rojo' | 'amber'; active?: boolean }> = ({ onClick, children, color, active }) => (
  <button onClick={onClick} className={`w-full py-2 rounded-lg text-[8px] font-black uppercase tracking-widest border transition-all ${
      active 
        ? 'bg-amber-600 border-amber-500 text-white shadow-lg' 
        : color === 'rojo' 
          ? 'bg-rojo-900/10 border-rojo-900/40 text-rojo-500 hover:bg-rojo-600 hover:text-white' 
          : color === 'amber'
            ? 'bg-amber-900/10 border-amber-900/40 text-amber-500 hover:bg-amber-600 hover:text-white'
            : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:bg-zinc-800 hover:text-white'
    }`}>
    {children}
  </button>
);

const DetailRow: React.FC<{ label: string; val: string }> = ({ label, val }) => (
  <div className="flex justify-between items-center group gap-4 py-0.5">
    <span className="text-[7px] font-black uppercase text-zinc-600 tracking-widest shrink-0">{label}</span>
    <span className="text-[8px] font-bold text-zinc-400 truncate text-right">{val}</span>
  </div>
);

export default ModerationPanel;