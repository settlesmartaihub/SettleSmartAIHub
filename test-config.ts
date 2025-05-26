// File name: test-config.ts

import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ConfigurationModule } from './src/config/config.module';

async function testConfig() {
    try {
        console.log('Testing SettleSmart Configuration...\n');

        const app = await NestFactory.createApplicationContext(ConfigurationModule);
        const config = app.get(ConfigService);

        console.log('APPLICATION CONFIGURATION');
        console.log('============================');
        console.log('App Name:', config.get('app.name'));
        console.log('Environment:', config.get('app.environment'));
        console.log('Port:', config.get('app.port'));
        console.log('API Prefix:', config.get('app.apiPrefix'));

        console.log('\nDATABASE CONFIGURATION');
        console.log('===========================');
        console.log('Host:', config.get('database.host'));
        console.log('Port:', config.get('database.port'));
        console.log('Database:', config.get('database.database'));
        console.log('Username:', config.get('database.username'));
        console.log('Password Set:', !!config.get('database.password'));
        console.log('Synchronize:', config.get('database.synchronize'));

        console.log('\nSECURITY CONFIGURATION');
        console.log('==========================');
        console.log('JWT Secret Set:', !!config.get('jwt.secret'));
        console.log('JWT Expires In:', config.get('jwt.expiresIn'));
        console.log('Bcrypt Salt Rounds:', config.get('security.bcryptSaltRounds'));
        console.log('OTP Length:', config.get('security.otpLength'));

        console.log('\nBUSINESS CONFIGURATION');
        console.log('==========================');
        console.log('Default Location:', config.get('business.defaultLocation'));
        console.log('Search Radius:', config.get('business.searchRadius'), 'km');
        console.log('Free Agent Limit:', config.get('business.freeAgentListingLimit'));
        console.log('Premium Agent Limit:', config.get('business.premiumAgentListingLimit'));

        console.log('\nEXTERNAL SERVICES');
        console.log('=====================');
        console.log('Twilio SID Set:', !!config.get('twilio.accountSid'));
        console.log('Twilio WhatsApp Number:', config.get('twilio.whatsappNumber'));
        console.log('OpenAI API Key Set:', !!config.get('openai.apiKey'));
        console.log('OpenAI Model:', config.get('openai.model'));

        console.log('\nFEATURE FLAGS');
        console.log('==================');
        console.log('Voice Messages:', config.get('features.enableVoiceMessages'));
        console.log('Multi Language:', config.get('features.enableMultiLanguage'));
        console.log('Analytics:', config.get('features.enableAnalytics'));

        console.log('\nConfiguration loaded successfully!');

        await app.close();
    } catch (error) {
        console.error('\nConfiguration test failed:');
        console.error('Error:', error.message);

        if (error.message.includes('database') || error.message.includes('DATABASE')) {
            console.error('\nHint: Make sure your .env file has valid database credentials:');
            console.error('   DATABASE_HOST=localhost');
            console.error('   DATABASE_USERNAME=your_username');
            console.error('   DATABASE_PASSWORD=your_password');
            console.error('   DATABASE_NAME=settlesmart_db');
        }

        process.exit(1);
    }
}

testConfig();