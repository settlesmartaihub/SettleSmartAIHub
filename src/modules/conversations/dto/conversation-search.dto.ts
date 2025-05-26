// Filename: src/modules/conversations/dto/conversation-search.dto.ts

import { ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsOptional,
    IsString,
    IsIn,
    IsNumber,
    IsDateString,
    Min,
    Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ConversationStatus } from '../entities/conversation.entity';

export class ConversationSearchDto {
    @ApiPropertyOptional({
        description: 'Search by user phone number',
        example: '+2348123456789',
    })
    @IsOptional()
    @IsString()
    user_phone?: string;

    @ApiPropertyOptional({
        description: 'Search by session ID',
        example: 'sess_20250125_123456_8123456789',
    })
    @IsOptional()
    @IsString()
    session_id?: string;

    @ApiPropertyOptional({
        description: 'Filter by conversation status',
        enum: ConversationStatus,
    })
    @IsOptional()
    @IsIn(Object.values(ConversationStatus))
    status?: ConversationStatus;

    @ApiPropertyOptional({
        description: 'Filter conversations from date',
        example: '2025-01-20T00:00:00Z',
    })
    @IsOptional()
    @IsDateString()
    from_date?: string;

    @ApiPropertyOptional({
        description: 'Filter conversations to date',
        example: '2025-01-25T23:59:59Z',
    })
    @IsOptional()
    @IsDateString()
    to_date?: string;

    @ApiPropertyOptional({
        description: 'Minimum message count',
        example: 5,
        minimum: 0,
    })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    @Min(0)
    min_messages?: number;

    @ApiPropertyOptional({
        description: 'Maximum message count',
        example: 50,
        minimum: 1,
    })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    @Min(1)
    max_messages?: number;

    @ApiPropertyOptional({
        description: 'Filter by conversation intent',
        example: 'property_search',
    })
    @IsOptional()
    @IsString()
    intent?: string;

    @ApiPropertyOptional({
        description: 'Page number for pagination',
        example: 1,
        minimum: 1,
    })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({
        description: 'Number of items per page',
        example: 10,
        minimum: 1,
        maximum: 100,
    })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    @Min(1)
    @Max(100)
    limit?: number = 10;
}

export class ConversationStatsDto {
    @ApiPropertyOptional({
        description: 'Number of days to analyze',
        example: 7,
        minimum: 1,
        maximum: 365,
    })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    @Min(1)
    @Max(365)
    days?: number = 7;

    @ApiPropertyOptional({
        description: 'Group stats by period',
        enum: ['hour', 'day', 'week', 'month'],
        example: 'day',
    })
    @IsOptional()
    @IsIn(['hour', 'day', 'week', 'month'])
    group_by?: string = 'day';
}