import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { GenericPayloadDto } from '../common/dto/generic-payload.dto';
import { DigitalSignatureService } from './digital-signature.service';

@ApiTags('digital-signature')
@ApiBearerAuth()
@Controller('digital-signature')
export class DigitalSignatureController {
  constructor(private readonly service: DigitalSignatureService) {}

  @Get()
  @ApiOperation({ summary: 'Listar registros do módulo' })
  list(@CurrentUser() user: AuthUser) {
    return this.service.list(user.tenantId);
  }

  @Post()
  @ApiOperation({ summary: 'Criar registro do módulo' })
  create(@CurrentUser() user: AuthUser, @Body() dto: GenericPayloadDto) {
    return this.service.create(user.tenantId, user.sub, dto.payload);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar registro do módulo' })
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: GenericPayloadDto) {
    return this.service.update(user.tenantId, id, dto.payload);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover registro do módulo' })
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.remove(user.tenantId, id);
  }

  @Post('sign')
  @ApiOperation({ summary: 'Assinar com ICP-Brasil' })
  sign(@CurrentUser() user: AuthUser, @Body() dto: GenericPayloadDto) {
    return this.service.execute('sign', user.tenantId, user.sub, dto.payload);
  }

  @Post('verify')
  @ApiOperation({ summary: 'Verificar assinatura' })
  verify(@CurrentUser() user: AuthUser, @Body() dto: GenericPayloadDto) {
    return this.service.execute('verify', user.tenantId, user.sub, dto.payload);
  }

  @Post('timestamp')
  @ApiOperation({ summary: 'Aplicar carimbo de tempo' })
  timestamp(@CurrentUser() user: AuthUser, @Body() dto: GenericPayloadDto) {
    return this.service.execute('timestamp', user.tenantId, user.sub, dto.payload);
  }

}
