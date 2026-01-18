
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppState } from '../AppStateContext';
import { ChatMessage, User } from '../types';
import Layout from '../components/Layout';

const QUICK_EMOJIS = ['👍', '❤️', '🔥', '😂', '😮', '😢', '💯', '✅', '✨', '💀'];
const FULL_EMOJIS = [
  '😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','😉','😊','😇','🥰','😍','🤩','😘','😗','😚','😙','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🤐','🤨','😐','😑','😶','😏','😒','🙄','😬','🤥','😌','😔','😪','🤤','😴','😷','🤒','🤕','🤢','🤮','🤧','🥵','🥶','🥴','😵','🤯','🤠','🥳','😎','🤓','🧐','😕','😟','🙁','☹️','😮','😯','😲','😳','🥺','😦','😧','😨','😰','😥','😢','😭','😱','😖','😣','😞','😓','😩','😫','🥱','😤','😡','😠','🤬','😈','👿','💀','☠️','💩','🤡','👹','👺','👻','👽','👾','🤖','😺','😸','😻','😼','😽','🙀','😿','😾','🙈','🙉','🙊','💋','💌','💘','💝','💖','💗','💓','💞','💕','💟','❣️','💔','❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💯','💢','💥','💫','💦','💨','🕳️','💣','💬','👁️‍🗨️','🗨️','🗯️','💭','💤'
];

