
import React, { useState } from 'react';
import { MOCK_USERS } from '../constants';
import { useAppState } from '../AppStateContext';
import Layout from '../components/Layout';

const ChatPage: React.FC = () => {
  const { theme } = useAppState();
  const [selectedUser, setSelectedUser] = useState(MOCK_USERS[0]);
  const [msg, setMsg] = useState('');
  const [messages, setMessages] = useState([
    { id: '1', sender: 'u1', text: 'Hey, did you check the new forum thread about community updates?', timestamp: '10:00 AM' },
    { id: '2', sender: 'me', text: 'Yeah, looks like the transition to traditional forums is going well.', timestamp: '10:05 AM' }
  ]);

  const isDark = theme === 'dark';

  const send = () => {
    if (!msg.trim()) return;
    setMessages([...messages, { id: Date.now().toString(), sender: 'me', text: msg, timestamp: 'Now' }]);
    setMsg('');
  };

  return (
    <Layout>
      <div className={`border rounded-[2.5rem] overflow-hidden shadow-[0_0_50px_rgba(255,0,0,0.05)] h-[700px] flex transition-all ${isDark ? 'bg-black border-rojo-900/30' : 'bg-white border-rojo-100'}`}>
        {/* Contacts Sidebar */}
        <aside className={`w-80 flex flex-col border-r transition-all ${isDark ? 'border-rojo-900/20 bg-rojo-950/20' : 'border-slate-100 bg-slate-50/50'}`}>
          <div className="p-6 border-b border-rojo-900/10">
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-rojo-500 mb-4">Direct Messages</h2>
            <div className="relative group">
              <input 
                type="text" 
                placeholder="Search users..." 
                className={`w-full rounded-xl px-10 py-2.5 text-xs outline-none focus:ring-1 ring-rojo-500 border transition-all ${isDark ? 'bg-black border-rojo-900/30 text-white placeholder-slate-800' : 'bg-white border-slate-200'}`} 
              />
              <svg className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar">
            {MOCK_USERS.map(user => (
              <div 
                key={user.id} 
                onClick={() => setSelectedUser(user)}
                className={`flex items-center space-x-4 p-5 cursor-pointer transition-all ${selectedUser.id === user.id ? (isDark ? 'bg-rojo-500/10 border-r-4 border-rojo-500 shadow-inner' : 'bg-rojo-50 border-r-4 border-rojo-600') : 'hover:bg-rojo-900/5'}`}
              >
                <div className="relative shrink-0">
                  <img src={user.avatarUrl} className={`w-12 h-12 rounded-2xl border-2 transition-all ${selectedUser.id === user.id ? 'border-rojo-500' : 'border-rojo-900/20'}`} alt="" />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-black rounded-full"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-black truncate transition-colors ${selectedUser.id === user.id ? 'text-rojo-500' : 'text-slate-400'}`}>{user.displayName}</p>
                  <p className="text-[10px] text-slate-600 font-bold uppercase tracking-tighter">Online</p>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Chat Window */}
        <main className="flex-1 flex flex-col relative">
          {/* Header */}
          <div className={`p-6 border-b flex items-center justify-between z-10 ${isDark ? 'border-rojo-900/20 bg-black/40 backdrop-blur-md' : 'border-slate-100 bg-white/40 backdrop-blur-md'}`}>
            <div className="flex items-center space-x-4">
              <img src={selectedUser.avatarUrl} className="w-10 h-10 rounded-2xl border border-rojo-900/30" alt="" />
              <div>
                <p className="text-lg font-black tracking-tighter">{selectedUser.displayName}</p>
                <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest">Chat Active</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className={`p-2.5 rounded-xl transition-all ${isDark ? 'text-slate-500 hover:text-rojo-500 hover:bg-rojo-500/10' : 'text-slate-400 hover:text-rojo-600 hover:bg-rojo-50'}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className={`flex-1 overflow-y-auto p-10 space-y-8 no-scrollbar ${isDark ? 'bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-rojo-950/20 via-black to-black' : 'bg-slate-50/30'}`}>
            {messages.map(m => (
              <div key={m.id} className={`flex ${m.sender === 'me' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-300`}>
                <div className={`max-w-[75%] rounded-[1.5rem] px-6 py-4 text-sm shadow-xl transition-all ${
                  m.sender === 'me' 
                  ? 'bg-rojo-600 text-white rounded-br-none shadow-rojo-900/20 border border-rojo-500' 
                  : `rounded-bl-none border ${isDark ? 'bg-rojo-950/40 border-rojo-900/30 text-slate-200' : 'bg-white border-slate-200 text-slate-700'}`
                }`}>
                  <p className="leading-relaxed">{m.text}</p>
                  <div className="flex items-center justify-between mt-3 opacity-40">
                    <span className="text-[9px] font-black uppercase tracking-widest">{m.timestamp}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className={`p-8 border-t z-10 ${isDark ? 'border-rojo-900/20 bg-black/60' : 'border-slate-100 bg-white'}`}>
            <div className="flex items-center space-x-4 bg-rojo-950/30 border border-rojo-900/20 rounded-[1.5rem] p-2 pr-4 shadow-inner focus-within:border-rojo-500 transition-all">
              <input 
                value={msg}
                onChange={e => setMsg(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && send()}
                type="text" 
                placeholder="Type a message..." 
                className="flex-1 bg-transparent border-none text-sm font-medium focus:ring-0 outline-none placeholder-slate-800" 
              />
              <button onClick={send} className="bg-rojo-600 text-white p-3.5 rounded-2xl hover:bg-rojo-500 transition-all shadow-lg shadow-rojo-900/40 group">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              </button>
            </div>
          </div>
        </main>
      </div>
    </Layout>
  );
};

export default ChatPage;
