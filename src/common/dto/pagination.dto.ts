// File: src/common/dto/pagination.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationDto {
    @ApiProperty({
        description: 'Page number (1-based)',
        example: 1,
        minimum: 1,
        default: 1,
        required: false,
    })
    @IsOptional()
    @IsNumber()
    @Min(1)
    @Type(() => Number)
    page?: number = 1;

    @ApiProperty({
        description: 'Number of items per page',
        example: 20,
        minimum: 1,
        maximum: 100,
        default: 20,
        required: false,
    })
    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(100)
    @Type(() => Number)
    limit?: number = 20;
}