import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ApiService } from './api.service';
import { firstValueFrom } from 'rxjs';

export interface HeroSlide {
  title: string;
  subtitle: string;
  imageUrl: string;
  buttonText: string;
  buttonLink: string;
}

export interface HeroConfig {
  slides: HeroSlide[];
}

export interface AboutConfig {
  title: string;
  content: string;
  imageUrl: string;
}

export interface ContactConfig {
  email: string;
  phone: string;
  address: string;
  mapUrl: string;
}

export interface SocialLink {
  platform: string;
  url: string;
  icon: string;
}

export interface FooterConfig {
  description: string;
  socialLinks: SocialLink[];
  copyrightText: string;
}

export interface RazorpayConfig {
  keyId: string;
  enabled: boolean;
}

export interface AppConfig {
  hero: HeroConfig;
  about: AboutConfig;
  contact: ContactConfig;
  footer: FooterConfig;
  razorpay: RazorpayConfig;
}

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private platformId = inject(PLATFORM_ID);
  private api = inject(ApiService);
  
  private configSignal = signal<AppConfig>({
    hero: {
      slides: [
        {
          title: 'PRECISION CRAFTED',
          subtitle: 'Where aerospace-grade accuracy meets your creative vision.',
          imageUrl: 'https://images.unsplash.com/photo-1631033855076-a4827951bb62?auto=format&fit=crop&q=80&w=2000',
          buttonText: 'Shop Collection',
          buttonLink: '/products'
        },
        {
          title: 'ADVANCED POLYMERS',
          subtitle: 'Engineered materials designed for extreme performance and durability.',
          imageUrl: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&q=80&w=2000',
          buttonText: 'View Materials',
          buttonLink: '/products'
        },
        {
          title: 'FUTURE FABRICATION',
          subtitle: 'Rapid prototyping and small-batch production at the speed of thought.',
          imageUrl: 'https://images.unsplash.com/photo-1565043589221-1a6fd9ae45c7?auto=format&fit=crop&q=80&w=2000',
          buttonText: 'Get Started',
          buttonLink: '/contact'
        }
      ]
    },
    about: {
      title: 'About IDEA Zone 3D',
      content: 'We are pioneers in the 3D printing industry, providing high-quality prints and materials for creators, engineers, and hobbyists alike.',
      imageUrl: 'https://picsum.photos/seed/about/800/600'
    },
    contact: {
      email: 'contact@ideazone3d.com',
      phone: '+1 (555) 123-4567',
      address: '123 Maker Street, Innovation City, Tech State 10101',
      mapUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3153.097746536531!2d-122.39568368468205!3d37.79252897975618!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8085806255555555%3A0x1234567890abcdef!2sTech%20Hub!5e0!3m2!1sen!2sus!4v1611234567890!5m2!1sen!2sus'
    },
    footer: {
      description: 'Premium 3D printing solutions for creators, engineers, and dreamers. Quality meets innovation in every layer.',
      socialLinks: [
        { platform: 'Facebook', url: '#', icon: 'facebook' },
        { platform: 'Twitter', url: '#', icon: 'share' },
        { platform: 'Instagram', url: '#', icon: 'camera_alt' }
      ],
      copyrightText: '© 2026 IDEA Zone 3D. All rights reserved.'
    },
    razorpay: {
      keyId: '',
      enabled: false
    }
  });
  
  config = this.configSignal.asReadonly();

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadConfig();
    }
  }

  private loadConfig() {
    this.api.get<AppConfig>('/app-config/app').subscribe({
      next: (config) => {
        this.configSignal.set(config);
      },
      error: (error) => {
        console.warn('Config not found in DB, using defaults', error);
        // Optionally initialize DB with defaults
        this.updateConfig(this.configSignal());
      }
    });
  }

  async updateConfig(config: AppConfig) {
    return firstValueFrom(this.api.post<AppConfig>('/app-config/app', config));
  }
}
