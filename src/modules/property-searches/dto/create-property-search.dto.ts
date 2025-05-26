// Filename: src/modules/property-searches/dto/create-property-search.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString,
    IsOptional,
    IsObject,
    IsNumber,
    IsIn,
    IsArray,
    IsBoolean,
    Min,
    Max,
    MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IsNigerianPhone } from '../../../common/decorators/phone-validation.decorator';
import {
    SearchSource,
    SearchResultQuality,
    SearchCriteria,
    SearchResults,
    SearchMetadata,
} from '../entities/property-search.entity';

export class CreatePropertySearchDto {
    @ApiProperty({
        description: 'User phone number',
        example: '+2348123456789',
    })
    @IsNigerianPhone()
    user_phone: string;

    @ApiProperty({
        description: 'Search criteria used',
        example: {
            budget_min: 200000,
            budget_max: 800000,
            bedrooms: 2,
            location_areas: ['Lugbe Phase 1']
        },
    })
    @IsObject()
    search_criteria: SearchCriteria;

    @ApiProperty({
        description: 'Search results summary',
        example: {
            total_found: 12,
            properties_returned: 10,
            average_score: 75
        },
    })
    @IsObject()
    search_results: SearchResults;

    @ApiPropertyOptional({
        description: 'Source of this search',
        enum: SearchSource,
        example: SearchSource.WHATSAPP_CHAT,
    })
    @IsOptional()
    @IsIn(Object.values(SearchSource))
    search_source?: SearchSource;

    @ApiPropertyOptional({
        description: 'Quality of search results',
        enum: SearchResultQuality,
    })
    @IsOptional()
    @IsIn(Object.values(SearchResultQuality))
    search_quality?: SearchResultQuality;

    @ApiPropertyOptional({
        description: 'Number of properties found',
        example: 12,
        minimum: 0,
    })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    @Min(0)
    results_count?: number;

    @ApiPropertyOptional({
        description: 'Average matching score',
        example: 78.5,
        minimum: 0,
        maximum: 100,
    })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    @Min(0)
    @Max(100)
    average_matching_score?: number;

    @ApiPropertyOptional({
        description: 'Search metadata',
        example: {
            execution_time_ms: 250,
            properties_viewed: ['prop1', 'prop2'],
            user_satisfaction: 4
        },
    })
    @IsOptional()
    @IsObject()
    search_metadata?: SearchMetadata;

    @ApiPropertyOptional({
        description: 'Original search query',
        example: 'I need a 2-bedroom flat in Lugbe under 800k with parking',
        maxLength: 1000,
    })
    @IsOptional()
    @IsString()
    @MaxLength(1000)
    original_query?: string;

    @ApiPropertyOptional({
        description: 'Related conversation ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsOptional()
    @IsString()
    conversation_id?: string;
}