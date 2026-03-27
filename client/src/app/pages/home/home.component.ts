import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService, Product } from '../../services/product.service';
import { CategoryService, Category } from '../../services/category.service';
import { CartService } from '../../services/cart.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <!-- Hero Section -->
    <section class="relative overflow-hidden py-20 sm:py-28">
      <div class="absolute inset-0 bg-gradient-to-b from-chrome-900/50 via-chrome-950 to-chrome-950"></div>
      <div class="absolute inset-0 shimmer pointer-events-none"></div>
      <div class="relative max-w-7xl mx-auto px-4 text-center">
        <h1 class="text-4xl sm:text-6xl font-bold bg-gradient-to-r from-white via-chrome-300 to-chrome-500 bg-clip-text text-transparent mb-6 animate-fade-in">
          Premium Products
        </h1>
        <p class="text-chrome-400 text-lg sm:text-xl max-w-2xl mx-auto mb-10 animate-fade-in">
          Discover our curated collection of high-quality products with exceptional craftsmanship.
        </p>
        <div class="max-w-xl mx-auto animate-slide-up">
          <div class="relative">
            <svg class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-chrome-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <input [(ngModel)]="searchQuery" (ngModelChange)="onSearch()" placeholder="Search products..."
              class="metallic-input pl-12 pr-4 py-3 text-base" />
          </div>
        </div>
      </div>
    </section>

    <!-- Categories -->
    <section class="max-w-7xl mx-auto px-4 py-8">
      <div class="flex flex-wrap gap-3 justify-center">
        <button (click)="selectedCategory=''; loadProducts()"
          [class]="!selectedCategory ? 'metallic-btn-primary metallic-btn text-sm' : 'metallic-btn text-sm'">
          All
        </button>
        @for (cat of categories; track cat._id) {
          <button (click)="selectedCategory=cat._id; loadProducts()"
            [class]="selectedCategory === cat._id ? 'metallic-btn-primary metallic-btn text-sm' : 'metallic-btn text-sm'">
            {{ cat.name }}
          </button>
        }
      </div>
    </section>

    <!-- Products Grid -->
    <section class="max-w-7xl mx-auto px-4 pb-16">
      @if (loading) {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          @for (i of [1,2,3,4,5,6,7,8]; track i) {
            <div class="metallic-card p-4 animate-pulse">
              <div class="w-full h-48 bg-chrome-800 rounded-lg mb-4"></div>
              <div class="h-4 bg-chrome-800 rounded w-3/4 mb-2"></div>
              <div class="h-4 bg-chrome-800 rounded w-1/2"></div>
            </div>
          }
        </div>
      } @else if (products.length === 0) {
        <div class="text-center py-16">
          <svg class="w-16 h-16 mx-auto text-chrome-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/></svg>
          <p class="text-chrome-500 text-lg">No products found</p>
        </div>
      } @else {
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          @for (product of products; track product._id) {
            <div class="metallic-card overflow-hidden group cursor-pointer animate-fade-in" [routerLink]="['/product', product._id]">
              <!-- Image -->
              <div class="relative overflow-hidden h-52 bg-chrome-800">
                @if (product.images && product.images.length > 0) {
                  <img [src]="getImageUrl(product.images[0])" [alt]="product.name" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                } @else {
                  <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-chrome-800 to-chrome-900">
                    <svg class="w-12 h-12 text-chrome-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                  </div>
                }
                @if (product.comparePrice > product.price) {
                  <span class="absolute top-3 left-3 metallic-badge text-xs">
                    -{{ getDiscount(product) }}%
                  </span>
                }
                @if (product.featured) {
                  <span class="absolute top-3 right-3 bg-gradient-to-r from-chrome-200 to-chrome-400 text-chrome-950 text-xs font-semibold px-2 py-1 rounded-full">
                    Featured
                  </span>
                }
              </div>

              <!-- Details -->
              <div class="p-4">
                <p class="text-chrome-500 text-xs uppercase tracking-wider mb-1">{{ product.category?.name || 'Uncategorized' }}</p>
                <h3 class="text-chrome-100 font-semibold text-sm mb-2 line-clamp-2 group-hover:text-white transition-colors">{{ product.name }}</h3>
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-2">
                    <span class="text-chrome-100 font-bold">₹{{ product.price | number }}</span>
                    @if (product.comparePrice > product.price) {
                      <span class="text-chrome-600 text-sm line-through">₹{{ product.comparePrice | number }}</span>
                    }
                  </div>
                  <button (click)="quickAdd(product, $event)" class="w-8 h-8 rounded-full bg-chrome-700 hover:bg-chrome-600 flex items-center justify-center transition-colors">
                    <svg class="w-4 h-4 text-chrome-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                  </button>
                </div>
              </div>
            </div>
          }
        </div>

        <!-- Pagination -->
        @if (totalPages > 1) {
          <div class="flex justify-center mt-10 space-x-2">
            @for (p of getPages(); track p) {
              <button (click)="currentPage = p; loadProducts()"
                [class]="p === currentPage ? 'metallic-btn-primary metallic-btn text-sm px-4 py-2' : 'metallic-btn text-sm px-4 py-2'">
                {{ p }}
              </button>
            }
          </div>
        }
      }
    </section>
  `
})
export class HomeComponent implements OnInit {
  products: Product[] = [];
  categories: Category[] = [];
  loading = true;
  searchQuery = '';
  selectedCategory = '';
  currentPage = 1;
  totalPages = 1;
  private searchTimeout: any;

  constructor(
    private productService: ProductService,
    private categoryService: CategoryService,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    this.categoryService.getCategories().subscribe(cats => this.categories = cats);
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading = true;
    const params: any = { page: this.currentPage, limit: 12 };
    if (this.searchQuery) params.search = this.searchQuery;
    if (this.selectedCategory) params.category = this.selectedCategory;

    this.productService.getProducts(params).subscribe({
      next: res => {
        this.products = res.products;
        this.totalPages = res.pages;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  onSearch(): void {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.currentPage = 1;
      this.loadProducts();
    }, 400);
  }

  quickAdd(product: Product, event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.cartService.addToCart({
      product: product._id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.images?.[0] || ''
    });
  }

  getImageUrl(img: string): string {
    if (img.startsWith('http')) return img;
    return environment.serverUrl + img;
  }

  getDiscount(product: Product): number {
    return Math.round((1 - product.price / product.comparePrice) * 100);
  }

  getPages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }
}
