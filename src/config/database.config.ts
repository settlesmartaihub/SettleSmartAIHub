// File name: src/config/database.config.ts

import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'path';

export default registerAs('database', (): TypeOrmModuleOptions => {
    const isProduction = process.env.NODE_ENV === 'production';
    const isDevelopment = process.env.NODE_ENV === 'development';

    // Production database URL from Render
    const databaseUrl = process.env.DATABASE_URL;

    // Base configuration
    const baseConfig: TypeOrmModuleOptions = {
        type: 'postgres',
        
        // Entity Configuration
        entities: [
            join(__dirname, '..', '**', '*.entity{.ts,.js}'),
        ],

        // Migration Configuration
        migrations: [
            join(__dirname, '..', 'database', 'migrations', '*{.ts,.js}'),
        ],

        // Auto load entities
        autoLoadEntities: true,

        // Migration table name
        migrationsTableName: 'settlesmart_migrations',

        // Retry Configuration
        retryAttempts: parseInt(process.env.DATABASE_RETRY_ATTEMPTS || '3', 10),
        retryDelay: parseInt(process.env.DATABASE_RETRY_DELAY || '3000', 10),
    };

    if (isProduction && databaseUrl) {
        // Production configuration using DATABASE_URL
        return {
            ...baseConfig,
            url: databaseUrl,
            ssl: {
                rejectUnauthorized: false,
            },
            synchronize: false,
            logging: ['error'],
            // Connection pool settings for production
            extra: {
                max: 10, // Maximum connections
                min: 2,  // Minimum connections
                acquire: 30000,
                idle: 10000,
            },
        };
    } else {
        // Development configuration
        return {
            ...baseConfig,
            host: process.env.DATABASE_HOST || 'localhost',
            port: parseInt(process.env.DATABASE_PORT || '5432', 10),
            username: process.env.DATABASE_USERNAME || 'postgres',
            password: process.env.DATABASE_PASSWORD || '',
            database: process.env.DATABASE_NAME || 'settlesmart_db',
            ssl: false,
            synchronize: isDevelopment,
            logging: isDevelopment ? ['query', 'error'] : ['error'],
        };
    }
});