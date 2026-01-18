
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { User, Thread, Post, Report, ModStatus, ReportType, ThemeMode, IpBan, Punishment, ModNote, ChatMessage, Friend, FriendRequest, Notification } from './types';
import { supabase } from './services/supabaseClient';
import { DEFAULT_AVATAR } from './constants';

interface UserIpLog {
  ip: string;
  created_at: string;
  user_agent: string;
}

interface AppState {
  isAuthenticated: boolean;
  currentUser: User | null;
  originalAdmin: User | null;
  users: User[];
  threads: Thread[];
  posts: Post[];
  reports: Report[];
  ipBans: IpBan[];
  chatMessages: ChatMessage[];
  allChatPartners: string[]; // Sorted by recent
  friends: Friend[];
  friendRequests: FriendRequest[];
  notifications: Notification[];
  theme: ThemeMode;
  loading: boolean;
  clientIp: string | null;
  isIpBanned: boolean;
  showBannedContent: boolean;
  setShowBannedContent: (val: boolean) => void;
  login: (email: string, pass: string) => Promise<void>;
  signup: (username: string, email: string, pass: string) => Promise<void>;
  logout: () => void;
  loginAs: (userId: string) => void;
  revertToAdmin: () => void;
  toggleTheme: () => void;
  updateUser: (data: Partial<User>) => Promise<void>;
  updateTargetUser: (userId: string, data: Partial<User>) => Promise<void>; 
  banUser: (userId: string, reason: string, duration: string, ipBan?: boolean, resetUsername?: boolean) => Promise<void>;
  unbanUser: (userId: string) => Promise<void>;
  warnUser: (userId: string, reason: string) => Promise<void>;
  updateUserNotes: (userId: string, content: string) => Promise<void>;
  toggleProtectedStatus: (userId: string) => Promise<void>;
  unbanIp: (ip: string) => Promise<void>;
  addManualIpBan: (ip: string, reason: string) => Promise<void>;
  addThread: (title: string, content: string, categoryId: string) => Promise<void>;
  incrementThreadView: (threadId: string) => Promise<void>;
  toggleThreadPin: (threadId: string) => Promise<void>;
  toggleThreadLock: (threadId: string) => Promise<void>;
  deleteThread: (threadId: string) => Promise<void>;
  addPost: (threadId: string, content: string) => Promise<void>;
  updatePost: (postId: string, content: string) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  likePost: (postId: string) => Promise<void>;
  likeThread: (threadId: string) => Promise<void>;
  resolveReport: (reportId: string, status: ModStatus) => Promise<void>;
  addReport: (type: ReportType, targetId: string, reason: string, contentSnippet: string, authorUsername: string, targetUrl: string) => Promise<void>;
  sendChatMessage: (receiverId: string, content: string, attachments?: string[]) => Promise<void>;
  deleteChatMessage: (messageId: string) => Promise<void>;
  editChatMessage: (messageId: string, newContent: string) => Promise<void>;
  reactToChatMessage: (messageId: string, emoji: string) => Promise<void>;
  fetchChatHistory: (otherUserId: string) => Promise<void>;
  fetchUserIpHistory: (userId: string) => Promise<UserIpLog[]>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  sendFriendRequest: (userId: string) => Promise<void>;
  acceptFriendRequest: (requestId: string) => Promise<void>;
  declineFriendRequest: (requestId: string) => Promise<void>;
  removeFriend: (friendshipId: string) => Promise<void>;
  clearNotification: (notifId: string) => void;
}

const AppStateContext = createContext<AppState | undefined>(undefined);

export const censorText = (text: string) => {
  return text.split('').map(char => (char === ' ' || char === '\n' ? char : '█')).join('');
};

