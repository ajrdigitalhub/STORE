import { Component, inject, computed } from '@angular/core';
import { ProductService } from '../services/product';
import { CartService } from '../services/cart';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { ProductCardComponent } from '../components/shared/product-card';
import { SkeletonComponent } from '../components/shared/skeleton';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-product-list',
  imports: [ReactiveFormsModule, ProductCardComponent, SkeletonComponent],
  templateUrl: './product-list.html',
  styles: [`
    @import url('https://fonts.googleapis.com/icon?family=Material+Icons');
  `]
})
export class ProductListComponent {
  productService = inject(ProductService);
  cartService = inject(CartService);

  searchControl = new FormControl('');
  categoryControl = new FormControl('');
  sortControl = new FormControl('name');

  searchQuery = toSignal(this.searchControl.valueChanges, { initialValue: '' });
  selectedCategory = toSignal(this.categoryControl.valueChanges, { initialValue: '' });
  sortBy = toSignal(this.sortControl.valueChanges, { initialValue: 'name' });

  filteredProducts = computed(() => {
    const query = (this.searchQuery() || '').toLowerCase();
    const category = this.selectedCategory() || '';
    const sort = this.sortBy() || 'name';
    
    let products = this.productService.products().filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(query) || 
                           product.description.toLowerCase().includes(query);
      const matchesCategory = !category || product.category_id === Number(category);
      return matchesSearch && matchesCategory;
    });

    if (sort === 'price-asc') {
      products = [...products].sort((a, b) => a.price - b.price);
    } else if (sort === 'price-desc') {
      products = [...products].sort((a, b) => b.price - a.price);
    } else {
      products = [...products].sort((a, b) => a.name.localeCompare(b.name));
    }
    
    return products;
  });
}
