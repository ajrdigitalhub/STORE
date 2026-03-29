import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (currentToast) {
      <div class="fixed top-6 right-6 z-[100] animate-slide-in">
        <div class="metallic-card px-6 py-4 flex items-center space-x-4 shadow-2xl border-chrome-600/50 min-w-[300px] bg-black/80 backdrop-blur-md">
          <div [ngClass]="getIconClass(currentToast.type)" class="w-10 h-10 rounded-full flex items-center justify-center text-xl">
            {{ getIcon(currentToast.type) }}
          </div>
          <div class="flex-1">
            <p class="text-chrome-100 font-medium text-sm leading-tight">{{ currentToast.message }}</p>
          </div>
          <button (click)="hide()" class="text-chrome-500 hover:text-white transition-colors">
            ✕
          </button>
        </div>
        <!-- Progress bar -->
        <div class="absolute bottom-0 left-0 h-0.5 bg-chrome-400 animate-shrink" [style.animation-duration.ms]="currentToast.duration"></div>
      </div>
    }
  `,
  styles: [`
    @keyframes shrink {
      from { width: 100%; }
      to { width: 0%; }
    }
    .animate-shrink {
      animation-name: shrink;
      animation-timing-function: linear;
      animation-fill-mode: forwards;
    }
    .animate-slide-in {
      animation: slideIn 0.3s ease-out forwards;
    }
    @keyframes slideIn {
      from { transform: translateX(120%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `]
})
export class ToastComponent implements OnInit {
  currentToast: Toast | null = null;

  constructor(private toastService: ToastService) {}

  ngOnInit(): void {
    this.toastService.toast$.subscribe(t => {
      this.currentToast = t;
    });
  }

  hide(): void {
    this.toastService.hide();
  }

  getIcon(type: string): string {
    switch(type) {
      case 'success': return '✅';
      case 'order': return '🛍️';
      case 'error': return '❌';
      case 'email': return '📧';
      default: return '🔔';
    }
  }

  getIconClass(type: string): string {
    switch(type) {
      case 'success': return 'bg-chrome-800 text-green-400';
      case 'order': return 'bg-chrome-800 text-amber-400';
      case 'error': return 'bg-chrome-800 text-red-400';
      default: return 'bg-chrome-800 text-chrome-300';
    }
  }
}
