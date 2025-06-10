// File name: src/modules/agents/agents.service.ts (Fixed verifyAgent method)

import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan } from 'typeorm';
import { Agent, AgentSubscriptionTier, AgentStatus, AgentVerificationStatus } from './entities/agent.entity';
import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
import { VerifyAgentDto } from './dto/verify-agent.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { RateAgentDto } from './dto/rate-agent.dto';
import { AgentSearchDto } from './dto/agent-search.dto';
import { AgentPropertiesFilterDto } from './dto/agent-properties-filter.dto';
import { PaginatedResponse } from '../../common/interfaces/response.interface';

@Injectable()
export class AgentsService {
    constructor(
        @InjectRepository(Agent)
        private readonly agentRepository: Repository<Agent>,
        // Remove other injections that cause circular dependency for now
    ) { }

    // Find agent by ID
    async findById(id: string): Promise<Agent> {
        const agent = await this.agentRepository.findOne({ where: { id } });
        if (!agent) {
            throw new NotFoundException(`Agent with ID ${id} not found`);
        }
        return agent;
    }

    // FIXED: Verify agent method
    async verifyAgent(id: string, verifyAgentDto: VerifyAgentDto): Promise<Agent> {
        console.log(`🔍 Verifying agent ${id} with data:`, verifyAgentDto);
        
        const agent = await this.findById(id);
        
        console.log(`📋 Current agent status:`, {
            id: agent.id,
            name: agent.name,
            email: agent.email,
            verification_status: agent.verification_status,
            status: agent.status
        });

        // Check current verification status
        if (agent.verification_status === AgentVerificationStatus.VERIFIED) {
            console.log(`⚠️ Agent ${agent.email} is already verified`);
            throw new BadRequestException({
                message: 'Agent is already verified',
                error: 'ALREADY_VERIFIED',
                details: {
                    current_status: agent.verification_status,
                    agent_status: agent.status
                }
            });
        }

        // Determine the new verification status based on approval
        let newVerificationStatus: AgentVerificationStatus;
        let newAgentStatus: AgentStatus;

        if (verifyAgentDto.approved) {
            newVerificationStatus = AgentVerificationStatus.VERIFIED;
            newAgentStatus = AgentStatus.ACTIVE;
            console.log(`✅ Approving agent ${agent.email}`);
        } else {
            newVerificationStatus = AgentVerificationStatus.REJECTED;
            newAgentStatus = AgentStatus.INACTIVE;
            console.log(`❌ Rejecting agent ${agent.email}`);
        }

        // Update the agent
        const updateData: Partial<Agent> = {
            verification_status: newVerificationStatus,
            status: newAgentStatus,
        };

        await this.agentRepository.update(id, updateData);
        
        const updatedAgent = await this.findById(id);
        
        console.log(`🎉 Agent ${agent.email} verification updated:`, {
            verification_status: updatedAgent.verification_status,
            status: updatedAgent.status,
            approved: verifyAgentDto.approved
        });

        return updatedAgent;
    }

    // Create a new agent
    async create(createAgentDto: CreateAgentDto): Promise<Agent> {
        // Check if agent already exists with this phone number
        const existingAgent = await this.agentRepository.findOne({
            where: { phone_number: createAgentDto.phone_number },
        });

        if (existingAgent) {
            throw new BadRequestException('Agent with this phone number already exists');
        }

        // Check if email is already in use
        if (createAgentDto.email) {
            const existingEmail = await this.agentRepository.findOne({
                where: { email: createAgentDto.email },
            });

            if (existingEmail) {
                throw new BadRequestException('Agent with this email already exists');
            }
        }

        const agent = this.agentRepository.create({
            ...createAgentDto,
            // Set default values based on your entity structure
            verification_status: AgentVerificationStatus.PENDING,
            status: AgentStatus.ACTIVE,
            subscription_tier: AgentSubscriptionTier.BASIC,
            rating: 0,
            total_ratings: 0,
        });

        return await this.agentRepository.save(agent);
    }

