import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { GenericPayloadDto } from '../common/dto/generic-payload.dto';
import { DrugTemplatesService } from './drug-templates.service';

class DrugTemplatesQueryDto {
  @ApiPropertyOptional({ name: 'class' })
  @IsOptional()
  @IsString()
  class?: string;
}

@ApiTags('prescriptions')
@ApiBearerAuth()
@Controller('prescriptions/drug-templates')
export class DrugTemplatesController {
  constructor(private readonly drugTemplatesService: DrugTemplatesService) {}

  @Get()
  @Roles('MEDICO')
  @ApiOperation({ summary: 'Listar templates de medicamentos por classe' })
  list(@CurrentUser() user: AuthUser, @Query() query: DrugTemplatesQueryDto) {
    return this.drugTemplatesService.list(user.tenantId, query.class);
  }

  @Post()
  @Roles('MEDICO')
  @ApiOperation({ summary: 'Criar template de medicamento' })
  create(@CurrentUser() user: AuthUser, @Body() dto: GenericPayloadDto) {
    return this.drugTemplatesService.create(user.tenantId, user.sub, dto.payload);
  }
}
