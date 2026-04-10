import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';

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

export interface RazorpayConfig {
  keyId: string;
  enabled: boolean;
}

export interface AppConfig {
  hero: HeroConfig;
  about: AboutConfig;
  contact: ContactConfig;
  razorpay: RazorpayConfig;
}

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private platformId = inject(PLATFORM_ID);
  private http = inject(HttpClient);
  
  private configSignal = signal<AppConfig>({
    hero: {
      slides: [
        {
          title: '3D PRINTING REVOLUTION',
          subtitle: 'Bringing your wildest ideas to life with precision and speed.',
          imageUrl: 'https://picsum.photos/seed/3dprint1/1920/1080',
          buttonText: 'Explore Shop',
          buttonLink: '/products'
        },
        {
          title: 'INDUSTRIAL GRADE',
          subtitle: 'High-performance materials for demanding applications.',
          imageUrl: 'https://picsum.photos/seed/3dprint2/1920/1080',
          buttonText: 'Learn More',
          buttonLink: '/about'
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
    this.http.get<AppConfig>('/api/app-config/app').subscribe({
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
    return this.http.post<AppConfig>('/api/app-config/app', config).toPromise();
  }
}
