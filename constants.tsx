
import { User, ForumCategory, Thread, Post, Report, ReportType, ModStatus, Game, CatalogItem } from './types';

export const DEFAULT_AVATAR = 'https://api.dicebear.com/7.x/avataaars/svg?seed=default';

export const CURRENT_USER: User = {
  id: 'u-admin',
  username: 'RojoAdmin',
  displayName: 'Admin',
  email: 'admin@rojos.games',
  avatarUrl: DEFAULT_AVATAR,
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
    avatarUrl: DEFAULT_AVATAR, 
    role: 'User', 
    status: 'Active', 
    joinDate: '2023-05-10', 
    postCount: 45, 
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
    title: 'Welcome to RojoGames', 
    content: 'Welcome to the community forums. This is a space for all players to discuss and share.', 
    createdAt: '2026-01-09T10:00:00Z', 
    replyCount: 0, 
    viewCount: 42, 
    likes: 0,
    likedBy: [],
    isLocked: false, 
    isPinned: true 
  }
];

export const MOCK_POSTS: Post[] = [];

export const MOCK_REPORTS: Report[] = [];

// Fixed error: Module '"../constants"' has no exported member 'MOCK_GAMES'
export const MOCK_GAMES: Game[] = [
  {
    id: 'g1',
    title: 'Work at a Pizza Place',
    thumbnail: 'https://picsum.photos/seed/pizza/400/225',
    activePlayers: 12500,
    creatorName: 'Dued1',
    rating: 92,
    visits: 4500000,
    description: 'Work with others to fulfill food orders and use your earnings to upgrade your house and buy furniture!'
  },
  {
    id: 'g2',
    title: 'Blox Fruits',
    thumbnail: 'https://picsum.photos/seed/fruits/400/225',
    activePlayers: 450000,
    creatorName: 'Gamer Robot',
    rating: 95,
    visits: 25000000,
    description: 'Welcome to Blox Fruits! Become a master swordsman or a powerful blox fruit user as you train to become the strongest player to ever live.'
  },
  {
    id: 'g3',
    title: 'Adopt Me!',
    thumbnail: 'https://picsum.photos/seed/adopt/400/225',
    activePlayers: 180000,
    creatorName: 'DreamCraft',
    rating: 90,
    visits: 35000000,
    description: 'The #1 place to raise cute pets and decorate your house with friends!'
  }
];

// Fixed error: Module '"../constants"' has no exported member 'MOCK_CATALOG'
export const MOCK_CATALOG: CatalogItem[] = [
  {
    id: 'i1',
    name: 'Red Valkyrie',
    thumbnail: 'https://picsum.photos/seed/valk/300/300',
    type: 'Hat',
    isLimited: true,
    creatorName: 'RojoGames',
    price: 50000,
    description: 'A legendary crimson helm for the bravest warriors.'
  },
  {
    id: 'i2',
    name: 'Classic Fedora',
    thumbnail: 'https://picsum.photos/seed/fedora/300/300',
    type: 'Hat',
    isLimited: false,
    creatorName: 'RojoGames',
    price: 250,
    description: 'A timeless piece of headwear for the sophisticated player.'
  },
  {
    id: 'i3',
    name: 'Rojo Community Tee',
    thumbnail: 'https://picsum.photos/seed/shirt/300/300',
    type: 'Shirt',
    isLimited: false,
    creatorName: 'RojoGames',
    price: 0,
    description: 'Official community shirt. Show your pride!'
  }
];
