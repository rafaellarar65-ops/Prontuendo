import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

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

  @Get(':patientId/documents')
  @Roles('PATIENT')
  @ApiOperation({ summary: 'Meus documentos' })
  myDocuments(@CurrentUser() user: AuthUser, @Param('patientId') patientId: string) {
    return this.patientPortalService.myDocuments(user.tenantId, patientId, user.patientId);
  }

  @Post(':patientId/upload-exam')
  @Roles('PATIENT')
  @ApiOperation({ summary: 'Upload de exames pelo portal' })
  uploadExam(
    @CurrentUser() user: AuthUser,
    @Param('patientId') patientId: string,
    @Body() payload: Record<string, unknown>,
  ) {
    return this.patientPortalService.uploadExam(user.tenantId, patientId, user.patientId, user.sub, payload);
  }
}
