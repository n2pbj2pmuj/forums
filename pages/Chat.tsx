
import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppState } from '../AppStateContext';
import Layout from '../components/Layout';

const ChatPage: React.FC = () => {
  const { theme, users, chatMessages, fetchChatHistory, sendChatMessage, currentUser, allChatPartners } = useAppState();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const targetIdFromUrl = queryParams.get('user');

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [msg, setMsg] = useState('');

  // Contacts: Users we've messaged OR the user we were referred to from a profile click
  const filteredContacts = useMemo(() => {
    return users.filter(u => {
      const isMe = u.id === currentUser?.id;
      const isKnownPartner = allChatPartners.includes(u.id);
      const isTargetedUser = u.id === targetIdFromUrl;
      return !isMe && (isKnownPartner || isTargetedUser);
    });
  }, [users, allChatPartners, currentUser, targetIdFromUrl]);

  useEffect(() => {
    if (targetIdFromUrl) {
      setSelectedUserId(targetIdFromUrl);
    } else if (filteredContacts.length > 0 && !selectedUserId) {
      setSelectedUserId(filteredContacts[0].id);
    }
  }, [targetIdFromUrl, filteredContacts]);

  useEffect(() => {
    if (selectedUserId) {
      fetchChatHistory(selectedUserId);
    }
  }, [selectedUserId, fetchChatHistory]);

  const handleSend = () => {
    if (!msg.trim() || !selectedUserId) return;
    sendChatMessage(selectedUserId, msg);
    setMsg('');
  };

  const isDark = theme === 'dark';
  const selectedUser = users.find(u => u.id === selectedUserId);

  if (!selectedUserId && filteredContacts.length === 0) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[700px] border border-dashed border-rojo-900/30 rounded-[2.5rem] opacity-30">
          <p className="font-black uppercase tracking-widest text-xs">No Active Transmissions</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={`border rounded-[2.5rem] overflow-hidden shadow-[0_0_50px_rgba(255,0,0,0.05)] h-[700px] flex transition-all ${isDark ? 'bg-black border-rojo-900/30' : 'bg-white border-rojo-100'}`}>
        <aside className={`w-80 flex flex-col border-r transition-all ${isDark ? 'border-rojo-900/20 bg-rojo-950/20' : 'border-slate-100 bg-slate-50/50'}`}>
          <div className="p-6 border-b border-rojo-900/10">
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-rojo-500 mb-4">Direct Messages</h2>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar">
            {filteredContacts.map(user => (
              <div 
                key={user.id} 
                onClick={() => setSelectedUserId(user.id)}
                className={`flex items-center space-x-4 p-5 cursor-pointer transition-all ${selectedUserId === user.id ? (isDark ? 'bg-rojo-500/10 border-r-4 border-rojo-500 shadow-inner' : 'bg-rojo-50 border-r-4 border-rojo-600') : 'hover:bg-rojo-900/5'}`}
              >
                <img src={user.avatarUrl} className={`w-12 h-12 rounded-2xl border-2 transition-all ${selectedUserId === user.id ? 'border-rojo-500 scale-105' : 'border-rojo-900/20'}`} alt="" />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-black truncate ${selectedUserId === user.id ? 'text-rojo-500' : 'text-slate-400'}`}>{user.displayName}</p>
                </div>
              </div>
            ))}
          </div>
        </aside>

        <main className="flex-1 flex flex-col relative">
          {selectedUser ? (
            <>
              <div className={`p-6 border-b flex items-center justify-between z-10 ${isDark ? 'border-rojo-900/20 bg-black/40 backdrop-blur-md' : 'border-slate-100 bg-white/40 backdrop-blur-md'}`}>
                <div className="flex items-center space-x-4">
                  <img src={selectedUser.avatarUrl} className="w-10 h-10 rounded-2xl border border-rojo-900/30" alt="" />
                  <div>
                    <p className="text-lg font-black tracking-tighter">{selectedUser.displayName}</p>
                    <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest">Active Channel</p>
                  </div>
                </div>
              </div>

              <div className={`flex-1 overflow-y-auto p-10 space-y-8 no-scrollbar ${isDark ? 'bg-black' : 'bg-slate-50/30'}`}>
                {chatMessages.length === 0 && (
                  <div className="h-full flex items-center justify-center opacity-20 flex-col space-y-4">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                    <p className="font-black uppercase text-[10px] tracking-widest">Start a new conversation</p>
                  </div>
                )}
                {chatMessages.map(m => (
                  <div key={m.id} className={`flex ${m.sender_id === currentUser?.id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] rounded-[1.5rem] px-6 py-4 text-sm shadow-xl transition-all hover:scale-[1.02] ${
                      m.sender_id === currentUser?.id 
                      ? 'bg-rojo-600 text-white rounded-br-none border border-rojo-500' 
                      : `rounded-bl-none border ${isDark ? 'bg-rojo-950/40 border-rojo-900/30 text-slate-200' : 'bg-white border-slate-200 text-slate-700'}`
                    }`}>
                      <p className="leading-relaxed">{m.content}</p>
                      <span className="text-[9px] font-black uppercase tracking-widest opacity-40 mt-2 block">{new Date(m.created_at).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className={`p-8 border-t z-10 ${isDark ? 'border-rojo-900/20 bg-black/60' : 'border-slate-100 bg-white'}`}>
                <div className="flex items-center space-x-4 bg-rojo-950/30 border border-rojo-900/20 rounded-[1.5rem] p-2 pr-4 focus-within:ring-2 ring-rojo-500/50 transition-all">
                  <input 
                    value={msg}
                    onChange={e => setMsg(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                    type="text" 
                    placeholder="Secure transmission..." 
                    className="flex-1 bg-transparent border-none text-sm font-medium focus:ring-0 outline-none p-3" 
                  />
                  <button onClick={handleSend} className="bg-rojo-600 text-white p-3.5 rounded-2xl hover:bg-rojo-500 shadow-lg shadow-rojo-900/40 transition-all active:scale-95">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center opacity-30">
              <p className="font-black uppercase tracking-widest text-xs">Select a channel to begin</p>
            </div>
          )}
        </main>
      </div>
    </Layout>
  );
};

export default ChatPage;
