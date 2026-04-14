import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CartService } from '../services/cart';
import { OrderService } from '../services/order';
import { PaymentService } from '../services/payment';
import { AuthService } from '../services/auth';
import { FormsModule } from '@angular/forms';
import { CommonModule, CurrencyPipe } from '@angular/common';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const Razorpay: any;

import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-checkout',
  imports: [FormsModule, CommonModule, CurrencyPipe],
  templateUrl: './checkout.html',
  styles: [`
    @import url('https://fonts.googleapis.com/icon?family=Material+Icons');
  `]
})
export class CheckoutComponent {
  cartService = inject(CartService);
  orderService = inject(OrderService);
  paymentService = inject(PaymentService);
  authService = inject(AuthService);
  toastService = inject(ToastService);
  router = inject(Router);

  address = { 
    name: '', 
    email: '', 
    phone: '', 
    address: '', 
    city: '', 
    state: '', 
    zip: '' 
  };
  paymentMethod = signal<'Razorpay'>('Razorpay');
  isProcessing = signal(false);

  async placeOrder() {
    if (!this.validateForm()) return;

    this.isProcessing.set(true);
    try {
      const total = this.cartService.totalPrice() * 1.18;
      const profile = this.authService.profile();
      if (!profile) {
        throw new Error('User profile not loaded. Please login again.');
      }

      const orderItems = this.cartService.items().map(item => ({
        product: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.images && item.images.length > 0 ? item.images[0] : ''
      }));

      if (this.paymentMethod() === 'Razorpay') {
        // 1. Initiate Razorpay
        const success = await this.paymentService.loadRazorpayScript();
        if (!success) throw new Error('Razorpay SDK failed to load');

        const rzpOrder = await this.paymentService.createRazorpayOrder(total);
        const rzpKey = await this.paymentService.getRazorpayKey();
        
        const options = {
          key: rzpKey,
          amount: rzpOrder.amount,
          currency: rzpOrder.currency,
          name: "IDEA Zone 3D",
          description: "Order Payment",
          order_id: rzpOrder.id,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          handler: async (response: any) => {
            try {
              // 2. Create order ONLY after successful payment
              const order = await this.orderService.createOrder({
                userid: profile.id,
                items: orderItems,
                total_amount: total,
                payment_method: 'razorpay',
                shipping_address: this.address,
                // Pass Razorpay details for verification on backend
                razorpay_orderid: response.razorpay_orderid,
                razorpay_paymentid: response.razorpay_paymentid,
                razorpay_signature: response.razorpay_signature
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
              } as any);

              this.toastService.show('Order placed successfully!', 'success');
              this.cartService.clearCart();
              this.router.navigate(['/orders', order.id]);
            } catch (err) {
              console.error('Order creation failed', err);
              this.toastService.show('Order creation failed. Please contact support.', 'error');
            } finally {
              this.isProcessing.set(false);
            }
          },
          prefill: {
            name: this.address.name,
            contact: this.address.phone,
            email: this.authService.profile()?.email || ''
          },
          theme: { color: "#e5e5e5" },
          modal: {
            ondismiss: () => {
              this.isProcessing.set(false);
            }
          }
        };
        const rzp = new Razorpay(options);
        rzp.open();
      } else {
        // COD Flow (if implemented later)
        const order = await this.orderService.createOrder({
          userid: profile.id,
          items: orderItems,
          total_amount: total,
          order_status: 'pending',
          payment_status: 'pending',
          payment_method: 'cod',
          shipping_address: this.address
        });
        this.toastService.show('Order placed successfully!', 'success');
        this.cartService.clearCart();
        this.router.navigate(['/orders', order.id]);
        this.isProcessing.set(false);
      }
    } catch (error: unknown) {
      console.error(error instanceof Error ? error.message : error);
      this.toastService.show('Order failed. Please try again.', 'error');
      this.isProcessing.set(false);
    }
  }

  private validateForm(): boolean {
    const { name, email, phone, address, city, state, zip } = this.address;
    if (!name || !email || !phone || !address || !city || !state || !zip) {
      this.toastService.show('Please fill in all shipping details.', 'error');
      return false;
    }
    
    const items = this.cartService.items();
    if (items.length === 0) {
      this.toastService.show('Your cart is empty.', 'error');
      return false;
    }

    const invalidItems = items.filter(item => !item.id);
    if (invalidItems.length > 0) {
      console.error('CheckoutComponent - Invalid items in cart:', invalidItems);
      this.toastService.show('Some items in your cart are invalid. Please clear your cart and try again.', 'error');
      return false;
    }

    return true;
  }
}
