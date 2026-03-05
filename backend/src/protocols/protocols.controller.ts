import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';

import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateProtocolDto } from './dto/create-protocol.dto';
import { ListProtocolsDto } from './dto/list-protocols.dto';
import { ProtocolStatus } from './dto/protocol-status.enum';
import { ProtocolSuggestionsQueryDto } from './dto/protocol-suggestions-query.dto';
import { UpdateProtocolDto } from './dto/update-protocol.dto';
import { ProtocolsService } from './protocols.service';

@ApiTags('protocols')
@ApiBearerAuth()
@Controller('protocols')
export class ProtocolsController {
  constructor(private readonly service: ProtocolsService) {}

  @Post()
  @ApiOperation({ summary: 'Criar protocolo' })
  @ApiBody({ type: CreateProtocolDto })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateProtocolDto) {
    return this.service.create(user.tenantId, user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar protocolos com filtros e paginação' })
  @ApiQuery({ name: 'condition', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: ProtocolStatus })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'perPage', required: false, type: Number })
  list(@CurrentUser() user: AuthUser, @Query() query: ListProtocolsDto) {
    return this.service.list(user.tenantId, query);
  }

  @Get('suggestions')
  @ApiOperation({ summary: 'Sugerir protocolos por diagnóstico' })
  @ApiQuery({ name: 'diagnosis', required: true, type: String })
  suggestions(@CurrentUser() user: AuthUser, @Query() query: ProtocolSuggestionsQueryDto) {
    return this.service.suggestions(user.tenantId, query.diagnosis);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar protocolo por ID' })
  findById(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.findById(user.tenantId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar protocolo' })
  @ApiBody({ type: UpdateProtocolDto })
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateProtocolDto) {
    return this.service.update(user.tenantId, id, dto);
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: 'Ativar protocolo' })
  activate(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.activate(user.tenantId, id);
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Desativar protocolo' })
  deactivate(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.deactivate(user.tenantId, id);
  }
}
