import { Component, inject, signal, computed } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { ProductService, Product } from '../services/product';
import { CartService } from '../services/cart';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ProductCardComponent } from '../components/shared/product-card';
import { SkeletonComponent } from '../components/shared/skeleton';

@Component({
  selector: 'app-product-detail',
  imports: [RouterLink, CommonModule, CurrencyPipe, ProductCardComponent, SkeletonComponent],
  templateUrl: './product-detail.html',
  styles: [`
    @import url('https://fonts.googleapis.com/icon?family=Material+Icons');
  `]
})
export class ProductDetailComponent {
  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);
  private cartService = inject(CartService);

  product = signal<Product | null>(null);
  selectedImage = signal<string | null>(null);
  quantity = signal<number>(1);
  relatedProducts = computed(() => {
    const p = this.product();
    if (!p) return [];
    return this.productService.products().filter(prod => prod.category_id === p.category_id && prod.id !== p.id).slice(0, 4);
  });

  constructor() {
    this.route.params.subscribe(params => {
      const id = Number(params['id']);
      const p = this.productService.products().find(p => p.id === id);
      if (p) {
        this.product.set(p);
        if (p.images && p.images.length > 0) {
          this.selectedImage.set(p.images[0]);
        }
      }
    });
  }

  updateQuantity(delta: number) {
    this.quantity.update(q => Math.max(1, q + delta));
  }

  addToCart() {
    const p = this.product();
    if (p) {
      for (let i = 0; i < this.quantity(); i++) {
        this.cartService.addToCart(p);
      }
    }
  }
}
