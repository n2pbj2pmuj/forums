
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppState } from '../AppStateContext';
import { ChatMessage, User } from '../types';
import Layout from '../components/Layout';

const EMOJI_OPTIONS = ['👍', '❤️', '🔥', '😂', '😮', '😢', '💯', '✅'];

const ChatPage: React.FC = () => {
  const { theme, users, chatMessages, fetchChatHistory, sendChatMessage, deleteChatMessage, editChatMessage, reactToChatMessage, currentUser, allChatPartners } = useAppState();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const targetIdFromUrl = queryParams.get('user');

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, msgId: string } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editVal, setEditVal] = useState('');
  const [pendingFiles, setPendingFiles] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isDark = theme === 'dark';

  const filteredContacts = useMemo(() => {
    return users.filter(u => {
      const isMe = u.id === currentUser?.id;
      const isKnownPartner = allChatPartners.includes(u.id);
      const isTargetedUser = u.id === targetIdFromUrl;
      return !isMe && (isKnownPartner || isTargetedUser);
    });
  }, [users, allChatPartners, currentUser, targetIdFromUrl]);

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
    if ((!msg.trim() && pendingFiles.length === 0) || !selectedUserId) return;
    sendChatMessage(selectedUserId, msg, pendingFiles);
    setMsg('');
    setPendingFiles([]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setPendingFiles([...pendingFiles, ev.target?.result as string]);
      reader.readAsDataURL(file);
    }
  };

  const handleRightClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, msgId: id });
  };

  const closeMenu = () => setContextMenu(null);

  const startEdit = (m: ChatMessage) => {
    setEditingId(m.id);
    setEditVal(m.content);
    closeMenu();
  };

  const commitEdit = () => {
    if (editingId) editChatMessage(editingId, editVal);
    setEditingId(null);
  };

  const selectedUser = users.find(u => u.id === selectedUserId);

  const formatText = (text: string) => {
    // Bold: **text** -> <strong>text</strong>
    // Italic: *text* -> <em>text</em>
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\`(.*?)\`/g, '<code class="bg-black/20 px-1 rounded">$1</code>');
  };

  return (
    <Layout>
      <div onClick={closeMenu} className={`border rounded-[2.5rem] overflow-hidden shadow-2xl h-[750px] flex transition-all ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-100'}`}>
        
        {/* Sidebar */}
        <aside className={`w-80 flex flex-col border-r ${isDark ? 'border-zinc-800 bg-zinc-950' : 'border-zinc-100 bg-zinc-50'}`}>
          <div className="p-6 border-b border-zinc-800/20">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-rojo-500">Direct Messages</h2>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar">
            {filteredContacts.map(user => (
              <div 
                key={user.id} 
                onClick={() => setSelectedUserId(user.id)}
                className={`flex items-center space-x-3 p-4 cursor-pointer transition-all ${selectedUserId === user.id ? (isDark ? 'bg-rojo-500/10 border-r-4 border-rojo-500 shadow-inner' : 'bg-rojo-50 border-r-4 border-rojo-600') : 'hover:bg-zinc-900/40'}`}
              >
                <div className="relative">
                  <img src={user.avatarUrl} className={`w-10 h-10 rounded-2xl border-2 transition-all ${selectedUserId === user.id ? 'border-rojo-500 scale-105' : 'border-zinc-800'}`} alt="" />
                  <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-zinc-950 ${user.status === 'Active' ? 'bg-emerald-500' : 'bg-zinc-700'}`}></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-black truncate ${selectedUserId === user.id ? 'text-rojo-500' : 'text-zinc-400'}`}>{user.displayName}</p>
                  <p className="text-[9px] text-zinc-500 truncate">@{user.username}</p>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col relative bg-transparent overflow-hidden">
          {selectedUser ? (
            <>
              <header className={`p-4 border-b flex items-center justify-between z-10 ${isDark ? 'border-zinc-800 bg-zinc-950/80 backdrop-blur-md' : 'border-zinc-100 bg-white/80'}`}>
                <div className="flex items-center space-x-4">
                  <img src={selectedUser.avatarUrl} className="w-8 h-8 rounded-xl border border-zinc-800" alt="" />
                  <div>
                    <p className="text-sm font-black tracking-tight">{selectedUser.displayName}</p>
                    <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">{selectedUser.role}</p>
                  </div>
                </div>
              </header>

              <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar">
                {chatMessages.map(m => {
                  const isMe = m.sender_id === currentUser?.id;
                  const sender = isMe ? currentUser : selectedUser;
                  return (
                    <div 
                      key={m.id} 
                      onContextMenu={(e) => handleRightClick(e, m.id)}
                      className={`group flex items-start gap-4 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
                    >
                      <img src={sender?.avatarUrl} className="w-8 h-8 rounded-xl shadow-lg border border-zinc-800 shrink-0 mt-1" alt="" />
                      <div className={`flex flex-col space-y-1 max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                        <div className="flex items-center gap-2 px-1">
                          <span className="text-[10px] font-black uppercase tracking-tight text-zinc-500">{sender?.displayName}</span>
                          <span className="text-[8px] text-zinc-700 font-bold uppercase">{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        
                        <div className={`relative px-4 py-3 rounded-[1.25rem] text-sm shadow-xl transition-all ${
                          isMe ? 'bg-rojo-600 text-white rounded-tr-none' : `rounded-tl-none border ${isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-300' : 'bg-white border-zinc-100'}`
                        }`}>
                          {editingId === m.id ? (
                            <div className="space-y-2">
                              <textarea 
                                value={editVal} 
                                onChange={e => setEditVal(e.target.value)} 
                                className="w-full bg-black/20 border-none text-white outline-none resize-none p-1" 
                                autoFocus
                                onKeyDown={e => e.key === 'Enter' && commitEdit()}
                              />
                              <p className="text-[8px] opacity-60">Escape to cancel • Enter to save</p>
                            </div>
                          ) : (
                            <>
                              <div dangerouslySetInnerHTML={{ __html: formatText(m.content) }} className="leading-relaxed" />
                              {m.attachments?.map((url, i) => (
                                <div key={i} className="mt-3 rounded-lg overflow-hidden border border-black/10">
                                  {url.startsWith('data:video') ? <video controls src={url} className="max-w-full" /> : <img src={url} className="max-w-full" alt="" />}
                                </div>
                              ))}
                            </>
                          )}
                          {m.is_edited && <span className="absolute -bottom-4 right-0 text-[8px] opacity-40 uppercase font-black">Edited</span>}
                        </div>

                        {/* Reactions */}
                        {Object.keys(m.reactions || {}).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {Object.entries(m.reactions).map(([emoji, uids]) => (
                              <button 
                                key={emoji} 
                                onClick={() => reactToChatMessage(m.id, emoji)}
                                className={`px-2 py-0.5 rounded-lg border text-[10px] flex items-center gap-1 transition-all ${uids.includes(currentUser?.id || '') ? 'bg-rojo-600/20 border-rojo-600 text-rojo-500' : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-rojo-500'}`}
                              >
                                {emoji} <span className="font-black">{uids.length}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Input Area */}
              <div className={`p-6 border-t ${isDark ? 'border-zinc-800 bg-zinc-950/50' : 'border-zinc-100 bg-white'}`}>
                {pendingFiles.length > 0 && (
                  <div className="flex gap-2 mb-4">
                    {pendingFiles.map((f, i) => (
                      <div key={i} className="relative w-16 h-16 rounded-xl border border-zinc-800 overflow-hidden group">
                        <img src={f} className="w-full h-full object-cover" alt="" />
                        <button onClick={() => setPendingFiles(p => p.filter((_, idx) => idx !== i))} className="absolute inset-0 bg-rojo-600/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-3 bg-zinc-900/50 border border-zinc-800 rounded-2xl px-4 py-2 focus-within:ring-2 ring-rojo-600/50 transition-all">
                  <button onClick={() => fileInputRef.current?.click()} className="text-zinc-500 hover:text-rojo-500 transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  </button>
                  <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />
                  <input 
                    value={msg}
                    onChange={e => setMsg(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                    placeholder={`Message @${selectedUser.displayName}...`}
                    className="flex-1 bg-transparent border-none outline-none text-sm p-2 text-zinc-100"
                  />
                  <button onClick={handleSend} className="bg-rojo-600 text-white p-2.5 rounded-xl hover:bg-rojo-500 transition-all">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center opacity-20">
              <p className="font-black uppercase tracking-[0.5em] text-xs">Awaiting Connection</p>
            </div>
          )}
        </main>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div 
          style={{ top: contextMenu.y, left: contextMenu.x }}
          className="fixed z-[999] bg-zinc-950 border border-zinc-800 rounded-xl shadow-2xl overflow-hidden w-48 p-1 animate-in zoom-in duration-100"
        >
          <div className="p-2 flex flex-wrap gap-1 border-b border-zinc-900 mb-1">
            {EMOJI_OPTIONS.map(e => (
              <button 
                key={e} 
                onClick={() => { reactToChatMessage(contextMenu.msgId, e); closeMenu(); }}
                className="hover:bg-zinc-900 p-1.5 rounded transition-colors text-lg"
              >
                {e}
              </button>
            ))}
          </div>
          {chatMessages.find(m => m.id === contextMenu.msgId)?.sender_id === currentUser?.id && (
            <>
              <MenuBtn onClick={() => startEdit(chatMessages.find(m => m.id === contextMenu.msgId)!)}>Edit Message</MenuBtn>
              <MenuBtn color="text-rojo-500" onClick={() => { deleteChatMessage(contextMenu.msgId); closeMenu(); }}>Delete Message</MenuBtn>
            </>
          )}
          <MenuBtn onClick={() => { navigator.clipboard.writeText(chatMessages.find(m => m.id === contextMenu.msgId)?.content || ''); closeMenu(); }}>Copy Text</MenuBtn>
        </div>
      )}
    </Layout>
  );
};

const MenuBtn: React.FC<{ children: React.ReactNode, onClick: () => void, color?: string }> = ({ children, onClick, color }) => (
  <button 
    onClick={onClick}
    className={`w-full text-left px-3 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-rojo-600 hover:text-white rounded transition-all ${color || 'text-zinc-400'}`}
  >
    {children}
  </button>
);

export default ChatPage;
