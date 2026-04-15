import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ApiService } from './api.service';
import { firstValueFrom } from 'rxjs';

export interface Category {
  id: number;
  name: string;
  description?: string;
  image?: string;
  active: boolean;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  compare_price?: number;
  category_id: number;
  category_name?: string;
  images: string[];
  stock: number;
  featured: boolean;
  customizable: boolean;
  customization_type: 'none' | 'text' | 'image_file';
  active: boolean;
  created_at: string;
  specification?: Record<string, string>;
  tags?: string[];
  rating?: number;
  reviews_count?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private api = inject(ApiService);
  private platformId = inject(PLATFORM_ID);
  
  private productsSignal = signal<Product[]>([]);
  products = this.productsSignal.asReadonly();
  
  private categoriesSignal = signal<Category[]>([]);
  categories = this.categoriesSignal.asReadonly();
  
  isLoading = signal(false);
  useMockData = signal(true);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.checkConfig();
      this.loadProducts();
      this.loadCategories();
    }
  }

  private async checkConfig() {
    try {
      const config = await firstValueFrom(this.api.get<{ useMockData: boolean }>('/runtime-config'));
      if (config) {
        this.useMockData.set(config.useMockData);
        this.loadProducts();
        this.loadCategories();
      }
    } catch (error: unknown) {
      console.error('Failed to load config', error instanceof Error ? error.message : error);
    }
  }

  async toggleMockData(useMock: boolean) {
    try {
      await firstValueFrom(this.api.post('/runtime-config', { useMockData: useMock }));
      this.useMockData.set(useMock);
      this.loadProducts();
      this.loadCategories();
    } catch (error: unknown) {
      console.error('Failed to toggle mock data', error instanceof Error ? error.message : error);
    }
  }

  private loadProducts() {
    this.isLoading.set(true);
    this.api.get<{products: Product[], total: number}>('/products').subscribe({
      next: (response) => {
        console.log('ProductService - Loaded products:', response.products.map(p => ({ id: p.id, name: p.name })));
        this.productsSignal.set(response.products);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Failed to load products', error);
        this.isLoading.set(false);
      }
    });
  }

  private loadCategories() {
    this.api.get<Category[]>('/categories').subscribe({
      next: (categories) => {
        this.categoriesSignal.set(categories);
      },
      error: (error) => {
        console.error('Failed to load categories', error);
      }
    });
  }

  async getProduct(id: number): Promise<Product | null> {
    try {
      const response = await firstValueFrom(this.api.get<Product>(`/products/${id}`));
      return response;
    } catch (error) {
      console.error(`Failed to load product ${id}`, error);
      return null;
    }
  }

  async addProduct(product: Omit<Product, 'id' | 'created_at'>) {
    const res = await firstValueFrom(this.api.post<Product>('/products', product));
    this.loadProducts();
    return res;
  }

  async updateProduct(id: number, product: Partial<Product>) {
    const res = await firstValueFrom(this.api.patch<Product>(`/products/${id}`, product));
    this.loadProducts();
    return res;
  }

  async deleteProduct(id: number) {
    const res = await firstValueFrom(this.api.delete(`/products/${id}`));
    this.loadProducts();
    return res;
  }

  // Category methods
  async addCategory(category: Omit<Category, 'id' | 'created_at'>) {
    const res = await firstValueFrom(this.api.post<Category>('/categories', category));
    this.loadCategories();
    return res;
  }

  async updateCategory(id: number, category: Partial<Category>) {
    const res = await firstValueFrom(this.api.put<Category>(`/categories/${id}`, category));
    this.loadCategories();
    return res;
  }

  async deleteCategory(id: number) {
    const res = await firstValueFrom(this.api.delete(`/categories/${id}`));
    this.loadCategories();
    return res;
  }
}
