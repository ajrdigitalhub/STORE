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
  router = inject(Router);

  address = { name: '', phone: '', street: '', city: '', pincode: '' };
  paymentMethod = signal<'COD' | 'Razorpay'>('COD');
  isProcessing = signal(false);

  async placeOrder() {
    this.isProcessing.set(true);
    try {
      const orderId = `ORD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const total = this.cartService.totalPrice() * 1.18;

      if (this.paymentMethod() === 'Razorpay') {
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
            await this.paymentService.verifyPayment(response);
            await this.finalizeOrder(orderId, total, 'paid');
          },
          prefill: {
            name: this.address.name,
            contact: this.address.phone,
            email: this.authService.user()?.email || ''
          },
          theme: { color: "#e5e5e5" }
        };
        const rzp = new Razorpay(options);
        rzp.open();
      } else {
        await this.finalizeOrder(orderId, total, 'unpaid');
      }
    } catch (error: unknown) {
      console.error(error instanceof Error ? error.message : error);
      alert('Order failed. Please try again.');
    } finally {
      this.isProcessing.set(false);
    }
  }

  private async finalizeOrder(orderId: string, total: number, paymentStatus: 'paid' | 'unpaid') {
    await this.orderService.createOrder({
      orderId,
      customerUid: this.authService.user()?.uid || 'guest',
      items: this.cartService.items(),
      total,
      status: 'pending',
      paymentStatus,
      paymentMethod: this.paymentMethod(),
      shippingAddress: this.address,
      createdAt: new Date().toISOString()
    });
    this.cartService.clearCart();
    
    if (this.authService.user()) {
      this.router.navigate(['/profile']);
    } else {
      alert('Order placed successfully! Order ID: ' + orderId);
      this.router.navigate(['/']);
    }
  }
}
