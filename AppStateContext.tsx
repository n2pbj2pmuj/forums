
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

// Failsafe timeout for all Supabase calls
const withTimeout = <T,>(promise: Promise<T>, timeoutMs: number = 3000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
    ),
  ]);
};

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

  const mapUser = (data: any): User => {
    const email = data.email || '';
    const isSpecial = email === 'admin@rojos.games' || data.user_metadata?.username?.toLowerCase().includes('admin');
    
    return {
      id: data.id,
      username: data.username || data.user_metadata?.username || 'Member',
      displayName: data.display_name || data.user_metadata?.display_name || data.username || email.split('@')[0] || 'User',
      email: email,
      avatarUrl: data.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.id}`,
      bannerUrl: data.banner_url,
      role: isSpecial ? 'Admin' : (data.role as any || 'User'),
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
    console.log("🔄 [Database] Starting background sync...");
    try {
      const [threadsRes, usersRes, reportsRes] = await Promise.allSettled([
        withTimeout(supabase.from('threads').select('*, profiles(username, display_name)').order('created_at', { ascending: false })),
        withTimeout(supabase.from('profiles').select('*')),
        withTimeout(supabase.from('reports').select('*').order('created_at', { ascending: false }))
      ]) as any[];

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
          reason: x.reason, contentSnippet: x.content_snippet, status: x.status as ModStatus, createdAt: x.created_at
        })));
      }
      console.log("✅ [Database] Background sync complete.");
    } catch (e) {
      console.error("❌ [Database] Sync encountered issues:", e);
    }
  };

  const loadIdentity = async (user: any) => {
    if (!user) return;
    
    // Create immediate temporary identity so the UI isn't empty
    const tempUser = mapUser({ id: user.id, email: user.email, user_metadata: user.user_metadata });
    setCurrentUser(tempUser);
    
    // Now try to get the full profile from the DB in the background
    try {
      console.log("🔍 [Profile] Fetching full record for:", user.id);
      const { data, error } = await withTimeout(supabase.from('profiles').select('*').eq('id', user.id).single(), 2000) as any;
      
      if (!error && data) {
        console.log("✅ [Profile] Found database record.");
        setCurrentUser(mapUser(data));
      } else if (error?.code === 'PGRST116') {
        console.warn("💀 [Profile] Ghost token! User in auth but not in profiles table.");
        await logout();
      }
    } catch (e) {
      console.warn("⏱️ [Profile] DB check timed out, continuing with cached session identity.");
    }
    
    // Sync the rest of the forum data
    syncDatabase();
  };

  const logout = async () => {
    console.log("📤 [Auth] Logging out...");
    try {
      await withTimeout(supabase.auth.signOut(), 2000);
    } catch (e) {}
    setCurrentUser(null);
    setOriginalAdmin(null);
    localStorage.removeItem('rojo_logged_in');
    setLoading(false);
  };

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    
    let mounted = true;
    console.log("🚀 [System] Initializing App State...");

    const initialize = async () => {
      try {
        // Step 1: Rapid session check
        console.log("🛰️ [Auth] Polling session...");
        const { data: { session } } = await withTimeout(supabase.auth.getSession(), 2500) as any;
        
        if (mounted) {
          if (session?.user) {
            console.log("👤 [Auth] Active session found.");
            await loadIdentity(session.user);
          } else {
            console.log("⚪ [Auth] No session found.");
          }
          // Step 2: UNLOCK UI IMMEDIATELY
          setLoading(false);
        }
      } catch (err) {
        console.error("🚨 [Auth] Session polling failed or timed out:", err);
        if (mounted) setLoading(false);
      }
    };

    initialize();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      console.log(`🔔 [Auth Event] ${event}`);

      if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'INITIAL_SESSION') {
        if (session?.user) {
          await loadIdentity(session.user);
          setLoading(false);
        }
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        localStorage.removeItem('rojo_logged_in');
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    try {
      console.log("🔑 [Auth] Attempting login...");
      const { data, error } = await withTimeout(supabase.auth.signInWithPassword({ email, password: pass }), 5000) as any;
      if (error) throw error;
      if (data.session) {
        await loadIdentity(data.user);
      }
    } finally {
      setLoading(false);
    }
  };

  const signup = async (username: string, email: string, pass: string) => {
    console.log("📝 [Auth] Creating account...");
    const { data, error } = await withTimeout(supabase.auth.signUp({ 
      email: email, 
      password: pass,
      options: { data: { username } }
    }), 5000) as any;
    
    if (error) throw error;
    if (data.user) {
      try {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          username,
          display_name: username,
          email,
          avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
          role: 'User'
        });
      } catch (e) {}
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
    try {
      const dbData: any = { ...data };
      if (data.displayName !== undefined) { dbData.display_name = data.displayName; delete dbData.displayName; }
      if (data.avatarUrl !== undefined) { dbData.avatar_url = data.avatarUrl; delete dbData.avatarUrl; }
      if (data.bannerUrl !== undefined) { dbData.banner_url = data.bannerUrl; delete dbData.bannerUrl; }
      
      const { error } = await supabase.from('profiles').update(dbData).eq('id', currentUser.id);
      if (!error) {
         await loadIdentity(currentUser);
      } else {
         setCurrentUser({ ...currentUser, ...data });
      }
    } catch (e) {
      setCurrentUser({ ...currentUser, ...data });
    }
  };

  const updateTargetUser = async (userId: string, data: Partial<User>) => {
    try {
      const dbData: any = { ...data };
      if (data.displayName !== undefined) { dbData.display_name = data.displayName; delete dbData.displayName; }
      if (data.username !== undefined) { dbData.username = data.username; delete dbData.username; }
      if (data.email !== undefined) { dbData.email = data.email; delete dbData.email; }
      if (data.role !== undefined) { dbData.role = data.role; delete dbData.role; }
      await supabase.from('profiles').update(dbData).eq('id', userId);
      await syncDatabase();
    } catch (e) {
      setUsers(users.map(u => u.id === userId ? { ...u, ...data } : u));
    }
  };

  const banUser = async (userId: string, reason: string, duration: string) => {
    const expires = duration === 'Permanent' ? 'Never' : new Date(Date.now() + parseInt(duration) * 86400000).toLocaleString();
    try {
      await supabase.from('profiles').update({ status: 'Banned', ban_reason: reason, ban_expires: expires }).eq('id', userId);
      await syncDatabase();
    } catch (e) {
      setUsers(users.map(u => u.id === userId ? { ...u, status: 'Banned', banReason: reason, banExpires: expires } : u));
    }
  };

  const unbanUser = async (userId: string) => {
    try {
      await supabase.from('profiles').update({ status: 'Active', ban_reason: null, ban_expires: null }).eq('id', userId);
      await syncDatabase();
    } catch (e) {
      setUsers(users.map(u => u.id === userId ? { ...u, status: 'Active', banReason: undefined, banExpires: undefined } : u));
    }
  };

  const addThread = async (title: string, content: string, categoryId: string) => {
    if (!currentUser) return;
    try {
      await supabase.from('threads').insert({
        author_id: currentUser.id,
        title,
        content,
        category_id: categoryId
      });
      await syncDatabase();
    } catch (e) {
      const newT: Thread = {
        id: Math.random().toString(36).substr(2, 9),
        categoryId, authorId: currentUser.id, authorName: currentUser.username,
        title, content, createdAt: new Date().toISOString(), replyCount: 0,
        viewCount: 0, isLocked: false, isPinned: false
      };
      setThreads([newT, ...threads]);
    }
  };

  const toggleThreadPin = async (id: string) => {
    const t = threads.find(x => x.id === id);
    try {
      await supabase.from('threads').update({ is_pinned: !t?.isPinned }).eq('id', id);
      await syncDatabase();
    } catch (e) {
      setThreads(threads.map(x => x.id === id ? { ...x, isPinned: !x.isPinned } : x));
    }
  };

  const toggleThreadLock = async (id: string) => {
    const t = threads.find(x => x.id === id);
    try {
      await supabase.from('threads').update({ is_locked: !t?.isLocked }).eq('id', id);
      await syncDatabase();
    } catch (e) {
      setThreads(threads.map(x => x.id === id ? { ...x, isLocked: !x.isLocked } : x));
    }
  };

  const deleteThread = async (id: string) => {
    try {
      await supabase.from('threads').delete().eq('id', id);
      await syncDatabase();
    } catch (e) {
      setThreads(threads.filter(x => x.id !== id));
    }
  };

  const addPost = async (threadId: string, content: string) => {
    if (!currentUser) return;
    try {
      await supabase.from('posts').insert({
        thread_id: threadId, author_id: currentUser.id, content
      });
      const t = threads.find(x => x.id === threadId);
      await supabase.from('threads').update({ reply_count: (t?.replyCount || 0) + 1 }).eq('id', threadId);
      await syncDatabase();
    } catch (e) {
      const newP: Post = {
        id: Math.random().toString(36).substr(2, 9), threadId, authorId: currentUser.id,
        authorName: currentUser.username, content, createdAt: new Date().toISOString(),
        likes: 0, likedBy: []
      };
      setPosts([...posts, newP]);
      setThreads(threads.map(t => t.id === threadId ? { ...t, replyCount: t.replyCount + 1 } : t));
    }
  };

  const likePost = async (postId: string) => {
    if (!currentUser) return;
    const p = posts.find(x => x.id === postId);
    if (!p) return;
    const likedBy = p.likedBy || [];
    const isLiked = likedBy.includes(currentUser.id);
    const newLikedBy = isLiked ? likedBy.filter(id => id !== currentUser.id) : [...likedBy, currentUser.id];
    
    try {
      await supabase.from('posts').update({ liked_by: newLikedBy, likes: newLikedBy.length }).eq('id', postId);
      await syncDatabase();
    } catch (e) {
      setPosts(posts.map(x => x.id === postId ? { ...x, likedBy: newLikedBy, likes: newLikedBy.length } : x));
    }
  };

  const resolveReport = async (reportId: string, status: ModStatus) => {
    try {
      await supabase.from('reports').update({ status }).eq('id', reportId);
      await syncDatabase();
    } catch (e) {
      setReports(reports.map(r => r.id === reportId ? { ...r, status } : r));
    }
  };

  const addReport = async (type: ReportType, targetId: string, reason: string, contentSnippet: string) => {
    if (!currentUser) return;
    try {
      await supabase.from('reports').insert({
        type, target_id: targetId, reported_by: currentUser.username,
        reason, content_snippet: contentSnippet, status: ModStatus.PENDING
      });
      await syncDatabase();
    } catch (e) {
      const newR: Report = {
        id: Math.random().toString(36).substr(2, 9), type, targetId, reportedBy: currentUser.username,
        reason, contentSnippet, status: ModStatus.PENDING, createdAt: new Date().toISOString()
      };
      setReports([newR, ...reports]);
    }
  };

  return (
    <AppStateContext.Provider value={{
      isAuthenticated, 
      login, 
      signup, 
      resetPassword: async (email) => { await supabase.auth.resetPasswordForEmail(email); },
      updatePassword: async (newPass) => { await supabase.auth.updateUser({ password: newPass }); },
      logout, 
      loginAs, 
      revertToAdmin, 
      originalAdmin, 
      currentUser, 
      users, 
      threads, 
      posts, 
      reports, 
      theme, 
      loading,
      toggleTheme, 
      updateUser, 
      updateTargetUser, 
      banUser, 
      unbanUser, 
      addThread, 
      toggleThreadPin, 
      toggleThreadLock, 
      deleteThread, 
      addPost, 
      likePost,
      resolveReport, 
      addReport
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
