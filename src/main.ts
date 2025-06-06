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
import favicon from 'serve-favicon';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Get configuration values with fallbacks
  const port = process.env.PORT || configService.get<number>('app.port') || 3000;
  const apiPrefix = "api/v1";
  const corsOrigins = configService.get<string[]>('app.corsOrigins') || ['*'];
  const environment = process.env.NODE_ENV || configService.get<string>('app.environment') || 'development';

  // NEW: Get Swagger enabled status from environment variable
  const swaggerEnabled = configService.get<string>('SWAGGER_ENABLED') === 'true' || environment === 'development';

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
    disableErrorMessages: environment === 'production',
  }));

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new ResponseInterceptor(),
  );

  // Static file serving
  app.use('/public', express.static(join(__dirname, '..', 'public')));
  app.use(favicon(join(__dirname, '..', 'public', 'favicon.ico')));

  // Add a global root route handler for Render health checks BEFORE setting prefix
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.get('/', (req, res) => {
    res.json({
      message: 'SettleSmart AI Backend - Health Check OK',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      api_base: '/api/v1',
      documentation: swaggerEnabled ? '/api/v1/docs' : 'disabled'
    });
  });

  // Set global prefix AFTER adding root route
  app.setGlobalPrefix(apiPrefix);

  // UPDATED: Swagger Documentation - now controlled by environment variable
  if (swaggerEnabled) {
    const config = new DocumentBuilder()
      .setTitle(configService.get<string>('SWAGGER_TITLE') || 'SettleSmart AI API')
      .setDescription(configService.get<string>('SWAGGER_DESCRIPTION') || 'Intelligent Property Matching API')
      .setVersion(configService.get<string>('SWAGGER_VERSION') || '1.0.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(`${apiPrefix}/docs`, app, document);
  }

  // Listen on all interfaces for Render
  await app.listen(port, '0.0.0.0');

  console.log(`SettleSmart AI Backend running on port: ${port}`);
  console.log(`Environment: ${environment}`);
  console.log(`API Base URL: /${apiPrefix}`);
  console.log(`Root health check: /`);

  if (swaggerEnabled) {
    console.log(`API Documentation: https://settlesmartaihub.onrender.com/${apiPrefix}/docs`);
  } else {
    console.log(`API Documentation: DISABLED (set SWAGGER_ENABLED=true to enable)`);
  }
}

bootstrap().catch(error => {
  console.error('Failed to start application:', error);
  process.exit(1);
});