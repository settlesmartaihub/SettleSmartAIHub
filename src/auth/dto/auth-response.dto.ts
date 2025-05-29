// src/auth/dto/auth-response.dto.ts

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
            phone: '+2348123456789'
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
}