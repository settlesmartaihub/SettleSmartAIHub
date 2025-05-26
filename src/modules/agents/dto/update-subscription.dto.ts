// File: src/modules/agents/dto/update-subscription.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export enum SubscriptionTier {
    BASIC = 'basic',
    PREMIUM = 'premium',
}

export class UpdateSubscriptionDto {
    @ApiProperty({
        description: 'Subscription tier',
        example: 'premium',
        enum: SubscriptionTier,
    })
    @IsEnum(SubscriptionTier)
    tier: SubscriptionTier;
}