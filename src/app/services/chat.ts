import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Socket } from 'socket.io-client';
import { AuthService } from './auth';
import { ApiService } from './api.service';

export interface Message {
  sender_id: string | number;
  sender_name: string;
  text: string;
  timestamp: string;
  customer_id?: string | number; // For admin to know which chat it belongs to
}

export interface ChatSession {
  id: number;
  customer_id: number;
  customer_name: string;
  messages: Message[];
  last_message: string;
  last_message_at: string;
  is_active: boolean;
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
  
  private activeChatsSignal = signal<ChatSession[]>([]);
  activeChats = this.activeChatsSignal.asReadonly();

  private selectedChatSignal = signal<ChatSession | null>(null);
  selectedChat = this.selectedChatSignal.asReadonly();

  private authService = inject(AuthService);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      // Socket.IO disabled as per user request
      /*
      const baseUrl = this.api.getBaseUrl().replace(/\/api$/, '');
      this.socket = io(baseUrl || undefined);
      
      this.socket.on('message', (message: Message) => {
        // If customer, just append
        if (!this.authService.isAdmin()) {
          this.messagesSignal.update(msgs => [...msgs, message]);
        } else {
          // If admin, check if it belongs to selected chat
          const selected = this.selectedChatSignal();
          if (selected && (message.sender_id === selected.customer_id || message.customer_id === selected.customer_id)) {
            this.messagesSignal.update(msgs => [...msgs, message]);
          }
        }
      });

      this.socket.on('chat-update', (chat: ChatSession) => {
        if (this.authService.isAdmin()) {
          this.activeChatsSignal.update(chats => {
            const index = chats.findIndex(c => c.id === chat.id);
            if (index > -1) {
              const newChats = [...chats];
              newChats[index] = chat;
              return newChats.sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());
            }
            return [chat, ...chats];
          });
        }
      });

      // Initial join
      this.authService.user$.subscribe(user => {
        if (user) {
          if (user.role === 'admin') {
            this.socket?.emit('join-admin');
            this.loadActiveChats();
          } else {
            this.socket?.emit('join-customer', user.id);
            this.loadChatHistory();
          }
        }
      });
      */

      // Initial join (HTTP only)
      this.authService.user$.subscribe((user: any) => {
        if (user) {
          if (user.role === 'admin') {
            this.loadActiveChats();
          } else {
            this.loadChatHistory();
          }
        }
      });
    }
  }

  public loadActiveChats() {
    this.api.get<ChatSession[]>('/chats/active').subscribe(chats => {
      this.activeChatsSignal.set(chats);
    });
  }

  private loadChatHistory() {
    this.api.get<ChatSession>('/chats/history').subscribe(chat => {
      if (chat) {
        this.messagesSignal.set(chat.messages);
      }
    });
  }

  selectChat(chat: ChatSession) {
    this.selectedChatSignal.set(chat);
    this.messagesSignal.set(chat.messages);
  }

  sendMessage(text: string) {
    if (!this.socket) return;
    const profile = this.authService.profile();
    if (!profile) return;

    const isAdmin = this.authService.isAdmin();
    const selected = this.selectedChatSignal();

    interface SocketMessage {
      sender_id: string | number;
      sender_name: string;
      text: string;
      is_admin: boolean;
      recipient_id?: string | number;
    }

    const message: SocketMessage = {
      sender_id: profile.id,
      sender_name: profile.name || 'User',
      text,
      is_admin: isAdmin
    };

    if (isAdmin && selected) {
      message.recipient_id = selected.customer_id;
    }

    this.socket.emit('message', message);

    // Local sync for sender (Socket.IO will broadcast back but we can append immediately for better UX)
    const localMsg: Message = {
      sender_id: profile.id,
      sender_name: profile.name || 'User',
      text,
      timestamp: new Date().toISOString()
    };
    this.messagesSignal.update(msgs => [...msgs, localMsg]);

    // Auto-reply logic - only for customers
    if (!isAdmin) {
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
      this.isTypingSignal.set(true);
      setTimeout(() => {
        this.sendBotMessage(response);
        this.isTypingSignal.set(false);
      }, 1500);
    }
  }

  private isTypingSignal = signal(false);
  isTyping = this.isTypingSignal.asReadonly();

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
