// File name: src/common/decorators/agent-verified.decorator.ts

import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiForbiddenResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { AgentVerificationGuard } from '../guards/agent-verification.guard';
import { Roles } from './roles.decorator';
import { UserRole } from '../enums/user-role.enum';

/**
 * Decorator that ensures the agent is verified before allowing access
 * Combines JWT authentication, role checking, and agent verification
 */
export function VerifiedAgent() {
    return applyDecorators(
        UseGuards(JwtAuthGuard, RolesGuard, AgentVerificationGuard),
        Roles(UserRole.AGENT),
        ApiBearerAuth(),
        ApiForbiddenResponse({
            description: 'Agent not verified or account not active',
            schema: {
                example: {
                    statusCode: 403,
                    message: 'Your agent account is pending verification. Please wait for admin approval.',
                    error: 'AGENT_NOT_VERIFIED',
                    details: {
                        verification_status: 'pending',
                        agent_status: 'active',
                        required_status: 'verified'
                    },
                    timestamp: '2025-06-10T14:30:22Z'
                }
            }
        }),
        ApiResponse({
            status: 401,
            description: 'Unauthorized - Invalid or missing JWT token'
        }),
    );
}

/**
 * Decorator for endpoints that require verified agent access
 * with custom error responses
 */
export function RequireVerifiedAgent(customResponses?: any) {
    const baseDecorators = [
        UseGuards(JwtAuthGuard, RolesGuard, AgentVerificationGuard),
        Roles(UserRole.AGENT),
        ApiBearerAuth(),
    ];

    if (customResponses) {
        baseDecorators.push(...customResponses);
    } else {
        baseDecorators.push(
            ApiForbiddenResponse({
                description: 'Agent verification required',
                schema: {
                    example: {
                        statusCode: 403,
                        message: 'Your agent account needs verification before you can perform this action.',
                        error: 'AGENT_NOT_VERIFIED'
                    }
                }
            })
        );
    }

    return applyDecorators(...baseDecorators);
}