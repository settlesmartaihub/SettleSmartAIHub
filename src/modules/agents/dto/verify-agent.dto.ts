// File name: src/modules/agents/dto/verify-agent.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export enum VerificationStatus {
    VERIFIED = 'verified',
    REJECTED = 'rejected',
}

export class VerifyAgentDto {
    @ApiProperty({
        description: 'Verification status',
        example: 'verified',
        enum: VerificationStatus,
    })
    @IsEnum(VerificationStatus)
    status: VerificationStatus;

    @ApiProperty({
        description: 'Admin notes for verification decision',
        example: 'All documents verified successfully. Business registration confirmed.',
        required: false,
        maxLength: 500,
    })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    admin_notes?: string;
}