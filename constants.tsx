
import { User, ForumCategory, Thread, Post, Report, ReportType, ModStatus, Game, CatalogItem } from './types';

export const CURRENT_USER: User = {
  id: 'u-admin',
  username: 'RojoAdmin',
  displayName: 'Admin',
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
    username: 'Viper', 
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
    username: 'Neon', 
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
    displayName: 'Sarah', 
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
  { id: 'cat1', title: 'Announcements', description: 'Official updates and news.', icon: '📢', threadCount: 1 },
  { id: 'cat2', title: 'General Discussion', description: 'Talk about anything community related.', icon: '💬', threadCount: 1 },
];

export const MOCK_THREADS: Thread[] = [
  { 
    id: 't1', 
    categoryId: 'cat1', 
    authorId: 'u-admin', 
    authorName: 'Admin', 
    title: 'Welcome to the New RojoGames Forums', 
    content: 'We have updated our platform to focus on community discussion and simplified our user interface.', 
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
    reason: 'Inappropriate behavior', 
    contentSnippet: 'Review required.', 
    status: ModStatus.PENDING, 
    createdAt: '2026-01-09T17:00:00Z' 
  }
];

// Mock games data for discovery section
export const MOCK_GAMES: Game[] = [
  {
    id: 'g1',
    title: 'Neon Strike',
    description: 'A high-octane cyberpunk shooter where strategy meets speed.',
    thumbnail: 'https://picsum.photos/seed/neonstrike/400/225',
    activePlayers: 1250,
    rating: 92,
    creatorName: 'RojoDev',
    visits: 500000
  },
  {
    id: 'g2',
    title: 'Cyber Runner',
    description: 'Infinite parkour in a digital world of lights and danger.',
    thumbnail: 'https://picsum.photos/seed/cyberrunner/400/225',
    activePlayers: 850,
    rating: 88,
    creatorName: 'NeonGames',
    visits: 320000
  },
  {
    id: 'g3',
    title: 'Grid Legends',
    description: 'Competitive racing on the digital grid. High stakes, high speed.',
    thumbnail: 'https://picsum.photos/seed/gridlegends/400/225',
    activePlayers: 2100,
    rating: 95,
    creatorName: 'RojoAdmin',
    visits: 1200000
  }
];

// Mock catalog data for avatar shop
export const MOCK_CATALOG: CatalogItem[] = [
  {
    id: 'i1',
    name: 'Red Samurai Helmet',
    description: 'A legendary helmet for the modern digital warrior.',
    type: 'Hat',
    thumbnail: 'https://api.dicebear.com/7.x/bottts/svg?seed=helmet',
    creatorName: 'RojoAdmin',
    price: 500,
    isLimited: true
  },
  {
    id: 'i2',
    name: 'Cyber Suit',
    description: 'The latest in digital fashion. Sleek and efficient.',
    type: 'Shirt',
    thumbnail: 'https://api.dicebear.com/7.x/bottts/svg?seed=suit',
    creatorName: 'NeonDev',
    price: 0,
    isLimited: false
  },
  {
    id: 'i3',
    name: 'Laser Katana',
    description: 'Slices through data and opponents with ease.',
    type: 'Gear',
    thumbnail: 'https://api.dicebear.com/7.x/bottts/svg?seed=katana',
    creatorName: 'Viper',
    price: 1500,
    isLimited: true
  }
];
