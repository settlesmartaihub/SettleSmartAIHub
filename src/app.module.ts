// File: src/app.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigurationModule } from './config/config.module';
import { validationSchema } from './config/validation.schema';
import databaseConfig from './config/database.config';

// Feature modules
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { AgentsModule } from './modules/agents/agents.module';
import { PropertiesModule } from './modules/properties/properties.module';
import { ConversationsModule } from './modules/conversations/conversations.module';
import { PropertySearchesModule } from './modules/property-searches/property-searches.module';
import { WhatsAppModule } from './modules/whatsapp/whatsapp.module';

// Middleware and filters
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { ValidationPipe } from './common/pipes/validation.pipe';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema,
      validationOptions: {
        allowUnknown: true,
        abortEarly: true,
      },
    }),
    ConfigurationModule,

    // Static file serving for uploaded images
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),

    // Database
    TypeOrmModule.forRootAsync({
      useFactory: databaseConfig,
    }),

    // Feature Modules
    AuthModule,
    UsersModule,
    AgentsModule,
    PropertiesModule,
    ConversationsModule,
    PropertySearchesModule,
    WhatsAppModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Global exception filter
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    // Global response interceptor
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    // Global validation pipe
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
  ],
})
export class AppModule { }