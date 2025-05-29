// File name: src/database/migrations/003-create-conversations-table.ts

import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateConversationsTable1706400000003 implements MigrationInterface {
    name = 'CreateConversationsTable1706400000003';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TYPE "public"."conversation_status_enum" AS ENUM(
                'active', 'completed', 'abandoned', 'waiting_user', 'waiting_agent'
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "conversations" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "user_phone" character varying(20) NOT NULL,
                "session_id" character varying(100) NOT NULL,
                "messages" jsonb NOT NULL DEFAULT '[]',
                "context" jsonb NOT NULL DEFAULT '{}',
                "status" "public"."conversation_status_enum" NOT NULL DEFAULT 'active',
                "message_count" integer NOT NULL DEFAULT '0',
                "last_activity_at" TIMESTAMP,
                "completed_at" TIMESTAMP,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_conversations" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_conversations_session_id" UNIQUE ("session_id")
            )
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_conversations_user_phone" ON "conversations" ("user_phone")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_conversations_session_id" ON "conversations" ("session_id")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_conversations_status" ON "conversations" ("status")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_conversations_created_at" ON "conversations" ("created_at")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_conversations_updated_at" ON "conversations" ("updated_at")
        `);

        await queryRunner.query(`
            ALTER TABLE "conversations" 
            ADD CONSTRAINT "FK_conversations_user_phone" 
            FOREIGN KEY ("user_phone") 
            REFERENCES "users"("phone_number") 
            ON DELETE CASCADE
        `);

        // Add comments
        await queryRunner.query(`
            COMMENT ON TABLE "conversations" IS 'WhatsApp conversation sessions for AI processing'
        `);

        await queryRunner.query(`
            COMMENT ON COLUMN "conversations"."user_phone" IS 'Nigerian phone number in international format'
        `);

        await queryRunner.query(`
            COMMENT ON COLUMN "conversations"."session_id" IS 'Unique session ID for conversation tracking'
        `);

        await queryRunner.query(`
            COMMENT ON COLUMN "conversations"."messages" IS 'Array of messages with metadata'
        `);

        await queryRunner.query(`
            COMMENT ON COLUMN "conversations"."context" IS 'Conversation context for AI processing'
        `);

        await queryRunner.query(`
            COMMENT ON COLUMN "conversations"."message_count" IS 'Total message count for analytics'
        `);

        await queryRunner.query(`
            COMMENT ON COLUMN "conversations"."last_activity_at" IS 'Last message timestamp'
        `);

        await queryRunner.query(`
            COMMENT ON COLUMN "conversations"."completed_at" IS 'When conversation was completed or abandoned'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "conversations" DROP CONSTRAINT "FK_conversations_user_phone"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_conversations_updated_at"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_conversations_created_at"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_conversations_status"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_conversations_session_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_conversations_user_phone"`);
        await queryRunner.query(`DROP TABLE "conversations"`);
        await queryRunner.query(`DROP TYPE "public"."conversation_status_enum"`);
    }
}