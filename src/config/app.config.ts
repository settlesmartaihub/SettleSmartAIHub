// File name: src/config/app.config.ts

import { registerAs } from '@nestjs/config';

export default registerAs('app', () => {
    const environment = process.env.NODE_ENV || 'development';
    
    return {
        // Environment
        environment,
        
        // Port Configuration - Critical for Render
        port: parseInt(process.env.PORT || '3000', 10),
        
        // API Configuration
        apiPrefix: process.env.API_PREFIX || 'api/v1',
        
        // CORS Configuration
        corsOrigins: environment === 'production' 
            ? ['*'] // Allow all origins in production for easier testing
            : (process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001']),
        
        // Rate Limiting
        throttle: {
            ttl: parseInt(process.env.THROTTLE_TTL || '60', 10),
            limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
        },
        
        // File Upload
        upload: {
            maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10),
            uploadPath: process.env.UPLOAD_PATH || './uploads',
        },
        
        // Business Logic
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
            enableAnalytics: process.env.ENABLE_ANALYTICS !== 'false', // Default true
            enableImageRecognition: process.env.ENABLE_IMAGE_RECOGNITION === 'true',
        },
        
        // Health Check
        healthCheck: {
            timeout: parseInt(process.env.HEALTH_CHECK_TIMEOUT || '5000', 10),
            interval: parseInt(process.env.HEALTH_CHECK_INTERVAL || '60000', 10),
        },
        
        // Swagger/Documentation
        swagger: {
            enabled: environment === 'development' || process.env.SWAGGER_ENABLED === 'true',
            title: process.env.SWAGGER_TITLE || 'SettleSmart AI API',
            description: process.env.SWAGGER_DESCRIPTION || 'Intelligent Property Matching API for Nigeria',
            version: process.env.SWAGGER_VERSION || '1.0.0',
        },
    };
});