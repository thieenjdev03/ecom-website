import { Transform } from "class-transformer";
import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

const normalizePaymentMethod = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim().toUpperCase() : value;

/**
 * Accepts the storefront's existing snake_case request while also exposing
 * camelCase aliases for new clients.
 */
export class CreateVietQrOrderDto {
  @ApiPropertyOptional({
    example: "48741946-5c5c-4c4f-aedf-046a30e36f90",
    description: "Saved shipping address ID (legacy storefront field name).",
  })
  @IsOptional()
  @IsUUID(4)
  shipping_address_id?: string;

  @ApiPropertyOptional({
    example: "48741946-5c5c-4c4f-aedf-046a30e36f90",
    description: "Saved shipping address ID.",
  })
  @IsOptional()
  @IsUUID(4)
  shippingAddressId?: string;

  @ApiPropertyOptional({
    example: "03",
    description:
      "Legacy checkout geo field. The saved shipping address is authoritative.",
  })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  province_code?: string;

  @ApiPropertyOptional({
    example: "22501024",
    description:
      "Legacy checkout geo field. The saved shipping address is authoritative.",
  })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  district_code?: string;

  @ApiPropertyOptional({ example: "Call before delivery." })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @ApiPropertyOptional({
    example: "VIETQR",
    enum: ["VIETQR"],
    enumName: "VietQrPaymentMethod",
    description: "Legacy storefront field name. Only VIETQR is accepted.",
  })
  @IsOptional()
  @Transform(normalizePaymentMethod)
  @IsIn(["VIETQR"])
  payment_method?: "VIETQR";

  @ApiPropertyOptional({
    example: "VIETQR",
    enum: ["VIETQR"],
    enumName: "VietQrPaymentMethod",
    description: "Only VIETQR is accepted.",
  })
  @IsOptional()
  @Transform(normalizePaymentMethod)
  @IsIn(["VIETQR"])
  paymentMethod?: "VIETQR";
}
