
// File: src/modules/agents/dto/agent-properties-filter.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum PropertyStatus {
    AVAILABLE = 'available',
    RENTED = 'rented',
    MAINTENANCE = 'maintenance',
    INACTIVE = 'inactive',
}

export enum PropertyType {
    FLAT = 'flat',
    HOUSE = 'house',
    ROOM = 'room',
    SELF_CONTAIN = 'self-contain',
}

export class AgentPropertiesFilterDto {
    @ApiProperty({
        description: 'Filter by property status',
        example: 'available',
        enum: PropertyStatus,
        required: false,
    })
    @IsOptional()
    @IsEnum(PropertyStatus)
    status?: PropertyStatus;

    @ApiProperty({
        description: 'Filter by property type',
        example: 'flat',
        enum: PropertyType,
        required: false,
    })
    @IsOptional()
    @IsEnum(PropertyType)
    property_type?: PropertyType;

    @ApiProperty({
        description: 'Minimum price filter',
        example: 200000,
        minimum: 0,
        required: false,
    })
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    min_price?: number;

    @ApiProperty({
        description: 'Maximum price filter',
        example: 1000000,
        minimum: 0,
        required: false,
    })
    @IsOptional()
    @IsNumber()
    @Min(0)
    @Type(() => Number)
    max_price?: number;
}