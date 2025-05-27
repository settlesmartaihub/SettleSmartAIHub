// File name: src/users/dto/update-user.dto.ts

import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsOptional, IsObject } from 'class-validator';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {
    @ApiProperty({
        description: 'Conversation state for WhatsApp context',
        example: {
            currentStep: 'searching',
            lastIntent: 'find_property',
            context: {
                bedrooms: 2,
                searchLocation: 'Lugbe'
            },
            lastMessageAt: '2025-05-27T10:30:00.000Z'
        },
        required: false
    })
    @IsOptional()
    @IsObject()
    conversationState?: Record<string, any>;
}