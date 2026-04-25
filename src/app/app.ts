import { ChangeDetectionStrategy, Component, inject, computed, signal } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { HeaderComponent } from './components/layout/header';
import { FooterComponent } from './components/layout/footer';
import { ChatFabComponent } from './components/shared/chat-fab';
import { ToastComponent } from './components/toast/toast';
import { AuthService } from './services/auth';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, FooterComponent, ChatFabComponent, ToastComponent],
  templateUrl: './app.html',
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class App {
  private router = inject(Router);
  authService = inject(AuthService);
  
  isAppLoaded = signal(false);

  constructor() {
    setTimeout(() => {
      this.isAppLoaded.set(true);
    }, 2500);
  }
  
  private currentUrl = toSignal(
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(event => (event as NavigationEnd).urlAfterRedirects)
    ),
    { initialValue: '' }
  );

  isAuthPage = computed(() => {
    const url = this.currentUrl();
    return url.includes('/login') || url.includes('/register');
  });
}
