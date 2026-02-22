import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();

    return next.handle().pipe(
      tap(() => {
        const method = request.method;
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
          this.logger.log(
            JSON.stringify({
              action: method,
              path: request.originalUrl,
              tenantId: request.tenantId,
              userId: request.user?.sub,
              timestamp: new Date().toISOString(),
            }),
          );
        }
      }),
    );
  }
}
