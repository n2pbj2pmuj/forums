
import { User, ForumCategory, Thread, Post, Report, ReportType, ModStatus } from './types';

export const CURRENT_USER: User = {
  id: 'u-admin',
  username: 'RojoAdmin',
  displayName: 'Rojo Administrator',
  email: 'admin@rojos.games',
  avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=RojoAdmin',
  role: 'Admin',
  status: 'Active',
  joinDate: '2023-01-01',
  postCount: 1337,
  themePreference: 'dark'
};

export const ADMIN_USER = CURRENT_USER;

export const MOCK_USERS: User[] = [
  { 
    id: 'u1', 
    username: 'ViperGrid', 
    displayName: 'Viper', 
    email: 'viper@rojos.games',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Viper', 
    role: 'User', 
    status: 'Active', 
    joinDate: '2023-05-10', 
    postCount: 45, 
    themePreference: 'dark' 
  },
  { 
    id: 'u2', 
    username: 'NeonProtocol', 
    displayName: 'Neon', 
    email: 'neon@rojos.games',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Neon', 
    role: 'User', 
    status: 'Active', 
    joinDate: '2024-02-15', 
    postCount: 12, 
    themePreference: 'dark' 
  },
  { 
    id: 'u3', 
    username: 'Mod_Sarah', 
    displayName: 'Sarah Jenkins', 
    email: 'sarah@rojos.games',
    avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah', 
    role: 'Moderator', 
    status: 'Active', 
    joinDate: '2023-03-20', 
    postCount: 890, 
    themePreference: 'dark' 
  }
];

export const MOCK_CATEGORIES: ForumCategory[] = [
  { id: 'cat1', title: 'Grid Announcements', description: 'Official updates from the RojosGames core team.', icon: '🔴', threadCount: 1 },
  { id: 'cat2', title: 'Community Sector', description: 'General discussion and social sync.', icon: '🍷', threadCount: 1 },
];

export const MOCK_THREADS: Thread[] = [
  { 
    id: 't1', 
    categoryId: 'cat1', 
    authorId: 'u-admin', 
    authorName: 'RojoAdmin', 
    title: 'Platform Maintenance: Jan 2026', 
    content: 'We are purging legacy game modules to optimize for forum performance.', 
    createdAt: '2026-01-09T10:00:00Z', 
    replyCount: 0, 
    viewCount: 42, 
    isLocked: false, 
    isPinned: true 
  }
];

export const MOCK_POSTS: Post[] = [];

export const MOCK_REPORTS: Report[] = [
  { 
    id: 'r1', 
    type: ReportType.USER, 
    targetId: 'u1', 
    reportedBy: 'u2', 
    reason: 'Suspicious Identity Activity', 
    contentSnippet: 'Identity scan required.', 
    status: ModStatus.PENDING, 
    createdAt: '2026-01-09T17:00:00Z' 
  }
];

// Added missing MOCK_GAMES for legacy pages
export const MOCK_GAMES = [
  { 
    id: 'g1', 
    title: 'Speed Run 4', 
    thumbnail: 'https://picsum.photos/seed/sr4/400/225', 
    activePlayers: 1200, 
    rating: 89, 
    creatorName: 'ViperGrid', 
    visits: 500000, 
    description: 'Fast paced racing action in the grid.' 
  },
  { 
    id: 'g2', 
    title: 'Pizza Tycoon', 
    thumbnail: 'https://picsum.photos/seed/pt/400/225', 
    activePlayers: 800, 
    rating: 85, 
    creatorName: 'NeonProtocol', 
    visits: 200000, 
    description: 'Build your own pizza empire in the digital sector.' 
  },
];

// Added missing MOCK_CATALOG for legacy pages
export const MOCK_CATALOG = [
  { 
    id: 'i1', 
    name: 'Cyberpunk Visor', 
    type: 'Hat', 
    thumbnail: 'https://picsum.photos/seed/cv/300/300', 
    creatorName: 'RojoAdmin', 
    price: 250, 
    isLimited: true, 
    description: 'High-tech optics for advanced grid navigation.' 
  },
  { 
    id: 'i2', 
    name: 'Neon Hoodie', 
    type: 'Shirt', 
    thumbnail: 'https://picsum.photos/seed/nh/300/300', 
    creatorName: 'NeonProtocol', 
    price: 0, 
    isLimited: false, 
    description: 'Glow in the dark style for low-light sectors.' 
  },
];
