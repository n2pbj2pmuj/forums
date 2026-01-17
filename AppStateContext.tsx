
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { User, Thread, Post, Report, ModStatus, ReportType, ThemeMode } from './types';
import { supabase } from './services/supabaseClient';
import { MOCK_THREADS, MOCK_POSTS, MOCK_USERS, MOCK_REPORTS } from './constants';

interface AppState {
  isAuthenticated: boolean;
  currentUser: User | null;
  originalAdmin: User | null;
  users: User[];
  threads: Thread[];
  posts: Post[];
  reports: Report[];
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
  toggleThreadPin: (threadId: string) => Promise<void>;
  toggleThreadLock: (threadId: string) => Promise<void>;
  deleteThread: (threadId: string) => Promise<void>;
  addPost: (threadId: string, content: string) => Promise<void>;
  likePost: (postId: string) => Promise<void>;
  resolveReport: (reportId: string, status: ModStatus) => Promise<void>;
  addReport: (type: ReportType, targetId: string, reason: string, contentSnippet: string) => Promise<void>;
}

const AppStateContext = createContext<AppState | undefined>(undefined);

export const AppStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [originalAdmin, setOriginalAdmin] = useState<User | null>(null);
  
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [threads, setThreads] = useState<Thread[]>(MOCK_THREADS);
  const [posts, setPosts] = useState<Post[]>(MOCK_POSTS);
  const [reports, setReports] = useState<Report[]>(MOCK_REPORTS);

  const initialized = useRef(false);
  const isAuthenticated = !!currentUser;

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.classList.toggle('light', theme === 'light');
  }, [theme]);

  // Map raw Auth or Profile data to our User interface
  const mapUser = (data: any): User => {
    const email = data.email || '';
    const metadata = data.user_metadata || {};
    const isSpecial = email === 'admin@rojos.games' || metadata.username?.toLowerCase().includes('admin');
    
    return {
      id: data.id,
      username: data.username || metadata.username || 'Member',
      displayName: data.display_name || metadata.display_name || metadata.username || email.split('@')[0] || 'User',
      email: email,
      avatarUrl: data.avatar_url || metadata.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.id}`,
      bannerUrl: data.banner_url || metadata.banner_url,
      role: isSpecial ? 'Admin' : (data.role || 'User'),
      status: data.status || 'Active',
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
      const [threadsRes, usersRes, reportsRes] = (await Promise.allSettled([
        supabase.from('threads').select('*, profiles(username, display_name)').order('created_at', { ascending: false }),
        supabase.from('profiles').select('*'),
        supabase.from('reports').select('*').order('created_at', { ascending: false })
      ])) as any[];

      if (threadsRes.status === 'fulfilled' && threadsRes.value.data) {
        setThreads(threadsRes.value.data.map((x: any) => ({
          id: x.id, categoryId: x.category_id, authorId: x.author_id, authorName: x.profiles?.username || 'Unknown',
          title: x.title, content: x.content, createdAt: x.created_at, replyCount: x.reply_count || 0,
          viewCount: x.view_count || 0, isLocked: x.is_locked || false, isPinned: x.is_pinned || false
        })));
      }
      if (usersRes.status === 'fulfilled' && usersRes.value.data) {
        setUsers(usersRes.value.data.map((x: any) => mapUser(x)));
      }
      if (reportsRes.status === 'fulfilled' && reportsRes.value.data) {
        setReports(reportsRes.value.data.map((x: any) => ({
          id: x.id, type: x.type as ReportType, targetId: x.target_id, reportedBy: x.reported_by,
          reason: x.reason, content_snippet: x.content_snippet, status: x.status as ModStatus, createdAt: x.created_at
        })));
      }
    } catch (e) {
      console.warn("Background data sync incomplete.");
    }
  };

  const loadProfile = async (authId: string) => {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', authId).single();
      if (!error && data) {
        setCurrentUser(mapUser(data));
      }
    } catch (e) {
      console.warn("Could not fetch extended profile details.");
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setOriginalAdmin(null);
    setLoading(false);
  };

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    
    // GUARANTEED UNLOCK: The app must show a screen after 3 seconds max, no matter what.
    const unlockTimer = setTimeout(() => setLoading(false), 3000);

    const checkInitialSession = async () => {
      try {
        // Use getUser() as recommended for session validation on boot
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setCurrentUser(mapUser(user));
          loadProfile(user.id);
          syncDatabase();
        }
      } catch (e) {
        console.error("Auth init error:", e);
      } finally {
        setLoading(false);
        clearTimeout(unlockTimer);
      }
    };

    checkInitialSession();

    // Setup listener for subsequent auth events
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'INITIAL_SESSION') {
        if (session?.user) {
          setCurrentUser(mapUser(session.user));
          loadProfile(session.user.id);
          setLoading(false);
        }
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setLoading(false);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
      clearTimeout(unlockTimer);
    };
  }, []);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (error) throw error;
      if (data.user) {
        setCurrentUser(mapUser(data.user));
        loadProfile(data.user.id);
        syncDatabase();
      }
    } finally {
      setLoading(false);
    }
  };

  const signup = async (username: string, email: string, pass: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({ 
        email, password: pass, options: { data: { username } }
      });
      if (error) throw error;
      if (data.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id, username, display_name: username, email,
          avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`, role: 'User'
        });
      }
    } finally {
      setLoading(false);
    }
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
    const { data: refreshed } = await supabase.auth.getUser();
    if (refreshed.user) {
      setCurrentUser(mapUser(refreshed.user));
      loadProfile(refreshed.user.id);
    }
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
    const t = threads.find(x => x.id === threadId);
    await supabase.from('threads').update({ reply_count: (t?.replyCount || 0) + 1 }).eq('id', threadId);
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

  const resolveReport = async (reportId: string, status: ModStatus) => {
    await supabase.from('reports').update({ status }).eq('id', reportId);
    await syncDatabase();
  };

  const addReport = async (type: ReportType, targetId: string, reason: string, contentSnippet: string) => {
    if (!currentUser) return;
    await supabase.from('reports').insert({
      type, target_id: targetId, reported_by: currentUser.username,
      reason, content_snippet: contentSnippet, status: ModStatus.PENDING
    });
    await syncDatabase();
  };

  return (
    <AppStateContext.Provider value={{
      isAuthenticated, login, signup, resetPassword: async (e) => { await supabase.auth.resetPasswordForEmail(e); },
      updatePassword: async (p) => { await supabase.auth.updateUser({ password: p }); },
      logout, loginAs, revertToAdmin, originalAdmin, currentUser, users, threads, posts, reports, theme, loading,
      toggleTheme, updateUser, updateTargetUser, banUser, unbanUser, addThread, toggleThreadPin, toggleThreadLock, deleteThread, addPost, likePost,
      resolveReport, addReport
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
