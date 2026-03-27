import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface ChatMessage {
  sender: string;
  senderName: string;
  text: string;
  timestamp: Date;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private socket: Socket | null = null;
  private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  public messages$ = this.messagesSubject.asObservable();
  private chatListSubject = new BehaviorSubject<any[]>([]);
  public chatList$ = this.chatListSubject.asObservable();
  private connectedSubject = new BehaviorSubject<boolean>(false);
  public connected$ = this.connectedSubject.asObservable();

  constructor(private authService: AuthService) {}

  connect(): void {
    const token = this.authService.getToken();
    if (!token || this.socket?.connected) return;

    this.socket = io(environment.serverUrl, {
      auth: { token }
    });

    this.socket.on('connect', () => {
      this.connectedSubject.next(true);
    });

    this.socket.on('disconnect', () => {
      this.connectedSubject.next(false);
    });

    // Customer receives messages from admin
    this.socket.on('customer:newMessage', (data: any) => {
      const msgs = this.messagesSubject.value;
      this.messagesSubject.next([...msgs, data.message]);
    });

    // Admin receives new messages
    this.socket.on('admin:newMessage', (data: any) => {
      // Update chat list
      this.loadChatList();
    });

    this.socket.on('admin:messageUpdate', (data: any) => {
      this.loadChatList();
    });

    // Chat history response
    this.socket.on('chat:history', (data: any) => {
      this.messagesSubject.next(data.messages || []);
    });

    // Admin chat list response
    this.socket.on('admin:chatList', (chats: any[]) => {
      this.chatListSubject.next(chats);
    });

    this.socket.on('message:sent', (data: any) => {
      const msgs = this.messagesSubject.value;
      this.messagesSubject.next([...msgs, data.message]);
    });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.connectedSubject.next(false);
    this.messagesSubject.next([]);
  }

  sendCustomerMessage(text: string): void {
    const user = this.authService.currentUser;
    this.socket?.emit('customer:send', {
      text,
      customerName: user?.name || 'Customer'
    });
  }

  sendAdminMessage(text: string, customerId: string): void {
    const user = this.authService.currentUser;
    this.socket?.emit('admin:send', {
      text,
      customerId,
      adminName: user?.name || 'Admin'
    });
  }

  loadChatHistory(customerId?: string): void {
    this.socket?.emit('chat:history', { customerId });
  }

  loadChatList(): void {
    this.socket?.emit('admin:getChats');
  }
}
