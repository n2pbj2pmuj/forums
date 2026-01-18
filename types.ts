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
  lastIp?: string;
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
  likes: number;
  likedBy: string[];
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
  authorUsername?: string;
  targetUrl?: string;
  reason: string;
  contentSnippet: string;
  status: ModStatus;
  createdAt: string;
}

export interface Game {
  id: string;
  title: string;
  thumbnail: string;
  activePlayers: number;
  creatorName: string;
  rating: number;
  visits: number;
  description: string;
}

export interface CatalogItem {
  id: string;
  name: string;
  thumbnail: string;
  type: string;
  isLimited: boolean;
  creatorName: string;
  price: number;
  description: string;
}

export interface IpBan {
  id: string;
  ip_address: string;
  reason: string;
  created_at: string;
}