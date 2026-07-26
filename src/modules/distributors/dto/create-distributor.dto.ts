import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsArray, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDistributorDto {
  @ApiProperty({ example: 'Hòa Thọ Mart' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: '123 Lê Lợi' })
  @IsString()
  @IsNotEmpty()
  address_line: string;

  @ApiPropertyOptional({ nullable: true, example: 'Hải Châu' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  district_text?: string;

  @ApiProperty({ example: '20194' })
  @IsString()
  @IsNotEmpty()
  ward_code: string;

  @ApiProperty({ example: 'Phường Hải Châu' })
  @IsString()
  @IsNotEmpty()
  ward_name: string;

  @ApiProperty({ example: '48' })
  @IsString()
  @IsNotEmpty()
  province_code: string;

  @ApiProperty({ example: 'Đà Nẵng' })
  @IsString()
  @IsNotEmpty()
  province_name: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Raw Google Maps <iframe> tag or embed URL' })
  @IsString()
  @IsNotEmpty()
  maps_embed: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiProperty({ type: [String], format: 'uuid' })
  @IsArray()
  @IsUUID('all', { each: true })
  category_ids: string[];

  @ApiProperty({ type: [String], format: 'uuid' })
  @IsArray()
  @IsUUID('all', { each: true })
  collection_ids: string[];
}
