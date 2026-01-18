
import React, { useState } from 'react';
import { useAppState, censorText } from '../AppStateContext';
import Layout from '../components/Layout';
import { Link } from 'react-router-dom';
import { DEFAULT_AVATAR } from '../constants';

const HomePage: React.FC = () => {
  const { threads, addThread, theme, users, currentUser } = useAppState();
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
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-zinc-900'}`}>Discussions</h1>
            <p className="text-zinc-500 text-xs mt-1">Join the conversation with other members.</p>
          </div>
          <div className="flex items-center gap-3">
            <input 
              type="text" 
              placeholder="Search forum..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`px-4 py-2 rounded-xl text-sm w-full md:w-64 border transition-all outline-none focus:ring-1 ring-rojo-600 ${isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-zinc-200'}`}
            />
            <button 
              onClick={() => setShowModal(true)}
              className="px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-rojo-600 hover:bg-rojo-500 text-white shadow-md shadow-rojo-900/10 transition"
            >
              New Thread
            </button>
          </div>
        </div>

        <div className={`border rounded-2xl overflow-hidden shadow-sm ${isDark ? 'bg-zinc-900 border-zinc-800 divide-y divide-zinc-800' : 'bg-white border-zinc-200 divide-y divide-zinc-100'}`}>
          {filteredThreads.length > 0 ? filteredThreads.map(thread => {
            const author = users.find(u => u.id === thread.authorId);
            const isBanned = author?.status === 'Banned';
            return (
              <div key={thread.id} className={`p-5 transition-all group ${isDark ? 'hover:bg-zinc-800/50' : 'hover:bg-zinc-50'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex space-x-4 min-w-0 flex-1">
                    <div className="shrink-0 pt-1">
                       <Link to={`/profile/${thread.authorId}`}>
                         <img 
                           src={isBanned ? DEFAULT_AVATAR : (author?.avatarUrl || DEFAULT_AVATAR)} 
                           className={`w-10 h-10 rounded-lg border object-cover ${isDark ? 'border-zinc-700' : 'border-zinc-200'}`} 
                           alt="" 
                         />
                       </Link>
                    </div>
                    <div className="min-w-0">
                      <Link to={`/thread/${thread.id}`} className={`text-base font-bold tracking-tight block mb-1 truncate ${isDark ? 'text-zinc-100 group-hover:text-rojo-500' : 'text-zinc-900 group-hover:text-rojo-600'}`}>
                        {thread.isPinned && <span className="mr-2">📌</span>}
                        {isBanned ? censorText(thread.title) : thread.title}
                        {thread.isLocked && <span className="ml-2 opacity-50 text-xs">🔒</span>}
                      </Link>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-tight">
                        <Link to={`/profile/${thread.authorId}`} className={`hover:text-rojo-600 transition-colors ${isBanned ? 'line-through opacity-50' : ''}`}>@{thread.authorName}</Link>
                        <span>•</span>
                        <span>{new Date(thread.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6 shrink-0 pt-1">
                    <div className="text-center w-12">
                      <p className="text-sm font-bold">{thread.replyCount}</p>
                      <p className="text-[9px] uppercase font-bold text-zinc-500">Replies</p>
                    </div>
                    <div className="text-center w-12 hidden sm:block">
                      <p className="text-sm font-bold">{thread.viewCount}</p>
                      <p className="text-[9px] uppercase font-bold text-zinc-500">Views</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          }) : (
            <div className="p-20 text-center opacity-30">
              <p className="font-bold uppercase text-xs">No threads found.</p>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className={`w-full max-w-xl rounded-2xl overflow-hidden border shadow-2xl ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'}`}>
            <div className={`p-5 flex items-center justify-between border-b ${isDark ? 'border-zinc-800' : 'border-zinc-100'}`}>
              <h2 className="text-sm font-bold uppercase tracking-wider">Create a Thread</h2>
              <button onClick={() => setShowModal(false)} className="text-zinc-500 hover:text-rojo-600 p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-2">Subject</label>
                <input 
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="What's on your mind?"
                  className={`w-full rounded-xl px-4 py-3 text-sm border outline-none focus:ring-1 ring-rojo-600 ${isDark ? 'bg-black border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-200'}`} 
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-2">Content</label>
                <textarea 
                  required
                  value={newContent}
                  onChange={e => setNewContent(e.target.value)}
                  placeholder="Type your message here..."
                  className={`w-full h-40 rounded-xl px-4 py-3 text-sm border outline-none focus:ring-1 ring-rojo-600 ${isDark ? 'bg-black border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-200'}`} 
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 text-xs font-bold uppercase text-zinc-500 hover:text-rojo-600">Cancel</button>
                <button 
                  onClick={handleCreate}
                  disabled={!newTitle.trim() || !newContent.trim()}
                  className="bg-rojo-600 text-white px-6 py-2.5 rounded-xl font-bold uppercase text-xs hover:bg-rojo-500 transition disabled:opacity-30"
                >
                  Post Thread
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