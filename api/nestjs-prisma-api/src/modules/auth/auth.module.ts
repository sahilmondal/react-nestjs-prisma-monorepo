import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { PrismaService } from '../../prisma.service.js';
import { UsersModule } from '../users/users.module.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { GithubEnabledGuard } from './guards/github-enabled.guard.js';
import { GoogleEnabledGuard } from './guards/google-enabled.guard.js';
import { GithubStrategy } from './strategies/github.strategy.js';
import { GoogleStrategy } from './strategies/google.strategy.js';
import { JwtAccessStrategy } from './strategies/jwt-access.strategy.js';

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ session: false }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      }),
    }),
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [
    PrismaService,
    AuthService,
    JwtAccessStrategy,
    GoogleStrategy,
    GithubStrategy,
    GoogleEnabledGuard,
    GithubEnabledGuard,
  ],
})
export class AuthModule {}
