// File name: src/database/data-source.ts

import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables
config();

const isDevelopment = (process.env.NODE_ENV || 'development') === 'development';
const isProduction = process.env.NODE_ENV === 'production';

console.log(`Database Config - Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`Is Development: ${isDevelopment}`);
console.log(`Is Production: ${isProduction}`);

// Data Source Configuration for TypeORM CLI
export const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USERNAME || 'postgres',
    password: process.env.DATABASE_PASSWORD || '',
    database: process.env.DATABASE_NAME || 'settlesmart_db',

    // SSL Configuration - Only for production/Render
    ssl: isProduction ? {
        rejectUnauthorized: false
    } : false,

    // Entity Discovery
    entities: [
        join(__dirname, '..', 'modules', '**', 'entities', '*.entity{.ts,.js}'),
    ],

    // Migration Configuration
    migrations: [
        join(__dirname, 'migrations', '*{.ts,.js}'),
    ],

    // CRITICAL: Different behavior for different environments
    // Local Development: Use synchronize for easy development
    // Production: Use migrations only
    synchronize: isDevelopment && !isProduction, // Only true in development

    // Auto-run migrations ONLY in production
    migrationsRun: isProduction && process.env.DATABASE_MIGRATIONS_RUN === 'true',

    // Logging
    logging: isDevelopment ? ['query', 'error'] : ['error'],

    // Migration Settings
    migrationsTableName: 'settlesmart_migrations',

    // Connection pool settings optimized per environment
    extra: isProduction ? {
        connectionLimit: 10,
        acquireTimeout: 60000,
        timeout: 60000,
    } : {},
});

// Helper functions
export const initializeDataSource = async (): Promise<DataSource> => {
    if (!AppDataSource.isInitialized) {
        console.log('Initializing database connection...');
        await AppDataSource.initialize();
        console.log('✅ Data Source initialized successfully');

        // Only run migrations in production
        if (isProduction && process.env.DATABASE_MIGRATIONS_RUN === 'true') {
            console.log('Production environment detected. Running migrations...');
            try {
                const migrations = await AppDataSource.runMigrations();
                if (migrations.length === 0) {
                    console.log('✅ No pending migrations found');
                } else {
                    console.log(`✅ Successfully ran ${migrations.length} migrations`);
                }
            } catch (error) {
                console.error('❌ Migration error:', error);
                throw error;
            }
        } else if (isDevelopment) {
            console.log('Development environment - using synchronize mode');
        }
    }
    return AppDataSource;
};

export const destroyDataSource = async (): Promise<void> => {
    if (AppDataSource.isInitialized) {
        await AppDataSource.destroy();
        console.log('✅ Data Source destroyed successfully');
    }
};

export default AppDataSource;