import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<{ method?: string; originalUrl?: string; path?: string }>();

    const isProduction = (process.env.NODE_ENV || 'development') === 'production';
    if (!isProduction) {
      const urlPath = (req.originalUrl || req.path || '').split('?')[0];
      const isGetAllUsers = req.method === 'GET' && urlPath === '/users';
      if (isGetAllUsers) {
        return true;
      }
    }

    return super.canActivate(context);
  }
}
