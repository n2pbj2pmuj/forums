
export enum ModStatus {
  PENDING = 'PENDING',
  RESOLVED = 'RESOLVED',
  DISMISSED = 'DISMISSED'
}

export enum ReportType {
  POST = 'POST',
  THREAD = 'THREAD',
  USER = 'USER',
  ASSET = 'ASSET'
}

export type ThemeMode = 'light' | 'dark';

export interface User {
  id: string;
  username: string;
  displayName: string;
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

export interface SiteAsset {
  id: string;
  name: string;
  imageUrl: string;
  type: 'Banner' | 'GlobalAlert';
  isActive: boolean;
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

/**
 * Interface representing a game in the platform.
 */
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

/**
 * Interface representing an item in the avatar shop catalog.
 */
export interface CatalogItem {
  id: string;
  name: string;
  thumbnail: string;
  type: string;
  creatorName: string;
  price: number;
  isLimited: boolean;
  description: string;
}
