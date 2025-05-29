// File name: src/modules/users/dto/set-budget.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min, IsEnum, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export enum BudgetType {
    MONTHLY = 'monthly',
    YEARLY = 'yearly',
}

export class SetBudgetDto {
    @ApiProperty({
        description: 'Minimum budget amount in Naira',
        example: 200000,
        minimum: 50000,
    })
    @IsNumber()
    @Min(50000, { message: 'Minimum budget should be at least ₦50,000' })
    @Transform(({ value }) => parseInt(value))
    min_budget: number;

    @ApiProperty({
        description: 'Maximum budget amount in Naira',
        example: 800000,
        minimum: 50000,
    })
    @IsNumber()
    @Min(50000, { message: 'Maximum budget should be at least ₦50,000' })
    @Transform(({ value }) => parseInt(value))
    max_budget: number;

    @ApiProperty({
        description: 'Budget type - monthly or yearly',
        example: 'monthly',
        enum: BudgetType,
        default: BudgetType.MONTHLY,
        required: false,
    })
    @IsOptional()
    @IsEnum(BudgetType)
    budget_type?: BudgetType = BudgetType.MONTHLY;
}