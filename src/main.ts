// File name: src/main.ts

import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { join } from 'path';
import * as express from 'express';
import * as favicon from 'serve-favicon';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Get configuration values with fallbacks
  // CRITICAL: Use Render's PORT environment variable or fallback to 3000
  const port = process.env.PORT || configService.get<number>('app.port') || 3000;
  const apiPrefix = configService.get<string>('app.apiPrefix') || 'api/v1';
  const corsOrigins = configService.get<string[]>('app.corsOrigins') || ['*']; // Allow all origins in production
  const environment = process.env.NODE_ENV || configService.get<string>('app.environment') || 'development';

  // Set global prefix
  app.setGlobalPrefix(apiPrefix);

  // Enable CORS with more permissive settings for production
  app.enableCors({
    origin: environment === 'production' ? true : corsOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // Global pipes, filters, and interceptors
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    disableErrorMessages: environment === 'production', // Hide detailed errors in production
  }));

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new ResponseInterceptor(),
  );

  app.use('/public', express.static(join(__dirname, '..', 'public')));
  app.use(favicon(join(__dirname, '..', 'public', 'logo.svg')));

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

  // CRITICAL: Listen on all interfaces (0.0.0.0) for Render
  await app.listen(port, '0.0.0.0');

  console.log(`SettleSmart AI Backend running on port: ${port}`);
  console.log(`Environment: ${environment}`);
  console.log(`API Base URL: /${apiPrefix}`);
  
  if (environment === 'development') {
    console.log(`API Documentation: http://localhost:${port}/${apiPrefix}/docs`);
  }
}

bootstrap().catch(error => {
  console.error('Failed to start application:', error);
  process.exit(1);
});