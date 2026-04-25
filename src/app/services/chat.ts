import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from './auth';
import { 
  collection, 
  query, 
  onSnapshot, 
  addDoc, 
  setDoc, 
  doc, 
  orderBy, 
  serverTimestamp, 
  Timestamp,
  where
} from 'firebase/firestore';
import { db } from '../firebase';

export interface Message {
  id?: string;
  sender_id: string; // Changed to string for UID
  sender_name: string;
  text: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  timestamp: any; // Using any for Firestore Timestamp/FieldValue compatibility
  customer_id?: string;
}

export interface ChatSession {
  id: string;
  customerId: string;
  customerName: string;
  lastMessage: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  lastMessageAt: any; // Using any for Firestore Timestamp/FieldValue compatibility
  isActive: boolean;
  unreadCount?: number;
  messages?: Message[];
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private platformId = inject(PLATFORM_ID);
  private authService = inject(AuthService);
  
  private messagesSignal = signal<Message[]>([]);
  messages = this.messagesSignal.asReadonly();
  
  private activeChatsSignal = signal<ChatSession[]>([]);
  activeChats = this.activeChatsSignal.asReadonly();

  private selectedChatSignal = signal<ChatSession | null>(null);
  selectedChat = this.selectedChatSignal.asReadonly();

  private isTypingSignal = signal(false);
  isTyping = this.isTypingSignal.asReadonly();

  private unreadCountSignal = signal(0);
  unreadCount = this.unreadCountSignal.asReadonly();

  private isChatOpenSignal = signal(false);
  
  private guestId: string | null = null;
  
  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.guestId = localStorage.getItem('chat_guest_id');
      if (!this.guestId) {
        this.guestId = 'guest_' + Math.random().toString(36).substring(2, 11);
        localStorage.setItem('chat_guest_id', this.guestId);
      }

      this.authService.user$.subscribe(user => {
        if (user) {
          if (this.authService.isAdmin()) {
            this.listenToAllChats();
          } else {
            this.listenToCustomerChat(user.uid);
          }
        } else {
          // If guest, listen to guest chat
          if (this.guestId) {
            this.listenToCustomerChat(this.guestId);
          }
        }
      });
    }
  }

  getEffectiveUserId(): string {
    const user = this.authService.user();
    if (user) return user.uid;
    return this.guestId || 'anonymous';
  }

  setChatOpen(isOpen: boolean) {
    this.isChatOpenSignal.set(isOpen);
    if (isOpen) {
      this.unreadCountSignal.set(0);
    }
  }

  private listenToCustomerChat(userId: string) {
    const messagesRef = collection(db, 'chats', userId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: (doc.get('timestamp', { serverTimestamps: 'estimate' }) as Timestamp)?.toDate() || new Date()
      })) as Message[];
      
      const prevMessages = this.messagesSignal();
      if (messages.length > prevMessages.length && !this.isChatOpenSignal()) {
        const lastMsg = messages[messages.length - 1];
        if (lastMsg.sender_id !== userId) {
          this.unreadCountSignal.update(c => c + 1);
        }
      }
      
      this.messagesSignal.set(messages);
    });
  }

  private listenToAllChats() {
    const chatsRef = collection(db, 'chats');
    const q = query(chatsRef, where('isActive', '==', true), orderBy('lastMessageAt', 'desc'));

    onSnapshot(q, (snapshot) => {
      const chats = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        lastMessageAt: (doc.get('lastMessageAt', { serverTimestamps: 'estimate' }) as Timestamp)?.toDate() || new Date()
      })) as ChatSession[];
      this.activeChatsSignal.set(chats);
    });
  }

  async closeChat(chatId: string) {
    const chatRef = doc(db, 'chats', chatId);
    await setDoc(chatRef, { isActive: false }, { merge: true });
    this.selectedChatSignal.set(null);
    this.messagesSignal.set([]);
  }

  async selectChat(chat: ChatSession | null) {
    this.selectedChatSignal.set(chat);
    if (chat) {
      const messagesRef = collection(db, 'chats', chat.id, 'messages');
      const q = query(messagesRef, orderBy('timestamp', 'asc'));

      onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: (doc.get('timestamp', { serverTimestamps: 'estimate' }) as Timestamp)?.toDate() || new Date()
        })) as Message[];
        this.messagesSignal.set(messages);
      });
    } else {
      this.messagesSignal.set([]);
    }
  }

  async sendMessage(text: string) {
    const profile = this.authService.profile();
    
    const isAdmin = this.authService.isAdmin();
    const userId = this.getEffectiveUserId();
    const selected = this.selectedChatSignal();
    
    const chatId = isAdmin ? selected?.id : userId;
    if (!chatId) return;

    const messageData: Partial<Message> = {
      sender_id: userId,
      sender_name: profile?.name || (isAdmin ? 'Admin' : 'Guest User'),
      text,
      timestamp: serverTimestamp()
    };

    // 1. Add message to subcollection
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    await addDoc(messagesRef, messageData);

    // 2. Update chat session metadata
    const chatRef = doc(db, 'chats', chatId);
    await setDoc(chatRef, {
      customerId: isAdmin ? (selected?.customerId || chatId) : userId,
      customerName: isAdmin ? (selected?.customerName || 'Guest User') : (profile?.name || 'Guest User'),
      lastMessage: text,
      lastMessageAt: serverTimestamp(),
      isActive: true
    }, { merge: true });

    // Handle bot auto-reply for customers
    if (!isAdmin) {
      this.handleAutoReply(text, chatId);
    }
  }

  private handleAutoReply(text: string, chatId: string) {
    const lowerText = text.toLowerCase();
    let response = '';

    if (lowerText.includes('hi') || lowerText.includes('hello') || lowerText.includes('hey')) {
      response = 'Hello! Welcome to IDEAZONE 3D. How can I assist you today?';
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
      setTimeout(async () => {
        await this.sendBotMessage(response, chatId);
        this.isTypingSignal.set(false);
      }, 1500);
    }
  }

  async sendBotMessage(text: string, chatId: string) {
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const botMsg: Partial<Message> = {
      sender_id: 'bot',
      sender_name: 'IDEA Zone Bot',
      text,
      timestamp: serverTimestamp()
    };
    await addDoc(messagesRef, botMsg);

    const chatRef = doc(db, 'chats', chatId);
    await setDoc(chatRef, {
      lastMessage: text,
      lastMessageAt: serverTimestamp()
    }, { merge: true });
  }

  // Legacy support for older components
  loadActiveChats() {
    // No-op for backward compatibility
  }
}


