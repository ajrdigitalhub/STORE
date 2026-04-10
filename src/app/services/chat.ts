import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { io, Socket } from 'socket.io-client';
import { AuthService } from './auth';

export interface Message {
  id?: string;
  senderUid: string;
  senderName: string;
  text: string;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private platformId = inject(PLATFORM_ID);
  private socket: Socket | null = null;
  private messagesSignal = signal<Message[]>([]);
  messages = this.messagesSignal.asReadonly();
  private authService = inject(AuthService);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.socket = io();
      this.socket.on('message', (message: Message) => {
        this.messagesSignal.update(msgs => [...msgs, message]);
      });
    }
  }

  sendMessage(text: string) {
    if (!this.socket) return;
    const profile = this.authService.profile();
    if (!profile) return;

    const message: Message = {
      senderUid: profile.uid,
      senderName: profile.displayName || 'User',
      text,
      timestamp: new Date().toISOString()
    };
    this.socket.emit('message', message);
  }
}
