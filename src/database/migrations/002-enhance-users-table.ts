// src/database/migrations/[timestamp]-enhance-users-table.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnhanceUsersTable1735297200000 implements MigrationInterface {
    name = 'EnhanceUsersTable1735297200000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add conversation_state column if it doesn't exist
        await queryRunner.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS conversation_state JSONB DEFAULT '{
        "currentStep": "greeting",
        "lastMessageAt": null,
        "context": {}
      }'::jsonb
    `);

        // Add indexes for better performance
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_users_status ON users(status)`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_users_budget_range ON users(budget_min, budget_max)`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS idx_users_location ON users(location_preference)`);

        // Update existing users with default conversation state
        await queryRunner.query(`
      UPDATE users 
      SET conversation_state = '{
        "currentStep": "greeting",
        "lastMessageAt": null,
        "context": {}
      }'::jsonb
      WHERE conversation_state IS NULL
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS idx_users_status`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_users_budget_range`);
        await queryRunner.query(`DROP INDEX IF EXISTS idx_users_location`);
        await queryRunner.query(`ALTER TABLE users DROP COLUMN IF EXISTS conversation_state`);
    }
}