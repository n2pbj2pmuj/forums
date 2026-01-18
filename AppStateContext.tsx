
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { User, Thread, Post, Report, ModStatus, ReportType, ThemeMode, PresenceStatus, IpBan, ChatMessage, Friend, FriendRequest, Block, Notification } from './types';
import { supabase } from './services/supabaseClient';
import { DEFAULT_AVATAR } from './constants';

export const censorText = (text: string): string => {
  if (!text) return '';
  const badWords = ['badword', 'offensive'];
  let censored = text;
  badWords.forEach(word => {
    const reg = new RegExp(word, 'gi');
    censored = censored.replace(reg, '****');
  });
  return censored;
};

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
  login: (email: string, pass: string) => Promise<void>;
  signup: (username: string, email: string, pass: string) => Promise<void>;
  logout: () => void;
  toggleTheme: () => void;
  updateUser: (data: Partial<User>) => Promise<void>;
  sendFriendRequest: (userId: string) => Promise<void>;
  acceptFriendRequest: (requestId: string) => Promise<void>;
  declineFriendRequest: (requestId: string) => Promise<void>;
  cancelFriendRequest: (targetUserId: string) => Promise<void>;
  removeFriend: (friendId: string) => Promise<void>;
  blockUser: (userId: string) => Promise<void>;
  unblockUser: (userId: string) => Promise<void>;
  sendChatMessage: (receiverId: string, content: string, attachments?: string[]) => Promise<void>;
  reactToChatMessage: (messageId: string, emoji: string) => Promise<void>;
  fetchChatHistory: (otherUserId: string) => Promise<void>;
  addThread: (title: string, content: string, categoryId: string) => Promise<void>;
  addPost: (threadId: string, content: string) => Promise<void>;
  updatePost: (postId: string, content: string) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  deleteThread: (threadId: string) => Promise<void>;
  likePost: (postId: string) => Promise<void>;
  likeThread: (threadId: string) => Promise<void>;
  setShowBannedContent: (val: boolean) => void;
  showBannedContent: boolean;
  isIpBanned: boolean;
  clearNotification: (notifId: string) => void;
  banUser: (userId: string, reason: string, duration: string, doIpBan: boolean, resetName: boolean) => Promise<void>;
  warnUser: (userId: string, reason: string) => Promise<void>;
  unbanUser: (userId: string) => Promise<void>;
  updateUserNotes: (userId: string, content: string) => Promise<void>;
  toggleProtectedStatus: (userId: string) => Promise<void>;
  updateTargetUser: (userId: string, data: Partial<User>) => Promise<void>;
  loginAs: (userId: string) => Promise<void>;
  fetchUserIpHistory: (userId: string) => Promise<any[]>;
  unbanIp: (ip: string) => Promise<void>;
  addManualIpBan: (ip: string, reason: string) => Promise<void>;
  clientIp: string;
  addReport: (type: ReportType, targetId: string, reason: string) => Promise<void>;
  toggleThreadPin: (id: string) => Promise<void>;
  toggleThreadLock: (id: string) => Promise<void>;
  incrementThreadView: (id: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (pass: string) => Promise<void>;
}

const AppStateContext = createContext<AppState | undefined>(undefined);

