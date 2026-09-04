import { Transform, Type } from "class-transformer";
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

const normalizePaymentMethod = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim().toUpperCase() : value;

/**
 * Raw shipping address for callers with no saved address book entry — chiefly
 * guest checkout (no JWT), but also usable by a logged-in customer who hasn't
 * saved an address yet. Field names mirror the storefront's checkout payload.
 */
export class CheckoutShippingAddressDto {
  @ApiPropertyOptional({ example: "Nguyen Van A" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  recipient_name: string;

  @ApiPropertyOptional({ example: "+84826426888" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  recipient_phone: string;

  @ApiPropertyOptional({ example: "Quảng Ninh" })
  @IsString()
  @IsNotEmpty()
  province: string;

  @ApiPropertyOptional({ example: "Phường Hồng Tuyến" })
  @IsString()
  @IsNotEmpty()
  district: string;

  @ApiPropertyOptional({ example: "Phường Hồng Tuyến" })
  @IsOptional()
  @IsString()
  ward?: string;

  @ApiPropertyOptional({ example: "738/20/5 Quốc lộ 1A" })
  @IsString()
  @IsNotEmpty()
  street_line_1: string;
}

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
    description:
      "Raw shipping address, used when there is no saved address book entry. Required for guest checkout (no Authorization header).",
    type: CheckoutShippingAddressDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CheckoutShippingAddressDto)
  shipping_address?: CheckoutShippingAddressDto;

  @ApiPropertyOptional({
    description: "Contact email. Optional for guest checkout (phone is the primary identifier).",
    example: "guest@example.com",
  })
  @IsOptional()
  @IsEmail()
  email?: string;

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
    enum: ["VIETQR", "COD"],
    enumName: "CheckoutPaymentMethod",
    description: "Legacy storefront field name. Defaults to VIETQR when omitted.",
  })
  @IsOptional()
  @Transform(normalizePaymentMethod)
  @IsIn(["VIETQR", "COD"])
  payment_method?: "VIETQR" | "COD";

  @ApiPropertyOptional({
    example: "VIETQR",
    enum: ["VIETQR", "COD"],
    enumName: "CheckoutPaymentMethod",
    description: "Defaults to VIETQR when omitted.",
  })
  @IsOptional()
  @Transform(normalizePaymentMethod)
  @IsIn(["VIETQR", "COD"])
  paymentMethod?: "VIETQR" | "COD";
}
