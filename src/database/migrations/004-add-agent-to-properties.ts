// File name: src/database/migrations/004-add-agent-to-properties.ts

import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAgentToProperties1706500000004 implements MigrationInterface {
    name = 'AddAgentToProperties1706500000004';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add agent_id column to properties table
        await queryRunner.query(`
            ALTER TABLE "properties" 
            ADD COLUMN "agent_id" uuid
        `);

        // Add foreign key constraint
        await queryRunner.query(`
            ALTER TABLE "properties" 
            ADD CONSTRAINT "FK_properties_agent_id" 
            FOREIGN KEY ("agent_id") 
            REFERENCES "agents"("id") 
            ON DELETE SET NULL
        `);

        // Add index for better query performance
        await queryRunner.query(`
            CREATE INDEX "IDX_properties_agent_id" ON "properties" ("agent_id")
        `);

        // Add comment
        await queryRunner.query(`
            COMMENT ON COLUMN "properties"."agent_id" IS 'Reference to the agent managing this property'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_properties_agent_id"`);
        await queryRunner.query(`ALTER TABLE "properties" DROP CONSTRAINT "FK_properties_agent_id"`);
        await queryRunner.query(`ALTER TABLE "properties" DROP COLUMN "agent_id"`);
    }
}