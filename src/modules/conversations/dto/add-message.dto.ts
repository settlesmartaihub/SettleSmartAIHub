// Filename: src/modules/conversations/dto/add-message.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString,
    IsIn,
    IsOptional,
    IsObject,
    MaxLength,
} from 'class-validator';
import { MessageType, MessageDirection } from '../entities/conversation.entity';

export class AddMessageDto {
    @ApiProperty({
        description: 'Message type',
        enum: MessageType,
        example: MessageType.TEXT,
    })
    @IsIn(Object.values(MessageType))
    type: MessageType;

    @ApiProperty({
        description: 'Message direction',
        enum: MessageDirection,
        example: MessageDirection.INCOMING,
    })
    @IsIn(Object.values(MessageDirection))
    direction: MessageDirection;

    @ApiProperty({
        description: 'Message content',
        example: 'I need a 2-bedroom flat in Lugbe under 800k',
        maxLength: 4000,
    })
    @IsString()
    @MaxLength(4000)
    content: string;

    @ApiProperty({
        description: 'Message sender',
        enum: ['user', 'ai', 'system'],
        example: 'user',
    })
    @IsIn(['user', 'ai', 'system'])
    sender: 'user' | 'ai' | 'system';

    @ApiPropertyOptional({
        description: 'Additional message metadata',
        example: {
            voice_duration: 30,
            image_url: 'https://example.com/image.jpg'
        },
    })
    @IsOptional()
    @IsObject()
    metadata?: {
        voice_duration?: number;
        image_url?: string;
        location?: {
            latitude: number;
            longitude: number;
            address?: string;
        };
        button_response?: string;
        list_response?: string;
    };
}