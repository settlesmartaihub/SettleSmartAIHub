// File name: src/modules/properties/dto/property-search.dto.ts

import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import {
    IsOptional,
    IsNumber,
    IsString,
    IsBoolean,
    IsIn,
    IsArray,
    Min,
    Max,
    MaxLength,
    IsUrl,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import {
    PropertyType,
    PropertyVerificationStatus,
    PropertyStatus,
} from '../entities/property.entity';

export class PropertySearchDto {
    @ApiPropertyOptional({
        description: 'Search in title and description',
        example: 'spacious flat',
    })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({
        description: 'Filter by property type',
        enum: PropertyType,
        example: PropertyType.FLAT,
    })
    @IsOptional()
    @IsIn(Object.values(PropertyType))
    property_type?: PropertyType;

    @ApiPropertyOptional({
        description: 'Minimum price filter',
        example: 200000,
        minimum: 0,
    })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    @Min(0)
    price_min?: number;

    @ApiPropertyOptional({
        description: 'Maximum price filter',
        example: 1000000,
        minimum: 0,
    })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    @Min(0)
    price_max?: number;

    @ApiPropertyOptional({
        description: 'Filter by location area',
        example: 'Lugbe Phase 1',
    })
    @IsOptional()
    @IsString()
    location?: string;

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
        description: 'Required amenities',
        example: ['parking', 'security', 'power'],
        isArray: true,
    })
    @IsOptional()
    @IsArray()
    @Transform(({ value }) => Array.isArray(value) ? value : [value])
    amenities?: string[];

    @ApiPropertyOptional({
        description: 'Filter by verification status',
        enum: PropertyVerificationStatus,
    })
    @IsOptional()
    @IsIn(Object.values(PropertyVerificationStatus))
    verification_status?: PropertyVerificationStatus;

    @ApiPropertyOptional({
        description: 'Filter by availability status',
        enum: PropertyStatus,
    })
    @IsOptional()
    @IsIn(Object.values(PropertyStatus))
    status?: PropertyStatus;

    @ApiPropertyOptional({
        description: 'Filter by availability',
        example: true,
    })
    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => value === 'true' || value === true)
    is_available?: boolean;

    @ApiPropertyOptional({
        description: 'Filter by agent ID',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsOptional()
    @IsString()
    agent_id?: string;

    @ApiPropertyOptional({
        description: 'Sort by field',
        example: 'price',
        enum: ['price', 'created_at', 'bedrooms', 'inquiry_count'],
    })
    @IsOptional()
    @IsIn(['price', 'created_at', 'bedrooms', 'inquiry_count', 'view_count'])
    sort_by?: string = 'created_at';

    @ApiPropertyOptional({
        description: 'Sort order',
        example: 'DESC',
        enum: ['ASC', 'DESC'],
    })
    @IsOptional()
    @IsIn(['ASC', 'DESC'])
    sort_order?: 'ASC' | 'DESC' = 'DESC';

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
        maximum: 50,
    })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    @Min(1)
    @Max(50)
    limit?: number = 10;
}

export class PropertyMatchDto {
    @ApiPropertyOptional({
        description: 'User budget minimum',
        example: 200000,
    })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    budget_min?: number;

    @ApiPropertyOptional({
        description: 'User budget maximum',
        example: 800000,
    })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    budget_max?: number;

    @ApiPropertyOptional({
        description: 'Preferred number of bedrooms',
        example: 2,
    })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    bedrooms?: number;

    @ApiPropertyOptional({
        description: 'Preferred property types',
        example: ['flat', 'house'],
        isArray: true,
    })
    @IsOptional()
    @IsArray()
    property_types?: string[];

    @ApiPropertyOptional({
        description: 'Required amenities',
        example: ['parking', 'security', 'power'],
        isArray: true,
    })
    @IsOptional()
    @IsArray()
    required_amenities?: string[];

    @ApiPropertyOptional({
        description: 'Preferred location area',
        example: 'Lugbe Phase 1',
    })
    @IsOptional()
    @IsString()
    location?: string;

    @ApiPropertyOptional({
        description: 'Minimum matching score (0-100)',
        example: 70,
        minimum: 0,
        maximum: 100,
    })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    @Min(0)
    @Max(100)
    min_score?: number = 50;

    @ApiPropertyOptional({
        description: 'Maximum number of results',
        example: 10,
        minimum: 1,
        maximum: 50,
    })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    @Min(1)
    @Max(50)
    limit?: number = 10;
}

export class UpdatePropertyStatusDto {
    @ApiProperty({
        description: 'New property status',
        enum: PropertyStatus,
        example: PropertyStatus.RENTED,
    })
    @IsIn(Object.values(PropertyStatus))
    status: PropertyStatus;

    @ApiPropertyOptional({
        description: 'Update availability flag',
        example: false,
    })
    @IsOptional()
    @IsBoolean()
    is_available?: boolean;
}

export class UpdateVerificationStatusDto {
    @ApiProperty({
        description: 'New verification status',
        enum: PropertyVerificationStatus,
        example: PropertyVerificationStatus.VERIFIED,
    })
    @IsIn([PropertyVerificationStatus.VERIFIED, PropertyVerificationStatus.REJECTED])
    verification_status: PropertyVerificationStatus;

    @ApiPropertyOptional({
        description: 'Verification notes or reason for rejection',
        example: 'Property details verified successfully',
    })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    notes?: string;
}

export class AddPropertyImageDto {
    @ApiProperty({
        description: 'Image URL to add',
        example: 'https://example.com/images/property_new.jpg',
    })
    @IsUrl()
    image_url: string;
}

export class RemovePropertyImageDto {
    @ApiProperty({
        description: 'Image URL to remove',
        example: 'https://example.com/images/property_old.jpg',
    })
    @IsUrl()
    image_url: string;
}