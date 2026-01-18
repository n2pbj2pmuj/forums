import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { User, Thread, Post, Report, ModStatus, ReportType, ThemeMode } from './types';
import { supabase } from './services/supabaseClient';
import { DEFAULT_AVATAR } from './constants';

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
  allChatPartners: string[];
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
  
  const [users, setUsers] = useState<User[]>([]);
  const [threads, setThreads] = useState<Thread[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [allChatPartners, setAllChatPartners] = useState<string[]>([]);

  const initRef = useRef(false);
  const isAuthenticated = !!currentUser;

  // Helper to map DB row or Auth User to our App User interface
  const mapUser = (data: any): User => {
    const email = data.email || '';
    const metadata = data.user_metadata || {};
    
    const username = data.username || metadata.username || 'Member';
    const rawAvatar = data.avatar_url || metadata.avatar_url;
    const isDicebear = rawAvatar?.includes('dicebear.com');
    const avatar = (isDicebear || !rawAvatar) ? DEFAULT_AVATAR : rawAvatar;

    return {
      id: data.id,
      username: username,
      displayName: data.display_name || metadata.display_name || username || email.split('@')[0] || 'User',
      email: email,
      avatarUrl: data.status === 'Banned' ? DEFAULT_AVATAR : avatar,
      bannerUrl: data.banner_url || metadata.banner_url || '',
      role: data.role || 'User',
      status: (data.status as any) || 'Active',
      joinDate: data.join_date || data.created_at || new Date().toISOString(),
      postCount: data.post_count || 0,
      about: data.about || '',
      themePreference: (data.theme_preference as ThemeMode) || 'dark',
      banReason: data.ban_reason || data.banReason,
      banExpires: data.ban_expires || data.banExpires,
    };
  };

  // Helper to map App User properties back to Database snake_case columns
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
    if (data.email !== undefined) mapping.email = data.email;
    return mapping;
  };

  const syncDatabase = async () => {
    try {
      const results = await Promise.allSettled([
        supabase.from('threads').select('*, profiles(username, display_name, status)').order('is_pinned', { ascending: false }).order('created_at', { ascending: false }),
        supabase.from('profiles').select('*'),
        supabase.from('reports').select('*').order('created_at', { ascending: false }),
        supabase.from('posts').select('*, profiles(username, display_name, status)').order('created_at', { ascending: true })
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
      
      if (currentUser) {
        const { data: partners } = await supabase.from('messages')
          .select('sender_id, receiver_id')
          .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`);
        
        if (partners) {
          const ids = new Set<string>();
          partners.forEach(m => {
            if (m.sender_id !== currentUser.id) ids.add(m.sender_id);
            if (m.receiver_id !== currentUser.id) ids.add(m.receiver_id);
          });
          setAllChatPartners(Array.from(ids));
        }
      }
    } catch (e) {
      console.warn("Sync failed.");
    }
  };

  const loadProfile = async (id: string) => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
    if (!error && data) {
      const u = mapUser(data);
      setCurrentUser(u);
      if (originalAdmin && originalAdmin.id === u.id) setOriginalAdmin(u);
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
    await supabase.auth.signUp({ 
      email, password: pass, options: { data: { username } }
    });
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
    const dbData = mapToDb(data);
    const { error } = await supabase.from('profiles').update(dbData).eq('id', currentUser.id);
    if (error) {
      console.error("Update failed:", error.message);
      return;
    }
    await loadProfile(currentUser.id);
    await syncDatabase();
  };

  const updateTargetUser = async (userId: string, data: Partial<User>) => {
    const dbData = mapToDb(data);
    const { error } = await supabase.from('profiles').update(dbData).eq('id', userId);
    if (error) {
      console.error("Target update failed:", error.message);
      return;
    }
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

  const updatePost = async (postId: string, content: string) => {
    await supabase.from('posts').update({ content }).eq('id', postId);
    await syncDatabase();
  };

  const deletePost = async (postId: string) => {
    await supabase.from('posts').delete().eq('id', postId);
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
       alert("Already reported.");
    } else if (error) {
       alert("Report failed.");
    } else {
       alert("Flag submitted.");
       await syncDatabase();
    }
  };

  const sendChatMessage = async (receiverId: string, content: string) => {
    if (!currentUser) return;
    await supabase.from('messages').insert({ sender_id: currentUser.id, receiver_id: receiverId, content });
    await syncDatabase();
  };

  const fetchChatHistory = async (otherUserId: string) => {
    if (!currentUser) return;
    const { data } = await supabase.from('messages')
      .select('*')
      .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUser.id})`)
      .order('created_at', { ascending: true });
    if (data) setChatMessages(data as ChatMessage[]);
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  };

  return (
    <AppStateContext.Provider value={{
      isAuthenticated, login, signup, logout, loginAs, revertToAdmin, originalAdmin, currentUser, users, threads, posts, reports, chatMessages, allChatPartners, theme, loading,
      toggleTheme, updateUser, updateTargetUser, banUser, unbanUser, addThread, incrementThreadView, toggleThreadPin, toggleThreadLock, deleteThread, addPost, updatePost, deletePost, likePost, likeThread,
      resolveReport, addReport, sendChatMessage, fetchChatHistory, resetPassword, updatePassword
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