import { ChangeDetectionStrategy, Component, inject, computed } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { HeaderComponent } from './components/layout/header';
import { FooterComponent } from './components/layout/footer';
import { AuthService } from './services/auth';
import { SkeletonComponent } from './components/shared/skeleton';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, FooterComponent, SkeletonComponent],
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
