import { Component, inject, signal, computed, effect, AfterViewInit, ElementRef } from '@angular/core';
import { ProductService } from '../../services/product';
import { OrderService, Order } from '../../services/order';
import { AuthService } from '../../services/auth';
import { ChatService } from '../../services/chat';
import { ConfigService, AppConfig } from '../../services/config';
import { UploadService } from '../../services/upload';
import { SkeletonComponent } from '../../components/shared/skeleton';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { animate, stagger } from 'motion';

interface Customer {
  id: number;
  uid: string;
  email: string;
  display_name: string | null;
  role: string;
  avatar_url: string | null;
  phone: string | null;
  address: string | null;
  created_at: string;
}

interface Message {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

@Component({
  selector: 'app-admin-dashboard',
  imports: [CommonModule, FormsModule, CurrencyPipe, SkeletonComponent],
  templateUrl: './dashboard.html',
  styles: [`
    @import url('https://fonts.googleapis.com/icon?family=Material+Icons');
  `]
})
export class AdminDashboardComponent implements AfterViewInit {
  productService = inject(ProductService);
  orderService = inject(OrderService);
  authService = inject(AuthService);
  chatService = inject(ChatService);
  configService = inject(ConfigService);
  uploadService = inject(UploadService);
  http = inject(HttpClient);
  private el = inject(ElementRef);

  activeTab = signal<'dashboard' | 'orders' | 'products' | 'categories' | 'customers' | 'chat' | 'messages' | 'about' | 'contact' | 'payments' | 'hero' | 'footer'>('dashboard');
  showProductForm = signal(false);
  showCategoryForm = signal(false);
  chatMessage = '';
  quickReplies = [
    'Hello! How can I assist you today?',
    'Your order is currently being processed.',
    'We offer a variety of materials including PLA, PETG, and ABS.',
    'Please share your order ID for further assistance.',
    'Thank you for reaching out to IDEA Zone 3D!'
  ];

  newProduct = { name: '', price: 0, category_id: 0, stock: 0, description: '', imageUrl: '' };
  newCategory = { name: '', slug: '', description: '', image_url: '' };
  
  customers = signal<Customer[]>([]);
  messages = signal<Message[]>([]);

  heroForm = signal({
    slides: [] as {
      title: string;
      subtitle: string;
      imageUrl: string;
      buttonText: string;
      buttonLink: string;
    }[]
  });

  aboutForm = signal({
    title: '',
    subtitle: '',
    content: '',
    imageUrl: '',
    mission: '',
    vision: '',
    values: [] as { title: string; description: string; icon: string }[]
  });

  contactForm = signal({
    email: '',
    phone: '',
    address: '',
    mapUrl: ''
  });

  razorpayForm = signal({
    keyId: '',
    keySecret: '',
    enabled: false
  });

  footerForm = signal({
    description: '',
    socialLinks: [] as { platform: string; url: string; icon: string }[],
    copyrightText: ''
  });

  isUploading = signal(false);

  getTabDisplayName(tab: string): string {
    const names: Record<string, string> = {
      'dashboard': 'System Overview',
      'orders': 'Order Management',
      'products': 'Inventory Control',
      'categories': 'Product Taxonomy',
      'customers': 'Client Directory',
      'chat': 'Support Terminal',
      'messages': 'Inbound Inquiries',
      'about': 'Corporate Profile',
      'contact': 'Communication Hub',
      'payments': 'Financial Transactions',
      'hero': 'Visual Merchandising',
      'footer': 'Footer Configuration'
    };
    return names[tab] || tab;
  }

  constructor() {
    effect(() => {
      const config = this.configService.config();
      const currentHero = config.hero;
      // Only sync if form is currently empty (initial load)
      if (this.heroForm().slides.length === 0 && currentHero?.slides) {
        this.heroForm.set({ 
          slides: JSON.parse(JSON.stringify(currentHero.slides))
        });
      }
      if (!this.aboutForm().title && config.about) {
        this.aboutForm.set({ 
          ...config.about,
          values: JSON.parse(JSON.stringify(config.about.values || []))
        });
      }
      if (!this.contactForm().email && config.contact) {
        this.contactForm.set({ ...config.contact });
      }
      if (!this.razorpayForm().keyId && config.razorpay) {
        this.razorpayForm.update(f => ({ ...f, keyId: config.razorpay.keyId, enabled: config.razorpay.enabled }));
        this.loadRazorpaySecret();
      }
      if (!this.footerForm().description && config.footer) {
        this.footerForm.set({ 
          description: config.footer.description,
          socialLinks: JSON.parse(JSON.stringify(config.footer.socialLinks || [])),
          copyrightText: config.footer.copyrightText
        });
      }
    }, { allowSignalWrites: true });

    // Animate tab changes
    effect(() => {
      const tab = this.activeTab();
      if (tab === 'customers') this.loadCustomers();
      if (tab === 'messages') this.loadMessages();
      setTimeout(() => this.animateContent(), 0);
    });
  }

