import { HttpInterceptorFn } from '@angular/common/http';

export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
  // Get JWT token from localStorage
  const TOKEN_KEY = 'archify_access_token';
  const token = localStorage.getItem(TOKEN_KEY);

  console.log('[Interceptor]', req.url, { hasToken: !!token, tokenPreview: token ? token.substring(0, 20) + '...' : 'none' });

  // Clone request with credentials and Authorization header if token exists
  let modifiedReq = req.clone({ withCredentials: true });

  if (token) {
    modifiedReq = modifiedReq.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('[Interceptor] Added Authorization header to', req.url);
  } else {
    console.log('[Interceptor] No token found for', req.url);
  }

  return next(modifiedReq);
};
