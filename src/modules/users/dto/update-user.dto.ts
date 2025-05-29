// File: src/modules/users/dto/update-user.dto.ts
import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsObject } from 'class-validator';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {
    @ApiPropertyOptional({
        description: 'Update user full name',
        example: 'John Doe Updated',
        maxLength: 100,
    })
    name?: string;

    @ApiPropertyOptional({
        description: 'Update preferred location for property search',
        example: 'Lugbe Phase 2, Abuja',
        maxLength: 100,
    })
    location_preference?: string;

    @ApiPropertyOptional({
        description: 'Update minimum budget for monthly rent',
        example: 350000,
        minimum: 50000,
    })
    budget_min?: number;

    @ApiPropertyOptional({
        description: 'Update maximum budget for monthly rent',
        example: 700000,
        minimum: 50000,
    })
    budget_max?: number;

    @ApiPropertyOptional({
        description: 'Update user property preferences',
        example: {
            bedrooms: 3,
            bathrooms: 2,
            amenities: ['parking', 'security', 'power', 'generator'],
            propertyTypes: ['flat', 'house'],
            maxDistanceFromWork: 10,
            preferredAreas: ['Lugbe Phase 1', 'Lugbe Phase 2']
        },
    })
    @IsOptional()
    @IsObject()
    preferences?: any;

    @ApiPropertyOptional({
        description: 'Update phone number',
        example: '+2348123456789',
    })
    phone_number?: string;
}