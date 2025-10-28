import { Injectable } from '@nestjs/common';
// @ts-ignore - PayPal SDK types may not be fully compatible
import paypal = require('@paypal/checkout-server-sdk');

@Injectable()
export class PaypalService {
  private client: paypal.core.PayPalHttpClient;

  constructor() {
    const env =
      process.env.PAYPAL_MODE === 'live'
        ? new paypal.core.LiveEnvironment(
            process.env.PAYPAL_CLIENT_ID,
            process.env.PAYPAL_CLIENT_SECRET,
          )
        : new paypal.core.SandboxEnvironment(
            process.env.PAYPAL_CLIENT_ID,
            process.env.PAYPAL_CLIENT_SECRET,
          );

    this.client = new paypal.core.PayPalHttpClient(env);
  }

  getClient() {
    return this.client;
  }
}

