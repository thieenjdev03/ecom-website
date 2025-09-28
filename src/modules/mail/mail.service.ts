import { Injectable } from '@nestjs/common';

@Injectable()
export class MailService {
  async sendOrderConfirmation(orderData: any): Promise<void> {
    // TODO: Implement MailerSend order confirmation email
    console.log('Sending order confirmation email:', orderData);
  }

  async sendPasswordReset(email: string, resetToken: string): Promise<void> {
    // TODO: Implement MailerSend password reset email
    console.log('Sending password reset email to:', email);
  }

  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    // TODO: Implement MailerSend welcome email
    console.log('Sending welcome email to:', email);
  }
}
