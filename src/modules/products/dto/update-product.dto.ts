import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProductDto extends PartialType(
  OmitType(CreateProductDto, ['colorIds', 'sizeIds', 'variants'] as const),
) {}


