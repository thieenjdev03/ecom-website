import { Controller, Get, Head, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../../auth/public.decorator';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Public()
  @Get()
  @ApiOperation({ summary: 'Health check endpoint (GET)' })
  @ApiResponse({
    status: 200,
    description: 'Server is running',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'ok' },
        timestamp: { type: 'number', example: 1737012345678 },
      },
    },
  })
  getHealth() {
    return {
      status: 'ok',
      timestamp: Date.now(),
    };
  }

  @Public()
  @Head()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Health check endpoint (HEAD)' })
  @ApiResponse({
    status: 200,
    description: 'Server is running (no body)',
  })
  headHealth() {
    // HEAD request: return 200 OK with no body
    // NestJS automatically handles this when method returns void/undefined
    return;
  }
}

