import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './core/shared/filters/http-exception.filter';
import { LoggingInterceptor } from './core/shared/interceptors/logging.interceptor';
import { TransformInterceptor } from './core/shared/interceptors/transform.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global interceptors
  app.useGlobalInterceptors(new LoggingInterceptor(), new TransformInterceptor());

  // CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('AI Agents Lab API')
    .setDescription(
      'Professional AI agents laboratory for business automation. Built with Clean Architecture, TDD, and Domain-Driven Design.',
    )
    .setVersion('1.0.0')
    .addTag('agents', 'AI Agent endpoints')
    .addTag('booking-agent', 'Automatic appointment booking agent')
    .addTag('dm-response-agent', 'Direct message response agent')
    .addTag('follow-up-agent', 'Automated follow-up agent')
    .addBearerAuth()
    .addServer(process.env.API_URL || 'http://localhost:3001', 'Development server')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log(`🚀 Application is running on: http://localhost:${port}`);
  logger.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
  logger.log(`🔍 Health Check: http://localhost:${port}/api/v1/health`);
}
bootstrap();
