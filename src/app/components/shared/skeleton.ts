import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      [class]="'animate-pulse bg-white/5 rounded-lg ' + className()"
      [style.width]="width()"
      [style.height]="height()"
    >
      <div class="w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
    </div>
  `,
  styles: [`
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
