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
  const defaultOrigins = [
    'http://localhost:4200',
    'http://localhost:4201',
    'http://localhost:5173',
    // Production frontends (wildcards handled below)
    'https://ai-agents-lab-peach.vercel.app',
    'https://ai-agents-lab-git-main-fran1014s-projects.vercel.app',
    'https://ai-agents-algyow5h7-fran1014s-projects.vercel.app',
  ];
  const allowedOriginPatterns = [
    /\.vercel\.app$/,
    /\.vercel\.dev$/,
    /\.onrender\.com$/,
  ];
  const envOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',')
        .map((o) => o.trim())
        .filter(Boolean)
    : [];
  const allowedOrigins = envOrigins.length > 0 ? envOrigins : defaultOrigins;

  app.enableCors({
    origin: (origin, callback) => {
      // Allow server-to-server or same-origin calls (no Origin header)
      if (!origin) {
        return callback(null, true);
      }

      // Always allow localhost variants for dev
      if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
        return callback(null, true);
      }

      // Explicit allowlist from env/default
      if (allowedOrigins.includes('*') || allowedOrigins.some((o) => o === origin)) {
        return callback(null, true);
      }

      // Pattern allowlist for Vercel preview/custom domains and Render host
      if (allowedOriginPatterns.some((pattern) => pattern.test(origin))) {
        return callback(null, true);
      }

      return callback(new Error(`Origin ${origin} not allowed by CORS configuration`), false);
    },
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
    .addServer(process.env.API_URL || 'http://localhost:3003', 'Development server')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  const port = process.env.PORT || 3003;
  await app.listen(port);

  logger.log(`🚀 Application is running on: http://localhost:${port}`);
  logger.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
  logger.log(`🔍 Health Check: http://localhost:${port}/api/v1/health`);
}
bootstrap();
