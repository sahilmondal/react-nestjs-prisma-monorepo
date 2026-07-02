import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import type { Request, Response } from 'express';

import { PrismaService } from '../../prisma.service.js';
import { UsersService } from '../users/users.service.js';
import { MAIL_SENDER } from '../mailer/mailer.module.js';
import type { MailSender } from '../mailer/mail-sender.type.js';
import { REFRESH_TOKEN_COOKIE } from './auth.constants.js';
import {
  generateRefreshSecret,
  hashOpaqueToken,
  timingSafeEqualHex,
} from './auth.tokens.js';
import { AuthProviderKind } from './strategies/google.strategy.js';

export type PublicUser = {
  id: string;
  email: string;
  name: string | null;
  emailVerifiedAt: string | null;
};

export type OAuthProfilePayload = {
  provider: AuthProviderKind;
  providerUserId: string;
  email: string;
  name: string | null;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    @Inject(MAIL_SENDER) private readonly mail: MailSender,
  ) {}

  toPublicUser(user: {
    id: string;
    email: string;
    name: string | null;
    emailVerifiedAt: Date | null;
  }): PublicUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      emailVerifiedAt: user.emailVerifiedAt
        ? user.emailVerifiedAt.toISOString()
        : null,
    };
  }

  private refreshTtlMs(): number {
    const days = this.config.get<number>('REFRESH_TOKEN_TTL_DAYS') ?? 7;
    return days * 24 * 60 * 60 * 1000;
  }

  private accessExpiresSeconds(): number {
    const v = this.config.get<string>('ACCESS_TOKEN_TTL') ?? '15m';
    const m = /^(\d+)m$/i.exec(v);
    if (m) return Number(m[1]) * 60;
    const h = /^(\d+)h$/i.exec(v);
    if (h) return Number(h[1]) * 3600;
    const s = /^(\d+)s$/i.exec(v);
    if (s) return Number(s[1]);
    const n = Number(v);
    if (!Number.isNaN(n) && n > 0) return n;
    return 900;
  }

  private setRefreshCookie(res: Response, cookieValue: string): void {
    const maxAge = this.refreshTtlMs();
    const isProd = this.config.get<string>('NODE_ENV') === 'production';
    res.cookie(REFRESH_TOKEN_COOKIE, cookieValue, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/',
      maxAge,
    });
  }

  clearRefreshCookie(res: Response): void {
    res.clearCookie(REFRESH_TOKEN_COOKIE, {
      httpOnly: true,
      secure: this.config.get<string>('NODE_ENV') === 'production',
      sameSite: 'lax',
      path: '/',
    });
  }

  private async issueSession(
    user: { id: string; email: string; name: string | null; emailVerifiedAt: Date | null },
    req: Request,
    res: Response,
  ): Promise<{ accessToken: string; user: PublicUser }> {
    const secret = generateRefreshSecret();
    const saved = await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashOpaqueToken(secret),
        expiresAt: new Date(Date.now() + this.refreshTtlMs()),
        userAgent:
          (req.headers['user-agent'] ?? '').toString().slice(0, 512) || null,
        ip: req.ip ?? null,
        revokedAt: null,
        replacedByTokenId: null,
      },
    });
    const cookieValue = `${saved.id}.${secret}`;
    this.setRefreshCookie(res, cookieValue);
    const accessToken = await this.jwt.signAsync(
      { sub: user.id, email: user.email },
      { expiresIn: this.accessExpiresSeconds() },
    );
    return { accessToken, user: this.toPublicUser(user) };
  }

  async register(
    dto: { email: string; password: string; name?: string },
    req: Request,
    res: Response,
  ): Promise<{ accessToken: string; user: PublicUser }> {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already registered');
    }
    const passwordHash = await argon2.hash(dto.password);
    const user = await this.usersService.createUser({
      email: dto.email,
      passwordHash,
      name: dto.name ?? null,
    });
    return this.issueSession(user, req, res);
  }

  async login(
    dto: { email: string; password: string },
    req: Request,
    res: Response,
  ): Promise<{ accessToken: string; user: PublicUser }> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user?.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const ok = await argon2.verify(user.passwordHash, dto.password);
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.issueSession(user, req, res);
  }

  parseRefreshCookie(raw: string | undefined): { id: string; secret: string } {
    const parsed = this.parseOpaquePair(raw);
    if (!parsed) {
      throw new UnauthorizedException();
    }
    return parsed;
  }

  private parseOpaquePair(
    raw: string | undefined,
  ): { id: string; secret: string } | null {
    if (!raw?.includes('.')) return null;
    const dot = raw.indexOf('.');
    const id = raw.slice(0, dot);
    const secret = raw.slice(dot + 1);
    if (!id || !secret) return null;
    return { id, secret };
  }

  async refresh(
    req: Request,
    res: Response,
  ): Promise<{ accessToken: string; user: PublicUser }> {
    const { id, secret } = this.parseRefreshCookie(
      req.cookies?.[REFRESH_TOKEN_COOKIE] as string | undefined,
    );
    const row = await this.prisma.refreshToken.findUnique({ where: { id } });
    if (
      !row ||
      row.revokedAt ||
      row.expiresAt.getTime() < Date.now() ||
      !timingSafeEqualHex(row.tokenHash, hashOpaqueToken(secret))
    ) {
      this.clearRefreshCookie(res);
      throw new UnauthorizedException();
    }

    // Rotate — revoke old, create new
    const newSecret = generateRefreshSecret();
    const savedNew = await this.prisma.refreshToken.create({
      data: {
        userId: row.userId,
        tokenHash: hashOpaqueToken(newSecret),
        expiresAt: new Date(Date.now() + this.refreshTtlMs()),
        userAgent:
          (req.headers['user-agent'] ?? '').toString().slice(0, 512) || null,
        ip: req.ip ?? null,
        revokedAt: null,
        replacedByTokenId: null,
      },
    });
    await this.prisma.refreshToken.update({
      where: { id: row.id },
      data: { revokedAt: new Date(), replacedByTokenId: savedNew.id },
    });

    const cookieValue = `${savedNew.id}.${newSecret}`;
    this.setRefreshCookie(res, cookieValue);

    const user = await this.usersService.findById(row.userId);
    if (!user) {
      this.clearRefreshCookie(res);
      throw new UnauthorizedException();
    }
    const accessToken = await this.jwt.signAsync(
      { sub: user.id, email: user.email },
      { expiresIn: this.accessExpiresSeconds() },
    );
    return { accessToken, user: this.toPublicUser(user) };
  }

  async logout(req: Request, res: Response): Promise<void> {
    try {
      const { id, secret } = this.parseRefreshCookie(
        req.cookies?.[REFRESH_TOKEN_COOKIE] as string | undefined,
      );
      const row = await this.prisma.refreshToken.findUnique({ where: { id } });
      if (
        row &&
        !row.revokedAt &&
        timingSafeEqualHex(row.tokenHash, hashOpaqueToken(secret))
      ) {
        await this.prisma.refreshToken.update({
          where: { id: row.id },
          data: { revokedAt: new Date() },
        });
      }
    } catch {
      /* ignore parse errors */
    }
    this.clearRefreshCookie(res);
  }

  async me(userId: string): Promise<{ user: PublicUser }> {
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException();
    return { user: this.toPublicUser(user) };
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.usersService.findByEmail(email);
    if (!user) return; // silently ignore — don't leak email existence
    const secret = generateRefreshSecret();
    const saved = await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashOpaqueToken(secret),
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        usedAt: null,
      },
    });
    const base = this.config
      .getOrThrow<string>('PASSWORD_RESET_URL_BASE')
      .replace(/\/$/, '');
    const url = `${base}?token=${encodeURIComponent(`${saved.id}.${secret}`)}`;
    await this.mail.sendPasswordReset(
      user.email,
      'Reset your password',
      `Use this link to reset your password (valid 1 hour):\n${url}\n`,
    );
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const parsed = this.parseOpaquePair(token);
    if (!parsed) {
      throw new NotFoundException('Invalid or expired token');
    }
    const { id, secret } = parsed;
    const row = await this.prisma.passwordResetToken.findUnique({ where: { id } });
    if (
      !row ||
      row.usedAt ||
      row.expiresAt.getTime() < Date.now() ||
      !timingSafeEqualHex(row.tokenHash, hashOpaqueToken(secret))
    ) {
      throw new NotFoundException('Invalid or expired token');
    }
    const passwordHash = await argon2.hash(newPassword);
    await this.usersService.updatePasswordHash(row.userId, passwordHash);
    await this.prisma.passwordResetToken.update({
      where: { id: row.id },
      data: { usedAt: new Date() },
    });
    // Revoke all active refresh tokens for this user
    await this.prisma.refreshToken.updateMany({
      where: { userId: row.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async completeOAuth(
    profile: OAuthProfilePayload,
    req: Request,
    res: Response,
  ): Promise<{ accessToken: string; user: PublicUser }> {
    // Check if this OAuth account is already linked
    const existingLink = await this.prisma.authProvider.findUnique({
      where: {
        provider_providerUserId: {
          provider: profile.provider,
          providerUserId: profile.providerUserId,
        },
      },
      include: { user: true },
    });
    if (existingLink?.user) {
      return this.issueSession(existingLink.user, req, res);
    }

    // Find or create the user by email
    let user = await this.usersService.findByEmail(profile.email);
    if (!user) {
      user = await this.usersService.createUser({
        email: profile.email,
        passwordHash: null,
        name: profile.name,
      });
    }

    // Attach the OAuth provider link
    await this.prisma.authProvider.create({
      data: {
        userId: user.id,
        provider: profile.provider,
        providerUserId: profile.providerUserId,
      },
    });

    const reloaded = await this.usersService.findById(user.id);
    if (!reloaded) throw new UnauthorizedException();
    return this.issueSession(reloaded, req, res);
  }

  oauthRedirectUrl(): string {
    return this.config.getOrThrow<string>('OAUTH_SUCCESS_REDIRECT');
  }
}