    // Find all agents with pagination and filters
    async findAll(searchDto: AgentSearchDto): Promise<PaginatedResponse<Agent>> {
        const {
            name,
            phone_number,
            email,
            status,
            verification_status,
            location,
            min_rating,
            page = 1,
            limit = 10,
        } = searchDto;

        const queryBuilder = this.agentRepository.createQueryBuilder('agent');

        // Apply filters
        if (name) {
            queryBuilder.andWhere('LOWER(agent.name) LIKE LOWER(:name)', { name: `%${name}%` });
        }

        if (phone_number) {
            queryBuilder.andWhere('agent.phone_number = :phone_number', { phone_number });
        }

        if (email) {
            queryBuilder.andWhere('LOWER(agent.email) LIKE LOWER(:email)', { email: `%${email}%` });
        }

        if (status) {
            queryBuilder.andWhere('agent.status = :status', { status });
        }

        if (verification_status) {
            queryBuilder.andWhere('agent.verification_status = :verification_status', { verification_status });
        }

        if (location) {
            queryBuilder.andWhere('LOWER(agent.location) LIKE LOWER(:location)', {
                location: `%${location}%`,
            });
        }

        if (min_rating !== undefined) {
            queryBuilder.andWhere('agent.rating >= :min_rating', { min_rating });
        }

        // Add pagination
        const offset = (page - 1) * limit;
        queryBuilder.skip(offset).take(limit);

        // Add ordering
        queryBuilder.orderBy('agent.rating', 'DESC').addOrderBy('agent.created_at', 'DESC');

        // Execute query
        const [data, total] = await queryBuilder.getManyAndCount();

        return {
            data,
            total,
            page,
            limit,
            total_pages: Math.ceil(total / limit),
        };
    }

    // Find agent by phone number
    async findByPhone(phoneNumber: string): Promise<Agent | null> {
        return await this.agentRepository.findOne({
            where: { phone_number: phoneNumber },
        });
    }

    // Find agent by email
    async findByEmail(email: string): Promise<Agent | null> {
        return await this.agentRepository.findOne({
            where: { email },
        });
    }

    // Update agent
    async update(id: string, updateAgentDto: UpdateAgentDto): Promise<Agent> {
        const agent = await this.findById(id);

        // Check if new phone number conflicts
        if (updateAgentDto.phone_number && updateAgentDto.phone_number !== agent.phone_number) {
            const existingAgent = await this.findByPhone(updateAgentDto.phone_number);
            if (existingAgent && existingAgent.id !== id) {
                throw new BadRequestException('Agent with this phone number already exists');
            }
        }

        // Check if new email conflicts
        if (updateAgentDto.email && updateAgentDto.email !== agent.email) {
            const existingEmail = await this.findByEmail(updateAgentDto.email);
            if (existingEmail && existingEmail.id !== id) {
                throw new BadRequestException('Agent with this email already exists');
            }
        }

        await this.agentRepository.update(id, updateAgentDto);
        return await this.findById(id);
    }

    // Update agent subscription
    async updateSubscription(id: string, updateSubscriptionDto: UpdateSubscriptionDto): Promise<Agent> {
        const agent = await this.findById(id);

        if (agent.status !== AgentStatus.ACTIVE) {
            throw new ForbiddenException('Only active agents can update subscription');
        }

        const updateData: Partial<Agent> = {};

        // Check common field names in your DTO
        if ('subscription_tier' in updateSubscriptionDto) {
            updateData.subscription_tier = (updateSubscriptionDto as any).subscription_tier;
        } else if ('tier' in updateSubscriptionDto) {
            updateData.subscription_tier = (updateSubscriptionDto as any).tier;
        } else if ('subscription' in updateSubscriptionDto) {
            updateData.subscription_tier = (updateSubscriptionDto as any).subscription;
        } else {
            updateData.subscription_tier = AgentSubscriptionTier.PREMIUM;
        }

        await this.agentRepository.update(id, updateData);
        return await this.findById(id);
    }

    // Rate agent
    async rateAgent(id: string, rateAgentDto: RateAgentDto): Promise<Agent> {
        const agent = await this.findById(id);

        // Calculate new rating
        const totalRatings = agent.total_ratings + 1;
        const newRating = ((agent.rating * agent.total_ratings) + rateAgentDto.rating) / totalRatings;

        await this.agentRepository.update(id, {
            rating: Math.round(newRating * 100) / 100,
            total_ratings: totalRatings,
        });

        return await this.findById(id);
    }

    // Get agent properties (placeholder)
    async getAgentProperties(agentId: string, filterDto: AgentPropertiesFilterDto): Promise<any> {
        const agent = await this.findById(agentId);
        
        // Return mock data for now
        return {
            data: [],
            total: 0,
            page: 1,
            limit: 10,
            total_pages: 0,
        };
    }

