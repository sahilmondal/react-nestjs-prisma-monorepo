import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';

import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import type { OAuthProfilePayload } from './auth.service.js';
import { AuthService } from './auth.service.js';
import {
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
} from './dto/auth.dto.js';
import { GithubEnabledGuard } from './guards/github-enabled.guard.js';
import { GoogleEnabledGuard } from './guards/google-enabled.guard.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(200)
  register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.register(dto, req, res);
  }

  @Post('login')
  @HttpCode(200)
  login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.login(dto, req, res);
  }

  @Post('refresh')
  @HttpCode(200)
  refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.authService.refresh(req, res);
  }

  @Post('logout')
  @HttpCode(200)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.authService.logout(req, res);
    return { ok: true };
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  me(@CurrentUser() user: { userId: string }) {
    return this.authService.me(user.userId);
  }

  @Post('forgot-password')
  @HttpCode(200)
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.forgotPassword(dto.email);
    return { ok: true };
  }

  @Post('reset-password')
  @HttpCode(200)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto.token, dto.password);
    return { ok: true };
  }

  @Get('google')
  @UseGuards(GoogleEnabledGuard, AuthGuard('google'))
  googleAuth() {
    /* passport redirects */
  }

  @Get('google/callback')
  @UseGuards(GoogleEnabledGuard, AuthGuard('google'))
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const profile = req.user as OAuthProfilePayload;
    await this.authService.completeOAuth(profile, req, res);
    return res.redirect(this.authService.oauthRedirectUrl());
  }

  @Get('github')
  @UseGuards(GithubEnabledGuard, AuthGuard('github'))
  githubAuth() {
    /* passport redirects */
  }

  @Get('github/callback')
  @UseGuards(GithubEnabledGuard, AuthGuard('github'))
  async githubCallback(@Req() req: Request, @Res() res: Response) {
    const profile = req.user as OAuthProfilePayload;
    await this.authService.completeOAuth(profile, req, res);
    return res.redirect(this.authService.oauthRedirectUrl());
  }
}
