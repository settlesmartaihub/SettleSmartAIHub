// File name: src/modules/agents/dto/verify-agent.dto.ts

import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsOptional, IsBoolean } from 'class-validator';
import { AgentVerificationStatus } from '../entities/agent.entity';

export class VerifyAgentDto {
    @ApiProperty({
        description: 'Verification decision',
        example: true,
        type: Boolean
    })
    @IsBoolean()
    approved: boolean;

    @ApiProperty({
        description: 'Verification status to set',
        enum: AgentVerificationStatus,
        example: AgentVerificationStatus.VERIFIED,
        required: false
    })
    @IsOptional()
    @IsEnum(AgentVerificationStatus)
    verification_status?: AgentVerificationStatus;

    @ApiProperty({
        description: 'Admin notes for verification decision',
        example: 'Agent documents verified. Business license confirmed.',
        required: false
    })
    @IsOptional()
    @IsString()
    notes?: string;

    @ApiProperty({
        description: 'Reason for rejection (if applicable)',
        example: 'Invalid business license',
        required: false
    })
    @IsOptional()
    @IsString()
    rejection_reason?: string;
}

// Additional DTO for bulk verification
export class BulkVerifyAgentsDto {
    @ApiProperty({
        description: 'Array of agent IDs to verify',
        example: ['uuid1', 'uuid2', 'uuid3'],
        type: [String]
    })
    agent_ids: string[];

    @ApiProperty({
        description: 'Verification decision for all agents',
        example: true,
        type: Boolean
    })
    @IsBoolean()
    approved: boolean;

    @ApiProperty({
        description: 'Notes for bulk verification',
        example: 'Bulk verification after document review',
        required: false
    })
    @IsOptional()
    @IsString()
    notes?: string;
}