// File name: src/modules/properties/dto/property-match.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class PropertyMatchDto {
    @ApiProperty({
        description: 'User phone number for matching preferences',
        example: '+2348123456789'
    })
    @IsString()
    userPhone: string;

    @ApiProperty({
        description: 'User budget minimum',
        example: 200000,
        required: false
    })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    budget_min?: number;

    @ApiProperty({
        description: 'User budget maximum', 
        example: 800000,
        required: false
    })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    budget_max?: number;

    @ApiProperty({
        description: 'Preferred number of bedrooms',
        example: 2,
        required: false
    })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    bedrooms?: number;

    @ApiProperty({
        description: 'Preferred property types',
        example: ['flat', 'house'],
        isArray: true,
        required: false
    })
    @IsOptional()
    @IsArray()
    property_types?: string[];

    @ApiProperty({
        description: 'Required amenities',
        example: ['parking', 'security', 'power'],
        isArray: true,
        required: false
    })
    @IsOptional()
    @IsArray()
    required_amenities?: string[];

    @ApiProperty({
        description: 'Preferred location area',
        example: 'Lugbe Phase 1',
        required: false
    })
    @IsOptional()
    @IsString()
    location?: string;
}