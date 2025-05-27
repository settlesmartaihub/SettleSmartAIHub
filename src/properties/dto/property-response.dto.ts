// src/properties/dto/property-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class PropertyResponseDto {
    @ApiProperty({ description: 'Property ID', example: '123e4567-e89b-12d3-a456-426614174000' })
    id: string;

    @ApiProperty({ description: 'Property title', example: '2-Bedroom Flat in Lugbe' })
    title: string;

    @ApiProperty({ description: 'Property description' })
    description: string;

    @ApiProperty({ description: 'Property type', example: 'flat' })
    property_type: string;

    @ApiProperty({ description: 'Monthly rent in Naira', example: 750000 })
    price: number;

    @ApiProperty({ description: 'Number of bedrooms', example: 2 })
    bedrooms: number;

    @ApiProperty({ description: 'Number of bathrooms', example: 2 })
    bathrooms: number;

    @ApiProperty({ description: 'Property amenities', example: ['parking', 'security'] })
    amenities: string[];

    @ApiProperty({ description: 'Property images URLs' })
    images: string[];

    @ApiProperty({ description: 'Property status', example: 'available' })
    status: string;

    @ApiProperty({ description: 'View count', example: 25 })
    view_count: number;

    @ApiProperty({ description: 'Inquiry count', example: 5 })
    inquiry_count: number;

    @ApiProperty({ description: 'Creation date' })
    created_at: Date;
}