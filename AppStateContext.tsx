import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { User, Thread, Post, Report, ModStatus, ReportType, ThemeMode, IpBan } from './types';
import { supabase } from './services/supabaseClient';
import { DEFAULT_AVATAR } from './constants';

interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
}

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
  allChatPartners: string[];
  theme: ThemeMode;
  loading: boolean;
  clientIp: string | null;
  isIpBanned: boolean;
  login: (email: string, pass: string) => Promise<void>;
  signup: (username: string, email: string, pass: string) => Promise<void>;
  logout: () => void;
  loginAs: (userId: string) => void;
  revertToAdmin: () => void;
  toggleTheme: () => void;
  updateUser: (data: Partial<User>) => Promise<void>;
  updateTargetUser: (userId: string, data: Partial<User>) => Promise<void>; 
  banUser: (userId: string, reason: string, duration: string, ipBan?: boolean) => Promise<void>;
  unbanUser: (userId: string) => Promise<void>;
  unbanIp: (ip: string) => Promise<void>;
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
  sendChatMessage: (receiverId: string, content: string) => Promise<void>;
  fetchChatHistory: (otherUserId: string) => Promise<void>;
  fetchUserIpHistory: (userId: string) => Promise<UserIpLog[]>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
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
  
  const [users, setUsers] = useState<User[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [ipBans, setIpBans] = useState<IpBan[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [allChatPartners, setAllChatPartners] = useState<string[]>([]);

  const initRef = useRef(false);
  const isAuthenticated = !!currentUser;

  const mapUser = (data: any): User => ({
    id: data.id,
    username: data.username || 'Member',
    displayName: data.display_name || data.username || 'User',
    email: data.email || '',
    avatarUrl: data.avatar_url || DEFAULT_AVATAR,
    bannerUrl: data.banner_url || '',
    role: data.role || 'User',
    status: (data.status as any) || 'Active',
    joinDate: data.created_at || new Date().toISOString(),
    postCount: data.post_count || 0,
    about: data.about || '',
    themePreference: (data.theme_preference as ThemeMode) || 'dark',
    banReason: data.ban_reason || '',
    banExpires: data.ban_expires || '',
    lastIp: data.last_ip || null
  });

  const mapToDb = (data: Partial<User>) => {
    const mapping: any = {};
    if (data.username !== undefined) mapping.username = data.username;
    if (data.displayName !== undefined) mapping.display_name = data.displayName;
    if (data.avatarUrl !== undefined) mapping.avatar_url = data.avatarUrl;
    if (data.bannerUrl !== undefined) mapping.banner_url = data.bannerUrl;
    if (data.role !== undefined) mapping.role = data.role;
    if (data.status !== undefined) mapping.status = data.status;
    if (data.about !== undefined) mapping.about = data.about;
    if (data.themePreference !== undefined) mapping.theme_preference = data.themePreference;
    if (data.banReason !== undefined) mapping.ban_reason = data.banReason;
    if (data.banExpires !== undefined) mapping.ban_expires = data.banExpires;
    if (data.lastIp !== undefined) mapping.last_ip = data.lastIp;
    return mapping;
  };

  const syncDatabase = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUserId = session?.user?.id;

      const [threadsRes, usersRes, postsRes, reportsRes, ipBansRes, messagesRes] = await Promise.all([
        supabase.from('threads').select('*, profiles(username, display_name, status, role)').order('is_pinned', { ascending: false }).order('created_at', { ascending: false }),
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('posts').select('*, profiles(username, display_name, status, role)').order('created_at', { ascending: true }),
        supabase.from('reports').select('*').order('created_at', { ascending: false }),
        supabase.from('ip_bans').select('*'),
        currentUserId ? supabase.from('messages').select('sender_id, receiver_id').or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`) : Promise.resolve({ data: [] })
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
          authorUsername: x.author_username, targetUrl: x.target_url,
          reason: x.reason, content_snippet: x.content_snippet, status: x.status as ModStatus, createdAt: x.created_at
      })));
      if (ipBansRes.data) setIpBans(ipBansRes.data);
      
      if (messagesRes.data && currentUserId) {
        const partners = new Set<string>();
        messagesRes.data.forEach((m: any) => {
          if (m.sender_id !== currentUserId) partners.add(m.sender_id);
          if (m.receiver_id !== currentUserId) partners.add(m.receiver_id);
        });
        setAllChatPartners(Array.from(partners));
      }

    } catch (e) { console.warn("Sync error", e); }
  };

  const loadProfile = async (id: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle();
    if (data) {
      const u = mapUser(data);
      setCurrentUser(u);
      if (originalAdmin && originalAdmin.id === u.id) setOriginalAdmin(u);
      
      if (clientIp) {
        if (data.last_ip !== clientIp) {
          await supabase.from('profiles').update({ last_ip: clientIp }).eq('id', id);
        }
        await supabase.from('user_ips').insert({
          user_id: id,
          ip: clientIp,
          user_agent: navigator.userAgent,
          path: window.location.pathname
        });
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
      } catch (e) { console.error("IP Fetch Error:", e); }

      if (detectedIp) {
        const { data: bannedIps } = await supabase.from('ip_bans').select('ip_address');
        const isBlocked = bannedIps?.some(b => b.ip_address === detectedIp);
        setIsIpBanned(!!isBlocked);
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await loadProfile(session.user.id);
        await syncDatabase();
      }
      setLoading(false);
    };
    init();
  }, []);

  const login = async (email: string, pass: string) => {
    if (isIpBanned) throw new Error("This IP address is banned from RojoGames.");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) throw error;
    if (data.user) { await loadProfile(data.user.id); await syncDatabase(); }
  };

  const signup = async (username: string, email: string, pass: string) => {
    if (isIpBanned) throw new Error("This IP address is banned from RojoGames.");
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
    const { error } = await supabase.from('profiles').update(mapToDb(data)).eq('id', currentUser.id);
    if (error) {
      console.error("Update Error:", error.message);
      alert("Failed to update profile: " + error.message);
      return;
    }
    await loadProfile(currentUser.id);
    await syncDatabase();
  };

  const updateTargetUser = async (userId: string, data: Partial<User>) => {
    const { error } = await supabase.from('profiles').update(mapToDb(data)).eq('id', userId);
    if (error) alert("Failed to update user: " + error.message);
    await syncDatabase();
  };

  const addThread = async (title: string, content: string, categoryId: string) => {
    if (!currentUser) return;
    const { error } = await supabase.from('threads').insert({ author_id: currentUser.id, title, content, category_id: categoryId });
    if (error) alert("Failed to create thread: " + error.message);
    await syncDatabase();
  };

  const addPost = async (threadId: string, content: string) => {
    if (!currentUser) return;
    const { error } = await supabase.from('posts').insert({ thread_id: threadId, author_id: currentUser.id, content });
    if (error) { 
      console.error("Post Error Details:", error); 
      alert("Failed to reply: " + error.message); 
    }
    await syncDatabase();
  };

  const updatePost = async (postId: string, content: string) => {
    const { error } = await supabase.from('posts').update({ content }).eq('id', postId);
    if (error) alert("Failed to edit post: " + error.message);
    await syncDatabase();
  };

  const deleteThread = async (id: string) => { await supabase.from('threads').delete().eq('id', id); await syncDatabase(); };
  const deletePost = async (id: string) => { await supabase.from('posts').delete().eq('id', id); await syncDatabase(); };
  
  const likePost = async (id: string) => {
    const p = posts.find(x => x.id === id);
    if (!p || !currentUser) return;
    const newLikedBy = p.likedBy.includes(currentUser.id) ? p.likedBy.filter(u => u !== currentUser.id) : [...p.likedBy, currentUser.id];
    await supabase.from('posts').update({ liked_by: newLikedBy, likes: newLikedBy.length }).eq('id', id);
    await syncDatabase();
  };

  const likeThread = async (id: string) => {
    const t = threads.find(x => x.id === id);
    if (!t || !currentUser) return;
    const newLikedBy = t.likedBy.includes(currentUser.id) ? t.likedBy.filter(u => u !== currentUser.id) : [...t.likedBy, currentUser.id];
    await supabase.from('threads').update({ liked_by: newLikedBy, likes: newLikedBy.length }).eq('id', id);
    await syncDatabase();
  };

  const toggleThreadPin = async (id: string) => {
    const t = threads.find(x => x.id === id);
    await supabase.from('threads').update({ is_pinned: !t?.isPinned }).eq('id', id);
    await syncDatabase();
  };

  const toggleThreadLock = async (id: string) => {
    const t = threads.find(x => x.id === id);
    await supabase.from('threads').update({ is_locked: !t?.isLocked }).eq('id', id);
    await syncDatabase();
  };

  const incrementThreadView = async (id: string) => { await supabase.rpc('increment_thread_view', { t_id: id }); };

  const banUser = async (userId: string, reason: string, duration: string, doIpBan?: boolean) => {
    const expires = duration === 'Permanent' ? 'Never' : new Date(Date.now() + parseInt(duration) * 86400000).toLocaleString();
    const { error } = await supabase.from('profiles').update({ status: 'Banned', ban_reason: reason, ban_expires: expires }).eq('id', userId);
    
    if (doIpBan) {
      const user = users.find(u => u.id === userId);
      if (user?.lastIp) {
        await supabase.from('ip_bans').insert({ ip_address: user.lastIp, reason, banned_by: currentUser?.id });
      }
    }

    if (error) alert("Ban failed: " + error.message);
    await syncDatabase();
  };

  const unbanUser = async (userId: string) => {
    const { error } = await supabase.from('profiles').update({ status: 'Active', ban_reason: null, ban_expires: null }).eq('id', userId);
    if (error) alert("Unban failed: " + error.message);
    await syncDatabase();
  };

  const unbanIp = async (ip: string) => {
    await supabase.from('ip_bans').delete().eq('ip_address', ip);
    await syncDatabase();
  };

  const fetchUserIpHistory = async (userId: string): Promise<UserIpLog[]> => {
    const { data } = await supabase.from('user_ips').select('ip, created_at, user_agent').eq('user_id', userId).order('created_at', { ascending: false });
    return (data || []) as UserIpLog[];
  };

  const resolveReport = async (reportId: string, status: ModStatus) => {
    await supabase.from('reports').update({ status }).eq('id', reportId);
    await syncDatabase();
  };

  const addReport = async (type: ReportType, targetId: string, reason: string, contentSnippet: string, authorUsername: string, targetUrl: string) => {
    await supabase.from('reports').insert({ type, target_id: targetId, reported_by: currentUser?.username || 'Guest', author_username: authorUsername, target_url: targetUrl, reason, content_snippet: contentSnippet, status: ModStatus.PENDING });
    await syncDatabase();
  };

  const sendChatMessage = async (receiverId: string, content: string) => {
    await supabase.from('messages').insert({ sender_id: currentUser?.id, receiver_id: receiverId, content });
    await syncDatabase();
  };

  const fetchChatHistory = async (otherUserId: string) => {
    const { data } = await supabase.from('messages').select('*').or(`and(sender_id.eq.${currentUser?.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUser?.id})`).order('created_at', { ascending: true });
    if (data) setChatMessages(data as ChatMessage[]);
  };

  const resetPassword = async (email: string) => { await supabase.auth.resetPasswordForEmail(email); };
  const updatePassword = async (newPassword: string) => { await supabase.auth.updateUser({ password: newPassword }); };

  return (
    <AppStateContext.Provider value={{
      isAuthenticated, login, signup, logout, loginAs, revertToAdmin, originalAdmin, currentUser, users, threads, posts, reports, chatMessages, allChatPartners, theme, loading,
      toggleTheme, updateUser, updateTargetUser, banUser, unbanUser, unbanIp, addThread, incrementThreadView, toggleThreadPin, toggleThreadLock, deleteThread, addPost, updatePost, deletePost, likePost, likeThread,
      resolveReport, addReport, sendChatMessage, fetchChatHistory, fetchUserIpHistory, resetPassword, updatePassword, ipBans, clientIp, isIpBanned
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