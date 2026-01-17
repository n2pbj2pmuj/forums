
import { User, ForumCategory, Thread, Post, Report, ReportType, ModStatus, Game, CatalogItem } from './types';

export const CURRENT_USER: User = {
  id: 'u-admin',
  username: 'RojoAdmin',
  displayName: 'Rojo Administrator',
  avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=RojoAdmin',
  role: 'Admin',
  status: 'Active',
  joinDate: '2023-01-01',
  postCount: 1337,
  themePreference: 'dark'
};

// Aliasing CURRENT_USER as ADMIN_USER for compatibility with Dashboard.tsx
export const ADMIN_USER = CURRENT_USER;

export const MOCK_USERS: User[] = [
  { id: 'u1', username: 'ViperGrid', displayName: 'Viper', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Viper', role: 'User', status: 'Active', joinDate: '2023-05-10', postCount: 45, themePreference: 'dark' },
  { id: 'u2', username: 'NeonProtocol', displayName: 'Neon', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Neon', role: 'User', status: 'Active', joinDate: '2024-02-15', postCount: 12, themePreference: 'dark' },
  { id: 'u3', username: 'Mod_Sarah', displayName: 'Sarah Jenkins', avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah', role: 'Moderator', status: 'Active', joinDate: '2023-03-20', postCount: 890, themePreference: 'dark' }
];

export const MOCK_CATEGORIES: ForumCategory[] = [
  { id: 'cat1', title: 'Grid Announcements', description: 'Official updates from the RojosGames core team.', icon: '🔴', threadCount: 12 },
  { id: 'cat2', title: 'Community Sector', description: 'General discussion and social sync.', icon: '🍷', threadCount: 1540 },
  { id: 'cat3', title: 'Code Terminal', description: 'Discuss logic and Rojo scripting.', icon: '💻', threadCount: 432 }
];

export const MOCK_THREADS: Thread[] = [
  { id: 't1', categoryId: 'cat1', authorId: 'u-admin', authorName: 'RojoAdmin', title: 'RojosGames V2: Architecture Overhaul', content: 'Our new grid system is now fully synchronized with the red protocol.', createdAt: '2024-05-01T10:00:00Z', replyCount: 24, viewCount: 1200, isLocked: false, isPinned: true },
  { id: 't2', categoryId: 'cat2', authorId: 'u1', authorName: 'ViperGrid', title: 'Best Cyber-Red UI Components?', content: 'Seeking the sharpest UI kits for my next project. Any recommendations?', createdAt: '2024-05-05T14:30:00Z', replyCount: 85, viewCount: 3400, isLocked: false, isPinned: false }
];

export const MOCK_POSTS: Post[] = [
  { id: 'p1', threadId: 't2', authorId: 'u3', authorName: 'Mod_Sarah', content: 'Check the Code Terminal for the latest Rojo UI primitives.', createdAt: '2024-05-05T15:00:00Z', likes: 12, likedBy: [] }
];

export const MOCK_REPORTS: Report[] = [
  { id: 'r1', type: ReportType.POST, targetId: 'p1', reportedBy: 'u2', reason: 'False Information', contentSnippet: 'Check the Code Terminal...', status: ModStatus.PENDING, createdAt: '2024-05-05T17:00:00Z' }
];

/**
 * Mock data for the games section.
 */
export const MOCK_GAMES: Game[] = [
  {
    id: 'g1',
    title: 'Neon Drift: Overdrive',
    thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80',
    activePlayers: 4500,
    rating: 92,
    creatorName: 'CyberRojo',
    visits: 1200000,
    description: 'High-speed racing in a cyberpunk wasteland. Sync your drift and dominate the grid.'
  },
  {
    id: 'g2',
    title: 'Grid Breaker',
    thumbnail: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&w=800&q=80',
    activePlayers: 1200,
    rating: 88,
    creatorName: 'NeonForge',
    visits: 450000,
    description: 'Break the code, solve the puzzles, and escape the digital labyrinth.'
  },
  {
    id: 'g3',
    title: 'Red Protocol: Warzone',
    thumbnail: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
    activePlayers: 8900,
    rating: 95,
    creatorName: 'WarMaster',
    visits: 5600000,
    description: 'The ultimate tactical shooter. Protect the core from hostile entities.'
  },
  {
    id: 'g4',
    title: 'Byte City Life',
    thumbnail: 'https://images.unsplash.com/photo-1605898835518-22020fa502c4?auto=format&fit=crop&w=800&q=80',
    activePlayers: 2300,
    rating: 85,
    creatorName: 'PixelWorld',
    visits: 890000,
    description: 'Live your best digital life in Byte City. Trade assets, build homes, and socialize.'
  }
];

/**
 * Mock data for the avatar shop catalog.
 */
export const MOCK_CATALOG: CatalogItem[] = [
  {
    id: 'i1',
    name: 'Cyber-Visor V1',
    thumbnail: 'https://images.unsplash.com/photo-1573164713988-89a51150c221?auto=format&fit=crop&w=400&q=80',
    type: 'Accessory',
    creatorName: 'RojoGear',
    price: 450,
    isLimited: true,
    description: 'Enhanced vision for the digital frontier. Features real-time grid mapping.'
  },
  {
    id: 'i2',
    name: 'Red Grid Suit',
    thumbnail: 'https://images.unsplash.com/photo-1539533113208-f6df8cc8b543?auto=format&fit=crop&w=400&q=80',
    type: 'Shirt',
    creatorName: 'StyleSync',
    price: 0,
    isLimited: false,
    description: 'Standard issue attire for the elite members of the Rojo community. Durable and stylish.'
  },
  {
    id: 'i3',
    name: 'Neon Katana',
    thumbnail: 'https://images.unsplash.com/photo-1589131842235-98317a781566?auto=format&fit=crop&w=400&q=80',
    type: 'Gear',
    creatorName: 'BladeRunner',
    price: 1500,
    isLimited: true,
    description: 'A sharp blade for a sharp mind. Cuts through data streams with ease. Emits a red glow.'
  },
  {
    id: 'i4',
    name: 'Sync-Helmet',
    thumbnail: 'https://images.unsplash.com/photo-1544652478-6653e09f18a2?auto=format&fit=crop&w=400&q=80',
    type: 'Hat',
    creatorName: 'RojoGear',
    price: 300,
    isLimited: false,
    description: 'Protect your neural link with this reinforced sync-helmet. Standard protection for all citizens.'
  }
];