export const AppStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [originalAdmin, setOriginalAdmin] = useState<User | null>(null);
  const [clientIp, setClientIp] = useState<string | null>(null);
  const [isIpBanned, setIsIpBanned] = useState(false);
  const [showBannedContent, setShowBannedContent] = useState(false);
  
  const [users, setUsers] = useState<User[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [ipBans, setIpBans] = useState<IpBan[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [allChatPartners, setAllChatPartners] = useState<string[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const initRef = useRef(false);
  const isAuthenticated = !!currentUser;

  const mapUser = (data: any): User => ({
    id: data.id,
    username: data.username || 'Member',
    displayName: data.display_name || data.username || 'User',
    email: data.email || '',
    avatarUrl: data.avatar_url && data.avatar_url.trim() !== '' ? data.avatar_url : DEFAULT_AVATAR,
    bannerUrl: data.banner_url || '',
    role: data.role || 'User',
    status: (data.status as any) || 'Active',
    joinDate: data.created_at || new Date().toISOString(),
    postCount: data.post_count || 0,
    about: data.about || '',
    themePreference: (data.theme_preference as ThemeMode) || 'dark',
    banReason: data.ban_reason || '',
    banExpires: data.ban_expires || '',
    lastIp: data.last_ip || null,
    isProtected: data.is_protected || false,
    mod_notes: Array.isArray(data.mod_notes) ? data.mod_notes : [],
    punishments: Array.isArray(data.punishments) ? data.punishments : []
  });

  const syncDatabase = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUserId = session?.user?.id;

      const [threadsRes, usersRes, postsRes, reportsRes, ipBansRes, friendsRes, requestsRes] = await Promise.all([
        supabase.from('threads').select('*, profiles(username, display_name, status, role)').order('is_pinned', { ascending: false }).order('created_at', { ascending: false }),
        supabase.from('profiles').select('*'),
        supabase.from('posts').select('*, profiles(username, display_name, status, role)').order('created_at', { ascending: true }),
        supabase.from('reports').select('*').order('created_at', { ascending: false }),
        supabase.from('ip_bans').select('*'),
        currentUserId ? supabase.from('friends').select('*').or(`user_id.eq.${currentUserId},friend_id.eq.${currentUserId}`) : Promise.resolve({ data: [] }),
        currentUserId ? supabase.from('friend_requests').select('*').or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`) : Promise.resolve({ data: [] }),
      ]);

      if (threadsRes.data) {
        setThreads(threadsRes.data.map((x: any) => ({
          id: x.id, categoryId: x.category_id, authorId: x.author_id, authorName: x.profiles?.username || 'Unknown',
          title: x.title, content: x.content, createdAt: x.created_at, replyCount: x.reply_count || 0,
          viewCount: x.view_count || 0, likes: x.likes || 0, likedBy: x.liked_by || [],
          isLocked: x.is_locked || false, isPinned: x.is_pinned || false
        })));
      }
      if (usersRes.data) setUsers(usersRes.data.map(mapUser));
      if (postsRes.data) setPosts(postsRes.data.map((x: any) => ({
          id: x.id, threadId: x.thread_id, authorId: x.author_id, authorName: x.profiles?.username || 'Unknown',
          content: x.content, createdAt: x.created_at, likes: x.likes || 0, likedBy: x.liked_by || []
      })));
      if (reportsRes.data) setReports(reportsRes.data.map((x: any) => ({
          id: x.id, type: x.type as ReportType, targetId: x.target_id, reportedBy: x.reported_by,
          authorUsername: x.author_username, target_url: x.target_url,
          reason: x.reason, content_snippet: x.content_snippet, status: x.status as ModStatus, createdAt: x.created_at
      })));
      if (ipBansRes.data) setIpBans(ipBansRes.data);
      if (friendsRes.data) setFriends(friendsRes.data as Friend[]);
      if (requestsRes.data) setFriendRequests(requestsRes.data as FriendRequest[]);
      
      if (currentUserId) {
        const { data: messagesRes } = await supabase.from('messages').select('sender_id, receiver_id, created_at').or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`).order('created_at', { ascending: false });
        if (messagesRes) {
          const partners = new Map<string, string>();
          messagesRes.forEach((m: any) => {
            const pid = m.sender_id === currentUserId ? m.receiver_id : m.sender_id;
            if (!partners.has(pid)) partners.set(pid, m.created_at);
          });
          setAllChatPartners(Array.from(partners.keys()));
        }
      }
    } catch (e) { console.warn("Sync error", e); }
  };

  // REALTIME SUBSCRIPTION
  useEffect(() => {
    if (!currentUser) return;

    const channel = supabase
      .channel('chat_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload) => {
        const { eventType, new: newMsg, old: oldMsg } = payload;
        
        setChatMessages(prev => {
          if (eventType === 'INSERT') {
            const isRelevant = newMsg.sender_id === currentUser.id || newMsg.receiver_id === currentUser.id;
            if (!isRelevant) return prev;
            
            // Notification logic
            if (newMsg.sender_id !== currentUser.id) {
              const sender = users.find(u => u.id === newMsg.sender_id);
              const newNotif: Notification = {
                id: Math.random().toString(),
                type: 'message',
                title: 'New Message',
                content: newMsg.content.substring(0, 50),
                link: `/messages?user=${newMsg.sender_id}`,
                senderAvatar: sender?.avatarUrl || DEFAULT_AVATAR,
                senderName: sender?.displayName || 'Someone',
                isRead: false,
                created_at: new Date().toISOString()
              };
              setNotifications(n => [newNotif, ...n]);
            }

            if (prev.find(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg as ChatMessage].sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
          }
          if (eventType === 'UPDATE') {
            return prev.map(m => m.id === newMsg.id ? { ...m, ...newMsg } : m);
          }
          if (eventType === 'DELETE') {
            return prev.filter(m => m.id === oldMsg.id);
          }
          return prev;
        });

        // Inbox Sorting logic
        if (eventType === 'INSERT') {
          const partnerId = newMsg.sender_id === currentUser.id ? newMsg.receiver_id : newMsg.sender_id;
          setAllChatPartners(p => {
            const others = p.filter(id => id !== partnerId);
            return [partnerId, ...others];
          });
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friend_requests' }, (payload) => {
          syncDatabase();
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') console.log('Realtime connected');
      });

    return () => { channel.unsubscribe(); };
  }, [currentUser, users]);

  const loadProfile = async (id: string, detectedIp: string | null) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
    if (data) {
      const u = mapUser(data);
      setCurrentUser(u);
      if (detectedIp && u.role !== 'Admin') {
        if (data.last_ip !== detectedIp) await supabase.from('profiles').update({ last_ip: detectedIp }).eq('id', id);
        await supabase.from('user_ips').insert({ user_id: id, ip: detectedIp, user_agent: navigator.userAgent, path: window.location.pathname });
      }
    }
  };

  const logout = async () => { await supabase.auth.signOut(); setCurrentUser(null); setOriginalAdmin(null); };

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    const init = async () => {
      let detectedIp = null;
      try {
        const res = await fetch('https://api.ipify.org?format=json');
        const json = await res.json();
        detectedIp = json.ip;
        setClientIp(detectedIp);
      } catch (e) { console.warn("IP Detection Failed", e); }
      if (detectedIp) {
        const { data } = await supabase.from('ip_bans').select('id').eq('ip_address', detectedIp).maybeSingle();
        setIsIpBanned(!!data);
      }
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await loadProfile(session.user.id, detectedIp);
        await syncDatabase();
      }
      setLoading(false);
    };
    init();
  }, []);

  const login = async (email: string, pass: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) throw error;
    if (data.user) { await loadProfile(data.user.id, clientIp); await syncDatabase(); }
  };

  const signup = async (username: string, email: string, pass: string) => {
    await supabase.auth.signUp({ email, password: pass, options: { data: { username } } });
  };

  const loginAs = (userId: string) => {
    const target = users.find(u => u.id === userId);
    if (target && currentUser) {
      if (!originalAdmin) setOriginalAdmin(currentUser);
      setCurrentUser(target);
    }
  };

  const revertToAdmin = () => { if (originalAdmin) { setCurrentUser(originalAdmin); setOriginalAdmin(null); } };
  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const updateUser = async (data: Partial<User>) => {
    if (!currentUser) return;
    const { error } = await supabase.from('profiles').update(data).eq('id', currentUser.id);
    if (error) throw error;
    await loadProfile(currentUser.id, clientIp);
    await syncDatabase();
  };

  const updateTargetUser = async (userId: string, data: Partial<User>) => {
    const { error } = await supabase.from('profiles').update(data).eq('id', userId);
    if (error) alert("Update failed: " + error.message);
    await syncDatabase();
  };

  const banUser = async (userId: string, reason: string, duration: string, doIpBan?: boolean, resetUsername?: boolean) => {
    const expires = duration === 'Permanent' ? 'Never' : new Date(Date.now() + parseInt(duration) * 86400000).toISOString();
    const updatePayload: any = { status: 'Banned', ban_reason: reason, ban_expires: expires };
    await supabase.from('profiles').update(updatePayload).eq('id', userId);
    await syncDatabase();
  };

  const unbanUser = async (userId: string) => {
    await supabase.from('profiles').update({ status: 'Active', ban_reason: null, ban_expires: null }).eq('id', userId);
    await syncDatabase();
  };

  const warnUser = async (userId: string, reason: string) => {
    await supabase.from('profiles').update({ status: 'Warned' }).eq('id', userId);
    await syncDatabase();
  };

  const updateUserNotes = async (userId: string, content: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    const newNote: ModNote = { id: Math.random().toString(), moderator: currentUser?.username || 'System', content, created_at: new Date().toISOString() };
    const updatedNotes = [newNote, ...(user.mod_notes || [])];
    await supabase.from('profiles').update({ mod_notes: updatedNotes }).eq('id', userId);
    await syncDatabase();
  };

  const toggleProtectedStatus = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    await supabase.from('profiles').update({ is_protected: !user.isProtected }).eq('id', userId);
    await syncDatabase();
  };

  const unbanIp = async (ip: string) => { await supabase.from('ip_bans').delete().eq('ip_address', ip); setIsIpBanned(false); await syncDatabase(); };
  const addManualIpBan = async (ip: string, reason: string) => { await supabase.from('ip_bans').insert({ ip_address: ip, reason, banned_by: currentUser?.id }); if (ip === clientIp) setIsIpBanned(true); await syncDatabase(); };

  const fetchUserIpHistory = async (userId: string): Promise<UserIpLog[]> => {
    const { data } = await supabase.from('user_ips').select('ip, created_at, user_agent').eq('user_id', userId).order('created_at', { ascending: false });
    return (data || []) as UserIpLog[];
  };

  const addThread = async (title: string, content: string, categoryId: string) => { if (!currentUser) return; await supabase.from('threads').insert({ author_id: currentUser.id, title, content, category_id: categoryId }); await syncDatabase(); };
  const addPost = async (threadId: string, content: string) => { if (!currentUser) return; await supabase.from('posts').insert({ thread_id: threadId, author_id: currentUser.id, content }); await syncDatabase(); };
  const updatePost = async (postId: string, content: string) => { await supabase.from('posts').update({ content }).eq('id', postId); await syncDatabase(); };
  const deleteThread = async (id: string) => { await supabase.from('threads').delete().eq('id', id); await syncDatabase(); };
  const deletePost = async (id: string) => { await supabase.from('posts').delete().eq('id', id); await syncDatabase(); };
  const likePost = async (id: string) => {
    const p = posts.find(x => x.id === id); if (!p || !currentUser) return;
    const newLikedBy = p.likedBy.includes(currentUser.id) ? p.likedBy.filter(u => u !== currentUser.id) : [...p.likedBy, currentUser.id];
    await supabase.from('posts').update({ liked_by: newLikedBy, likes: newLikedBy.length }).eq('id', id); await syncDatabase();
  };
  const likeThread = async (id: string) => {
    const t = threads.find(x => x.id === id); if (!t || !currentUser) return;
    const newLikedBy = t.likedBy.includes(currentUser.id) ? t.likedBy.filter(u => u !== currentUser.id) : [...t.likedBy, currentUser.id];
    await supabase.from('threads').update({ liked_by: newLikedBy, likes: newLikedBy.length }).eq('id', id); await syncDatabase();
  };
  const toggleThreadPin = async (id: string) => { const t = threads.find(x => x.id === id); await supabase.from('threads').update({ is_pinned: !t?.isPinned }).eq('id', id); await syncDatabase(); };
  const toggleThreadLock = async (id: string) => { const t = threads.find(x => x.id === id); await supabase.from('threads').update({ is_locked: !t?.isLocked }).eq('id', id); await syncDatabase(); };
  const incrementThreadView = async (id: string) => { await supabase.rpc('increment_thread_view', { t_id: id }); };
  const resolveReport = async (reportId: string, status: ModStatus) => { await supabase.from('reports').update({ status }).eq('id', reportId); await syncDatabase(); };
  const addReport = async (type: ReportType, targetId: string, reason: string, contentSnippet: string, authorUsername: string, targetUrl: string) => { await supabase.from('reports').insert({ type, target_id: targetId, reported_by: currentUser?.username || 'Guest', author_username: authorUsername, target_url: targetUrl, reason, content_snippet: contentSnippet, status: ModStatus.PENDING }); await syncDatabase(); };

  // Chat logic
  const fetchChatHistory = async (otherUserId: string) => {
    if (!currentUser) return;
    const { data } = await supabase.from('messages').select('*').or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUser.id})`).order('created_at', { ascending: true });
    if (data) setChatMessages(data as ChatMessage[]);
  };

  const sendChatMessage = async (receiverId: string, content: string, attachments: string[] = []) => {
    if (!currentUser) return;
    await supabase.from('messages').insert({ sender_id: currentUser.id, receiver_id: receiverId, content, attachments });
  };

  const deleteChatMessage = async (messageId: string) => {
    const msg = chatMessages.find(m => m.id === messageId);
    if (!msg || msg.sender_id !== currentUser?.id) return;
    await supabase.from('messages').delete().eq('id', messageId);
  };

  const editChatMessage = async (messageId: string, newContent: string) => {
    const msg = chatMessages.find(m => m.id === messageId);
    if (!msg || msg.sender_id !== currentUser?.id) return;
    await supabase.from('messages').update({ content: newContent, is_edited: true, updated_at: new Date().toISOString() }).eq('id', messageId);
  };

  const reactToChatMessage = async (messageId: string, emoji: string) => {
    const msg = chatMessages.find(m => m.id === messageId);
    if (!msg || !currentUser) return;
    const reactions = { ...msg.reactions };
    if (!reactions[emoji]) reactions[emoji] = [];
    if (reactions[emoji].includes(currentUser.id)) {
      reactions[emoji] = reactions[emoji].filter(id => id !== currentUser.id);
      if (reactions[emoji].length === 0) delete reactions[emoji];
    } else {
      reactions[emoji].push(currentUser.id);
    }
    await supabase.from('messages').update({ reactions }).eq('id', messageId);
  };

  const sendFriendRequest = async (userId: string) => {
    if (!currentUser) return;
    await supabase.from('friend_requests').insert({ sender_id: currentUser.id, receiver_id: userId });
  };

  const acceptFriendRequest = async (requestId: string) => {
    const req = friendRequests.find(r => r.id === requestId);
    if (!req || !currentUser) return;
    await supabase.from('friend_requests').update({ status: 'accepted' }).eq('id', requestId);
    await supabase.from('friends').insert({ user_id: req.sender_id, friend_id: req.receiver_id });
    await syncDatabase();
  };

  const declineFriendRequest = async (requestId: string) => {
    await supabase.from('friend_requests').update({ status: 'declined' }).eq('id', requestId);
    await syncDatabase();
  };

  const removeFriend = async (friendshipId: string) => {
    await supabase.from('friends').delete().eq('id', friendshipId);
    await syncDatabase();
  };

  const clearNotification = (notifId: string) => {
    setNotifications(n => n.filter(x => x.id !== notifId));
  };

  const resetPassword = async (email: string) => { await supabase.auth.resetPasswordForEmail(email); };
  const updatePassword = async (newPassword: string) => { await supabase.auth.updateUser({ password: newPassword }); };

  return (
    <AppStateContext.Provider value={{
      isAuthenticated, login, signup, logout, loginAs, revertToAdmin, originalAdmin, currentUser, users, threads, posts, reports, chatMessages, allChatPartners, friends, friendRequests, notifications, theme, loading,
      toggleTheme, updateUser, updateTargetUser, banUser, unbanUser, warnUser, updateUserNotes, toggleProtectedStatus, unbanIp, addManualIpBan, addThread, incrementThreadView, toggleThreadPin, toggleThreadLock, deleteThread, addPost, updatePost, deletePost, likePost, likeThread,
      resolveReport, addReport, sendChatMessage, deleteChatMessage, editChatMessage, reactToChatMessage, fetchChatHistory, fetchUserIpHistory, resetPassword, updatePassword, ipBans, clientIp, isIpBanned, showBannedContent, setShowBannedContent,
      sendFriendRequest, acceptFriendRequest, declineFriendRequest, removeFriend, clearNotification
    }}>
      {children}
    </AppStateContext.Provider>
  );
};

export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (!context) throw new Error('useAppState must be used within AppStateProvider');
  return context;
};
