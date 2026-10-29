import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { HealthResponse } from '../common/api';
import { Public } from '../common/decorators/public.decorator';
import { ResponseMessage } from '../common/decorators/response-message.decorator';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Public()
  @Get()
  @ResponseMessage('Service is healthy')
  @ApiOkResponse({ description: 'Process is up' })
  health(): HealthResponse {
    return { status: 'ok' };
  }
}
