// File name: src/modules/users/dto/create-user.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsString,
    IsOptional,
    IsNumber,
    IsObject,
    IsPositive,
    IsIn,
    Min,
    Max,
    MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IsNigerianPhone } from '../../../common/decorators/phone-validation.decorator';
import { UserPreferences, UserStatus } from '../entities/user.entity';

export class CreateUserDto {
    @ApiProperty({
        description: 'Nigerian phone number',
        example: '+2348123456789',
    })
    @IsNigerianPhone()
    phone_number: string;

    @ApiPropertyOptional({
        description: 'User full name',
        example: 'John Doe',
        maxLength: 100,
    })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    name?: string;

    @ApiPropertyOptional({
        description: 'Preferred location for property search',
        example: 'Lugbe, Abuja',
        maxLength: 100,
    })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    location_preference?: string;

    @ApiPropertyOptional({
        description: 'Minimum budget for monthly rent',
        example: 200000,
        minimum: 50000,
    })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    @IsPositive()
    @Min(50000)
    budget_min?: number;

    @ApiPropertyOptional({
        description: 'Maximum budget for monthly rent',
        example: 800000,
        minimum: 50000,
    })
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    @IsPositive()
    @Min(50000)
    budget_max?: number;

    @ApiPropertyOptional({
        description: 'User property preferences and requirements',
        example: {
            bedrooms: 2,
            bathrooms: 2,
            amenities: ['parking', 'security', 'power'],
            propertyTypes: ['flat', 'house'],
        },
    })
    @IsOptional()
    @IsObject()
    preferences?: UserPreferences;

    @ApiPropertyOptional({
        description: 'User account status',
        enum: UserStatus,
        example: UserStatus.ACTIVE,
    })
    @IsOptional()
    @IsIn(Object.values(UserStatus))
    status?: UserStatus;
}