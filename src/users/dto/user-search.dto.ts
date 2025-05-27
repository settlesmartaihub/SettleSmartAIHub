// Filename: src/users/dto/user-search.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsEnum, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';
import { UserStatus } from '../../modules/users/entities/user.entity';

export class UserSearchDto {
    @ApiProperty({
        description: 'Page number for pagination',
        example: 1,
        default: 1,
        required: false
    })
    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    @IsNumber()
    @Min(1)
    page?: number = 1;

    @ApiProperty({
        description: 'Number of items per page',
        example: 10,
        default: 10,
        required: false
    })
    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    @IsNumber()
    @Min(1)
    @Max(100)
    limit?: number = 10;

    @ApiProperty({
        description: 'Search by user name',
        example: 'John',
        required: false
    })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiProperty({
        description: 'Search by phone number',
        example: '8123456789',
        required: false
    })
    @IsOptional()
    @IsString()
    phone?: string;

    @ApiProperty({
        description: 'Search by location',
        example: 'Lugbe',
        required: false
    })
    @IsOptional()
    @IsString()
    location?: string;

    @ApiProperty({
        description: 'Filter by user status',
        enum: UserStatus,
        required: false
    })
    @IsOptional()
    @IsEnum(UserStatus)
    status?: UserStatus;

    @ApiProperty({
        description: 'Filter by minimum budget (users with budget >= this value)',
        example: 500000,
        required: false
    })
    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    @IsNumber()
    budgetMin?: number;

    @ApiProperty({
        description: 'Filter by maximum budget (users with budget <= this value)',
        example: 1000000,
        required: false
    })
    @IsOptional()
    @Transform(({ value }) => parseInt(value))
    @IsNumber()
    budgetMax?: number;

    @ApiProperty({
        description: 'Sort field',
        example: 'createdAt',
        enum: ['createdAt', 'updatedAt', 'name', 'budgetMax'],
        default: 'createdAt',
        required: false
    })
    @IsOptional()
    @IsEnum(['createdAt', 'updatedAt', 'name', 'budgetMax'])
    sortBy?: string = 'createdAt';

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