// File name: src/config/validation.schema.ts

import * as Joi from 'joi';

export const validationSchema = Joi.object({
    // Application Environment
    NODE_ENV: Joi.string()
        .valid('development', 'production', 'test', 'staging')
        .default('development'),
    PORT: Joi.number().port().default(3000),
    API_PREFIX: Joi.string().default('api/v1'),

    // Database Configuration - Made more flexible for different environments
    DATABASE_HOST: Joi.string().default('localhost'),
    DATABASE_PORT: Joi.number().port().default(5432),
    DATABASE_USERNAME: Joi.string().default('postgres'),
    DATABASE_PASSWORD: Joi.string().allow('').default(''),
    DATABASE_NAME: Joi.string().default('settlesmart_db'),
    DATABASE_URL: Joi.string().optional(), // For production (Render)
    DATABASE_SSL: Joi.boolean().default(false),
    DATABASE_SYNCHRONIZE: Joi.boolean().default(false),
    DATABASE_MIGRATIONS_RUN: Joi.boolean().default(true),
    DATABASE_MAX_CONNECTIONS: Joi.number().min(1).max(500).default(100),
    DATABASE_MIN_CONNECTIONS: Joi.number().min(1).default(2),
    DATABASE_RETRY_ATTEMPTS: Joi.number().min(0).max(10).default(3),
    DATABASE_RETRY_DELAY: Joi.number().min(1000).default(3000),
    DATABASE_TIMEZONE: Joi.string().default('UTC'),

    // JWT Configuration
    JWT_SECRET: Joi.string().min(8).default('your-super-secret-jwt-key-change-in-production'),
    JWT_EXPIRES_IN: Joi.string().default('24h'),
    JWT_REFRESH_SECRET: Joi.string().min(8).default('your-refresh-secret-change-in-production'),
    JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),

    // Twilio Configuration - More flexible validation
    TWILIO_ACCOUNT_SID: Joi.string().optional().allow(''),
    TWILIO_AUTH_TOKEN: Joi.string().optional().allow(''),
    TWILIO_WHATSAPP_NUMBER: Joi.string().default('+2349113738527'),
    TWILIO_SANDBOX_CODE: Joi.string().optional().allow(''),
    // More flexible URI validation - allows localhost and any valid URL
    TWILIO_WEBHOOK_URL: Joi.string()
        .pattern(/^https?:\/\/.+/)
        .optional()
        .allow('')
        .default('http://localhost:3000/api/v1/whatsapp/incoming'),
    TWILIO_STATUS_CALLBACK: Joi.string()
        .pattern(/^https?:\/\/.+/)
        .optional()
        .allow('')
        .default('http://localhost:3000/api/v1/whatsapp/status'),

    // Webhook Security
    SKIP_WEBHOOK_VALIDATION: Joi.boolean().default(true),
    WHATSAPP_VERIFY_TOKEN: Joi.string().default('settlesmart_verify_token'),
    WEBHOOK_SECRET: Joi.string().default('settlesmart-webhook-secret-2025'),

    // OpenAI Configuration - More flexible
    OPENAI_API_KEY: Joi.string().optional().allow(''),
    OPENAI_MODEL: Joi.string().default('gpt-3.5-turbo'),
    OPENAI_MAX_TOKENS: Joi.number().min(1).max(4000).default(1000),
    OPENAI_TEMPERATURE: Joi.number().min(0).max(2).default(0.7),
    OPENAI_ORGANIZATION: Joi.string().optional().allow(''),

    // Cohere - Optional
    COHERE_API_KEY: Joi.string().optional().allow(''),
    COHERE_MODEL: Joi.string().default('command-xlm-beta'),

    // Google Maps - Optional
    GOOGLE_MAPS_API_KEY: Joi.string().optional().allow(''),

    // Rate Limiting
    THROTTLE_TTL: Joi.number().min(1).max(3600).default(60),
    THROTTLE_LIMIT: Joi.number().min(1).max(1000).default(10),
    WHATSAPP_THROTTLE_LIMIT: Joi.number().min(1).max(100).default(5),

    // File Upload
    MAX_FILE_SIZE: Joi.number().min(1024).default(5242880),
    UPLOAD_PATH: Joi.string().default('./uploads'),
    ALLOWED_IMAGE_TYPES: Joi.string().default('image/jpeg,image/png,image/webp'),

    // Email - Optional
    EMAIL_HOST: Joi.string().default('smtp.gmail.com'),
    EMAIL_PORT: Joi.number().port().default(587),
    EMAIL_SECURE: Joi.boolean().default(false),
    EMAIL_USER: Joi.string().optional().allow(''),
    EMAIL_PASSWORD: Joi.string().optional().allow(''),
    EMAIL_FROM: Joi.string().default('noreply@settlesmart.ai'),

    // SMS - Optional
    SMS_PROVIDER: Joi.string().default('twilio'),
    SMS_API_KEY: Joi.string().optional().allow(''),
    SMS_FROM: Joi.string().default('SettleSmart'),

    // Redis - TODO: Add support for Redis (Optional)
    REDIS_HOST: Joi.string().default('localhost'),
    REDIS_PORT: Joi.number().port().default(6379),
    REDIS_PASSWORD: Joi.string().optional().allow(''),
    REDIS_DB: Joi.number().min(0).max(15).default(0),
    REDIS_KEY_PREFIX: Joi.string().default('settlesmart:'),
    REDIS_CACHE_DB: Joi.number().min(0).max(15).default(1),

    // Security
    BCRYPT_SALT_ROUNDS: Joi.number().min(8).max(15).default(12),
    PASSWORD_MIN_LENGTH: Joi.number().min(6).max(128).default(8),
    OTP_LENGTH: Joi.number().min(4).max(8).default(6),
    OTP_EXPIRY_MINUTES: Joi.number().min(1).max(60).default(10),
    MAX_LOGIN_ATTEMPTS: Joi.number().min(3).max(10).default(5),
    LOCKOUT_DURATION_MINUTES: Joi.number().min(5).max(60).default(15),

    // Logging
    LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug', 'verbose').default('info'),
    LOG_FORMAT: Joi.string().default('combined'),
    LOG_DATE_PATTERN: Joi.string().default('YYYY-MM-DD'),
    LOG_MAX_SIZE: Joi.string().default('20m'),
    LOG_MAX_FILES: Joi.string().default('14d'),

    // Business Logic
    DEFAULT_LOCATION: Joi.string().default('Lugbe, Abuja'),
    MAX_PROPERTIES_PER_AGENT: Joi.number().min(1).max(1000).default(50),
    FREE_AGENT_LISTING_LIMIT: Joi.number().min(1).max(20).default(5),
    PREMIUM_AGENT_LISTING_LIMIT: Joi.number().min(21).max(1000).default(100),
    SEARCH_RADIUS: Joi.number().min(1).max(100).default(10),
    CONVERSATION_TIMEOUT_MINUTES: Joi.number().min(5).max(120).default(30),

    // Feature Flags
    ENABLE_VOICE_MESSAGES: Joi.boolean().default(false),
    ENABLE_MULTI_LANGUAGE: Joi.boolean().default(false),
    ENABLE_PUSH_NOTIFICATIONS: Joi.boolean().default(false),
    ENABLE_ANALYTICS: Joi.boolean().default(true),
    ENABLE_IMAGE_RECOGNITION: Joi.boolean().default(false),

    // CORS - More flexible
    CORS_ORIGINS: Joi.string().default('http://localhost:3000,http://localhost:3001'),

    // SSL/TLS - Optional
    DATABASE_CA_CERT: Joi.string().optional(),
    DATABASE_CLIENT_KEY: Joi.string().optional(),
    DATABASE_CLIENT_CERT: Joi.string().optional(),

    // Health Check
    HEALTH_CHECK_TIMEOUT: Joi.number().min(1000).max(30000).default(5000),
    HEALTH_CHECK_INTERVAL: Joi.number().min(30000).max(300000).default(60000),

    // Swagger
    SWAGGER_ENABLED: Joi.boolean().default(true),
    SWAGGER_TITLE: Joi.string().default('SettleSmart AI API'),
    SWAGGER_DESCRIPTION: Joi.string().default('Intelligent Property Matching API'),
    SWAGGER_VERSION: Joi.string().default('1.0.0'),

    // Admin - Optional
    ADMIN_EMAIL: Joi.string().email().optional(),
    ADMIN_PASSWORD: Joi.string().optional(),

    // Image Processing
    IMAGE_QUALITY: Joi.number().min(1).max(100).default(80),
    THUMBNAIL_WIDTH: Joi.number().min(50).max(1000).default(300),
    THUMBNAIL_HEIGHT: Joi.number().min(50).max(1000).default(200),
});