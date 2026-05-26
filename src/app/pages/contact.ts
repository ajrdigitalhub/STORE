import { Component, inject, signal } from '@angular/core';
import { ConfigService } from '../services/config';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="min-h-screen pt-32 pb-20 px-4">
      <div class="max-w-6xl mx-auto">
        <h1 class="text-5xl font-black uppercase tracking-tighter mb-12 text-center">Contact Us</h1>
        
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <!-- Contact Info & Form -->
          <div class="space-y-8">
            <div class="glass-card p-8">
              <h2 class="text-2xl font-bold mb-6">Get in Touch</h2>
              
              <div class="space-y-6 mb-12">
                <div class="flex items-start gap-4">
                  <div class="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                    <span class="material-icons text-accent">email</span>
                  </div>
                  <div>
                    <h4 class="text-xs font-bold uppercase tracking-widest text-accent-muted mb-1">Email</h4>
                    <p class="text-lg">{{ configService.config().contact.email || 'contact@example.com' }}</p>
                  </div>
                </div>
                
                <div class="flex items-start gap-4">
                  <div class="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                    <span class="material-icons text-accent">phone</span>
                  </div>
                  <div>
                    <h4 class="text-xs font-bold uppercase tracking-widest text-accent-muted mb-1">Phone</h4>
                    <p class="text-lg">{{ configService.config().contact.phone || '+1 234 567 8900' }}</p>
                  </div>
                </div>
                
                <div class="flex items-start gap-4">
                  <div class="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                    <span class="material-icons text-accent">location_on</span>
                  </div>
                  <div>
                    <h4 class="text-xs font-bold uppercase tracking-widest text-accent-muted mb-1">Address</h4>
                    <p class="text-lg whitespace-pre-line">{{ configService.config().contact.address || '123 Main St' }}</p>
                  </div>
                </div>
              </div>

              <form (submit)="submitMessage($event)" class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input type="text" [(ngModel)]="formData.name" name="name" placeholder="Your Name" class="input-field" required>
                  <input type="email" [(ngModel)]="formData.email" name="email" placeholder="Your Email" class="input-field" required>
                </div>
                <input type="text" [(ngModel)]="formData.subject" name="subject" placeholder="Subject" class="input-field" required>
                <textarea [(ngModel)]="formData.message" name="message" placeholder="Your Message" class="input-field" rows="5" required></textarea>
                <button type="submit" class="metallic-button w-full py-4 text-lg tracking-widest disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3" [disabled]="isSubmitting()">
                  @if (isSubmitting()) {
                    <div class="w-5 h-5 border-2 border-metallic-black/30 border-t-metallic-black rounded-full animate-spin"></div>
                    SENDING...
                  } @else {
                    SEND MESSAGE
                  }
                </button>
                @if (successMessage()) {
                  <div class="mt-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-500 text-center animate-in fade-in slide-in-from-top-2">
                    <span class="material-icons text-lg mb-1 block">check_circle</span>
                    <p class="font-mono text-sm uppercase tracking-wider">{{ successMessage() }}</p>
                  </div>
                }
                @if (errorMessage()) {
                  <div class="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-center animate-in fade-in slide-in-from-top-2">
                    <span class="material-icons text-lg mb-1 block">error_outline</span>
                    <p class="font-mono text-sm uppercase tracking-wider">{{ errorMessage() }}</p>
                  </div>
                }
              </form>
            </div>
          </div>
          
          <!-- Map -->
          <div class="glass-card overflow-hidden h-[400px] lg:h-auto min-h-[400px]">
            @if (safeMapUrl()) {
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3804.1154125712005!2d78.29522089999999!3d17.549691!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bcb8d0df4486acf%3A0x8b87c72d7e3c6637!2sIdeazone3D!5e0!3m2!1sen!2sin!4v1779770014889!5m2!1sen!2sin" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade">)" 
                width="100%" 
                height="100%" 
                style="border:0;" 
                allowfullscreen="" 
                loading="lazy" 
                referrerpolicy="no-referrer-when-downgrade">
              </iframe>
            } @else {
              <div class="w-full h-full flex items-center justify-center bg-white/5">
                <p class="text-accent-muted">Map not configured</p>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `
})
export class ContactComponent {
  configService = inject(ConfigService);
  sanitizer = inject(DomSanitizer);
  http = inject(HttpClient);

  formData = { name: '', email: '', subject: '', message: '' };
  isSubmitting = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  safeMapUrl(): SafeResourceUrl | null {
    const url = this.configService.config().contact.mapUrl;
    if (url) {
      return this.sanitizer.bypassSecurityTrustResourceUrl(url);
    }
    return null;
  }

  async submitMessage(event: Event) {
    event.preventDefault();
    if (this.isSubmitting()) return;

    this.isSubmitting.set(true);
    this.successMessage.set('');
    this.errorMessage.set('');

    try {
      await this.http.post('/api/messages', this.formData).toPromise();
      this.successMessage.set('Message sent successfully! We will get back to you soon.');
      this.formData = { name: '', email: '', subject: '', message: '' };
    } catch (error: unknown) {
      console.error('Failed to send message', error);
      const err = error as { error?: { message?: string } };
      this.errorMessage.set(err?.error?.message || 'Failed to send message. Please try again later.');
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
