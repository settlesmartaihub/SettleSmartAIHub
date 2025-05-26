// Filename: src/config/app.config.ts

export default () => ({
    // Application Settings
    app: {
        name: 'SettleSmart AI',
        version: '1.0.0',
        port: parseInt(process.env.PORT || '3000', 10),
        environment: process.env.NODE_ENV || 'development',
        apiPrefix: process.env.API_PREFIX || 'api/v1',
        corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    },

    // Database Configuration
    database: {
        host: process.env.DATABASE_HOST || 'localhost',
        port: parseInt(process.env.DATABASE_PORT || '5432', 10),
        username: process.env.DATABASE_USERNAME || 'postgres',
        password: process.env.DATABASE_PASSWORD || '',
        database: process.env.DATABASE_NAME || 'settlesmart_db',
        ssl: process.env.DATABASE_SSL === 'true',
        synchronize: process.env.NODE_ENV === 'development',
        logging: process.env.NODE_ENV === 'development',
        maxConnections: parseInt(process.env.DATABASE_MAX_CONNECTIONS || '100', 10),
        retryAttempts: parseInt(process.env.DATABASE_RETRY_ATTEMPTS || '3', 10),
        retryDelay: parseInt(process.env.DATABASE_RETRY_DELAY || '3000', 10),
    },

    // JWT Configuration
    jwt: {
        secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
        refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-change-in-production',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    },

    // Twilio WhatsApp Configuration
    twilio: {
        accountSid: process.env.TWILIO_ACCOUNT_SID || '',
        authToken: process.env.TWILIO_AUTH_TOKEN || '',
        whatsappNumber: process.env.TWILIO_WHATSAPP_NUMBER || '+14155238886',
        webhookUrl: process.env.TWILIO_WEBHOOK_URL || 'http://localhost:3000/api/v1/whatsapp/webhook',
        statusCallback: process.env.TWILIO_STATUS_CALLBACK || 'http://localhost:3000/api/v1/whatsapp/status',
    },

    // OpenAI Configuration
    openai: {
        apiKey: process.env.OPENAI_API_KEY || '',
        model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
        maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '1000', 10),
        temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
        organization: process.env.OPENAI_ORGANIZATION || '',
    },

    // Cohere Configuration (for future multilingual support)
    cohere: {
        apiKey: process.env.COHERE_API_KEY || '',
        model: process.env.COHERE_MODEL || 'command-xlm-beta',
    },

    // Rate Limiting Configuration
    throttle: {
        ttl: parseInt(process.env.THROTTLE_TTL || '60', 10),
        limit: parseInt(process.env.THROTTLE_LIMIT || '10', 10),
        whatsappLimit: parseInt(process.env.WHATSAPP_THROTTLE_LIMIT || '5', 10),
    },

    // File Upload Configuration
    upload: {
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10), // 5MB
        allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
        allowedDocumentTypes: ['application/pdf', 'application/msword'],
        uploadPath: process.env.UPLOAD_PATH || './uploads',
    },

    // Email Configuration (for notifications)
    email: {
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT || '587', 10),
        secure: process.env.EMAIL_SECURE === 'true',
        user: process.env.EMAIL_USER || '',
        password: process.env.EMAIL_PASSWORD || '',
        from: process.env.EMAIL_FROM || 'noreply@settlesmart.ai',
    },

    // SMS Configuration (backup communication)
    sms: {
        provider: process.env.SMS_PROVIDER || 'twilio',
        apiKey: process.env.SMS_API_KEY || '',
        from: process.env.SMS_FROM || 'SettleSmart',
    },

    // Redis Configuration (for caching and sessions)
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD || '',
        db: parseInt(process.env.REDIS_DB || '0', 10),
        keyPrefix: process.env.REDIS_KEY_PREFIX || 'settlesmart:',
    },

    // Security Configuration
    security: {
        bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10),
        passwordMinLength: parseInt(process.env.PASSWORD_MIN_LENGTH || '8', 10),
        otpLength: parseInt(process.env.OTP_LENGTH || '6', 10),
        otpExpiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES || '10', 10),
        maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5', 10),
        lockoutDurationMinutes: parseInt(process.env.LOCKOUT_DURATION_MINUTES || '15', 10),
    },

    // Logging Configuration
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        format: process.env.LOG_FORMAT || 'combined',
        datePattern: process.env.LOG_DATE_PATTERN || 'YYYY-MM-DD',
        maxSize: process.env.LOG_MAX_SIZE || '20m',
        maxFiles: process.env.LOG_MAX_FILES || '14d',
    },

    // Business Logic Configuration
    business: {
        defaultLocation: process.env.DEFAULT_LOCATION || 'Lugbe, Abuja',
        maxPropertiesPerAgent: parseInt(process.env.MAX_PROPERTIES_PER_AGENT || '50', 10),
        freeAgentListingLimit: parseInt(process.env.FREE_AGENT_LISTING_LIMIT || '5', 10),
        premiumAgentListingLimit: parseInt(process.env.PREMIUM_AGENT_LISTING_LIMIT || '100', 10),
        searchRadius: parseInt(process.env.SEARCH_RADIUS || '10', 10),
        conversationTimeoutMinutes: parseInt(process.env.CONVERSATION_TIMEOUT_MINUTES || '30', 10),
    },

    // Feature Flags
    features: {
        enableVoiceMessages: process.env.ENABLE_VOICE_MESSAGES === 'true',
        enableMultiLanguage: process.env.ENABLE_MULTI_LANGUAGE === 'true',
        enablePushNotifications: process.env.ENABLE_PUSH_NOTIFICATIONS === 'true',
        enableAnalytics: process.env.ENABLE_ANALYTICS === 'true',
        enableImageRecognition: process.env.ENABLE_IMAGE_RECOGNITION === 'true',
    },
});