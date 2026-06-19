export interface MailSender {
  sendPasswordReset(to: string, subject: string, text: string): Promise<void>;
}
