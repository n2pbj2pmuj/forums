
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { User, Thread, Post, Report, ModStatus, ReportType, ThemeMode } from './types';
import { supabase } from './services/supabaseClient';

interface ChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
}

interface AppState {
  isAuthenticated: boolean;
  currentUser: User | null;
  originalAdmin: User | null;
  users: User[];
  threads: Thread[];
  posts: Post[];
  reports: Report[];
  chatMessages: ChatMessage[];
  theme: ThemeMode;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  signup: (username: string, email: string, pass: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPass: string) => Promise<void>;
  logout: () => void;
  loginAs: (userId: string) => void;
  revertToAdmin: () => void;
  toggleTheme: () => void;
  updateUser: (data: Partial<User>) => Promise<void>;
  updateTargetUser: (userId: string, data: Partial<User>) => Promise<void>; 
  banUser: (userId: string, reason: string, duration: string) => Promise<void>;
  unbanUser: (userId: string) => Promise<void>;
  addThread: (title: string, content: string, categoryId: string) => Promise<void>;
  incrementThreadView: (threadId: string) => Promise<void>;
  toggleThreadPin: (threadId: string) => Promise<void>;
  toggleThreadLock: (threadId: string) => Promise<void>;
  deleteThread: (threadId: string) => Promise<void>;
  addPost: (threadId: string, content: string) => Promise<void>;
  likePost: (postId: string) => Promise<void>;
  likeThread: (threadId: string) => Promise<void>;
  resolveReport: (reportId: string, status: ModStatus) => Promise<void>;
  addReport: (type: ReportType, targetId: string, reason: string, contentSnippet: string, authorUsername: string, targetUrl: string) => Promise<void>;
  sendChatMessage: (receiverId: string, content: string) => Promise<void>;
  fetchChatHistory: (otherUserId: string) => Promise<void>;
  fetchAllMessages: () => Promise<void>;
}

const AppStateContext = createContext<AppState | undefined>(undefined);

