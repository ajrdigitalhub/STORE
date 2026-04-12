import { Injectable, signal, computed, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { auth } from '../firebase';
import { onAuthStateChanged, User, signOut, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { ApiService } from './api.service';
import { firstValueFrom } from 'rxjs';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  console.error('Error: ', error, operationType, path);
  throw new Error(String(error));
}

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  role: 'customer' | 'admin';
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  created_at: string;
  updated_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private platformId = inject(PLATFORM_ID);
  private api = inject(ApiService);
  private userSignal = signal<User | null>(null);
  private profileSignal = signal<UserProfile | null>(null);
  private isAuthReadySignal = signal<boolean>(false);

  user = computed(() => this.userSignal());
  profile = computed(() => this.profileSignal());
  isAuthReady = computed(() => this.isAuthReadySignal());
  isAdmin = computed(() => 
    this.profileSignal()?.role === 'admin' || 
    this.userSignal()?.email === 'ajrgroupconnect@gmail.com' ||
    this.userSignal()?.email === 'admin@ideazone.com'
  );

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('auth_token');
      if (token) {
        this.fetchProfile();
      } else {
        this.isAuthReadySignal.set(true);
      }
      
      onAuthStateChanged(auth, async (user) => {
        this.userSignal.set(user);
        // If Google login via Firebase, we still might want to sync
        if (user && !localStorage.getItem('auth_token')) {
          await this.syncFirebaseUser(user);
        }
      });
    } else {
      this.isAuthReadySignal.set(true);
    }
  }

  private async fetchProfile() {
    try {
      const response = await firstValueFrom(this.api.get<{user: UserProfile}>('/auth/profile'));
      this.profileSignal.set(response.user);
    } catch (error) {
      console.error('Failed to fetch profile', error);
      this.logout();
    } finally {
      this.isAuthReadySignal.set(true);
    }
  }

  private async syncFirebaseUser(user: User) {
    // For Google login, we might need a special route on server
    try {
      const response = await firstValueFrom(this.api.post<{token: string, user: UserProfile}>('/auth/google-sync', {
        email: user.email,
        name: user.displayName,
        uid: user.uid
      }));
      localStorage.setItem('auth_token', response.token);
      this.profileSignal.set(response.user);
    } catch (error) {
      console.error('Firebase sync failed', error);
    }
  }

  async loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  }

  async loginWithEmail(email: string, pass: string) {
    const response = await firstValueFrom(this.api.post<{token: string, user: UserProfile}>('/auth/login', { email, password: pass }));
    localStorage.setItem('auth_token', response.token);
    this.profileSignal.set(response.user);
    return response;
  }

  async registerWithEmail(email: string, pass: string, name: string) {
    const response = await firstValueFrom(this.api.post<{token: string, user: UserProfile}>('/auth/register', { 
      email, 
      password: pass,
      name
    }));
    localStorage.setItem('auth_token', response.token);
    this.profileSignal.set(response.user);
    return response;
  }

  async logout() {
    localStorage.removeItem('auth_token');
    this.profileSignal.set(null);
    this.userSignal.set(null);
    return signOut(auth);
  }
}
