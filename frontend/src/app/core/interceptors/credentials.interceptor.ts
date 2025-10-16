import { HttpInterceptorFn } from '@angular/common/http';

export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
  // Get JWT token from localStorage
  const TOKEN_KEY = 'archify_access_token';
  const token = localStorage.getItem(TOKEN_KEY);

  // Clone request with credentials and Authorization header if token exists
  let modifiedReq = req.clone({ withCredentials: true });

  if (token) {
    modifiedReq = modifiedReq.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(modifiedReq);
};
