import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
  UnauthorizedException,
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
import { JwtGuard } from "../../auth/jwt.guard";
import { CheckoutService } from "./checkout.service";
import { CreateVietQrOrderDto } from "./dto/create-vietqr-order.dto";

@ApiTags("Checkout")
@ApiBearerAuth("bearer")
@ApiHeader({
  name: "X-Cart-Token",
  required: true,
  description: "Storefront cart token.",
})
@UseGuards(JwtGuard)
@Controller("checkout")
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post("create-order")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Create a VIETQR order from the current cart for manual approval",
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
    const userId = user?.sub ?? user?.userId ?? user?.id;
    if (!userId) {
      throw new UnauthorizedException("Unauthorized");
    }

    return this.checkoutService.createVietQrOrder(
      userId,
      cartToken,
      dto,
      locale === "vi" ? "vi" : "en",
    );
  }
}
