// Filename: src/modules/properties/dto/create-property.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString,
    IsNumber,
    IsObject,
    IsArray,
    IsBoolean,
    IsOptional,
    IsIn,
    IsUrl,
    IsPositive,
    Min,
    Max,
    MaxLength,
    MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
    PropertyType,
    PropertyVerificationStatus,
    PropertyStatus,
    PropertyAmenities,
    PropertyLocation,
} from '../entities/property.entity';

export class CreatePropertyDto {
    @ApiProperty({
        description: 'Property title/headline',
        example: 'Beautiful 2-Bedroom Flat in Lugbe Phase 1',
        maxLength: 200,
        minLength: 10,
    })
    @IsString()
    @MinLength(10)
    @MaxLength(200)
    title: string;

    @ApiPropertyOptional({
        description: 'Detailed property description',
        example: 'Spacious 2-bedroom flat with modern amenities in a secure estate...',
        maxLength: 2000,
    })
    @IsOptional()
    @IsString()
    @MaxLength(2000)
    description?: string;

    @ApiProperty({
        description: 'Type of property',
        enum: PropertyType,
        example: PropertyType.FLAT,
    })
    @IsIn(Object.values(PropertyType))
    property_type: PropertyType;

    @ApiProperty({
        description: 'Monthly rent price in Naira',
        example: 650000,
        minimum: 50000,
    })
    @IsNumber()
    @Type(() => Number)
    @IsPositive()
    @Min(50000)
    price: number;

    @ApiProperty({
        description: 'Property location details',
        example: {
            area: 'Lugbe Phase 1',
            landmark: 'Near Lugbe Market',
            coordinates: { latitude: 8.7832, longitude: 7.3986 },
        },
    })
    @IsObject()
    location: PropertyLocation;

    @ApiProperty({
        description: 'Number of bedrooms',
        example: 2,
        minimum: 1,
        maximum: 10,
    })
    @IsNumber()
    @Type(() => Number)
    @Min(1)
    @Max(10)
    bedrooms: number;

    @ApiProperty({
        description: 'Number of bathrooms',
        example: 2,
        minimum: 1,
        maximum: 10,
    })
    @IsNumber()
    @Type(() => Number)
    @Min(1)
    @Max(10)
    bathrooms: number;

    @ApiProperty({
        description: 'Property amenities and features',
        example: {
            parking: true,
            security: true,
            power: true,
            water: true,
            internet: false,
            generator: true,
        },
    })
    @IsObject()
    amenities: PropertyAmenities;

    @ApiPropertyOptional({
        description: 'Array of property image URLs',
        example: [
            'https://example.com/images/property1_1.jpg',
            'https://example.com/images/property1_2.jpg',
        ],
        isArray: true,
    })
    @IsOptional()
    @IsArray()
    @IsUrl({}, { each: true })
    images?: string[];

    @ApiPropertyOptional({
        description: 'Property verification status',
        enum: PropertyVerificationStatus,
        example: PropertyVerificationStatus.PENDING,
    })
    @IsOptional()
    @IsIn(Object.values(PropertyVerificationStatus))
    verification_status?: PropertyVerificationStatus;

    @ApiPropertyOptional({
        description: 'Property availability status',
        enum: PropertyStatus,
        example: PropertyStatus.AVAILABLE,
    })
    @IsOptional()
    @IsIn(Object.values(PropertyStatus))
    status?: PropertyStatus;

    @ApiPropertyOptional({
        description: 'Whether property is currently available for rent',
        example: true,
    })
    @IsOptional()
    @IsBoolean()
    is_available?: boolean;
}