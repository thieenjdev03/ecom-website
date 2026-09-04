import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiHeader,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { Request } from "express";
import { OptionalJwtGuard } from "../../auth/optional-jwt.guard";
import { CheckoutService } from "./checkout.service";
import { CreateVietQrOrderDto } from "./dto/create-vietqr-order.dto";

@ApiTags("Checkout")
@ApiBearerAuth("bearer")
@ApiHeader({
  name: "X-Cart-Token",
  required: true,
  description: "Storefront cart token.",
})
@UseGuards(OptionalJwtGuard)
@Controller("checkout")
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post("create-order")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      "Create an order (VIETQR or COD) from the current cart. Works without login — a guest is identified by shipping_address.recipient_phone and gets a lightweight account so the order can later be claimed.",
  })
  @ApiCreatedResponse({
    description:
      "Order created as PENDING_PAYMENT; no PayPal interaction is performed.",
  })
  async createOrder(
    @Headers("x-cart-token") cartToken: string | undefined,
    @Body() dto: CreateVietQrOrderDto,
    @Query("locale") locale: string | undefined,
    @Req() req: Request,
  ) {
    const user: any = (req as any).user;
    const authenticatedUserId = user?.sub ?? user?.userId ?? user?.id ?? undefined;

    return this.checkoutService.createVietQrOrder(
      authenticatedUserId,
      cartToken,
      dto,
      locale === "vi" ? "vi" : "en",
    );
  }
}
