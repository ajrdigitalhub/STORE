import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoryService, Category } from '../../services/category.service';

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="animate-fade-in">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold text-chrome-100">Categories</h1>
        <button (click)="openForm()" class="metallic-btn-primary metallic-btn">+ Add Category</button>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        @for (cat of categories; track cat._id) {
          <div class="metallic-card p-5 hover:border-chrome-500 transition-all">
            <h3 class="text-chrome-200 font-semibold mb-1">{{ cat.name }}</h3>
            <p class="text-chrome-500 text-sm mb-4">{{ cat.description || 'No description' }}</p>
            <div class="flex space-x-2">
              <button (click)="editCategory(cat)" class="metallic-btn text-xs flex-1">Edit</button>
              <button (click)="deleteCategory(cat._id)" class="metallic-btn text-xs flex-1 border-chrome-700 text-chrome-600 hover:text-chrome-300">Delete</button>
            </div>
          </div>
        }
      </div>

      <!-- Category Form Modal -->
      @if (showForm) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" (click)="showForm = false">
          <div class="metallic-card p-6 max-w-md w-full animate-slide-up" (click)="$event.stopPropagation()">
            <div class="flex justify-between items-start mb-6">
              <h2 class="text-chrome-200 font-semibold text-lg">{{ editingId ? 'Edit' : 'Add' }} Category</h2>
              <button (click)="showForm = false" class="text-chrome-500 hover:text-white">✕</button>
            </div>
            <div class="space-y-4">
              <div>
                <label class="text-chrome-400 text-sm mb-1 block">Name</label>
                <input [(ngModel)]="form.name" class="metallic-input" placeholder="Category name" />
              </div>
              <div>
                <label class="text-chrome-400 text-sm mb-1 block">Description</label>
                <textarea [(ngModel)]="form.description" class="metallic-input h-20 resize-none" placeholder="Category description"></textarea>
              </div>
              @if (formError) {
                <div class="bg-chrome-800 border border-chrome-600 text-chrome-300 p-3 rounded-lg text-sm">{{ formError }}</div>
              }
              <div class="flex space-x-3">
                <button (click)="showForm = false" class="metallic-btn flex-1">Cancel</button>
                <button (click)="saveCategory()" [disabled]="saving" class="metallic-btn-primary metallic-btn flex-1 disabled:opacity-50">
                  {{ saving ? 'Saving...' : 'Save' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class AdminCategoriesComponent implements OnInit {
  categories: Category[] = [];
  showForm = false;
  editingId = '';
  saving = false;
  formError = '';
  form = { name: '', description: '' };

  constructor(private categoryService: CategoryService) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.categoryService.getCategories().subscribe(cats => this.categories = cats);
  }

  openForm(): void {
    this.editingId = '';
    this.form = { name: '', description: '' };
    this.formError = '';
    this.showForm = true;
  }

  editCategory(cat: Category): void {
    this.editingId = cat._id;
    this.form = { name: cat.name, description: cat.description || '' };
    this.formError = '';
    this.showForm = true;
  }

  saveCategory(): void {
    if (!this.form.name) {
      this.formError = 'Name is required';
      return;
    }
    this.saving = true;
    const request = this.editingId
      ? this.categoryService.updateCategory(this.editingId, this.form)
      : this.categoryService.createCategory(this.form);

    request.subscribe({
      next: () => { this.showForm = false; this.saving = false; this.loadCategories(); },
      error: (err) => { this.formError = err.error?.message || 'Failed to save'; this.saving = false; }
    });
  }

  deleteCategory(id: string): void {
    if (confirm('Delete this category?')) {
      this.categoryService.deleteCategory(id).subscribe(() => this.loadCategories());
    }
  }
}
