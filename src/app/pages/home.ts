import { Component, inject, AfterViewInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductService } from '../services/product';
import { CartService } from '../services/cart';
import { ConfigService } from '../services/config';
import { HeroComponent } from '../components/home/hero';
import { ProductCardComponent } from '../components/shared/product-card';
import { SkeletonComponent } from '../components/shared/skeleton';
import { animate, stagger, inView } from 'motion';

@Component({
  selector: 'app-home',
  imports: [RouterLink, HeroComponent, ProductCardComponent, SkeletonComponent],
  templateUrl: './home.html',
  styles: [`
    @import url('https://fonts.googleapis.com/icon?family=Material+Icons');
  `]
})
export class HomeComponent implements AfterViewInit {
  productService = inject(ProductService);
  cartService = inject(CartService);
  configService = inject(ConfigService);
  private platformId = inject(PLATFORM_ID);

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      inView('.animate-section', (element) => {
        const items = element.querySelectorAll('.animate-item');
        if (items && items.length > 0) {
          animate(
            items,
            { opacity: [0, 1], y: [20, 0] },
            { delay: stagger(0.1), duration: 0.8, ease: 'easeOut' }
          );
        }
      }, { margin: '-100px' });
    }
  }
}
