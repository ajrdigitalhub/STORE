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
  isZoomed = signal<boolean>(false);
  zoomBackgroundPosition = signal<string>('0% 0%');

  specifications = computed(() => {
    const p = this.product();
    if (!p) return [];
    if (p.specification && Object.keys(p.specification).length > 0) {
      return Object.entries(p.specification).map(([label, value]) => ({ label, value }));
    }
    return [
      { label: 'Material', value: p.category_name || 'Standard Polymer' },
      { label: 'Precision', value: '±0.1mm' },
      { label: 'Lead Time', value: '3-5 Business Days' },
      { label: 'Finish', value: 'Matte / Smooth' },
      { label: 'Weight', value: 'Approx. 150g' }
    ];
  });
  relatedProducts = computed(() => {
    const p = this.product();
    if (!p) return [];
    return this.productService.products().filter(prod => prod.category_id === p.category_id && prod.id !== p.id).slice(0, 4);
  });

  constructor() {
    this.route.params.subscribe(async params => {
      const id = Number(params['id']);
      let p = this.productService.products().find(p => p.id === id);
      
      if (!p) {
        const fetchedProduct = await this.productService.getProduct(id);
        if (fetchedProduct) {
          p = fetchedProduct;
        }
      }

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

  onMouseMove(event: MouseEvent) {
    const target = event.currentTarget as HTMLElement;
    const { left, top, width, height } = target.getBoundingClientRect();
    const x = ((event.clientX - left) / width) * 100;
    const y = ((event.clientY - top) / height) * 100;
    this.zoomBackgroundPosition.set(`${x}% ${y}%`);
  }

  onMouseEnter() {
    this.isZoomed.set(true);
  }

  onMouseLeave() {
    this.isZoomed.set(false);
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
