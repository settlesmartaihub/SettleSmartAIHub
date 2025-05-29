// File name: src/users/dto/conversation-state.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject, IsDateString } from 'class-validator';

export class ConversationStateDto {
    @ApiProperty({
        description: 'Current conversation step',
        example: 'searching',
        enum: ['greeting', 'collecting_preferences', 'searching', 'viewing_results', 'contacting_agent', 'completed']
    })
    @IsString()
    currentStep: string;

    @ApiProperty({
        description: 'Last detected user intent',
        example: 'find_property',
        required: false
    })
    @IsOptional()
    @IsString()
    lastIntent?: string;

    @ApiProperty({
        description: 'Conversation context data',
        example: {
            bedrooms: 2,
            searchLocation: 'Lugbe',
            lastPropertyShown: 'prop-uuid'
        },
        required: false
    })
    @IsOptional()
    @IsObject()
    context?: Record<string, any>;

    @ApiProperty({
        description: 'Timestamp of last message',
        example: '2025-05-27T10:30:00.000Z'
    })
    @IsDateString()
    lastMessageAt: string;
}