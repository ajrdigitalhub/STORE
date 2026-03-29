import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AboutService, AboutContent } from '../../services/about.service';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen pt-28 pb-20">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Hero Section -->
        <div class="text-center mb-20 animate-fade-in">
          <h1 class="text-4xl sm:text-6xl font-bold bg-gradient-to-r from-white via-chrome-300 to-chrome-500 bg-clip-text text-transparent mb-6">
            {{ content?.title || 'About Us' }}
          </h1>
          <p class="text-chrome-400 text-lg sm:text-xl max-w-3xl mx-auto leading-relaxed">
            {{ content?.subtitle || 'Discover Our Story' }}
          </p>
        </div>

        <!-- Main Content -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-24">
          <div class="animate-slide-up">
            <div class="metallic-card p-8 relative overflow-hidden group">
              <div class="absolute inset-0 shimmer pointer-events-none opacity-20"></div>
              <h2 class="text-2xl font-bold text-white mb-6">Our Story</h2>
              <p class="text-chrome-400 leading-relaxed whitespace-pre-wrap">
                {{ content?.description }}
              </p>
            </div>
          </div>
          <div class="grid grid-cols-1 gap-6 animate-slide-up" style="animation-delay: 0.1s">
            <div class="glass-panel p-8 border-l-4 border-chrome-400">
              <h3 class="text-xl font-bold text-white mb-3 flex items-center">
                <svg class="w-6 h-6 mr-2 text-chrome-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                Our Mission
              </h3>
              <p class="text-chrome-400 leading-relaxed italic">
                "{{ content?.mission }}"
              </p>
            </div>
            <div class="glass-panel p-8 border-l-4 border-chrome-600">
              <h3 class="text-xl font-bold text-white mb-3 flex items-center">
                <svg class="w-6 h-6 mr-2 text-chrome-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                Our Vision
              </h3>
              <p class="text-chrome-400 leading-relaxed italic">
                "{{ content?.vision }}"
              </p>
            </div>
          </div>
        </div>

        <!-- Features/Values -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center animate-slide-up" style="animation-delay: 0.2s">
          <div class="p-6">
            <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-chrome-800 to-chrome-950 flex items-center justify-center mx-auto mb-6 border border-chrome-700">
              <svg class="w-8 h-8 text-chrome-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
            </div>
            <h4 class="text-white font-bold mb-2">Quality Assured</h4>
            <p class="text-chrome-500 text-sm">Every product undergoes rigorous quality checks.</p>
          </div>
          <div class="p-6">
            <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-chrome-800 to-chrome-950 flex items-center justify-center mx-auto mb-6 border border-chrome-700">
              <svg class="w-8 h-8 text-chrome-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <h4 class="text-white font-bold mb-2">Fast Delivery</h4>
            <p class="text-chrome-500 text-sm">Quick and reliable shipping across the country.</p>
          </div>
          <div class="p-6">
            <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-chrome-800 to-chrome-950 flex items-center justify-center mx-auto mb-6 border border-chrome-700">
              <svg class="w-8 h-8 text-chrome-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
            </div>
            <h4 class="text-white font-bold mb-2">24/7 Support</h4>
            <p class="text-chrome-500 text-sm">dedicated team to help you anytime.</p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AboutComponent implements OnInit {
  content: AboutContent | null = null;

  constructor(private aboutService: AboutService) {}

  ngOnInit(): void {
    this.aboutService.getAboutContent().subscribe({
      next: (data) => this.content = data,
      error: (err) => console.error('Error fetching about content', err)
    });
  }
}
