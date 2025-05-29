// File name: src/modules/property-searches/dto/search-criteria.dto.ts

import { ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsOptional,
    IsNumber,
    IsArray,
    IsBoolean,
    Min,
    Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class SearchCriteriaDto {
    @ApiPropertyOptional({
        description: 'Minimum budget',
        example: 200000,
        minimum: 50000,
    })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    @Min(50000)
    budget_min?: number;

    @ApiPropertyOptional({
        description: 'Maximum budget',
        example: 800000,
        minimum: 50000,
    })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    @Min(50000)
    budget_max?: number;

    @ApiPropertyOptional({
        description: 'Number of bedrooms',
        example: 2,
        minimum: 1,
        maximum: 10,
    })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    @Min(1)
    @Max(10)
    bedrooms?: number;

    @ApiPropertyOptional({
        description: 'Number of bathrooms',
        example: 2,
        minimum: 1,
        maximum: 10,
    })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    @Min(1)
    @Max(10)
    bathrooms?: number;

    @ApiPropertyOptional({
        description: 'Property types',
        example: ['flat', 'house'],
        isArray: true,
    })
    @IsOptional()
    @IsArray()
    property_types?: string[];

    @ApiPropertyOptional({
        description: 'Location areas',
        example: ['Lugbe Phase 1', 'Lugbe Phase 2'],
        isArray: true,
    })
    @IsOptional()
    @IsArray()
    location_areas?: string[];

    @ApiPropertyOptional({
        description: 'Maximum distance in kilometers',
        example: 5,
        minimum: 1,
        maximum: 50,
    })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    @Min(1)
    @Max(50)
    max_distance_km?: number;

    @ApiPropertyOptional({
        description: 'Required amenities',
        example: ['parking', 'security', 'power'],
        isArray: true,
    })
    @IsOptional()
    @IsArray()
    required_amenities?: string[];

    @ApiPropertyOptional({
        description: 'Preferred amenities',
        example: ['internet', 'generator'],
        isArray: true,
    })
    @IsOptional()
    @IsArray()
    preferred_amenities?: string[];

    @ApiPropertyOptional({
        description: 'Minimum agent rating',
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
        description: 'Maximum age of listings in days',
        example: 30,
        minimum: 1,
        maximum: 365,
    })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    @Min(1)
    @Max(365)
    max_age_days?: number;

    @ApiPropertyOptional({
        description: 'Only verified properties',
        example: true,
    })
    @IsOptional()
    @IsBoolean()
    verified_only?: boolean;

    @ApiPropertyOptional({
        description: 'Only available properties',
        example: true,
    })
    @IsOptional()
    @IsBoolean()
    available_only?: boolean;
}