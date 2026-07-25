import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class LocalizedStringDto {
  // index signature keeps this structurally assignable to the entity's `LangObject`
  // (Record<string, string | null>) for TypeORM's `repository.create()` — invisible to
  // Swagger, which only reads the decorated `en`/`vi` properties below.
  [locale: string]: string | null | undefined;

  @ApiPropertyOptional({ example: 'Premium Polo Shirt', nullable: true })
  @IsOptional()
  @IsString()
  en?: string | null;

  @ApiPropertyOptional({ example: 'Áo Polo Cao Cấp', nullable: true })
  @IsOptional()
  @IsString()
  vi?: string | null;
}
