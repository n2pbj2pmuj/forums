
import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppState } from '../AppStateContext';
import Layout from '../components/Layout';

const ChatPage: React.FC = () => {
  const { theme, users, chatMessages, fetchChatHistory, sendChatMessage, currentUser, fetchAllMessages } = useAppState();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Use query param for starting a new chat from a profile link
  const queryParams = new URLSearchParams(location.search);
  const targetUserId = queryParams.get('user');

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [msg, setMsg] = useState('');

  const isDark = theme === 'dark';

  // Extract contacts from message history
  const contacts = useMemo(() => {
    if (!currentUser) return [];
    
    // We want unique users whom we have messaged, sorted by the latest message time
    const userMap = new Map<string, { lastMessageAt: string }>();
    
    // Scan all available message data to find our contacts
    // If we have access to a broader "allMessages" state, we use it
    // For now, we'll try to find any conversation partners in current chatMessages or from the targetUserId
    // Note: The AppState now needs to keep track of ALL conversation partners.
    // In a real app, you'd fetch "conversations".
    
    // If targetUserId is provided, ensure they are in the list
    if (targetUserId && targetUserId !== currentUser.id) {
      userMap.set(targetUserId, { lastMessageAt: new Date().toISOString() });
    }

    // Since we don't have a "Conversations" table, we rely on the users table and some logic
    // for this demo, let's just show users with whom there is ANY message or the current target.
    // We'll filter the global users list.
    return users.filter(u => u.id !== currentUser.id && userMap.has(u.id))
      .sort((a, b) => {
        const timeA = userMap.get(a.id)?.lastMessageAt || '';
        const timeB = userMap.get(b.id)?.lastMessageAt || '';
        return timeB.localeCompare(timeA);
      });
  }, [users, currentUser, targetUserId]);

  // If no contact selected yet, pick the first one or the target
  useEffect(() => {
    if (targetUserId) {
      setSelectedUserId(targetUserId);
    } else if (contacts.length > 0 && !selectedUserId) {
      setSelectedUserId(contacts[0].id);
    }
  }, [targetUserId, contacts]);

  useEffect(() => {
    if (selectedUserId) {
      fetchChatHistory(selectedUserId);
    }
  }, [selectedUserId]);

  const handleSend = () => {
    if (!msg.trim() || !selectedUserId) return;
    sendChatMessage(selectedUserId, msg);
    setMsg('');
  };

  const selectedUser = users.find(u => u.id === selectedUserId);

  // If we have NO contacts and NO target, show a placeholder
  if (!selectedUserId && contacts.length === 0) {
    return (
      <Layout>
        <div className={`border rounded-[2.5rem] flex items-center justify-center h-[700px] transition-all ${isDark ? 'bg-black border-rojo-900/30 text-slate-500' : 'bg-white border-rojo-100 text-slate-400'}`}>
          <div className="text-center space-y-4">
             <div className="w-20 h-20 bg-rojo-900/10 rounded-full flex items-center justify-center mx-auto">
               <svg className="w-10 h-10 text-rojo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
             </div>
             <p className="font-black uppercase text-xs tracking-widest">No active chats</p>
             <p className="text-[10px] max-w-xs mx-auto">Go to a member's profile and click "Message" to start a private conversation.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={`border rounded-[2.5rem] overflow-hidden shadow-[0_0_50px_rgba(255,0,0,0.05)] h-[700px] flex transition-all ${isDark ? 'bg-black border-rojo-900/30' : 'bg-white border-rojo-100'}`}>
        {/* Contacts Sidebar */}
        <aside className={`w-80 flex flex-col border-r transition-all ${isDark ? 'border-rojo-900/20 bg-rojo-950/20' : 'border-slate-100 bg-slate-50/50'}`}>
          <div className="p-6 border-b border-rojo-900/10 flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-rojo-500">Inbox</h2>
            <button onClick={() => navigate('/members')} className="text-slate-500 hover:text-rojo-500">
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar">
            {contacts.map(user => (
              <div 
                key={user.id} 
                onClick={() => setSelectedUserId(user.id)}
                className={`flex items-center space-x-4 p-5 cursor-pointer transition-all ${selectedUserId === user.id ? (isDark ? 'bg-rojo-500/10 border-r-4 border-rojo-500 shadow-inner' : 'bg-rojo-50 border-r-4 border-rojo-600') : 'hover:bg-rojo-900/5'}`}
              >
                <div className="relative shrink-0">
                  <img src={user.avatarUrl} className={`w-12 h-12 rounded-2xl border-2 transition-all ${selectedUserId === user.id ? 'border-rojo-500' : 'border-rojo-900/20'}`} alt="" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-black truncate transition-colors ${selectedUserId === user.id ? 'text-rojo-500' : 'text-slate-400'}`}>{user.displayName}</p>
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
              <img src={selectedUser?.avatarUrl} className="w-10 h-10 rounded-2xl border border-rojo-900/30" alt="" />
              <div>
                <p className="text-lg font-black tracking-tighter">{selectedUser?.displayName || 'Loading...'}</p>
                <p className="text-[10px] text-emerald-500 font-black uppercase tracking-widest">Active Connection</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className={`flex-1 overflow-y-auto p-10 space-y-8 no-scrollbar ${isDark ? 'bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-rojo-950/20 via-black to-black' : 'bg-slate-50/30'}`}>
            {chatMessages.length === 0 ? (
               <div className="h-full flex items-center justify-center opacity-20 flex-col">
                  <p className="font-black uppercase text-[10px] tracking-[0.4em]">Start of Transmissions</p>
               </div>
            ) : chatMessages.map(m => (
              <div key={m.id} className={`flex ${m.sender_id === currentUser?.id ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-300`}>
                <div className={`max-w-[75%] rounded-[1.5rem] px-6 py-4 text-sm shadow-xl transition-all ${
                  m.sender_id === currentUser?.id 
                  ? 'bg-rojo-600 text-white rounded-br-none shadow-rojo-900/20 border border-rojo-500' 
                  : `rounded-bl-none border ${isDark ? 'bg-rojo-950/40 border-rojo-900/30 text-slate-200' : 'bg-white border-slate-200 text-slate-700'}`
                }`}>
                  <p className="leading-relaxed">{m.content}</p>
                  <div className="flex items-center justify-between mt-3 opacity-40">
                    <span className="text-[9px] font-black uppercase tracking-widest">{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
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
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                type="text" 
                placeholder="Secure transmission channel..." 
                className="flex-1 bg-transparent border-none text-sm font-medium focus:ring-0 outline-none placeholder-slate-800" 
              />
              <button onClick={handleSend} className="bg-rojo-600 text-white p-3.5 rounded-2xl hover:bg-rojo-500 transition-all shadow-lg shadow-rojo-900/40 group">
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
