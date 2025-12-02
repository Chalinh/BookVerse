import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Cookie-based auth handles credentials automatically, no manual headers needed
  return next(req);
};
