// File name: src/users/dto/user-response.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { UserStatus } from '../../modules/users/entities/user.entity';

export class UserResponseDto {
    @ApiProperty({
        description: 'User unique identifier',
        example: '123e4567-e89b-12d3-a456-426614174000'
    })
    id: string;

    @ApiProperty({
        description: 'User full name',
        example: 'John Doe'
    })
    name: string;

    @ApiProperty({
        description: 'Nigerian phone number',
        example: '+2348123456789'
    })
    phone: string;

    @ApiProperty({
        description: 'User location',
        example: 'Lugbe, Abuja',
        nullable: true
    })
    location?: string;

    @ApiProperty({
        description: 'User status',
        enum: UserStatus,
        example: UserStatus.ACTIVE
    })
    status: UserStatus;

    @ApiProperty({
        description: 'Minimum budget in Naira',
        example: 500000,
        nullable: true
    })
    budgetMin?: number;

    @ApiProperty({
        description: 'Maximum budget in Naira',
        example: 1000000,
        nullable: true
    })
    budgetMax?: number;

    @ApiProperty({
        description: 'User preferences',
        example: {
            propertyType: '2-bedroom',
            amenities: ['parking', 'security']
        }
    })
    preferences: Record<string, any>;

    @ApiProperty({
        description: 'Conversation state for WhatsApp',
        example: {
            currentStep: 'searching',
            lastMessageAt: '2025-05-27T10:30:00.000Z'
        }
    })
    conversationState: Record<string, any>;

    @ApiProperty({
        description: 'Account creation date',
        example: '2025-05-27T10:30:00.000Z'
    })
    createdAt: Date;

    @ApiProperty({
        description: 'Last update date',
        example: '2025-05-27T10:30:00.000Z'
    })
    updatedAt: Date;
}