// Filename: src/modules/users/dto/user-search.dto.ts

import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import {
    IsOptional,
    IsNumber,
    IsString,
    IsIn,
    Min,
    Max,
    IsPositive,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UserStatus } from '../entities/user.entity';

export class UserSearchDto {
    @ApiPropertyOptional({
        description: 'Search by phone number',
        example: '+2348123456789',
    })
    @IsOptional()
    @IsString()
    phone_number?: string;

    @ApiPropertyOptional({
        description: 'Search by name',
        example: 'John',
    })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiPropertyOptional({
        description: 'Filter by location preference',
        example: 'Lugbe',
    })
    @IsOptional()
    @IsString()
    location_preference?: string;

    @ApiPropertyOptional({
        description: 'Filter by minimum budget',
        example: 200000,
    })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    @Min(0)
    budget_min?: number;

    @ApiPropertyOptional({
        description: 'Filter by maximum budget',
        example: 1000000,
    })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    @Min(0)
    budget_max?: number;

    @ApiPropertyOptional({
        description: 'Filter by user status',
        enum: UserStatus,
    })
    @IsOptional()
    @IsIn(Object.values(UserStatus))
    status?: UserStatus;

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
        maximum: 100,
    })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    @Min(1)
    @Max(100)
    limit?: number = 10;
}

export class SetBudgetDto {
    @ApiProperty({
        description: 'Minimum budget for monthly rent',
        example: 200000,
        minimum: 50000,
    })
    @IsNumber()
    @Type(() => Number)
    @IsPositive()
    @Min(50000)
    budget_min: number;

    @ApiProperty({
        description: 'Maximum budget for monthly rent',
        example: 800000,
        minimum: 50000,
    })
    @IsNumber()
    @Type(() => Number)
    @IsPositive()
    @Min(50000)
    budget_max: number;
}

export class UpdatePreferencesDto {
    @ApiPropertyOptional({
        description: 'Preferred number of bedrooms',
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
        description: 'Preferred number of bathrooms',
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
    amenities?: string[];

    @ApiPropertyOptional({
        description: 'Preferred property types',
        example: ['flat', 'house'],
        isArray: true,
    })
    @IsOptional()
    propertyTypes?: string[];

    @ApiPropertyOptional({
        description: 'Maximum distance from work in kilometers',
        example: 5,
        minimum: 1,
        maximum: 50,
    })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    @Min(1)
    @Max(50)
    maxDistanceFromWork?: number;

    @ApiPropertyOptional({
        description: 'Preferred areas within Lugbe',
        example: ['Phase 1', 'Phase 2'],
        isArray: true,
    })
    @IsOptional()
    preferredAreas?: string[];
}