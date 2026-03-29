import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface Toast {
  message: string;
  type: 'success' | 'email' | 'order' | 'info' | 'error';
  duration?: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private toastSubject = new Subject<Toast | null>();
  public toast$ = this.toastSubject.asObservable();

  show(message: string, type: Toast['type'] = 'info', duration: number = 5000): void {
    this.toastSubject.next({ message, type, duration });
    
    if (duration > 0) {
      setTimeout(() => this.hide(), duration);
    }
  }

  success(message: string): void {
    this.show(message, 'success');
  }

  order(message: string): void {
    this.show(message, 'order');
  }

  error(message: string): void {
    this.show(message, 'error');
  }

  hide(): void {
    this.toastSubject.next(null);
  }
}
