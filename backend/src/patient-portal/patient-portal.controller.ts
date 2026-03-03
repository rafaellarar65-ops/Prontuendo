import { Body, Controller, Get, Param, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';

import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { PatientPortalService } from './patient-portal.service';

@ApiTags('patient-portal')
@ApiBearerAuth()
@Controller('patient-portal')
export class PatientPortalController {
  constructor(private readonly patientPortalService: PatientPortalService) {}

  @Get('me')
  @Roles('PATIENT')
  @ApiOperation({ summary: 'Meus dados no portal' })
  me(@CurrentUser() user: AuthUser) {
    return this.patientPortalService.myProfile(user.tenantId, user.patientId!);
  }

  @Get(':patientId/glucose')
  @Roles('PATIENT')
  @ApiOperation({ summary: 'Minha glicemia' })
  myGlucose(@CurrentUser() user: AuthUser, @Param('patientId') patientId: string) {
    return this.patientPortalService.myGlucose(user.tenantId, patientId, user.patientId);
  }

  @Post(':patientId/glucose')
  @Roles('PATIENT')
  @ApiOperation({ summary: 'Registrar glicemia pelo portal' })
  createGlucose(
    @CurrentUser() user: AuthUser,
    @Param('patientId') patientId: string,
    @Body() payload: Record<string, unknown>,
  ) {
    return this.patientPortalService.createGlucose(user.tenantId, patientId, user.patientId, payload);
  }

  @Get(':patientId/glucose/analysis')
  @Roles('PATIENT')
  @ApiOperation({ summary: 'Análise de glicemia' })
  glucoseAnalysis(@CurrentUser() user: AuthUser, @Param('patientId') patientId: string) {
    return this.patientPortalService.myGlucoseAnalysis(user.tenantId, patientId, user.patientId);
  }

  @Get(':patientId/documents')
  @Roles('PATIENT')
  @ApiOperation({ summary: 'Meus documentos' })
  myDocuments(@CurrentUser() user: AuthUser, @Param('patientId') patientId: string) {
    return this.patientPortalService.myDocuments(user.tenantId, patientId, user.patientId);
  }

  @Post(':patientId/upload-exam')
  @Roles('PATIENT')
  @ApiOperation({ summary: 'Upload de exames pelo portal' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
      required: ['file'],
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  uploadExam(
    @CurrentUser() user: AuthUser,
    @Param('patientId') patientId: string,
    @UploadedFile() file: { originalname: string; mimetype: string; size: number; buffer: Buffer },
    @Body() payload: Record<string, unknown>,
  ) {
    return this.patientPortalService.uploadExam(user.tenantId, patientId, user.patientId, user.sub, file, payload);
  }

  @Post(':patientId/questionnaire')
  @Roles('PATIENT')
  @ApiOperation({ summary: 'Enviar questionário pré-consulta' })
  submitQuestionnaire(
    @CurrentUser() user: AuthUser,
    @Param('patientId') patientId: string,
    @Body() payload: Record<string, unknown>,
  ) {
    return this.patientPortalService.submitQuestionnaire(user.tenantId, patientId, user.patientId, user.sub, payload);
  }
}
