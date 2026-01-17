
export enum ModStatus {
  PENDING = 'PENDING',
  RESOLVED = 'RESOLVED',
  DISMISSED = 'DISMISSED'
}

export enum ReportType {
  POST = 'POST',
  THREAD = 'THREAD',
  USER = 'USER'
}

export type ThemeMode = 'light' | 'dark';

export interface User {
  id: string;
  username: string;
  displayName: string;
  email: string;
  avatarUrl: string;
  bannerUrl?: string;
  role: 'User' | 'Moderator' | 'Admin';
  status: 'Active' | 'Warned' | 'Banned';
  joinDate: string;
  postCount: number;
  about?: string;
  themePreference: ThemeMode;
  banReason?: string;
  banExpires?: string;
}

export interface ForumCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
  threadCount: number;
}

export interface Thread {
  id: string;
  categoryId: string;
  authorId: string;
  authorName: string;
  title: string;
  content: string;
  createdAt: string;
  replyCount: number;
  viewCount: number;
  isLocked: boolean;
  isPinned: boolean;
}

export interface Post {
  id: string;
  threadId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
  likes: number;
  likedBy: string[];
}

export interface Report {
  id: string;
  type: ReportType;
  targetId: string;
  reportedBy: string;
  reason: string;
  contentSnippet: string;
  status: ModStatus;
  createdAt: string;
}

// Added Game interface to fix import errors in pages/Games.tsx, Details.tsx, and Dashboard.tsx
export interface Game {
  id: string;
  title: string;
  thumbnail: string;
  activePlayers: number;
  rating: number;
  creatorName: string;
  visits: number;
  description: string;
}

// Added CatalogItem interface to fix import errors in pages/Catalog.tsx and Details.tsx
export interface CatalogItem {
  id: string;
  name: string;
  type: 'Hat' | 'Shirt' | 'Gear' | 'Accessory';
  thumbnail: string;
  isLimited: boolean;
  creatorName: string;
  price: number;
  description: string;
}
