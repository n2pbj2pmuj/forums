
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
    // Added missing required Thread properties
    likes: 0,
    likedBy: [],
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

// Added MOCK_GAMES to resolve module errors in Games.tsx, Details.tsx, and Dashboard.tsx
export const MOCK_GAMES: Game[] = [
  { 
    id: 'g1', 
    title: 'Neon Drift', 
    thumbnail: 'https://picsum.photos/seed/g1/400/225', 
    activePlayers: 1250, 
    rating: 92, 
    creatorName: 'CyberStudio', 
    visits: 150000, 
    description: 'Race through neon streets in this high-speed cyberpunk driving simulator.' 
  },
  { 
    id: 'g2', 
    title: 'Sky Bound', 
    thumbnail: 'https://picsum.photos/seed/g2/400/225', 
    activePlayers: 800, 
    rating: 88, 
    creatorName: 'CloudNine', 
    visits: 85000, 
    description: 'Explore the floating islands and master the art of flight.' 
  },
  { 
    id: 'g3', 
    title: 'Blox Royale', 
    thumbnail: 'https://picsum.photos/seed/g3/400/225', 
    activePlayers: 5400, 
    rating: 95, 
    creatorName: 'ArenaDev', 
    visits: 2500000, 
    description: 'The ultimate battle royale experience on the platform.' 
  },
  { 
    id: 'g4', 
    title: 'Cafe Tycoon', 
    thumbnail: 'https://picsum.photos/seed/g4/400/225', 
    activePlayers: 320, 
    rating: 82, 
    creatorName: 'FoodieGames', 
    visits: 45000, 
    description: 'Build your dream cafe and serve the best coffee in the BlocVerse.' 
  }
];

// Added MOCK_CATALOG to resolve module errors in Catalog.tsx and Details.tsx
export const MOCK_CATALOG: CatalogItem[] = [
  { 
    id: 'i1', 
    name: 'Cyber Horns', 
    type: 'Hat', 
    thumbnail: 'https://api.dicebear.com/7.x/shapes/svg?seed=horns', 
    isLimited: true, 
    creatorName: 'RojoGames', 
    price: 500, 
    description: 'Glow-in-the-dark cybernetic horns for the modern avatar.' 
  },
  { 
    id: 'i2', 
    name: 'Elite Tactical Vest', 
    type: 'Accessory', 
    thumbnail: 'https://api.dicebear.com/7.x/shapes/svg?seed=vest', 
    isLimited: false, 
    creatorName: 'RojoGames', 
    price: 0, 
    description: 'Standard issue tactical gear for community moderators.' 
  },
  { 
    id: 'i3', 
    name: 'Neon Katana', 
    type: 'Gear', 
    thumbnail: 'https://api.dicebear.com/7.x/shapes/svg?seed=katana', 
    isLimited: true, 
    creatorName: 'RojoGames', 
    price: 1200, 
    description: 'A sharp, vibrant blade that slices through the dark.' 
  },
  { 
    id: 'i4', 
    name: 'Crimson Hoodie', 
    type: 'Shirt', 
    thumbnail: 'https://api.dicebear.com/7.x/shapes/svg?seed=hoodie', 
    isLimited: false, 
    creatorName: 'RojoDesign', 
    price: 95, 
    description: 'Comfortable and stylish crimson hoodie.' 
  }
];
