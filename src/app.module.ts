// Filename: src/app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { ConfigurationModule } from './config/config.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Import all feature modules (they handle their own controllers/services)
import { UsersModule } from './modules/users/users.module';
import { AgentsModule } from './modules/agents/agents.module';
import { PropertiesModule } from './modules/properties/properties.module';
import { ConversationsModule } from './modules/conversations/conversations.module';
import { PropertySearchesModule } from './modules/property-searches/property-searches.module';

// Import the new Auth module
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    // Configuration Module (must be first)
    ConfigurationModule,

    // Database Module with configuration
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const dbConfig = configService.get('database');
        if (!dbConfig) {
          throw new Error('Database configuration not found');
        }
        return dbConfig;
      },
      inject: [ConfigService],
    }),

    // Authentication Module (add this)
    AuthModule,

    // Feature Modules (these handle their own controllers/services)
    UsersModule,
    AgentsModule,
    PropertiesModule,
    ConversationsModule,
    PropertySearchesModule,
  ],
  controllers: [
    AppController,
    // Remove individual controllers - they're handled by their modules
  ],
  providers: [
    AppService,
    // Remove individual services - they're handled by their modules
  ],
})
export class AppModule { }