import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

import type { MailSender } from './mail-sender.type.js';

@Injectable()
export class ResendMailSender implements MailSender {
  private readonly logger = new Logger(ResendMailSender.name);
  private readonly resend: Resend;
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
    this.resend = new Resend(config.getOrThrow<string>('RESEND_API_KEY'));
    this.from = config.get<string>('RESEND_FROM') ?? 'noreply@localhost';
  }

  async sendPasswordReset(
    to: string,
    subject: string,
    text: string,
  ): Promise<void> {
    const { error } = await this.resend.emails.send({
      from: this.from,
      to,
      subject,
      text,
    });

    if (error) {
      this.logger.error(`Failed to send password reset email to ${to}`, error);
      throw new Error(`Resend error: ${error.message}`);
    }

    this.logger.log(`Sent password reset email via Resend to ${to}`);
  }
}
