import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ProductService, Product } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="max-w-7xl mx-auto px-4 pt-24 pb-16">
      @if (loading) {
        <div class="grid grid-cols-1 md:grid-cols-2 gap-12 animate-pulse">
          <div class="h-96 bg-chrome-800 rounded-xl"></div>
          <div class="space-y-4">
            <div class="h-8 bg-chrome-800 rounded w-3/4"></div>
            <div class="h-4 bg-chrome-800 rounded w-1/2"></div>
            <div class="h-24 bg-chrome-800 rounded"></div>
          </div>
        </div>
      } @else if (product) {
        <div class="grid grid-cols-1 md:grid-cols-2 gap-12 animate-fade-in">
          <!-- Images -->
          <div>
            <div class="metallic-card overflow-hidden rounded-xl mb-4">
              <img [src]="getImageUrl(selectedImage)" [alt]="product.name"
                class="w-full h-96 object-cover" />
            </div>
            @if (product.images && product.images.length > 1) {
              <div class="flex space-x-3 overflow-x-auto pb-2">
                @for (img of product.images; track img) {
                  <button (click)="selectedImage = img"
                    [class]="selectedImage === img ? 'ring-2 ring-chrome-300' : 'ring-1 ring-chrome-700'"
                    class="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden transition-all">
                    <img [src]="getImageUrl(img)" [alt]="product.name" class="w-full h-full object-cover" />
                  </button>
                }
              </div>
            }
          </div>

          <!-- Details -->
          <div class="space-y-6">
            <div>
              <p class="text-chrome-500 text-sm uppercase tracking-wider mb-2">{{ product.category?.name }}</p>
              <h1 class="text-3xl font-bold text-chrome-100 mb-2">{{ product.name }}</h1>
              <div class="flex items-center space-x-3">
                <span class="text-3xl font-bold text-white">₹{{ product.price | number }}</span>
                @if (product.comparePrice > product.price) {
                  <span class="text-xl text-chrome-600 line-through">₹{{ product.comparePrice | number }}</span>
                  <span class="metallic-badge bg-gradient-to-r from-chrome-200 to-chrome-400 text-chrome-950 border-0">
                    Save {{ getDiscount() }}%
                  </span>
                }
              </div>
            </div>

            <p class="text-chrome-400 leading-relaxed">{{ product.description }}</p>

            <!-- Variants -->
            @for (variant of product.variants; track variant.name) {
              <div>
                <label class="text-chrome-300 text-sm font-medium mb-2 block">{{ variant.name }}</label>
                <div class="flex flex-wrap gap-2">
                  @for (option of variant.options; track option) {
                    <button (click)="selectVariant(variant.name, option)"
                      [class]="selectedVariants[variant.name] === option
                        ? 'metallic-btn-primary metallic-btn text-sm px-4 py-2'
                        : 'metallic-btn text-sm px-4 py-2'">
                      {{ option }}
                    </button>
                  }
                </div>
              </div>
            }

            <!-- Stock -->
            <div class="flex items-center space-x-2">
              @if (product.stock > 0) {
                <span class="w-2 h-2 rounded-full bg-chrome-300"></span>
                <span class="text-chrome-400 text-sm">{{ product.stock }} in stock</span>
              } @else {
                <span class="w-2 h-2 rounded-full bg-chrome-600"></span>
                <span class="text-chrome-600 text-sm">Out of stock</span>
              }
            </div>

            <!-- Quantity & Add -->
            <div class="flex items-center space-x-4">
              <div class="flex items-center metallic-card px-1">
                <button (click)="quantity = Math.max(1, quantity - 1)" class="px-3 py-2 text-chrome-400 hover:text-white transition-colors">−</button>
                <span class="px-4 py-2 text-chrome-200 font-medium">{{ quantity }}</span>
                <button (click)="quantity = quantity + 1" class="px-3 py-2 text-chrome-400 hover:text-white transition-colors">+</button>
              </div>
              <button (click)="addToCart()" [disabled]="product.stock === 0"
                class="flex-1 metallic-btn-primary metallic-btn py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed">
                Add to Cart
              </button>
            </div>

            @if (addedToCart) {
              <div class="metallic-card p-3 border-chrome-600 text-center animate-fade-in">
                <p class="text-chrome-300 text-sm">✓ Added to cart</p>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `
})
export class ProductDetailComponent implements OnInit {
  product: Product | null = null;
  loading = true;
  selectedImage = '';
  quantity = 1;
  selectedVariants: { [key: string]: string } = {};
  addedToCart = false;
  Math = Math;

  constructor(
    private route: ActivatedRoute,
    private productService: ProductService,
    private cartService: CartService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.productService.getProduct(params['id']).subscribe({
        next: product => {
          this.product = product;
          this.selectedImage = product.images?.[0] || '';
          product.variants?.forEach(v => {
            if (v.options.length) this.selectedVariants[v.name] = v.options[0];
          });
          this.loading = false;
        },
        error: () => this.loading = false
      });
    });
  }

  selectVariant(name: string, option: string): void {
    this.selectedVariants[name] = option;
  }

  addToCart(): void {
    if (!this.product) return;
    this.cartService.addToCart({
      product: this.product._id,
      name: this.product.name,
      price: this.product.price,
      quantity: this.quantity,
      image: this.product.images?.[0] || '',
      selectedVariants: { ...this.selectedVariants }
    });
    this.addedToCart = true;
    setTimeout(() => this.addedToCart = false, 2000);
  }

  getImageUrl(img: string): string {
    if (!img) return '';
    if (img.startsWith('http')) return img;
    return environment.serverUrl + img;
  }

  getDiscount(): number {
    if (!this.product) return 0;
    return Math.round((1 - this.product.price / this.product.comparePrice) * 100);
  }
}
