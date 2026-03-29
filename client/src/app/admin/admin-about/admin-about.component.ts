import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AboutService, AboutContent } from '../../services/about.service';

@Component({
  selector: 'app-admin-about',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-4xl space-y-8">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-white">Edit About Us Content</h1>
        <div class="text-chrome-500 text-xs italic" *ngIf="content?.lastUpdated">
          Last updated: {{ content?.lastUpdated | date:'medium' }}
        </div>
      </div>

      <div class="glass-panel p-8">
        <form (ngSubmit)="saveContent()" #aboutForm="ngForm" class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-chrome-300 text-sm font-medium mb-2">Page Title</label>
              <input type="text" [(ngModel)]="formData.title" name="title" required
                class="metallic-input" placeholder="e.g., About Our Store" />
            </div>
            <div>
              <label class="block text-chrome-300 text-sm font-medium mb-2">Subtitle</label>
              <input type="text" [(ngModel)]="formData.subtitle" name="subtitle" required
                class="metallic-input" placeholder="e.g., Discover Our Story" />
            </div>
          </div>

          <div>
            <label class="block text-chrome-300 text-sm font-medium mb-2">Main Description</label>
            <textarea [(ngModel)]="formData.description" name="description" required rows="6"
              class="metallic-input resize-none" placeholder="Tell your brand story..."></textarea>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-chrome-300 text-sm font-medium mb-2">Our Mission</label>
              <textarea [(ngModel)]="formData.mission" name="mission" required rows="4"
                class="metallic-input resize-none" placeholder="What is your mission?"></textarea>
            </div>
            <div>
              <label class="block text-chrome-300 text-sm font-medium mb-2">Our Vision</label>
              <textarea [(ngModel)]="formData.vision" name="vision" required rows="4"
                class="metallic-input resize-none" placeholder="What is your vision?"></textarea>
            </div>
          </div>

          <div class="pt-6 border-t border-chrome-800 flex items-center space-x-4">
            <button type="submit" [disabled]="loading || !aboutForm.form.valid"
              class="metallic-btn-primary metallic-btn px-8">
              {{ loading ? 'Saving...' : 'Save Changes' }}
            </button>
            <span *ngIf="success" class="text-green-400 text-sm animate-fade-in flex items-center">
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
              Changes saved successfully!
            </span>
          </div>
        </form>
      </div>

      <!-- Preview Section -->
      <div class="space-y-4">
        <h3 class="text-chrome-500 text-sm uppercase tracking-widest font-bold">Preview Hint</h3>
        <p class="text-chrome-600 text-xs italic">
          Changes will reflect immediately on the public About Us page after saving.
        </p>
      </div>
    </div>
  `
})
export class AdminAboutComponent implements OnInit {
  content: AboutContent | null = null;
  formData: AboutContent = {
    title: '',
    subtitle: '',
    description: '',
    mission: '',
    vision: ''
  };
  loading = false;
  success = false;

  constructor(private aboutService: AboutService) {}

  ngOnInit(): void {
    this.aboutService.getAboutContent().subscribe(data => {
      this.content = data;
      this.formData = { ...data };
    });
  }

  saveContent(): void {
    this.loading = true;
    this.success = false;
    this.aboutService.updateAboutContent(this.formData).subscribe({
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
