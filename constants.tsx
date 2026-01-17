
import { User, ForumCategory, Thread, Post, Report, ReportType, ModStatus, Game, CatalogItem } from './types';

export const CURRENT_USER: User = {
  id: 'u-admin',
  username: 'RojoAdmin',
  displayName: 'Rojo Administrator',
  avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rojo',
  role: 'Admin',
  status: 'Active',
  joinDate: '2023-01-01',
  postCount: 1337,
  themePreference: 'dark'
};

export const ADMIN_USER = CURRENT_USER;

export const MOCK_USERS: User[] = [
  { id: 'u1', username: 'TechGuru', displayName: 'John Doe', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John', role: 'User', status: 'Active', joinDate: '2023-05-10', postCount: 45, themePreference: 'dark' },
  { id: 'u2', username: 'TrollFace', displayName: 'Anonymous', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Troll', role: 'User', status: 'Warned', joinDate: '2024-02-15', postCount: 12, themePreference: 'dark' },
  { id: 'u3', username: 'ModSarah', displayName: 'Sarah Jenkins', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah', role: 'Moderator', status: 'Active', joinDate: '2023-03-20', postCount: 890, themePreference: 'dark' }
];

export const MOCK_CATEGORIES: ForumCategory[] = [
  { id: 'cat1', title: 'Rojo Announcements', description: 'Official updates from the RojosGames dev team.', icon: '🔴', threadCount: 12 },
  { id: 'cat2', title: 'Community Lounge', description: 'Hang out and chat with other members.', icon: '🍷', threadCount: 1540 },
  { id: 'cat3', title: 'Game Development', description: 'Share your rojo-powered game projects.', icon: '🎮', threadCount: 432 },
  { id: 'cat4', title: 'Resource Marketplace', description: 'Scripts, assets, and UI components.', icon: '📦', threadCount: 89 }
];

export const MOCK_THREADS: Thread[] = [
  { id: 't1', categoryId: 'cat1', authorId: 'u-admin', authorName: 'RojoAdmin', title: 'RojosGames v3.0 Is Now Live!', content: 'The wait is over. Our new forum architecture is faster and redder than ever.', createdAt: '2024-05-01T10:00:00Z', replyCount: 24, viewCount: 1200, isLocked: false, isPinned: true },
  { id: 't2', categoryId: 'cat2', authorId: 'u1', authorName: 'TechGuru', title: 'Best Red UI Themes for 2024?', content: 'I want to build a site that looks like this one. What CSS filters should I use?', createdAt: '2024-05-05T14:30:00Z', replyCount: 85, viewCount: 3400, isLocked: false, isPinned: false }
];

export const MOCK_POSTS: Post[] = [
  { id: 'p1', threadId: 't2', authorId: 'u3', authorName: 'ModSarah', content: 'Try using backdrop-blur and a subtle red overlay.', createdAt: '2024-05-05T15:00:00Z', likes: 12, likedBy: [] },
  { id: 'p2', threadId: 't2', authorId: 'u2', authorName: 'TrollFace', content: 'Just make everything red. Simple.', createdAt: '2024-05-05T16:20:00Z', likes: -2, likedBy: [] }
];

export const MOCK_REPORTS: Report[] = [
  { id: 'r1', type: ReportType.POST, targetId: 'p2', reportedBy: 'u1', reason: 'Low effort/Spam', contentSnippet: 'Just make everything red...', status: ModStatus.PENDING, createdAt: '2024-05-05T17:00:00Z' },
  { id: 'r2', type: ReportType.USER, targetId: 'u2', reportedBy: 'u3', reason: 'Repeated community violations', contentSnippet: 'User Profile: TrollFace', status: ModStatus.PENDING, createdAt: '2024-05-06T09:15:00Z' }
];

// Added MOCK_GAMES for discovery and dashboard pages
export const MOCK_GAMES: Game[] = [
  {
    id: 'g-1',
    title: 'Neon Drift',
    description: 'High-speed racing through a red-soaked cyberpunk city.',
    thumbnail: 'https://picsum.photos/seed/ndrift/800/600',
    creatorName: 'RojoStudios',
    activePlayers: 4500,
    rating: 95,
    visits: 12000000
  },
  {
    id: 'g-2',
    title: 'Crimson Conquest',
    description: 'Battle for territory in this strategic military simulator.',
    thumbnail: 'https://picsum.photos/seed/cconq/800/600',
    creatorName: 'WarLord_Games',
    activePlayers: 1200,
    rating: 88,
    visits: 3400000
  },
  {
    id: 'g-3',
    title: 'Red Block Obby',
    description: 'Can you survive the 500 levels of red-hot parkour?',
    thumbnail: 'https://picsum.photos/seed/obby/800/600',
    creatorName: 'ParkourMaster',
    activePlayers: 850,
    rating: 82,
    visits: 1500000
  },
  {
    id: 'g-4',
    title: 'Blox-a-Rojo',
    description: 'The ultimate social experience in a virtual red world.',
    thumbnail: 'https://picsum.photos/seed/blox/800/600',
    creatorName: 'SocialDevs',
    activePlayers: 3200,
    rating: 91,
    visits: 25000000
  }
];

// Added MOCK_CATALOG for avatar shop and item details pages
export const MOCK_CATALOG: CatalogItem[] = [
  {
    id: 'i-1',
    name: 'Cybernetic Red Visor',
    description: 'A tactical visor with advanced red-spectrum HUD.',
    thumbnail: 'https://picsum.photos/seed/visor/400/400',
    creatorName: 'CyberGear',
    price: 450,
    type: 'Hat',
    isLimited: true
  },
  {
    id: 'i-2',
    name: 'Crimson Wings of Valor',
    description: 'Legendary wings that signify immense bravery.',
    thumbnail: 'https://picsum.photos/seed/wings/400/400',
    creatorName: 'MythicItems',
    price: 15000,
    type: 'Accessory',
    isLimited: true
  },
  {
    id: 'i-3',
    name: 'Rojo Developer Hoodie',
    description: 'The official hoodie for RojosGames developers.',
    thumbnail: 'https://picsum.photos/seed/hoodie/400/400',
    creatorName: 'RojoGames',
    price: 0,
    type: 'Shirt',
    isLimited: false
  },
  {
    id: 'i-4',
    name: 'Plasma Sword',
    description: 'A glowing energy blade capable of cutting through any block.',
    thumbnail: 'https://picsum.photos/seed/sword/400/400',
    creatorName: 'Futurist',
    price: 800,
    type: 'Gear',
    isLimited: false
  }
];
