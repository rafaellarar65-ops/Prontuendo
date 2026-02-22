import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller()
export class AppController {
  @Get('health')
  @ApiOperation({ summary: 'Health-check global da API' })
  health() {
    return {
      service: 'endocrinopront-pro-api',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
