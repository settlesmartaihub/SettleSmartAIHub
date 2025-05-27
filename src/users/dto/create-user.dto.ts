// File name: src/users/dto/create-user.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, MinLength, IsObject, IsNumber, Min, Max } from 'class-validator';
import { IsNigerianPhone } from '../../common/decorators/phone-validation.decorator';
import { UserStatus } from '../../modules/users/entities/user.entity';

export class CreateUserDto {
    @ApiProperty({
        description: 'User full name',
        example: 'John Doe',
        minLength: 2
    })
    @IsString()
    @MinLength(2, { message: 'Name must be at least 2 characters long' })
    name: string;

    @ApiProperty({
        description: 'Nigerian phone number',
        example: '+2348123456789',
        pattern: '^(\\+234|234|0)[789][01][0-9]{8}$'
    })
    @IsNigerianPhone()
    phone: string;

    @ApiProperty({
        description: 'User location/area of interest',
        example: 'Lugbe, Abuja',
        required: false
    })
    @IsOptional()
    @IsString()
    location?: string;

    @ApiProperty({
        description: 'User account status',
        enum: UserStatus,
        example: UserStatus.ACTIVE,
        default: UserStatus.ACTIVE,
        required: false
    })
    @IsOptional()
    @IsEnum(UserStatus)
    status?: UserStatus;

    @ApiProperty({
        description: 'Minimum budget in Naira',
        example: 500000,
        minimum: 50000,
        required: false
    })
    @IsOptional()
    @IsNumber()
    @Min(50000, { message: 'Minimum budget must be at least ₦50,000' })
    budgetMin?: number;

    @ApiProperty({
        description: 'Maximum budget in Naira',
        example: 1000000,
        minimum: 50000,
        required: false
    })
    @IsOptional()
    @IsNumber()
    @Min(50000, { message: 'Maximum budget must be at least ₦50,000' })
    budgetMax?: number;

    @ApiProperty({
        description: 'User property preferences',
        example: {
            propertyType: '2-bedroom',
            amenities: ['parking', 'security', 'water'],
            preferredAreas: ['Lugbe Extension', 'Lugbe Central']
        },
        required: false
    })
    @IsOptional()
    @IsObject()
    preferences?: Record<string, any>;
}