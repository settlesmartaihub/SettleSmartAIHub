// File name: src/users/dto/user-match-criteria.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsEnum, IsArray } from 'class-validator';

export class UserMatchCriteriaDto {
    @ApiProperty({
        description: 'Property location to match users interested in this area',
        example: 'Lugbe, Abuja',
        required: false
    })
    @IsOptional()
    @IsString()
    location?: string;

    @ApiProperty({
        description: 'Minimum budget range for matching',
        example: 500000,
        required: false
    })
    @IsOptional()
    @IsNumber()
    minBudget?: number;

    @ApiProperty({
        description: 'Maximum budget range for matching',
        example: 1500000,
        required: false
    })
    @IsOptional()
    @IsNumber()
    maxBudget?: number;

    @ApiProperty({
        description: 'Property type to match user preferences',
        example: '2-bedroom',
        required: false
    })
    @IsOptional()
    @IsString()
    propertyType?: string;

    @ApiProperty({
        description: 'Number of bedrooms',
        example: 2,
        required: false
    })
    @IsOptional()
    @IsNumber()
    bedrooms?: number;

    @ApiProperty({
        description: 'Required amenities',
        example: ['parking', 'security', 'water'],
        required: false
    })
    @IsOptional()
    @IsArray()
    amenities?: string[];
}