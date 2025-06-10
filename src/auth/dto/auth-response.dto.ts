// File name: src/auth/dto/auth-response.dto.ts

import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
    @ApiProperty({
        description: 'JWT access token',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    })
    accessToken: string;

    @ApiProperty({
        description: 'JWT refresh token',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    })
    refreshToken: string;

    @ApiProperty({
        description: 'Token expiration time in seconds',
        example: 86400
    })
    expiresIn: number;

    @ApiProperty({
        description: 'User information',
        example: {
            id: 'uuid-string',
            name: 'John Doe',
            email: 'john@example.com',
            role: 'agent',
            phone: '+2348123456789',
            businessName: 'John Properties Ltd',
            verificationStatus: 'pending'
        }
    })
    user: {
        id: string;
        name: string;
        email: string;
        role: string;
        phone: string;
        businessName?: string;
        verificationStatus?: string;
    };

    // Optional verification-related fields (for agent registration/login)
    @ApiProperty({
        description: 'Success or verification message',
        example: 'Agent registered successfully. Your account is pending verification by admin.',
        required: false
    })
    message?: string;

    @ApiProperty({
        description: 'Indicates if the user needs verification',
        example: true,
        required: false
    })
    needsVerification?: boolean;

    @ApiProperty({
        description: 'Current verification status',
        example: 'pending',
        enum: ['pending', 'verified', 'rejected', 'suspended'],
        required: false
    })
    verificationStatus?: string;

    @ApiProperty({
        description: 'Indicates if there are verification warnings',
        example: true,
        required: false
    })
    verificationWarning?: boolean;

    @ApiProperty({
        description: 'Verification warning message',
        example: 'Your account is pending verification. You cannot create properties until verified.',
        required: false
    })
    verificationMessage?: string;
}