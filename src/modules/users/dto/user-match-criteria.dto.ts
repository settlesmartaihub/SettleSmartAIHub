// File name: src/modules/users/dto/user-match-criteria.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsArray, IsString, IsNumber, IsBoolean, Min, Max, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationDto } from '../../../common/dto/pagination.dto';

class BudgetRangeDto {
    @ApiProperty({
        description: 'Minimum budget',
        example: 100000,
        minimum: 0,
    })
    @IsNumber()
    @Min(0)
    min: number;

    @ApiProperty({
        description: 'Maximum budget',
        example: 500000,
        minimum: 0,
    })
    @IsNumber()
    @Min(0)
    max: number;
}

export class UserMatchCriteriaDto extends PaginationDto {
    @ApiProperty({
        description: 'Budget range for matching users',
        type: BudgetRangeDto,
        required: false,
    })
    @IsOptional()
    @ValidateNested()
    @Type(() => BudgetRangeDto)
    budget_range?: BudgetRangeDto;

    @ApiProperty({
        description: 'Property types to match',
        example: ['flat', 'house'],
        enum: ['flat', 'house', 'room', 'self-contain'],
        isArray: true,
        required: false,
    })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    property_types?: string[];

    @ApiProperty({
        description: 'Location to match users in',
        example: 'Lugbe',
        required: false,
    })
    @IsOptional()
    @IsString()
    location?: string;

    @ApiProperty({
        description: 'Filter by active users only',
        example: true,
        default: true,
        required: false,
    })
    @IsOptional()
    @IsBoolean()
    is_active?: boolean = true;
}