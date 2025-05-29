// File name: src/modules/conversations/dto/update-conversation.dto.ts

import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { CreateConversationDto } from './create-conversation.dto';
import { ConversationStatus } from '../entities/conversation.entity';

export class UpdateConversationDto extends PartialType(CreateConversationDto) {
    @ApiPropertyOptional({
        description: 'Update conversation status',
        example: 'completed',
        enum: ConversationStatus,
    })
    @IsIn(Object.values(ConversationStatus))
    status?: ConversationStatus;

    @ApiPropertyOptional({
        description: 'Update conversation context',
        example: {
            current_intent: 'property_search',
            conversation_stage: 'property_matching',
            search_criteria: {
                budget_min: 300000,
                budget_max: 700000,
                bedrooms: 2,
                location_preference: 'Lugbe Phase 1'
            },
            last_property_recommendations: ['prop1', 'prop2', 'prop3'],
            user_preferences_collected: true,
            budget_set: true
        },
    })
    context?: any;

    @ApiPropertyOptional({
        description: 'Add new messages to conversation',
        example: [{
            type: 'text',
            direction: 'outgoing',
            content: 'I found 5 properties matching your criteria in Lugbe Phase 1',
            sender: 'ai',
            metadata: {
                properties_shown: 5,
                average_price: 450000
            }
        }],
        isArray: true,
    })
    messages?: any[];
}