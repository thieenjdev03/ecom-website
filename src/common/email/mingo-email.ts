/**
 * Mingo email design system — khớp với storefront (src/styles/globals.css).
 * Mọi email của backend nên render qua đây để đồng bộ brand: màu cam #fe5000,
 * nền cream, chữ nâu ấm, font Be Vietnam Pro.
 *
 * Email client KHÔNG đọc Tailwind/token nên toàn bộ style phải inline + hex cứng.
 */

export const MINGO = {
  orange: '#fe5000', // Primary — CTA, headline accent
  orangeDark: '#c63f00', // hover/pressed (chỉ dùng cho border/nhấn)
  brown: '#563e2b', // body text / heading
  muted: '#77695e', // secondary text
  cream: '#f5f5f5', // nền ngoài
  ivory: '#fff6ec', // tonal layer
  blush: '#fdf2f2', // nền field / code box
  sand: '#ffd9a0', // accent ấm
  butter: '#ffdf82', // accent
  white: '#ffffff',
  border: '#ece3da',
  destructive: '#ba1a1a',
} as const;

// Be Vietnam Pro (đồng bộ frontend) — client nào không tải webfont sẽ fallback.
export const MINGO_FONT =
  "'Be Vietnam Pro','Segoe UI',Roboto,Helvetica,Arial,sans-serif";

export interface MingoEmailBrand {
  brandName: string;
  brandUrl: string;
  supportEmail: string;
  privacyUrl?: string;
  termsUrl?: string;
}

/** Brand mặc định đọc từ env — dùng cho service không tự cấu hình (vd OtpService). */
export function mingoBrandFromEnv(): MingoEmailBrand {
  const raw =
    process.env.MAIL_BRAND_URL ||
    process.env.FRONTEND_URL ||
    'https://mingo-store.vercel.app';
  const brandUrl = raw.replace(/\/+$/, '');
  let host = 'mingo.store';
  try {
    host = new URL(brandUrl).hostname;
  } catch {
    /* giữ fallback */
  }
  return {
    brandName: process.env.MAIL_BRAND_NAME || 'Mingo',
    brandUrl,
    supportEmail: process.env.MAIL_SUPPORT_EMAIL || `support@${host}`,
    privacyUrl: process.env.MAIL_PRIVACY_URL || `${brandUrl}/policies`,
    termsUrl: process.env.MAIL_TERMS_URL || `${brandUrl}/policies`,
  };
}

/** Nút CTA bo tròn kiểu Mingo. */
export function mingoButton(href: string, label: string): string {
  return `
    <a href="${href}"
       style="display:inline-block;background:${MINGO.orange};color:${MINGO.white};
              text-decoration:none;font-weight:700;font-size:16px;line-height:1;
              padding:15px 36px;border-radius:999px;font-family:${MINGO_FONT};">
      ${label}
    </a>`;
}

/** Khối mã OTP nổi bật (nền blush, viền đứt, chữ cam giãn cách). */
export function mingoOtpBlock(code: string): string {
  return `
    <div style="margin:26px auto 20px;max-width:340px;background:${MINGO.blush};
                border:2px dashed #ffb489;border-radius:16px;padding:20px 12px;text-align:center;">
      <div style="font-family:${MINGO_FONT};font-size:36px;font-weight:800;
                  letter-spacing:12px;color:${MINGO.orange};padding-left:12px;">${code}</div>
    </div>`;
}

interface RenderOptions {
  /** <title> + preheader (đoạn text preview trong inbox). */
  title: string;
  preheader?: string;
  /** Nội dung HTML bên trong thẻ card (đã style sẵn hoặc dùng <p>/<h1> thường). */
  content: string;
}

/**
 * Bọc nội dung trong layout email Mingo hoàn chỉnh: nền cream, card trắng bo góc,
 * thanh cam trên đỉnh, wordmark "Mingo 🍦", footer với hỗ trợ + chính sách.
 */
export function renderMingoEmail(brand: MingoEmailBrand, opts: RenderOptions): string {
  const year = new Date().getFullYear();
  const preheader = opts.preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;height:0;width:0;">${opts.preheader}</div>`
    : '';

  const privacyLink = brand.privacyUrl
    ? `<a href="${brand.privacyUrl}" style="color:${MINGO.muted};text-decoration:none;margin:0 8px;">Chính sách bảo mật</a>`
    : '';
  const termsLink = brand.termsUrl
    ? `<a href="${brand.termsUrl}" style="color:${MINGO.muted};text-decoration:none;margin:0 8px;">Điều khoản</a>`
    : '';

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light">
  <title>${opts.title}</title>
  <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;600;700;800&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:${MINGO.cream};font-family:${MINGO_FONT};
             line-height:1.6;color:${MINGO.brown};-webkit-font-smoothing:antialiased;">
  ${preheader}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
         style="background:${MINGO.cream};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0"
               style="max-width:600px;width:100%;background:${MINGO.white};border-radius:20px;
                      overflow:hidden;box-shadow:0 8px 30px rgba(86,62,43,0.08);">
          <!-- top accent bar -->
          <tr><td style="height:6px;background:${MINGO.orange};"></td></tr>

          <!-- header / wordmark -->
          <tr>
            <td align="center" style="padding:32px 28px 8px;">
              <a href="${brand.brandUrl}" style="text-decoration:none;">
                <span style="font-family:${MINGO_FONT};font-size:32px;font-weight:800;
                             color:${MINGO.orange};letter-spacing:-0.5px;">${brand.brandName}</span>
                <span style="font-size:26px;vertical-align:middle;">🍦</span>
              </a>
            </td>
          </tr>
          <tr><td style="padding:0 28px;"><div style="height:1px;background:${MINGO.border};margin-top:16px;"></div></td></tr>

          <!-- content -->
          <tr>
            <td style="padding:28px 32px 8px;font-size:16px;color:${MINGO.brown};">
              ${opts.content}
            </td>
          </tr>

          <!-- footer -->
          <tr><td style="padding:0 28px;"><div style="height:1px;background:${MINGO.border};margin-top:16px;"></div></td></tr>
          <tr>
            <td align="center" style="padding:22px 20px 34px;">
              <p style="margin:0 0 6px;color:${MINGO.muted};font-size:13px;">&copy; ${year} ${brand.brandName}</p>
              <p style="margin:0 0 12px;color:${MINGO.muted};font-size:12px;">
                Cần hỗ trợ? Liên hệ
                <a href="mailto:${brand.supportEmail}" style="color:${MINGO.orange};text-decoration:none;">${brand.supportEmail}</a>
              </p>
              <div style="font-size:12px;">${privacyLink}${termsLink}</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
