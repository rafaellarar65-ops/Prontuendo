import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class PatientGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const patientId = request.params.patientId ?? request.params.id;

    if (user?.roles?.includes('MEDICO') || user?.roles?.includes('RECEPCAO')) {
      return true;
    }

    return Boolean(user?.roles?.includes('PATIENT') && user.patientId && user.patientId === patientId);
  }
}
