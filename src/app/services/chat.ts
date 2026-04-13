import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { io, Socket } from 'socket.io-client';
import { AuthService } from './auth';
import { ApiService } from './api.service';

export interface Message {
  sender_id: string | number;
  sender_name: string;
  text: string;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private platformId = inject(PLATFORM_ID);
  private api = inject(ApiService);
  private socket: Socket | null = null;
  private messagesSignal = signal<Message[]>([]);
  messages = this.messagesSignal.asReadonly();
  private authService = inject(AuthService);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const baseUrl = this.api.getBaseUrl().replace(/\/api$/, '');
      this.socket = io(baseUrl || undefined);
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
      sender_id: profile.id,
      sender_name: profile.name || 'User',
      text,
      timestamp: new Date().toISOString()
    };
    this.socket.emit('message', message);

    // Auto-reply logic - only for customers
    if (!this.authService.isAdmin()) {
      this.handleAutoReply(text);
    }
  }

  private handleAutoReply(text: string) {
    const lowerText = text.toLowerCase();
    let response = '';

    if (lowerText.includes('hi') || lowerText.includes('hello') || lowerText.includes('hey')) {
      response = 'Hello! Welcome to IDEA Zone 3D. How can I assist you today?';
    } else if (lowerText.includes('order') || lowerText.includes('status')) {
      response = 'To check your order status, please provide your Order ID or check the "Orders" section in your profile.';
    } else if (lowerText.includes('price') || lowerText.includes('cost')) {
      response = 'Our 3D printing costs vary by material and volume. You can see base prices on our Products page.';
    } else if (lowerText.includes('material') || lowerText.includes('pla') || lowerText.includes('petg')) {
      response = 'We primarily work with high-grade PLA, PETG, and ABS. Which one are you interested in?';
    } else if (lowerText.includes('time') || lowerText.includes('delivery')) {
      response = 'Standard fabrication takes 2-3 days, and shipping usually takes another 3-5 business days.';
    } else if (lowerText.includes('thanks') || lowerText.includes('thank you')) {
      response = "You're very welcome! Let me know if there's anything else I can help with.";
    }

    if (response) {
      this.sendBotMessage(response);
    }
  }

  sendBotMessage(text: string) {
    setTimeout(() => {
      const botMessage: Message = {
        sender_id: 'bot',
        sender_name: 'IDEA Zone Bot',
        text,
        timestamp: new Date().toISOString()
      };
      this.messagesSignal.update(msgs => [...msgs, botMessage]);
    }, 1000);
  }
}
