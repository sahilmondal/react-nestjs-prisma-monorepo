import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { envValidationSchema } from './config/env.validation.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { MailerModule } from './modules/mailer/mailer.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { HealthController } from './health.controller.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
    }),
    MailerModule,
    UsersModule,
    AuthModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
