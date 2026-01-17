
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Thread, Post, Report, ModStatus, ReportType, ThemeMode, SiteAsset } from './types';
import { supabase } from './services/supabaseClient';

interface AppState {
  isAuthenticated: boolean;
  currentUser: User | null;
  originalAdmin: User | null;
  users: User[];
  threads: Thread[];
  posts: Post[];
  reports: Report[];
  assets: SiteAsset[];
  theme: ThemeMode;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  signup: (username: string, email: string, pass: string) => Promise<void>;
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
  updateGlobalBanner: (assetId: string) => Promise<void>;
  addGlobalAsset: (name: string, url: string) => Promise<void>;
  // Added missing method declarations
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
  const [assets, setAssets] = useState<SiteAsset[]>([]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.classList.toggle('light', theme === 'light');
  }, [theme]);

  // Helper to map DB profile to User interface
  const mapUser = (data: any): User => ({
    id: data.id,
    username: data.username,
    displayName: data.display_name,
    email: data.email,
    avatarUrl: data.avatar_url,
    bannerUrl: data.banner_url,
    role: data.role,
    status: data.status,
    joinDate: data.created_at,
    postCount: data.post_count || 0,
    about: data.about,
    themePreference: data.theme_preference || 'dark',
    banReason: data.ban_reason,
    banExpires: data.ban_expires,
  });

  // Initial Sync
  useEffect(() => {
    const initSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await fetchProfile(session.user.id);
        setIsAuthenticated(true);
      }
      await syncDatabase();
      setLoading(false);
    };

    initSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        await fetchProfile(session.user.id);
        setIsAuthenticated(true);
      } else {
        setCurrentUser(null);
        setIsAuthenticated(false);
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  const fetchProfile = async (uid: string) => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', uid).single();
    // Correctly mapping profile data to User interface
    if (data) setCurrentUser(mapUser(data));
  };

  const syncDatabase = async () => {
    const { data: t } = await supabase.from('threads').select('*, profiles(username, display_name)').order('created_at', { ascending: false });
    const { data: p } = await supabase.from('posts').select('*, profiles(username, display_name)');
    const { data: u } = await supabase.from('profiles').select('*');
    const { data: a } = await supabase.from('assets').select('*');
    const { data: r } = await supabase.from('reports').select('*').order('created_at', { ascending: false });

    // Proper mapping of database fields to TypeScript interfaces
    if (t) setThreads(t.map(x => ({
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
    
    if (p) setPosts(p.map(x => ({
      id: x.id,
      threadId: x.thread_id,
      authorId: x.author_id,
      authorName: x.profiles?.username || 'Unknown',
      content: x.content,
      createdAt: x.created_at,
      likes: x.likes || 0,
      likedBy: x.liked_by || []
    })));

    if (u) setUsers(u.map(x => mapUser(x)));
    
    if (a) setAssets(a.map(x => ({
      id: x.id,
      name: x.name,
      imageUrl: x.image_url,
      type: x.type,
      isActive: x.is_active || false
    })));

    if (r) setReports(r.map(x => ({
      id: x.id,
      type: x.type as ReportType,
      targetId: x.target_id,
      reportedBy: x.reported_by,
      reason: x.reason,
      contentSnippet: x.content_snippet,
      status: x.status as ModStatus,
      createdAt: x.created_at
    })));
  };

  const login = async (email: string, pass: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) throw error;
  };

  const signup = async (username: string, email: string, pass: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password: pass });
    if (error) throw error;
    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        username,
        display_name: username,
        email,
        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
        role: 'User'
      });
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setOriginalAdmin(null);
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
    // Map camelCase keys to snake_case for DB update
    const dbData: any = { ...data };
    if (data.displayName !== undefined) { dbData.display_name = data.displayName; delete dbData.displayName; }
    if (data.avatarUrl !== undefined) { dbData.avatar_url = data.avatarUrl; delete dbData.avatarUrl; }
    if (data.bannerUrl !== undefined) { dbData.banner_url = data.bannerUrl; delete dbData.bannerUrl; }
    if (data.about !== undefined) { dbData.about = data.about; }
    
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
    // Correctly using isPinned (camelCase) for comparison but snake_case for DB column
    await supabase.from('threads').update({ is_pinned: !t?.isPinned }).eq('id', id);
    await syncDatabase();
  };

  const toggleThreadLock = async (id: string) => {
    const t = threads.find(x => x.id === id);
    // Correctly using isLocked (camelCase) for comparison but snake_case for DB column
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
    // Increment reply count in threads - corrected property access
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

  const updateGlobalBanner = async (assetId: string) => {
    await supabase.from('assets').update({ is_active: false }).neq('id', 'temp'); // Reset all
    await supabase.from('assets').update({ is_active: true }).eq('id', assetId);
    await syncDatabase();
  };

  const addGlobalAsset = async (name: string, url: string) => {
    await supabase.from('assets').insert({ name, image_url: url });
    await syncDatabase();
  };

  // Implement resolveReport
  const resolveReport = async (reportId: string, status: ModStatus) => {
    await supabase.from('reports').update({ status }).eq('id', reportId);
    await syncDatabase();
  };

  // Implement addReport
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
      isAuthenticated, login, signup, logout, loginAs, revertToAdmin, originalAdmin, currentUser, users, threads, posts, reports, assets, theme, loading,
      toggleTheme, updateUser, updateTargetUser, banUser, unbanUser, addThread, 
      toggleThreadPin, toggleThreadLock, deleteThread, addPost, likePost, updateGlobalBanner, addGlobalAsset,
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
