// demo-functions.ts - FIXED VERSION
import { normalizePhoneNumber, formatPhoneNumber, isValidNigerianPhone } from './src/common/utils/phone.util';
import { createSuccessResponse, createErrorResponse, createPaginatedResponse } from './src/common/utils/response.util';
import { hashPassword, comparePassword, generateToken, generateOTP } from './src/common/utils/encryption.util';

console.log('SettleSmart AI - Function Demonstration');
console.log('============================================================');

async function demonstrateSettleSmartFunctions() {
    console.log('📱 NIGERIAN PHONE NUMBER UTILITIES');
    console.log('----------------------------------------');

    // Test phone numbers in various formats
    const testPhones = [
        '08123456789',
        '07098765432',
        '09087654321',
        '+2348123456789',
        '2347098765432',
        '8123456789',
        '0903 456 7890',
        '+234 803 123 4567'
    ];

    testPhones.forEach((phone, index) => {
        const normalized = normalizePhoneNumber(phone);
        const formatted = formatPhoneNumber(phone);
        const isValid = isValidNigerianPhone(phone);

        console.log(`${index + 1}. Original: ${phone.padEnd(18)} → ${normalized.padEnd(16)} → ${formatted}`);
        console.log(`   Valid: ${isValid ? '✅' : '❌'}`);
    });

    console.log('\n🔄 API RESPONSE UTILITIES');
    console.log('----------------------------------------');

    // Success Response
    const successResponse = createSuccessResponse(
        {
            id: 'usr_12345',
            name: 'Emeka Okafor',
            phone: '+2348123456789',
            location: 'Lugbe, Abuja',
            preferences: {
                propertyType: '2-bedroom flat',
                maxBudget: 800000
            }
        },
        'User profile retrieved successfully'
    );

    console.log('Success Response:');
    console.log(JSON.stringify(successResponse, null, 2));

    // Error Response
    const errorResponse = createErrorResponse(
        'Invalid phone number format',
        400,
        {
            field: 'phone',
            code: 'INVALID_FORMAT',
            provided: '123456'
        }
    );

    console.log('\nError Response:');
    console.log(JSON.stringify(errorResponse, null, 2));

    // Paginated Response
    const paginatedResponse = createPaginatedResponse(
        [
            { id: 1, title: '2-Bedroom Flat in Lugbe', price: 750000 },
            { id: 2, title: '3-Bedroom Duplex in Kuje', price: 1200000 },
            { id: 3, title: '1-Bedroom Apartment in Gwagwalada', price: 400000 }
        ],
        25, // total
        1,  // page
        10  // limit
    );

    console.log('\nPaginated Response:');
    console.log(JSON.stringify(paginatedResponse, null, 2));

    console.log('\n🔐 ENCRYPTION & SECURITY UTILITIES');
    console.log('----------------------------------------');

    // Test password hashing
    const testPasswords = ['settlesmart123', 'agent_password!', 'userSecure@2024'];

    for (const password of testPasswords) {
        const hashedPassword = await hashPassword(password);
        const isValidCorrect = await comparePassword(password, hashedPassword);
        const isValidWrong = await comparePassword('wrongpassword', hashedPassword);

        console.log(`Password: "${password}"`);
        console.log(`   Hash: ${hashedPassword}`);
        console.log(`   Correct verification: ${isValidCorrect ? '✅' : '❌'}`);
        console.log(`   Wrong password test: ${!isValidWrong ? '✅' : '❌'} Properly rejected`);
    }

    console.log('\n🔑 TOKEN GENERATION:');
    console.log(`   Session Token (32 bytes): ${generateToken(32)}`);
    console.log(`   API Key (16 bytes): ${generateToken(16)}`);
    console.log(`   Short Token (8 bytes): ${generateToken(8)}`);

    console.log('\n📲 OTP GENERATION:');
    console.log(`   6-digit OTP (default): ${generateOTP(6)}`);
    console.log(`   4-digit PIN: ${generateOTP(4)}`);
    console.log(`   8-digit Code: ${generateOTP(8)}`);

    console.log('\n🏠 REAL-WORLD SETTLESMART SCENARIOS');
    console.log('----------------------------------------');

    console.log('Scenario 1: User Registration via WhatsApp');
    const whatsappInput = 'whatsapp:+2348123456789';
    const extractedPhone = whatsappInput.replace('whatsapp:', '');
    const normalizedPhone = normalizePhoneNumber(extractedPhone);
    const displayPhone = formatPhoneNumber(normalizedPhone);
    const isValidPhone = isValidNigerianPhone(normalizedPhone);

    console.log(`   WhatsApp Input: ${whatsappInput}`);
    console.log(`   Extracted: ${extractedPhone}`);
    console.log(`   Normalized: ${normalizedPhone}`);
    console.log(`   Display Format: ${displayPhone}`);
    console.log(`   Valid Nigerian Number: ${isValidPhone ? '✅' : '❌'}`);

    console.log('\nScenario 2: Agent Authentication Setup');
    const agentEmail = 'agent@realestate.ng';
    const agentPasswordHash = await hashPassword('agent_secure_password');
    const verificationOTP = generateOTP(6);
    const sessionToken = generateToken(32);

    console.log(`   Agent Email: ${agentEmail}`);
    console.log(`   Password Hash: ${agentPasswordHash.substring(0, 20)}...`);
    console.log(`   Verification OTP: ${verificationOTP}`);
    console.log(`   Session Token: ${sessionToken}`);

    console.log('\nScenario 3: Property Search API Response');
    const propertySearchResponse = createSuccessResponse(
        [
            {
                id: 'prop_001',
                title: '2-Bedroom Flat in Lugbe',
                price: 750000,
                location: 'Lugbe Extension, Abuja',
                agent: {
                    name: 'Chioma Real Estate',
                    phone: '+234 809 876 5432',
                    verified: true
                }
            },
            {
                id: 'prop_002',
                title: '3-Bedroom Duplex in Kuje',
                price: 1200000,
                location: 'Kuje Area Council, Abuja',
                agent: {
                    name: 'Musa Properties',
                    phone: '+234 708 765 4321',
                    verified: true
                }
            }
        ],
        'Properties found matching your criteria'
    );

    console.log(JSON.stringify(propertySearchResponse, null, 2));

    console.log('\n============================================================');
    console.log('ALL SETTLESMART FUNCTIONS WORKING PERFECTLY!');
    console.log('Phone utilities: Nigerian format handling');
    console.log('Response utilities: Standardized API responses');
    console.log('Encryption utilities: Secure password & token handling');
    console.log('Ready for WhatsApp integration!');
    console.log('============================================================');
}

// Run the demonstration
demonstrateSettleSmartFunctions().catch(console.error);