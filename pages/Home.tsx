
import React, { useState } from 'react';
import { useAppState } from '../AppStateContext';
import Layout from '../components/Layout';
import { Link } from 'react-router-dom';
import { DEFAULT_AVATAR } from '../constants';

const HomePage: React.FC = () => {
  const { threads, addThread, theme, users } = useAppState();
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
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className={`text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Forum Threads</h1>
            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mt-1">Community Topics & Discussion</p>
          </div>
          <div className="flex items-center gap-3">
            <input 
              type="text" 
              placeholder="Search forum..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`px-4 py-2 rounded-lg text-sm w-full md:w-64 border transition-all outline-none focus:ring-1 ring-rojo-500 ${isDark ? 'bg-rojo-950/50 border-rojo-900/30 text-white' : 'bg-white border-slate-200'}`}
            />
            <button 
              onClick={() => setShowModal(true)}
              className="px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest bg-rojo-600 hover:bg-rojo-500 text-white shadow-lg shadow-rojo-900/20"
            >
              Create Thread
            </button>
          </div>
        </div>

        <div className={`border rounded-2xl overflow-hidden shadow-xl ${isDark ? 'bg-black/40 border-rojo-900/30 divide-y divide-rojo-900/10' : 'bg-white border-slate-200 divide-y divide-slate-100'}`}>
          {filteredThreads.length > 0 ? filteredThreads.map(thread => {
            const author = users.find(u => u.id === thread.authorId);
            const isBanned = author?.status === 'Banned';
            return (
              <div key={thread.id} className={`p-6 transition-all group cursor-pointer ${isDark ? 'hover:bg-rojo-900/10' : 'hover:bg-rojo-50'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex space-x-4 min-w-0 flex-1">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg border shrink-0 overflow-hidden ${isDark ? 'bg-rojo-950 border-rojo-900/30 text-rojo-500' : 'bg-rojo-50 border-rojo-100 text-rojo-600'}`}>
                      {isBanned ? (
                         <img src={DEFAULT_AVATAR} className="w-full h-full object-cover" alt="" />
                      ) : (
                        thread.authorName.charAt(0)
                      )}
                    </div>
                    <div className="min-w-0">
                      <Link to={`/thread/${thread.id}`} className={`text-lg font-bold tracking-tight block mb-1 truncate ${isDark ? 'text-slate-100 hover:text-rojo-500' : 'text-slate-900 hover:text-rojo-600'}`}>
                        {thread.isPinned && <span className="mr-2 text-rojo-500">📌</span>}
                        {thread.title}
                        {thread.isLocked && <span className="ml-2 text-slate-500 text-xs">🔒</span>}
                      </Link>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase">
                        <span className={`text-rojo-500 ${isBanned ? 'line-through decoration-slate-400' : ''}`}>@{thread.authorName}</span>
                        <span>•</span>
                        <span>{new Date(thread.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6 shrink-0">
                    <div className="text-center">
                      <p className="text-lg font-bold">{thread.replyCount}</p>
                      <p className="text-[9px] uppercase font-bold text-slate-500">Replies</p>
                    </div>
                    <div className="text-center hidden sm:block">
                      <p className="text-lg font-bold">{thread.viewCount}</p>
                      <p className="text-[9px] uppercase font-bold text-slate-500">Views</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          }) : (
            <div className="p-20 text-center opacity-40">
              <p className="text-slate-500 font-bold uppercase text-sm">No topics found.</p>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className={`w-full max-w-2xl rounded-2xl overflow-hidden border shadow-2xl animate-in zoom-in duration-200 ${isDark ? 'bg-black border-rojo-900/50' : 'bg-white border-slate-200'}`}>
            <div className={`p-6 flex items-center justify-between border-b ${isDark ? 'border-rojo-900/30' : 'border-slate-100'}`}>
              <h2 className="text-lg font-bold uppercase">New Thread</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-rojo-500 p-1">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-8 space-y-6">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-2">Thread Title</label>
                <input 
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className={`w-full rounded-lg px-4 py-2 text-sm border outline-none focus:ring-1 ring-rojo-500 ${isDark ? 'bg-rojo-950 border-rojo-900/30 text-white' : 'bg-slate-50 border-slate-200'}`} 
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-2">Message Body</label>
                <textarea 
                  required
                  value={newContent}
                  onChange={e => setNewContent(e.target.value)}
                  className={`w-full h-48 rounded-lg px-4 py-2 text-sm border outline-none focus:ring-1 ring-rojo-500 ${isDark ? 'bg-rojo-950 border-rojo-900/30 text-white' : 'bg-slate-50 border-slate-200'}`} 
                />
              </div>
              <div className="flex justify-end gap-4 pt-4">
                <button onClick={() => setShowModal(false)} className="px-6 py-2 text-xs font-bold uppercase text-slate-500 hover:text-slate-300">Cancel</button>
                <button 
                  onClick={handleCreate}
                  disabled={!newTitle.trim() || !newContent.trim()}
                  className="bg-rojo-600 text-white px-8 py-3 rounded-lg font-bold uppercase text-xs hover:bg-rojo-500 shadow-xl shadow-rojo-900/20 disabled:opacity-30"
                >
                  Post Topic
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