export const AppStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [originalAdmin, setOriginalAdmin] = useState<User | null>(null);
  
  const [users, setUsers] = useState<User[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  const initRef = useRef(false);
  const isAuthenticated = !!currentUser;

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.classList.toggle('light', theme === 'light');
  }, [theme]);

  const mapUser = (data: any): User => {
    const email = data.email || '';
    const metadata = data.user_metadata || {};
    const username = data.username || metadata.username || 'Member';
    const isSpecial = email === 'admin@rojos.games' || username.toLowerCase().includes('admin');
    
    return {
      id: data.id,
      username: username,
      displayName: data.display_name || metadata.display_name || username || email.split('@')[0] || 'User',
      email: email,
      avatarUrl: data.avatar_url || metadata.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.id}`,
      bannerUrl: data.banner_url || metadata.banner_url,
      role: isSpecial ? 'Admin' : (data.role || 'User'),
      status: (data.status as any) || 'Active',
      joinDate: data.created_at || new Date().toISOString(),
      postCount: data.post_count || 0,
      about: data.about || '',
      themePreference: (data.theme_preference as ThemeMode) || 'dark',
      banReason: data.ban_reason,
      banExpires: data.ban_expires,
    };
  };

  const syncDatabase = async () => {
    try {
      const results = await Promise.allSettled([
        supabase.from('threads').select('*, profiles(username, display_name)').order('is_pinned', { ascending: false }).order('created_at', { ascending: false }),
        supabase.from('profiles').select('*'),
        supabase.from('reports').select('*').order('created_at', { ascending: false }),
        supabase.from('posts').select('*, profiles(username, display_name)').order('created_at', { ascending: true })
      ]);

      const [threadsRes, usersRes, reportsRes, postsRes] = results as any[];

      if (threadsRes.status === 'fulfilled' && threadsRes.value.data) {
        setThreads(threadsRes.value.data.map((x: any) => ({
          id: x.id, categoryId: x.category_id, authorId: x.author_id, authorName: x.profiles?.username || 'Unknown',
          title: x.title, content: x.content, createdAt: x.created_at, replyCount: x.reply_count || 0,
          viewCount: x.view_count || 0, likes: x.likes || 0, likedBy: x.liked_by || [],
          isLocked: x.is_locked || false, isPinned: x.is_pinned || false
        })));
      }
      if (usersRes.status === 'fulfilled' && usersRes.value.data) {
        setUsers(usersRes.value.data.map((x: any) => mapUser(x)));
      }
      if (reportsRes.status === 'fulfilled' && reportsRes.value.data) {
        setReports(reportsRes.value.data.map((x: any) => ({
          id: x.id, type: x.type as ReportType, targetId: x.target_id, reportedBy: x.reported_by,
          authorUsername: x.author_username, targetUrl: x.target_url,
          reason: x.reason, contentSnippet: x.content_snippet, status: x.status as ModStatus, createdAt: x.created_at
        })));
      }
      if (postsRes.status === 'fulfilled' && postsRes.value.data) {
        setPosts(postsRes.value.data.map((x: any) => ({
          id: x.id, threadId: x.thread_id, authorId: x.author_id, authorName: x.profiles?.username || 'Unknown',
          content: x.content, createdAt: x.created_at, likes: x.likes || 0, likedBy: x.liked_by || []
        })));
      }
    } catch (e) {
      console.warn("Sync failed.");
    }
  };

  const loadProfile = async (id: string) => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
    if (!error && data) {
      setCurrentUser(mapUser(data));
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setOriginalAdmin(null);
  };

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    const initialize = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await loadProfile(session.user.id);
        await syncDatabase();
      }
      setLoading(false);
    };
    initialize();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await loadProfile(session.user.id);
        await syncDatabase();
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });
    return () => authListener.subscription.unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) throw error;
    if (data.user) {
      await loadProfile(data.user.id);
      await syncDatabase();
    }
  };

  const signup = async (username: string, email: string, pass: string) => {
    const { data, error } = await supabase.auth.signUp({ 
      email, password: pass, options: { data: { username } }
    });
    if (error) throw error;
  };

  const loginAs = (userId: string) => {
    const target = users.find(u => u.id === userId);
    if (target && currentUser) {
      if (!originalAdmin) setOriginalAdmin(currentUser);
      setCurrentUser(target);
    }
  };

  const revertToAdmin = () => {
    if (originalAdmin) {
      setCurrentUser(originalAdmin);
      setOriginalAdmin(null);
    }
  };

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const updateUser = async (data: Partial<User>) => {
    if (!currentUser) return;
    const dbData: any = { ...data };
    if (data.displayName !== undefined) { dbData.display_name = data.displayName; delete dbData.displayName; }
    if (data.avatarUrl !== undefined) { dbData.avatar_url = data.avatarUrl; delete dbData.avatarUrl; }
    if (data.bannerUrl !== undefined) { dbData.banner_url = data.bannerUrl; delete dbData.bannerUrl; }
    await supabase.from('profiles').update(dbData).eq('id', currentUser.id);
    await loadProfile(currentUser.id);
  };

  const updateTargetUser = async (userId: string, data: Partial<User>) => {
    const dbData: any = { ...data };
    if (data.displayName !== undefined) { dbData.display_name = data.displayName; delete dbData.displayName; }
    if (data.username !== undefined) { dbData.username = data.username; delete dbData.username; }
    await supabase.from('profiles').update(dbData).eq('id', userId);
    await syncDatabase();
  };

  const banUser = async (userId: string, reason: string, duration: string) => {
    const expires = duration === 'Permanent' ? 'Never' : new Date(Date.now() + parseInt(duration) * 86400000).toLocaleString();
    await supabase.from('profiles').update({ status: 'Banned', ban_reason: reason, ban_expires: expires }).eq('id', userId);
    await syncDatabase();
  };

  const unbanUser = async (userId: string) => {
    await supabase.from('profiles').update({ status: 'Active', ban_reason: null, ban_expires: null }).eq('id', userId);
    await syncDatabase();
  };

  const addThread = async (title: string, content: string, categoryId: string) => {
    if (!currentUser) return;
    await supabase.from('threads').insert({ author_id: currentUser.id, title, content, category_id: categoryId });
    await syncDatabase();
  };

  const incrementThreadView = async (threadId: string) => {
    try {
      await supabase.rpc('increment_thread_view', { t_id: threadId });
    } catch (e) {
      const t = threads.find(x => x.id === threadId);
      if (t) {
        await supabase.from('threads').update({ view_count: (t.viewCount || 0) + 1 }).eq('id', threadId);
      }
    }
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

  const deleteThread = async (id: string) => {
    await supabase.from('threads').delete().eq('id', id);
    await syncDatabase();
  };

  const addPost = async (threadId: string, content: string) => {
    if (!currentUser) return;
    await supabase.from('posts').insert({ thread_id: threadId, author_id: currentUser.id, content });
    await syncDatabase();
  };

  const likePost = async (postId: string) => {
    if (!currentUser) return;
    const p = posts.find(x => x.id === postId);
    if (!p) return;
    const likedBy = p.likedBy || [];
    const isLiked = likedBy.includes(currentUser.id);
    const newLikedBy = isLiked ? likedBy.filter(id => id !== currentUser.id) : [...likedBy, currentUser.id];
    await supabase.from('posts').update({ liked_by: newLikedBy, likes: newLikedBy.length }).eq('id', postId);
    await syncDatabase();
  };

  const likeThread = async (threadId: string) => {
    if (!currentUser) return;
    const t = threads.find(x => x.id === threadId);
    if (!t) return;
    const likedBy = t.likedBy || [];
    const isLiked = likedBy.includes(currentUser.id);
    const newLikedBy = isLiked ? likedBy.filter(id => id !== currentUser.id) : [...likedBy, currentUser.id];
    await supabase.from('threads').update({ liked_by: newLikedBy, likes: newLikedBy.length }).eq('id', threadId);
    await syncDatabase();
  };

  const resolveReport = async (reportId: string, status: ModStatus) => {
    await supabase.from('reports').update({ status }).eq('id', reportId);
    await syncDatabase();
  };

  const addReport = async (type: ReportType, targetId: string, reason: string, contentSnippet: string, authorUsername: string, targetUrl: string) => {
    if (!currentUser) return;
    const { error } = await supabase.from('reports').insert({
      type, target_id: targetId, reported_by: currentUser.username,
      author_username: authorUsername, target_url: targetUrl,
      reason, content_snippet: contentSnippet, status: ModStatus.PENDING
    });
    if (error && error.code === '23505') {
      alert("This item has already been reported and is being reviewed.");
    } else if (error) {
      console.error(error);
    } else {
      alert("Report submitted successfully.");
      await syncDatabase();
    }
  };

  const sendChatMessage = async (receiverId: string, content: string) => {
    if (!currentUser) return;
    await supabase.from('messages').insert({ sender_id: currentUser.id, receiver_id: receiverId, content });
  };

  const fetchChatHistory = async (otherUserId: string) => {
    if (!currentUser) return;
    const { data } = await supabase.from('messages')
      .select('*')
      .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUser.id})`)
      .order('created_at', { ascending: true });
    if (data) setChatMessages(data as ChatMessage[]);
  };

  const fetchAllMessages = async () => {};

  return (
    <AppStateContext.Provider value={{
      isAuthenticated, login, signup, resetPassword: async (e) => { await supabase.auth.resetPasswordForEmail(e); },
      updatePassword: async (p) => { await supabase.auth.updateUser({ password: p }); },
      logout, loginAs, revertToAdmin, originalAdmin, currentUser, users, threads, posts, reports, chatMessages, theme, loading,
      toggleTheme, updateUser, updateTargetUser, banUser, unbanUser, addThread, incrementThreadView, toggleThreadPin, toggleThreadLock, deleteThread, addPost, likePost, likeThread,
      resolveReport, addReport, sendChatMessage, fetchChatHistory, fetchAllMessages
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
