import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastService = inject(ToastService);
  
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'An unknown error occurred!';
      
      if (error.error instanceof ErrorEvent) {
        // Client-side error
        errorMessage = `Error: ${error.error.message}`;
      } else {
        // Server-side error
        errorMessage = error.error?.message || error.error?.error || error.message || 'Something went wrong';
        
        // Suppress alerts for background system/setup paths
        const isSystemPath = req.url.includes('/api/app-config') || 
                            req.url.includes('/api/auth/me') ||
                            req.url.includes('/api/runtime-config') ||
                            req.url.includes('/api/health') ||
                            req.url.includes('/api/categories') ||
                            req.url.includes('/api/products');

        // Handle specific status codes if needed
        if (error.status === 401) {
          // Unauthorized
          // Only show session expired if we were actually expecting to be logged in ON A SENSITIVE ACTION
          const isUserAction = req.method !== 'GET' || 
                              req.url.includes('/api/orders') || 
                              req.url.includes('/api/users/profile');
          
          if (isUserAction && !isSystemPath) {
            errorMessage = 'Session expired. Please login again.';
          } else {
            // Silently handle unauthorized for background checks
            const handledError = new Error('Unauthorized');
            (handledError as Error & { _isHandled?: boolean })._isHandled = true;
            return throwError(() => handledError);
          }
        } else if (error.status === 403) {
          errorMessage = 'You are not authorized to perform this action.';
        } else if (error.status === 404) {
          // DO NOT show toast for 404 configuration probing or health checks
          if (isSystemPath) {
            const handledError = new Error('Resource not found');
            (handledError as Error & { _isHandled?: boolean })._isHandled = true;
            return throwError(() => handledError);
          }
          errorMessage = 'Resource not found.';
        } else if (error.status === 0) {
          errorMessage = 'Cannot connect to the server. Please check your internet connection.';
          // Only show toast if it's not a background check
          if (isSystemPath) {
            const handledError = new Error(errorMessage);
            (handledError as Error & { _isHandled?: boolean })._isHandled = true;
            return throwError(() => handledError);
          }
        }
      }
      
      // If we got here and it's not a handled background error, show the toast
      // ADDITIONAL GUARD: Don't show generic "Unauthorized" or "Resource not found" for GET requests unless sensitive
      const isGenericError = errorMessage === 'Unauthorized' || errorMessage === 'Resource not found' || errorMessage.includes('401') || errorMessage.includes('404');
      if (req.method === 'GET' && isGenericError && !req.url.includes('/api/orders')) {
        console.warn('Suppressing generic error toast for GET request:', req.url, errorMessage);
      } else {
        toastService.show(errorMessage, 'error');
      }
      
      const handledError = new Error(errorMessage);
      (handledError as Error & { _isHandled?: boolean })._isHandled = true;
      return throwError(() => handledError);
    })
  );
};
