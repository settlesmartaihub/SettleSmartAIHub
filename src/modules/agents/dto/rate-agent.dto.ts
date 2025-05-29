// File name: src/modules/agents/dto/rate-agent.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min, Max, IsOptional, IsString, MaxLength } from 'class-validator';

export class RateAgentDto {
    @ApiProperty({
        description: 'Rating score (1-5 stars)',
        example: 4.5,
        minimum: 1,
        maximum: 5,
    })
    @IsNumber()
    @Min(1, { message: 'Rating must be at least 1 star' })
    @Max(5, { message: 'Rating cannot exceed 5 stars' })
    rating: number;

    @ApiProperty({
        description: 'Optional review text',
        example: 'Excellent service! Very responsive and professional.',
        required: false,
        maxLength: 500,
    })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    review?: string;

    @ApiProperty({
        description: 'Name or identifier of the person rating',
        example: 'John Doe',
        required: false,
        maxLength: 100,
    })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    rated_by?: string;
}