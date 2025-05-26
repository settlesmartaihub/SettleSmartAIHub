// File name: src/main.ts

import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Get configuration values with fallbacks
  const port = configService.get<number>('app.port') || 3000;
  const apiPrefix = configService.get<string>('app.apiPrefix') || 'api/v1';
  const corsOrigins = configService.get<string[]>('app.corsOrigins') || ['http://localhost:3000'];
  const environment = configService.get<string>('app.environment') || 'development';

  // Set global prefix
  app.setGlobalPrefix(apiPrefix);

  // Enable CORS
  app.enableCors({
    origin: corsOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Global pipes, filters, and interceptors
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new ResponseInterceptor(),
  );

  // Swagger Documentation (only in development)
  if (environment === 'development') {
    const config = new DocumentBuilder()
      .setTitle(configService.get<string>('SWAGGER_TITLE') || 'SettleSmart AI API')
      .setDescription(configService.get<string>('SWAGGER_DESCRIPTION') || 'Intelligent Property Matching API')
      .setVersion(configService.get<string>('SWAGGER_VERSION') || '1.0.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(`${apiPrefix}/docs`, app, document);
  }

  await app.listen(port);
  console.log(`SettleSmart AI Backend running on: http://localhost:${port}/${apiPrefix}`);

  if (environment === 'development') {
    console.log(`API Documentation: http://localhost:${port}/${apiPrefix}/docs`);
  }
}

bootstrap();