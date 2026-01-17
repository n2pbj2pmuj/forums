
import React, { useState } from 'react';
import { MOCK_USERS } from '../constants';
import Layout from '../components/Layout';

const ChatPage: React.FC = () => {
  const [selectedUser, setSelectedUser] = useState(MOCK_USERS[0]);
  const [msg, setMsg] = useState('');
  const [messages, setMessages] = useState([
    { id: '1', sender: 'u1', text: 'Hey, did you see the new admin update?', timestamp: '10:00 AM' },
    { id: '2', sender: 'me', text: 'Yeah, looks much cleaner!', timestamp: '10:05 AM' }
  ]);

  const send = () => {
    if (!msg.trim()) return;
    setMessages([...messages, { id: Date.now().toString(), sender: 'me', text: msg, timestamp: 'Just now' }]);
    setMsg('');
  };

  return (
    <Layout>
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm h-[600px] flex">
        {/* Contacts Sidebar */}
        <aside className="w-64 border-r border-slate-100 flex flex-col">
          <div className="p-4 border-b">
            <input type="text" placeholder="Search chats..." className="w-full bg-slate-50 border rounded-lg px-3 py-1.5 text-xs outline-none focus:ring-1 ring-indigo-500" />
          </div>
          <div className="flex-1 overflow-y-auto">
            {MOCK_USERS.map(user => (
              <div 
                key={user.id} 
                onClick={() => setSelectedUser(user)}
                className={`flex items-center space-x-3 p-4 cursor-pointer hover:bg-slate-50 transition ${selectedUser.id === user.id ? 'bg-indigo-50 border-r-2 border-indigo-600' : ''}`}
              >
                <div className="relative">
                  <img src={user.avatarUrl} className="w-10 h-10 rounded-full" alt="" />
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{user.displayName}</p>
                  <p className="text-[10px] text-slate-400 truncate">Online</p>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Chat Window */}
        <main className="flex-1 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img src={selectedUser.avatarUrl} className="w-8 h-8 rounded-full" alt="" />
              <p className="text-sm font-black text-slate-900">{selectedUser.displayName}</p>
            </div>
            <div className="flex space-x-4">
              <button className="text-slate-400 hover:text-indigo-600"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg></button>
              <button className="text-slate-400 hover:text-red-500"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg></button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30">
            {messages.map(m => (
              <div key={m.id} className={`flex ${m.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] rounded-2xl p-4 text-sm shadow-sm ${
                  m.sender === 'me' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white text-slate-700 rounded-bl-none'
                }`}>
                  <p>{m.text}</p>
                  <p className={`text-[9px] mt-1 ${m.sender === 'me' ? 'text-indigo-200' : 'text-slate-400'}`}>{m.timestamp}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex space-x-3">
              <input 
                value={msg}
                onChange={e => setMsg(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && send()}
                type="text" 
                placeholder="Type a message..." 
                className="flex-1 bg-slate-100 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 ring-indigo-500 outline-none" 
              />
              <button onClick={send} className="bg-indigo-600 text-white p-2 rounded-xl hover:bg-indigo-700 transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
              </button>
            </div>
          </div>
        </main>
      </div>
    </Layout>
  );
};

export default ChatPage;
