
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { User, Thread, Post, Report, ModStatus, ReportType, ThemeMode, IpBan, Punishment, ModNote, ChatMessage, Friend, FriendRequest, Block, Notification } from './types';
import { supabase } from './services/supabaseClient';
import { DEFAULT_AVATAR } from './constants';

interface AppState {
  isAuthenticated: boolean;
  currentUser: User | null;
  users: User[];
  threads: Thread[];
  posts: Post[];
  reports: Report[];
  ipBans: IpBan[];
  chatMessages: ChatMessage[];
  allChatPartners: string[]; 
  friends: Friend[];
  friendRequests: FriendRequest[];
  blocks: Block[];
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
  originalAdmin: User | null;
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
  fetchUserIpHistory: (userId: string) => Promise<any[]>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  sendFriendRequest: (userId: string) => Promise<void>;
  acceptFriendRequest: (requestId: string) => Promise<void>;
  declineFriendRequest: (requestId: string) => Promise<void>;
  cancelFriendRequest: (targetUserId: string) => Promise<void>;
  removeFriend: (friendId: string) => Promise<void>;
  blockUser: (userId: string) => Promise<void>;
  unblockUser: (userId: string) => Promise<void>;
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
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const initRef = useRef(false);
  const activeChatUserIdRef = useRef<string | null>(null);

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

      const [threadsRes, usersRes, postsRes, reportsRes, ipBansRes, friendsRes, requestsRes, blocksRes] = await Promise.all([
        supabase.from('threads').select('*, profiles(username, display_name, status, role)').order('is_pinned', { ascending: false }).order('created_at', { ascending: false }),
        supabase.from('profiles').select('*'),
        supabase.from('posts').select('*, profiles(username, display_name, status, role)').order('created_at', { ascending: true }),
        supabase.from('reports').select('*').order('created_at', { ascending: false }),
        supabase.from('ip_bans').select('*'),
        currentUserId ? supabase.from('friends').select('*').or(`user_id.eq.${currentUserId},friend_id.eq.${currentUserId}`) : Promise.resolve({ data: [] }),
        currentUserId ? supabase.from('friend_requests').select('*').or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`) : Promise.resolve({ data: [] }),
        currentUserId ? supabase.from('blocks').select('*').eq('blocker_id', currentUserId) : Promise.resolve({ data: [] }),
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
      if (blocksRes.data) setBlocks(blocksRes.data as Block[]);
      
      if (currentUserId) {
        const { data: messagesRes } = await supabase.from('messages')
          .select('sender_id, receiver_id, created_at')
          .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
          .order('created_at', { ascending: false });
        
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

  useEffect(() => {
    if (!currentUser) return;

    const channel = supabase
      .channel('public_realtime_enhanced')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload) => {
        const { eventType, new: newMsg, old: oldMsg } = payload;
        
        if (eventType === 'INSERT') {
          const isRelevant = newMsg.sender_id === currentUser.id || newMsg.receiver_id === currentUser.id;
          const isFromCurrentTarget = newMsg.sender_id === activeChatUserIdRef.current || newMsg.receiver_id === activeChatUserIdRef.current;
          
          if (isRelevant) {
            // Update Partner List Order
            const partnerId = newMsg.sender_id === currentUser.id ? newMsg.receiver_id : newMsg.sender_id;
            setAllChatPartners(prev => [partnerId, ...prev.filter(id => id !== partnerId)]);

            // Add to messages if current conversation
            if (isFromCurrentTarget) {
              setChatMessages(prev => {
                if (prev.find(m => m.id === newMsg.id)) return prev;
                return [...prev, newMsg as ChatMessage].sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
              });
            } else if (newMsg.sender_id !== currentUser.id) {
              // Notification for background messages
              const isBlocked = blocks.some(b => b.blocked_id === newMsg.sender_id);
              if (!isBlocked) {
                const sender = users.find(u => u.id === newMsg.sender_id);
                setNotifications(n => [{
                  id: Math.random().toString(),
                  type: 'message',
                  title: 'New Message',
                  content: newMsg.content,
                  link: `/messages?user=${newMsg.sender_id}`,
                  senderAvatar: sender?.avatarUrl || DEFAULT_AVATAR,
                  senderName: sender?.displayName || 'Someone',
                  isRead: false,
                  created_at: new Date().toISOString()
                }, ...n.filter(x => x.link !== `/messages?user=${newMsg.sender_id}`)]);
              }
            }
          }
        }
        
        if (eventType === 'UPDATE') {
          setChatMessages(prev => prev.map(m => m.id === newMsg.id ? { ...m, ...newMsg } : m));
        }
        
        if (eventType === 'DELETE') {
          setChatMessages(prev => prev.filter(m => m.id !== oldMsg.id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friend_requests' }, () => syncDatabase())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friends' }, () => syncDatabase())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'blocks' }, () => syncDatabase())
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, [currentUser, users, blocks]);

  const fetchChatHistory = async (otherUserId: string) => {
    if (!currentUser) return;
    activeChatUserIdRef.current = otherUserId;
    const { data } = await supabase.from('messages')
      .select('*')
      .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUser.id})`)
      .order('created_at', { ascending: true });
    if (data) setChatMessages(data as ChatMessage[]);
  };

