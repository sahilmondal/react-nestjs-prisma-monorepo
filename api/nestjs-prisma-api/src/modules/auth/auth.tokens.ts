import { createHash, randomBytes, timingSafeEqual } from 'crypto';

export function hashOpaqueToken(secret: string): string {
  return createHash('sha256').update(secret, 'utf8').digest('hex');
}

export function generateRefreshSecret(): string {
  return randomBytes(32).toString('base64url');
}

export function timingSafeEqualHex(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(a, 'hex');
    const bb = Buffer.from(b, 'hex');
    if (ba.length !== bb.length) {
      return false;
    }
    return timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}
