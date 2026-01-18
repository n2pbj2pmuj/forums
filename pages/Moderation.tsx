import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../AppStateContext';
import { ModStatus, Report, ReportType, User } from '../types';
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
      <div className="flex flex-col h-[calc(100vh-140px)] gap-6 animate-in fade-in duration-500 overflow-hidden">
        <header className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight uppercase">Admin Console</h1>
            <p className="text-rojo-600 font-bold uppercase text-[10px] tracking-widest mt-1">Universal Management System v4.0</p>
          </div>
          <div className="flex bg-zinc-900/50 p-1 rounded-2xl border border-zinc-800 shrink-0">
            <NavTab active={activeTab === 'users'} onClick={() => setActiveTab('users')}>Users</NavTab>
            <NavTab active={activeTab === 'reports'} onClick={() => setActiveTab('reports')}>Queue</NavTab>
            <NavTab active={activeTab === 'ip_bans'} onClick={() => setActiveTab('ip_bans')}>Network</NavTab>
          </div>
        </header>

        <div className="flex-1 flex gap-6 overflow-hidden min-h-0">
          {activeTab === 'users' && (
            <>
              {/* Directory Pane - Reduced width to save space */}
              <div className={`w-64 lg:w-72 flex flex-col border rounded-[2rem] overflow-hidden shrink-0 ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'}`}>
                <div className="p-4 border-b border-zinc-800/50">
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
                      className={`w-full flex items-center gap-3 p-4 text-left transition-all border-b border-zinc-900/40 ${selectedUserId === user.id ? 'bg-rojo-600/10 border-r-4 border-rojo-600 shadow-inner' : 'hover:bg-zinc-900/30'}`}
                    >
                      <img src={user.avatarUrl} className={`w-8 h-8 rounded-lg border-2 shrink-0 ${user.status === 'Banned' ? 'border-rojo-600' : 'border-zinc-800'}`} alt="" />
                      <div className="min-w-0">
                        <p className={`text-[11px] font-black truncate ${selectedUserId === user.id ? 'text-rojo-500' : ''}`}>{user.displayName}</p>
                        <p className="text-[8px] text-zinc-500 font-bold uppercase truncate">@{user.username}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Inspector Pane - Fully responsive with no fixed widths */}
              <div className="flex-1 flex flex-col gap-6 overflow-y-auto no-scrollbar min-w-0 pr-2">
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
            <div className="flex-1 overflow-y-auto pr-2">
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
  const { banUser, warnUser, unbanUser, updateUserNotes, toggleProtectedStatus, updateTargetUser, loginAs, fetchUserIpHistory, threads, posts } = useAppState();
  const [banReason, setBanReason] = useState('');
  const [banDuration, setBanDuration] = useState('1');
  const [doIpBan, setDoIpBan] = useState(false);
  const [resetName, setResetName] = useState(false);
  const [notes, setNotes] = useState(user.notes || '');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [lastLogin, setLastLogin] = useState<string>('NEVER');
  const navigate = useNavigate();

  useEffect(() => {
    const getHistory = async () => {
      const logs = await fetchUserIpHistory(user.id);
      if (logs.length > 0) {
        setLastLogin(new Date(logs[0].created_at).toLocaleString());
      } else {
        setLastLogin('NEVER');
      }
    };
    getHistory();
    setNotes(user.notes || '');
  }, [user.id, fetchUserIpHistory, user.notes]);

  const handleNotesSave = async () => {
    setIsSavingNotes(true);
    await updateUserNotes(user.id, notes);
    setIsSavingNotes(false);
  };

  const handleImpersonate = () => {
    loginAs(user.id);
    navigate('/');
  };

  const userThreadsCreated = threads.filter(t => t.authorId === user.id);
  const userPostsCreated = posts.filter(p => p.authorId === user.id);
  const threadsLiked = threads.filter(t => t.likedBy?.includes(user.id));
  const postsLiked = posts.filter(p => p.likedBy?.includes(user.id));

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 pb-12">
      {/* Sidebar: Profile & Actions */}
      <div className="xl:col-span-4 space-y-6">
        <AdminPanelBox title="Account Profile">
          <div className="flex flex-col items-center py-6 px-4 text-center">
            <img src={user.avatarUrl} className="w-24 h-24 rounded-2xl border-4 border-zinc-900 shadow-2xl mb-4 object-cover" alt="" />
            <h2 className="text-lg font-black tracking-tight truncate w-full">{user.displayName}</h2>
            <p className="text-rojo-600 font-bold text-[9px] uppercase tracking-widest mt-1 truncate w-full">@{user.username}</p>
            
            <div className="grid grid-cols-2 gap-3 w-full mt-6">
              <div className="p-3 rounded-xl bg-zinc-900/50">
                <p className="text-xs font-black">{user.postCount}</p>
                <p className="text-[7px] uppercase font-bold text-zinc-500">Total Posts</p>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900/50">
                <p className="text-xs font-black">{new Date(user.joinDate).getFullYear()}</p>
                <p className="text-[7px] uppercase font-bold text-zinc-500">Member Since</p>
              </div>
            </div>
          </div>
        </AdminPanelBox>

        <AdminPanelBox title="Identity Actions">
          <div className="grid grid-cols-1 gap-2 p-4">
            <ActionBtn onClick={() => navigate(`/profile/${user.id}`)}>View Profile</ActionBtn>
            <ActionBtn onClick={handleImpersonate}>Log In As User</ActionBtn>
            <ActionBtn onClick={() => toggleProtectedStatus(user.id)} active={user.isProtected} color="amber">
              {user.isProtected ? 'Account Protected' : 'Grant Protection'}
            </ActionBtn>
          </div>
        </AdminPanelBox>

        <AdminPanelBox title="Security Access">
           <div className="p-5 space-y-4">
              <DetailRow label="Last Seen" val={lastLogin} />
              <DetailRow label="Known IP" val={user.lastIp || 'UNKNOWN'} />
              <DetailRow label="Verified" val={user.email ? 'YES' : 'NO'} />
              <DetailRow label="Permissions" val={user.role} />
           </div>
        </AdminPanelBox>
      </div>

      {/* Main Column: Activity & Moderation */}
      <div className="xl:col-span-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AdminPanelBox title="Account Settings">
            <div className="p-5 space-y-3">
              <div>
                <label className="text-[8px] font-black uppercase text-zinc-600 tracking-widest block mb-1">Display Name</label>
                <input 
                  type="text" 
                  defaultValue={user.displayName}
                  onBlur={e => updateTargetUser(user.id, { displayName: e.target.value })}
                  className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-[11px] outline-none"
                />
              </div>
              <div>
                <label className="text-[8px] font-black uppercase text-zinc-600 tracking-widest block mb-1">Database Role</label>
                <select 
                  defaultValue={user.role}
                  onChange={e => updateTargetUser(user.id, { role: e.target.value as any })}
                  className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-[11px] outline-none font-bold"
                >
                  <option value="User">Standard Member</option>
                  <option value="Moderator">Community Moderator</option>
                  <option value="Admin">Head Administrator</option>
                </select>
              </div>
            </div>
          </AdminPanelBox>

          <AdminPanelBox title="Community Stats">
            <div className="p-5 space-y-3">
              <DetailRow label="Threads Created" val={userThreadsCreated.length.toString()} />
              <DetailRow label="Posts Created" val={userPostsCreated.length.toString()} />
              <DetailRow label="Threads Liked" val={threadsLiked.length.toString()} />
              <DetailRow label="Posts Liked" val={postsLiked.length.toString()} />
            </div>
          </AdminPanelBox>
        </div>

        <AdminPanelBox title="Punishment Center">
          <div className="p-6">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <label className="text-[8px] font-black uppercase text-zinc-600 tracking-widest block mb-1">Action Reason</label>
                <input 
                  value={banReason}
                  onChange={e => setBanReason(e.target.value)}
                  placeholder="Policy Violation..."
                  className="w-full bg-black border border-zinc-800 rounded-lg px-4 py-3 text-xs outline-none focus:ring-1 ring-rojo-600"
                />
              </div>
              <div className="md:w-32">
                <label className="text-[8px] font-black uppercase text-zinc-600 tracking-widest block mb-1">Duration</label>
                <select 
                  value={banDuration}
                  onChange={e => setBanDuration(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-3 text-xs outline-none"
                >
                  <option value="1">1 Day</option>
                  <option value="3">3 Days</option>
                  <option value="7">7 Days</option>
                  <option value="Permanent">Permanent</option>
                </select>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-zinc-800/30">
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" checked={doIpBan} onChange={e => setDoIpBan(e.target.checked)} className="w-3.5 h-3.5 rounded bg-black text-rojo-600" />
                  <span className="text-[9px] font-black uppercase text-zinc-500 group-hover:text-white">IP Ban</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" checked={resetName} onChange={e => setResetName(e.target.checked)} className="w-3.5 h-3.5 rounded bg-black text-rojo-600" />
                  <span className="text-[9px] font-black uppercase text-zinc-500 group-hover:text-white">Reset Name</span>
                </label>
              </div>
              <div className="flex gap-2">
                <button onClick={() => warnUser(user.id, banReason)} className="bg-amber-600 text-white px-5 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest">Warn</button>
                {user.status === 'Banned' ? (
                  <button onClick={() => unbanUser(user.id)} className="bg-emerald-600 text-white px-5 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest">Unban</button>
                ) : (
                  <button onClick={() => banUser(user.id, banReason, banDuration, doIpBan, resetName)} className="bg-rojo-600 text-white px-5 py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest">Ban</button>
                )}
              </div>
            </div>
          </div>
        </AdminPanelBox>

        <AdminPanelBox title="History Logs">
          <div className="overflow-x-auto min-h-[150px]">
            <table className="w-full text-left">
              <thead className="border-b border-zinc-800 bg-zinc-900/20">
                <tr className="text-[8px] uppercase font-black tracking-widest text-zinc-600">
                  <th className="px-5 py-3">ID</th>
                  <th className="px-5 py-3">Action</th>
                  <th className="px-5 py-3">Staff</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3 text-right">Expiration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900/40 text-[9px] font-bold">
                {(user.punishments || []).map(p => (
                  <tr key={p.id} className="hover:bg-zinc-900/40 transition-colors">
                    <td className="px-5 py-3 text-zinc-600">{p.id}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded ${
                        p.action === 'Ban' ? 'bg-rojo-600/10 text-rojo-600' :
                        p.action === 'Warn' ? 'bg-amber-600/10 text-amber-500' :
                        'bg-zinc-800 text-zinc-400'
                      }`}>{p.action}</span>
                    </td>
                    <td className="px-5 py-3 text-zinc-400">@{p.moderator}</td>
                    <td className="px-5 py-3 text-zinc-500">{new Date(p.created_at).toLocaleDateString()}</td>
                    <td className="px-5 py-3 text-right text-zinc-600">{p.expiration}</td>
                  </tr>
                ))}
                {(user.punishments || []).length === 0 && (
                  <tr><td colSpan={5} className="px-5 py-12 text-center opacity-20 uppercase tracking-widest">No Log Data</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </AdminPanelBox>

        <AdminPanelBox title="Staff Internal Notes">
          <div className="p-5">
            <textarea 
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full h-24 bg-black border border-zinc-800 rounded-xl p-4 text-[11px] text-white outline-none focus:ring-1 ring-rojo-600 transition-all mb-3"
              placeholder="Confidential staff comments..."
            />
            <div className="flex justify-end">
              <button 
                onClick={handleNotesSave} 
                disabled={isSavingNotes}
                className="bg-zinc-800 text-zinc-100 px-5 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-zinc-700 disabled:opacity-50"
              >
                {isSavingNotes ? 'Updating...' : 'Commit Notes'}
              </button>
            </div>
          </div>
        </AdminPanelBox>
      </div>
    </div>
  );
};

const IpBanList: React.FC = () => {
  const { ipBans, unbanIp, addManualIpBan, clientIp, theme } = useAppState();
  const [newIp, setNewIp] = useState('');
  const [reason, setReason] = useState('Network Violation');

  const handleAdd = async () => {
    if(!newIp) return;
    await addManualIpBan(newIp, reason);
    setNewIp('');
  };

  const isDark = theme === 'dark';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <AdminPanelBox title="Network Shield Control">
         <div className="p-6 flex flex-col md:flex-row gap-4">
            <input 
              value={newIp}
              onChange={e => setNewIp(e.target.value)}
              placeholder="IP Address..."
              className="flex-1 bg-black border border-zinc-800 rounded-lg px-4 py-2.5 text-xs outline-none"
            />
            <input 
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="flex-1 bg-black border border-zinc-800 rounded-lg px-4 py-2.5 text-xs outline-none"
            />
            <button onClick={handleAdd} className="bg-rojo-600 text-white px-8 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest shrink-0">Blacklist</button>
         </div>
      </AdminPanelBox>

      <AdminPanelBox title="Restricted Network Objects">
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead className="border-b border-zinc-800 bg-zinc-900/20">
                  <tr className="text-[9px] uppercase font-black tracking-widest text-zinc-600">
                     <th className="px-8 py-5">Address</th>
                     <th className="px-8 py-5">Context</th>
                     <th className="px-8 py-5 text-right">Action</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-zinc-900/40 text-xs font-bold">
                  {ipBans.map(ban => (
                    <tr key={ban.id}>
                       <td className="px-8 py-5">
                          <p className="text-rojo-500 font-black">{ban.ip_address}</p>
                          {ban.ip_address === clientIp && <span className="text-[8px] text-emerald-500 uppercase">Self</span>}
                       </td>
                       <td className="px-8 py-5 italic text-zinc-500 truncate max-w-xs">"{ban.reason}"</td>
                       <td className="px-8 py-5 text-right">
                          <button onClick={() => unbanIp(ban.ip_address)} className="text-[9px] font-black uppercase text-emerald-500 hover:underline">Revoke</button>
                       </td>
                    </tr>
                  ))}
                  {ipBans.length === 0 && (
                    <tr><td colSpan={3} className="px-8 py-16 text-center opacity-20 uppercase tracking-[0.4em]">Clear Zone</td></tr>
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
    className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${active ? 'bg-rojo-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}
  >
    {children}
  </button>
);

const AdminPanelBox: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
  const { theme } = useAppState();
  const isDark = theme === 'dark';
  return (
    <div className={`border rounded-[1.5rem] overflow-hidden shadow-xl transition-all h-full ${isDark ? 'bg-zinc-950/80 border-zinc-800' : 'bg-white border-zinc-100 shadow-sm'}`}>
      <div className="bg-rojo-600 px-5 py-2 border-b border-rojo-700 flex items-center justify-between">
        <h3 className="text-[8px] font-black uppercase tracking-[0.2em] text-white">{title}</h3>
        <div className="flex gap-1">
          <div className="w-1 h-1 rounded-full bg-white/30"></div>
          <div className="w-1 h-1 rounded-full bg-white/30"></div>
        </div>
      </div>
      <div className="min-h-0">
        {children}
      </div>
    </div>
  );
};

const ActionBtn: React.FC<{ onClick: () => void; children: React.ReactNode; color?: 'rojo' | 'amber'; active?: boolean }> = ({ onClick, children, color, active }) => (
  <button 
    onClick={onClick}
    className={`w-full py-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all text-center ${
      active 
        ? 'bg-amber-600 border-amber-500 text-white' 
        : color === 'rojo' 
          ? 'bg-rojo-900/10 border-rojo-900/40 text-rojo-500 hover:bg-rojo-600 hover:text-white' 
          : color === 'amber'
            ? 'bg-amber-900/10 border-amber-900/40 text-amber-500 hover:bg-amber-600 hover:text-white'
            : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:bg-zinc-800 hover:text-white'
    }`}
  >
    {children}
  </button>
);

const DetailRow: React.FC<{ label: string; val: string }> = ({ label, val }) => (
  <div className="flex justify-between items-center group gap-4">
    <span className="text-[8px] font-black uppercase text-zinc-600 tracking-widest group-hover:text-zinc-400 transition-colors shrink-0">{label}</span>
    <span className="text-[9px] font-bold text-zinc-300 truncate text-right">{val}</span>
  </div>
);

export default ModerationPanel;