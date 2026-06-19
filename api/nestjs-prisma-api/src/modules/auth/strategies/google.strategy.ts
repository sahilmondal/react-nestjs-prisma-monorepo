import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, type Profile, type VerifyCallback } from 'passport-google-oauth20';

import type { OAuthProfilePayload } from '../auth.service.js';

export enum AuthProviderKind {
  GOOGLE = 'google',
  GITHUB = 'github',
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(config: ConfigService) {
    const enabled = config.get<string>('AUTH_GOOGLE_ENABLED') === 'true';
    super({
      clientID: enabled
        ? config.getOrThrow<string>('GOOGLE_CLIENT_ID')
        : 'disabled',
      clientSecret: enabled
        ? config.getOrThrow<string>('GOOGLE_CLIENT_SECRET')
        : 'disabled',
      callbackURL: `${config.getOrThrow<string>('API_PUBLIC_URL')}/auth/google/callback`,
      scope: ['email', 'profile'],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): void {
    const email = profile.emails?.[0]?.value;
    if (!email) {
      done(new Error('Google account has no email'), false);
      return;
    }
    const payload: OAuthProfilePayload = {
      provider: AuthProviderKind.GOOGLE,
      providerUserId: profile.id,
      email: email.toLowerCase(),
      name: profile.displayName ?? null,
    };
    done(null, payload);
  }
}
