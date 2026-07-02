import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { ConsoleMailSender } from './console-mail.sender.js';
import type { MailSender } from './mail-sender.type.js';
import { ResendMailSender } from './resend-mail.sender.js';

export const MAIL_SENDER = 'MAIL_SENDER';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: MAIL_SENDER,
      inject: [ConfigService],
      useFactory: (config: ConfigService): MailSender => {
        const mode = config.get<string>('MAIL_MODE') ?? 'console';
        if (mode === 'resend') {
          return new ResendMailSender(config);
        }
        return new ConsoleMailSender();
      },
    },
  ],
  exports: [MAIL_SENDER],
})
export class MailerModule {}
