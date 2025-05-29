// File name: src/properties/dto/create-property.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsEnum, IsArray, IsObject, MinLength, Min, Max, IsOptional } from 'class-validator';

enum PropertyType {
    FLAT = 'flat',
    HOUSE = 'house',
    ROOM = 'room',
    SELF_CONTAIN = 'self-contain'
}

export class PropertyLocationDto {
    @ApiProperty({ description: 'Full property address', example: 'Plot 123, Lugbe Extension, Abuja' })
    @IsString()
    @MinLength(10)
    address: string;

    @ApiProperty({ description: 'Area/neighborhood', example: 'Lugbe' })
    @IsString()
    area: string;

    @ApiProperty({ description: 'State', example: 'FCT' })
    @IsString()
    state: string;

    @ApiProperty({ description: 'Country', example: 'Nigeria', default: 'Nigeria' })
    @IsOptional()
    @IsString()
    country?: string = 'Nigeria';

    @ApiProperty({
        description: 'GPS coordinates (auto-generated if not provided)',
        example: { latitude: 8.7594, longitude: 7.3831 },
        required: false
    })
    @IsOptional()
    @IsObject()
    coordinates?: { latitude: number; longitude: number };
}

export class CreatePropertyDto {
    @ApiProperty({ description: 'Property title', example: '2-Bedroom Flat in Lugbe Extension' })
    @IsString()
    @MinLength(5)
    title: string;

    @ApiProperty({ description: 'Detailed property description', example: 'Beautiful 2-bedroom flat with modern amenities in a serene environment...' })
    @IsString()
    @MinLength(20)
    description: string;

    @ApiProperty({ description: 'Property type', enum: PropertyType, example: PropertyType.FLAT })
    @IsEnum(PropertyType)
    property_type: PropertyType;

    @ApiProperty({ description: 'Monthly rent in Naira', example: 750000, minimum: 50000 })
    @IsNumber()
    @Min(50000)
    @Max(50000000)
    price: number;

    @ApiProperty({ description: 'Property location details', type: PropertyLocationDto })
    @IsObject()
    location: PropertyLocationDto;

    @ApiProperty({ description: 'Number of bedrooms', example: 2, minimum: 0, maximum: 10 })
    @IsNumber()
    @Min(0)
    @Max(10)
    bedrooms: number;

    @ApiProperty({ description: 'Number of bathrooms', example: 2, minimum: 1, maximum: 10 })
    @IsNumber()
    @Min(1)
    @Max(10)
    bathrooms: number;

    @ApiProperty({
        description: 'Property amenities',
        example: ['parking', 'security', 'water', 'electricity', 'internet'],
        type: [String]
    })
    @IsArray()
    @IsString({ each: true })
    amenities: string[];
}
