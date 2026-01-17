
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Thread, Post, Report, ModStatus, ReportType, ThemeMode, SiteAsset } from './types';
import { CURRENT_USER, MOCK_USERS, MOCK_THREADS, MOCK_POSTS, MOCK_REPORTS } from './constants';

interface AppState {
  isAuthenticated: boolean;
  currentUser: User;
  originalAdmin: User | null;
  users: User[];
  threads: Thread[];
  posts: Post[];
  reports: Report[];
  assets: SiteAsset[];
  theme: ThemeMode;
  login: (username: string) => void;
  logout: () => void;
  loginAs: (userId: string) => void;
  revertToAdmin: () => void;
  toggleTheme: () => void;
  updateUser: (data: Partial<User>) => void;
  banUser: (userId: string, reason: string, duration: string) => void;
  unbanUser: (userId: string) => void;
  addThread: (title: string, content: string, categoryId: string) => void;
  toggleThreadPin: (threadId: string) => void;
  toggleThreadLock: (threadId: string) => void;
  deleteThread: (threadId: string) => void;
  addPost: (threadId: string, content: string) => void;
  likePost: (postId: string) => void;
  resolveReport: (reportId: string, status: ModStatus) => void;
  addReport: (type: ReportType, targetId: string, reason: string, snippet: string) => void;
  updateGlobalBanner: (assetId: string) => void;
  addGlobalAsset: (name: string, url: string) => void;
}

const AppStateContext = createContext<AppState | undefined>(undefined);

export const AppStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [currentUser, setCurrentUser] = useState<User>({ ...CURRENT_USER, themePreference: 'dark' });
  const [originalAdmin, setOriginalAdmin] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [threads, setThreads] = useState<Thread[]>(MOCK_THREADS);
  const [posts, setPosts] = useState<Post[]>(MOCK_POSTS.map(p => ({ ...p, likedBy: [] })));
  const [reports, setReports] = useState<Report[]>(MOCK_REPORTS);
  const [assets, setAssets] = useState<SiteAsset[]>([
    { id: 'b1', name: 'Cyber Monday Sale', imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80', type: 'Banner', isActive: true },
    { id: 'b2', name: 'Security Alert', imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc48?auto=format&fit=crop&w=1200&q=80', type: 'Banner', isActive: false }
  ]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.classList.toggle('light', theme === 'light');
  }, [theme]);

  const login = (username: string) => {
    const found = [...users, CURRENT_USER].find(u => u.username.toLowerCase() === username.toLowerCase());
    if (found) {
      setCurrentUser(found);
      setIsAuthenticated(true);
    } else {
      // Create a default user if not found in mock data
      const newUser: User = {
        ...CURRENT_USER,
        id: `u-${Date.now()}`,
        username,
        displayName: username,
        role: 'User',
      };
      setUsers(prev => [...prev, newUser]);
      setCurrentUser(newUser);
      setIsAuthenticated(true);
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setOriginalAdmin(null);
  };

  const loginAs = (userId: string) => {
    const target = users.find(u => u.id === userId);
    if (target) {
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

  const updateUser = (data: Partial<User>) => {
    setCurrentUser(prev => ({ ...prev, ...data }));
    setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, ...data } : u));
  };

  const banUser = (userId: string, reason: string, duration: string) => {
    const expires = duration === 'Permanent' ? 'Never' : new Date(Date.now() + parseInt(duration) * 86400000).toLocaleString();
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'Banned', banReason: reason, banExpires: expires } : u));
  };

  const unbanUser = (userId: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'Active', banReason: undefined, banExpires: undefined } : u));
  };

  const addThread = (title: string, content: string, categoryId: string) => {
    const newThread: Thread = {
      id: `t-${Date.now()}`,
      categoryId,
      authorId: currentUser.id,
      authorName: currentUser.displayName,
      title,
      content,
      createdAt: new Date().toISOString(),
      replyCount: 0,
      viewCount: 0,
      isLocked: false,
      isPinned: false,
    };
    setThreads(prev => [newThread, ...prev]);
  };

  const toggleThreadPin = (id: string) => setThreads(prev => prev.map(t => t.id === id ? { ...t, isPinned: !t.isPinned } : t));
  const toggleThreadLock = (id: string) => setThreads(prev => prev.map(t => t.id === id ? { ...t, isLocked: !t.isLocked } : t));
  const deleteThread = (id: string) => setThreads(prev => prev.filter(t => t.id !== id));

  const addPost = (threadId: string, content: string) => {
    const newPost: Post = {
      id: `p-${Date.now()}`,
      threadId,
      authorId: currentUser.id,
      authorName: currentUser.displayName,
      content,
      createdAt: new Date().toISOString(),
      likes: 0,
      likedBy: [],
    };
    setPosts(prev => [...prev, newPost]);
    setThreads(prev => prev.map(t => t.id === threadId ? { ...t, replyCount: t.replyCount + 1 } : t));
  };

  const likePost = (postId: string) => {
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      const isLiked = p.likedBy.includes(currentUser.id);
      return {
        ...p,
        likedBy: isLiked ? p.likedBy.filter(id => id !== currentUser.id) : [...p.likedBy, currentUser.id],
        likes: isLiked ? p.likes - 1 : p.likes + 1
      };
    }));
  };

  const resolveReport = (reportId: string, status: ModStatus) => {
    setReports(prev => prev.map(r => r.id === reportId ? { ...r, status } : r));
  };

  const addReport = (type: ReportType, targetId: string, reason: string, snippet: string) => {
    const newReport: Report = {
      id: `r-${Date.now()}`,
      type,
      targetId,
      reportedBy: currentUser.username,
      reason,
      contentSnippet: snippet,
      status: ModStatus.PENDING,
      createdAt: new Date().toISOString(),
    };
    setReports(prev => [newReport, ...prev]);
  };

  const updateGlobalBanner = (assetId: string) => {
    setAssets(prev => prev.map(a => ({ ...a, isActive: a.id === assetId })));
  };

  const addGlobalAsset = (name: string, url: string) => {
    const newAsset: SiteAsset = {
      id: `b-${Date.now()}`,
      name,
      imageUrl: url,
      type: 'Banner',
      isActive: false
    };
    setAssets(prev => [...prev, newAsset]);
  };

  return (
    <AppStateContext.Provider value={{
      isAuthenticated, login, logout, loginAs, revertToAdmin, originalAdmin, currentUser, users, threads, posts, reports, assets, theme,
      toggleTheme, updateUser, banUser, unbanUser, addThread, 
      toggleThreadPin, toggleThreadLock, deleteThread, addPost, likePost, resolveReport, addReport, updateGlobalBanner, addGlobalAsset
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
