// TypeScript types for Cozy Haven

export type SeriesStatus = 'ongoing' | 'completed' | 'hiatus';
export type SeriesType = 'manga' | 'manhwa' | 'manhua' | 'light_novel' | 'visual_novel';
export type LibraryStatus = 'reading' | 'completed' | 'planning' | 'dropped';
export type NotificationType = 'new_chapter' | 'new_review' | 'discussion_comment' | 'followed_series_update';

export interface UserProfile {
  id: string;
  username: string;
  bio?: string;
  avatar_url?: string;
  pronouns?: string;
  created_at: string;
  updated_at: string;
}

export interface MangaSeries {
  id: string;
  slug: string;
  title: string;
  description?: string;
  cover_url?: string;
  author?: string;
  status: SeriesStatus;
  series_type: SeriesType;
  genres: string[];
  rating_count: number;
  average_rating: number;
  view_count: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Chapter {
  id: string;
  series_id: string;
  chapter_number: number;
  title?: string;
  description?: string;
  is_paywalled: boolean;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ChapterPage {
  id: string;
  chapter_id: string;
  page_number: number;
  image_url: string;
  storage_path?: string;
  created_at: string;
}

export interface UserLibraryEntry {
  id: string;
  user_id: string;
  series_id: string;
  status: LibraryStatus;
  last_chapter_read?: number;
  notes?: string;
  bookmarked_at?: string;
  created_at: string;
  updated_at: string;
}

export interface RatingReview {
  id: string;
  user_id: string;
  series_id: string;
  rating: number; // 1-5
  review?: string;
  helpful_count: number;
  created_at: string;
  updated_at: string;
}

export interface DiscussionThread {
  id: string;
  series_id?: string;
  user_id: string;
  title: string;
  content: string;
  pinned: boolean;
  locked: boolean;
  comment_count: number;
  view_count: number;
  created_at: string;
  updated_at: string;
  author?: UserProfile; // Join with user_profiles
}

export interface DiscussionComment {
  id: string;
  thread_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  author?: UserProfile; // Join with user_profiles
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  content: string;
  related_series_id?: string;
  related_user_id?: string;
  is_read: boolean;
  created_at: string;
}

// Combined types for API responses

export interface SeriesWithDetails extends MangaSeries {
  chapters?: Chapter[];
  latest_chapter?: Chapter;
  review_count?: number;
  average_rating?: number;
}

export interface ChapterWithPages extends Chapter {
  pages?: ChapterPage[];
  series?: MangaSeries;
}
