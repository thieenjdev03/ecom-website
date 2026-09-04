import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Same 'jwt' strategy as JwtGuard, but never throws on a missing/invalid
 * token — req.user is just null for guests. Routes that must support both
 * anonymous and authenticated callers (e.g. guest checkout) use this instead
 * of JwtGuard and branch on req.user themselves.
 */
@Injectable()
export class OptionalJwtGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any) {
    return user || null;
  }
}
