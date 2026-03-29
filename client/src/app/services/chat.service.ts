import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { SocketService } from './socket.service';

export interface ChatMessage {
  sender: string;
  senderName: string;
  text: string;
  timestamp: Date;
}

@Injectable({ providedIn: 'root' })
export class ChatService {
  private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  public messages$ = this.messagesSubject.asObservable();
  private chatListSubject = new BehaviorSubject<any[]>([]);
  public chatList$ = this.chatListSubject.asObservable();
  private connectedSubject = new BehaviorSubject<boolean>(false);
  public connected$ = this.connectedSubject.asObservable();

  constructor(private authService: AuthService, private socketService: SocketService) {}

  connect(): void {
    const token = this.authService.getToken();
    if (token) {
      this.socketService.connect(token);
    }
    
    // Listen to messages using socketService.on if needed, or register here
    this.socketService.on('customer:newMessage', (data: any) => {
      const msgs = this.messagesSubject.value;
      this.messagesSubject.next([...msgs, data.message]);
    });

    this.socketService.on('admin:newMessage', (data: any) => {
      this.loadChatList();
    });

    this.socketService.on('admin:messageUpdate', (data: any) => {
      this.loadChatList();
    });

    this.socketService.on('chat:history', (data: any) => {
      this.messagesSubject.next(data.messages || []);
    });

    this.socketService.on('admin:chatList', (chats: any[]) => {
      this.chatListSubject.next(chats);
    });

    this.socketService.on('message:sent', (data: any) => {
      const msgs = this.messagesSubject.value;
      this.messagesSubject.next([...msgs, data.message]);
    });
  }

  disconnect(): void {
    this.socketService.disconnect();
    this.messagesSubject.next([]);
  }

  sendCustomerMessage(text: string): void {
    const user = this.authService.currentUser;
    this.socketService.emit('customer:send', {
      text,
      customerName: user?.name || 'Customer'
    });
  }

  sendAdminMessage(text: string, customerId: string): void {
    const user = this.authService.currentUser;
    this.socketService.emit('admin:send', {
      text,
      customerId,
      adminName: user?.name || 'Admin'
    });
  }

  loadChatHistory(customerId?: string): void {
    this.socketService.emit('chat:history', { customerId });
  }

  loadChatList(): void {
    this.socketService.emit('admin:getChats');
  }
}
