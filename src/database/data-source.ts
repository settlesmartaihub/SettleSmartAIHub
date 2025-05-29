// File name: src/database/data-source.ts

import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';

// Load environment variables
config();

const isDevelopment = (process.env.NODE_ENV || 'development') === 'development';

// Data Source Configuration for TypeORM CLI
export const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432', 10),
    username: process.env.DATABASE_USERNAME || 'postgres',
    password: process.env.DATABASE_PASSWORD || '',
    database: process.env.DATABASE_NAME || 'settlesmart_db',

    // Entity Discovery
    entities: [
        join(__dirname, '..', 'modules', '**', 'entities', '*.entity{.ts,.js}'),
    ],

    // Migration Configuration
    migrations: [
        join(__dirname, 'migrations', '*{.ts,.js}'),
    ],

    // Development Settings
    synchronize: isDevelopment,
    logging: isDevelopment ? ['query', 'error'] : ['error'],

    // Migration Settings
    migrationsTableName: 'settlesmart_migrations',
});

// Helper functions
export const initializeDataSource = async (): Promise<DataSource> => {
    if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
        console.log('Data Source initialized successfully');
    }
    return AppDataSource;
};

export const destroyDataSource = async (): Promise<void> => {
    if (AppDataSource.isInitialized) {
        await AppDataSource.destroy();
        console.log('Data Source destroyed successfully');
    }
};

export default AppDataSource;