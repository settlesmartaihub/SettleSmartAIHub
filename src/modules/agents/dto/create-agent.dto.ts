// File: src/modules/agents/dto/create-agent.dto.ts (CORRECTED)
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, IsOptional, IsEnum } from 'class-validator';
import { AgentSubscriptionTier } from '../entities/agent.entity';

export class CreateAgentDto {
    @ApiProperty({
        description: 'Nigerian phone number',
        example: '+2348123456789',
    })
    @IsString()
    phone_number: string;

    @ApiProperty({
        description: 'Business name',
        example: 'Prime Properties Ltd',
    })
    @IsString()
    business_name: string;

    @ApiProperty({
        description: 'Contact person name',
        example: 'John Smith',
        required: false,
    })
    @IsOptional()
    @IsString()
    contactPerson?: string;

    @ApiProperty({
        description: 'Business address',
        example: '123 Lugbe Road, Abuja',
        required: false,
    })
    @IsOptional()
    @IsString()
    businessAddress?: string;

    @ApiProperty({
        description: 'Service areas',
        example: ['Lugbe', 'Airport Road', 'Kuje'],
        isArray: true,
        required: false,
    })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    serviceAreas?: string[];

    @ApiProperty({
        description: 'Subscription tier',
        enum: AgentSubscriptionTier,
        example: AgentSubscriptionTier.BASIC,
        required: false,
    })
    @IsOptional()
    @IsEnum(AgentSubscriptionTier)
    subscription_tier?: AgentSubscriptionTier;

    @ApiProperty({
        description: 'Business email',
        example: 'info@primeproperties.ng',
        required: false,
    })
    @IsOptional()
    @IsString()
    email?: string;

    @ApiProperty({
        description: 'Website URL',
        example: 'https://primeproperties.ng',
        required: false,
    })
    @IsOptional()
    @IsString()
    website?: string;
}