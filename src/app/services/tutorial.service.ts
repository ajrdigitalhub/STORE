import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import { firstValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';

export interface TutorialCategory {
  id: number;
  name: string;
  description?: string;
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface Tutorial {
  id: number;
  title: string;
  subtitle?: string;
  description: string;
  thumbnail_url?: string;
  video_url: string;
  category_id?: number;
  category_name?: string;
  duration: string;
  difficulty?: string;
  display_order: number;
  status: 'draft' | 'published';
  resources?: { name: string; url: string }[];
  percentage_watched?: number;
  completed?: boolean;
  product_ids: number[];
  created_at?: string;
  updated_at?: string;
}

export interface UserTutorialProgress {
  id: number;
  user_id: number;
  tutorial_id: number;
  last_watched_position: number;
  percentage_watched: number;
  completed: boolean;
  first_viewed_at?: string;
  last_viewed_at?: string;
  total_watch_time: number;
  sessions_count: number;
}

export interface AdminOverallStats {
  totalTutorials: number;
  totalCategories: number;
  totalVideoViews: number;
  totalWatchTime: number;
  activeLearners: number;
  completedTutorials: number;
  averageCompletionRate: number;
  popularTutorials: { id: number; title: string; views_count: string }[];
}

export interface TutorialStats {
  totalPlays: number;
  uniqueViewers: number;
  completionRate: number;
  averageWatchTime: number;
  activeDays: { day: string; views_count: string }[];
}

export interface UserStats {
  userId: number;
  userName: string;
  userEmail: string;
  tutorialAccessOverride: boolean;
  purchasedProducts: { id: number; name: string }[];
  accessibleTutorialsCount: number;
  tutorialsWatchedCount: number;
  watchHistory: { id: number; tutorial_id: number; watched_at: string; duration: number; tutorial_title: string }[];
  totalWatchTime: number;
  completionPercentage: number;
  watchedTutorialsDetails: UserTutorialProgress[];
  explicitTutorialIds?: number[];
}

@Injectable({
  providedIn: 'root'
})
export class TutorialService {
  private api = inject(ApiService);
  private http = inject(HttpClient);

  categories = signal<TutorialCategory[]>([]);
  tutorials = signal<Tutorial[]>([]);
  isLoading = signal(false);

  constructor() {
    this.loadCategories();
  }

  async loadCategories() {
    try {
      const cats = await firstValueFrom(this.api.get<TutorialCategory[]>('/tutorials/categories'));
      this.categories.set(cats);
      return cats;
    } catch (error) {
      console.error('Failed to load tutorial categories', error);
      return [];
    }
  }

  async addCategory(category: Omit<TutorialCategory, 'id'>) {
    const res = await firstValueFrom(this.api.post<TutorialCategory>('/tutorials/categories', category));
    await this.loadCategories();
    return res;
  }

  async updateCategory(id: number, category: Partial<TutorialCategory>) {
    const res = await firstValueFrom(this.api.put<TutorialCategory>(`/tutorials/categories/${id}`, category));
    await this.loadCategories();
    return res;
  }

  async deleteCategory(id: number) {
    const res = await firstValueFrom(this.api.delete(`/tutorials/categories/${id}`));
    await this.loadCategories();
    return res;
  }

  async reorderCategories(orders: { id: number; display_order: number }[]) {
    const res = await firstValueFrom(this.api.post('/tutorials/categories/reorder', { orders }));
    await this.loadCategories();
    return res;
  }

  // Tutorial CRUD
  async loadAdminTutorials(categoryId?: number, search?: string) {
    this.isLoading.set(true);
    try {
      let path = '/tutorials/admin';
      const params: string[] = [];
      if (categoryId) params.push(`categoryId=${categoryId}`);
      if (search) params.push(`search=${encodeURIComponent(search)}`);
      if (params.length > 0) path += `?${params.join('&')}`;

      const list = await firstValueFrom(this.api.get<Tutorial[]>(path));
      this.tutorials.set(list);
      return list;
    } catch (error) {
      console.error('Failed to load admin tutorials', error);
      return [];
    } finally {
      this.isLoading.set(false);
    }
  }

  async loadCustomerTutorials() {
    this.isLoading.set(true);
    try {
      const list = await firstValueFrom(this.api.get<Tutorial[]>('/tutorials'));
      this.tutorials.set(list);
      return list;
    } catch (error) {
      console.error('Failed to load customer tutorials', error);
      return [];
    } finally {
      this.isLoading.set(false);
    }
  }

  async getTutorialDetails(id: number): Promise<{ tutorial: Tutorial; progress: UserTutorialProgress | null } | null> {
    try {
      return await firstValueFrom(this.api.get<{ tutorial: Tutorial; progress: UserTutorialProgress | null }>(`/tutorials/${id}`));
    } catch (error) {
      console.error(`Failed to load tutorial ${id}`, error);
      return null;
    }
  }

  async addTutorial(tutorial: Omit<Tutorial, 'id'>) {
    const res = await firstValueFrom(this.api.post<Tutorial>('/tutorials', tutorial));
    return res;
  }

  async updateTutorial(id: number, tutorial: Partial<Tutorial>) {
    const res = await firstValueFrom(this.api.put<Tutorial>(`/tutorials/${id}`, tutorial));
    return res;
  }

  async deleteTutorial(id: number) {
    return await firstValueFrom(this.api.delete(`/tutorials/${id}`));
  }

  async reorderTutorials(orders: { id: number; display_order: number }[]) {
    return await firstValueFrom(this.api.post('/tutorials/reorder', { orders }));
  }

  // Upload video/thumbnail/resource file specifically for tutorials
  async uploadTutorialFile(file: File, type: 'video' | 'thumbnail' | 'resource', categorySlug?: string): Promise<{ url: string; storagePath?: string }> {
    const formData = new FormData();
    formData.append('file', file);

    let path = `/tutorials/upload?type=${type}`;
    if (categorySlug) {
      path += `&categorySlug=${categorySlug}`;
    }

    // Since our backend api.service.ts post takes body as JSON, 
    // we use standard HttpClient to send multipart/form-data for upload.
    const baseUrl = this.api.getBaseUrl();
    const token = localStorage.getItem('auth_token');
    
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await this.http.post<{ success: boolean; url: string; storagePath?: string }>(
      `${baseUrl}${path}`, 
      formData,
      { headers }
    ).toPromise();

    if (!response || !response.success) {
      throw new Error('Upload failed');
    }

    return { url: response.url, storagePath: response.storagePath };
  }

  // Get secure video streaming URL with token
  getVideoStreamUrl(id: number): string {
    const token = localStorage.getItem('auth_token') || '';
    return `${this.api.getBaseUrl()}/tutorials/${id}/stream?token=${encodeURIComponent(token)}`;
  }

  // Get secure video preview URL for admin by storage path with token
  getVideoPreviewUrl(filePath: string): string {
    const token = localStorage.getItem('auth_token') || '';
    return `${this.api.getBaseUrl()}/tutorials/stream-by-path?filePath=${encodeURIComponent(filePath)}&token=${encodeURIComponent(token)}`;
  }

  // User Progress Logging
  async updateProgress(id: number, lastWatchedPosition: number, percentageWatched: number, watchDuration: number): Promise<UserTutorialProgress> {
    return await firstValueFrom(this.api.post<UserTutorialProgress>(`/tutorials/${id}/progress`, {
      last_watched_position: lastWatchedPosition,
      percentage_watched: percentageWatched,
      watch_duration: watchDuration
    }));
  }

  async logAnalyticsEvent(id: number, eventType: string, eventData: unknown = {}) {
    try {
      await firstValueFrom(this.api.post(`/tutorials/${id}/analytics-event`, { eventType, eventData }));
    } catch (e) {
      console.warn('Analytics event log failed', e);
    }
  }

  // Admin Analytics
  async getOverallStats(): Promise<AdminOverallStats> {
    return await firstValueFrom(this.api.get<AdminOverallStats>('/tutorials/admin/analytics'));
  }

  async getTutorialStats(tutorialId: number): Promise<TutorialStats> {
    return await firstValueFrom(this.api.get<TutorialStats>(`/tutorials/admin/analytics/tutorial/${tutorialId}`));
  }

  async getUserStats(userId: number): Promise<UserStats> {
    return await firstValueFrom(this.api.get<UserStats>(`/tutorials/admin/analytics/user/${userId}`));
  }
}
