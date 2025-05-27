// src/properties/dto/property-filter.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum } from 'class-validator';

export class PropertyFilterDto {
    @ApiProperty({
        description: 'Filter by property status',
        enum: ['available', 'rented', 'maintenance', 'inactive'],
        required: false
    })
    @IsOptional()
    @IsEnum(['available', 'rented', 'maintenance', 'inactive'])
    status?: string;

    @ApiProperty({
        description: 'Filter by verification status',
        enum: ['pending', 'verified', 'rejected'],
        required: false
    })
    @IsOptional()
    @IsEnum(['pending', 'verified', 'rejected'])
    verificationStatus?: string;
}