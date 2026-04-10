import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take } from 'rxjs';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return toObservable(authService.isAuthReady).pipe(
    filter(ready => ready),
    take(1),
    map(() => {
      if (authService.user()) {
        return true;
      }
      router.navigate(['/login']);
      return false;
    })
  );
};

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return toObservable(authService.isAuthReady).pipe(
    filter(ready => ready),
    take(1),
    map(() => {
      if (authService.isAdmin()) {
        return true;
      }
      router.navigate(['/']);
      return false;
    })
  );
};
