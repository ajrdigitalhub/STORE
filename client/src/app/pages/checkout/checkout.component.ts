import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { OrderService } from '../../services/order.service';
import { ToastService } from '../../services/toast.service';
import { PaymentService } from '../../services/payment.service';
import { PaymentConfigService } from '../../services/payment-config.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-4xl mx-auto px-4 pt-24 pb-16">
      <h1 class="text-3xl font-bold text-chrome-100 mb-8">Checkout</h1>

      <div class="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <!-- Form -->
        <div class="lg:col-span-3 space-y-6">
          <!-- Shipping Address -->
          <div class="metallic-card p-6">
            <h2 class="text-chrome-200 font-semibold text-lg mb-4">Shipping Address</h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="sm:col-span-2">
                <label class="text-chrome-400 text-sm mb-1 block">Full Name</label>
                <input [(ngModel)]="address.fullName" class="metallic-input" placeholder="John Doe" />
              </div>
              <div class="sm:col-span-2">
                <label class="text-chrome-400 text-sm mb-1 block">Phone</label>
                <input [(ngModel)]="address.phone" class="metallic-input" placeholder="+91 99999 99999" />
              </div>
              <div class="sm:col-span-2">
                <label class="text-chrome-400 text-sm mb-1 block">Street Address</label>
                <input [(ngModel)]="address.street" class="metallic-input" placeholder="123 Main Street" />
              </div>
              <div>
                <label class="text-chrome-400 text-sm mb-1 block">City</label>
                <input [(ngModel)]="address.city" class="metallic-input" placeholder="Mumbai" />
              </div>
              <div>
                <label class="text-chrome-400 text-sm mb-1 block">State</label>
                <input [(ngModel)]="address.state" class="metallic-input" placeholder="Maharashtra" />
              </div>
              <div>
                <label class="text-chrome-400 text-sm mb-1 block">ZIP Code</label>
                <input [(ngModel)]="address.zipCode" class="metallic-input" placeholder="400001" />
              </div>
              <div>
                <label class="text-chrome-400 text-sm mb-1 block">Country</label>
                <input [(ngModel)]="address.country" class="metallic-input" value="India" />
              </div>
            </div>
          </div>

          <!-- Payment Method -->
          <div class="metallic-card p-6">
            <h2 class="text-chrome-200 font-semibold text-lg mb-4">Payment Method</h2>
            <div class="space-y-3">
              <label class="flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-all"
                [class]="paymentMethod === 'razorpay' ? 'border-chrome-400 bg-chrome-800/50' : 'border-chrome-700 hover:border-chrome-600'">
                <input type="radio" name="payment" value="razorpay" [(ngModel)]="paymentMethod" class="accent-chrome-300" />
                <div>
                  <p class="text-chrome-200 font-medium text-sm">Pay Online (Razorpay)</p>
                  <p class="text-chrome-500 text-xs">Credit/Debit Card, UPI, Net Banking</p>
                </div>
              </label>
              <label class="flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-all"
                [class]="paymentMethod === 'cod' ? 'border-chrome-400 bg-chrome-800/50' : 'border-chrome-700 hover:border-chrome-600'">
                <input type="radio" name="payment" value="cod" [(ngModel)]="paymentMethod" class="accent-chrome-300" />
                <div>
                  <p class="text-chrome-200 font-medium text-sm">Cash on Delivery</p>
                  <p class="text-chrome-500 text-xs">Pay when you receive your order</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        <!-- Order Summary -->
        <div class="lg:col-span-2">
          <div class="metallic-card p-6 sticky top-24 space-y-4">
            <h2 class="text-chrome-200 font-semibold text-lg mb-2">Order Summary</h2>
            <div class="space-y-3 max-h-64 overflow-y-auto">
              @for (item of cartService.items; track item.product) {
                <div class="flex justify-between text-sm">
                  <span class="text-chrome-400 truncate flex-1 mr-2">{{ item.name }} × {{ item.quantity }}</span>
                  <span class="text-chrome-200 font-medium">₹{{ item.price * item.quantity | number }}</span>
                </div>
              }
            </div>
            <div class="border-t border-chrome-700 pt-4 space-y-2">
              <div class="flex justify-between text-sm text-chrome-400">
                <span>Subtotal</span>
                <span>₹{{ cartService.totalAmount | number }}</span>
              </div>
              <div class="flex justify-between text-sm text-chrome-400">
                <span>Shipping</span>
                <span class="text-chrome-300">Free</span>
              </div>
              <div class="flex justify-between text-lg font-bold pt-2 border-t border-chrome-700">
                <span class="text-chrome-200">Total</span>
                <span class="text-white">₹{{ cartService.totalAmount | number }}</span>
              </div>
            </div>

            @if (errorMsg) {
              <div class="bg-chrome-800 border border-chrome-600 text-chrome-300 p-3 rounded-lg text-sm">{{ errorMsg }}</div>
            }

            <button (click)="placeOrder()" [disabled]="processing"
              class="w-full metallic-btn-primary metallic-btn py-3 text-base disabled:opacity-50">
              {{ processing ? 'Processing...' : 'Place Order' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class CheckoutComponent {
  address = { fullName: '', phone: '', street: '', city: '', state: '', zipCode: '', country: 'India' };
  paymentMethod = 'cod';
  processing = false;
  errorMsg = '';

  constructor(
    public cartService: CartService,
    private orderService: OrderService,
    private paymentService: PaymentService,
    private configService: PaymentConfigService,
    private toastService: ToastService,
    private router: Router
  ) {}

  async placeOrder(): Promise<void> {
    if (!this.address.fullName || !this.address.phone || !this.address.street || !this.address.city || !this.address.state || !this.address.zipCode) {
      this.errorMsg = 'Please fill in all address fields';
      return;
    }
    if (this.cartService.items.length === 0) {
      this.errorMsg = 'Your cart is empty';
      return;
    }

    this.processing = true;
    this.errorMsg = '';

    const orderData = {
      items: this.cartService.items.map(i => ({
        product: i.product,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        image: i.image,
        customName: i.customName,
        customImage: i.customImage
      })),
      shippingAddress: this.address,
      paymentMethod: this.paymentMethod,
      totalAmount: this.cartService.totalAmount
    };

    this.orderService.createOrder(orderData).subscribe({
      next: async (order) => {
        if (this.paymentMethod === 'razorpay') {
          try {
            const rzOrder = await this.paymentService.createRazorpayOrder(order.totalAmount, order._id).toPromise();
            const config = await this.configService.getPublicConfig().toPromise();
            const response = await this.paymentService.openRazorpay({
              key: rzOrder.key,
              amount: rzOrder.amount,
              currency: rzOrder.currency,
              order_id: rzOrder.orderId,
              name: config.merchantName || 'IDEAZONE3D',
              description: 'Order Payment',
              image: config.merchantLogo || '',
              theme: { color: '#404040' }
            });
            await this.paymentService.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId: order._id
            }).toPromise();
            this.cartService.clearCart();
            this.toastService.show('🎉 Order Placed Successfully! Get ready for something amazing! 🚀', 'success', 6000);
            this.router.navigate(['/orders']);
          } catch (err: any) {
            console.error('Payment Error:', err);
            this.errorMsg = err.message || 'Payment failed or was cancelled';
            this.processing = false;
          }
        } else {
          this.cartService.clearCart();
          this.toastService.show('🛍️ Order Placed! Thank you for shopping with us! ✨', 'success', 6000);
          this.router.navigate(['/orders']);
        }
      },
      error: (err) => {
        this.errorMsg = err.error?.message || 'Failed to create order';
        this.processing = false;
      }
    });
  }
}
