import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      [class]="'relative overflow-hidden bg-white/5 rounded-lg ' + className()"
      [style.width]="width()"
      [style.height]="height()"
    >
      <div class="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
    </div>
  `,
  styles: [`
    .animate-shimmer {
      animation: shimmer 2s infinite;
    }
    @keyframes shimmer {
      100% {
        transform: translateX(100%);
      }
    }
  `]
})
export class SkeletonComponent {
  width = input<string>('100%');
  height = input<string>('1rem');
  className = input<string>('');
}
