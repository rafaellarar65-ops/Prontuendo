import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateProtocolDto } from './dto/create-protocol.dto';
import { ListProtocolsDto } from './dto/list-protocols.dto';
import { UpdateProtocolDto } from './dto/update-protocol.dto';
import { ProtocolsService } from './protocols.service';

@ApiTags('protocols')
@ApiBearerAuth()
@Controller('protocols')
export class ProtocolsController {
  constructor(private readonly service: ProtocolsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar registros do módulo' })
  list(@CurrentUser() user: AuthUser, @Query() query: ListProtocolsDto) {
    return this.service.list(user.tenantId, query);
  }

  @Post()
  @ApiOperation({ summary: 'Criar registro do módulo' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateProtocolDto) {
    return this.service.create(user.tenantId, user.sub, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar registro do módulo' })
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateProtocolDto) {
    return this.service.update(user.tenantId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover registro do módulo' })
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.remove(user.tenantId, id);
  }

  @Post(':id/ai-consensus')
  @ApiOperation({ summary: 'Consenso multi-IA de protocolo' })
  aiConsensus(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.execute('ai-consensus', user.tenantId, user.sub, { id });
  }
}
