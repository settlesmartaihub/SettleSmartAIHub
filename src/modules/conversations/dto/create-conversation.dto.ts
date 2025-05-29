// File name: src/modules/conversations/dto/create-conversation.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString,
    IsOptional,
    IsObject,
    IsArray,
    IsIn,
    MaxLength,
} from 'class-validator';
import { IsNigerianPhone } from '../../../common/decorators/phone-validation.decorator';
import {
    ConversationStatus,
    WhatsAppMessage,
    ConversationContext,
} from '../entities/conversation.entity';

export class CreateConversationDto {
    @ApiProperty({
        description: 'User phone number',
        example: '+2348123456789',
    })
    @IsNigerianPhone()
    user_phone: string;

    @ApiProperty({
        description: 'Unique session identifier',
        example: 'sess_20250125_123456_8123456789',
        maxLength: 100,
    })
    @IsString()
    @MaxLength(100)
    session_id: string;

    @ApiPropertyOptional({
        description: 'Initial messages in the conversation',
        type: 'array',
        items: { type: 'object' },
    })
    @IsOptional()
    @IsArray()
    messages?: WhatsAppMessage[];

    @ApiPropertyOptional({
        description: 'Initial conversation context',
        example: {
            current_intent: 'property_search',
            conversation_stage: 'budget_collection'
        },
    })
    @IsOptional()
    @IsObject()
    context?: ConversationContext;

    @ApiPropertyOptional({
        description: 'Conversation status',
        enum: ConversationStatus,
        example: ConversationStatus.ACTIVE,
    })
    @IsOptional()
    @IsIn(Object.values(ConversationStatus))
    status?: ConversationStatus;
}