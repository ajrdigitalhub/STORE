import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { environment } from '../../environments/environment';
// Import AuthService only for type if needed, but we used token parameter to avoid circular dependency
import { ToastService } from './toast.service';

@Injectable({ providedIn: 'root' })
export class SocketService {
  private socket: Socket | null = null;
  
  private adminOrderUpdateSubject = new Subject<any>();
  public adminOrderUpdate$ = this.adminOrderUpdateSubject.asObservable();

  private customerOrderUpdateSubject = new Subject<any>();
  public customerOrderUpdate$ = this.customerOrderUpdateSubject.asObservable();

  private connectedSubject = new BehaviorSubject<boolean>(false);
  public connected$ = this.connectedSubject.asObservable();

  constructor(private toastService: ToastService) {
    this.adminOrderUpdate$.subscribe(data => {
      if (data.type === 'new') {
        this.toastService.show(`🎉 New Order Received! #${data.order.orderNumber}`, 'order');
      } else if (data.type === 'payment') {
        this.toastService.show(`💰 Payment Verified! #${data.order.orderNumber}`, 'success');
      }
    });

    this.customerOrderUpdate$.subscribe(data => {
      if (data.type === 'status') {
        this.toastService.show(`📦 Order Updated: Your order #${data.order.orderNumber} is now ${data.status.toUpperCase()}! ✨`, 'info');
      }
    });
  }

  public connect(token: string): void {
    if (!token) return;
    
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return;
    }

    this.socket = io(environment.serverUrl, {
      auth: { token }
    });

    this.socket.on('connect', () => {
      this.connectedSubject.next(true);
      console.log('Socket connected');
    });

    this.socket.on('disconnect', () => {
      this.connectedSubject.next(false);
      console.log('Socket disconnected');
    });

    // Listen for admin events
    this.socket.on('admin:orderUpdate', (data: any) => {
      this.adminOrderUpdateSubject.next(data);
    });

    // Listen for customer events
    this.socket.on('customer:orderUpdate', (data: any) => {
      this.customerOrderUpdateSubject.next(data);
    });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.connectedSubject.next(false);
  }

  emit(event: string, data?: any): void {
    this.socket?.emit(event, data);
  }

  on(event: string, callback: (data: any) => void): void {
    this.socket?.on(event, callback);
  }
}
