
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Thread, Post, Report, ModStatus, ReportType, ThemeMode } from './types';
import { supabase } from './services/supabaseClient';

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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [originalAdmin, setOriginalAdmin] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.classList.toggle('light', theme === 'light');
  }, [theme]);

  const mapUser = (data: any): User => {
    const safeId = data?.id || 'guest';
    return {
      id: safeId,
      username: data?.username || `User_${safeId.substring(0, 5)}`,
      displayName: data?.display_name || data?.username || 'New Member',
      email: data?.email || '',
      avatarUrl: data?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${safeId}`,
      bannerUrl: data?.banner_url,
      role: (data?.role as any) || 'User',
      status: (data?.status as any) || 'Active',
      joinDate: data?.created_at || new Date().toISOString(),
      postCount: data?.post_count || 0,
      about: data?.about || '',
      themePreference: (data?.theme_preference as ThemeMode) || 'dark',
      banReason: data?.ban_reason,
      banExpires: data?.ban_expires,
    };
  };

  const fetchProfile = async (uid: string, email?: string) => {
    console.log(`[Session] Fetching profile for UID: ${uid}`);
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', uid).single();
      
      if (error || !data) {
        console.warn("[Session] Profile fetch failed or missing. Creating fallback user profile.");
        // Defensive fallback to prevent app hang
        const fallback = mapUser({ id: uid, email: email, username: email?.split('@')[0] });
        setCurrentUser(fallback);
        return fallback;
      }
      
      console.log("[Session] Profile loaded successfully from DB.");
      const mapped = mapUser(data);
      setCurrentUser(mapped);
      return mapped;
    } catch (err) {
      console.error("[Session] Critical profile error:", err);
      const fallback = mapUser({ id: uid, email });
      setCurrentUser(fallback);
      return fallback;
    }
  };

  const syncDatabase = async () => {
    try {
      const [threadsRes, postsRes, usersRes, reportsRes] = await Promise.all([
        supabase.from('threads').select('*, profiles(username, display_name)').order('created_at', { ascending: false }),
        supabase.from('posts').select('*, profiles(username, display_name)'),
        supabase.from('profiles').select('*'),
        supabase.from('reports').select('*').order('created_at', { ascending: false })
      ]);

      if (threadsRes.data) setThreads(threadsRes.data.map(x => ({
        id: x.id,
        categoryId: x.category_id,
        authorId: x.author_id,
        authorName: x.profiles?.username || 'Unknown',
        title: x.title,
        content: x.content,
        createdAt: x.created_at,
        replyCount: x.reply_count || 0,
        viewCount: x.view_count || 0,
        isLocked: x.is_locked || false,
        isPinned: x.is_pinned || false
      })));
      
      if (postsRes.data) setPosts(postsRes.data.map(x => ({
        id: x.id,
        threadId: x.thread_id,
        authorId: x.author_id,
        authorName: x.profiles?.username || 'Unknown',
        content: x.content,
        createdAt: x.created_at,
        likes: x.likes || 0,
        likedBy: x.liked_by || []
      })));

      if (usersRes.data) setUsers(usersRes.data.map(x => mapUser(x)));

      if (reportsRes.data) setReports(reportsRes.data.map(x => ({
        id: x.id,
        type: x.type as ReportType,
        targetId: x.target_id,
        reportedBy: x.reported_by,
        reason: x.reason,
        // Fixed mapping to use camelCase contentSnippet as defined in Report interface
        contentSnippet: x.content_snippet,
        status: x.status as ModStatus,
        createdAt: x.created_at
      })));
    } catch (err) {
      console.error("[Sync] Database sync failed:", err);
    }
  };

  useEffect(() => {
    let mounted = true;
    
    // SAFETY VALVE: Force stop loading if database takes > 3 seconds
    const safetyTimer = setTimeout(() => {
      if (mounted && loading) {
        console.warn("[Session] Force stopping loading screen due to safety timeout.");
        setLoading(false);
      }
    }, 3000);

    const initSession = async () => {
      console.log("[Session] Initializing forum session...");
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;

        if (session?.user) {
          console.log("[Session] Active session found. Restoring...");
          await fetchProfile(session.user.id, session.user.email);
          if (mounted) setIsAuthenticated(true);
        } else {
          console.log("[Session] No active session. Waiting for login.");
        }
        
        await syncDatabase();
      } catch (err) {
        console.error("[Session] Initialization failed:", err);
      } finally {
        if (mounted) {
          setLoading(false);
          clearTimeout(safetyTimer);
          console.log("[Session] Loading complete.");
        }
      }
    };

    initSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`[Auth] Event: ${event}`);
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        if (session?.user) {
          await fetchProfile(session.user.id, session.user.email);
          setIsAuthenticated(true);
          setLoading(false);
        }
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setIsAuthenticated(false);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, pass: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) throw error;
    
    if (data.session) {
      await fetchProfile(data.user.id, data.user.email);
      setIsAuthenticated(true);
    }
  };

  const signup = async (username: string, email: string, pass: string) => {
    const { data, error } = await supabase.auth.signUp({ 
      email: email, 
      password: pass,
      options: {
        data: { username }
      }
    });

    if (error) throw error;

    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        username,
        display_name: username,
        email,
        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
        role: 'User'
      });
    }
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/#/update-password`,
    });
    if (error) throw error;
  };

  const updatePassword = async (newPass: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPass });
    if (error) throw error;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setOriginalAdmin(null);
    setCurrentUser(null);
    setIsAuthenticated(false);
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
    
    const { error } = await supabase.from('profiles').update(dbData).eq('id', currentUser.id);
    if (!error) await fetchProfile(currentUser.id);
  };

  const updateTargetUser = async (userId: string, data: Partial<User>) => {
    const dbData: any = { ...data };
    if (data.displayName !== undefined) { dbData.display_name = data.displayName; delete dbData.displayName; }
    if (data.username !== undefined) { dbData.username = data.username; delete dbData.username; }
    if (data.email !== undefined) { dbData.email = data.email; delete dbData.email; }
    if (data.role !== undefined) { dbData.role = data.role; delete dbData.role; }
    
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
    await supabase.from('threads').insert({
      author_id: currentUser.id,
      title,
      content,
      category_id: categoryId
    });
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
    await supabase.from('posts').insert({
      thread_id: threadId,
      author_id: currentUser.id,
      content
    });
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
    
    await supabase.from('posts').update({ 
      liked_by: newLikedBy,
      likes: newLikedBy.length
    }).eq('id', postId);
    await syncDatabase();
  };

  const resolveReport = async (reportId: string, status: ModStatus) => {
    await supabase.from('reports').update({ status }).eq('id', reportId);
    await syncDatabase();
  };

  const addReport = async (type: ReportType, targetId: string, reason: string, contentSnippet: string) => {
    if (!currentUser) return;
    await supabase.from('reports').insert({
      type,
      target_id: targetId,
      reported_by: currentUser.username,
      reason,
      content_snippet: contentSnippet,
      status: ModStatus.PENDING
    });
    await syncDatabase();
  };

  return (
    <AppStateContext.Provider value={{
      isAuthenticated, login, signup, resetPassword, updatePassword, logout, loginAs, revertToAdmin, originalAdmin, currentUser, users, threads, posts, reports, theme, loading,
      toggleTheme, updateUser, updateTargetUser, banUser, unbanUser, addThread, 
      toggleThreadPin, toggleThreadLock, deleteThread, addPost, likePost,
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