const ChatPage: React.FC = () => {
  const { theme, users, chatMessages, fetchChatHistory, sendChatMessage, deleteChatMessage, editChatMessage, reactToChatMessage, currentUser, allChatPartners } = useAppState();
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const targetIdFromUrl = queryParams.get('user');

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, msgId: string } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editVal, setEditVal] = useState('');
  const [pendingFiles, setPendingFiles] = useState<string[]>([]);
  const [profilePreviewId, setProfilePreviewId] = useState<string | null>(null);
  const [showFullEmojiPicker, setShowFullEmojiPicker] = useState(false);
  const [emojiSearch, setEmojiSearch] = useState('');
  
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

  const filteredEmojis = useMemo(() => {
    if (!emojiSearch.trim()) return FULL_EMOJIS;
    return FULL_EMOJIS.filter(e => e.includes(emojiSearch)); // Simplified, usually you'd have names for emojis
  }, [emojiSearch]);

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

  const closeMenu = () => {
    setContextMenu(null);
    setShowFullEmojiPicker(false);
    setEmojiSearch('');
  };

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
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\`(.*?)\`/g, '<code class="bg-black/20 px-1 rounded font-mono text-[13px]">$1</code>')
      .replace(urlRegex, '<a href="$1" target="_blank" class="text-rojo-500 hover:underline font-bold">$1</a>');
  };

  const messageGroups = useMemo(() => {
    const groups: { date: string; messages: ChatMessage[] }[] = [];
    let currentGroup: ChatMessage[] = [];
    let lastDateLabel = "";

    chatMessages.forEach((m, i) => {
      const date = new Date(m.created_at);
      const dateLabel = date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      
      if (dateLabel !== lastDateLabel) {
        if (currentGroup.length > 0) {
           groups.push({ date: lastDateLabel, messages: currentGroup });
        }
        currentGroup = [m];
        lastDateLabel = dateLabel;
      } else {
        currentGroup.push(m);
      }

      if (i === chatMessages.length - 1) {
        groups.push({ date: lastDateLabel, messages: currentGroup });
      }
    });

    return groups;
  }, [chatMessages]);

  const isNewBlock = (msg: ChatMessage, prev: ChatMessage | null) => {
    if (!prev) return true;
    if (msg.sender_id !== prev.sender_id) return true;
    const diff = new Date(msg.created_at).getTime() - new Date(prev.created_at).getTime();
    return diff > 4 * 60 * 1000;
  };

  return (
    <Layout>
      <div onClick={() => { closeMenu(); setProfilePreviewId(null); }} className={`border rounded-[2.5rem] overflow-hidden shadow-2xl h-[750px] flex transition-all ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-100'}`}>
        
        {/* Sidebar */}
        <aside className={`w-80 flex flex-col border-r ${isDark ? 'border-zinc-800 bg-zinc-950' : 'border-zinc-100 bg-zinc-50'}`}>
          <div className="p-6 border-b border-zinc-800/20">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-rojo-500">Inbox</h2>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar">
            {filteredContacts.map(user => (
              <div 
                key={user.id} 
                onClick={(e) => { e.stopPropagation(); setSelectedUserId(user.id); }}
                onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setProfilePreviewId(user.id); }}
                className={`flex items-center space-x-3 p-4 cursor-pointer transition-all ${selectedUserId === user.id ? (isDark ? 'bg-rojo-500/10 border-r-4 border-rojo-500' : 'bg-rojo-50 border-r-4 border-rojo-600') : 'hover:bg-zinc-900/40'}`}
              >
                <div className="relative" onClick={(e) => { e.stopPropagation(); setProfilePreviewId(user.id); }}>
                  <img src={user.avatarUrl} className={`w-10 h-10 rounded-2xl border-2 transition-all hover:ring-2 ring-rojo-600 ${selectedUserId === user.id ? 'border-rojo-500' : 'border-zinc-800'}`} alt="" />
                  <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-zinc-950 ${user.status === 'Active' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-zinc-700'}`}></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-black truncate ${selectedUserId === user.id ? 'text-rojo-500' : 'text-zinc-400'}`}>{user.displayName}</p>
                  <p className="text-[9px] text-zinc-500 truncate font-bold uppercase tracking-widest">@{user.username}</p>
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Chat Content */}
        <main className="flex-1 flex flex-col relative bg-transparent overflow-hidden">
          {selectedUser ? (
            <>
              <header className={`p-4 border-b flex items-center justify-between z-10 ${isDark ? 'border-zinc-800 bg-zinc-950/80 backdrop-blur-md' : 'border-zinc-100 bg-white/80'}`}>
                <div className="flex items-center space-x-4">
                  <img onClick={(e) => { e.stopPropagation(); setProfilePreviewId(selectedUser.id); }} src={selectedUser.avatarUrl} className="w-8 h-8 rounded-xl border border-zinc-800 cursor-pointer hover:opacity-80 transition-opacity" alt="" />
                  <div>
                    <p className="text-sm font-black tracking-tight">{selectedUser.displayName}</p>
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${selectedUser.status === 'Active' ? 'bg-emerald-500' : 'bg-zinc-700'}`}></div>
                      <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">{selectedUser.role}</p>
                    </div>
                  </div>
                </div>
              </header>

              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-1 no-scrollbar bg-black/5">
                {messageGroups.map((group) => (
                  <div key={group.date} className="space-y-1">
                    <div className="flex items-center my-8">
                       <div className="flex-1 h-px bg-zinc-800/20"></div>
                       <span className="px-4 text-[9px] font-black uppercase tracking-[0.2em] text-zinc-600">{group.date}</span>
                       <div className="flex-1 h-px bg-zinc-800/20"></div>
                    </div>

                    {group.messages.map((m, i) => {
                      const prevMsg = i > 0 ? group.messages[i-1] : null;
                      const isNew = isNewBlock(m, prevMsg);
                      const isMe = m.sender_id === currentUser?.id;
                      const sender = isMe ? currentUser : selectedUser;

                      return (
                        <div 
                          key={m.id} 
                          onContextMenu={(e) => handleRightClick(e, m.id)}
                          className={`group relative flex items-start px-4 py-0.5 hover:bg-zinc-900/20 transition-colors ${isNew ? 'mt-4' : ''}`}
                        >
                          {isNew ? (
                            <div className="flex gap-4 w-full">
                              <img 
                                onClick={(e) => { e.stopPropagation(); setProfilePreviewId(sender?.id || null); }}
                                src={sender?.avatarUrl} 
                                className="w-10 h-10 rounded-2xl border-2 border-zinc-900 shadow-xl shrink-0 mt-1 cursor-pointer hover:ring-2 ring-rojo-600 transition-all" 
                                alt="" 
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                   <span className={`text-[11px] font-black uppercase tracking-tight ${isMe ? 'text-rojo-500' : 'text-zinc-300'}`}>{sender?.displayName}</span>
                                   <span className="text-[8px] text-zinc-700 font-bold uppercase">{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <MessageContent m={m} isEditing={editingId === m.id} editVal={editVal} setEditVal={setEditVal} commitEdit={commitEdit} formatText={formatText} isMe={isMe} />
                                <ReactionsDisplay m={m} currentUser={currentUser} onReact={reactToChatMessage} />
                              </div>
                            </div>
                          ) : (
                            <div className="flex gap-4 w-full">
                               <div className="w-10 shrink-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <span className="text-[7px] font-bold text-zinc-700">{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                               </div>
                               <div className="flex-1 min-w-0">
                                 <MessageContent m={m} isEditing={editingId === m.id} editVal={editVal} setEditVal={setEditVal} commitEdit={commitEdit} formatText={formatText} isMe={isMe} />
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

              {/* Input Area */}
              <div className={`p-6 border-t ${isDark ? 'border-zinc-800 bg-zinc-950/50' : 'border-zinc-100 bg-white'}`}>
                {pendingFiles.length > 0 && (
                  <div className="flex gap-2 mb-4 animate-in slide-in-from-bottom-2">
                    {pendingFiles.map((f, i) => (
                      <div key={i} className="relative w-24 h-24 rounded-2xl border border-zinc-800 overflow-hidden group shadow-2xl bg-zinc-900">
                        {f.startsWith('data:audio') ? (
                          <div className="w-full h-full flex items-center justify-center text-rojo-600">
                             <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 20 20"><path d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8v4l5-2-5-2z"/></svg>
                          </div>
                        ) : <img src={f} className="w-full h-full object-cover" alt="" />}
                        <button onClick={() => setPendingFiles(p => p.filter((_, idx) => idx !== i))} className="absolute inset-0 bg-rojo-600/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-2 focus-within:ring-2 ring-rojo-600/50 transition-all shadow-inner">
                  <button onClick={() => fileInputRef.current?.click()} className="text-zinc-500 hover:text-rojo-500 transition-colors p-2 rounded-xl hover:bg-white/5">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  </button>
                  <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} accept="image/*,video/*,audio/*" />
                  <input 
                    value={msg}
                    onChange={e => setMsg(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                    placeholder={`Message @${selectedUser.displayName}...`}
                    className="flex-1 bg-transparent border-none outline-none text-sm p-2 text-zinc-100 placeholder:text-zinc-700"
                  />
                  <button onClick={handleSend} className="bg-rojo-600 text-white p-2.5 rounded-xl hover:bg-rojo-500 transition-all shadow-lg active:scale-95 disabled:opacity-30" disabled={!msg.trim() && pendingFiles.length === 0}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center opacity-20 p-20 text-center">
              <div className="w-20 h-20 bg-rojo-600/10 rounded-full flex items-center justify-center mb-6 border-4 border-dashed border-rojo-600 animate-pulse">
                 <svg className="w-10 h-10 text-rojo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              </div>
              <p className="font-black uppercase tracking-[0.5em] text-xs">Direct Messages</p>
            </div>
          )}
        </main>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div 
          style={{ top: contextMenu.y, left: contextMenu.x }}
          className="fixed z-[999] bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden w-64 p-2 animate-in zoom-in duration-100 origin-top-left"
        >
          <div className="p-2 flex flex-wrap gap-1.5 border-b border-zinc-900 mb-2">
            {QUICK_EMOJIS.map(e => (
              <button key={e} onClick={(ev) => { ev.stopPropagation(); reactToChatMessage(contextMenu.msgId, e); closeMenu(); }} className="hover:bg-rojo-600/20 hover:scale-125 p-2 rounded-lg transition-all text-lg">{e}</button>
            ))}
            <button 
              onClick={(e) => { e.stopPropagation(); setShowFullEmojiPicker(!showFullEmojiPicker); }} 
              className={`p-2 rounded-lg transition-all text-zinc-500 hover:text-white ${showFullEmojiPicker ? 'bg-rojo-600 text-white' : 'hover:bg-zinc-900'}`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            </button>
          </div>
          
          {showFullEmojiPicker && (
            <div className="px-2 mb-2 max-h-48 overflow-y-auto no-scrollbar border-b border-zinc-900 pb-2 animate-in fade-in slide-in-from-top-1">
               <input 
                 autoFocus
                 value={emojiSearch}
                 onChange={e => setEmojiSearch(e.target.value)}
                 onClick={e => e.stopPropagation()}
                 placeholder="Search all emojis..."
                 className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-1.5 text-[10px] text-white outline-none mb-2"
               />
               <div className="grid grid-cols-6 gap-1">
                 {filteredEmojis.map(e => (
                   <button key={e} onClick={(ev) => { ev.stopPropagation(); reactToChatMessage(contextMenu.msgId, e); closeMenu(); }} className="hover:bg-zinc-800 p-1 rounded text-lg">{e}</button>
                 ))}
               </div>
            </div>
          )}

          <div className="space-y-0.5">
            {chatMessages.find(m => m.id === contextMenu.msgId)?.sender_id === currentUser?.id && (
              <>
                <MenuBtn onClick={() => startEdit(chatMessages.find(m => m.id === contextMenu.msgId)!)}>
                  <svg className="w-3.5 h-3.5 mr-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  Edit Message
                </MenuBtn>
                <MenuBtn color="text-rojo-500 hover:bg-rojo-600/10" onClick={() => { deleteChatMessage(contextMenu.msgId); closeMenu(); }}>
                  <svg className="w-3.5 h-3.5 mr-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  Delete Message
                </MenuBtn>
              </>
            )}
            <MenuBtn onClick={() => { navigator.clipboard.writeText(chatMessages.find(m => m.id === contextMenu.msgId)?.content || ''); closeMenu(); }}>
               <svg className="w-3.5 h-3.5 mr-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
               Copy Text
            </MenuBtn>
          </div>
        </div>
      )}

      {/* Profile Preview */}
      {profilePreviewId && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 animate-in fade-in duration-300 backdrop-blur-sm" onClick={() => setProfilePreviewId(null)}>
           <div onClick={e => e.stopPropagation()} className={`w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl border animate-in zoom-in duration-200 ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-zinc-100'}`}>
              {(() => {
                const pUser = users.find(u => u.id === profilePreviewId);
                if (!pUser) return null;
                return (
                  <div className="flex flex-col">
                    <div className="h-24 bg-rojo-950/20 relative">
                       {pUser.bannerUrl && <img src={pUser.bannerUrl} className="w-full h-full object-cover opacity-60" alt="" />}
                    </div>
                    <div className="px-8 pb-8 -mt-10 relative">
                       <img src={pUser.avatarUrl} className="w-20 h-20 rounded-[1.5rem] border-4 border-zinc-950 shadow-2xl mb-4 object-cover" alt="" />
                       <div className="flex flex-col gap-1 mb-6">
                          <h3 className="text-xl font-black tracking-tight">{pUser.displayName}</h3>
                          <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">@{pUser.username}</p>
                          <span className={`w-fit mt-2 px-3 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${pUser.role === 'Admin' ? 'bg-rojo-600 text-white' : 'bg-zinc-900 text-zinc-500'}`}>{pUser.role}</span>
                       </div>
                       <div className="space-y-4 mb-8">
                          <div><p className="text-[8px] font-black uppercase text-zinc-600 tracking-widest mb-1">Status</p><div className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${pUser.status === 'Active' ? 'bg-emerald-500' : 'bg-zinc-700'}`}></div><span className="text-[10px] font-bold text-zinc-500">{pUser.status === 'Active' ? 'Online' : 'Offline'}</span></div></div>
                       </div>
                       <div className="flex gap-2">
                          <button onClick={() => navigate(`/profile/${pUser.id}`)} className="flex-1 bg-rojo-600 text-white py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-rojo-500 transition-all shadow-lg">Full Profile</button>
                          <button onClick={() => setProfilePreviewId(null)} className="flex-1 bg-zinc-900 text-zinc-400 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:text-white transition-all">Dismiss</button>
                       </div>
                    </div>
                  </div>
                );
              })()}
           </div>
        </div>
      )}
    </Layout>
  );
};

const MessageContent: React.FC<{ m: ChatMessage, isEditing: boolean, editVal: string, setEditVal: (v: string) => void, commitEdit: () => void, formatText: (t: string) => string, isMe: boolean }> = ({ m, isEditing, editVal, setEditVal, commitEdit, formatText, isMe }) => {
  return (
    <div className="relative group">
      {isEditing ? (
        <div className="space-y-2 mt-2">
          <textarea value={editVal} onChange={e => setEditVal(e.target.value)} className="w-full bg-black/40 border-2 border-rojo-600 rounded-2xl text-white outline-none resize-none p-4 text-sm font-medium" autoFocus rows={3} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commitEdit(); } if (e.key === 'Escape') setEditVal(''); }} />
          <p className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest">ENTER to save • ESC to cancel</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div dangerouslySetInnerHTML={{ __html: formatText(m.content) }} className={`text-sm leading-relaxed whitespace-pre-wrap break-words ${isMe ? 'text-zinc-200' : 'text-zinc-400'}`} />
          {m.attachments?.map((url, i) => (
            <div key={i} className="mt-2 rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl max-w-sm group bg-zinc-900">
              {url.startsWith('data:audio') ? (
                <div className="p-4 flex items-center gap-4 bg-zinc-900 border-2 border-zinc-800 rounded-2xl">
                   <audio controls src={url} className="h-8 w-full invert opacity-80" />
                </div>
              ) : url.startsWith('data:video') ? (
                <video controls src={url} className="w-full max-h-64 object-contain" />
              ) : (
                <img src={url} className="w-full h-auto cursor-zoom-in hover:scale-105 transition-transform" alt="" />
              )}
            </div>
          ))}
          {m.is_edited && <span className="text-[7px] text-zinc-700 italic font-black uppercase ml-1">(edited)</span>}
        </div>
      )}
    </div>
  );
};

const ReactionsDisplay: React.FC<{ m: ChatMessage, currentUser: any, onReact: any }> = ({ m, currentUser, onReact }) => {
  if (!m.reactions || Object.keys(m.reactions).length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {Object.entries(m.reactions).map(([emoji, uids]) => (
        <button 
          key={emoji} 
          onClick={() => onReact(m.id, emoji)}
          className={`px-2 py-1 rounded-xl border-2 flex items-center gap-2 transition-all hover:scale-110 active:scale-90 ${uids.includes(currentUser?.id || '') ? 'bg-rojo-600/10 border-rojo-600 text-rojo-500' : 'bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}
        >
          <span className="text-sm">{emoji}</span>
          <span className="text-[10px] font-black">{uids.length}</span>
        </button>
      ))}
    </div>
  );
};

const MenuBtn: React.FC<{ children: React.ReactNode, onClick: () => void, color?: string }> = ({ children, onClick, color }) => (
  <button onClick={onClick} className={`w-full text-left px-3 py-2.5 text-[9px] font-black uppercase tracking-widest hover:bg-rojo-600 hover:text-white rounded-xl transition-all flex items-center ${color || 'text-zinc-400'}`}>
    {children}
  </button>
);

export default ChatPage;
