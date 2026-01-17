
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../AppStateContext';
import { ModStatus, Report, ReportType, User } from '../types';
import Layout from '../components/Layout';

const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'reports' | 'users' | 'assets'>('users');
  const { reports, users, assets, updateGlobalBanner, addGlobalAsset, loginAs, resolveReport, banUser, unbanUser, theme, updateTargetUser } = useAppState();
  const navigate = useNavigate();
  
  const [showBanModal, setShowBanModal] = useState<string | null>(null);
  const [banReason, setBanReason] = useState('Violation of Community Guidelines');
  const [banDuration, setBanDuration] = useState('7');
  
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<'User' | 'Moderator' | 'Admin'>('User');
  const [editUsername, setEditUsername] = useState('');

  const [newAssetName, setNewAssetName] = useState('');
  const [newAssetUrl, setNewAssetUrl] = useState('');

  const isDark = theme === 'dark';

  const handleBan = () => {
    if (showBanModal) {
      banUser(showBanModal, banReason, banDuration);
      setShowBanModal(null);
    }
  };

  const handleImpersonate = (userId: string) => {
    if (window.confirm("PROTOCOL ALERT: You are assuming this identity. Proceed?")) {
      loginAs(userId);
      navigate('/');
    }
  };

  const startEditingUser = (user: User) => {
    setEditingUserId(user.id);
    setEditEmail(user.email);
    setEditRole(user.role);
    setEditUsername(user.username);
  };

  const saveUserEdits = () => {
    if (editingUserId) {
      updateTargetUser(editingUserId, { email: editEmail, role: editRole, username: editUsername });
      setEditingUserId(null);
    }
  };

  return (
    <Layout>
      <div className="space-y-8 animate-in fade-in duration-500">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className={`text-4xl font-black tracking-tighter ${isDark ? 'text-white neon-red' : 'text-slate-900'}`}>OVERWATCH TERMINAL</h1>
            <p className="text-rojo-500 font-bold uppercase text-[10px] tracking-[0.3em] mt-1">Advanced Identity Control & Policy Enforcement</p>
          </div>
        </header>

        <div className={`flex border-b overflow-x-auto no-scrollbar ${isDark ? 'border-rojo-900/50' : 'border-rojo-100'}`}>
          <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')}>Identity Database</TabButton>
          <TabButton active={activeTab === 'reports'} onClick={() => setActiveTab('reports')}>Conflict Queue</TabButton>
          <TabButton active={activeTab === 'assets'} onClick={() => setActiveTab('assets')}>Visual Overlays</TabButton>
        </div>

        {activeTab === 'users' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {users.map(user => (
              <div key={user.id} className={`border rounded-[2rem] p-8 relative overflow-hidden transition-all group ${isDark ? 'bg-black border-rojo-900/30 hover:border-rojo-500/50' : 'bg-white border-rojo-100 shadow-xl'}`}>
                <div className="flex items-start justify-between mb-8">
                  <div className="flex items-center gap-5">
                    <img src={user.avatarUrl} className="w-16 h-16 rounded-2xl border-2 border-rojo-900/50 object-cover" alt="" />
                    <div className="min-w-0">
                      <h3 className="font-black text-xl truncate tracking-tight">{user.displayName}</h3>
                      <p className="text-rojo-500 font-bold text-xs">@{user.username}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest ${user.status === 'Active' ? 'bg-emerald-600/10 text-emerald-500' : 'bg-rojo-600/10 text-rojo-500 animate-pulse'}`}>
                      {user.status}
                    </span>
                    <p className="text-[9px] text-slate-600 uppercase font-black mt-1">{user.role}</p>
                  </div>
                </div>

                <div className={`space-y-4 p-5 rounded-2xl mb-8 ${isDark ? 'bg-rojo-950/20' : 'bg-rojo-50'}`}>
                  <div>
                    <label className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Administrative Email</label>
                    <p className="text-sm font-bold font-mono text-slate-300 truncate">{user.email}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Join Date</label>
                      <p className="text-[10px] font-bold text-slate-400">{user.joinDate}</p>
                    </div>
                    <div>
                      <label className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Network ID</label>
                      <p className="text-[10px] font-bold text-slate-400">{user.id}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <button 
                    onClick={() => startEditingUser(user)} 
                    className={`col-span-1 py-3 rounded-xl font-black uppercase text-[9px] tracking-widest transition-all ${isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600'}`}
                  >
                    Edit Record
                  </button>
                  <button 
                    onClick={() => handleImpersonate(user.id)} 
                    className="col-span-1 bg-white text-black font-black uppercase text-[9px] tracking-widest py-3 rounded-xl hover:bg-slate-200"
                  >
                    Ghost Mode
                  </button>
                  {user.status === 'Banned' ? (
                    <button onClick={() => unbanUser(user.id)} className="col-span-1 bg-emerald-600 text-white font-black uppercase text-[9px] tracking-widest py-3 rounded-xl hover:bg-emerald-500">Unban</button>
                  ) : (
                    <button onClick={() => setShowBanModal(user.id)} className="col-span-1 bg-rojo-600 text-white font-black uppercase text-[9px] tracking-widest py-3 rounded-xl hover:bg-rojo-500">Blacklist</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'reports' && (
          <div className={`border rounded-3xl overflow-hidden shadow-2xl ${isDark ? 'bg-black border-rojo-900/30' : 'bg-white border-rojo-100'}`}>
            <table className="w-full text-left">
              <thead className={`border-b ${isDark ? 'bg-rojo-950/50 border-rojo-900/30 text-slate-500' : 'bg-rojo-50 text-slate-500'}`}>
                <tr>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Incident</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Entity</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Log</th>
                  <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-right">Action</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-rojo-900/10' : 'divide-slate-100'}`}>
                {reports.map(report => (
                  <tr key={report.id} className={`${isDark ? 'hover:bg-rojo-900/5' : 'hover:bg-rojo-50/30'} transition-colors`}>
                    <td className="px-8 py-6">
                      <span className="bg-rojo-600/10 text-rojo-500 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">{report.type}</span>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-sm font-black tracking-tight">{report.targetId}</p>
                      <p className="text-[10px] text-slate-500 font-bold">BY @{report.reportedBy}</p>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-xs text-slate-400 leading-relaxed max-w-xs">{report.reason}</p>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-3">
                        {report.status === ModStatus.PENDING ? (
                          <>
                            <button onClick={() => resolveReport(report.id, ModStatus.RESOLVED)} className="bg-emerald-600 text-white text-[9px] font-black uppercase px-4 py-2 rounded-xl">Secure</button>
                            <button onClick={() => resolveReport(report.id, ModStatus.DISMISSED)} className="bg-slate-800 text-slate-400 text-[9px] font-black uppercase px-4 py-2 rounded-xl">Ignore</button>
                          </>
                        ) : (
                          <span className="text-[9px] font-black uppercase text-slate-600 tracking-widest">Archived</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'assets' && (
          <div className="space-y-6">
            <div className={`border rounded-[2rem] p-10 ${isDark ? 'bg-black border-rojo-900/30' : 'bg-white border-rojo-100 shadow-xl'}`}>
              <h2 className="text-2xl font-black uppercase tracking-tighter mb-8">Deploy Visual Override</h2>
              <form onSubmit={(e) => { e.preventDefault(); if (newAssetName && newAssetUrl) { addGlobalAsset(newAssetName, newAssetUrl); setNewAssetName(''); setNewAssetUrl(''); } }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input required value={newAssetName} onChange={e => setNewAssetName(e.target.value)} placeholder="Display Title" className={`px-6 py-4 rounded-2xl outline-none border transition-all ${isDark ? 'bg-rojo-950 border-rojo-900/50 text-white focus:border-rojo-500' : 'bg-slate-50 border-slate-200'}`} />
                <input required value={newAssetUrl} onChange={e => setNewAssetUrl(e.target.value)} placeholder="Asset Image URL (Direct Link)" className={`px-6 py-4 rounded-2xl outline-none border transition-all ${isDark ? 'bg-rojo-950 border-rojo-900/50 text-white focus:border-rojo-500' : 'bg-slate-50 border-slate-200'}`} />
                <button type="submit" className="md:col-span-2 bg-rojo-600 text-white font-black uppercase tracking-[0.2em] py-5 rounded-2xl hover:bg-rojo-500 shadow-xl shadow-rojo-900/30">Commit Asset To Grid</button>
              </form>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assets.map(asset => (
                <div key={asset.id} className={`border rounded-3xl overflow-hidden transition-all relative group ${isDark ? 'bg-black border-rojo-900/30' : 'bg-white border-rojo-100'}`}>
                  <div className="h-40 relative">
                    <img src={asset.imageUrl} className={`w-full h-full object-cover transition-all ${!asset.isActive && 'grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-100'}`} alt="" />
                    {asset.isActive && (
                      <div className="absolute top-4 left-4 bg-emerald-500 text-black text-[9px] font-black uppercase px-2 py-1 rounded shadow-lg">Active Overlay</div>
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="font-black uppercase tracking-tight mb-4">{asset.name}</h3>
                    <button 
                      onClick={() => updateGlobalBanner(asset.id)}
                      disabled={asset.isActive}
                      className={`w-full py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${asset.isActive ? 'bg-slate-800 text-slate-500' : 'bg-rojo-600 text-white hover:bg-rojo-500'}`}
                    >
                      {asset.isActive ? 'Deployed' : 'Trigger Deployment'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Identity Edit Modal */}
      {editingUserId && (
        <div className="fixed inset-0 bg-black/98 backdrop-blur-3xl z-[300] flex items-center justify-center p-6">
          <div className="w-full max-w-xl bg-rojo-950 border border-rojo-500/50 rounded-[3rem] p-12 shadow-[0_0_150px_rgba(255,0,0,0.2)] animate-in zoom-in duration-300">
             <div className="flex items-center gap-5 mb-10">
                <div className="p-4 rounded-3xl bg-rojo-600/20 text-rojo-500 border border-rojo-500/30">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" /></svg>
                </div>
                <div>
                  <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">MODIFY RECORD</h2>
                  <p className="text-[10px] text-rojo-400 font-black uppercase tracking-widest mt-1">Identity UID: {editingUserId}</p>
                </div>
             </div>
             <div className="space-y-8">
                <div>
                   <label className="block text-[10px] font-black uppercase text-slate-500 mb-3 tracking-widest ml-1">Grid Identifier (Username)</label>
                   <input 
                     value={editUsername} 
                     onChange={e => setEditUsername(e.target.value)}
                     className="w-full bg-black border border-rojo-900/50 rounded-2xl p-5 text-white text-sm font-bold outline-none focus:ring-2 ring-rojo-500 transition-all"
                   />
                </div>
                <div>
                   <label className="block text-[10px] font-black uppercase text-slate-500 mb-3 tracking-widest ml-1">Administrative Email Address</label>
                   <input 
                     value={editEmail} 
                     onChange={e => setEditEmail(e.target.value)}
                     className="w-full bg-black border border-rojo-900/50 rounded-2xl p-5 text-white text-sm font-bold outline-none focus:ring-2 ring-rojo-500 transition-all"
                   />
                </div>
                <div>
                   <label className="block text-[10px] font-black uppercase text-slate-500 mb-3 tracking-widest ml-1">Clearance Protocol (Role)</label>
                   <select 
                     value={editRole}
                     onChange={e => setEditRole(e.target.value as any)}
                     className="w-full bg-black border border-rojo-900/50 rounded-2xl p-5 text-white text-sm font-black uppercase outline-none focus:ring-2 ring-rojo-500 transition-all"
                   >
                     <option value="User">Standard Subject</option>
                     <option value="Moderator">Grid Overseer</option>
                     <option value="Admin">Core Executive</option>
                   </select>
                </div>
             </div>
             <div className="mt-12 flex gap-4">
               <button onClick={() => setEditingUserId(null)} className="flex-1 font-black uppercase text-[10px] tracking-widest text-slate-500 hover:text-white transition-colors">Abort Access</button>
               <button onClick={saveUserEdits} className="flex-1 bg-rojo-600 text-white font-black py-5 rounded-2xl hover:bg-rojo-500 transition-all uppercase text-[10px] tracking-widest shadow-xl shadow-rojo-900/40">Synchronize Data</button>
             </div>
          </div>
        </div>
      )}

      {/* Ban Logic Modal */}
      {showBanModal && (
        <div className="fixed inset-0 bg-black/98 backdrop-blur-3xl z-[300] flex items-center justify-center p-6">
          <div className="w-full max-w-xl bg-rojo-950 border border-rojo-500/50 rounded-[3rem] p-12 shadow-[0_0_150px_rgba(255,0,0,0.4)] animate-in zoom-in duration-300">
             <h2 className="text-3xl font-black text-rojo-500 uppercase tracking-tighter mb-8 leading-none">PROTOCOL TERMINATION</h2>
             <div className="space-y-8">
                <div>
                   <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">Reason for Blacklisting</label>
                   <textarea 
                     value={banReason} 
                     onChange={e => setBanReason(e.target.value)}
                     className="w-full bg-black border border-rojo-900/50 rounded-2xl p-5 text-white text-sm outline-none focus:ring-2 ring-rojo-500 transition-all"
                     rows={4}
                   />
                </div>
                <div>
                   <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">Temporal Suspension Length</label>
                   <select 
                     value={banDuration}
                     onChange={e => setBanDuration(e.target.value)}
                     className="w-full bg-black border border-rojo-900/50 rounded-2xl p-5 text-white text-sm font-black uppercase outline-none focus:ring-2 ring-rojo-500 transition-all"
                   >
                     <option value="1">24 Hour Lock</option>
                     <option value="7">1 Week Quarantine</option>
                     <option value="30">30 Day Major Breach</option>
                     <option value="Permanent">Terminal Ban</option>
                   </select>
                </div>
             </div>
             <div className="mt-12 flex gap-4">
               <button onClick={() => setShowBanModal(null)} className="flex-1 font-black uppercase text-[10px] tracking-widest text-slate-500">Cancel</button>
               <button onClick={handleBan} className="flex-1 bg-rojo-600 text-white font-black py-5 rounded-2xl hover:bg-rojo-500 transition-all uppercase text-[10px] tracking-widest shadow-xl shadow-rojo-900/40">Confirm Ban</button>
             </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
  <button 
    onClick={onClick} 
    className={`px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] transition-all border-b-2 ${active ? 'border-rojo-500 text-rojo-500 bg-rojo-500/5' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
  >
    {children}
  </button>
);

export default AdminPanel;
