import { Component, inject } from '@angular/core';
import { ConfigService } from '../services/config';

@Component({
  selector: 'app-about',
  standalone: true,
  template: `
    <div class="min-h-screen bg-metallic-black">
      <!-- Hero Section -->
      <section class="relative h-[70vh] flex items-center justify-center overflow-hidden">
        <div class="absolute inset-0 z-0">
          <img 
            [src]="configService.config().about.imageUrl" 
            alt="About Hero" 
            class="w-full h-full object-cover opacity-40 scale-105"
            referrerpolicy="no-referrer"
          >
          <div class="absolute inset-0 bg-gradient-to-b from-metallic-black/20 via-metallic-black/60 to-metallic-black"></div>
        </div>
        
        <div class="relative z-10 max-w-5xl mx-auto px-4 text-center">
          <div class="tech-label mb-6 inline-block px-4 py-1 border border-accent/30 rounded-full bg-accent/5">Established 2020</div>
          <h1 class="text-6xl md:text-8xl font-black uppercase tracking-tighter mb-6 leading-none">
            {{ configService.config().about.title }}
          </h1>
          <p class="text-xl md:text-2xl text-accent-muted max-w-2xl mx-auto font-light leading-relaxed">
            {{ configService.config().about.subtitle }}
          </p>
        </div>
      </section>

      <!-- Main Content -->
      <section class="py-24 px-4">
        <div class="max-w-6xl mx-auto">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center mb-32">
            <div class="space-y-8">
              <h2 class="text-4xl font-bold tracking-tight">Our Story</h2>
              <div class="prose prose-invert max-w-none">
                <p class="text-lg text-accent-muted leading-relaxed whitespace-pre-line">
                  {{ configService.config().about.content }}
                </p>
              </div>
            </div>
            <div class="relative">
              <div class="aspect-square rounded-3xl overflow-hidden glass-card p-2">
                <img 
                  src="https://images.unsplash.com/photo-1565043589221-1a6fd9ae45c7?auto=format&fit=crop&q=80&w=1000" 
                  alt="Process" 
                  class="w-full h-full object-cover rounded-2xl"
                  referrerpolicy="no-referrer"
                >
              </div>
              <div class="absolute -bottom-10 -left-10 glass-card p-8 hidden md:block">
                <div class="text-4xl font-black text-accent mb-1">500+</div>
                <div class="tech-label text-[10px]">Projects Completed</div>
              </div>
            </div>
          </div>

          <!-- Mission & Vision -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8 mb-32">
            <div class="tech-card p-12 group hover:border-accent/30 transition-all">
              <div class="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center text-accent mb-6 group-hover:scale-110 transition-transform">
                <span class="material-icons">rocket_launch</span>
              </div>
              <h3 class="text-2xl font-bold mb-4">Our Mission</h3>
              <p class="text-accent-muted leading-relaxed">
                {{ configService.config().about.mission }}
              </p>
            </div>
            <div class="tech-card p-12 group hover:border-accent/30 transition-all">
              <div class="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center text-accent mb-6 group-hover:scale-110 transition-transform">
                <span class="material-icons">visibility</span>
              </div>
              <h3 class="text-2xl font-bold mb-4">Our Vision</h3>
              <p class="text-accent-muted leading-relaxed">
                {{ configService.config().about.vision }}
              </p>
            </div>
          </div>

          <!-- Core Values -->
          <div class="text-center mb-16">
            <div class="tech-label mb-4">Core Principles</div>
            <h2 class="text-4xl font-bold">What Drives Us</h2>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
            @for (value of configService.config().about.values; track value.title) {
              <div class="glass-card p-8 text-center group hover:bg-white/5 transition-all">
                <div class="w-16 h-16 bg-accent/5 rounded-2xl flex items-center justify-center text-accent mx-auto mb-6 border border-accent/10 group-hover:rotate-12 transition-transform">
                  <span class="material-icons text-3xl">{{ value.icon }}</span>
                </div>
                <h4 class="text-xl font-bold mb-3">{{ value.title }}</h4>
                <p class="text-sm text-accent-muted leading-relaxed">
                  {{ value.description }}
                </p>
              </div>
            }
          </div>
        </div>
      </section>

      <!-- CTA Section -->
      <section class="py-32 px-4 bg-accent/5 border-y border-white/5">
        <div class="max-w-4xl mx-auto text-center">
          <h2 class="text-4xl md:text-5xl font-bold mb-8">Ready to bring your ideas to life?</h2>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <a routerLink="/products" class="metallic-button px-10 py-4 text-lg">Browse Collection</a>
            <a routerLink="/contact" class="metallic-button-outline px-10 py-4 text-lg">Contact Our Team</a>
          </div>
        </div>
      </section>
    </div>
  `
})
export class AboutComponent {
  configService = inject(ConfigService);
}
