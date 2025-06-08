// File name: scripts/run-migrations.ts

import { config } from 'dotenv';
import { AppDataSource } from '../src/database/data-source';

// Load environment variables
config();

async function runMigrations() {
    try {
        console.log('Initializing database connection...');
        await AppDataSource.initialize();
        
        console.log('Running pending migrations...');
        const migrations = await AppDataSource.runMigrations();
        
        if (migrations.length === 0) {
            console.log('✅ No pending migrations found');
        } else {
            console.log(`✅ Successfully ran ${migrations.length} migrations:`);
            migrations.forEach(migration => {
                console.log(`  - ${migration.name}`);
            });
        }
        
        console.log('Checking database tables...');
        const queryRunner = AppDataSource.createQueryRunner();
        
        const tables = await queryRunner.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name;
        `);
        
        console.log('Available tables:');
        tables.forEach((table: any) => {
            console.log(`  - ${table.table_name}`);
        });
        
        await queryRunner.release();
        await AppDataSource.destroy();
        
        console.log('✅ Migration process completed successfully!');
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
        
        if (AppDataSource.isInitialized) {
            await AppDataSource.destroy();
        }
        
        process.exit(1);
    }
}

// Run migrations
runMigrations();