  async loadCustomers() {
    try {
      const res = await this.http.get<Customer[]>('/api/users').toPromise();
      if (res) this.customers.set(res);
    } catch (error) {
      console.error('Failed to load customers', error);
    }
  }

  async loadMessages() {
    try {
      const res = await this.http.get<Message[]>('/api/messages').toPromise();
      if (res) this.messages.set(res);
    } catch (error) {
      console.error('Failed to load messages', error);
    }
  }

  async loadRazorpaySecret() {
    try {
      const res = await this.http.get<{ keySecret: string }>('/api/app-config/razorpay_secret').toPromise();
      if (res) {
        this.razorpayForm.update(f => ({ ...f, keySecret: res.keySecret }));
      }
    } catch (error) {
      console.warn('Razorpay secret not found', error);
    }
  }

  async saveProduct() {
    await this.productService.addProduct({
      name: this.newProduct.name,
      price: this.newProduct.price,
      category_id: this.newProduct.category_id,
      stock: this.newProduct.stock,
      description: this.newProduct.description,
      images: [this.newProduct.imageUrl],
      is_featured: true
    });
    this.showProductForm.set(false);
    this.newProduct = { name: '', price: 0, category_id: 0, stock: 0, description: '', imageUrl: '' };
  }

  async saveCategory() {
    await this.productService.addCategory(this.newCategory);
    this.showCategoryForm.set(false);
    this.newCategory = { name: '', slug: '', description: '', image_url: '' };
  }

  async deleteCategory(id: number) {
    if (confirm('Are you sure you want to delete this category?')) {
      await this.productService.deleteCategory(id);
    }
  }

  async markMessageAsRead(id: number) {
    try {
      await this.http.put(`/api/messages/${id}/read`, {}).toPromise();
      this.loadMessages();
    } catch (error) {
      console.error('Failed to mark message as read', error);
    }
  }

  async deleteMessage(id: number) {
    if (confirm('Are you sure you want to delete this message?')) {
      try {
        await this.http.delete(`/api/messages/${id}`).toPromise();
        this.loadMessages();
      } catch (error) {
        console.error('Failed to delete message', error);
      }
    }
  }

  ngAfterViewInit() {
    this.animateSidebar();
    this.animateContent();
  }

  private animateSidebar() {
    const navItems = this.el.nativeElement.querySelectorAll('nav button');
    if (navItems && navItems.length > 0) {
      animate(
        navItems,
        { opacity: [0, 1], x: [-20, 0] },
        { delay: stagger(0.05), duration: 0.5, ease: 'easeOut' }
      );
    }
  }

  private animateContent() {
    const cards = this.el.nativeElement.querySelectorAll('.tech-card');
    if (cards.length > 0) {
      animate(
        cards,
        { opacity: [0, 1], y: [20, 0] },
        { delay: stagger(0.1), duration: 0.6, ease: [0.22, 1, 0.36, 1] }
      );
    }

    const header = this.el.nativeElement.querySelector('header');
    if (header) {
      animate(
        header,
        { opacity: [0, 1], y: [-20, 0] },
        { duration: 0.8, ease: 'easeOut' }
      );
    }
  }

