import { Injectable, signal, computed, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { auth } from '../firebase';
import { onAuthStateChanged, User, signOut, signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
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
  uid: string;
  email: string | null;
  displayName: string | null;
  role: 'customer' | 'admin';
  avatar_url?: string;
  phone?: string;
  address?: string | null;
  createdAt: string;
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
      onAuthStateChanged(auth, async (user) => {
        this.userSignal.set(user);
        if (user) {
          await this.syncProfile(user);
        } else {
          this.profileSignal.set(null);
        }
        this.isAuthReadySignal.set(true);
      });
    } else {
      this.isAuthReadySignal.set(true);
    }
  }

  private async syncProfile(user: User) {
    try {
      // Try to get profile from our DB
      const profile = await firstValueFrom(this.api.get<UserProfile>(`/auth/profile/${user.uid}`));
      this.profileSignal.set(profile);
    } catch {
      // If not found, register them
      const newProfile = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        role: user.email === 'ajrgroupconnect@gmail.com' ? 'admin' : 'customer'
      };
      try {
        const profile = await firstValueFrom(this.api.post<UserProfile>('/auth/register', newProfile));
        this.profileSignal.set(profile);
      } catch (regError) {
        console.error('Failed to sync profile', regError);
      }
    }
  }

  async loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  }

  async loginWithEmail(email: string, pass: string) {
    if (email === 'admin@ideazone.com' && pass === 'admin123') {
      try {
        return await signInWithEmailAndPassword(auth, email, pass);
      } catch (error: unknown) {
        // If user doesn't exist, try to register them automatically for this static account
        const authError = error as { code?: string };
        if (authError.code === 'auth/user-not-found' || authError.code === 'auth/invalid-credential' || authError.code === 'auth/invalid-login-credentials') {
          try {
            return await this.registerWithEmail(email, pass, 'IDEA Admin');
          } catch {
            // If registration fails (e.g. already exists but wrong pass), throw original error
            throw error;
          }
        }
        throw error;
      }
    }
    return signInWithEmailAndPassword(auth, email, pass);
  }

  async registerWithEmail(email: string, pass: string, name: string) {
    const credential = await createUserWithEmailAndPassword(auth, email, pass);
    if (credential.user) {
      await updateProfile(credential.user, { displayName: name });
      await this.syncProfile(credential.user);
    }
    return credential;
  }

  async logout() {
    return signOut(auth);
  }
}
