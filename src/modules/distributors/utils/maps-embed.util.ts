import { BadRequestException } from '@nestjs/common';

const IFRAME_SRC_REGEX = /src\s*=\s*["']([^"']+)["']/i;

export function extractAndValidateMapsSrc(raw: string): string {
  const trimmed = (raw ?? '').trim();

  let candidate: string;
  if (/<iframe/i.test(trimmed)) {
    const match = trimmed.match(IFRAME_SRC_REGEX);
    if (!match) {
      throw new BadRequestException('Không tìm thấy src trong iframe');
    }
    candidate = match[1];
  } else {
    candidate = trimmed;
  }

  candidate = candidate.trim();

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    throw new BadRequestException('URL không hợp lệ');
  }

  const isWhitelisted =
    url.protocol === 'https:' && url.hostname === 'www.google.com' && url.pathname.startsWith('/maps/embed');

  if (!isWhitelisted) {
    throw new BadRequestException('Chỉ chấp nhận Google Maps embed URL');
  }

  return candidate;
}
