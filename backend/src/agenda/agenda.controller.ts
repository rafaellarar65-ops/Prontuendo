import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { GenericPayloadDto } from '../common/dto/generic-payload.dto';
import { AgendaService } from './agenda.service';

@ApiTags('agenda')
@ApiBearerAuth()
@Controller('agenda')
export class AgendaController {
  constructor(private readonly service: AgendaService) {}

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
  async update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: GenericPayloadDto) {
    const status = dto.payload.status;
    if (status === 'AGENDADO' || status === 'CONFIRMADO' || status === 'EM_ANDAMENTO' || status === 'CONCLUIDO' || status === 'CANCELADO') {
      return this.service.updateStatus(user.tenantId, user.sub, id, status);
    }

    return this.service.update(user.tenantId, id, dto.payload);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover registro do módulo' })
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.remove(user.tenantId, id);
  }

}
