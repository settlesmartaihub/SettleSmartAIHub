// File name: src/modules/agents/dto/agent-search.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsOptional,
    IsNumber,
    IsString,
    IsIn,
    Min,
    Max,
    MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
    AgentVerificationStatus,
    AgentSubscriptionTier,
    AgentStatus,
} from '../entities/agent.entity';

export class AgentSearchDto {
    @ApiPropertyOptional({
        description: 'Search by phone number',
        example: '+2348123456789',
    })
    @IsOptional()
    @IsString()
    phone_number?: string;

    @ApiPropertyOptional({
        description: 'Search by name',
        example: 'Jane',
    })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiPropertyOptional({
        description: 'Search by email',
        example: 'jane@example.com',
    })
    @IsOptional()
    @IsString()
    email?: string;

    @ApiPropertyOptional({
        description: 'Filter by location',
        example: 'Lugbe',
    })
    @IsOptional()
    @IsString()
    location?: string;

    @ApiPropertyOptional({
        description: 'Filter by verification status',
        enum: AgentVerificationStatus,
    })
    @IsOptional()
    @IsIn(Object.values(AgentVerificationStatus))
    verification_status?: AgentVerificationStatus;

    @ApiPropertyOptional({
        description: 'Filter by subscription tier',
        enum: AgentSubscriptionTier,
    })
    @IsOptional()
    @IsIn(Object.values(AgentSubscriptionTier))
    subscription_tier?: AgentSubscriptionTier;

    @ApiPropertyOptional({
        description: 'Filter by agent status',
        enum: AgentStatus,
    })
    @IsOptional()
    @IsIn(Object.values(AgentStatus))
    status?: AgentStatus;

    @ApiPropertyOptional({
        description: 'Minimum rating filter',
        example: 4.0,
        minimum: 0,
        maximum: 5,
    })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    @Min(0)
    @Max(5)
    min_rating?: number;

    @ApiPropertyOptional({
        description: 'Maximum rating filter',
        example: 5.0,
        minimum: 0,
        maximum: 5,
    })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    @Min(0)
    @Max(5)
    max_rating?: number;

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

    @ApiPropertyOptional({
        description: 'Sort by field',
        example: 'created_at',
        enum: ['created_at', 'updated_at', 'name', 'rating', 'total_ratings'],
    })
    @IsOptional()
    @IsString()
    @IsIn(['created_at', 'updated_at', 'name', 'rating', 'total_ratings'])
    sort_by?: string = 'created_at';

    @ApiPropertyOptional({
        description: 'Sort order',
        example: 'DESC',
        enum: ['ASC', 'DESC'],
    })
    @IsOptional()
    @IsString()
    @IsIn(['ASC', 'DESC'])
    sort_order?: 'ASC' | 'DESC' = 'DESC';
}

export class VerifyAgentDto {
    @ApiProperty({
        description: 'New verification status',
        enum: AgentVerificationStatus,
        example: AgentVerificationStatus.VERIFIED,
    })
    @IsIn([AgentVerificationStatus.VERIFIED, AgentVerificationStatus.REJECTED])
    verification_status: AgentVerificationStatus;

    @ApiPropertyOptional({
        description: 'Verification notes or reason for rejection',
        example: 'Agent credentials verified successfully',
    })
    @IsOptional()
    @IsString()
    notes?: string;
}

export class UpdateSubscriptionDto {
    @ApiProperty({
        description: 'New subscription tier',
        enum: AgentSubscriptionTier,
        example: AgentSubscriptionTier.PREMIUM,
    })
    @IsIn(Object.values(AgentSubscriptionTier))
    subscription_tier: AgentSubscriptionTier;

    @ApiPropertyOptional({
        description: 'Subscription expiration date (required for premium)',
        example: '2025-12-31T23:59:59Z',
    })
    @IsOptional()
    subscription_expires_at?: Date;
}

export class RateAgentDto {
    @ApiProperty({
        description: 'Rating from 1 to 5',
        example: 4.5,
        minimum: 1,
        maximum: 5,
    })
    @IsNumber()
    @Type(() => Number)
    @Min(1)
    @Max(5)
    rating: number;

    @ApiPropertyOptional({
        description: 'Optional review comment',
        example: 'Very professional and helpful agent',
    })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    comment?: string;
}