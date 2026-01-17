
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../AppStateContext';
import { ModStatus, Report, ReportType } from '../types';
import Layout from '../components/Layout';
import { analyzeForumContent } from '../services/geminiService';

const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'reports' | 'users' | 'assets'>('dashboard');
  const { reports, users, assets, updateGlobalBanner, addGlobalAsset, loginAs, resolveReport, banUser, unbanUser, theme, threads, posts } = useAppState();
  const navigate = useNavigate();
  
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [showBanModal, setShowBanModal] = useState<string | null>(null);
  const [banReason, setBanReason] = useState('Violation of Community Guidelines');
  const [banDuration, setBanDuration] = useState('7');
  
  const [newAssetName, setNewAssetName] = useState('');
  const [newAssetUrl, setNewAssetUrl] = useState('');

  const isDark = theme === 'dark';

  const handleAIAnalysis = async (report: Report) => {
    setAnalyzingId(report.id);
    await analyzeForumContent(report.contentSnippet, report.type);
    resolveReport(report.id, ModStatus.RESOLVED);
    setAnalyzingId(null);
  };

  const handleBan = () => {
    if (showBanModal) {
      banUser(showBanModal, banReason, banDuration);
      setShowBanModal(null);
    }
  };

  const handleImpersonate = (userId: string) => {
    if (window.confirm("CRITICAL ACTION: You are assuming another identity. All actions performed in this session will be logged as this user. Proceed?")) {
      loginAs(userId);
      navigate('/');
    }
  };

  const handleAddAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (newAssetName && newAssetUrl) {
      addGlobalAsset(newAssetName, newAssetUrl);
      setNewAssetName('');
      setNewAssetUrl('');
    }
  };

  return (
    <Layout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className={`text-4xl font-black tracking-tighter ${isDark ? 'text-white neon-red' : 'text-slate-900'}`}>COMMAND CENTER</h1>
            <p className="text-rojo-500 font-bold uppercase text-[10px] tracking-[0.3em] mt-1">Platform Integrity & Governance</p>
          </div>
          <div className="flex gap-2">
            <StatSmall label="Active Users" value={users.filter(u => u.status === 'Active').length} />
            <StatSmall label="Pending Reports" value={reports.filter(r => r.status === ModStatus.PENDING).length} />
          </div>
        </header>

        <div className={`flex border-b overflow-x-auto no-scrollbar ${isDark ? 'border-rojo-900/50' : 'border-rojo-100'}`}>
          <TabButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')}>Metrics</TabButton>
          <TabButton active={activeTab === 'reports'} onClick={() => setActiveTab('reports')}>Queue</TabButton>
          <TabButton active={activeTab === 'users'} onClick={() => setActiveTab('users')}>Identity Registry</TabButton>
          <TabButton active={activeTab === 'assets'} onClick={() => setActiveTab('assets')}>Visual Grid</TabButton>
        </div>

        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard title="Global Feed Activity" value={threads.length + posts.length} change="+12%" color="indigo" />
            <MetricCard title="Safety Incidents" value={reports.length} change="-5%" color="rojo" />
            <MetricCard title="New Registrations" value={users.length} change="+24" color="emerald" />
            <MetricCard title="Grid Uptime" value="99.9%" change="Stable" color="blue" />
            
            <div className={`md:col-span-2 lg:col-span-4 border rounded-3xl p-8 ${isDark ? 'bg-black/40 border-rojo-900/30' : 'bg-white border-rojo-100'}`}>
               <h3 className="text-sm font-black uppercase text-slate-500 mb-6">Recent Security Logs</h3>
               <div className="space-y-4">
                  {reports.slice(0, 5).map(r => (
                    <div key={r.id} className="flex items-center justify-between text-xs py-2 border-b border-rojo-900/10">
                       <span className="font-bold text-slate-400">[{new Date(r.createdAt).toLocaleTimeString()}]</span>
                       <span className="flex-1 px-4 truncate">{r.reason} reported for {r.type} <span className="text-rojo-500 font-black">ID:{r.targetId}</span></span>
                       <span className={`px-2 py-0.5 rounded font-black ${r.status === ModStatus.PENDING ? 'bg-rojo-600/20 text-rojo-400' : 'bg-emerald-600/20 text-emerald-400'}`}>
                         {r.status}
                       </span>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className={`border rounded-xl overflow-hidden shadow-2xl ${isDark ? 'bg-black border-rojo-900/30' : 'bg-white border-rojo-100'}`}>
            <table className="w-full text-left">
              <thead className={`border-b ${isDark ? 'bg-rojo-950/50 border-rojo-900/30 text-slate-500' : 'bg-rojo-50 text-slate-500'}`}>
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">Type</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">Target</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">Reporter</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-right">Action</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-rojo-900/10' : 'divide-slate-100'}`}>
                {reports.map(report => (
                  <tr key={report.id} className={`${isDark ? 'hover:bg-rojo-900/5' : 'hover:bg-rojo-50/30'} transition-colors`}>
                    <td className="px-6 py-5">
                      <span className={`px-2 py-1 rounded text-[9px] font-black uppercase ${
                        report.type === ReportType.USER ? 'bg-amber-600/10 text-amber-500' : 'bg-indigo-600/10 text-indigo-500'
                      }`}>
                        {report.type}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <p className={`text-sm font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>{report.targetId}</p>
                      <p className="text-[10px] text-slate-500 italic truncate w-48">"{report.contentSnippet}"</p>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-xs font-bold">@{report.reportedBy}</p>
                      <p className="text-[9px] text-slate-500 uppercase font-black">{new Date(report.createdAt).toLocaleDateString()}</p>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleAIAnalysis(report)}
                          disabled={analyzingId === report.id || report.status !== ModStatus.PENDING}
                          className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded transition-all border ${
                            report.status === ModStatus.PENDING 
                            ? 'bg-rojo-600 border-rojo-500 text-white hover:bg-rojo-500 hover:shadow-[0_0_10px_rgba(255,0,0,0.3)]' 
                            : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                          }`}
                        >
                          {report.status === ModStatus.PENDING ? (analyzingId === report.id ? 'Analyzing...' : 'AI Scan') : 'Secured'}
                        </button>
                        {report.status === ModStatus.PENDING && (
                           <button onClick={() => resolveReport(report.id, ModStatus.DISMISSED)} className="text-[9px] font-black uppercase px-3 py-1.5 rounded bg-slate-800 text-slate-400 hover:text-white transition-all">Dismiss</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.map(user => (
              <div key={user.id} className={`group border rounded-3xl p-6 transition-all relative overflow-hidden ${isDark ? 'bg-black border-rojo-900/30 hover:border-rojo-500/50' : 'bg-white border-rojo-100 hover:border-rojo-600 shadow-lg'}`}>
                <div className="flex items-center space-x-4 mb-6">
                  <div className="relative">
                    <img src={user.avatarUrl} className="w-16 h-16 rounded-2xl border-2 border-rojo-900/50 object-cover" alt="" />
                    <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 ${isDark ? 'border-black' : 'border-white'} ${user.status === 'Active' ? 'bg-emerald-500' : 'bg-rojo-500 animate-pulse'}`}></span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black truncate group-hover:text-rojo-500 transition-colors">{user.displayName}</h3>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-tighter">@{user.username}</p>
                    <p className="text-[10px] text-rojo-400 font-black mt-1 uppercase tracking-widest">{user.role}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  <button 
                    onClick={() => handleImpersonate(user.id)}
                    className="flex items-center justify-center gap-2 bg-white text-black font-black uppercase text-[10px] py-2.5 rounded-xl hover:bg-slate-200 transition-all"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    Impersonate
                  </button>
                  {user.status === 'Banned' ? (
                    <button onClick={() => unbanUser(user.id)} className="bg-emerald-600/20 text-emerald-500 border border-emerald-500/20 font-black uppercase text-[10px] py-2.5 rounded-xl hover:bg-emerald-600 hover:text-white transition-all">Pardon</button>
                  ) : (
                    <button onClick={() => setShowBanModal(user.id)} className="bg-rojo-600/10 text-rojo-400 border border-rojo-600/20 font-black uppercase text-[10px] py-2.5 rounded-xl hover:bg-rojo-600 hover:text-white transition-all">Restrict</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'assets' && (
          <div className="space-y-10">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {assets.map(asset => (
                  <div key={asset.id} className={`border rounded-3xl overflow-hidden transition-all ${isDark ? 'bg-black border-rojo-900/30' : 'bg-white border-rojo-100 shadow-xl'}`}>
                     <div className="h-32 relative">
                        <img src={asset.imageUrl} className={`w-full h-full object-cover ${!asset.isActive && 'grayscale opacity-50'}`} alt="" />
                        {asset.isActive && (
                          <div className="absolute top-3 left-3 bg-emerald-500 text-black text-[10px] font-black uppercase px-2 py-0.5 rounded shadow-lg shadow-emerald-500/20">LIVE</div>
                        )}
                     </div>
                     <div className="p-6 flex items-center justify-between">
                        <div>
                           <h3 className="font-black uppercase tracking-tighter text-lg">{asset.name}</h3>
                           <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{asset.type}</p>
                        </div>
                        <button 
                          onClick={() => updateGlobalBanner(asset.id)}
                          disabled={asset.isActive}
                          className={`px-6 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${
                            asset.isActive 
                            ? 'bg-slate-800 text-slate-600' 
                            : 'bg-rojo-600 text-white hover:bg-rojo-500 shadow-lg shadow-rojo-900/20'
                          }`}
                        >
                          {asset.isActive ? 'Deployed' : 'Deploy Grid'}
                        </button>
                     </div>
                  </div>
                ))}
             </div>

             <div className={`border-2 border-dashed rounded-3xl p-10 flex flex-col items-center ${isDark ? 'border-rojo-900/30 bg-rojo-950/5' : 'border-rojo-100 bg-rojo-50/20'}`}>
                <h3 className="text-xl font-black text-rojo-500 uppercase tracking-tighter mb-8">Asset Injection Port</h3>
                <form onSubmit={handleAddAsset} className="w-full max-w-xl space-y-4">
                   <div className="flex gap-4">
                      <input 
                        required
                        value={newAssetName}
                        onChange={e => setNewAssetName(e.target.value)}
                        placeholder="Banner Descriptor (e.g. Winter Sale 2024)" 
                        className="flex-1 bg-black/40 border border-rojo-900/30 rounded-2xl px-5 py-3 text-sm outline-none focus:ring-1 ring-rojo-500"
                      />
                      <input 
                        required
                        value={newAssetUrl}
                        onChange={e => setNewAssetUrl(e.target.value)}
                        placeholder="Source URL (HTTPS)" 
                        className="flex-1 bg-black/40 border border-rojo-900/30 rounded-2xl px-5 py-3 text-sm outline-none focus:ring-1 ring-rojo-500"
                      />
                   </div>
                   <button type="submit" className="w-full bg-rojo-600 hover:bg-rojo-500 text-white font-black py-4 rounded-2xl transition-all uppercase text-xs tracking-[0.2em] shadow-lg shadow-rojo-900/20">
                     Upload & Register Asset
                   </button>
                </form>
             </div>
          </div>
        )}
      </div>

      {showBanModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-3xl z-[200] flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-rojo-950 border border-rojo-500/50 rounded-3xl p-10 shadow-[0_0_100px_rgba(255,0,0,0.4)] animate-in zoom-in duration-300">
             <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 rounded-full bg-rojo-600/20 flex items-center justify-center text-rojo-500 border border-rojo-500/30">
                   <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <div>
                   <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Restriction Order</h2>
                   <p className="text-rojo-400 text-[10px] font-black uppercase tracking-widest">Protocol ID: SECURITY-992</p>
                </div>
             </div>
             <div className="space-y-6">
                <div>
                   <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">Violation Log</label>
                   <textarea 
                     value={banReason} 
                     onChange={e => setBanReason(e.target.value)}
                     className="w-full bg-black border border-rojo-900/50 rounded-2xl p-5 text-white text-sm outline-none focus:ring-2 ring-rojo-500 transition-all"
                     rows={4}
                     placeholder="State the reason for access termination..."
                   />
                </div>
                <div>
                   <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">Temporal Duration</label>
                   <select 
                     value={banDuration}
                     onChange={e => setBanDuration(e.target.value)}
                     className="w-full bg-black border border-rojo-900/50 rounded-2xl p-5 text-white text-sm outline-none focus:ring-2 ring-rojo-500 transition-all"
                   >
                     <option value="1">24 Hour Calibration</option>
                     <option value="3">72 Hour Suspension</option>
                     <option value="7">1 Week Blacklist</option>
                     <option value="30">30 Day Major Breach</option>
                     <option value="Permanent">Terminal Termination</option>
                   </select>
                </div>
             </div>
             <div className="mt-10 flex gap-4">
               <button onClick={() => setShowBanModal(null)} className="flex-1 font-black uppercase text-xs tracking-widest text-slate-500 hover:text-white transition-colors">Abort Order</button>
               <button onClick={handleBan} className="flex-1 bg-rojo-600 text-white font-black py-4 rounded-2xl hover:bg-rojo-500 transition-all shadow-xl shadow-rojo-900/40 uppercase text-xs tracking-widest">Execute Directive</button>
             </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

const MetricCard = ({ title, value, change, color }: { title: string; value: string | number; change: string; color: string }) => {
  const colorMap: any = {
    rojo: 'text-rojo-500 bg-rojo-500/10 border-rojo-500/20',
    emerald: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    indigo: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
    blue: 'text-blue-500 bg-blue-500/10 border-blue-500/20'
  };
  return (
    <div className={`border rounded-3xl p-6 transition-all border shadow-lg ${colorMap[color]}`}>
       <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">{title}</p>
       <div className="flex items-end justify-between">
          <p className="text-4xl font-black tracking-tighter">{value}</p>
          <p className="text-xs font-bold">{change}</p>
       </div>
    </div>
  );
};

const StatSmall = ({ label, value }: { label: string; value: number }) => (
  <div className="bg-rojo-950/30 border border-rojo-900/30 rounded-xl px-4 py-1.5 text-center">
    <p className="text-lg font-black leading-none">{value}</p>
    <p className="text-[8px] font-black uppercase text-slate-500 leading-none mt-1">{label}</p>
  </div>
);

const TabButton: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
  <button 
    onClick={onClick}
    className={`px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] transition-all border-b-2 shrink-0 ${
      active ? 'border-rojo-500 text-rojo-500 bg-rojo-500/5' : 'border-transparent text-slate-500 hover:text-slate-300'
    }`}
  >
    {children}
  </button>
);

export default AdminPanel;
