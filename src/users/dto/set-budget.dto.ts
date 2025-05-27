// Filename: src/users/dto/set-budget.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min, Max, ValidateIf } from 'class-validator';

export class SetBudgetDto {
    @ApiProperty({
        description: 'Minimum budget in Naira',
        example: 500000,
        minimum: 50000
    })
    @IsNumber()
    @Min(50000, { message: 'Minimum budget must be at least ₦50,000' })
    @Max(100000000, { message: 'Minimum budget cannot exceed ₦100,000,000' })
    minBudget: number;

    @ApiProperty({
        description: 'Maximum budget in Naira',
        example: 1000000,
        minimum: 50000
    })
    @IsNumber()
    @Min(50000, { message: 'Maximum budget must be at least ₦50,000' })
    @Max(100000000, { message: 'Maximum budget cannot exceed ₦100,000,000' })
    @ValidateIf((o) => o.maxBudget > o.minBudget, {
        message: 'Maximum budget must be greater than minimum budget'
    })
    maxBudget: number;
}