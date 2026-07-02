import { Injectable, Logger } from '@nestjs/common';

import type { MailSender } from './mail-sender.type.js';

@Injectable()
export class ConsoleMailSender implements MailSender {
  private readonly logger = new Logger(ConsoleMailSender.name);

  async sendPasswordReset(
    to: string,
    subject: string,
    text: string,
  ): Promise<void> {
    this.logger.log(`[password reset] to=${to} subject=${subject}\n${text}`);
  }
}
