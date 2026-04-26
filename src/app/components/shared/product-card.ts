import { Component, Input, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Product } from '../../services/product';
import { CartService } from '../../services/cart';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [RouterLink, CurrencyPipe, DecimalPipe],
  template: `
    <div class="glass-card group overflow-hidden h-full flex flex-col">
      <div class="relative aspect-square overflow-hidden">
        <img [src]="(product && product.images && product.images.length > 0) ? product.images[0] : 'https://picsum.photos/seed/' + (product.id || 'placeholder') + '/600/600'" 
             [alt]="product.name || 'Product Image'" 
             class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
             referrerpolicy="no-referrer">
        <div class="absolute top-4 right-4 flex flex-col gap-2">
          @if (product && product.stock <= 0) {
            <span class="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-widest">Out of Stock</span>
          } @else if (product && product.stock < 5) {
            <span class="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-widest">Low Stock</span>
          }
          @if (product && product.compare_price && product.compare_price > product.price) {
            <span class="bg-accent text-black text-[10px] font-bold px-2 py-1 rounded uppercase tracking-widest">
              {{ ((product.compare_price - product.price) / product.compare_price * 100) | number:'1.0-0' }}% OFF
            </span>
          } @else {
            <span class="bg-accent text-black text-[10px] font-bold px-2 py-1 rounded uppercase tracking-widest">New</span>
          }
        </div>
        
        <!-- Hover Overlay -->
        <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4">
          @if (product) {
            <a [routerLink]="['/products', product.id]" class="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center hover:bg-accent transition-colors">
              <span class="material-icons">visibility</span>
            </a>
            <button (click)="cartService.addToCart(product)" class="w-12 h-12 rounded-full bg-accent text-black flex items-center justify-center hover:bg-white transition-colors">
              <span class="material-icons">shopping_cart</span>
            </button>
          }
        </div>
      </div>
      
      <div class="p-6 flex-grow flex flex-col">
        <div class="flex justify-between items-start mb-2">
          <h3 class="text-xl font-bold group-hover:text-accent transition-colors">{{ product.name }}</h3>
          <span class="text-accent font-bold">{{ product.price | currency:'INR' }}</span>
        </div>
        <p class="text-accent-muted text-sm mb-6 line-clamp-2 flex-grow">{{ product.description }}</p>
        
        <div class="pt-4 border-t border-white/5">
          @if (product) {
            <button (click)="cartService.addToCart(product)" 
                    class="metallic-button w-full py-3 text-xs font-bold uppercase tracking-widest"
                    [disabled]="product.stock <= 0">
              {{ product.stock <= 0 ? 'Out of Stock' : 'Add to Cart' }}
            </button>
          }
        </div>
      </div>
    </div>
  `
})
export class ProductCardComponent {
  @Input({ required: true }) product!: Product;
  cartService = inject(CartService);
}
