import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContactConfigService, ContactConfig } from '../../services/contact-config.service';

@Component({
  selector: 'app-admin-contact',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-4xl space-y-8">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-white">Edit Contact Information</h1>
        <div class="text-chrome-500 text-xs italic" *ngIf="content?.updatedAt">
          Last updated: {{ content?.updatedAt | date:'medium' }}
        </div>
      </div>

      <div class="glass-panel p-8">
        <form (ngSubmit)="saveConfig()" #contactForm="ngForm" class="space-y-6">
          <div>
            <label class="block text-chrome-300 text-sm font-medium mb-2">Office Address</label>
            <textarea [(ngModel)]="formData.address" name="address" required rows="3"
              class="metallic-input resize-none" placeholder="Enter full address..."></textarea>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-chrome-300 text-sm font-medium mb-2">Support Email</label>
              <input type="email" [(ngModel)]="formData.email" name="email" required
                class="metallic-input" placeholder="e.g., support@example.com" />
            </div>
            <div>
              <label class="block text-chrome-300 text-sm font-medium mb-2">Phone Number</label>
              <input type="text" [(ngModel)]="formData.phone" name="phone" required
                class="metallic-input" placeholder="e.g., +91 99890 13142" />
            </div>
          </div>

          <div>
            <label class="block text-chrome-300 text-sm font-medium mb-2">Working Hours</label>
            <input type="text" [(ngModel)]="formData.workingHours" name="workingHours" required
              class="metallic-input" placeholder="e.g., Mon - Sat, 9am - 7pm" />
          </div>

          <div class="pt-6 border-t border-chrome-800 flex items-center space-x-4">
            <button type="submit" [disabled]="loading || !contactForm.form.valid"
              class="metallic-btn-primary metallic-btn px-8">
              {{ loading ? 'Saving...' : 'Save Changes' }}
            </button>
            <span *ngIf="success" class="text-green-400 text-sm animate-fade-in flex items-center">
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
              Contact info updated successfully!
            </span>
          </div>
        </form>
      </div>

      <div class="space-y-4">
        <h3 class="text-chrome-500 text-sm uppercase tracking-widest font-bold">Live Preview Hint</h3>
        <p class="text-chrome-600 text-xs italic">
          Any changes saved here will be immediately reflected on the public Contact Us page.
        </p>
      </div>
    </div>
  `
})
export class AdminContactComponent implements OnInit {
  content: ContactConfig | null = null;
  formData: ContactConfig = {
    address: '',
    phone: '',
    email: '',
    workingHours: ''
  };
  loading = false;
  success = false;

  constructor(private configService: ContactConfigService) {}

  ngOnInit(): void {
    this.configService.getConfig().subscribe(data => {
      this.content = data;
      this.formData = { ...data };
    });
  }

  saveConfig(): void {
    this.loading = true;
    this.success = false;
    this.configService.updateConfig(this.formData).subscribe({
      next: (res) => {
        this.content = res;
        this.loading = false;
        this.success = true;
        setTimeout(() => this.success = false, 3000);
      },
      error: () => this.loading = false
    });
  }
}
