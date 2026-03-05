import { Body, Controller, Get, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';

import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateLabResultDto } from './dto/create-lab-result.dto';
import { LabResultsService } from './lab-results.service';

@ApiTags('lab-results')
@ApiBearerAuth()
@Controller('lab-results')
export class LabResultsController {
  constructor(private readonly labResultsService: LabResultsService) {}

  @Post()
  @Roles('MEDICO', 'RECEPCAO')
  @ApiOperation({ summary: 'Criar resultado de exame laboratorial' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateLabResultDto) {
    return this.labResultsService.create(user.tenantId, dto.patientId, dto);
  }

  @Post('analyze')
  @Roles('MEDICO', 'RECEPCAO')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiOperation({ summary: 'Analisar laudo (imagem/PDF) via IA e extrair dados' })
  analyze(@UploadedFile() file: Express.Multer.File) {
    return this.labResultsService.analyze(file);
  }

  @Get()
  @Roles('MEDICO', 'RECEPCAO', 'PATIENT')
  @ApiOperation({ summary: 'Listar resultados de exames do paciente' })
  findByPatient(
    @CurrentUser() user: AuthUser,
    @Query('patientId') patientId: string,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? Number(limit) : undefined;
    return this.labResultsService.findByPatient(user.tenantId, patientId, parsedLimit);
  }

  @Post('extract')
  @Roles('MEDICO', 'RECEPCAO')
  @ApiOperation({ summary: 'Extração de resultados via IA' })
  extract(@CurrentUser() user: AuthUser, @Body() payload: Record<string, unknown>) {
    return this.labResultsService.extract(user.tenantId, user.sub, payload);
  }
}
