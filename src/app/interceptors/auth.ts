import { HttpInterceptorFn } from '@angular/common/http';
import { auth } from '../firebase';
import { from, switchMap } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const currentUser = auth.currentUser;
  
  if (currentUser) {
    return from(currentUser.getIdToken()).pipe(
      switchMap(token => {
        const authReq = req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`
          }
        });
        return next(authReq);
      })
    );
  }
  
  return next(req);
};
