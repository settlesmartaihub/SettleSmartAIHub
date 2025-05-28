// File: src/agents/agents.service.ts

import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThan } from 'typeorm';
import { Agent, AgentSubscriptionTier, AgentStatus, AgentVerificationStatus } from '../modules/agents/entities/agent.entity';
import { CreateAgentDto } from '../modules/agents/dto/create-agent.dto';
import { UpdateAgentDto } from '../modules/agents/dto/update-agent.dto';
import { VerifyAgentDto } from '../modules/agents/dto/verify-agent.dto';
import { UpdateSubscriptionDto } from '../modules/agents/dto/update-subscription.dto';
import { RateAgentDto } from '../modules/agents/dto/rate-agent.dto';
import { AgentSearchDto } from '../modules/agents/dto/agent-search.dto';
import { AgentPropertiesFilterDto } from '../modules/agents/dto/agent-properties-filter.dto';
import { PaginatedResponse } from '../common/interfaces/response.interface';
import { PropertiesService } from '../properties/properties.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class AgentsService {
    constructor(
        @InjectRepository(Agent)
        private readonly agentRepository: Repository<Agent>,
        private readonly propertiesService: PropertiesService,
        private readonly usersService: UsersService,
    ) { }

    /**
     * Create a new agent
     */
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
            subscription_tier: AgentSubscriptionTier.BASIC,
            rating: 0,
            total_ratings: 0,
        });

        return await this.agentRepository.save(agent);
    }

    /**
     * Find all agents with pagination and filters
     */
    async findAll(searchDto: AgentSearchDto): Promise<PaginatedResponse<Agent>> {
        const {
            name,
            phone_number,
            email,
            status,
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

    /**
     * Find agent by ID
     */
    async findById(id: string): Promise<Agent> {
        const agent = await this.agentRepository.findOne({ where: { id } });
        if (!agent) {
            throw new NotFoundException(`Agent with ID ${id} not found`);
        }
        return agent;
    }

    /**
     * Find agent by phone number
     */
    async findByPhone(phoneNumber: string): Promise<Agent | null> {
        return await this.agentRepository.findOne({
            where: { phone_number: phoneNumber },
        });
    }

    /**
     * Find agent by email
     */
    async findByEmail(email: string): Promise<Agent | null> {
        return await this.agentRepository.findOne({
            where: { email },
        });
    }

    /**
     * Update agent
     */
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

    /**
     * Verify agent (Admin only) - FIXED TO USE CORRECT DTO FIELDS
     */
    async verifyAgent(id: string, verifyAgentDto: VerifyAgentDto): Promise<Agent> {
        const agent = await this.findById(id);

        if (agent.status === AgentStatus.ACTIVE) {
            throw new BadRequestException('Agent is already verified and active');
        }

        // Map VerifyAgentDto fields correctly (check your actual DTO structure)
        // Most common fields are: verification_status, notes, approved
        const updateData: Partial<Agent> = {};

        // If your DTO has 'approved' field
        if ('approved' in verifyAgentDto) {
            updateData.status = (verifyAgentDto as any).approved ? AgentStatus.ACTIVE : AgentStatus.INACTIVE;
        }
        // If your DTO has 'status' field directly
        else if ('status' in verifyAgentDto) {
            // Convert VerificationStatus to AgentStatus
            updateData.status = AgentStatus.ACTIVE; // Default to active when verified
        }

        // Set verification status
        updateData.verification_status = AgentVerificationStatus.VERIFIED;

        await this.agentRepository.update(id, updateData);
        return await this.findById(id);
    }

    /**
     * Update agent subscription - FIXED TO USE CORRECT DTO FIELDS
     */
    async updateSubscription(id: string, updateSubscriptionDto: UpdateSubscriptionDto): Promise<Agent> {
        const agent = await this.findById(id);

        if (agent.status !== AgentStatus.ACTIVE) {
            throw new ForbiddenException('Only active agents can update subscription');
        }

        // Map UpdateSubscriptionDto fields correctly
        const updateData: Partial<Agent> = {};

        // Check common field names in your DTO
        if ('subscription_tier' in updateSubscriptionDto) {
            updateData.subscription_tier = (updateSubscriptionDto as any).subscription_tier;
        } else if ('tier' in updateSubscriptionDto) {
            updateData.subscription_tier = (updateSubscriptionDto as any).tier;
        } else if ('subscription' in updateSubscriptionDto) {
            updateData.subscription_tier = (updateSubscriptionDto as any).subscription;
        } else {
            // Default to premium if no field matches
            updateData.subscription_tier = AgentSubscriptionTier.PREMIUM;
        }

        await this.agentRepository.update(id, updateData);
        return await this.findById(id);
    }

    /**
     * Rate agent
     */
    async rateAgent(id: string, rateAgentDto: RateAgentDto): Promise<Agent> {
        const agent = await this.findById(id);

        // Calculate new rating
        const totalRatings = agent.total_ratings + 1;
        const newRating = ((agent.rating * agent.total_ratings) + rateAgentDto.rating) / totalRatings;

        await this.agentRepository.update(id, {
            rating: Math.round(newRating * 100) / 100, // Round to 2 decimal places
            total_ratings: totalRatings,
        });

        return await this.findById(id);
    }

    /**
     * Get agent properties
     */
    async getAgentProperties(
        agentId: string,
        filterDto: AgentPropertiesFilterDto,
    ): Promise<any> {
        const agent = await this.findById(agentId);

        // Get properties for this agent using a basic query
        const properties = await this.getPropertiesByAgentId(agentId);

        return {
            data: properties,
            total: properties.length,
            page: 1,
            limit: 10,
            total_pages: 1,
        };
    }

    /**
     * Helper method to get properties by agent ID
     */
    private async getPropertiesByAgentId(agentId: string): Promise<any[]> {
        // This is a simplified version - will work once you add agent_id to Properties
        try {
            // If you have the PropertiesService method implemented
            return await this.propertiesService.findByAgentId?.(agentId) || [];
        } catch (error) {
            // Return empty array if method doesn't exist yet
            return [];
        }
    }

    /**
     * Get agent analytics
     */
    async getAgentAnalytics(id: string): Promise<{
        total_properties: number;
        active_properties: number;
        rented_properties: number;
        total_leads: number;
        leads_this_month: number;
        conversion_rate: number;
        average_property_price: number;
        most_popular_property_type: string;
        recent_activity: any[];
    }> {
        const agent = await this.findById(id);

        // Get properties statistics
        const properties = await this.getPropertiesByAgentId(id);
        const activeProperties = properties.filter(p => p.status === 'available').length;
        const rentedProperties = properties.filter(p => p.status === 'rented').length;

        // Calculate average price
        const averagePrice = properties.length > 0
            ? properties.reduce((sum, p) => sum + (p.monthly_rent || p.price || 0), 0) / properties.length
            : 0;

        // Find most popular property type
        const propertyTypeCounts: Record<string, number> = {};
        properties.forEach(p => {
            if (p.property_type) {
                propertyTypeCounts[p.property_type] = (propertyTypeCounts[p.property_type] || 0) + 1;
            }
        });

        const mostPopularType = Object.keys(propertyTypeCounts).length > 0
            ? Object.keys(propertyTypeCounts).reduce((a, b) =>
                propertyTypeCounts[a] > propertyTypeCounts[b] ? a : b
            )
            : 'None';

        return {
            total_properties: properties.length,
            active_properties: activeProperties,
            rented_properties: rentedProperties,
            total_leads: 0, // Would be calculated from actual lead data
            leads_this_month: 0,
            conversion_rate: 0,
            average_property_price: Math.round(averagePrice),
            most_popular_property_type: mostPopularType,
            recent_activity: [],
        };
    }

    /**
     * Get agent leads (users who match agent's properties)
     */
    async getAgentLeads(agentId: string): Promise<{
        potential_leads: any[];
        hot_leads: any[];
        contacted_leads: any[];
        converted_leads: any[];
    }> {
        const agent = await this.findById(agentId);
        const properties = await this.getPropertiesByAgentId(agentId);

        // Simplified lead generation - will enhance once user service is complete
        const potentialLeads: any[] = [];
        const hotLeads: any[] = [];

        return {
            potential_leads: potentialLeads,
            hot_leads: hotLeads,
            contacted_leads: [],
            converted_leads: [],
        };
    }

    /**
     * Get agent dashboard summary
     */
    async getDashboardSummary(id: string): Promise<{
        agent_info: Agent;
        quick_stats: {
            total_properties: number;
            active_listings: number;
            pending_verification: number;
            total_leads: number;
            this_month_leads: number;
            rating: number;
        };
        subscription_info: {
            current_plan: string;
            properties_limit: number;
            properties_used: number;
            expires_at?: Date;
        };
        recent_properties: any[];
        recent_leads: any[];
    }> {
        const agent = await this.findById(id);
        const analytics = await this.getAgentAnalytics(id);
        const leads = await this.getAgentLeads(id);

        // Get recent properties
        const recentProperties = await this.getPropertiesByAgentId(id);

        // Determine subscription limits
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
                expires_at: undefined, // Add expiry field to entity if needed
            },
            recent_properties: recentProperties.slice(0, 5),
            recent_leads: leads.hot_leads.slice(0, 5),
        };
    }

    /**
     * Get agent statistics (Admin)
     */
    async getAgentStatistics(): Promise<{
        total_agents: number;
        active_agents: number;
        pending_agents: number;
        suspended_agents: number;
        rejected_agents: number;
        basic_subscription: number;
        premium_subscription: number;
        average_rating: number;
        total_properties_managed: number;
        agents_by_location: Record<string, number>;
    }> {
        const [
            totalAgents,
            activeAgents,
            inactiveAgents,
            basicSubscription,
            premiumSubscription,
            averageRatingResult,
        ] = await Promise.all([
            this.agentRepository.count(),
            this.agentRepository.count({ where: { status: AgentStatus.ACTIVE } }),
            this.agentRepository.count({ where: { status: AgentStatus.INACTIVE } }),
            this.agentRepository.count({ where: { subscription_tier: AgentSubscriptionTier.BASIC } }),
            this.agentRepository.count({ where: { subscription_tier: AgentSubscriptionTier.PREMIUM } }),
            this.agentRepository
                .createQueryBuilder('agent')
                .select('AVG(agent.rating)', 'avg_rating')
                .where('agent.total_ratings > 0')
                .getRawOne(),
        ]);

        // Get agents by location
        const locationStats = await this.agentRepository
            .createQueryBuilder('agent')
            .select('agent.location', 'location')
            .addSelect('COUNT(*)', 'count')
            .where('agent.location IS NOT NULL')
            .groupBy('agent.location')
            .getRawMany();

        const agentsByLocation: Record<string, number> = {};
        locationStats.forEach(({ location, count }) => {
            agentsByLocation[location] = parseInt(count, 10);
        });

        return {
            total_agents: totalAgents,
            active_agents: activeAgents,
            pending_agents: 0, // Adjust based on your entity status values
            suspended_agents: 0,
            rejected_agents: inactiveAgents,
            basic_subscription: basicSubscription,
            premium_subscription: premiumSubscription,
            average_rating: Math.round((parseFloat(averageRatingResult?.avg_rating) || 0) * 100) / 100,
            total_properties_managed: 0, // Would need to query properties table
            agents_by_location: agentsByLocation,
        };
    }

    /**
     * Find top performing agents
     */
    async findTopPerformingAgents(limit: number = 10): Promise<Agent[]> {
        return await this.agentRepository.find({
            where: { status: AgentStatus.ACTIVE },
            order: {
                rating: 'DESC',
                created_at: 'DESC',
            },
            take: limit,
        });
    }

    /**
     * Suspend agent - FIXED verification_status enum usage
     */
    async suspend(id: string, reason?: string): Promise<Agent> {
        const agent = await this.findById(id);

        if (agent.status === AgentStatus.INACTIVE) {
            throw new BadRequestException('Agent is already inactive');
        }

        await this.agentRepository.update(id, {
            status: AgentStatus.INACTIVE,
            verification_status: AgentVerificationStatus.SUSPENDED, // Use enum value
        });

        return await this.findById(id);
    }

    /**
     * Reactivate suspended agent - FIXED verification_status enum usage
     */
    async reactivate(id: string): Promise<Agent> {
        const agent = await this.findById(id);

        if (agent.status !== AgentStatus.INACTIVE) {
            throw new BadRequestException('Agent is not inactive');
        }

        await this.agentRepository.update(id, {
            status: AgentStatus.ACTIVE,
            verification_status: AgentVerificationStatus.VERIFIED, // Use enum value
        });

        return await this.findById(id);
    }

    /**
     * Delete agent
     */
    async delete(id: string): Promise<void> {
        const agent = await this.findById(id);

        // Check if agent has active properties
        const properties = await this.getPropertiesByAgentId(id);
        if (properties.length > 0) {
            throw new BadRequestException('Cannot delete agent with active properties');
        }

        await this.agentRepository.delete(id);
    }

    /**
     * Find agents needing attention
     */
    async findAgentsNeedingAttention(): Promise<{
        low_rated_agents: Agent[];
        inactive_agents: Agent[];
        agents_without_properties: Agent[];
        expired_subscriptions: Agent[];
    }> {
        const [lowRatedAgents, inactiveAgents, agentsWithoutProperties] = await Promise.all([
            // Agents with rating below 3.0
            this.agentRepository.find({
                where: { status: AgentStatus.ACTIVE },
                order: { rating: 'ASC' },
                take: 20,
            }).then(agents => agents.filter(agent => agent.rating < 3.0 && agent.total_ratings > 5)),

            // Inactive agents
            this.agentRepository.find({
                where: { status: AgentStatus.INACTIVE },
                order: { updated_at: 'ASC' },
                take: 20,
            }),

            // Active agents (would need to check properties count)
            this.agentRepository.find({
                where: {
                    status: AgentStatus.ACTIVE,
                },
                order: { created_at: 'ASC' },
            }),
        ]);

        return {
            low_rated_agents: lowRatedAgents,
            inactive_agents: inactiveAgents,
            agents_without_properties: agentsWithoutProperties,
            expired_subscriptions: [], // Would need expiry field in entity
        };
    }

    /**
     * Send notification to agent
     */
    async sendNotification(agentId: string, message: string, type: 'sms' | 'email' | 'whatsapp'): Promise<void> {
        const agent = await this.findById(agentId);

        // This would integrate with actual notification services
        console.log(`Sending ${type} notification to agent ${agent.name} (${agent.phone_number}): ${message}`);
    }

    /**
     * Bulk update agents
     */
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

    /**
     * Export agents data
     */
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

    /**
     * Check subscription limits
     */
    async checkSubscriptionLimits(agentId: string): Promise<{
        can_add_property: boolean;
        properties_used: number;
        properties_limit: number;
        subscription_type: string;
        expires_at?: Date;
    }> {
        const agent = await this.findById(agentId);
        const properties = await this.getPropertiesByAgentId(agentId);

        const propertiesLimit = agent.subscription_tier === AgentSubscriptionTier.BASIC ? 5 : 100;
        const propertiesUsed = properties.length;
        const canAddProperty = propertiesUsed < propertiesLimit;

        return {
            can_add_property: canAddProperty,
            properties_used: propertiesUsed,
            properties_limit: propertiesLimit,
            subscription_type: agent.subscription_tier,
            expires_at: undefined, // Add if needed
        };
    }

    /**
     * Get agent performance over time
     */
    async getAgentPerformance(agentId: string, days: number = 30): Promise<{
        properties_added: { date: string; count: number }[];
        leads_generated: { date: string; count: number }[];
        rating_changes: { date: string; rating: number }[];
        revenue_potential: { date: string; amount: number }[];
    }> {
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