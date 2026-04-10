import { Component, inject, signal, effect, OnDestroy, AfterViewInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ConfigService } from '../../services/config';
import { animate, stagger } from "motion";

@Component({
  selector: 'app-hero',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="relative h-screen flex items-center justify-center overflow-hidden bg-black">
      <!-- Background Carousel -->
      <div class="absolute inset-0 z-0">
        @for (slide of configService.config().hero.slides; track $index) {
          <div 
            class="absolute inset-0 transition-opacity duration-1000 ease-in-out"
            [class.opacity-40]="currentImageIndex() === $index"
            [class.opacity-0]="currentImageIndex() !== $index"
          >
            <img [src]="slide.imageUrl" alt="Hero Image" class="w-full h-full object-cover" referrerpolicy="no-referrer">
          </div>
        }
        <div class="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black"></div>
        
        <!-- Animated Particles/Glow -->
        <div class="absolute inset-0 pointer-events-none">
          <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/10 rounded-full blur-[120px] animate-pulse"></div>
          <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-[120px] animate-pulse delay-1000"></div>
        </div>
      </div>

      <!-- Content -->
      <div class="relative z-10 flex flex-col items-center text-center max-w-6xl px-6 hero-content">
        <div class="mb-8 inline-block animate-fade-in">
          <span class="text-[10px] md:text-xs font-bold uppercase tracking-[0.5em] text-accent border border-accent/20 bg-accent/5 px-6 py-2 rounded-full backdrop-blur-md">
            Future of Manufacturing
          </span>
        </div>
        
        @if (configService.config().hero.slides[currentImageIndex()]; as currentSlide) {
          <h1 class="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black mb-10 uppercase tracking-tighter leading-[0.9] text-white">
            @let titleParts = currentSlide.title.split(' ');
            @for (part of titleParts; track $index) {
              <span class="block overflow-hidden">
                <span class="inline-block title-part">{{ part }}</span>
              </span>
            }
          </h1>
          
          <p class="text-lg md:text-xl lg:text-2xl text-accent-muted mb-12 max-w-3xl mx-auto font-light leading-relaxed opacity-90 subtitle text-balance">
            {{ currentSlide.subtitle }}
          </p>
          
          <div class="flex flex-wrap justify-center gap-6 cta-buttons">
            <a [routerLink]="currentSlide.buttonLink" class="group relative px-10 py-4 overflow-hidden rounded-full bg-accent text-black font-bold uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-lg shadow-accent/20">
              <span class="relative z-10">{{ currentSlide.buttonText }}</span>
              <div class="absolute inset-0 bg-white/30 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            </a>
            <a routerLink="/about" class="group px-10 py-4 rounded-full border border-white/20 text-white font-bold uppercase tracking-widest transition-all hover:bg-white/10 hover:border-white/40">
              Learn More
            </a>
          </div>
        }
      </div>

      <!-- Carousel Indicators -->
      @if ((configService.config().hero.slides.length ?? 0) > 1) {
        <div class="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 flex gap-3">
          @for (slide of configService.config().hero.slides; track $index) {
            <button 
              (click)="setIndex($index)"
              class="w-12 h-1 rounded-full transition-all duration-300"
              [class.bg-accent]="$index === currentImageIndex()"
              [class.bg-white/20]="$index !== currentImageIndex()"
              aria-label="Carousel Indicator"
            ></button>
          }
        </div>
      }
      
      <!-- Scroll Indicator -->
      <div class="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 animate-bounce opacity-50">
        <span class="material-icons text-white">expand_more</span>
      </div>
    </section>
  `,
  styles: [`
    .title-part {
      display: inline-block;
    }
  `]
})
export class HeroComponent implements OnDestroy, AfterViewInit {
  configService = inject(ConfigService);
  private platformId = inject(PLATFORM_ID);
  currentImageIndex = signal(0);
  private interval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    effect(() => {
      const slides = this.configService.config().hero.slides;
      if ((slides?.length ?? 0) > 1 && isPlatformBrowser(this.platformId)) {
        this.startCarousel();
      } else {
        this.stopCarousel();
      }
    });
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        this.animateHero();
      }, 100);
    }
  }

  ngOnDestroy() {
    this.stopCarousel();
  }

  private startCarousel() {
    this.stopCarousel();
    this.interval = setInterval(() => {
      const slides = this.configService.config().hero.slides;
      if (slides?.length) {
        this.currentImageIndex.update(i => (i + 1) % slides.length);
        // Re-trigger animation on slide change
        setTimeout(() => this.animateHero(), 50);
      }
    }, 5000);
  }

  private stopCarousel() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  setIndex(index: number) {
    this.currentImageIndex.set(index);
    this.startCarousel(); // Reset timer
  }

  private animateHero() {
    if (!isPlatformBrowser(this.platformId) || typeof document === 'undefined') return;
    
    const titleParts = document.querySelectorAll(".title-part");
    if (titleParts.length > 0) {
      animate(
        ".title-part",
        { y: [100, 0], opacity: [0, 1] },
        { delay: stagger(0.1), duration: 0.8, ease: [0.22, 1, 0.36, 1] }
      );
    }
    
    const subtitle = document.querySelector(".subtitle");
    if (subtitle) {
      animate(
        ".subtitle",
        { opacity: [0, 0.8], y: [20, 0] },
        { delay: 0.5, duration: 0.8 }
      );
    }
    
    const ctaButtons = document.querySelector(".cta-buttons");
    if (ctaButtons) {
      animate(
        ".cta-buttons",
        { opacity: [0, 1], y: [20, 0] },
        { delay: 0.7, duration: 0.8 }
      );
    }
  }
}
