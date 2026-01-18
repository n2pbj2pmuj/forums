
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../AppStateContext';
import { ModStatus, Report, ReportType, User, Punishment, ModNote } from '../types';
import Layout from '../components/Layout';

const ModerationPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'reports' | 'ip_bans'>('users');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { users, theme, currentUser } = useAppState();
  const navigate = useNavigate();

  // Redundant check in case routing is bypassed
  const isStaff = currentUser?.role === 'Admin' || currentUser?.role === 'Moderator';
  useEffect(() => {
    if (!isStaff) navigate('/');
  }, [isStaff, navigate]);

  const isDark = theme === 'dark';
  const selectedUser = users.find(u => u.id === selectedUserId);

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isStaff) return null;

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-140px)] gap-4 animate-in fade-in duration-500 overflow-hidden">
        <header className="flex flex-col md:flex-row items-center justify-between gap-4">
          <h1 className="text-2xl font-black tracking-tight uppercase">Admin Panel</h1>
          <div className="flex bg-zinc-900/50 p-1 rounded-2xl border border-zinc-800 shrink-0">
            <NavTab active={activeTab === 'users'} onClick={() => setActiveTab('users')}>Users</NavTab>
            <NavTab active={activeTab === 'reports'} onClick={() => setActiveTab('reports')}>Queue</NavTab>
            <NavTab active={activeTab === 'ip_bans'} onClick={() => setActiveTab('ip_bans')}>Network</NavTab>
          </div>
        </header>

        <div className="flex-1 flex gap-4 overflow-hidden min-h-0">
          {activeTab === 'users' && (
            <>
              {/* Directory Sidebar */}
              <div className={`w-60 lg:w-64 flex flex-col border rounded-[1.5rem] overflow-hidden shrink-0 ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'}`}>
                <div className="p-3 border-b border-zinc-800/50">
                   <input 
                     type="text" 
                     placeholder="Search Database..." 
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

              {/* Inspector Content */}
              <div className="flex-1 overflow-y-auto no-scrollbar pr-2 min-w-0">
                {selectedUser ? (
                  /* CRITICAL: key prop ensures all local state (inputs, reasons, etc) reset when switching users */
                  <UserInspector key={selectedUser.id} user={selectedUser} />
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
                <p className="font-black uppercase tracking-[0.5em] text-[10px] text-zinc-500">Report Queue Offline</p>
             </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

const UserInspector: React.FC<{ user: User }> = ({ user }) => {
  const { banUser, warnUser, unbanUser, updateUserNotes, toggleProtectedStatus, updateTargetUser, loginAs, fetchUserIpHistory, threads, posts } = useAppState();
  
  // Local states reset automatically when user.id changes thanks to the key prop on the parent
  const [banReason, setBanReason] = useState('');
  const [banDuration, setBanDuration] = useState('1');
  const [doIpBan, setDoIpBan] = useState(false);
  const [resetName, setResetName] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [ipHistory, setIpHistory] = useState<{ip: string, created_at: string, user_agent: string}[]>([]);
  const [showIpModal, setShowIpModal] = useState(false);
  const [expandedReason, setExpandedReason] = useState<string | null>(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    const getHistory = async () => {
      const logs = await fetchUserIpHistory(user.id);
      setIpHistory(logs);
    };
    getHistory();
  }, [user.id, fetchUserIpHistory]);

  const handleNoteCommit = async () => {
    if (!noteContent.trim()) return;
    setIsSavingNotes(true);
    await updateUserNotes(user.id, noteContent);
    setNoteContent('');
    setIsSavingNotes(false);
  };

  const userThreadsCreated = threads.filter(t => t.authorId === user.id);
  const userPostsCreated = posts.filter(p => p.authorId === user.id);
  const lastLogin = ipHistory.length > 0 ? new Date(ipHistory[0].created_at).toLocaleString() : 'NEVER';

  return (
    <div className="flex flex-col gap-4 pb-8">
      {/* Top Profile Row */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-4 lg:col-span-3">
          <AdminPanelBox title="Account Profile">
            <div className="flex flex-col items-center p-4 text-center">
              <img src={user.avatarUrl} className="w-16 h-16 rounded-xl border-4 border-zinc-900 shadow-xl mb-3 object-cover" alt="" />
              <h2 className="text-[11px] font-black tracking-tight truncate w-full">{user.displayName}</h2>
              <p className="text-rojo-600 font-bold text-[7px] uppercase tracking-widest truncate w-full">@{user.username}</p>
              <div className="grid grid-cols-2 gap-2 w-full mt-3">
                <div className="p-2 rounded-lg bg-zinc-900/50">
                  <p className="text-[9px] font-black">{user.postCount}</p>
                  <p className="text-[5px] uppercase font-bold text-zinc-500">Posts</p>
                </div>
                <div className="p-2 rounded-lg bg-zinc-900/50">
                  <p className="text-[9px] font-black">{new Date(user.joinDate).getFullYear()}</p>
                  <p className="text-[5px] uppercase font-bold text-zinc-500">Joined</p>
                </div>
              </div>
            </div>
          </AdminPanelBox>
        </div>

        <div className="md:col-span-8 lg:col-span-9 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AdminPanelBox title="Profile Settings">
            <div className="p-3 space-y-2">
              <div>
                <label className="text-[6px] font-black uppercase text-zinc-600 tracking-widest block mb-1">Display Name</label>
                <input 
                  type="text" 
                  defaultValue={user.displayName} 
                  onBlur={e => updateTargetUser(user.id, { displayName: e.target.value })} 
                  className="w-full bg-black border border-zinc-800 rounded-lg px-2 py-1 text-[9px] outline-none" 
                />
              </div>
              <div>
                <label className="text-[6px] font-black uppercase text-zinc-600 tracking-widest block mb-1">Permission Level</label>
                <select 
                  defaultValue={user.role} 
                  onChange={e => updateTargetUser(user.id, { role: e.target.value as any })} 
                  className="w-full bg-black border border-zinc-800 rounded-lg px-2 py-1 text-[9px] outline-none font-bold"
                >
                  <option value="User">Standard User</option>
                  <option value="Moderator">Moderator</option>
                  <option value="Admin">Administrator</option>
                </select>
              </div>
            </div>
          </AdminPanelBox>
          <AdminPanelBox title="Network Identity">
             <div className="p-3 space-y-1.5">
                <DetailRow label="Last Seen" val={lastLogin} />
                <div onClick={() => setShowIpModal(true)} className="cursor-pointer group">
                  <DetailRow label="Known IP" val={user.lastIp || 'HIDDEN'} />
                  <p className="text-[5px] text-right text-zinc-700 uppercase group-hover:text-rojo-600 transition-colors">Audit History</p>
                </div>
                <DetailRow label="Status" val={user.status} />
             </div>
          </AdminPanelBox>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-4 lg:col-span-3">
           <AdminPanelBox title="Quick Actions">
              <div className="grid grid-cols-1 gap-1 p-3">
                 <ActionBtn onClick={() => navigate(`/profile/${user.id}`)}>Public Profile</ActionBtn>
                 <ActionBtn onClick={() => loginAs(user.id)}>Login As</ActionBtn>
                 <ActionBtn onClick={() => toggleProtectedStatus(user.id)} active={user.isProtected} color="amber">
                    {user.isProtected ? 'PROTECTED' : 'GRANT PROTECTION'}
                 </ActionBtn>
              </div>
           </AdminPanelBox>
        </div>
        <div className="md:col-span-8 lg:col-span-9">
           <AdminPanelBox title="Account Statistics">
              <div className="grid grid-cols-4 gap-2 p-3">
                 <StatBox label="Threads" val={userThreadsCreated.length} />
                 <StatBox label="Replies" val={userPostsCreated.length} />
                 <StatBox label="Net Entries" val={ipHistory.length} />
                 <StatBox label="Incidents" val={(user.punishments || []).length} />
              </div>
           </AdminPanelBox>
        </div>
      </div>

      <AdminPanelBox title="Moderation & Punishment">
        <div className="p-3">
          <div className="flex gap-2 mb-2">
            <input 
              value={banReason} 
              onChange={e => setBanReason(e.target.value)} 
              placeholder="Reason for moderation action..." 
              className="flex-1 bg-black border border-zinc-800 rounded-lg px-3 py-1.5 text-[9px] outline-none focus:border-rojo-600 transition-colors" 
            />
            <select 
              value={banDuration} 
              onChange={e => setBanDuration(e.target.value)} 
              className="w-20 bg-black border border-zinc-800 rounded-lg px-2 py-1.5 text-[9px] outline-none"
            >
              <option value="1">1D</option>
              <option value="7">7D</option>
              <option value="30">30D</option>
              <option value="Permanent">PERM</option>
            </select>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-zinc-800/20">
             <div className="flex gap-3">
                <label className="flex items-center gap-1.5 cursor-pointer group">
                  <input type="checkbox" checked={doIpBan} onChange={e => setDoIpBan(e.target.checked)} className="w-2.5 h-2.5 rounded bg-black text-rojo-600 focus:ring-0" />
                  <span className="text-[7px] font-black uppercase text-zinc-500 group-hover:text-zinc-300">IP Ban</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer group">
                  <input type="checkbox" checked={resetName} onChange={e => setResetName(e.target.checked)} className="w-2.5 h-2.5 rounded bg-black text-rojo-600 focus:ring-0" />
                  <span className="text-[7px] font-black uppercase text-zinc-500 group-hover:text-zinc-300">Reset Name</span>
                </label>
             </div>
             <div className="flex gap-1.5">
                <button onClick={() => warnUser(user.id, banReason)} className="bg-amber-600 text-white px-3 py-1 rounded text-[7px] font-black uppercase tracking-widest hover:bg-amber-500 transition-all">Warn</button>
                {user.status === 'Banned' ? (
                  <button onClick={() => unbanUser(user.id)} className="bg-emerald-600 text-white px-3 py-1 rounded text-[7px] font-black uppercase tracking-widest hover:bg-emerald-500 transition-all">Unban</button>
                ) : (
                  <button onClick={() => banUser(user.id, banReason, banDuration, doIpBan, resetName)} className="bg-rojo-600 text-white px-3 py-1 rounded text-[7px] font-black uppercase tracking-widest hover:bg-rojo-500 transition-all">Ban</button>
                )}
             </div>
          </div>
        </div>
      </AdminPanelBox>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AdminPanelBox title="Punishment History">
           <div className="overflow-y-auto h-[220px] no-scrollbar">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-zinc-900 border-b border-zinc-800">
                  <tr className="text-[6px] uppercase font-black tracking-widest text-zinc-600">
                    <th className="px-3 py-2">Action</th>
                    <th className="px-3 py-2">Staff</th>
                    <th className="px-3 py-2">Reason</th>
                    <th className="px-3 py-2 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900/40 text-[7px] font-bold">
                  {(user.punishments || []).map(p => (
                    <tr key={p.id} className="hover:bg-zinc-900/20 group transition-colors">
                      <td className="px-3 py-2">
                        <span className={`px-1 py-0.5 rounded ${p.action === 'Ban' ? 'text-rojo-50 text-rojo-600' : p.action === 'Warn' ? 'text-amber-500 bg-amber-500/10' : 'text-zinc-500'}`}>{p.action}</span>
                      </td>
                      <td className="px-3 py-2 text-zinc-400">@{p.moderator}</td>
                      <td className="px-3 py-2 text-zinc-500 max-w-[140px]">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate flex-1">{p.reason}</span>
                          {p.reason.length > 18 && (
                            <button 
                              onClick={() => setExpandedReason(p.reason)}
                              className="text-[6px] text-rojo-500 hover:text-rojo-400 font-black uppercase shrink-0 transition-colors"
                            >
                              View
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right text-zinc-600">{new Date(p.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {(user.punishments || []).length === 0 && (
                    <tr><td colSpan={4} className="px-3 py-10 text-center opacity-20 uppercase tracking-widest">No previous violations</td></tr>
                  )}
                </tbody>
              </table>
           </div>
        </AdminPanelBox>

        <AdminPanelBox title="Staff Case Notes">
           <div className="flex flex-col h-[220px]">
              <div className="flex-1 overflow-y-auto p-2 space-y-2 no-scrollbar border-b border-zinc-900/40">
                {(user.mod_notes || []).map(note => (
                  <div key={note.id} className="p-2 rounded-lg bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700 transition-all">
                     <div className="flex justify-between items-center mb-1">
                        <span className="text-[6px] font-black uppercase text-rojo-600">Staff: @{note.moderator}</span>
                        <span className="text-[6px] text-zinc-600 font-bold">{new Date(note.created_at).toLocaleString()}</span>
                     </div>
                     <p className="text-[8px] text-zinc-300 font-medium italic leading-relaxed">"{note.content}"</p>
                  </div>
                ))}
                {(user.mod_notes || []).length === 0 && (
                  <div className="h-full flex items-center justify-center opacity-20 uppercase tracking-[0.2em] text-[7px]">Clear Case History</div>
                )}
              </div>
              <div className="p-2 flex gap-1">
                 <input 
                    value={noteContent} 
                    onChange={e => setNoteContent(e.target.value)} 
                    onKeyDown={e => e.key === 'Enter' && handleNoteCommit()}
                    placeholder="Append internal comment..." 
                    className="flex-1 bg-black border border-zinc-800 rounded px-2 py-1.5 text-[8px] outline-none focus:border-rojo-600 transition-colors" 
                  />
                 <button 
                    onClick={handleNoteCommit} 
                    disabled={isSavingNotes || !noteContent.trim()} 
                    className="bg-zinc-800 text-zinc-300 px-3 py-1 rounded text-[7px] font-black uppercase hover:bg-zinc-700 transition-all disabled:opacity-20"
                  >
                    {isSavingNotes ? '...' : 'Add'}
                  </button>
              </div>
           </div>
        </AdminPanelBox>
      </div>

      {/* Audit Modal for Long Reasons */}
      {expandedReason && (
        <div className="fixed inset-0 bg-black/80 z-[300] flex items-center justify-center p-6 backdrop-blur-sm animate-in zoom-in duration-200">
          <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-[1.5rem] overflow-hidden shadow-2xl">
             <div className="bg-zinc-900 p-4 border-b border-zinc-800 flex justify-between items-center">
                <h3 className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Violation Data</h3>
                <button onClick={() => setExpandedReason(null)} className="text-zinc-600 hover:text-white">Close</button>
             </div>
             <div className="p-10">
                <p className="text-zinc-200 text-sm leading-relaxed italic font-medium">"{expandedReason}"</p>
             </div>
             <div className="p-4 bg-zinc-900/50 flex justify-end">
                <button onClick={() => setExpandedReason(null)} className="bg-rojo-600 text-white px-6 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-rojo-500 shadow-xl transition-all">Dismiss Audit</button>
             </div>
          </div>
        </div>
      )}

      {/* IP Audit Modal */}
      {showIpModal && (
        <div className="fixed inset-0 bg-black/95 z-[200] flex items-center justify-center p-6 backdrop-blur-md animate-in fade-in duration-300">
           <div className="w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-[2rem] overflow-hidden flex flex-col max-h-[80vh] shadow-[0_0_100px_rgba(255,0,0,0.1)]">
              <div className="bg-rojo-600 p-5 flex items-center justify-between">
                 <h3 className="text-xs font-black uppercase tracking-widest text-white">Network Records: @{user.username}</h3>
                 <button onClick={() => setShowIpModal(false)} className="text-white hover:opacity-70 transition-opacity">Close</button>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-2 no-scrollbar">
                 {user.role === 'Admin' ? (
                   <div className="py-24 text-center opacity-40 uppercase font-black text-[9px] tracking-[0.4em]">Administrative Data Masked</div>
                 ) : ipHistory.length > 0 ? ipHistory.map((log, i) => (
                    <div key={i} className="p-3 rounded-xl bg-zinc-900/50 border border-zinc-800 flex justify-between gap-4 group hover:border-rojo-900/30 transition-all">
                       <div className="min-w-0">
                          <p className="text-rojo-500 font-black text-[10px] tracking-tight">{log.ip}</p>
                          <p className="text-[6px] text-zinc-600 uppercase truncate mt-0.5">{log.user_agent}</p>
                       </div>
                       <p className="text-[8px] font-black uppercase text-zinc-500 group-hover:text-zinc-300 transition-colors">{new Date(log.created_at).toLocaleString()}</p>
                    </div>
                 )) : (
                   <div className="py-24 text-center opacity-40 uppercase font-black text-[9px] tracking-[0.4em]">No Network History Found</div>
                 )}
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

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <AdminPanelBox title="Manual Firewall Entry">
         <div className="p-4 flex gap-2">
            <input value={newIp} onChange={e => setNewIp(e.target.value)} placeholder="Target IP..." className="flex-1 bg-black border border-zinc-800 rounded-lg px-3 py-1.5 text-[9px] outline-none" />
            <button onClick={() => addManualIpBan(newIp, reason)} className="bg-rojo-600 text-white px-4 py-1.5 rounded-lg text-[8px] font-black uppercase hover:bg-rojo-500 transition-all shrink-0">Blacklist</button>
         </div>
      </AdminPanelBox>
      <AdminPanelBox title="Active Infrastructure Bans">
         <div className="overflow-x-auto h-[350px] no-scrollbar">
            <table className="w-full text-left">
               <thead className="border-b border-zinc-800 bg-zinc-900/20">
                  <tr className="text-[7px] uppercase font-black text-zinc-600">
                     <th className="px-4 py-2">IP Asset</th>
                     <th className="px-4 py-2">Context</th>
                     <th className="px-4 py-2 text-right">Action</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-zinc-900/40 text-[9px] font-bold">
                  {ipBans.map(ban => (
                    <tr key={ban.id} className="hover:bg-zinc-900/20 transition-colors">
                       <td className="px-4 py-2 text-rojo-500">{ban.ip_address}</td>
                       <td className="px-4 py-2 italic text-zinc-500 truncate max-w-[150px]">"{ban.reason}"</td>
                       <td className="px-4 py-2 text-right"><button onClick={() => unbanIp(ban.ip_address)} className="text-[7px] font-black text-emerald-500 hover:underline">Revoke</button></td>
                    </tr>
                  ))}
                  {ipBans.length === 0 && (
                    <tr><td colSpan={3} className="px-6 py-20 text-center opacity-10 uppercase tracking-[0.5em]">Network Clean</td></tr>
                  )}
               </tbody>
            </table>
         </div>
      </AdminPanelBox>
    </div>
  );
};

const StatBox: React.FC<{ label: string; val: number }> = ({ label, val }) => (
  <div className="bg-black/20 border border-zinc-900 p-2 rounded-xl text-center hover:border-zinc-700 transition-all group">
     <p className="text-sm font-black text-white group-hover:text-rojo-500 transition-colors">{val}</p>
     <p className="text-[5px] font-black uppercase text-zinc-600 tracking-widest">{label}</p>
  </div>
);

const NavTab: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
  <button onClick={onClick} className={`px-4 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${active ? 'bg-rojo-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}>
    {children}
  </button>
);

const AdminPanelBox: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl flex flex-col h-full hover:shadow-rojo-950/5 transition-all">
    <div className="bg-rojo-600 px-3 py-1 border-b border-rojo-700">
      <h3 className="text-[7px] font-black uppercase tracking-widest text-white">{title}</h3>
    </div>
    <div className="flex-1 min-h-0">{children}</div>
  </div>
);

const ActionBtn: React.FC<{ onClick: () => void; children: React.ReactNode; color?: 'rojo' | 'amber'; active?: boolean }> = ({ onClick, children, color, active }) => (
  <button onClick={onClick} className={`w-full py-1.5 rounded-lg text-[7px] font-black uppercase border transition-all ${
      active ? 'bg-amber-600 border-amber-500 text-white shadow-lg' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:bg-zinc-800 hover:text-white'
    }`}>
    {children}
  </button>
);

const DetailRow: React.FC<{ label: string; val: string }> = ({ label, val }) => (
  <div className="flex justify-between items-center gap-2">
    <span className="text-[6px] font-black uppercase text-zinc-600 tracking-tighter">{label}</span>
    <span className="text-[7px] font-bold text-zinc-400 truncate max-w-[90px] text-right">{val}</span>
  </div>
);

export default ModerationPanel;