    // Get agent analytics (placeholder)
    async getAgentAnalytics(id: string): Promise<any> {
        const agent = await this.findById(id);

        return {
            total_properties: 0,
            active_properties: 0,
            rented_properties: 0,
            total_leads: agent.total_leads || 0,
            leads_this_month: 0,
            conversion_rate: agent.conversion_rate || 0,
            average_property_price: 0,
            most_popular_property_type: 'None',
            recent_activity: [],
        };
    }

    // Get agent leads (placeholder)
    async getAgentLeads(agentId: string): Promise<any> {
        const agent = await this.findById(agentId);

        return {
            potential_leads: [],
            hot_leads: [],
            contacted_leads: [],
            converted_leads: [],
        };
    }

    // Get agent dashboard summary
    async getDashboardSummary(id: string): Promise<any> {
        const agent = await this.findById(id);
        const analytics = await this.getAgentAnalytics(id);
        const leads = await this.getAgentLeads(id);

        const propertiesLimit = agent.subscription_tier === AgentSubscriptionTier.BASIC ? 5 : 100;

        return {
            agent_info: agent,
            quick_stats: {
                total_properties: analytics.total_properties,
                active_listings: analytics.active_properties,
                pending_verification: 0,
                total_leads: analytics.total_leads,
                this_month_leads: analytics.leads_this_month,
                rating: agent.rating,
            },
            subscription_info: {
                current_plan: agent.subscription_tier,
                properties_limit: propertiesLimit,
                properties_used: analytics.total_properties,
                expires_at: agent.subscription_expires_at,
            },
            recent_properties: [],
            recent_leads: [],
        };
    }

    // Get agent statistics
    async getAgentStatistics(): Promise<any> {
        const [
            totalAgents,
            activeAgents,
            pendingAgents,
            verifiedAgents,
            rejectedAgents,
            basicSubscription,
            premiumSubscription,
        ] = await Promise.all([
            this.agentRepository.count(),
            this.agentRepository.count({ where: { status: AgentStatus.ACTIVE } }),
            this.agentRepository.count({ where: { verification_status: AgentVerificationStatus.PENDING } }),
            this.agentRepository.count({ where: { verification_status: AgentVerificationStatus.VERIFIED } }),
            this.agentRepository.count({ where: { verification_status: AgentVerificationStatus.REJECTED } }),
            this.agentRepository.count({ where: { subscription_tier: AgentSubscriptionTier.BASIC } }),
            this.agentRepository.count({ where: { subscription_tier: AgentSubscriptionTier.PREMIUM } }),
        ]);

        return {
            total_agents: totalAgents,
            active_agents: activeAgents,
            pending_agents: pendingAgents,
            verified_agents: verifiedAgents,
            rejected_agents: rejectedAgents,
            suspended_agents: 0,
            basic_subscription: basicSubscription,
            premium_subscription: premiumSubscription,
            average_rating: 0,
            total_properties_managed: 0,
            agents_by_location: {},
        };
    }

    // Find top performing agents
    async findTopPerformingAgents(limit: number = 10): Promise<Agent[]> {
        return await this.agentRepository.find({
            where: { 
                status: AgentStatus.ACTIVE,
                verification_status: AgentVerificationStatus.VERIFIED 
            },
            order: {
                rating: 'DESC',
                created_at: 'DESC',
            },
            take: limit,
        });
    }

    // Suspend agent
    async suspend(id: string, reason?: string): Promise<Agent> {
        const agent = await this.findById(id);

        if (agent.status === AgentStatus.INACTIVE) {
            throw new BadRequestException('Agent is already inactive');
        }

        await this.agentRepository.update(id, {
            status: AgentStatus.INACTIVE,
            verification_status: AgentVerificationStatus.SUSPENDED,
        });

        console.log(`🚫 Agent ${agent.email} suspended. Reason: ${reason || 'No reason provided'}`);
        return await this.findById(id);
    }

    // Reactivate suspended agent
    async reactivate(id: string): Promise<Agent> {
        const agent = await this.findById(id);

        if (agent.status !== AgentStatus.INACTIVE) {
            throw new BadRequestException('Agent is not inactive');
        }

        await this.agentRepository.update(id, {
            status: AgentStatus.ACTIVE,
            verification_status: AgentVerificationStatus.VERIFIED,
        });

        console.log(`✅ Agent ${agent.email} reactivated`);
        return await this.findById(id);
    }

