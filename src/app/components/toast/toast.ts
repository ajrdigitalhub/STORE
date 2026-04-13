import { Component, inject } from '@angular/core';
import { ToastService } from '../../services/toast.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed top-4 right-4 z-[9999] flex flex-col gap-2">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="px-4 py-3 rounded-lg shadow-lg text-white font-mono text-xs flex items-center gap-3 animate-in fade-in slide-in-from-right-4 duration-300"
             [class.bg-green-600]="toast.type === 'success'"
             [class.bg-red-600]="toast.type === 'error'"
             [class.bg-blue-600]="toast.type === 'info'">
          <span class="material-icons text-sm">{{ toast.type === 'success' ? 'check_circle' : toast.type === 'error' ? 'error' : 'info' }}</span>
          {{ toast.message }}
          <button (click)="toastService.remove(toast.id)" class="ml-2 hover:text-white/80">
            <span class="material-icons text-xs">close</span>
          </button>
        </div>
      }
    </div>
  `
})
export class ToastComponent {
  toastService = inject(ToastService);
}
