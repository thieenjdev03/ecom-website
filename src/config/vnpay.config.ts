import { registerAs } from '@nestjs/config';
export default registerAs('vnpay', () => ({
  tmnCode: process.env.VNPAY_TMN_CODE ?? '', hashSecret: process.env.VNPAY_HASH_SECRET ?? '',
  paymentUrl: process.env.VNPAY_URL ?? 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
  returnUrl: process.env.VNPAY_RETURN_URL ?? '', ipnUrl: process.env.VNPAY_IPN_URL ?? '',
}));
