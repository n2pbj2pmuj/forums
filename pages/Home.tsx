
import React, { useState } from 'react';
import { useAppState } from '../AppStateContext';
import Layout from '../components/Layout';
import { Link } from 'react-router-dom';

const HomePage: React.FC = () => {
  const { threads, addThread, theme } = useAppState();
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredThreads = threads.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.authorName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isDark = theme === 'dark';

  const handleCreate = () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    addThread(newTitle, newContent, 'cat2');
    setNewTitle('');
    setNewContent('');
    setShowModal(false);
  };

  return (
    <Layout>
      <div className="space-y-8 animate-in fade-in duration-700">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className={`text-5xl font-black tracking-tighter ${isDark ? 'text-white' : 'text-slate-900'}`}>THE <span className="text-rojo-500 neon-red">GRID</span></h1>
            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.4em] mt-2">Collective Intelligence Network</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative group">
              <input 
                type="text" 
                placeholder="Search frequencies..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`pl-12 pr-6 py-3 rounded-2xl text-sm w-full md:w-80 border transition-all outline-none focus:ring-2 ring-rojo-500 shadow-xl ${isDark ? 'bg-rojo-950/50 border-rojo-900/30 text-white placeholder-slate-700' : 'bg-white border-rojo-100 shadow-rojo-500/5'}`}
              />
              <svg className="w-5 h-5 absolute left-4 top-3.5 text-rojo-900 group-focus-within:text-rojo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <button 
              onClick={() => setShowModal(true)}
              className={`px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${isDark ? 'bg-rojo-600 hover:bg-rojo-500 text-white shadow-lg shadow-rojo-900/40' : 'bg-rojo-600 text-white hover:bg-rojo-700'}`}
            >
              Broadcast
            </button>
          </div>
        </div>

        <div className={`border rounded-3xl divide-y overflow-hidden shadow-2xl transition-all ${isDark ? 'bg-black/40 border-rojo-900/30 divide-rojo-900/10' : 'bg-white border-rojo-100 divide-rojo-50 shadow-rojo-500/5'}`}>
          {filteredThreads.length > 0 ? filteredThreads.map(thread => (
            <div key={thread.id} className={`p-8 transition-all group cursor-pointer ${isDark ? 'hover:bg-rojo-900/10' : 'hover:bg-rojo-50'}`}>
              <div className="flex items-start justify-between gap-6">
                <div className="flex space-x-6 min-w-0 flex-1">
                  <div className={`w-16 h-16 rounded-3xl flex items-center justify-center font-black text-2xl transition-all border shrink-0 ${isDark ? 'bg-rojo-950 border-rojo-900/30 text-rojo-500 group-hover:border-rojo-400 group-hover:shadow-[0_0_20px_rgba(255,0,0,0.2)]' : 'bg-rojo-50 border-rojo-100 text-rojo-600'}`}>
                    {thread.authorName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <Link to={`/thread/${thread.id}`} className={`text-2xl font-black tracking-tight transition-all block mb-2 truncate ${isDark ? 'text-slate-100 group-hover:text-rojo-500' : 'text-slate-900 group-hover:text-rojo-600'}`}>
                      {thread.isPinned && <span className="mr-3 text-rojo-500 drop-shadow-sm">📌</span>}
                      {thread.title}
                      {thread.isLocked && <span className="ml-3 text-slate-700">🔒</span>}
                    </Link>
                    <div className="flex items-center flex-wrap gap-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                      <span className={`text-rojo-500`}>@{thread.authorName}</span>
                      <span className="opacity-20">•</span>
                      <span>{new Date(thread.createdAt).toLocaleDateString()}</span>
                      <span className="opacity-20">•</span>
                      <span className={`px-3 py-1 rounded-full text-[9px] ${isDark ? 'bg-rojo-900/20 text-rojo-400 border border-rojo-900/30' : 'bg-rojo-50 text-rojo-600 border border-rojo-100'}`}>General_Grid</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-8 shrink-0">
                  <div className="text-center">
                    <p className={`text-2xl font-black ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{thread.replyCount}</p>
                    <p className="text-[9px] uppercase font-black text-slate-600 tracking-tighter">Replies</p>
                  </div>
                  <div className="text-center hidden sm:block">
                    <p className={`text-2xl font-black ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{thread.viewCount > 999 ? (thread.viewCount / 1000).toFixed(1) + 'k' : thread.viewCount}</p>
                    <p className="text-[9px] uppercase font-black text-slate-600 tracking-tighter">Views</p>
                  </div>
                </div>
              </div>
            </div>
          )) : (
            <div className="p-32 text-center space-y-6 opacity-40">
              <div className="w-24 h-24 bg-rojo-900/20 rounded-full mx-auto flex items-center justify-center border border-rojo-900/30">
                 <svg className="w-10 h-10 text-rojo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 9.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <p className="text-slate-500 font-black uppercase tracking-widest text-sm">No synchronized signals found.</p>
            </div>
          )}
        </div>
      </div>

      {/* New Thread Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
          <div className={`w-full max-w-3xl rounded-3xl shadow-[0_0_100px_rgba(255,0,0,0.1)] overflow-hidden animate-in zoom-in duration-300 border ${isDark ? 'bg-rojo-950 border-rojo-900/50' : 'bg-white border-rojo-100'}`}>
            <div className={`p-8 flex items-center justify-between border-b ${isDark ? 'bg-black/60 border-rojo-900/30' : 'bg-rojo-600 text-white shadow-xl'}`}>
              <h2 className="text-xl font-black uppercase tracking-tight">Initiate Transmission</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-xl">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-10 space-y-8">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-600 mb-3 tracking-widest">Signal Headline</label>
                <input 
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  type="text" 
                  placeholder="Summarize your transmission..." 
                  className={`w-full rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-2 ring-rojo-500 border transition-all ${isDark ? 'bg-black border-rojo-900/30 text-white placeholder-slate-800' : 'bg-rojo-50 border-rojo-100'}`} 
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-600 mb-3 tracking-widest">Signal Body</label>
                <textarea 
                  required
                  value={newContent}
                  onChange={e => setNewContent(e.target.value)}
                  placeholder="Detail the parameters of your transmission..." 
                  className={`w-full h-56 rounded-2xl px-6 py-4 text-sm font-medium leading-relaxed outline-none focus:ring-2 ring-rojo-500 border transition-all ${isDark ? 'bg-black border-rojo-900/30 text-white placeholder-slate-800' : 'bg-rojo-50 border-rojo-100'}`} 
                />
              </div>
              <div className="flex justify-end items-center gap-6 pt-6">
                <button onClick={() => setShowModal(false)} className="px-6 py-2 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-200 transition-colors">Cancel Sequence</button>
                <button 
                  onClick={handleCreate}
                  disabled={!newTitle.trim() || !newContent.trim()}
                  className="bg-rojo-600 text-white px-12 py-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-rojo-500 shadow-xl shadow-rojo-900/40 transition-all disabled:opacity-30 disabled:shadow-none"
                >
                  Broadcast to Grid
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default HomePage;
