// File name: src/common/guards/agent-verification.guard.ts

import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Agent, AgentVerificationStatus, AgentStatus } from '../../modules/agents/entities/agent.entity';

@Injectable()
export class AgentVerificationGuard implements CanActivate {
    private readonly logger = new Logger(AgentVerificationGuard.name);

    constructor(
        @InjectRepository(Agent)
        private readonly agentRepository: Repository<Agent>,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        // If user is not an agent, allow (this guard only applies to agents)
        if (!user || user.role !== 'agent') {
            return true;
        }

        try {
            // Fetch agent from database to get current verification status
            const agent = await this.agentRepository.findOne({
                where: { id: user.id },
                select: ['id', 'verification_status', 'status', 'name', 'email']
            });

            if (!agent) {
                this.logger.warn(`Agent not found for user ID: ${user.id}`);
                throw new ForbiddenException('Agent account not found');
            }

            // Check if agent is verified and active
            const isVerified = agent.verification_status === AgentVerificationStatus.VERIFIED;
            const isActive = agent.status === AgentStatus.ACTIVE;

            if (!isVerified) {
                this.logger.warn(`Unverified agent attempted access: ${agent.email} (${agent.verification_status})`);
                
                let message = 'Your agent account needs verification before you can perform this action.';
                
                switch (agent.verification_status) {
                    case AgentVerificationStatus.PENDING:
                        message = 'Your agent account is pending verification. Please wait for admin approval.';
                        break;
                    case AgentVerificationStatus.REJECTED:
                        message = 'Your agent account has been rejected. Please contact support.';
                        break;
                    case AgentVerificationStatus.SUSPENDED:
                        message = 'Your agent account has been suspended. Please contact support.';
                        break;
                }
                
                throw new ForbiddenException({
                    message,
                    error: 'AGENT_NOT_VERIFIED',
                    statusCode: 403,
                    details: {
                        verification_status: agent.verification_status,
                        agent_status: agent.status,
                        required_status: 'verified'
                    }
                });
            }

            if (!isActive) {
                this.logger.warn(`Inactive agent attempted access: ${agent.email} (${agent.status})`);
                throw new ForbiddenException({
                    message: 'Your agent account is not active. Please contact support.',
                    error: 'AGENT_NOT_ACTIVE',
                    statusCode: 403,
                    details: {
                        verification_status: agent.verification_status,
                        agent_status: agent.status,
                        required_status: 'active'
                    }
                });
            }

            this.logger.log(`Verified agent access granted: ${agent.email}`);
            return true;

        } catch (error) {
            if (error instanceof ForbiddenException) {
                throw error;
            }
            
            this.logger.error(`Error checking agent verification: ${error.message}`, error.stack);
            throw new ForbiddenException('Unable to verify agent status');
        }
    }
}