  const login = async (email: string, pass: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) throw error;
    if (data.user) { 
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).maybeSingle();
      if (profile) setCurrentUser(mapUser(profile));
      await syncDatabase(); 
    }
  };

  const signup = async (username: string, email: string, pass: string) => {
    await supabase.auth.signUp({ email, password: pass, options: { data: { username } } });
  };

  const logout = async () => { await supabase.auth.signOut(); setCurrentUser(null); setOriginalAdmin(null); };

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
        if (profile) setCurrentUser(mapUser(profile));
        await syncDatabase();
      }
      setLoading(false);
    };
    init();
  }, []);

  // Relationship Logic
  const sendFriendRequest = async (userId: string) => {
    if (!currentUser) return;
    const { error } = await supabase.from('friend_requests').insert({ sender_id: currentUser.id, receiver_id: userId, status: 'pending' });
    if (error) {
      if (error.code === '23505') alert("Request already sent!");
      else throw error;
    }
    await syncDatabase();
  };

  const acceptFriendRequest = async (requestId: string) => {
    const req = friendRequests.find(r => r.id === requestId);
    if (!req || !currentUser) return;
    await supabase.from('friend_requests').update({ status: 'accepted' }).eq('id', requestId);
    await supabase.from('friends').insert({ user_id: req.sender_id, friend_id: req.receiver_id });
    await syncDatabase();
  };

  const declineFriendRequest = async (requestId: string) => {
    await supabase.from('friend_requests').delete().eq('id', requestId);
    await syncDatabase();
  };

  const cancelFriendRequest = async (targetUserId: string) => {
    if (!currentUser) return;
    await supabase.from('friend_requests').delete().eq('sender_id', currentUser.id).eq('receiver_id', targetUserId);
    await syncDatabase();
  };

  const removeFriend = async (friendId: string) => {
    if (!currentUser) return;
    await supabase.from('friends').delete().or(`and(user_id.eq.${currentUser.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${currentUser.id})`);
    await syncDatabase();
  };

  const blockUser = async (userId: string) => {
    if (!currentUser) return;
    await removeFriend(userId);
    await cancelFriendRequest(userId);
    await supabase.from('blocks').insert({ blocker_id: currentUser.id, blocked_id: userId });
    await syncDatabase();
  };

  const unblockUser = async (userId: string) => {
    if (!currentUser) return;
    await supabase.from('blocks').delete().eq('blocker_id', currentUser.id).eq('blocked_id', userId);
    await syncDatabase();
  };

  // Messaging Logic
  const sendChatMessage = async (receiverId: string, content: string, attachments: string[] = []) => {
    if (!currentUser) return;
    const isBlocked = blocks.some(b => b.blocked_id === receiverId);
    if (isBlocked) {
      alert("You have blocked this user.");
      return;
    }
    await supabase.from('messages').insert({ sender_id: currentUser.id, receiver_id: receiverId, content, attachments });
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

  const deleteChatMessage = async (id: string) => { await supabase.from('messages').delete().eq('id', id); };
  const editChatMessage = async (id: string, content: string) => { await supabase.from('messages').update({ content, is_edited: true, updated_at: new Date().toISOString() }).eq('id', id); };

  const clearNotification = (id: string) => setNotifications(prev => prev.filter(n => n.id !== id));

  // Placeholder functions
  const loginAs = (id: string) => { const u = users.find(x => x.id === id); if(u) setCurrentUser(u); };
  const revertToAdmin = () => { if(originalAdmin) setCurrentUser(originalAdmin); };
  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  const updateUser = async (d: any) => { if(currentUser) await supabase.from('profiles').update(d).eq('id', currentUser.id); await syncDatabase(); };
  const updateTargetUser = async (id: string, d: any) => { await supabase.from('profiles').update(d).eq('id', id); await syncDatabase(); };
  const banUser = async (id: string, r: string, dur: string) => { await supabase.from('profiles').update({ status: 'Banned', ban_reason: r }).eq('id', id); await syncDatabase(); };
  const unbanUser = async (id: string) => { await supabase.from('profiles').update({ status: 'Active' }).eq('id', id); await syncDatabase(); };
  const warnUser = async (id: string) => { await supabase.from('profiles').update({ status: 'Warned' }).eq('id', id); await syncDatabase(); };
  const updateUserNotes = async (id: string, n: string) => { await syncDatabase(); };
  const toggleProtectedStatus = async (id: string) => { await syncDatabase(); };
  const unbanIp = async (ip: string) => { await syncDatabase(); };
  const addManualIpBan = async (ip: string) => { await syncDatabase(); };
  const addThread = async (t: string, c: string) => { if(currentUser) await supabase.from('threads').insert({ title: t, content: c, author_id: currentUser.id }); await syncDatabase(); };
  const addPost = async (tid: string, c: string) => { if(currentUser) await supabase.from('posts').insert({ thread_id: tid, content: c, author_id: currentUser.id }); await syncDatabase(); };
  const updatePost = async (id: string, c: string) => { await supabase.from('posts').update({ content: c }).eq('id', id); await syncDatabase(); };
  const deletePost = async (id: string) => { await supabase.from('posts').delete().eq('id', id); await syncDatabase(); };
  const deleteThread = async (id: string) => { await supabase.from('threads').delete().eq('id', id); await syncDatabase(); };
  const likePost = async (id: string) => { await syncDatabase(); };
  const likeThread = async (id: string) => { await syncDatabase(); };
  const toggleThreadPin = async (id: string) => { await syncDatabase(); };
  const toggleThreadLock = async (id: string) => { await syncDatabase(); };
  const incrementThreadView = async (id: string) => { await syncDatabase(); };
  const resolveReport = async (id: string) => { await syncDatabase(); };
  const addReport = async () => { await syncDatabase(); };
  const fetchUserIpHistory = async () => [];
  const resetPassword = async (e: string) => { await supabase.auth.resetPasswordForEmail(e); };
  const updatePassword = async (p: string) => { await supabase.auth.updateUser({ password: p }); };

  return (
    <AppStateContext.Provider value={{
      isAuthenticated, login, signup, logout, loginAs, revertToAdmin, originalAdmin, currentUser, users, threads, posts, reports, chatMessages, allChatPartners, friends, friendRequests, blocks, notifications, theme, loading,
      toggleTheme, updateUser, updateTargetUser, banUser, unbanUser, warnUser, updateUserNotes, toggleProtectedStatus, unbanIp, addManualIpBan, addThread, incrementThreadView, toggleThreadPin, toggleThreadLock, deleteThread, addPost, updatePost, deletePost, likePost, likeThread,
      resolveReport, addReport, sendChatMessage, deleteChatMessage, editChatMessage, reactToChatMessage, fetchChatHistory, fetchUserIpHistory, resetPassword, updatePassword, ipBans, clientIp, isIpBanned, showBannedContent, setShowBannedContent,
      sendFriendRequest, acceptFriendRequest, declineFriendRequest, cancelFriendRequest, removeFriend, blockUser, unblockUser, clearNotification
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