export const AppStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
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
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [loading, setLoading] = useState(true);
  const [showBannedContent, setShowBannedContent] = useState(false);
  const [isIpBanned, setIsIpBanned] = useState(false);
  const [clientIp] = useState('127.0.0.1');

  const activeChatUserIdRef = useRef<string | null>(null);

  const mapUser = (data: any): User => ({
    id: data.id,
    username: data.username || 'Member',
    displayName: data.display_name || data.username || 'User',
    email: data.email || '',
    avatarUrl: data.avatar_url || DEFAULT_AVATAR,
    role: data.role || 'User',
    status: data.status || 'Active',
    presenceStatus: data.presence_status || 'Online',
    joinDate: data.created_at || new Date().toISOString(),
    postCount: data.post_count || 0,
    themePreference: data.theme_preference || 'dark',
    banReason: data.ban_reason,
    banExpires: data.ban_expires,
    isProtected: data.is_protected || false,
    lastIp: data.last_ip
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
      if (reportsRes.data) setReports(reportsRes.data);
      if (ipBansRes.data) setIpBans(ipBansRes.data);
      if (friendsRes.data) setFriends(friendsRes.data);
      if (requestsRes.data) setFriendRequests(requestsRes.data);
      if (blocksRes.data) setBlocks(blocksRes.data);
      
      if (currentUserId) {
        const { data: messagesRes } = await supabase.from('messages')
          .select('sender_id, receiver_id, created_at')
          .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
          .order('created_at', { ascending: false });
        
        if (messagesRes) {
          const partners = new Set<string>();
          messagesRes.forEach((m: any) => {
            partners.add(m.sender_id === currentUserId ? m.receiver_id : m.sender_id);
          });
          setAllChatPartners(Array.from(partners));
        }
      }
    } catch (e) { console.warn("Sync error", e); }
  };

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
        if (profile) setCurrentUser(mapUser(profile));
      }
      await syncDatabase();
      setLoading(false);
    };
    init();

    const channel = supabase.channel('global-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => syncDatabase())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friend_requests' }, () => syncDatabase())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friends' }, () => syncDatabase())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'blocks' }, () => syncDatabase())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => syncDatabase())
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, []);

  const login = async (email: string, pass: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) throw error;
    if (data.user) {
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
      setCurrentUser(mapUser(profile));
      await syncDatabase();
    }
  };

  const signup = async (username: string, email: string, pass: string) => {
    const { error } = await supabase.auth.signUp({ email, password: pass, options: { data: { username } } });
    if (error) throw error;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
  };

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const updateUser = async (data: Partial<User>) => {
    if (!currentUser) return;
    const dbData: any = {};
    if (data.displayName) dbData.display_name = data.displayName;
    if (data.avatarUrl) dbData.avatar_url = data.avatarUrl;
    if (data.presenceStatus) dbData.presence_status = data.presenceStatus;
    if (data.about !== undefined) dbData.about = data.about;

    await supabase.from('profiles').update(dbData).eq('id', currentUser.id);
    await syncDatabase();
  };

  const sendFriendRequest = async (userId: string) => {
    if (!currentUser) return;
    const { error } = await supabase.from('friend_requests').insert({ sender_id: currentUser.id, receiver_id: userId, status: 'pending' });
    if (error && error.code === '23505') alert("Request already sent!");
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

  const sendChatMessage = async (receiverId: string, content: string, attachments: string[] = []) => {
    if (!currentUser) return;
    await supabase.from('messages').insert({ sender_id: currentUser.id, receiver_id: receiverId, content, attachments });
    await syncDatabase();
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
    await syncDatabase();
  };

  const fetchChatHistory = async (otherUserId: string) => {
    if (!currentUser) return;
    activeChatUserIdRef.current = otherUserId;
    const { data } = await supabase.from('messages')
      .select('*')
      .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUser.id})`)
      .order('created_at', { ascending: true });
    if (data) setChatMessages(data as ChatMessage[]);
  };

  const addThread = async (title: string, content: string, categoryId: string) => {
    if (!currentUser) return;
    await supabase.from('threads').insert({ title, content, category_id: categoryId, author_id: currentUser.id });
    await syncDatabase();
  };

  const addPost = async (threadId: string, content: string) => {
    if (!currentUser) return;
    await supabase.from('posts').insert({ thread_id: threadId, content, author_id: currentUser.id });
    await syncDatabase();
  };

  const updatePost = async (id: string, content: string) => {
    await supabase.from('posts').update({ content }).eq('id', id);
    await syncDatabase();
  };

  const deletePost = async (id: string) => {
    await supabase.from('posts').delete().eq('id', id);
    await syncDatabase();
  };

  const deleteThread = async (id: string) => {
    await supabase.from('threads').delete().eq('id', id);
    await syncDatabase();
  };

  const likePost = async (id: string) => {
    if (!currentUser) return;
    const post = posts.find(p => p.id === id);
    if (!post) return;
    const isLiked = post.likedBy.includes(currentUser.id);
    const newLikedBy = isLiked ? post.likedBy.filter(uid => uid !== currentUser.id) : [...post.likedBy, currentUser.id];
    await supabase.from('posts').update({ liked_by: newLikedBy, likes: newLikedBy.length }).eq('id', id);
    await syncDatabase();
  };

  const likeThread = async (id: string) => {
    if (!currentUser) return;
    const thread = threads.find(t => t.id === id);
    if (!thread) return;
    const isLiked = thread.likedBy.includes(currentUser.id);
    const newLikedBy = isLiked ? thread.likedBy.filter(uid => uid !== currentUser.id) : [...thread.likedBy, currentUser.id];
    await supabase.from('threads').update({ liked_by: newLikedBy, likes: newLikedBy.length }).eq('id', id);
    await syncDatabase();
  };

  const clearNotification = (id: string) => setNotifications(prev => prev.filter(n => n.id !== id));

  const banUser = async (userId: string, reason: string, duration: string, doIpBan: boolean, resetName: boolean) => {
    let expires = 'Never';
    if (duration !== 'Permanent') {
      const date = new Date();
      date.setDate(date.getDate() + parseInt(duration));
      expires = date.toISOString();
    }
    await supabase.from('profiles').update({ status: 'Banned', ban_reason: reason, ban_expires: expires, display_name: resetName ? 'ModeratedUser' : undefined }).eq('id', userId);
    if (doIpBan) {
      const { data: profile } = await supabase.from('profiles').select('last_ip').eq('id', userId).maybeSingle();
      if (profile?.last_ip) await addManualIpBan(profile.last_ip, `Automatic IP Ban: ${reason}`);
    }
    await syncDatabase();
  };

  const warnUser = async (userId: string, reason: string) => {
    await supabase.from('profiles').update({ status: 'Warned' }).eq('id', userId);
    await syncDatabase();
  };

  const unbanUser = async (userId: string) => {
    await supabase.from('profiles').update({ status: 'Active', ban_reason: null, ban_expires: null }).eq('id', userId);
    await syncDatabase();
  };

  const updateUserNotes = async (userId: string, content: string) => {
    if (!currentUser) return;
    await supabase.from('profiles').update({ notes: content }).eq('id', userId);
    await syncDatabase();
  };

  const toggleProtectedStatus = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    await supabase.from('profiles').update({ is_protected: !user.isProtected }).eq('id', userId);
    await syncDatabase();
  };

  const updateTargetUser = async (userId: string, data: Partial<User>) => {
    const dbData: any = {};
    if (data.displayName) dbData.display_name = data.displayName;
    if (data.role) dbData.role = data.role;
    await supabase.from('profiles').update(dbData).eq('id', userId);
    await syncDatabase();
  };

  const loginAs = async (userId: string) => {
    const target = users.find(u => u.id === userId);
    if (target) setCurrentUser(target);
  };

  const fetchUserIpHistory = async (userId: string) => {
    return [{ ip: '127.0.0.1', created_at: new Date().toISOString(), user_agent: 'Browser Agent' }];
  };

  const unbanIp = async (ip: string) => {
    await supabase.from('ip_bans').delete().eq('ip_address', ip);
    await syncDatabase();
  };

  const addManualIpBan = async (ip: string, reason: string) => {
    await supabase.from('ip_bans').insert({ ip_address: ip, reason });
    await syncDatabase();
  };

  const addReport = async (type: ReportType, targetId: string, reason: string) => {
    if (!currentUser) return;
    await supabase.from('reports').insert({ type, target_id: targetId, reason, reported_by: currentUser.username });
    await syncDatabase();
  };

  const toggleThreadPin = async (id: string) => {
    const thread = threads.find(t => t.id === id);
    if (!thread) return;
    await supabase.from('threads').update({ is_pinned: !thread.isPinned }).eq('id', id);
    await syncDatabase();
  };

  const toggleThreadLock = async (id: string) => {
    const thread = threads.find(t => t.id === id);
    if (!thread) return;
    await supabase.from('threads').update({ is_locked: !thread.isLocked }).eq('id', id);
    await syncDatabase();
  };

  const incrementThreadView = async (id: string) => {
    const thread = threads.find(t => t.id === id);
    if (!thread) return;
    await supabase.from('threads').update({ view_count: (thread.viewCount || 0) + 1 }).eq('id', id);
  };

  const resetPassword = async (email: string) => {
    await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/#/update-password` });
  };

  const updatePassword = async (pass: string) => {
    await supabase.auth.updateUser({ password: pass });
  };

  return (
    <AppStateContext.Provider value={{
      isAuthenticated: !!currentUser, currentUser, users, threads, posts, reports, ipBans, chatMessages, allChatPartners, friends, friendRequests, blocks, notifications, theme, loading,
      login, signup, logout, toggleTheme, updateUser, sendFriendRequest, acceptFriendRequest, declineFriendRequest, cancelFriendRequest, removeFriend, blockUser, unblockUser, sendChatMessage, reactToChatMessage, fetchChatHistory,
      addThread, addPost, updatePost, deletePost, deleteThread, likePost, likeThread, setShowBannedContent, showBannedContent, isIpBanned, clearNotification,
      banUser, warnUser, unbanUser, updateUserNotes, toggleProtectedStatus, updateTargetUser, loginAs, fetchUserIpHistory, unbanIp, addManualIpBan, clientIp, addReport, toggleThreadPin, toggleThreadLock, incrementThreadView, resetPassword, updatePassword
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
