import { BadRequestException } from '@nestjs/common';
import { extractAndValidateMapsSrc } from './maps-embed.util';

describe('extractAndValidateMapsSrc', () => {
  const VALID_SRC =
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d123!2d456!3d789';

  it('extracts src from a full iframe tag with a valid google embed url', () => {
    const raw = `<iframe src="${VALID_SRC}" width="600" height="450" style="border:0;" allowfullscreen loading="lazy"></iframe>`;
    expect(extractAndValidateMapsSrc(raw)).toBe(VALID_SRC);
  });

  it('accepts a bare valid embed url', () => {
    expect(extractAndValidateMapsSrc(VALID_SRC)).toBe(VALID_SRC);
  });

  it('throws when src points to a non-google host', () => {
    const raw = `<iframe src="https://evil.com/maps/embed?pb=1"></iframe>`;
    expect(() => extractAndValidateMapsSrc(raw)).toThrow(BadRequestException);
  });

  it('throws when the google embed url is not https', () => {
    const raw = 'http://www.google.com/maps/embed?pb=1';
    expect(() => extractAndValidateMapsSrc(raw)).toThrow(BadRequestException);
  });

  it('throws when the google.com path is not /maps/embed', () => {
    const raw = 'https://www.google.com/search?q=hello';
    expect(() => extractAndValidateMapsSrc(raw)).toThrow(BadRequestException);
  });

  it('throws when the iframe has no src attribute', () => {
    const raw = `<iframe width="600" height="450" style="border:0;"></iframe>`;
    expect(() => extractAndValidateMapsSrc(raw)).toThrow(BadRequestException);
  });

  it('throws when the input is not a valid URL', () => {
    expect(() => extractAndValidateMapsSrc('not a url at all')).toThrow(BadRequestException);
  });
});
