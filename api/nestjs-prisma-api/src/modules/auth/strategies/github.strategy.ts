import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import type { VerifyCallback } from 'passport-oauth2';
import { Strategy, type Profile } from 'passport-github2';

import type { OAuthProfilePayload } from '../auth.service.js';
import { AuthProviderKind } from './google.strategy.js';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(config: ConfigService) {
    const enabled = config.get<string>('AUTH_GITHUB_ENABLED') === 'true';
    super({
      clientID: enabled
        ? config.getOrThrow<string>('GITHUB_CLIENT_ID')
        : 'disabled',
      clientSecret: enabled
        ? config.getOrThrow<string>('GITHUB_CLIENT_SECRET')
        : 'disabled',
      callbackURL: `${config.getOrThrow<string>('API_PUBLIC_URL')}/auth/github/callback`,
      scope: ['user:email'],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): void {
    const email =
      profile.emails?.[0]?.value ??
      (profile.username
        ? `${profile.username}@users.noreply.github.com`
        : null);
    if (!email) {
      done(new Error('GitHub account has no email'), false);
      return;
    }
    const payload: OAuthProfilePayload = {
      provider: AuthProviderKind.GITHUB,
      providerUserId: String(profile.id),
      email: email.toLowerCase(),
      name: profile.displayName ?? profile.username ?? null,
    };
    done(null, payload);
  }
}