    // Delete agent
    async delete(id: string): Promise<void> {
        const agent = await this.findById(id);
        await this.agentRepository.delete(id);
        console.log(`🗑️ Agent ${agent.email} deleted`);
    }

    // Find agents needing attention
    async findAgentsNeedingAttention(): Promise<any> {
        const [lowRatedAgents, inactiveAgents, agentsWithoutProperties] = await Promise.all([
            this.agentRepository.find({
                where: { 
                    status: AgentStatus.ACTIVE,
                    verification_status: AgentVerificationStatus.VERIFIED 
                },
                order: { rating: 'ASC' },
                take: 20,
            }).then(agents => agents.filter(agent => agent.rating < 3.0 && agent.total_ratings > 5)),

            this.agentRepository.find({
                where: { status: AgentStatus.INACTIVE },
                order: { updated_at: 'ASC' },
                take: 20,
            }),

            this.agentRepository.find({
                where: {
                    status: AgentStatus.ACTIVE,
                    verification_status: AgentVerificationStatus.VERIFIED,
                },
                order: { created_at: 'ASC' },
            }),
        ]);

        return {
            low_rated_agents: lowRatedAgents,
            inactive_agents: inactiveAgents,
            agents_without_properties: agentsWithoutProperties,
            expired_subscriptions: [],
        };
    }

    // Send notification to agent
    async sendNotification(agentId: string, message: string, type: 'sms' | 'email' | 'whatsapp'): Promise<void> {
        const agent = await this.findById(agentId);
        console.log(`📨 Sending ${type} notification to agent ${agent.name} (${agent.phone_number}): ${message}`);
    }

    // Bulk update agents
    async bulkUpdate(agentIds: string[], updateData: Partial<Agent>): Promise<{ updated: number; failed: string[] }> {
        const failed: string[] = [];
        let updated = 0;

        for (const agentId of agentIds) {
            try {
                await this.update(agentId, updateData);
                updated++;
            } catch (error) {
                failed.push(agentId);
            }
        }

        return { updated, failed };
    }

    // Export agents data
    async exportAgentsData(): Promise<any[]> {
        const agents = await this.agentRepository.find({
            order: { created_at: 'DESC' },
        });

        return agents.map(agent => ({
            id: agent.id,
            name: agent.name,
            phone_number: agent.phone_number,
            email: agent.email,
            location: agent.location,
            status: agent.status,
            subscription_tier: agent.subscription_tier,
            rating: agent.rating,
            total_ratings: agent.total_ratings,
            verification_status: agent.verification_status,
            created_at: agent.created_at,
            updated_at: agent.updated_at,
        }));
    }

    // Check subscription limits
    async checkSubscriptionLimits(agentId: string): Promise<any> {
        const agent = await this.findById(agentId);

        const propertiesLimit = agent.subscription_tier === AgentSubscriptionTier.BASIC ? 5 : 100;
        const propertiesUsed = 0; // This would be calculated from actual properties
        const canAddProperty = propertiesUsed < propertiesLimit;

        return {
            can_add_property: canAddProperty,
            properties_used: propertiesUsed,
            properties_limit: propertiesLimit,
            subscription_type: agent.subscription_tier,
            expires_at: agent.subscription_expires_at,
        };
    }

    // Get agent performance over time
    async getAgentPerformance(agentId: string, days: number = 30): Promise<any> {
        const agent = await this.findById(agentId);

        // Generate sample data for the last 30 days
        const performanceData = {
            properties_added: [] as { date: string; count: number }[],
            leads_generated: [] as { date: string; count: number }[],
            rating_changes: [] as { date: string; rating: number }[],
            revenue_potential: [] as { date: string; amount: number }[],
        };

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateString = date.toISOString().split('T')[0];

            performanceData.properties_added.push({ date: dateString, count: Math.floor(Math.random() * 3) });
            performanceData.leads_generated.push({ date: dateString, count: Math.floor(Math.random() * 5) });
            performanceData.rating_changes.push({ date: dateString, rating: agent.rating + (Math.random() - 0.5) * 0.2 });
            performanceData.revenue_potential.push({ date: dateString, amount: Math.floor(Math.random() * 50000) });
        }

        return performanceData;
    }
}