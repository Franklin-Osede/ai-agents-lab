import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const now = Date.now();

    this.logger.log(`${method} ${url} - Request received`);

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse();
          const { statusCode } = response;
          const responseTime = Date.now() - now;
          this.logger.log(`${method} ${url} ${statusCode} - ${responseTime}ms`);
        },
        error: (error: Error) => {
          const responseTime = Date.now() - now;
          this.logger.error(`${method} ${url} - Error after ${responseTime}ms: ${error.message}`);
        },
      }),
    );
  }
}
