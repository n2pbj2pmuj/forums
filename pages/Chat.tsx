
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'https://esm.sh/react-router-dom';
import { useAppState } from '../AppStateContext';
import { ChatMessage, User } from '../types';
import Layout from '../components/Layout';

const QUICK_EMOJIS = ['👍', '❤️', '🔥', '😂', '😮', '😢', '💯', '✅', '✨', '💀'];

const ChatPage: React.FC = () => {
  const { theme, users, chatMessages, fetchChatHistory, sendChatMessage, reactToChatMessage, currentUser, allChatPartners, friendRequests, acceptFriendRequest, declineFriendRequest, blocks, unblockUser } = useAppState();
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const targetIdFromUrl = queryParams.get('user');

  const [sidebarTab, setSidebarTab] = useState<'chats' | 'friends' | 'blocked'>('chats');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, msgId: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isDark = theme === 'dark';

  const filteredContacts = useMemo(() => {
    return allChatPartners.map(id => users.find(u => u.id === id)).filter(Boolean) as User[];
  }, [allChatPartners, users]);

  useEffect(() => {
    if (targetIdFromUrl) setSelectedUserId(targetIdFromUrl);
    else if (filteredContacts.length > 0 && !selectedUserId) setSelectedUserId(filteredContacts[0].id);
  }, [targetIdFromUrl, filteredContacts]);

  useEffect(() => {
    if (selectedUserId) fetchChatHistory(selectedUserId);
  }, [selectedUserId]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [chatMessages]);

  const handleSend = () => {
    if (!msg.trim() || !selectedUserId) return;
    sendChatMessage(selectedUserId, msg);
    setMsg('');
  };

  const handleRightClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, msgId: id });
  };

  const closeMenu = () => setContextMenu(null);

  const formatText = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\`(.*?)\`/g, '<code class="bg-black/20 px-1 rounded font-mono text-[13px]">$1</code>')
      .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" class="text-rojo-600 hover:underline">$1</a>');
  };

  const messageGroups = useMemo(() => {
    const groups: { date: string; messages: ChatMessage[] }[] = [];
    let currentGroup: ChatMessage[] = [];
    let lastDateLabel = "";

    chatMessages.forEach((m, i) => {
      const date = new Date(m.created_at);
      const dateLabel = date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      
      if (dateLabel !== lastDateLabel) {
        if (currentGroup.length > 0) groups.push({ date: lastDateLabel, messages: currentGroup });
        currentGroup = [m];
        lastDateLabel = dateLabel;
      } else {
        currentGroup.push(m);
      }
      if (i === chatMessages.length - 1) groups.push({ date: lastDateLabel, messages: currentGroup });
    });
    return groups;
  }, [chatMessages]);

  const isNewBlock = (msg: ChatMessage, prev: ChatMessage | null) => {
    if (!prev) return true;
    if (msg.sender_id !== prev.sender_id) return true;
    const diff = new Date(msg.created_at).getTime() - new Date(prev.created_at).getTime();
    return diff > 5 * 60 * 1000;
  };

  const selectedUser = users.find(u => u.id === selectedUserId);
  const isBlocked = blocks.some(b => b.blocked_id === selectedUserId);

  return (
    <Layout>
      <div onClick={closeMenu} className={`border rounded-[2.5rem] overflow-hidden shadow-2xl h-[750px] flex transition-all ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-100'}`}>
        {/* Sidebar */}
        <aside className={`w-80 flex flex-col border-r ${isDark ? 'border-zinc-800 bg-zinc-950' : 'border-zinc-100 bg-zinc-50'}`}>
          <div className="p-3 border-b border-zinc-800/20 flex gap-1">
            <button onClick={() => setSidebarTab('chats')} className={`flex-1 py-1.5 text-[8px] font-black uppercase tracking-widest rounded-lg transition-all ${sidebarTab === 'chats' ? 'bg-rojo-600 text-white shadow-lg' : 'text-zinc-500 hover:bg-zinc-900'}`}>Messages</button>
            <button onClick={() => setSidebarTab('friends')} className={`flex-1 py-1.5 text-[8px] font-black uppercase tracking-widest rounded-lg transition-all ${sidebarTab === 'friends' ? 'bg-rojo-600 text-white shadow-lg' : 'text-zinc-500 hover:bg-zinc-900'}`}>Friends</button>
            <button onClick={() => setSidebarTab('blocked')} className={`flex-1 py-1.5 text-[8px] font-black uppercase tracking-widest rounded-lg transition-all ${sidebarTab === 'blocked' ? 'bg-zinc-100 text-black shadow-lg' : 'text-zinc-500 hover:bg-zinc-900'}`}>Blocked</button>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar">
            {sidebarTab === 'chats' && filteredContacts.map(user => (
              <div key={user.id} onClick={() => setSelectedUserId(user.id)} className={`flex items-center space-x-3 p-4 cursor-pointer transition-all border-b border-zinc-900/10 ${selectedUserId === user.id ? 'bg-rojo-600/10 border-r-4 border-rojo-600' : 'hover:bg-zinc-900/40'}`}>
                <div className="relative shrink-0">
                  <img src={user.avatarUrl} className="w-10 h-10 rounded-2xl border border-zinc-800" alt="" />
                  <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-zinc-950 ${user.presenceStatus === 'Online' ? 'bg-emerald-500' : user.presenceStatus === 'Idle' ? 'bg-amber-500' : 'bg-rojo-600'}`}></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-black truncate ${selectedUserId === user.id ? 'text-rojo-500' : 'text-zinc-300'}`}>{user.displayName}</p>
                  <p className="text-[9px] text-zinc-600 font-bold uppercase truncate">@{user.username}</p>
                </div>
              </div>
            ))}
            {sidebarTab === 'friends' && (
              <div className="p-3 space-y-4">
                 {friendRequests.filter(r => r.receiver_id === currentUser?.id && r.status === 'pending').map(req => {
                   const sender = users.find(u => u.id === req.sender_id);
                   return (
                     <div key={req.id} className="p-3 bg-zinc-900/50 rounded-2xl border border-zinc-800 flex items-center justify-between">
                       <div className="flex items-center gap-2">
                          <img src={sender?.avatarUrl} className="w-8 h-8 rounded-xl" alt="" />
                          <span className="text-[9px] font-black uppercase text-zinc-300">@{sender?.username}</span>
                       </div>
                       <div className="flex gap-1">
                          <button onClick={() => acceptFriendRequest(req.id)} className="p-1.5 bg-emerald-600 rounded text-white text-[8px] font-black uppercase">Accept</button>
                          <button onClick={() => declineFriendRequest(req.id)} className="p-1.5 bg-zinc-800 rounded text-rojo-500 text-[8px] font-black uppercase">Ignore</button>
                       </div>
                     </div>
                   );
                 })}
              </div>
            )}
          </div>
        </aside>

        {/* Chat Main Area */}
        <main className="flex-1 flex flex-col relative bg-transparent overflow-hidden">
          {selectedUser ? (
            <>
              <header className="p-4 border-b flex items-center justify-between z-10 bg-zinc-950/80 backdrop-blur-md">
                <div className="flex items-center space-x-4">
                  <img src={selectedUser.avatarUrl} className="w-8 h-8 rounded-xl border border-zinc-800" alt="" />
                  <div>
                    <p className="text-sm font-black tracking-tight">{selectedUser.displayName}</p>
                    <p className="text-[8px] text-zinc-500 uppercase font-black">{selectedUser.presenceStatus}</p>
                  </div>
                </div>
              </header>

              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-1 no-scrollbar">
                {messageGroups.map((group) => (
                  <div key={group.date} className="space-y-1">
                    <div className="flex items-center my-8">
                       <div className="flex-1 h-px bg-zinc-800/20"></div>
                       <span className="px-4 text-[9px] font-black uppercase tracking-widest text-zinc-600">{group.date}</span>
                       <div className="flex-1 h-px bg-zinc-800/20"></div>
                    </div>
                    {group.messages.map((m, i) => {
                      const isNew = isNewBlock(m, i > 0 ? group.messages[i-1] : null);
                      const isMe = m.sender_id === currentUser?.id;
                      const sender = isMe ? currentUser : selectedUser;
                      return (
                        <div key={m.id} onContextMenu={(e) => handleRightClick(e, m.id)} className={`group relative flex items-start px-4 py-0.5 hover:bg-zinc-900/10 transition-colors ${isNew ? 'mt-4' : ''}`}>
                          {isNew ? (
                            <div className="flex gap-4 w-full">
                              <img src={sender?.avatarUrl} className="w-10 h-10 rounded-2xl shrink-0 mt-1 cursor-pointer" alt="" onClick={() => navigate(`/profile/${sender?.id}`)} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                   <span className={`text-[11px] font-black uppercase ${isMe ? 'text-rojo-500' : 'text-zinc-300'}`}>{sender?.displayName}</span>
                                   <span className="text-[8px] text-zinc-700 font-bold uppercase">{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <div dangerouslySetInnerHTML={{ __html: formatText(m.content) }} className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap break-words" />
                                <ReactionsDisplay m={m} currentUser={currentUser} onReact={reactToChatMessage} />
                              </div>
                            </div>
                          ) : (
                            <div className="flex gap-4 w-full pl-14 group">
                               <div className="absolute left-4 top-1.5 text-[8px] text-zinc-800 font-black opacity-0 group-hover:opacity-100 transition-opacity uppercase">{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                               <div className="flex-1 min-w-0">
                                 <div dangerouslySetInnerHTML={{ __html: formatText(m.content) }} className="text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap break-words" />
                                 <ReactionsDisplay m={m} currentUser={currentUser} onReact={reactToChatMessage} />
                               </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>

              <div className="p-6 border-t border-zinc-800 bg-zinc-950/50">
                {!isBlocked ? (
                  <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-2 ring-rojo-600/50 focus-within:ring-2 transition-all">
                    <input value={msg} onChange={e => setMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder={`Message @${selectedUser.displayName}...`} className="flex-1 bg-transparent border-none outline-none text-sm p-2 text-zinc-100" />
                    <button onClick={handleSend} className="bg-rojo-600 text-white p-2.5 rounded-xl transition-transform active:scale-95"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg></button>
                  </div>
                ) : <div className="p-4 bg-zinc-900 rounded-2xl text-center text-rojo-600 text-[10px] font-black uppercase tracking-widest">User Blocked</div>}
              </div>
            </>
          ) : <div className="flex-1 flex items-center justify-center opacity-20 p-20 text-center"><p className="font-black uppercase tracking-[0.5em] text-xs">Select a Conversation</p></div>}
        </main>
      </div>

      {contextMenu && (
        <div style={{ top: contextMenu.y, left: contextMenu.x }} className="fixed z-[999] bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl w-64 p-2 animate-in zoom-in duration-100 origin-top-left">
          <div className="p-2 flex flex-wrap gap-1.5 border-b border-zinc-900 mb-2">
            {QUICK_EMOJIS.map(e => <button key={e} onClick={() => { reactToChatMessage(contextMenu.msgId, e); closeMenu(); }} className="hover:scale-125 p-2 transition-all text-lg">{e}</button>)}
          </div>
          <button onClick={() => { closeMenu(); }} className="w-full text-left px-3 py-2 text-[9px] font-black uppercase text-zinc-400 hover:bg-zinc-900 rounded-xl">Copy Text</button>
        </div>
      )}
    </Layout>
  );
};

const ReactionsDisplay: React.FC<{ m: ChatMessage, currentUser: any, onReact: any }> = ({ m, currentUser, onReact }) => {
  if (!m.reactions || Object.keys(m.reactions).length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {Object.entries(m.reactions).map(([emoji, uids]) => (
        <button key={emoji} onClick={() => onReact(m.id, emoji)} className={`px-2 py-1 rounded-xl border-2 flex items-center gap-2 transition-all hover:scale-105 ${uids.includes(currentUser?.id || '') ? 'bg-rojo-600/10 border-rojo-600 text-rojo-500' : 'bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:border-zinc-600'}`}>
          <span className="text-sm">{emoji}</span>
          <span className="text-[10px] font-black">{uids.length}</span>
        </button>
      ))}
    </div>
  );
};

export default ChatPage;