  async onProductImageSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      this.isUploading.set(true);
      try {
        const url = await this.uploadService.uploadImage(file);
        this.newProduct.imageUrl = url;
      } catch (error) {
        console.error('Upload failed', error);
        alert('Image upload failed');
      } finally {
        this.isUploading.set(false);
      }
    }
  }

  async onHeroImageSelected(event: Event, slideIndex: number) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      this.isUploading.set(true);
      try {
        const url = await this.uploadService.uploadImage(file);
        const current = this.heroForm();
        const newSlides = [...current.slides];
        newSlides[slideIndex].imageUrl = url;
        this.heroForm.set({ slides: newSlides });
      } catch (error) {
        console.error('Upload failed', error);
        alert('Image upload failed');
      } finally {
        this.isUploading.set(false);
      }
    }
  }

  addHeroSlide() {
    const current = this.heroForm();
    this.heroForm.set({
      slides: [...current.slides, {
        title: 'New Slide',
        subtitle: 'Slide description',
        imageUrl: 'https://picsum.photos/seed/newslide/1920/1080',
        buttonText: 'Click Here',
        buttonLink: '/'
      }]
    });
  }

  removeHeroSlide(index: number) {
    const current = this.heroForm();
    const newSlides = [...current.slides];
    newSlides.splice(index, 1);
    this.heroForm.set({ slides: newSlides });
  }

  async saveHeroConfig() {
    const currentConfig = this.configService.config();
    const newConfig: AppConfig = {
      ...currentConfig,
      hero: { ...this.heroForm() }
    };
    await this.configService.updateConfig(newConfig);
  }

  async saveAboutConfig() {
    const currentConfig = this.configService.config();
    const newConfig: AppConfig = {
      ...currentConfig,
      about: { ...this.aboutForm() }
    };
    await this.configService.updateConfig(newConfig);
    alert('About configuration saved successfully');
  }

  addAboutValue() {
    const current = this.aboutForm();
    this.aboutForm.set({
      ...current,
      values: [...current.values, { title: '', description: '', icon: 'star' }]
    });
  }

  removeAboutValue(index: number) {
    const current = this.aboutForm();
    const newValues = [...current.values];
    newValues.splice(index, 1);
    this.aboutForm.set({ ...current, values: newValues });
  }

  async saveContactConfig() {
    const currentConfig = this.configService.config();
    const newConfig: AppConfig = {
      ...currentConfig,
      contact: { ...this.contactForm() }
    };
    await this.configService.updateConfig(newConfig);
  }

  async saveRazorpayConfig() {
    const currentConfig = this.configService.config();
    const form = this.razorpayForm();
    
    const newConfig: AppConfig = {
      ...currentConfig,
      razorpay: {
        keyId: form.keyId,
        enabled: form.enabled
      }
    };
    
    await this.configService.updateConfig(newConfig);
    
    // Save secret separately
    await this.http.post('/api/app-config/razorpay_secret', { keySecret: form.keySecret }).toPromise();
    alert('Razorpay configuration saved successfully');
  }

  async saveFooterConfig() {
    const currentConfig = this.configService.config();
    const newConfig: AppConfig = {
      ...currentConfig,
      footer: { ...this.footerForm() }
    };
    await this.configService.updateConfig(newConfig);
    alert('Footer configuration saved successfully');
  }

  addSocialLink() {
    const current = this.footerForm();
    this.footerForm.set({
      ...current,
      socialLinks: [...current.socialLinks, { platform: '', url: '', icon: 'link' }]
    });
  }

  removeSocialLink(index: number) {
    const current = this.footerForm();
    const newLinks = [...current.socialLinks];
    newLinks.splice(index, 1);
    this.footerForm.set({ ...current, socialLinks: newLinks });
  }

  toggleRazorpay() {
    this.razorpayForm.update(f => ({ ...f, enabled: !f.enabled }));
  }

  async onCategoryImageSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      this.isUploading.set(true);
      try {
        const url = await this.uploadService.uploadImage(file);
        this.newCategory.image_url = url;
      } catch (error) {
        console.error('Upload failed', error);
        alert('Image upload failed');
      } finally {
        this.isUploading.set(false);
      }
    }
  }

  async onAboutImageSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      this.isUploading.set(true);
      try {
        const url = await this.uploadService.uploadImage(file);
        const current = this.aboutForm();
        this.aboutForm.set({
          ...current,
          imageUrl: url
        });
      } catch (error) {
        console.error('Upload failed', error);
        alert('Image upload failed');
      } finally {
        this.isUploading.set(false);
      }
    }
  }

  totalRevenue = computed(() => this.orderService.orders().reduce((acc, order) => acc + order.total, 0));
  pendingOrders = computed(() => this.orderService.orders().filter(order => order.status === 'pending'));
  totalCustomers = signal(2); // Mocked for now to match screenshot
  recentOrders = computed(() => this.orderService.orders().slice(0, 5));

  async updateOrderStatus(id: string, status: Order['status']) {
    await this.orderService.updateOrderStatus(id, status);
  }

  sendMessage() {
    if (this.chatMessage.trim()) {
      this.chatService.sendMessage(this.chatMessage);
      this.chatMessage = '';
    }
  }
}
