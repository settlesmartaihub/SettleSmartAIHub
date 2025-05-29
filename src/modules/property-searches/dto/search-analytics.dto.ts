// File name: src/modules/property-searches/dto/search-analytics.dto.ts

import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import {
    IsOptional,
    IsString,
    IsNumber,
    IsDateString,
    IsIn,
    Min,
    Max,
    IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SearchSource, SearchResultQuality } from '../entities/property-search.entity';

export class SearchAnalyticsDto {
    @ApiPropertyOptional({
        description: 'Filter by user phone',
        example: '+2348123456789',
    })
    @IsOptional()
    @IsString()
    user_phone?: string;

    @ApiPropertyOptional({
        description: 'Filter by search source',
        enum: SearchSource,
    })
    @IsOptional()
    @IsIn(Object.values(SearchSource))
    search_source?: SearchSource;

    @ApiPropertyOptional({
        description: 'Filter by search quality',
        enum: SearchResultQuality,
    })
    @IsOptional()
    @IsIn(Object.values(SearchResultQuality))
    search_quality?: SearchResultQuality;

    @ApiPropertyOptional({
        description: 'From date',
        example: '2025-01-20T00:00:00Z',
    })
    @IsOptional()
    @IsDateString()
    from_date?: string;

    @ApiPropertyOptional({
        description: 'To date',
        example: '2025-01-25T23:59:59Z',
    })
    @IsOptional()
    @IsDateString()
    to_date?: string;

    @ApiPropertyOptional({
        description: 'Minimum results count',
        example: 1,
        minimum: 0,
    })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    @Min(0)
    min_results?: number;

    @ApiPropertyOptional({
        description: 'Maximum results count',
        example: 100,
        minimum: 1,
    })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    @Min(1)
    max_results?: number;

    @ApiPropertyOptional({
        description: 'Minimum matching score',
        example: 50,
        minimum: 0,
        maximum: 100,
    })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    @Min(0)
    @Max(100)
    min_score?: number;

    @ApiPropertyOptional({
        description: 'Group results by time period',
        enum: ['hour', 'day', 'week', 'month'],
        example: 'day',
    })
    @IsOptional()
    @IsIn(['hour', 'day', 'week', 'month'])
    group_by?: string = 'day';

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
        example: 20,
        minimum: 1,
        maximum: 100,
    })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    @Min(1)
    @Max(100)
    limit?: number = 20;
}

export class RecordInteractionDto {
    @ApiProperty({
        description: 'Property ID that was viewed',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsOptional()
    @IsString()
    property_id?: string;

    @ApiProperty({
        description: 'Agent ID that was contacted',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsOptional()
    @IsString()
    agent_id?: string;

    @ApiPropertyOptional({
        description: 'User satisfaction rating (1-5)',
        example: 4,
        minimum: 1,
        maximum: 5,
    })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    @Min(1)
    @Max(5)
    satisfaction_rating?: number;

    @ApiPropertyOptional({
        description: 'Whether this resulted in a viewing',
        example: true,
    })
    @IsOptional()
    @IsBoolean()
    resulted_in_viewing?: boolean;

    @ApiPropertyOptional({
        description: 'Whether this resulted in contact',
        example: true,
    })
    @IsOptional()
    @IsBoolean()
    resulted_in_contact?: boolean;
}