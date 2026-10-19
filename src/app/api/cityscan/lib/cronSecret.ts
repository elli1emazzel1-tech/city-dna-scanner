import { createHash, timingSafeEqual } from 'node:crypto';

export function isCronRequestAuthorized(request: Request, secret: string): boolean {
  const authorization = request.headers.get('authorization');
  const bearerToken = authorization?.match(/^Bearer\s+(\S+)$/i)?.[1];
  const provided = authorization === null
    ? request.headers.get('x-cityscan-secret')
    : bearerToken;
  if (!provided) return false;

  const expectedHash = createHash('sha256').update(secret).digest();
  const providedHash = createHash('sha256').update(provided).digest();
  return timingSafeEqual(providedHash, expectedHash);
}
