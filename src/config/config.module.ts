// File name: src/config/config.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import appConfig from './app.config';
import databaseConfig from './database.config';
import { validationSchema } from './validation.schema';

@Module({
    imports: [
        NestConfigModule.forRoot({
            // Load configuration files
            load: [appConfig, databaseConfig],

            // Environment file settings
            envFilePath: [
                `.env.${process.env.NODE_ENV || 'development'}`, // Environment-specific file
                '.env', // Default fallback
            ],

            // Validation
            validationSchema,
            validationOptions: {
                allowUnknown: true, // Allow unknown environment variables
                abortEarly: false,  // Report all validation errors
            },

            // Global configuration access
            isGlobal: true,

            // Cache configuration
            cache: true,

            // Expand variables (e.g., DATABASE_URL=${DB_HOST}:${DB_PORT}/${DB_NAME})
            expandVariables: true,
        }),
    ],
    exports: [NestConfigModule],
})
export class ConfigurationModule { }