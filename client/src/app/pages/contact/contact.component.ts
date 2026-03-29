import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MessageService } from '../../services/message.service';
import { ContactConfigService, ContactConfig } from '../../services/contact-config.service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen pt-28 pb-20">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16 animate-fade-in">
          <h1 class="text-4xl sm:text-6xl font-bold bg-gradient-to-r from-white via-chrome-300 to-chrome-500 bg-clip-text text-transparent mb-6">
            Contact Us
          </h1>
          <p class="text-chrome-400 text-lg max-w-2xl mx-auto">
            Have questions or need assistance? Our team is here to help you. Reach out to us anytime.
          </p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <!-- Contact Info -->
          <div class="lg:col-span-1 space-y-6 animate-slide-up">
            <div class="metallic-card p-8">
              <h3 class="text-white font-bold mb-6 flex items-center">
                <span class="w-10 h-10 rounded-lg bg-chrome-800 flex items-center justify-center mr-4">
                  <svg class="w-5 h-5 text-chrome-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                </span>
                Our Location
              </h3>
              <p class="text-chrome-400 leading-relaxed whitespace-pre-wrap">
                {{ config?.address }}
              </p>
            </div>

            <div class="metallic-card p-8">
              <h3 class="text-white font-bold mb-6 flex items-center">
                <span class="w-10 h-10 rounded-lg bg-chrome-800 flex items-center justify-center mr-4">
                  <svg class="w-5 h-5 text-chrome-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                </span>
                Call Us
              </h3>
              <p class="text-chrome-400">
                {{ config?.phone }}<br>
                {{ config?.workingHours }}
              </p>
            </div>

            <div class="metallic-card p-8">
              <h3 class="text-white font-bold mb-6 flex items-center">
                <span class="w-10 h-10 rounded-lg bg-chrome-800 flex items-center justify-center mr-4">
                  <svg class="w-5 h-5 text-chrome-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                </span>
                Email Support
              </h3>
              <p class="text-chrome-400">
                {{ config?.email }}
              </p>
            </div>
          </div>

          <!-- Contact Form -->
          <div class="lg:col-span-2 animate-slide-up" style="animation-delay: 0.1s">
            <div class="glass-panel p-8 sm:p-12 relative overflow-hidden">
              <div class="absolute inset-0 shimmer pointer-events-none opacity-10"></div>
              
              <form (ngSubmit)="onSubmit()" #contactForm="ngForm" class="space-y-6">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label class="block text-chrome-300 text-sm font-medium mb-2">Name</label>
                    <input type="text" [(ngModel)]="formData.name" name="name" required
                      class="metallic-input" placeholder="Your Name" />
                  </div>
                  <div>
                    <label class="block text-chrome-300 text-sm font-medium mb-2">Email</label>
                    <input type="email" [(ngModel)]="formData.email" name="email" required
                      class="metallic-input" placeholder="Your@email.com" />
                  </div>
                </div>
                <div>
                  <label class="block text-chrome-300 text-sm font-medium mb-2">Subject</label>
                  <input type="text" [(ngModel)]="formData.subject" name="subject" required
                    class="metallic-input" placeholder="How can we help?" />
                </div>
                <div>
                  <label class="block text-chrome-300 text-sm font-medium mb-2">Message</label>
                  <textarea [(ngModel)]="formData.message" name="message" required rows="5"
                    class="metallic-input resize-none" placeholder="Tell us more..."></textarea>
                </div>

                <div class="pt-4">
                  <button type="submit" [disabled]="loading || !contactForm.form.valid"
                    class="metallic-btn-primary metallic-btn w-full sm:w-auto min-w-[200px] flex items-center justify-center">
                    <span *ngIf="!loading">Send Message</span>
                    <span *ngIf="loading" class="flex items-center">
                      <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-chrome-950" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      Sending...
                    </span>
                  </button>
                </div>

                <div *ngIf="success" class="mt-6 p-4 bg-green-500/10 border border-green-500/50 rounded-lg text-green-400 text-sm animate-fade-in">
                  Message sent successfully! We'll get back to you soon.
                </div>
                <div *ngIf="error" class="mt-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm animate-fade-in">
                  {{ error }}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ContactComponent {
  formData = {
    name: '',
    email: '',
    subject: '',
    message: ''
  };
  loading = false;
  success = false;
  error = '';
  config: ContactConfig | null = null;

  constructor(
    private messageService: MessageService,
    private configService: ContactConfigService
  ) {}

  ngOnInit(): void {
    this.configService.getConfig().subscribe(data => this.config = data);
  }

  onSubmit(): void {
    this.loading = true;
    this.error = '';
    this.success = false;

    this.messageService.submitMessage(this.formData).subscribe({
      next: () => {
        this.loading = false;
        this.success = true;
        this.formData = { name: '', email: '', subject: '', message: '' };
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Something went wrong. Please try again.';
      }
    });
  }
}
