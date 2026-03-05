import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { PrescriptionsService } from './prescriptions.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { ListPrescriptionsDto } from './dto/list-prescriptions.dto';
import { UpdatePrescriptionDto } from './dto/update-prescription.dto';

@ApiTags('prescriptions')
@ApiBearerAuth()
@Controller('prescriptions')
export class PrescriptionsController {
  constructor(private readonly service: PrescriptionsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar prescrições com filtros' })
  findAll(@CurrentUser() user: AuthUser, @Query() query: ListPrescriptionsDto) {
    return this.service.findAll(user.tenantId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar prescrição por ID' })
  findById(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.findById(user.tenantId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Criar prescrição' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreatePrescriptionDto) {
    return this.service.create(user.tenantId, user.sub, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar prescrição' })
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdatePrescriptionDto) {
    return this.service.update(user.tenantId, id, dto);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancelar prescrição (soft cancel)' })
  cancel(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.cancel(user.tenantId, id);
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicar prescrição para novo rascunho' })
  duplicate(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.duplicate(user.tenantId, user.sub, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover registro do módulo' })
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.service.remove(user.tenantId, id);
  }

  @Post('search-medication')
  @ApiOperation({ summary: 'Busca de medicamentos (pharmacopoeia)' })
  searchMedication(@CurrentUser() user: AuthUser, @Body('query') query: string) {
    return this.service.searchMedication(user.tenantId, query);
  }
}
