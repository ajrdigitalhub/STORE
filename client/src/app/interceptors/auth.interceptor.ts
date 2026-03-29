import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();
  
  if (token) {
    console.log(`Adding token to request: ${req.url}`);
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  } else {
    console.warn(`No token found for request: ${req.url}`);
  }
  return next(req);
};
