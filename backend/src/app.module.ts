import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { TenantInterceptor } from './common/interceptors/tenant.interceptor';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PatientsModule } from './patients/patients.module';
import { ConsultationsModule } from './consultations/consultations.module';
import { BioimpedanceModule } from './bioimpedance/bioimpedance.module';
import { GlucoseModule } from './glucose/glucose.module';
import { LabResultsModule } from './lab-results/lab-results.module';
import { PrescriptionsModule } from './prescriptions/prescriptions.module';
import { DocumentsModule } from './documents/documents.module';
import { TemplatesModule } from './templates/templates.module';
import { ProtocolsModule } from './protocols/protocols.module';
import { ScoresModule } from './scores/scores.module';
import { AgendaModule } from './agenda/agenda.module';
import { ClinicsModule } from './clinics/clinics.module';
import { AiModule } from './ai/ai.module';
import { PatientPortalModule } from './patient-portal/patient-portal.module';
import { NotificationsModule } from './notifications/notifications.module';
import { DigitalSignatureModule } from './digital-signature/digital-signature.module';
import { PdfEngineModule } from './pdf-engine/pdf-engine.module';
import { ConfigModule as AppConfigModule } from './config/config.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 100,
      },
    ]),
    PrismaModule,
    AuthModule,
    UsersModule,
    PatientsModule,
    ConsultationsModule,
    BioimpedanceModule,
    GlucoseModule,
    LabResultsModule,
    PrescriptionsModule,
    DocumentsModule,
    TemplatesModule,
    ProtocolsModule,
    ScoresModule,
    AgendaModule,
    ClinicsModule,
    AiModule,
    PatientPortalModule,
    NotificationsModule,
    DigitalSignatureModule,
    PdfEngineModule,
    AppConfigModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TenantInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule {}
