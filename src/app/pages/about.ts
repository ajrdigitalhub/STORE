import { Component, inject } from '@angular/core';
import { ConfigService } from '../services/config';

@Component({
  selector: 'app-about',
  standalone: true,
  template: `
    <div class="min-h-screen pt-32 pb-20 px-6">
      <div class="max-w-4xl mx-auto">
        <h1 class="text-5xl font-black uppercase tracking-tighter mb-12 text-center">{{ configService.config().about.title || 'About Us' }}</h1>
        
        <div class="glass-card overflow-hidden">
          @if (configService.config().about.imageUrl) {
            <img [src]="configService.config().about.imageUrl" alt="About Us" class="w-full h-96 object-cover" referrerpolicy="no-referrer">
          }
          <div class="p-12">
            <div class="prose prose-invert max-w-none">
              <p class="text-xl leading-relaxed text-accent-muted whitespace-pre-line">
                {{ configService.config().about.content || 'Information about the company will appear here.' }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AboutComponent {
  configService = inject(ConfigService);
}
