// File name: src/properties/dto/property-search.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsEnum, IsArray, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class PropertySearchDto {
    @ApiProperty({ description: 'Page number', example: 1, default: 1, required: false })
    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    @IsNumber()
    @Min(1)
    page?: number = 1;

    @ApiProperty({ description: 'Items per page', example: 10, default: 10, required: false })
    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    @IsNumber()
    @Min(1)
    @Max(50)
    limit?: number = 10;

    @ApiProperty({
        description: 'Location search',
        example: { area: 'Lugbe', coordinates: { latitude: 8.7594, longitude: 7.3831 } },
        required: false
    })
    @IsOptional()
    location?: {
        area?: string;
        coordinates?: { latitude: number; longitude: number };
    };

    @ApiProperty({ description: 'Minimum price', example: 500000, required: false })
    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    @IsNumber()
    minPrice?: number;

    @ApiProperty({ description: 'Maximum price', example: 1000000, required: false })
    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    @IsNumber()
    maxPrice?: number;

    @ApiProperty({ description: 'Minimum bedrooms', example: 2, required: false })
    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    @IsNumber()
    bedrooms?: number;

    @ApiProperty({ description: 'Minimum bathrooms', example: 2, required: false })
    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    @IsNumber()
    bathrooms?: number;

    @ApiProperty({ description: 'Property type', example: 'flat', required: false })
    @IsOptional()
    @IsString()
    propertyType?: string;

    @ApiProperty({ description: 'Required amenities', example: ['parking', 'security'], required: false })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    amenities?: string[];

    @ApiProperty({ description: 'Search radius in kilometers', example: 10, default: 10, required: false })
    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    @IsNumber()
    @Min(1)
    @Max(50)
    radius?: number = 10;

    @ApiProperty({
        description: 'Sort field',
        example: 'created_at',
        enum: ['created_at', 'price', 'bedrooms', 'view_count'],
        default: 'created_at',
        required: false
    })
    @IsOptional()
    @IsEnum(['created_at', 'price', 'bedrooms', 'view_count'])
    sortBy?: string = 'created_at';

    @ApiProperty({
        description: 'Sort order',
        example: 'DESC',
        enum: ['ASC', 'DESC'],
        default: 'DESC',
        required: false
    })
    @IsOptional()
    @IsEnum(['ASC', 'DESC'])
    sortOrder?: 'ASC' | 'DESC' = 'DESC';
}