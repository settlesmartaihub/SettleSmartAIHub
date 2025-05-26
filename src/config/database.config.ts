// Filename: src/config/database.config.ts

import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'path';

export default registerAs('database', (): TypeOrmModuleOptions => {
    const isProduction = process.env.NODE_ENV === 'production';
    const isDevelopment = process.env.NODE_ENV === 'development';

    return {
        type: 'postgres',
        host: process.env.DATABASE_HOST || 'localhost',
        port: parseInt(process.env.DATABASE_PORT || '5432', 10),
        username: process.env.DATABASE_USERNAME || 'postgres',
        password: process.env.DATABASE_PASSWORD || '',
        database: process.env.DATABASE_NAME || 'settlesmart_db',

        // SSL Configuration for production
        ssl: isProduction ? {
            rejectUnauthorized: false,
        } : false,

        // Entity Configuration
        entities: [
            join(__dirname, '..', '**', '*.entity{.ts,.js}'),
        ],

        // Migration Configuration
        migrations: [
            join(__dirname, '..', 'database', 'migrations', '*{.ts,.js}'),
        ],

        // Development vs Production Settings
        synchronize: isDevelopment,
        logging: isDevelopment ? ['query', 'error'] : ['error'],

        // Retry Configuration
        retryAttempts: parseInt(process.env.DATABASE_RETRY_ATTEMPTS || '3', 10),
        retryDelay: parseInt(process.env.DATABASE_RETRY_DELAY || '3000', 10),

        // Auto load entities
        autoLoadEntities: true,

        // Migration table name
        migrationsTableName: 'settlesmart_migrations',
    };
});