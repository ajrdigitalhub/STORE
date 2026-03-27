import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService, Product } from '../../services/product.service';
import { CategoryService, Category } from '../../services/category.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="animate-fade-in">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold text-chrome-100">Products</h1>
        <button (click)="openForm()" class="metallic-btn-primary metallic-btn">+ Add Product</button>
      </div>

      <!-- Products Table -->
      <div class="metallic-card overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-chrome-800">
                <th class="text-left text-chrome-500 text-xs uppercase px-4 py-3">Product</th>
                <th class="text-left text-chrome-500 text-xs uppercase px-4 py-3">Category</th>
                <th class="text-left text-chrome-500 text-xs uppercase px-4 py-3">Price</th>
                <th class="text-left text-chrome-500 text-xs uppercase px-4 py-3">Stock</th>
                <th class="text-left text-chrome-500 text-xs uppercase px-4 py-3">Featured</th>
                <th class="text-left text-chrome-500 text-xs uppercase px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (product of products; track product._id) {
                <tr class="border-b border-chrome-800/50 hover:bg-chrome-800/30 transition-colors">
                  <td class="px-4 py-3">
                    <div class="flex items-center space-x-3">
                      <div class="w-10 h-10 rounded-lg bg-chrome-800 flex-shrink-0 overflow-hidden">
                        @if (product.images && product.images.length) {
                          <img [src]="getImageUrl(product.images[0])" class="w-full h-full object-cover" />
                        }
                      </div>
                      <span class="text-chrome-200 text-sm">{{ product.name }}</span>
                    </div>
                  </td>
                  <td class="px-4 py-3 text-chrome-400 text-sm">{{ product.category?.name }}</td>
                  <td class="px-4 py-3 text-chrome-200 text-sm font-medium">₹{{ product.price | number }}</td>
                  <td class="px-4 py-3 text-chrome-400 text-sm">{{ product.stock }}</td>
                  <td class="px-4 py-3"><span class="text-chrome-400 text-sm">{{ product.featured ? '★' : '—' }}</span></td>
                  <td class="px-4 py-3">
                    <div class="flex space-x-2">
                      <button (click)="editProduct(product)" class="text-chrome-400 hover:text-white text-sm transition-colors">Edit</button>
                      <button (click)="deleteProduct(product._id)" class="text-chrome-600 hover:text-chrome-300 text-sm transition-colors">Delete</button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Product Form Modal -->
      @if (showForm) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" (click)="showForm = false">
          <div class="metallic-card p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto animate-slide-up" (click)="$event.stopPropagation()">
            <div class="flex justify-between items-start mb-6">
              <h2 class="text-chrome-200 font-semibold text-lg">{{ editingId ? 'Edit' : 'Add' }} Product</h2>
              <button (click)="showForm = false" class="text-chrome-500 hover:text-white">✕</button>
            </div>

            <div class="space-y-4">
              <div>
                <label class="text-chrome-400 text-sm mb-1 block">Name</label>
                <input [(ngModel)]="form.name" class="metallic-input" placeholder="Product name" />
              </div>
              <div>
                <label class="text-chrome-400 text-sm mb-1 block">Description</label>
                <textarea [(ngModel)]="form.description" class="metallic-input h-24 resize-none" placeholder="Product description"></textarea>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="text-chrome-400 text-sm mb-1 block">Price (₹)</label>
                  <input type="number" [(ngModel)]="form.price" class="metallic-input" />
                </div>
                <div>
                  <label class="text-chrome-400 text-sm mb-1 block">Compare Price (₹)</label>
                  <input type="number" [(ngModel)]="form.comparePrice" class="metallic-input" />
                </div>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="text-chrome-400 text-sm mb-1 block">Category</label>
                  <select [(ngModel)]="form.category" class="metallic-input">
                    @for (cat of categories; track cat._id) {
                      <option [value]="cat._id">{{ cat.name }}</option>
                    }
                  </select>
                </div>
                <div>
                  <label class="text-chrome-400 text-sm mb-1 block">Stock</label>
                  <input type="number" [(ngModel)]="form.stock" class="metallic-input" />
                </div>
              </div>
              <div>
                <label class="flex items-center space-x-2 cursor-pointer">
                  <input type="checkbox" [(ngModel)]="form.featured" class="accent-chrome-300" />
                  <span class="text-chrome-400 text-sm">Featured product</span>
                </label>
              </div>
              <div>
                <label class="text-chrome-400 text-sm mb-1 block">Images</label>
                <input type="file" (change)="onFilesSelected($event)" multiple accept="image/*"
                  class="metallic-input text-sm file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:bg-chrome-700 file:text-chrome-200 file:text-sm" />
              </div>

              @if (formError) {
                <div class="bg-chrome-800 border border-chrome-600 text-chrome-300 p-3 rounded-lg text-sm">{{ formError }}</div>
              }

              <div class="flex space-x-3 pt-2">
                <button (click)="showForm = false" class="metallic-btn flex-1">Cancel</button>
                <button (click)="saveProduct()" [disabled]="saving" class="metallic-btn-primary metallic-btn flex-1 disabled:opacity-50">
                  {{ saving ? 'Saving...' : 'Save Product' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class AdminProductsComponent implements OnInit {
  products: Product[] = [];
  categories: Category[] = [];
  showForm = false;
  editingId = '';
  saving = false;
  formError = '';
  form = { name: '', description: '', price: 0, comparePrice: 0, category: '', stock: 0, featured: false };
  selectedFiles: File[] = [];

  constructor(private productService: ProductService, private categoryService: CategoryService) {}

  ngOnInit(): void {
    this.loadProducts();
    this.categoryService.getCategories().subscribe(cats => this.categories = cats);
  }

  loadProducts(): void {
    this.productService.getProducts({ limit: 100 }).subscribe(res => this.products = res.products);
  }

  openForm(product?: Product): void {
    this.editingId = '';
    this.form = { name: '', description: '', price: 0, comparePrice: 0, category: '', stock: 0, featured: false };
    this.selectedFiles = [];
    this.formError = '';
    this.showForm = true;
  }

  editProduct(product: Product): void {
    this.editingId = product._id;
    this.form = {
      name: product.name,
      description: product.description,
      price: product.price,
      comparePrice: product.comparePrice,
      category: product.category?._id || product.category,
      stock: product.stock,
      featured: product.featured
    };
    this.selectedFiles = [];
    this.formError = '';
    this.showForm = true;
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFiles = input.files ? Array.from(input.files) : [];
  }

  saveProduct(): void {
    if (!this.form.name || !this.form.category) {
      this.formError = 'Name and category are required';
      return;
    }

    this.saving = true;
    this.formError = '';

    const fd = new FormData();
    fd.append('name', this.form.name);
    fd.append('description', this.form.description);
    fd.append('price', String(this.form.price));
    fd.append('comparePrice', String(this.form.comparePrice));
    fd.append('category', this.form.category);
    fd.append('stock', String(this.form.stock));
    fd.append('featured', String(this.form.featured));
    this.selectedFiles.forEach(f => fd.append('images', f));

    const request = this.editingId
      ? this.productService.updateProduct(this.editingId, fd)
      : this.productService.createProduct(fd);

    request.subscribe({
      next: () => {
        this.showForm = false;
        this.saving = false;
        this.loadProducts();
      },
      error: (err) => {
        this.formError = err.error?.message || 'Failed to save product';
        this.saving = false;
      }
    });
  }

  deleteProduct(id: string): void {
    if (confirm('Are you sure you want to delete this product?')) {
      this.productService.deleteProduct(id).subscribe(() => this.loadProducts());
    }
  }

  getImageUrl(img: string): string {
    if (!img) return '';
    if (img.startsWith('http')) return img;
    return environment.serverUrl + img;
  }
}
