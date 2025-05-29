// File name: src/modules/conversations/dto/update-context.dto.ts

import { ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsOptional,
    IsString,
    IsObject,
    IsArray,
    IsBoolean,
    IsNumber,
    Min,
    Max,
} from 'class-validator';

export class UpdateContextDto {
    @ApiPropertyOptional({
        description: 'Current user intent',
        example: 'property_search',
    })
    @IsOptional()
    @IsString()
    current_intent?: string;

    @ApiPropertyOptional({
        description: 'Current conversation stage',
        example: 'budget_collection',
    })
    @IsOptional()
    @IsString()
    conversation_stage?: string;

    @ApiPropertyOptional({
        description: 'Search criteria context',
        example: {
            budget_min: 200000,
            budget_max: 800000,
            bedrooms: 2
        },
    })
    @IsOptional()
    @IsObject()
    search_criteria?: {
        budget_min?: number;
        budget_max?: number;
        bedrooms?: number;
        bathrooms?: number;
        property_types?: string[];
        location_preference?: string;
        required_amenities?: string[];
    };

    @ApiPropertyOptional({
        description: 'Last AI action performed',
        example: 'property_recommendations_sent',
    })
    @IsOptional()
    @IsString()
    last_ai_action?: string;

    @ApiPropertyOptional({
        description: 'Last property recommendations sent',
        type: 'array',
        items: { type: 'string' },
    })
    @IsOptional()
    @IsArray()
    last_property_recommendations?: string[];

    @ApiPropertyOptional({
        description: 'Whether awaiting user input',
        example: true,
    })
    @IsOptional()
    @IsBoolean()
    awaiting_user_input?: boolean;

    @ApiPropertyOptional({
        description: 'Matched agents for user',
        type: 'array',
        items: { type: 'string' },
    })
    @IsOptional()
    @IsArray()
    matched_agents?: string[];

    @ApiPropertyOptional({
        description: 'Whether agent has been contacted',
        example: false,
    })
    @IsOptional()
    @IsBoolean()
    agent_contacted?: boolean;

    @ApiPropertyOptional({
        description: 'Whether user preferences are collected',
        example: true,
    })
    @IsOptional()
    @IsBoolean()
    user_preferences_collected?: boolean;

    @ApiPropertyOptional({
        description: 'Whether budget is set',
        example: true,
    })
    @IsOptional()
    @IsBoolean()
    budget_set?: boolean;

    @ApiPropertyOptional({
        description: 'Whether location is confirmed',
        example: true,
    })
    @IsOptional()
    @IsBoolean()
    location_confirmed?: boolean;
}