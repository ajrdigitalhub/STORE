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
    <section class="relative h-screen flex items-center justify-center overflow-hidden bg-[#050505]">
      <!-- Background Carousel -->
      <div class="absolute inset-0 z-0">
        @for (slide of configService.config().hero.slides; track $index) {
          <div 
            class="absolute inset-0 transition-all duration-1000 ease-in-out transform"
            [class.opacity-60]="currentImageIndex() === $index"
            [class.opacity-0]="currentImageIndex() !== $index"
            [class.scale-110]="currentImageIndex() === $index"
            [class.scale-100]="currentImageIndex() !== $index"
          >
            <img [src]="slide.imageUrl" alt="Hero Image" class="w-full h-full object-cover" referrerpolicy="no-referrer">
          </div>
        }
        <!-- Overlays -->
        <div class="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent opacity-80"></div>
        <div class="absolute inset-0 bg-gradient-to-r from-[#050505]/80 via-transparent to-[#050505]/80"></div>
        <div class="absolute inset-0 bg-black/20"></div>
        
        <!-- Animated Glows -->
        <div class="absolute inset-0 pointer-events-none overflow-hidden">
          <div class="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-accent/20 rounded-full blur-[120px] animate-pulse"></div>
          <div class="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-accent/10 rounded-full blur-[120px] animate-pulse delay-1000"></div>
        </div>
      </div>

      <!-- Content -->
      <div class="relative z-10 flex flex-col items-center text-center max-w-7xl px-4">
        <div class="mb-10 inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl animate-fade-in hero-badge">
          <span class="flex h-2 w-2 rounded-full bg-accent animate-ping"></span>
          <span class="text-[10px] md:text-xs font-bold uppercase tracking-[0.4em] text-white/80">
            Precision Engineering
          </span>
        </div>
        
        @if (configService.config().hero.slides[currentImageIndex()]; as currentSlide) {
          <div class="overflow-hidden mb-6">
            <h1 class="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-tighter leading-[0.9] text-white hero-title">
              @let titleParts = currentSlide.title.split(' ');
              @for (part of titleParts; track $index) {
                <span class="block overflow-hidden">
                  <span class="inline-block title-part">{{ part }}</span>
                </span>
              }
            </h1>
          </div>
          
          <div class="max-w-2xl mx-auto overflow-hidden mb-12">
            <p class="text-sm md:text-base text-white/60 font-light leading-relaxed subtitle text-balance">
              {{ currentSlide.subtitle }}
            </p>
          </div>
          
          <div class="flex flex-col sm:flex-row items-center justify-center gap-6 cta-buttons">
            <a [routerLink]="currentSlide.buttonLink" class="group relative px-12 py-5 overflow-hidden rounded-full bg-white text-black font-bold uppercase tracking-widest transition-all hover:scale-105 active:scale-95">
              <span class="relative z-10">{{ currentSlide.buttonText }}</span>
              <div class="absolute inset-0 bg-accent translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out"></div>
            </a>
            <a routerLink="/about" class="group px-12 py-5 rounded-full border border-white/10 text-white font-bold uppercase tracking-widest transition-all hover:bg-white/5 hover:border-white/30 backdrop-blur-sm">
              Our Story
            </a>
          </div>
        }
      </div>

      <!-- Carousel Progress Indicators -->
      @if (configService.config().hero.slides.length > 1) {
        <div class="absolute bottom-16 left-1/2 -translate-x-1/2 z-20 flex gap-4">
          @for (slide of configService.config().hero.slides; track $index) {
            <button 
              (click)="setIndex($index)"
              class="group relative w-16 h-1 bg-white/10 rounded-full overflow-hidden transition-all duration-300 hover:h-2"
              [attr.aria-label]="'Go to slide ' + ($index + 1)"
            >
              @if ($index === currentImageIndex()) {
                <div class="absolute inset-0 bg-accent origin-left animate-progress"></div>
              }
              <div class="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </button>
          }
        </div>
      }
    </section>
  `,
  styles: [`
    .title-part {
      display: inline-block;
    }
    @keyframes progress {
      from { transform: scaleX(0); }
      to { transform: scaleX(1); }
    }
    .animate-progress {
      animation: progress 5s linear forwards;
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
    if (titleParts && titleParts.length > 0) {
      animate(
        titleParts,
        { 
          y: [100, 0], 
          opacity: [0, 1],
          filter: ["blur(10px)", "blur(0px)"],
          scale: [0.9, 1]
        },
        { delay: stagger(0.1), duration: 1, ease: [0.22, 1, 0.36, 1] }
      );
    }
    
    const subtitle = document.querySelector(".subtitle");
    if (subtitle) {
      animate(
        subtitle,
        { opacity: [0, 0.8], y: [20, 0], filter: ["blur(5px)", "blur(0px)"] },
        { delay: 0.6, duration: 0.8 }
      );
    }
    
    const ctaButtons = document.querySelector(".cta-buttons");
    if (ctaButtons) {
      animate(
        ctaButtons,
        { opacity: [0, 1], y: [20, 0] },
        { delay: 0.8, duration: 0.8 }
      );
    }
  }
}
