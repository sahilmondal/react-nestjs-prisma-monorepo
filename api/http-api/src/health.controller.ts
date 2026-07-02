import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Health')
@Controller()
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'API root health check' })
  root() {
    return { ok: true, service: 'api' };
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  health() {
    return { status: 'up' };
  }
}
