// Filename: src/database/migrations/001-create-initial-schema.ts - UPDATED VERSION
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInitialSchema1706208000001 implements MigrationInterface {
  name = 'CreateInitialSchema1706208000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enums (FIXED - using TypeORM expected naming convention)
    await queryRunner.query(`
      CREATE TYPE "users_status_enum" AS ENUM('active', 'inactive', 'blocked')
    `);
    await queryRunner.query(`
      CREATE TYPE "agents_verification_status_enum" AS ENUM('pending', 'verified', 'rejected', 'suspended')
    `);
    await queryRunner.query(`
      CREATE TYPE "agents_subscription_tier_enum" AS ENUM('basic', 'premium')
    `);
    await queryRunner.query(`
      CREATE TYPE "agents_status_enum" AS ENUM('active', 'inactive', 'suspended')
    `);
    await queryRunner.query(`
      CREATE TYPE "properties_property_type_enum" AS ENUM('flat', 'house', 'room', 'self-contain')
    `);
    await queryRunner.query(`
      CREATE TYPE "properties_verification_status_enum" AS ENUM('pending', 'verified', 'rejected')
    `);
    await queryRunner.query(`
      CREATE TYPE "properties_status_enum" AS ENUM('available', 'rented', 'maintenance', 'inactive')
    `);
    await queryRunner.query(`
      CREATE TYPE "conversations_status_enum" AS ENUM('active', 'completed', 'abandoned', 'waiting_user', 'waiting_agent')
    `);
    await queryRunner.query(`
      CREATE TYPE "property_searches_search_source_enum" AS ENUM('whatsapp_chat', 'manual_search', 'ai_recommendation', 'similar_properties')
    `);
    await queryRunner.query(`
      CREATE TYPE "property_searches_search_quality_enum" AS ENUM('excellent', 'good', 'fair', 'poor')
    `);

    // Create Users table (FIXED - using correct enum names)
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "phone_number" character varying(20) NOT NULL,
        "name" character varying(100),
        "location_preference" character varying(100) NOT NULL DEFAULT 'Lugbe, Abuja',
        "budget_min" numeric(12,2),
        "budget_max" numeric(12,2),
        "preferences" jsonb,
        "status" "users_status_enum" NOT NULL DEFAULT 'active',
        "last_activity" TIMESTAMP,
        "properties_viewed" integer NOT NULL DEFAULT '0',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_phone_number" UNIQUE ("phone_number")
      )
    `);

    // Create Agents table (UPDATED - with password field)
    await queryRunner.query(`
      CREATE TABLE "agents" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "phone_number" character varying(20) NOT NULL,
        "password" character varying(255),
        "name" character varying(100) NOT NULL,
        "email" character varying(100),
        "business_name" character varying(200),
        "verification_status" "agents_verification_status_enum" NOT NULL DEFAULT 'pending',
        "subscription_tier" "agents_subscription_tier_enum" NOT NULL DEFAULT 'basic',
        "subscription_expires_at" TIMESTAMP,
        "location" character varying(100) NOT NULL DEFAULT 'Lugbe, Abuja',
        "rating" numeric(3,2) NOT NULL DEFAULT '0',
        "total_ratings" integer NOT NULL DEFAULT '0',
        "status" "agents_status_enum" NOT NULL DEFAULT 'active',
        "last_activity" TIMESTAMP,
        "successful_leads" integer NOT NULL DEFAULT '0',
        "total_leads" integer NOT NULL DEFAULT '0',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_agents_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_agents_phone_number" UNIQUE ("phone_number"),
        CONSTRAINT "UQ_agents_email" UNIQUE ("email")
      )
    `);

    // Create Properties table (FIXED - using correct enum names)
    await queryRunner.query(`
      CREATE TABLE "properties" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "agent_id" uuid NOT NULL,
        "title" character varying(200) NOT NULL,
        "description" text,
        "property_type" "properties_property_type_enum" NOT NULL,
        "price" numeric(12,2) NOT NULL,
        "location" jsonb NOT NULL,
        "bedrooms" integer NOT NULL,
        "bathrooms" integer NOT NULL,
        "amenities" jsonb NOT NULL,
        "images" text array NOT NULL DEFAULT '{}',
        "verification_status" "properties_verification_status_enum" NOT NULL DEFAULT 'pending',
        "status" "properties_status_enum" NOT NULL DEFAULT 'available',
        "is_available" boolean NOT NULL DEFAULT true,
        "inquiry_count" integer NOT NULL DEFAULT '0',
        "view_count" integer NOT NULL DEFAULT '0',
        "rented_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_properties_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_properties_agent_id" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE CASCADE
      )
    `);

    // Create Conversations table (FIXED - using correct enum names)
    await queryRunner.query(`
      CREATE TABLE "conversations" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_phone" character varying(20) NOT NULL,
        "session_id" character varying(100) NOT NULL,
        "messages" jsonb NOT NULL DEFAULT '[]',
        "context" jsonb NOT NULL DEFAULT '{}',
        "status" "conversations_status_enum" NOT NULL DEFAULT 'active',
        "message_count" integer NOT NULL DEFAULT '0',
        "last_activity_at" TIMESTAMP,
        "completed_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_conversations_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_conversations_session_id" UNIQUE ("session_id"),
        CONSTRAINT "FK_conversations_user_phone" FOREIGN KEY ("user_phone") REFERENCES "users"("phone_number") ON DELETE CASCADE
      )
    `);

    // Create Property Searches table (FIXED - using correct enum names)
    await queryRunner.query(`
      CREATE TABLE "property_searches" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "user_phone" character varying(20) NOT NULL,
        "search_criteria" jsonb NOT NULL,
        "search_results" jsonb NOT NULL,
        "search_source" "property_searches_search_source_enum" NOT NULL DEFAULT 'whatsapp_chat',
        "search_quality" "property_searches_search_quality_enum",
        "results_count" integer NOT NULL DEFAULT '0',
        "average_matching_score" numeric(5,2),
        "search_metadata" jsonb NOT NULL DEFAULT '{}',
        "original_query" text,
        "conversation_id" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_property_searches_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_property_searches_user_phone" FOREIGN KEY ("user_phone") REFERENCES "users"("phone_number") ON DELETE CASCADE
      )
    `);

    // Create indexes for performance
    // Users indexes
    await queryRunner.query(`CREATE INDEX "IDX_users_phone_number" ON "users" ("phone_number")`);
    await queryRunner.query(`CREATE INDEX "IDX_users_created_at" ON "users" ("created_at")`);
    await queryRunner.query(`CREATE INDEX "IDX_users_location_preference" ON "users" ("location_preference")`);

    // Agents indexes
    await queryRunner.query(`CREATE INDEX "IDX_agents_phone_number" ON "agents" ("phone_number")`);
    await queryRunner.query(`CREATE INDEX "IDX_agents_email" ON "agents" ("email")`);
    await queryRunner.query(`CREATE INDEX "IDX_agents_verification_status" ON "agents" ("verification_status")`);
    await queryRunner.query(`CREATE INDEX "IDX_agents_subscription_tier" ON "agents" ("subscription_tier")`);
    await queryRunner.query(`CREATE INDEX "IDX_agents_location" ON "agents" ("location")`);
    await queryRunner.query(`CREATE INDEX "IDX_agents_created_at" ON "agents" ("created_at")`);

    // Properties indexes
    await queryRunner.query(`CREATE INDEX "IDX_properties_agent_id" ON "properties" ("agent_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_properties_property_type" ON "properties" ("property_type")`);
    await queryRunner.query(`CREATE INDEX "IDX_properties_price" ON "properties" ("price")`);
    await queryRunner.query(`CREATE INDEX "IDX_properties_bedrooms" ON "properties" ("bedrooms")`);
    await queryRunner.query(`CREATE INDEX "IDX_properties_verification_status" ON "properties" ("verification_status")`);
    await queryRunner.query(`CREATE INDEX "IDX_properties_status" ON "properties" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_properties_is_available" ON "properties" ("is_available")`);
    await queryRunner.query(`CREATE INDEX "IDX_properties_created_at" ON "properties" ("created_at")`);

    // JSON indexes for property location
    await queryRunner.query(`CREATE INDEX "IDX_properties_location_area" ON "properties" USING GIN ((location->>'area'))`);

    // Conversations indexes
    await queryRunner.query(`CREATE INDEX "IDX_conversations_user_phone" ON "conversations" ("user_phone")`);
    await queryRunner.query(`CREATE INDEX "IDX_conversations_session_id" ON "conversations" ("session_id")`);
    await queryRunner.query(`CREATE INDEX "IDX_conversations_status" ON "conversations" ("status")`);
    await queryRunner.query(`CREATE INDEX "IDX_conversations_created_at" ON "conversations" ("created_at")`);
    await queryRunner.query(`CREATE INDEX "IDX_conversations_updated_at" ON "conversations" ("updated_at")`);

    // Property Searches indexes
    await queryRunner.query(`CREATE INDEX "IDX_property_searches_user_phone" ON "property_searches" ("user_phone")`);
    await queryRunner.query(`CREATE INDEX "IDX_property_searches_created_at" ON "property_searches" ("created_at")`);
    await queryRunner.query(`CREATE INDEX "IDX_property_searches_search_source" ON "property_searches" ("search_source")`);
    await queryRunner.query(`CREATE INDEX "IDX_property_searches_results_count" ON "property_searches" ("results_count")`);
    await queryRunner.query(`CREATE INDEX "IDX_property_searches_search_quality" ON "property_searches" ("search_quality")`);

    console.log('✅ SettleSmart AI database schema created successfully!');
    console.log('📊 Tables created: users, agents, properties, conversations, property_searches');
    console.log('⚡ Indexes created for optimal performance');
    console.log('🔐 Password authentication enabled for agents');
    console.log('🇳🇬 Nigerian phone number support enabled');
    console.log('📱 WhatsApp integration ready');
    console.log('🤖 AI conversation tracking ready');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes first
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_property_searches_search_quality"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_property_searches_results_count"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_property_searches_search_source"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_property_searches_created_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_property_searches_user_phone"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_conversations_updated_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_conversations_created_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_conversations_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_conversations_session_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_conversations_user_phone"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_properties_location_area"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_properties_created_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_properties_is_available"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_properties_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_properties_verification_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_properties_bedrooms"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_properties_price"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_properties_property_type"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_properties_agent_id"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_agents_created_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_agents_location"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_agents_subscription_tier"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_agents_verification_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_agents_email"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_agents_phone_number"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_location_preference"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_created_at"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_phone_number"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE IF EXISTS "property_searches"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "conversations"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "properties"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "agents"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);

    // Drop enums (FIXED - using correct enum names)
    await queryRunner.query(`DROP TYPE IF EXISTS "property_searches_search_quality_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "property_searches_search_source_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "conversations_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "properties_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "properties_verification_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "properties_property_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "agents_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "agents_subscription_tier_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "agents_verification_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "users_status_enum"`);

    console.log('❌ SettleSmart AI database schema dropped successfully');
  }
}